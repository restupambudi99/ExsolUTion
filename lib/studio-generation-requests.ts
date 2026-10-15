import { ApiError, database } from "./studio-api";
import type { GenerateInput } from "./studio-validation";
import type { SelectedProvider } from "./studio-config";
import type { StudioResult } from "./studio-storage";

export const REQUEST_PENDING_MS = 5 * 60_000;
export type GenerationResponse = { id: string; results: StudioResult[]; createdAt: number; warnings?: string[]; requestId: string };
export type GenerationFailure = { results: never[]; error: string; code: string; diagnostic?: unknown; requestId: string };
export type GenerationRequestRow = {
  user_id: string; request_id: string; fingerprint: string; generation_id: string;
  status: "pending" | "completed" | "failed"; response_json: string | null;
  error_status: number | null; created_at: number; updated_at: number;
};

export function generationRequestId(value: unknown): string {
  if (value === undefined) return crypto.randomUUID();
  if (typeof value !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    throw new ApiError(400,"invalid_request_id","ID permintaan tidak valid. Mulai proses baru dari aplikasi.");
  }
  return value.toLowerCase();
}

function stable(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  const item = value as Record<string,unknown>;
  return `{${Object.keys(item).sort().filter((key) => item[key] !== undefined).map((key) => `${JSON.stringify(key)}:${stable(item[key])}`).join(",")}}`;
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest),(byte) => byte.toString(16).padStart(2,"0")).join("");
}

/** Store only a hash: never API keys, uploaded photo bytes, or provider payloads. */
export async function generationFingerprint(input: GenerateInput, selected: SelectedProvider) {
  const settings = selected.settings;
  const model = input.kind === "image" ? settings.imageModel : input.kind === "audio" ? settings.audioModel : settings.textModel;
  const provider = selected.provider === "9router"
    ? { provider: selected.provider, model, baseUrl: selected.settings.baseUrl, voice: selected.settings.voice }
    : { provider: selected.provider, model };
  const images = [];
  // Hash sequentially to avoid holding encodings for all reference photos at once.
  for (const image of input.images) images.push({ hash: await sha256(image.data), mimeType: image.mimeType, fieldId: image.fieldId, role: image.role });
  return sha256(stable({ featureId: input.featureId, kind: input.kind, prompt: input.prompt, options: input.options, images, provider }));
}

export async function ownedGenerationRequest(userId: string, requestId: string) {
  return database().prepare("SELECT * FROM studio_generation_requests WHERE user_id = ? AND request_id = ?")
    .bind(userId,requestId).first<GenerationRequestRow>();
}

export async function claimGenerationRequest(userId: string, requestId: string, fingerprint: string) {
  const now = Date.now();
  // A single SQLite statement atomically enforces both deduplication and the
  // per-user concurrency ceiling, including requests from different tabs/isolate instances.
  const claimed = await database().prepare(`INSERT INTO studio_generation_requests
    (user_id, request_id, fingerprint, generation_id, status, created_at, updated_at)
    SELECT ?, ?, ?, ?, 'pending', ?, ?
    WHERE (SELECT count(*) FROM studio_generation_requests WHERE user_id = ? AND status = 'pending' AND created_at >= ?) < 2
    ON CONFLICT(user_id, request_id) DO NOTHING RETURNING *`)
    .bind(userId,requestId,fingerprint,crypto.randomUUID(),now,now,userId,now-REQUEST_PENDING_MS).first<GenerationRequestRow>();
  if (claimed) return { claimed: true as const, row: claimed };
  const existing = await ownedGenerationRequest(userId,requestId);
  if (!existing) throw new ApiError(429,"generation_concurrency_limited","Masih ada dua permintaan yang diproses. Tunggu hasilnya sebelum membuat permintaan baru.");
  if (existing.fingerprint !== fingerprint) throw new ApiError(409,"request_id_conflict","ID permintaan ini sudah dipakai untuk instruksi lain. Gunakan proses baru agar hasil tidak tertukar.");
  return { claimed: false as const, row: existing };
}

export async function completeGenerationRequest(userId: string, requestId: string, response: GenerationResponse) {
  await database().prepare("UPDATE studio_generation_requests SET status = 'completed', response_json = ?, error_status = NULL, updated_at = ? WHERE user_id = ? AND request_id = ? AND status = 'pending'")
    .bind(JSON.stringify(response),Date.now(),userId,requestId).run();
}

export async function failGenerationRequest(userId: string, requestId: string, error: GenerationFailure, status: number) {
  await database().prepare("UPDATE studio_generation_requests SET status = 'failed', response_json = ?, error_status = ?, updated_at = ? WHERE user_id = ? AND request_id = ? AND status = 'pending'")
    .bind(JSON.stringify(error),status,Date.now(),userId,requestId).run();
}

/** A successful generation is also a recovery receipt if a final ledger update was interrupted. */
export async function generationRequestState(row: GenerationRequestRow) {
  if (row.status === "completed" && row.response_json) return { status: "completed" as const, data: JSON.parse(row.response_json) as GenerationResponse };
  if (row.status === "failed" && row.response_json) return { status: "failed" as const, ...(JSON.parse(row.response_json) as GenerationFailure), errorStatus: row.error_status || 500 };
  const saved = await database().prepare("SELECT id, results_json, created_at FROM generations WHERE id = ? AND user_id = ?")
    .bind(row.generation_id,row.user_id).first<{ id: string; results_json: string; created_at: number }>();
  if (saved) {
    const results = JSON.parse(saved.results_json) as StudioResult[];
    const warnings = [...new Set(results.flatMap((result) => result.warnings ?? []))];
    const data: GenerationResponse = { id: saved.id, results, createdAt: saved.created_at, requestId: row.request_id, ...(warnings.length ? { warnings } : {}) };
    // A readable saved result must remain available even if receipt repair is
    // temporarily unwritable. The next lookup can retry this idempotent update.
    await completeGenerationRequest(row.user_id,row.request_id,data).catch(() => undefined);
    return { status: "completed" as const, data };
  }
  return { status: Date.now()-row.created_at >= REQUEST_PENDING_MS ? "unknown" as const : "pending" as const, requestId: row.request_id };
}
