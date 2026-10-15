import { env } from "cloudflare:workers";
import { features, type Feature } from "@/app/feature-data";
import { applicableFields, applicableValues } from "@/app/feature-controls";
import { ApiError, assertSameOrigin, authenticatedUser, bucket, database, errorResponse, json, rateLimit, readJson } from "@/lib/studio-api";
import { assertGeminiGeneration, generateWithGemini, ProviderError } from "@/lib/studio-provider";
import { resolveProvider } from "@/lib/studio-config";
import { assertRouterGeneration, generateWithRouter } from "@/lib/studio-router";
import { persistGeneration } from "@/lib/studio-storage";
import { validateGenerate, ValidationError } from "@/lib/studio-validation";
import { assertObjectMask } from "@/lib/studio-mask";
import { claimGenerationRequest, completeGenerationRequest, failGenerationRequest, generationFingerprint, generationRequestId, generationRequestState, type GenerationFailure, type GenerationResponse } from "@/lib/studio-generation-requests";

export const dynamic = "force-dynamic";

// Shared by both image providers, including variants and individual batch slots.
const imagePhotographyDirection = `Visual quality direction for image generation:
For photographic subjects and photo-based elements, default to hyperrealistic, believable real-world photography with a natural camera-captured appearance. Use physically plausible lighting, consistent shadows and reflections, correct perspective and scale, and natural depth of field. Render lifelike skin with subtle pores and fine hair where people are present, realistic fabric weave, food texture and material surfaces, with restrained color grading and appropriate natural imperfections. Preserve the supplied person's identity and the product's exact shape, colors, packaging, logos and readable label details; do not invent or alter branding or product features.
Avoid an artificial AI-rendered look: waxy or plastic skin, excessive smoothing or beauty retouching, oversaturated HDR, crunchy oversharpening, cutout halos, melted details, warped geometry, duplicated objects, malformed hands, extra fingers and inconsistent anatomy. Favor believable detail over exaggerated perfection.
When the task, user instructions, selected style or reference explicitly calls for illustration, cartoon, anime, sketch, 3D art, a logo or graphic design, preserve that requested medium, layout and typography; apply photographic realism only to photographic elements. For image edits, preserve the reference's visual style and unchanged areas while making only the requested changes.`;

function findFeature(id: string, items: Feature[] = features): Feature | undefined {
  for (const feature of items) {
    if (feature.id === id) return feature;
    const variant = feature.variants && findFeature(id,feature.variants);
    if (variant) return variant;
  }
}

export async function POST(request: Request) {
  let requestId: string | undefined;
  try {
    assertSameOrigin(request);
    const user = await authenticatedUser();
    const raw = await readJson(request, 17 * 1024 * 1024);
    requestId = generationRequestId(raw.requestId);
    const feature = typeof raw.featureId === "string" ? findFeature(raw.featureId) : undefined;
    if (!feature) throw new ApiError(400, "unknown_feature", "Fitur tidak ditemukan. Pilih fitur dari menu studio.");
    if (feature.kind === "video") throw new ApiError(503, "video_provider_not_configured", "Generator video belum dihubungkan ke provider. Gunakan tautan Google Opal pada halaman fitur.");
    if (feature.kind === "local" || feature.kind === "store") throw new ApiError(400, "local_tool", "Fitur ini dijalankan langsung di aplikasi.");
    const input = validateGenerate(raw);
    input.options = applicableValues(feature,input.options);
    const fields = applicableFields(feature,input.options);
    const activeFileIds = new Set(fields.filter((field) => field.type === "file").map((field) => field.id));
    const declaredFileIds = new Set(feature.fields.filter((field) => field.type === "file").map((field) => field.id));
    input.images = input.images.filter((image) => !image.fieldId || !declaredFileIds.has(image.fieldId) || activeFileIds.has(image.fieldId));
    const photoImages = input.images.filter((image) => image.role !== "mask");
    const requiredImages = fields.filter((field) => field.type === "file" && field.required);
    if (requiredImages.length && photoImages.length < requiredImages.length) throw new ApiError(400, "reference_images_required", "Unggah semua gambar referensi yang diwajibkan pada fitur ini.");
    if (photoImages.every((image) => image.fieldId) && requiredImages.some((field) => !photoImages.some((image) => image.fieldId === field.id))) throw new ApiError(400, "reference_images_required", "Unggah gambar pada setiap kolom referensi yang diwajibkan.");
    assertObjectMask(input.featureId,input.options,input.images);
    const expectedKind = feature.kind === "chat" ? "text" : feature.kind;
    const planningRequest = input.kind === "text" && (feature.capability === "storyboard" || feature.capability === "image-sequence");
    if (input.kind !== expectedKind && !planningRequest) throw new ApiError(400, "invalid_output_kind", "Jenis hasil tidak sesuai dengan fitur yang dipilih.");

    // Resolve source control IDs through their semantic roles while retaining every original choice.
    const options = { ...input.options };
    if (feature.fields.some((field) => field.role === "ratio" || field.role === "aspectRatio")) {
      delete options.aspectRatio;
      delete options.aspect_ratio;
      delete options.ratio;
    }
    const labelledOptions: string[] = [];
    const deliveryOptions: string[] = [];
    for (const field of fields) {
      const value = options[field.id];
      if (value === undefined || field.type === "file") continue;
      labelledOptions.push(`${field.label}: ${String(value)}`);
      if (field.role !== "prompt" && field.role !== "voice" && field.role !== "count") deliveryOptions.push(`${field.label}: ${String(value)}`);
      if ((field.role === "ratio" || field.role === "aspectRatio") && typeof value === "string" && (/^[1-9][0-9]?:[1-9][0-9]?$/.test(value) || value === "original")) options.aspectRatio = value;
      if (field.role === "resolution") options.resolution = value;
      if (field.role === "voice") options.voice = value;
      if (field.role === "style") options.style = value;
      if (field.role === "language") options.language = value;
      if (field.role === "count") options.count = value;
    }
    if (input.kind === "audio") {
      const transcriptField = fields.find((field) => field.role === "prompt");
      const transcript = transcriptField && options[transcriptField.id];
      if (typeof transcript === "string" && transcript.trim()) input.prompt = transcript.trim();
      else if (transcriptField) throw new ApiError(400,"transcript_required","Masukkan naskah untuk voice over.");
      options.style = `${typeof options.style === "string" && options.style.trim() ? options.style : "Clear, warm, natural narration."} Requested delivery: ${deliveryOptions.join("; ")}`;
    }
    input.options = options;

    const selectedProvider = resolveProvider(input,env);
    if (selectedProvider.provider === "gemini") assertGeminiGeneration(input,selectedProvider.settings);
    else assertRouterGeneration(input,selectedProvider.settings);
    // Verify storage before sending a request that can incur provider charges.
    database();
    if (input.kind !== "text") bucket();
    const receipt = await claimGenerationRequest(user.userId,requestId,await generationFingerprint(input,selectedProvider));
    if (!receipt.claimed) {
      const state = await generationRequestState(receipt.row);
      if (state.status === "completed") return json(state.data);
      if (state.status === "failed") return json({ results: [], error: state.error, code: state.code, requestId, ...(state.diagnostic ? { diagnostic: state.diagnostic } : {}) },state.errorStatus);
      return json(state,202);
    }
    try { await rateLimit(user.userId, "generate", 12); }
    catch (error) {
      const failure = generationFailure(error,requestId);
      await failGenerationRequest(user.userId,requestId,failure.data,failure.status);
      throw error;
    }
    const referenceLabels = input.images.map((image,index) => {
      if (image.role === "mask") return `Reference image ${index+1}: EDIT MASK, not a second subject/photo. White selects the area to remove; black marks the area to preserve. Use the mask as a visual guide, preserve the source photo outside selected areas as closely as possible, and do not render the mask itself in the result.`;
      const field = image.fieldId && fields.find((item) => item.id === image.fieldId && item.type === "file");
      return `Reference image ${index + 1}: ${field ? field.label : "uploaded image"}`;
    });
    const intent = `${feature.promptIntent}\nFeature: ${feature.label}\n${labelledOptions.join("\n")}\n${referenceLabels.join("\n")}${input.kind === "image" ? `\n${imagePhotographyDirection}` : ""}`;
    const acceptedRequestId = requestId;
    const execute = async (): Promise<{ status: number; data: GenerationResponse | GenerationFailure }> => {
      try {
        const outputs = selectedProvider.provider === "gemini"
          ? await generateWithGemini(input,intent,selectedProvider.settings)
          : await generateWithRouter(input,intent,selectedProvider.settings);
        const warnings = [...new Set([...outputs.flatMap((output) => output.warnings ?? []), ...(input.images.some((image) => image.role === "mask") ? ["Mask digunakan sebagai panduan visual AI, bukan inpainting yang presisi per piksel. Periksa kembali area di luar mask pada hasil akhir."] : [])])];
        // Persist warnings with each result so history and request recovery retain
        // the same capability/precision limits that were shown at generation time.
        const persisted = await persistGeneration(user.userId,input,outputs.map((output) => ({ ...output, ...(warnings.length ? { warnings } : {}) })),receipt.row.generation_id);
        const data: GenerationResponse = { ...persisted, ...(warnings.length ? { warnings } : {}), requestId: acceptedRequestId };
        // The generation itself is a second durable receipt. If the final ledger
        // update is interrupted, GET/replay reconstructs it without another AI call.
        await completeGenerationRequest(user.userId,acceptedRequestId,data).catch(() => undefined);
        return { status: 200, data };
      } catch (error) {
        const failure = generationFailure(error,acceptedRequestId);
        await failGenerationRequest(user.userId,acceptedRequestId,failure.data,failure.status).catch(() => undefined);
        return failure;
      }
    };
    if (request.headers.get("accept")?.toLowerCase().includes("application/x-ndjson")) return generationStream(acceptedRequestId,execute);
    const outcome = await execute();
    return json(outcome.data,outcome.status);
  } catch (error) {
    if (requestId) { const failure = generationFailure(error,requestId); return json(failure.data,failure.status); }
    if (error instanceof ValidationError) return errorResponse(new ApiError(400,"invalid_input",error.message));
    return errorResponse(error);
  }
}

function generationFailure(error: unknown, requestId: string): { status: number; data: GenerationFailure } {
  if (error instanceof ProviderError) return { status: error.status, data: { results: [], error: error.message, code: error.code, requestId, ...(error.diagnostic ? { diagnostic: error.diagnostic } : {}) } };
  if (error instanceof ValidationError) return { status: 400, data: { results: [], error: error.message, code: "invalid_input", requestId } };
  if (error instanceof ApiError) return { status: error.status, data: { results: [], error: error.message, code: error.code, requestId } };
  return { status: 500, data: { results: [], error: "Hasil belum dapat disimpan. Periksa status permintaan atau Riwayat Kreasi sebelum mencoba proses baru.", code: "server_error", requestId } };
}

function generationStream(requestId: string, execute: () => Promise<{ status: number; data: GenerationResponse | GenerationFailure }>) {
  const encoder = new TextEncoder();
  let started = false, closed = false;
  let heartbeat: ReturnType<typeof setInterval> | undefined;
  const stopHeartbeat = () => { if (heartbeat !== undefined) clearInterval(heartbeat); };
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(`${JSON.stringify({ type: "accepted", requestId })}\n`));
    },
    pull(controller) {
      if (started) return;
      started = true;
      const emit = (value: unknown) => {
        if (closed) return;
        try { controller.enqueue(encoder.encode(`${JSON.stringify(value)}\n`)); }
        catch { closed = true; stopHeartbeat(); }
      };
      heartbeat = setInterval(() => emit({ type: "heartbeat", requestId }),10_000);
      // highWaterMark zero defers provider work until the response's accepted
      // chunk is consumed, so headers and the first byte precede the AI request.
      void execute().then((outcome) => {
        if (outcome.status === 200) emit({ type: "result", data: outcome.data });
        else { const failure = outcome.data as GenerationFailure; emit({ type: "error", error: failure.error, code: failure.code, status: outcome.status, requestId, ...(failure.diagnostic ? { diagnostic: failure.diagnostic } : {}) }); }
      }).catch(() => {
        emit({ type: "error", error: "Koneksi proses terputus. Periksa status permintaan sebelum membuat proses baru.", code: "generation_status_unknown", status: 503, requestId });
      }).finally(() => {
        stopHeartbeat();
        if (!closed) { closed = true; controller.close(); }
      });
    },
    cancel() {
      // Best effort only: a disconnected HTTP Worker is not a durable background
      // job. Keep the pending receipt for recovery; never launch a replacement.
      closed = true;
      stopHeartbeat();
    },
  },{ highWaterMark: 0 });
  return new Response(stream,{ headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store, no-transform", "X-Content-Type-Options": "nosniff", "X-Request-Id": requestId, "X-Accel-Buffering": "no" } });
}
