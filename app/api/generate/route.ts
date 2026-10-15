import { env } from "cloudflare:workers";
import { features, type Feature } from "@/app/feature-data";
import { ApiError, assertSameOrigin, authenticatedUser, bucket, database, errorResponse, json, rateLimit, readJson } from "@/lib/studio-api";
import { generateWithGemini, ProviderError } from "@/lib/studio-provider";
import { resolveProvider } from "@/lib/studio-config";
import { generateWithRouter } from "@/lib/studio-router";
import { persistGeneration } from "@/lib/studio-storage";
import { validateGenerate, ValidationError } from "@/lib/studio-validation";

export const dynamic = "force-dynamic";

function findFeature(id: string, items: Feature[] = features): Feature | undefined {
  for (const feature of items) {
    if (feature.id === id) return feature;
    const variant = feature.variants && findFeature(id,feature.variants);
    if (variant) return variant;
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await authenticatedUser();
    const raw = await readJson(request, 17 * 1024 * 1024);
    const feature = typeof raw.featureId === "string" ? findFeature(raw.featureId) : undefined;
    if (!feature) throw new ApiError(400, "unknown_feature", "Fitur tidak ditemukan. Pilih fitur dari menu studio.");
    if (feature.kind === "video") throw new ApiError(503, "video_provider_not_configured", "Generator video belum dihubungkan ke provider. Gunakan tautan Google Opal pada halaman fitur.");
    if (feature.kind === "local" || feature.kind === "store") throw new ApiError(400, "local_tool", "Fitur ini dijalankan langsung di aplikasi.");
    const input = validateGenerate(raw);
    const requiredImages = feature.fields.filter((field) => field.type === "file" && field.required);
    if (requiredImages.length && input.images.length < requiredImages.length) throw new ApiError(400, "reference_images_required", "Unggah semua gambar referensi yang diwajibkan pada fitur ini.");
    if (input.images.every((image) => image.fieldId) && requiredImages.some((field) => !input.images.some((image) => image.fieldId === field.id))) throw new ApiError(400, "reference_images_required", "Unggah gambar pada setiap kolom referensi yang diwajibkan.");
    const expectedKind = feature.kind === "chat" ? "text" : feature.kind;
    const planningRequest = input.kind === "text" && (feature.capability === "storyboard" || feature.capability === "image-sequence");
    if (input.kind !== expectedKind && !planningRequest) throw new ApiError(400, "invalid_output_kind", "Jenis hasil tidak sesuai dengan fitur yang dipilih.");

    // Resolve source control IDs through their semantic roles while retaining every original choice.
    const options = { ...input.options };
    const labelledOptions: string[] = [];
    const deliveryOptions: string[] = [];
    for (const field of feature.fields) {
      const value = options[field.id];
      if (value === undefined || field.type === "file") continue;
      labelledOptions.push(`${field.label}: ${String(value)}`);
      if (field.role !== "prompt" && field.role !== "voice" && field.role !== "count") deliveryOptions.push(`${field.label}: ${String(value)}`);
      if (field.role === "ratio" || field.role === "aspectRatio") options.aspectRatio = value;
      if (field.role === "resolution") options.resolution = value;
      if (field.role === "voice") options.voice = value;
      if (field.role === "style") options.style = value;
      if (field.role === "language") options.language = value;
      if (field.role === "count") options.count = value;
    }
    if (input.kind === "audio") {
      const transcriptField = feature.fields.find((field) => field.role === "prompt");
      const transcript = transcriptField && options[transcriptField.id];
      if (typeof transcript === "string" && transcript.trim()) input.prompt = transcript.trim();
      else if (transcriptField) throw new ApiError(400,"transcript_required","Masukkan naskah untuk voice over.");
      options.style = `${typeof options.style === "string" && options.style.trim() ? options.style : "Clear, warm, natural narration."} Requested delivery: ${deliveryOptions.join("; ")}`;
    }
    input.options = options;

    const selectedProvider = resolveProvider(input,env);
    // Verify storage before sending a request that can incur provider charges.
    database();
    if (input.kind !== "text") bucket();
    await rateLimit(user.userId, "generate", 12);
    const referenceLabels = input.images.map((image,index) => {
      const field = image.fieldId && feature.fields.find((item) => item.id === image.fieldId && item.type === "file");
      return `Reference image ${index + 1}: ${field ? field.label : "uploaded image"}`;
    });
    const intent = `${feature.promptIntent}\nFeature: ${feature.label}\n${labelledOptions.join("\n")}\n${referenceLabels.join("\n")}`;
    const outputs = selectedProvider.provider === "gemini"
      ? await generateWithGemini(input,intent,selectedProvider.settings)
      : await generateWithRouter(input,intent,selectedProvider.settings);
    return json(await persistGeneration(user.userId,input,outputs));
  } catch (error) {
    if (error instanceof ValidationError) return errorResponse(new ApiError(400,"invalid_input",error.message));
    if (error instanceof ProviderError) return errorResponse(new ApiError(error.status,error.code,error.message));
    return errorResponse(error);
  }
}
