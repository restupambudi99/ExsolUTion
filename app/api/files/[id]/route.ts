import { ApiError, authenticatedUser, bucket, errorResponse, validId } from "@/lib/studio-api";
import { ownedFile } from "@/lib/studio-storage";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await authenticatedUser();
    const file = await ownedFile(user.userId, validId((await params).id));
    if (!file) throw new ApiError(404, "not_found", "File tidak ditemukan.");
    const object = await bucket().get(file.object_key);
    if (!object) throw new ApiError(404, "not_found", "File tidak ditemukan.");
    return new Response(object.body, {
      headers: {
        "Content-Type": file.mime_type,
        "Content-Length": String(file.byte_size),
        "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(file.original_name)}`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "Cross-Origin-Resource-Policy": "same-origin",
        "ETag": object.httpEtag,
      },
    });
  } catch (error) { return errorResponse(error); }
}
