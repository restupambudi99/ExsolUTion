import type { GenerationResponse } from "./studio-client";

export type BatchSlotStatus = "queued" | "running" | "completed" | "failed" | "unresolved" | "cancelled";
export type BatchSlotError = { message: string; code?: string; status?: number; requestId?: string };
export type BatchSlot = {
  index: number;
  status: BatchSlotStatus;
  requestId?: string;
  output?: GenerationResponse;
  error?: BatchSlotError;
};
export type GenerationBatch = {
  batchId: string;
  featureId: string;
  total: number;
  slots: BatchSlot[];
  /** Only these original, one-based slots may run during the next explicit action. */
  runIndexes: number[];
};
export type BatchSummary = { total: number; completed: number; failed: number; unresolved: number; queued: number; running: number; cancelled: number };
export type RunBatchOptions = {
  run: (index: number, batchId: string) => Promise<GenerationResponse>;
  /** Check the request ledger/pending metadata, rather than guessing from HTTP status. */
  isUnresolved: (error: unknown) => boolean;
  onUpdate?: (batch: GenerationBatch) => void;
  onResult?: (output: GenerationResponse, index: number) => void;
  shouldCancel?: () => boolean;
  shouldStop?: (error: unknown) => boolean;
};

function cloneOutput(output: GenerationResponse): GenerationResponse {
  return { ...output, results: output.results.map(result => ({ ...result, ...(result.warnings ? { warnings: [...result.warnings] } : {}) })), ...(output.warnings ? { warnings: [...output.warnings] } : {}) };
}

/** All exposed updates are independent snapshots; no React state is mutated. */
function snapshot(batch: GenerationBatch): GenerationBatch {
  return { ...batch, runIndexes: [...batch.runIndexes], slots: batch.slots.map(slot => ({ ...slot, ...(slot.output ? { output: cloneOutput(slot.output) } : {}), ...(slot.error ? { error: { ...slot.error } } : {}) })) };
}

function describeError(error: unknown): BatchSlotError {
  const item = error && typeof error === "object" ? error as Record<string, unknown> : {};
  return {
    message: typeof item.message === "string" && item.message ? item.message : "Permintaan gambar belum berhasil.",
    ...(typeof item.code === "string" ? { code: item.code } : {}),
    ...(typeof item.status === "number" ? { status: item.status } : {}),
    ...(typeof item.requestId === "string" ? { requestId: item.requestId } : {}),
  };
}

function fatalFailure(error: unknown): boolean {
  const failure = describeError(error);
  return [401, 403, 429].includes(failure.status || 0) || /^(authentication_required|access_denied|provider_(authentication_failed|token_revoked|not_configured|configuration_invalid)|router_provider_reauthentication_required)$/.test(failure.code || "");
}

export function createBatch(featureId: string, total: number): GenerationBatch {
  if (!/^[a-zA-Z0-9_-]{1,100}$/.test(featureId)) throw new Error("Fitur batch tidak valid.");
  if (!Number.isInteger(total) || total < 1 || total > 10) throw new Error("Jumlah gambar harus antara 1 dan 10.");
  const indexes = Array.from({ length: total }, (_, index) => index + 1);
  return { batchId: crypto.randomUUID(), featureId, total, slots: indexes.map(index => ({ index, status: "queued" })), runIndexes: indexes };
}

/**
 * An explicit retry targets confirmed failures only. Unattempted slots after an
 * interruption retain their queued state, but are deliberately outside this run.
 * The caller retains the original inputs in memory; this module stores none.
 */
export function retryFailed(batch: GenerationBatch): GenerationBatch {
  const retry = snapshot(batch);
  retry.runIndexes = retry.slots.filter(slot => slot.status === "failed").map(slot => slot.index);
  retry.slots = retry.slots.map(slot => slot.status === "failed" ? { index: slot.index, status: "queued" } : slot);
  return retry;
}

export function batchSummary(batch: GenerationBatch): BatchSummary {
  const summary: BatchSummary = { total: batch.total, completed: 0, failed: 0, unresolved: 0, queued: 0, running: 0, cancelled: 0 };
  for (const slot of batch.slots) summary[slot.status]++;
  return summary;
}

/** Sequential requests, with no automatic replay of any previously sent slot. */
export async function runBatch(batch: GenerationBatch, options: RunBatchOptions): Promise<GenerationBatch> {
  let current = snapshot(batch);
  // Neither an interrupted request nor another live runner may be interpreted as
  // a missing image. Resolve it with a read before explicitly continuing.
  if (current.slots.some(slot => slot.status === "unresolved" || slot.status === "running")) return current;
  const selected = new Set(current.runIndexes);
  const update = (index: number, patch: Partial<BatchSlot>) => {
    current = { ...current, slots: current.slots.map(slot => slot.index === index ? { ...slot, ...patch } : slot) };
    options.onUpdate?.(snapshot(current));
  };
  const cancelQueued = () => {
    current = { ...current, slots: current.slots.map(slot => slot.status === "queued" && selected.has(slot.index) ? { ...slot, status: "cancelled" } : slot) };
    options.onUpdate?.(snapshot(current));
  };
  for (const slot of current.slots) {
    if (!selected.has(slot.index) || slot.status !== "queued") continue;
    if (options.shouldCancel?.()) { cancelQueued(); break; }
    update(slot.index, { status: "running" });
    let output: GenerationResponse;
    try {
      output = await options.run(slot.index, current.batchId);
      if (!output.results?.length) throw Object.assign(new Error("Provider tidak mengembalikan hasil gambar."), { code: "provider_empty_response", requestId: output.requestId });
    } catch (error) {
      const unresolved = options.isUnresolved(error);
      const failure = describeError(error);
      update(slot.index, { status: unresolved ? "unresolved" : "failed", error: failure, ...(failure.requestId ? { requestId: failure.requestId } : {}) });
      if (unresolved || fatalFailure(error) || options.shouldStop?.(error)) break;
      continue;
    }
    // Mark the paid request completed before invoking presentation callbacks.
    // A UI callback error must never make this slot eligible for another POST.
    update(slot.index, { status: "completed", output: cloneOutput(output), error: undefined, ...(output.requestId ? { requestId: output.requestId } : {}) });
    options.onResult?.(cloneOutput(output), slot.index);
  }
  return snapshot(current);
}
