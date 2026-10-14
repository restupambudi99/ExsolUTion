import { decodeBase64, IMAGE_MIME_TYPES, isMatchingImage, type GenerateInput, type OutputKind } from "./studio-validation";

export const DEFAULT_MODELS = {
  imageModel: "gemini-3.1-flash-image",
  textModel: "gemini-3.8-flash",
  audioModel: "gemini-3.8-flash-tts",
};

export type ProviderSettings = typeof DEFAULT_MODELS & { apiKey: string };
export type ProviderOutput = { kind: OutputKind; text?: string; bytes?: Uint8Array; mimeType?: string };

export class ProviderError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}

const API_HOST = "https://generativelanguage.googleapis.com";
const MAX_RESPONSE_BYTES = 32 * 1024 * 1024;
const MAX_OUTPUT_BYTES = 20 * 1024 * 1024;
const ASPECT_RATIOS = new Set(["1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9", "1:4", "4:1", "1:8", "8:1"]);
const VOICES = new Set(["Zephyr", "Puck", "Charon", "Kore", "Fenrir", "Leda", "Orus", "Aoede", "Callirrhoe", "Autonoe", "Enceladus", "Iapetus", "Umbriel", "Algieba", "Despina", "Erinome", "Algenib", "Rasalgethi", "Laomedeia", "Achernar", "Alnilam", "Schedar", "Gacrux", "Pulcherrima", "Achird", "Zubenelgenubi", "Vindemiatrix", "Sadachbia", "Sadaltager", "Sulafat"]);

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

async function providerJson(path: string, body: unknown, key: string): Promise<Record<string, unknown>> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120_000);
  try {
    const response = await fetch(`${API_HOST}${path}`, {
      method: "POST", redirect: "error", signal: controller.signal,
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      await response.body?.cancel();
      if (response.status === 400) throw new ProviderError(400, "provider_invalid_request", "Gemini tidak menerima permintaan ini. Periksa instruksi dan opsi model.");
      if (response.status === 401 || response.status === 403) throw new ProviderError(502, "provider_authentication_failed", "API key tidak valid atau belum memiliki akses ke model Gemini.");
      if (response.status === 404) throw new ProviderError(503, "provider_model_unavailable", "Model Gemini belum tersedia untuk API key ini. Pilih model yang tersedia di akun Google AI Studio.");
      if (response.status === 429) throw new ProviderError(429, "provider_quota_exceeded", "Kuota Gemini habis atau batas permintaan tercapai. Periksa billing dan kuota Google AI Studio.");
      throw new ProviderError(502, "provider_unavailable", "Gemini sedang tidak tersedia. Coba lagi nanti.");
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

function binaryOutput(data: unknown, mime: unknown, kind: "image" | "audio"): ProviderOutput {
  if (typeof data !== "string" || typeof mime !== "string") throw new ProviderError(502, "provider_invalid_response", "Data file dari Gemini tidak valid.");
  let bytes: Uint8Array;
  try { bytes = decodeBase64(data, MAX_OUTPUT_BYTES); }
  catch { throw new ProviderError(502, "provider_output_too_large", "Data file Gemini tidak valid atau terlalu besar."); }
  if (kind === "image" && (!IMAGE_MIME_TYPES.has(mime) || !isMatchingImage(bytes, mime))) throw new ProviderError(502, "provider_invalid_image", "Gemini tidak memberikan file gambar yang valid.");
  if (kind === "audio" && !["audio/wav", "audio/x-wav", "audio/mpeg", "audio/ogg"].includes(mime)) throw new ProviderError(502, "provider_invalid_audio", "Gemini tidak memberikan file suara yang didukung.");
  return { kind, bytes, mimeType: mime === "audio/x-wav" ? "audio/wav" : mime };
}

export async function generateWithGemini(input: GenerateInput, featureIntent: string, settings: ProviderSettings): Promise<ProviderOutput[]> {
  const options = JSON.stringify(input.options);
  const language = outputLanguage(input.options.language);
  const prompt = `Task: ${featureIntent}\nUser instructions:\n${input.prompt}\nSelected controls (apply every relevant option): ${options}\nOutput language: ${language}. Preserve the supplied reference subjects and products unless the user requests a change. Do not invent product claims, specifications, or testimonials. Return the requested finished output directly.`;

  if (input.kind === "audio") {
    const model = validModel(settings.audioModel);
    if (!/^gemini-3\.8-flash(-lite)?-tts$/.test(model)) throw new ProviderError(503, "provider_configuration_invalid", "Model suara harus kompatibel dengan Gemini 3.8 TTS Interactions API.");
    const voice = typeof input.options.voice === "string" && VOICES.has(input.options.voice) ? input.options.voice : "Kore";
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
