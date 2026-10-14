import { bucket, database } from "./studio-api";
import type { GenerateInput, OutputKind } from "./studio-validation";
import type { ProviderOutput } from "./studio-provider";

export type StudioResult = { id: string; kind: OutputKind; url?: string; text?: string; mimeType?: string };
export type FileRow = { id: string; user_id: string; generation_id: string | null; object_key: string; mime_type: string; byte_size: number; original_name: string; created_at: number };

function extension(mime: string) {
  return ({ "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "audio/wav": "wav", "audio/mpeg": "mp3", "audio/ogg": "ogg", "audio/mp4": "m4a", "video/mp4": "mp4", "video/webm": "webm" } as Record<string, string>)[mime] ?? "bin";
}

export async function saveFile(userId: string, bytes: Uint8Array, mimeType: string, name: string, generationId: string | null = null) {
  const id = crypto.randomUUID();
  // An opaque object key prevents user IDs or original filenames from leaking into storage paths.
  const objectKey = `private/${id}.${extension(mimeType)}`;
  const originalName = name.replace(/[\x00-\x1f\x7f\\/]/g, "_").slice(0,180) || `file.${extension(mimeType)}`;
  await bucket().put(objectKey, bytes, { httpMetadata: { contentType: mimeType }, customMetadata: { fileId: id } });
  try {
    await database().prepare("INSERT INTO studio_files (id, user_id, generation_id, object_key, mime_type, byte_size, original_name, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
      .bind(id, userId, generationId, objectKey, mimeType, bytes.byteLength, originalName, Date.now()).run();
  } catch (error) {
    await bucket().delete(objectKey).catch(() => undefined);
    throw error;
  }
  return { id, url: `/api/files/${id}`, mimeType, size: bytes.byteLength, name: originalName };
}

export async function ownedFile(userId: string, id: string): Promise<FileRow | null> {
  return database().prepare("SELECT * FROM studio_files WHERE id = ? AND user_id = ?").bind(id, userId).first<FileRow>();
}

export async function persistGeneration(userId: string, input: GenerateInput, outputs: ProviderOutput[]) {
  const generationId = crypto.randomUUID();
  const results: StudioResult[] = [];
  try {
    for (const output of outputs) {
      if (output.kind === "text") {
        results.push({ id: crypto.randomUUID(), kind: "text", text: output.text, mimeType: "text/plain" });
      } else if (output.bytes && output.mimeType) {
        const file = await saveFile(userId, output.bytes, output.mimeType, `${input.featureId}-${Date.now()}.${extension(output.mimeType)}`, generationId);
        results.push({ id: file.id, kind: output.kind, url: file.url, mimeType: file.mimeType });
      }
    }
    const createdAt = Date.now();
    // Only the selected controls and output metadata are stored. The request API key is intentionally excluded.
    await database().prepare("INSERT INTO generations (id, user_id, feature_id, prompt, options_json, results_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .bind(generationId, userId, input.featureId, input.prompt, JSON.stringify(input.options), JSON.stringify(results), createdAt).run();
    return { id: generationId, results, createdAt };
  } catch (error) {
    const files = await database().prepare("SELECT object_key FROM studio_files WHERE user_id = ? AND generation_id = ?").bind(userId, generationId).all<{ object_key: string }>();
    if (files.results.length) await bucket().delete(files.results.map((file) => file.object_key)).catch(() => undefined);
    await database().prepare("DELETE FROM studio_files WHERE user_id = ? AND generation_id = ?").bind(userId, generationId).run().catch(() => undefined);
    throw error;
  }
}
