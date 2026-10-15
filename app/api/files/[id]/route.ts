import { ApiError, authenticatedUser, bucket, errorResponse, validId } from "@/lib/studio-api";
import { ownedFile } from "@/lib/studio-storage";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

function requestedRange(value: string | null, size: number): { offset: number; length: number } | "unsatisfiable" | undefined {
  if (!value || !value.startsWith("bytes=")) return undefined;
  // Multipart ranges are optional; serve the full file rather than buffering it.
  if (value.includes(",")) return undefined;
  const match = /^bytes=(\d*)-(\d*)$/.exec(value.trim());
  if (!match || (!match[1] && !match[2])) return undefined;
  const start = match[1] ? Number(match[1]) : undefined;
  const end = match[2] ? Number(match[2]) : undefined;
  if (size <= 0 || (start !== undefined && (!Number.isSafeInteger(start) || start >= size)) || (end !== undefined && !Number.isSafeInteger(end))) return "unsatisfiable";
  if (start === undefined) {
    if (!end) return "unsatisfiable";
    const length = Math.min(end, size);
    return { offset: size - length, length };
  }
  if (end !== undefined && end < start) return "unsatisfiable";
  return { offset: start, length: Math.min(end ?? size - 1, size - 1) - start + 1 };
}

async function serveFile(request: Request, { params }: RouteContext, headOnly = false) {
  try {
    const user = await authenticatedUser();
    const file = await ownedFile(user.userId, validId((await params).id));
    if (!file) throw new ApiError(404, "not_found", "File tidak ditemukan.");
    // Ignoring Range with If-Range is safe: the caller gets a fresh complete file.
    const range = headOnly || request.headers.has("if-range") ? undefined : requestedRange(request.headers.get("range"), file.byte_size);
    if (range === "unsatisfiable") return new Response(null, { status: 416, headers: {
      "Content-Range": `bytes */${file.byte_size}`, "Accept-Ranges": "bytes", "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff",
    } });
    const object = headOnly ? await bucket().head(file.object_key) : await bucket().get(file.object_key, range ? { range } : undefined);
    if (!object) throw new ApiError(404, "not_found", "File tidak ditemukan.");
    return new Response(headOnly ? null : (object as R2ObjectBody).body, {
      status: range ? 206 : 200,
      headers: {
        "Content-Type": file.mime_type,
        "Content-Length": String(range ? range.length : object.size),
        "Accept-Ranges": "bytes",
        ...(range ? { "Content-Range": `bytes ${range.offset}-${range.offset + range.length - 1}/${object.size}` } : {}),
        "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(file.original_name)}`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "Cross-Origin-Resource-Policy": "same-origin",
        "ETag": object.httpEtag,
      },
    });
  } catch (error) { return errorResponse(error); }
}

export async function GET(request: Request, context: RouteContext) { return serveFile(request, context); }
export async function HEAD(request: Request, context: RouteContext) { return serveFile(request, context, true); }
