import type { GenerationResponse } from "./studio-client";

export type BatchSlotStatus = "queued" | "running" | "completed" | "failed" | "unresolved" | "cancelled";
export type BatchSlotError = { message: string; code?: string; status?: number; requestId?: string };
export type BatchSlot = {
  index: number;
  status: BatchSlotStatus;
  requestId?: string;
  output?: GenerationResponse;
  error?: BatchSlotError;
  /** Number of POST attempts for this slot across explicit runs. */
  attempts?: number;
  /** A confirmed transient failure is being retried once in this run. */
  retrying?: boolean;
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
  /** Override the bounded retry backoff for tests or a scheduler. */
  retryDelay?: (milliseconds: number) => Promise<void>;
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

function retryableFailure(failure: BatchSlotError): boolean {
  // Transport/timeout/malformed-response errors can hide a completed paid
  // generation. Only an identified, final provider rejection may be retried.
  return !!failure.requestId && [502, 503].includes(failure.status || 0) && failure.code === "provider_unavailable";
}

async function retryBackoff(options: RunBatchOptions): Promise<void> {
  if (options.retryDelay) { await options.retryDelay(750); return; }
  for (let waited = 0; waited < 750 && !options.shouldCancel?.(); waited += 75) {
    await new Promise<void>(resolve => setTimeout(resolve, 75));
  }
}

export function createBatch(featureId: string, total: number): GenerationBatch {
  if (!/^[a-zA-Z0-9_-]{1,100}$/.test(featureId)) throw new Error("Fitur batch tidak valid.");
  if (!Number.isInteger(total) || total < 1 || total > (featureId === "angle-generator" ? 21 : 10)) throw new Error(featureId === "angle-generator" ? "Pilih antara 1 dan 21 sudut." : "Jumlah gambar harus antara 1 dan 10.");
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
  retry.slots = retry.slots.map(slot => slot.status === "failed" ? { index: slot.index, status: "queued", ...(slot.attempts ? { attempts: slot.attempts } : {}) } : slot);
  return retry;
}

export function batchSummary(batch: GenerationBatch): BatchSummary {
  const summary: BatchSummary = { total: batch.total, completed: 0, failed: 0, unresolved: 0, queued: 0, running: 0, cancelled: 0 };
  for (const slot of batch.slots) summary[slot.status]++;
  return summary;
}

/** Sequential slots, with at most one retry of an identified transient failure. */
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
  let stopBatch = false;
  for (const slot of current.slots) {
    if (!selected.has(slot.index) || slot.status !== "queued") continue;
    if (options.shouldCancel?.()) { cancelQueued(); break; }
    let automaticRetries = 0;
    let attempts = slot.attempts || 0;
    while (true) {
      attempts++;
      update(slot.index, { status: "running", attempts, retrying: automaticRetries > 0, error: undefined, requestId: undefined });
      let output: GenerationResponse;
      try {
        // The caller creates a fresh request ID for each attempt. Successful
        // slots are never selected again, including during an explicit retry.
        output = await options.run(slot.index, current.batchId);
        if (!output.results?.length) throw Object.assign(new Error("Provider tidak mengembalikan hasil gambar."), { code: "provider_empty_response", requestId: output.requestId });
      } catch (error) {
        const unresolved = options.isUnresolved(error);
        const failure = describeError(error);
        const stop = unresolved || fatalFailure(error) || !!options.shouldStop?.(error);
        if (!stop && automaticRetries === 0 && retryableFailure(failure) && !options.shouldCancel?.()) {
          update(slot.index, { status: "running", retrying: true, error: failure, requestId: failure.requestId });
          await retryBackoff(options);
          if (!options.shouldCancel?.()) { automaticRetries++; continue; }
          update(slot.index, { status: "failed", retrying: false, error: failure, requestId: failure.requestId });
          cancelQueued(); stopBatch = true; break;
        }
        update(slot.index, { status: unresolved ? "unresolved" : "failed", retrying: false, error: failure, ...(failure.requestId ? { requestId: failure.requestId } : {}) });
        if (stop) stopBatch = true;
        break;
      }
      // Mark the paid request completed before invoking presentation callbacks.
      // A UI callback error must never make this slot eligible for another POST.
      update(slot.index, { status: "completed", retrying: false, output: cloneOutput(output), error: undefined, ...(output.requestId ? { requestId: output.requestId } : {}) });
      options.onResult?.(cloneOutput(output), slot.index);
      break;
    }
    if (stopBatch) break;
  }
  return snapshot(current);
}
