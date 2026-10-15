import { bucket, database } from "./studio-api";

/** Retry a small owner-scoped batch. Failed work stays durable for the next visit. */
export async function cleanupDeletedFiles(userId: string): Promise<void> {
  try {
    const db = database();
    const files = (await db.prepare("SELECT id, object_key FROM studio_file_cleanup WHERE user_id = ? ORDER BY created_at, id LIMIT 20")
      .bind(userId).all<{ id: string; object_key: string }>()).results;
    if (!files.length) return;
    // R2 deletion is idempotent: if either operation fails, retrying is safe.
    await bucket().delete(files.map((file) => file.object_key));
    await db.batch(files.map((file) => db.prepare("DELETE FROM studio_file_cleanup WHERE id = ? AND user_id = ? AND object_key = ?")
      .bind(file.id, userId, file.object_key)));
  } catch {
    // History was already removed atomically. Storage downtime must not bring it back.
    // Never expose object keys or infrastructure failures to the client.
  }
}
