import { decodeBase64, IMAGE_MIME_TYPES, isMatchingImage, type GenerateInput, type OutputKind } from "./studio-validation";

export const DEFAULT_MODELS = {
  imageModel: "gemini-3.1-flash-image",
  textModel: "gemini-3.8-flash",
  audioModel: "gemini-3.8-flash-tts",
};

export type ProviderSettings = typeof DEFAULT_MODELS & { apiKey: string };
export type ProviderOutput = { kind: OutputKind; text?: string; bytes?: Uint8Array; mimeType?: string; warnings?: string[] };

export type ProviderDiagnostic = {
  provider: "9router";
  stage: "catalog" | "generation";
  endpoint: "models" | "models/image" | "models/tts" | "chat/completions" | "images/generations" | "audio/speech";
  method: "GET" | "POST";
  upstreamStatus: 401 | 403;
  reason: "remote_api_key_not_accepted" | "unauthorized" | "access_denied" | "cloudflare_direct_ip_blocked" | "provider_token_revoked";
};

export class ProviderError extends Error {
  constructor(public status: number, public code: string, message: string, public diagnostic?: ProviderDiagnostic) { super(message); }
}

const API_HOST = "https://generativelanguage.googleapis.com";
const MAX_RESPONSE_BYTES = 32 * 1024 * 1024;
const MAX_ERROR_BYTES = 32 * 1024;
const MAX_OUTPUT_BYTES = 20 * 1024 * 1024;
const ASPECT_RATIOS = new Set(["1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9", "1:4", "4:1", "1:8", "8:1"]);
const VOICES = new Set(["Zephyr", "Puck", "Charon", "Kore", "Fenrir", "Leda", "Orus", "Aoede", "Callirrhoe", "Autonoe", "Enceladus", "Iapetus", "Umbriel", "Algieba", "Despina", "Erinome", "Algenib", "Rasalgethi", "Laomedeia", "Achernar", "Alnilam", "Schedar", "Gacrux", "Pulcherrima", "Achird", "Zubenelgenubi", "Vindemiatrix", "Sadachbia", "Sadaltager", "Sulafat"]);

export function isGeminiVoice(value: unknown): value is string {
  return typeof value === "string" && VOICES.has(value);
}

function validModel(value: string) {
  if (!/^gemini-[a-z0-9.-]{1,100}$/.test(value)) throw new ProviderError(503, "provider_configuration_invalid", "Konfigurasi model Gemini tidak valid.");
  return value;
}

export function outputLanguage(value: unknown) {
  if (typeof value !== "string") return "Indonesian";
  const language = value.trim();
  if (!language || language.length > 80 || /[\x00-\x1f\x7f]/.test(language)) return "Indonesian";
  const normalized = language.toLowerCase().replace(/_/g,"-");
  if (["id", "id-id", "indonesian", "indonesia", "bahasa indonesia"].includes(normalized)) return "Indonesian";
  if (["en", "en-us", "en-gb", "english", "bahasa inggris", "inggris"].includes(normalized)) return "English";
  if (["ms", "ms-my", "malay", "bahasa melayu"].includes(normalized)) return "Malay";
  return language;
}

async function geminiErrorDetails(response: Response): Promise<Record<string, unknown> | undefined> {
  // Upstream errors can contain credentials, project IDs, or submitted content.
  // Keep them server-side and return only classifications with app-owned wording.
  if (!response.body) return;
  if (Number(response.headers.get("content-length")) > MAX_ERROR_BYTES || !/^application\/(?:json|[a-z0-9.+-]+\+json)(?:\s*;|$)/i.test(response.headers.get("content-type") || "")) {
    await response.body.cancel();
    return;
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let text = "", bytes = 0;
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      bytes += part.value.byteLength;
      if (bytes > MAX_ERROR_BYTES) { await reader.cancel(); return; }
      text += decoder.decode(part.value, { stream: true });
    }
    const parsed: unknown = JSON.parse(text + decoder.decode());
    if (!parsed || typeof parsed !== "object" || !("error" in parsed)) return;
    const error = parsed.error;
    if (error && typeof error === "object" && !Array.isArray(error)) return error as Record<string, unknown>;
  } catch { /* The HTTP status remains authoritative for malformed or unreadable error bodies. */ }
  finally { reader.releaseLock(); }
}

function geminiRequestContractError(error: Record<string, unknown> | undefined): ProviderError | undefined {
  const message = typeof error?.message === "string" ? error.message : "";
  const violations = Array.isArray(error?.details) ? error.details.slice(0,64).flatMap((detail: unknown) => {
    if (!detail || typeof detail !== "object" || !("fieldViolations" in detail) || !Array.isArray(detail.fieldViolations)) return [];
    return detail.fieldViolations.slice(0,64).filter((value: unknown): value is Record<string, unknown> => Boolean(value && typeof value === "object" && !Array.isArray(value)));
  }) : [];
  const descriptions = [message,...violations.map(violation => `${typeof violation.field === "string" ? violation.field : ""} ${typeof violation.description === "string" ? violation.description : ""}`)];
  const unknownField = /\b(?:unknown name|unrecogni[sz]ed (?:field|parameter|name)|cannot find field|unknown (?:field|parameter))\b/i;
  // These are our own request keys. Never copy arbitrary field paths, rejected
  // values, descriptions, or model/project identifiers into a returned error.
  const allowedFields = ["responseFormat", "response_format", "imageConfig", "image_config", "responseModalities", "maxOutputTokens", "inlineData", "mimeType", "contents", "parts", "generationConfig"];
  for (const field of allowedFields) {
    const token = new RegExp(`(?:^|[^A-Za-z0-9_])${field}(?=$|[^A-Za-z0-9_])`);
    if ((unknownField.test(message) && token.test(message)) || violations.some(violation => typeof violation.description === "string" && unknownField.test(violation.description) && token.test(`${typeof violation.field === "string" ? violation.field : ""} ${violation.description}`))) {
      return new ProviderError(400,"provider_configuration_invalid",`Format permintaan aplikasi belum didukung Gemini pada parameter ${field}. Konfigurasi integrasi perlu diperbaiki sebelum mencoba lagi.`);
    }
  }
  if (descriptions.some(description => /\b(?:maxOutputTokens|max_output_tokens)\b/i.test(description) && /\b(?:out of range|exceeds?|greater than|above|must be (?:less than|at most|between)|too (?:large|high))\b/i.test(description))) {
    return new ProviderError(400,"provider_configuration_invalid","Batas output token pada permintaan aplikasi tidak cocok dengan model Gemini (maxOutputTokens). Konfigurasi integrasi perlu diperbaiki sebelum mencoba lagi.");
  }
  if (descriptions.some(description => /\b(?:(?:unable|failed|could not|cannot) to decode (?:the |an? )?image|invalid image (?:data|format|content)|(?:unsupported|invalid) (?:image )?mime[ -]?type|provided image is not valid)\b/i.test(description))) {
    return new ProviderError(400,"provider_invalid_request","Gemini tidak dapat membaca gambar referensi atau format filenya. Unggah ulang gambar JPG, PNG, atau WebP yang dapat dibuka, lalu coba kembali.");
  }
  if (descriptions.some(description => /\b(?:model (?:does not|doesn't) support (?:the )?(?:requested |image |output )?(?:response )?(?:modality|modalities|generation of images|image generation)|(?:requested |output |image )?modalit(?:y|ies) (?:is |are )?not supported|(?:image generation|image output) (?:is )?not supported (?:by|for) (?:this |the )?model)\b/i.test(description))) {
    return new ProviderError(400,"provider_configuration_invalid","Model Gemini yang dikonfigurasi tidak mendukung jenis keluaran pada permintaan aplikasi. Pilih model gambar, teks, atau suara yang sesuai sebelum mencoba lagi.");
  }
}

function geminiRequestError(status: number, error?: Record<string, unknown>): ProviderError {
  const keyReasons = new Set(["API_KEY_INVALID", "API_KEY_EXPIRED", "API_KEY_REVOKED"]);
  const billingReasons = new Set(["BILLING_DISABLED", "BILLING_NOT_ACTIVE", "BILLING_ACCOUNT_DISABLED", "PROJECT_BILLING_DISABLED"]);
  const reasons = Array.isArray(error?.details) ? error.details.slice(0,64).flatMap((detail: unknown) => {
    if (!detail || typeof detail !== "object" || !("reason" in detail) || typeof detail.reason !== "string") return [];
    return keyReasons.has(detail.reason) || billingReasons.has(detail.reason) ? [detail.reason] : [];
  }) : [];
  const code = typeof error?.code === "string" ? error.code : "";
  const upstreamStatus = typeof error?.status === "string" ? error.status : "";
  const message = typeof error?.message === "string" ? error.message : "";
  const keyRejected = reasons.some(reason => keyReasons.has(reason)) || [code,upstreamStatus].some(value => keyReasons.has(value) || value === "authentication")
    || /\bAPI key (?:not valid|invalid|expired|revoked|is (?:invalid|expired|revoked)|has expired)\b/i.test(message);
  const billingRequired = reasons.some(reason => billingReasons.has(reason)) || [code,upstreamStatus].some(value => billingReasons.has(value))
    || /\bbilling (?:is (?:disabled|not enabled|not active)|has (?:not been enabled|been disabled)|must be enabled)\b/i.test(message)
    || /\b(?:enable|activate) billing (?:on|for|in)\b/i.test(message);
  if (status === 401 || ([400,403].includes(status) && keyRejected)) return new ProviderError(502,"provider_authentication_failed","Google menolak API key Gemini ini karena tidak valid, kedaluwarsa, atau sudah dicabut. Gunakan key aktif dari Google AI Studio.");
  if (status === 402) return new ProviderError(402,"provider_payment_required","Kredit atau pembayaran Gemini belum mencukupi. Periksa saldo Prepay dan billing proyek Google AI Studio yang memiliki key ini sebelum mencoba lagi.");
  if ([400,403].includes(status) && billingRequired) return new ProviderError(400,"provider_billing_required","Billing proyek Gemini belum aktif. Aktifkan billing untuk proyek Google AI Studio yang memiliki key ini; model gambar tidak menyediakan kuota gratis.");
  if ([400,403].includes(status) && /\b(?:user location is not (?:supported|allowed)|(?:Gemini API|API use) is not (?:available|supported) in (?:your|this) (?:country|region)|location is not supported for (?:the )?API use)\b/i.test(message)) return new ProviderError(400,"provider_region_unsupported","Gemini belum mendukung lokasi akun atau server yang memproses permintaan ini. Periksa wilayah yang didukung Google AI Studio atau gunakan provider lain yang tersedia.");
  if (status === 400) {
    const contractError = geminiRequestContractError(error);
    if (contractError) return contractError;
  }
  if (status === 400 && [code,upstreamStatus].some(value => value === "FAILED_PRECONDITION" || value === "failed_precondition")) return new ProviderError(400,"provider_precondition_failed","Prasyarat akun atau proyek Gemini belum terpenuhi. Periksa status proyek, ketersediaan layanan di wilayah akun, dan billing di Google AI Studio.");
  if (status === 400) return new ProviderError(400,"provider_invalid_request",`Gemini tidak menerima format atau opsi permintaan aplikasi ini${upstreamStatus === "INVALID_ARGUMENT" ? " (INVALID_ARGUMENT)" : ""}. Periksa instruksi, gambar referensi, dan konfigurasi model.`);
  if (status === 403) return new ProviderError(403,"provider_access_denied","Key Gemini tidak diizinkan mengakses layanan atau model ini. Periksa batasan key, izin proyek, dan akses model di Google AI Studio.");
  if (status === 404) return new ProviderError(503,"provider_model_unavailable","Model Gemini belum tersedia untuk API key ini. Pilih model yang tersedia di akun Google AI Studio.");
  if (status === 429) return new ProviderError(429,"provider_quota_exceeded","Kuota atau batas permintaan Gemini tercapai. Periksa kuota dan billing proyek Google AI Studio; model gambar tidak menyediakan kuota gratis.");
  if ([408,504,522,524].includes(status)) return new ProviderError(504,"provider_timeout","Gemini melewati batas waktu. Permintaan ini tidak diulang otomatis karena hasil upstream belum dapat dipastikan.");
  return new ProviderError(502,"provider_unavailable","Gemini sedang tidak tersedia. Coba lagi nanti.");
}

async function providerJson(path: string, body: unknown, key: string): Promise<Record<string, unknown>> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), body === undefined ? 20_000 : 120_000);
  try {
    const response = await fetch(`${API_HOST}${path}`, {
      method: body === undefined ? "GET" : "POST", redirect: "manual", signal: controller.signal,
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (!response.ok) {
      if (response.status >= 300 && response.status < 400) {
        await response.body?.cancel();
        throw new ProviderError(502,"provider_redirect_refused","Gemini mengembalikan redirect yang tidak diizinkan. Periksa endpoint dan koneksi provider.");
      }
      throw geminiRequestError(response.status,await geminiErrorDetails(response));
    }
    if (Number(response.headers.get("content-length")) > MAX_RESPONSE_BYTES) {
      await response.body?.cancel();
      throw new ProviderError(502, "provider_output_too_large", "Hasil Gemini melebihi batas ukuran studio.");
    }
    if (!response.body) throw new ProviderError(502, "provider_empty_response", "Gemini tidak memberikan hasil.");
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let text = "", bytes = 0;
    try {
      while (true) {
        const part = await reader.read();
        if (part.done) break;
        bytes += part.value.byteLength;
        if (bytes > MAX_RESPONSE_BYTES) { await reader.cancel(); throw new ProviderError(502, "provider_output_too_large", "Hasil Gemini melebihi batas ukuran studio."); }
        text += decoder.decode(part.value, { stream: true });
      }
      text += decoder.decode();
    } finally { reader.releaseLock(); }
    try { return JSON.parse(text) as Record<string, unknown>; }
    catch { throw new ProviderError(502, "provider_invalid_response", "Format hasil Gemini tidak valid."); }
  } catch (error) {
    if (error instanceof ProviderError) throw error;
    if (controller.signal.aborted) throw new ProviderError(504, "provider_timeout", "Gemini membutuhkan waktu terlalu lama. Coba kembali dengan instruksi lebih sederhana.");
    throw new ProviderError(502, "provider_connection_failed", "Tidak dapat terhubung ke Gemini. Coba lagi nanti.");
  } finally { clearTimeout(timeout); }
}

export async function testGeminiConnection(settings: ProviderSettings) {
  const response = await providerJson("/v1beta/models?pageSize=1000",undefined,settings.apiKey);
  if (!Array.isArray(response.models)) throw new ProviderError(502,"provider_invalid_response","Katalog model Gemini tidak valid.");
  const models = [...new Set(response.models.filter((item) => item && typeof item === "object" && typeof item.name === "string" && /^models\/[a-z0-9.-]{1,150}$/.test(item.name) && !item.name.includes(settings.apiKey)).map((item) => String(item.name).replace(/^models\//,"")))];
  const warnings = ["Koneksi katalog berhasil. Uji ini belum membuat gambar atau memeriksa kuota dan billing generasi."];
  if (!models.includes(settings.imageModel)) warnings.push("Model gambar yang dikonfigurasi tidak tercantum dalam katalog key ini. Periksa akses model sebelum membuat gambar.");
  if (!models.includes(settings.textModel)) warnings.push("Model teks yang dikonfigurasi tidak tercantum dalam katalog key ini.");
  if (!models.includes(settings.audioModel)) warnings.push("Model suara yang dikonfigurasi tidak tercantum dalam katalog key ini.");
  return { ok: true, provider: "gemini", models, imageModels: models.filter((model) => /image|banana|imagen/.test(model)), audioModels: models.filter((model) => /tts/.test(model)), warnings };
}

function binaryOutput(data: unknown, mime: unknown, kind: "image" | "audio"): ProviderOutput {
  if (typeof data !== "string" || typeof mime !== "string") throw new ProviderError(502, "provider_invalid_response", "Data file dari Gemini tidak valid.");
  let bytes: Uint8Array;
  try { bytes = decodeBase64(data, MAX_OUTPUT_BYTES); }
  catch { throw new ProviderError(502, "provider_output_too_large", "Data file Gemini tidak valid atau terlalu besar."); }
  if (kind === "image" && (!IMAGE_MIME_TYPES.has(mime) || !isMatchingImage(bytes, mime))) throw new ProviderError(502, "provider_invalid_image", "Gemini tidak memberikan file gambar yang valid.");
  if (kind === "audio" && !["audio/wav", "audio/x-wav", "audio/mpeg", "audio/ogg"].includes(mime)) throw new ProviderError(502, "provider_invalid_audio", "Gemini tidak memberikan file suara yang didukung.");
  return { kind, bytes, mimeType: mime === "audio/x-wav" ? "audio/wav" : mime };
}

export function assertGeminiGeneration(input: GenerateInput, settings: ProviderSettings) {
  const model = validModel(input.kind === "image" ? settings.imageModel : input.kind === "text" ? settings.textModel : settings.audioModel);
  if (input.kind === "audio" && !/^gemini-3\.8-flash(-lite)?-tts$/.test(model)) throw new ProviderError(503,"provider_configuration_invalid","Model suara harus kompatibel dengan Gemini 3.8 TTS Interactions API.");
}

export async function generateWithGemini(input: GenerateInput, featureIntent: string, settings: ProviderSettings): Promise<ProviderOutput[]> {
  assertGeminiGeneration(input,settings);
  const options = JSON.stringify(input.options);
  const language = outputLanguage(input.options.language);
  const prompt = `Task: ${featureIntent}\nUser instructions:\n${input.prompt}\nSelected controls (apply every relevant option): ${options}\nOutput language: ${language}. Preserve the supplied reference subjects and products unless the user requests a change. Do not invent product claims, specifications, or testimonials. Return the requested finished output directly.`;

  if (input.kind === "audio") {
    const model = validModel(settings.audioModel);
    if (!/^gemini-3\.8-flash(-lite)?-tts$/.test(model)) throw new ProviderError(503, "provider_configuration_invalid", "Model suara harus kompatibel dengan Gemini 3.8 TTS Interactions API.");
    const voice = isGeminiVoice(input.options.voice) ? input.options.voice : "Kore";
    const style = typeof input.options.style === "string" ? input.options.style.slice(0, 1000) : "Clear, warm, natural narration in the language of the transcript. Follow the requested pacing and tone.";
    // The speech endpoint returns complete WAV files for unary requests.
    const response = await providerJson("/v1beta/interactions", {
      model,
      input: [{ type: "user_input", content: [{ type: "text", text: input.prompt, annotations: [{ type: "speech_metadata", style }] }] }],
      response_format: { type: "audio", mime_type: "audio/wav" },
      generation_config: { speech_config: [{ voice }] },
    }, settings.apiKey);
    if (response.status === "failed" || response.status === "cancelled") throw new ProviderError(422, "provider_rejected", "Gemini tidak dapat memproses naskah suara ini.");
    const steps = Array.isArray(response.steps) ? response.steps : [];
    const outputs: ProviderOutput[] = [];
    for (const step of steps) {
      if (!step || typeof step !== "object" || step.type !== "model_output" || !Array.isArray(step.content)) continue;
      for (const part of step.content) if (part && typeof part === "object" && part.type === "audio") outputs.push(binaryOutput(part.data, part.mime_type ?? "audio/wav", "audio"));
    }
    if (!outputs.length) throw new ProviderError(422, "provider_no_audio", "Gemini tidak menghasilkan suara. Periksa naskah atau coba lagi.");
    return outputs.slice(0,4);
  }

  const generationConfig: Record<string, unknown> = { maxOutputTokens: input.kind === "image" ? 32_768 : 8192 };
  if (input.kind === "image") {
    generationConfig.responseModalities = ["TEXT", "IMAGE"];
    const aspectRatio = [input.options.aspectRatio, input.options.ratio, input.options.aspect_ratio].find((value) => typeof value === "string" && ASPECT_RATIOS.has(value));
    const imageSize = [input.options.resolution, input.options.imageSize].find((value) => ["1K", "2K", "4K"].includes(String(value)));
    if (aspectRatio || imageSize) generationConfig.responseFormat = { image: { ...(aspectRatio ? { aspectRatio } : {}), ...(imageSize ? { imageSize } : {}) } };
  }
  const model = validModel(input.kind === "image" ? settings.imageModel : settings.textModel);
  const response = await providerJson(`/v1/models/${model}:generateContent`, {
    contents: [{ role: "user", parts: [{ text: prompt }, ...input.images.map((image) => ({ inlineData: { data: image.data, mimeType: image.mimeType } }))] }],
    generationConfig,
  }, settings.apiKey);
  const feedback = response.promptFeedback as { blockReason?: string } | undefined;
  if (feedback?.blockReason) throw new ProviderError(422, "provider_rejected", "Gemini menolak instruksi ini. Ubah instruksi lalu coba kembali.");
  const candidates = Array.isArray(response.candidates) ? response.candidates : [];
  const outputs: ProviderOutput[] = [];
  let rejected = false;
  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== "object") continue;
    if (["SAFETY", "RECITATION", "BLOCKLIST", "PROHIBITED_CONTENT", "SPII", "IMAGE_SAFETY", "IMAGE_PROHIBITED_CONTENT"].includes(String(candidate.finishReason))) { rejected = true; continue; }
    const parts = candidate.content && typeof candidate.content === "object" && Array.isArray(candidate.content.parts) ? candidate.content.parts : [];
    const textParts: string[] = [];
    for (const part of parts) {
      if (!part || typeof part !== "object" || part.thought) continue;
      if (typeof part.text === "string") textParts.push(part.text);
      const inline = part.inlineData ?? part.inline_data;
      if (input.kind === "image" && inline && typeof inline === "object") outputs.push(binaryOutput(inline.data, inline.mimeType ?? inline.mime_type, "image"));
    }
    if (input.kind === "text" && textParts.length) outputs.push({ kind: "text", text: textParts.join("\n").slice(0,100_000), mimeType: "text/plain" });
  }
  if (!outputs.length) {
    if (rejected) throw new ProviderError(422, "provider_rejected", "Gemini menolak konten ini. Ubah instruksi lalu coba kembali.");
    if (input.kind === "image") throw new ProviderError(422, "provider_no_image", "Gemini membalas tanpa menghasilkan gambar. Coba instruksi yang lebih jelas atau ganti gambar referensi.");
    throw new ProviderError(422, "provider_empty_response", "Gemini tidak menghasilkan teks. Coba kembali.");
  }
  return outputs.slice(0,4);
}
