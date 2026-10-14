import { ApiError, assertSameOrigin, authenticatedUser, bucket, database, errorResponse, json, validId } from "@/lib/studio-api";

export const dynamic = "force-dynamic";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const user = await authenticatedUser();
    const id = validId((await params).id);
    const item = await database().prepare("SELECT id FROM generations WHERE id = ? AND user_id = ?").bind(id, user.userId).first();
    if (!item) throw new ApiError(404, "not_found", "Hasil tidak ditemukan.");
    const files = (await database().prepare("SELECT object_key FROM studio_files WHERE generation_id = ? AND user_id = ?").bind(id, user.userId).all<{ object_key: string }>()).results;
    if (files.length) await bucket().delete(files.map((file) => file.object_key));
    await database().batch([
      database().prepare("DELETE FROM studio_files WHERE generation_id = ? AND user_id = ?").bind(id, user.userId),
      database().prepare("DELETE FROM generations WHERE id = ? AND user_id = ?").bind(id, user.userId),
    ]);
    return json({ deleted: true, id });
  } catch (error) { return errorResponse(error); }
}
