import { ApiError, assertSameOrigin, authenticatedUser, bucket, database, errorResponse, json, limitedBody, rateLimit } from "@/lib/studio-api";
import { isMatchingImage, IMAGE_MIME_TYPES, MAX_UPLOAD_BYTES, UPLOAD_MIME_TYPES } from "@/lib/studio-validation";
import { saveFile } from "@/lib/studio-storage";

export const dynamic = "force-dynamic";

function matchesMedia(bytes: Uint8Array, mime: string) {
  if (IMAGE_MIME_TYPES.has(mime)) return isMatchingImage(bytes,mime);
  const prefix = new TextDecoder().decode(bytes.subarray(0,12));
  if (mime === "audio/wav") return prefix.startsWith("RIFF") && prefix.slice(8,12) === "WAVE";
  if (mime === "audio/mpeg") return prefix.startsWith("ID3") || (bytes[0] === 255 && (bytes[1] & 224) === 224);
  if (mime === "audio/mp4" || mime === "video/mp4") return prefix.slice(4,8) === "ftyp";
  if (mime === "video/webm") return bytes[0] === 26 && bytes[1] === 69 && bytes[2] === 223 && bytes[3] === 163;
  return false;
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await authenticatedUser();
    database(); bucket();
    if (!request.headers.get("content-type")?.toLowerCase().startsWith("multipart/form-data")) throw new ApiError(415, "invalid_content_type", "Unggah file dengan multipart form.");
    await rateLimit(user.userId, "upload", 20);
    const body = await limitedBody(request, MAX_UPLOAD_BYTES + 64_000);
    let form: FormData;
    try { form = await new Response(body.buffer as ArrayBuffer, { headers: { "Content-Type": request.headers.get("content-type")! } }).formData(); }
    catch { throw new ApiError(400,"invalid_upload","Data unggahan tidak valid."); }
    const file = form.get("file");
    if (!file || typeof file === "string" || !(file instanceof File)) throw new ApiError(400, "missing_file", "Pilih file untuk diunggah.");
    if (!file.size || file.size > MAX_UPLOAD_BYTES) throw new ApiError(413, "file_too_large", "File harus berukuran antara 1 byte dan 20 MB.");
    if (!UPLOAD_MIME_TYPES.has(file.type)) throw new ApiError(415, "unsupported_file", "Format file belum didukung. Gunakan PNG, JPEG, WebP, MP3, WAV, M4A, MP4, atau WebM.");
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!matchesMedia(bytes,file.type)) throw new ApiError(415, "invalid_file", "Isi file tidak sesuai dengan formatnya.");
    return json(await saveFile(user.userId,bytes,file.type,file.name), 201);
  } catch (error) { return errorResponse(error); }
}
