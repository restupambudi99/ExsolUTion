export type OutputKind = "image" | "text" | "audio";
export type InputImage = { data: string; mimeType: string; fieldId?: string };
export type GenerateInput = {
  featureId: string;
  prompt: string;
  kind: OutputKind;
  options: Record<string, unknown>;
  images: InputImage[];
  apiKey?: string;
};

export class ValidationError extends Error {}

export const IMAGE_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
export const UPLOAD_MIME_TYPES = new Set([...IMAGE_MIME_TYPES, "audio/wav", "audio/mpeg", "audio/mp4", "video/mp4", "video/webm"]);
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
export const MAX_INPUT_IMAGE_BYTES = 12 * 1024 * 1024;
export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

export function decodeBase64(value: string, maxBytes: number): Uint8Array {
  if (!value || value.length > Math.ceil(maxBytes / 3) * 4 || !/^[A-Za-z0-9+/]*={0,2}$/.test(value) || value.length % 4 !== 0) {
    throw new ValidationError("Data file tidak valid atau melebihi batas ukuran.");
  }
  let decoded: string;
  try { decoded = atob(value); } catch { throw new ValidationError("Data file tidak valid."); }
  if (decoded.length > maxBytes) throw new ValidationError("Ukuran file terlalu besar.");
  const bytes = new Uint8Array(decoded.length);
  for (let index = 0; index < decoded.length; index++) bytes[index] = decoded.charCodeAt(index);
  return bytes;
}

export function isMatchingImage(bytes: Uint8Array, mimeType: string) {
  if (mimeType === "image/png") return bytes.length >= 8 && bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71 && bytes[4] === 13 && bytes[5] === 10 && bytes[6] === 26 && bytes[7] === 10;
  if (mimeType === "image/jpeg") return bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  if (mimeType === "image/webp") return bytes.length >= 12 && new TextDecoder().decode(bytes.subarray(0,4)) === "RIFF" && new TextDecoder().decode(bytes.subarray(8,12)) === "WEBP";
  return false;
}

export function safeOptions(value: unknown): Record<string, unknown> {
  if (value === undefined) return {};
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new ValidationError("Opsi tidak valid.");
  const serialized = JSON.stringify(value);
  if (serialized.length > 16_000) throw new ValidationError("Opsi terlalu panjang.");
  // Credentials belong only in the dedicated ephemeral field and are never stored.
  const inspect = (item: unknown, depth: number): void => {
    if (depth > 4) throw new ValidationError("Opsi terlalu kompleks.");
    if (item && typeof item === "object") for (const [key, child] of Object.entries(item)) {
      if (/api.?key|secret|password|authorization|credential/i.test(key)) throw new ValidationError("Jangan masukkan kredensial ke dalam opsi.");
      inspect(child, depth + 1);
    }
  };
  inspect(value, 0);
  return value as Record<string, unknown>;
}

export function validateGenerate(value: Record<string, unknown>): GenerateInput {
  if (typeof value.featureId !== "string" || !/^[a-zA-Z0-9_-]{1,100}$/.test(value.featureId)) throw new ValidationError("Pilih fitur yang valid.");
  if (typeof value.prompt !== "string" || !value.prompt.trim() || value.prompt.length > 20_000) throw new ValidationError("Isi instruksi antara 1 dan 20.000 karakter.");
  if (value.kind !== "image" && value.kind !== "text" && value.kind !== "audio") throw new ValidationError("Jenis hasil belum didukung oleh provider ini.");
  const options = safeOptions(value.options);
  const imageValues = value.images ?? [];
  if (!Array.isArray(imageValues) || imageValues.length > 14) throw new ValidationError("Maksimal 14 gambar referensi.");
  let total = 0;
  const images = imageValues.map((image): InputImage => {
    if (!image || typeof image !== "object" || typeof image.data !== "string" || typeof image.mimeType !== "string" || !IMAGE_MIME_TYPES.has(image.mimeType)) throw new ValidationError("Gunakan gambar PNG, JPEG, atau WebP.");
    const data = image.data.startsWith("data:") ? image.data.slice(image.data.indexOf(",") + 1) : image.data;
    const bytes = decodeBase64(data, MAX_IMAGE_BYTES);
    if (!isMatchingImage(bytes, image.mimeType)) throw new ValidationError("Isi gambar tidak sesuai dengan format file.");
    total += bytes.byteLength;
    const fieldId = typeof image.fieldId === "string" && /^[a-zA-Z0-9_-]{1,100}$/.test(image.fieldId) ? image.fieldId : undefined;
    return { data, mimeType: image.mimeType, ...(fieldId ? { fieldId } : {}) };
  });
  if (total > MAX_INPUT_IMAGE_BYTES) throw new ValidationError("Total gambar maksimal 12 MB.");
  if (value.kind === "audio" && images.length) throw new ValidationError("Fitur suara menerima teks, bukan gambar.");
  let apiKey: string | undefined;
  if (value.apiKey !== undefined && value.apiKey !== "") {
    if (typeof value.apiKey !== "string" || !/^[A-Za-z0-9_-]{20,256}$/.test(value.apiKey.trim())) throw new ValidationError("Format API key tidak valid.");
    apiKey = value.apiKey.trim();
  }
  return { featureId: value.featureId, prompt: value.prompt.trim(), kind: value.kind, options, images, apiKey };
}
