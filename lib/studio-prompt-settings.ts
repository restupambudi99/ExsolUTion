import { features, type Feature } from "../app/feature-data";
import { ApiError, database } from "./studio-api";

export type FeaturePromptSettings = {
  featureId: string;
  basePrompt: string;
  additionalInstructions: string;
  revision: number;
  updatedAt: number | null;
};
export type FeaturePromptUpdate = {
  featureId: string;
  additionalInstructions: string;
  expectedRevision: number;
  reason: string;
};
type SettingsRow = { feature_id: string; additional_instructions: string; revision: number; updated_at: number };
type ChangeRow = { feature_id: string; previous_revision: number; revision: number; previous_instructions: string; additional_instructions: string; reason: string; created_at: number };

function findFeature(id: string, items: Feature[] = features): Feature | undefined {
  for (const item of items) {
    if (item.id === id) return item;
    const found = item.variants && findFeature(id, item.variants);
    if (found) return found;
  }
}

/** Changes are limited to extra directions for existing AI tools. */
export function promptSettingsFeature(featureId: unknown): Feature {
  if (typeof featureId !== "string" || !/^[a-zA-Z0-9_-]{1,100}$/.test(featureId)) {
    throw new ApiError(400, "invalid_feature", "Pilih ID fitur yang valid.");
  }
  const feature = findFeature(featureId);
  if (!feature) throw new ApiError(404, "unknown_feature", "Fitur tidak ditemukan pada katalog studio.");
  if (!["image", "text", "chat"].includes(feature.kind)) {
    throw new ApiError(400, "unsupported_prompt_feature", "Pengaturan prompt tersedia untuk gambar dan teks, termasuk asisten chat studio.");
  }
  return feature;
}

export function validateAdditionalInstructions(value: unknown): string {
  if (typeof value !== "string" || value.length > 3000 || /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(value)) {
    throw new ApiError(400, "invalid_prompt_instructions", "Instruksi tambahan maksimal 3.000 karakter dan harus berupa teks biasa.");
  }
  return value.trim();
}

export function validateFeaturePromptUpdate(value: FeaturePromptUpdate): FeaturePromptUpdate {
  const feature = promptSettingsFeature(value.featureId);
  const additionalInstructions = validateAdditionalInstructions(value.additionalInstructions);
  if (!Number.isSafeInteger(value.expectedRevision) || value.expectedRevision < 0 || value.expectedRevision >= Number.MAX_SAFE_INTEGER) {
    throw new ApiError(400, "invalid_prompt_revision", "Revisi konfigurasi harus berupa bilangan bulat yang valid.");
  }
  if (typeof value.reason !== "string" || !value.reason.trim() || value.reason.length > 500 || /[\x00-\x1f\x7f]/.test(value.reason)) {
    throw new ApiError(400, "invalid_change_reason", "Isi alasan perubahan satu baris antara 1 dan 500 karakter.");
  }
  return { featureId: feature.id, additionalInstructions, expectedRevision: value.expectedRevision, reason: value.reason.trim() };
}

/** This never replaces base intent, image quality or batch variation directions. */
export function appendFeaturePromptInstructions(basePrompt: string, additionalInstructions: string): string {
  const extra = validateAdditionalInstructions(additionalInstructions);
  return extra ? `${basePrompt}\nAdditional studio directions:\n${extra}` : basePrompt;
}

function storageFailure(): ApiError {
  return new ApiError(503, "prompt_settings_unavailable", "Penyimpanan pengaturan prompt belum tersedia. Coba kembali setelah layanan pulih.");
}

function publicSettings(feature: Feature, row: SettingsRow | null): FeaturePromptSettings {
  return {
    featureId: feature.id,
    basePrompt: feature.promptIntent,
    additionalInstructions: row?.additional_instructions ?? "",
    revision: row?.revision ?? 0,
    updatedAt: row?.updated_at ?? null,
  };
}

export async function getFeaturePromptSettings(featureId: string, db?: D1Database): Promise<FeaturePromptSettings> {
  const feature = promptSettingsFeature(featureId);
  try {
    const row = await (db ?? database()).prepare("SELECT feature_id, additional_instructions, revision, updated_at FROM studio_prompt_settings WHERE feature_id = ?")
      .bind(feature.id).first<SettingsRow>();
    return publicSettings(feature, row);
  } catch { throw storageFailure(); }
}

/** Caller enforces owner authorization. Instruction snapshots support a reviewed rollback; actor IDs stay private. */
export async function listPromptChanges(limit = 30, db?: D1Database) {
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) throw new ApiError(400, "invalid_audit_limit", "Jumlah perubahan harus antara 1 dan 100.");
  try {
    const rows = await (db ?? database()).prepare("SELECT feature_id, previous_revision, revision, previous_instructions, additional_instructions, reason, created_at FROM studio_prompt_changes ORDER BY created_at DESC, id DESC LIMIT ?")
      .bind(limit).all<ChangeRow>();
    return rows.results.map((row) => ({ featureId: row.feature_id, previousRevision: row.previous_revision, revision: row.revision, previousInstructions: row.previous_instructions, additionalInstructions: row.additional_instructions, reason: row.reason, createdAt: row.created_at }));
  } catch { throw storageFailure(); }
}

/** CAS and its audit receipt share one atomic D1 transaction. */
export async function updateFeaturePromptSettings(input: FeaturePromptUpdate, actorId: string, db?: D1Database): Promise<FeaturePromptSettings> {
  const update = validateFeaturePromptUpdate(input);
  const feature = promptSettingsFeature(update.featureId);
  if (typeof actorId !== "string" || !actorId || actorId.length > 200 || /[\x00-\x1f\x7f]/.test(actorId)) {
    throw new ApiError(403, "prompt_actor_required", "Identitas administrator diperlukan untuk mengubah prompt.");
  }
  const now = Date.now();
  const changeId = crypto.randomUUID();
  try {
    const connection = db ?? database();
    const result = await connection.batch<SettingsRow>([
      connection.prepare(`INSERT INTO studio_prompt_settings (feature_id, additional_instructions, previous_instructions, revision, updated_at, last_change_id)
        SELECT ?, ?, '', 1, ?, ? WHERE ? = 0 OR EXISTS (SELECT 1 FROM studio_prompt_settings WHERE feature_id = ? AND revision = ?)
        ON CONFLICT(feature_id) DO UPDATE SET additional_instructions = excluded.additional_instructions,
          previous_instructions = studio_prompt_settings.additional_instructions,
          revision = studio_prompt_settings.revision + 1, updated_at = excluded.updated_at, last_change_id = excluded.last_change_id
        WHERE studio_prompt_settings.revision = ?
        RETURNING feature_id, additional_instructions, revision, updated_at`)
        .bind(feature.id, update.additionalInstructions, now, changeId, update.expectedRevision, feature.id, update.expectedRevision, update.expectedRevision),
      // A unique per-call receipt prevents a rejected CAS from auditing another writer's revision.
      connection.prepare(`INSERT INTO studio_prompt_changes (id, feature_id, previous_revision, revision, previous_instructions, additional_instructions, reason, actor_id, created_at)
        SELECT ?, feature_id, ?, revision, previous_instructions, additional_instructions, ?, ?, updated_at FROM studio_prompt_settings WHERE feature_id = ? AND last_change_id = ?`)
        .bind(changeId, update.expectedRevision, update.reason, actorId, feature.id, changeId),
    ]);
    if (result.length !== 2 || result.some((item) => !item.success)) throw storageFailure();
    const row = result[0].results[0];
    if (!row) throw new ApiError(409, "prompt_revision_conflict", "Pengaturan prompt sudah berubah. Baca revisi terbaru sebelum menyimpan lagi.");
    return publicSettings(feature, row);
  } catch (error) {
    if (error instanceof ApiError && error.status === 409) throw error;
    throw storageFailure();
  }
}
