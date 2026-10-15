import { ApiError, assertSameOrigin, authenticatedUser, database, errorResponse, json, validId } from "@/lib/studio-api";
import { cleanupDeletedFiles } from "@/lib/studio-file-cleanup";

export const dynamic = "force-dynamic";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const user = await authenticatedUser();
    const id = validId((await params).id);
    const db = database();
    const item = await db.prepare("SELECT id FROM generations WHERE id = ? AND user_id = ?").bind(id, user.userId).first();
    if (!item) throw new ApiError(404, "not_found", "Hasil tidak ditemukan.");
    // D1 batches are atomic. File URLs become inaccessible only when both history
    // removal and its durable R2 cleanup record have been committed together.
    await db.batch([
      db.prepare("INSERT INTO studio_file_cleanup (id, user_id, object_key, created_at) SELECT id, user_id, object_key, ? FROM studio_files WHERE generation_id = ? AND user_id = ? ON CONFLICT(object_key) DO NOTHING").bind(Date.now(), id, user.userId),
      db.prepare("DELETE FROM studio_files WHERE generation_id = ? AND user_id = ?").bind(id, user.userId),
      db.prepare("UPDATE studio_generation_requests SET status = 'failed', response_json = json_object('results', json('[]'), 'error', ?, 'code', 'generation_deleted', 'requestId', request_id), error_status = 410, updated_at = ? WHERE generation_id = ? AND user_id = ?")
        .bind("Hasil ini sudah dihapus dari Riwayat Kreasi.", Date.now(), id, user.userId),
      db.prepare("DELETE FROM generations WHERE id = ? AND user_id = ?").bind(id, user.userId),
    ]);
    await cleanupDeletedFiles(user.userId);
    return json({ deleted: true, id });
  } catch (error) { return errorResponse(error); }
}
