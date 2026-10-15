export type OutputKind = "image" | "text" | "audio";
export type StudioProvider = "gemini" | "9router";
export type RouterConfig = { baseUrl?: string; textModel?: string; imageModel?: string; audioModel?: string; voice?: string };
export type ProviderSelection = { provider?: StudioProvider; apiKey?: string; routerConfig?: RouterConfig };
export type InputImage = { data: string; mimeType: string; fieldId?: string; role?: "reference" | "mask" };
export type GenerateInput = ProviderSelection & {
  featureId: string;
  prompt: string;
  kind: OutputKind;
  options: Record<string, unknown>;
  images: InputImage[];
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

export function validateProviderSelection(value: Record<string, unknown>): ProviderSelection {
  const provider = value.provider === undefined ? "gemini" : value.provider;
  if (provider !== "gemini" && provider !== "9router") throw new ValidationError("Provider tidak valid. Pilih Gemini atau 9Router.");
  let apiKey: string | undefined;
  if (value.apiKey !== undefined && value.apiKey !== "") {
    if (typeof value.apiKey !== "string") throw new ValidationError("Format API key tidak valid.");
    const key = value.apiKey.trim();
    if (provider === "gemini" ? !/^[A-Za-z0-9_-]{20,256}$/.test(key) : !/^[\x21-\x7e]{1,4096}$/.test(key)) throw new ValidationError("Format API key tidak valid.");
    apiKey = key;
  }
  let routerConfig: RouterConfig | undefined;
  if (provider === "9router" && value.routerConfig !== undefined) {
    if (!value.routerConfig || typeof value.routerConfig !== "object" || Array.isArray(value.routerConfig)) throw new ValidationError("Konfigurasi 9Router tidak valid.");
    routerConfig = {};
    for (const [key,maxLength] of [["baseUrl",2048],["textModel",256],["imageModel",256],["audioModel",256],["voice",128]] as const) {
      const item = (value.routerConfig as Record<string, unknown>)[key];
      if (item === undefined || item === "") continue;
      if (typeof item !== "string" || item.trim().length > maxLength || /[\x00-\x1f\x7f]/.test(item)) throw new ValidationError(`Konfigurasi 9Router ${key} tidak valid.`);
      routerConfig[key] = item.trim();
    }
  }
  return { provider, ...(apiKey ? { apiKey } : {}), ...(routerConfig ? { routerConfig } : {}) };
}

export function validateGenerate(value: Record<string, unknown>): GenerateInput {
  if (typeof value.featureId !== "string" || !/^[a-zA-Z0-9_-]{1,100}$/.test(value.featureId)) throw new ValidationError("Pilih fitur yang valid.");
  if (typeof value.prompt !== "string" || !value.prompt.trim() || value.prompt.length > 20_000) throw new ValidationError("Isi instruksi antara 1 dan 20.000 karakter.");
  if (value.kind !== "image" && value.kind !== "text" && value.kind !== "audio") throw new ValidationError("Jenis hasil belum didukung oleh provider ini.");
  const options = safeOptions(value.options);
  const imageValues = value.images ?? [];
  if (!Array.isArray(imageValues) || imageValues.length > 15) throw new ValidationError("Maksimal 14 foto referensi dan 1 mask.");
  let total = 0;
  let maskCount = 0;
  const images = imageValues.map((image): InputImage => {
    if (!image || typeof image !== "object" || typeof image.data !== "string" || typeof image.mimeType !== "string" || !IMAGE_MIME_TYPES.has(image.mimeType)) throw new ValidationError("Gunakan gambar PNG, JPEG, atau WebP.");
    if (image.role !== undefined && image.role !== "reference" && image.role !== "mask") throw new ValidationError("Peran gambar referensi tidak valid.");
    if (image.role === "mask") {
      maskCount++;
      if (image.mimeType !== "image/png") throw new ValidationError("Mask harus berformat PNG hitam dan putih.");
    }
    const data = image.data.startsWith("data:") ? image.data.slice(image.data.indexOf(",") + 1) : image.data;
    const bytes = decodeBase64(data, MAX_IMAGE_BYTES);
    if (!isMatchingImage(bytes, image.mimeType)) throw new ValidationError("Isi gambar tidak sesuai dengan format file.");
    total += bytes.byteLength;
    const fieldId = typeof image.fieldId === "string" && /^[a-zA-Z0-9_-]{1,100}$/.test(image.fieldId) ? image.fieldId : undefined;
    return { data, mimeType: image.mimeType, ...(fieldId ? { fieldId } : {}), ...(image.role ? { role: image.role } : {}) };
  });
  if (maskCount > 1 || images.length-maskCount > 14) throw new ValidationError("Maksimal 14 foto referensi dan 1 mask.");
  if (maskCount && images.length === maskCount) throw new ValidationError("Mask harus disertai foto sumber.");
  if (total > MAX_INPUT_IMAGE_BYTES) throw new ValidationError("Total gambar maksimal 12 MB.");
  if (value.kind === "audio" && images.length) throw new ValidationError("Fitur suara menerima teks, bukan gambar.");
  return { featureId: value.featureId, prompt: value.prompt.trim(), kind: value.kind, options, images, ...validateProviderSelection(value) };
}
