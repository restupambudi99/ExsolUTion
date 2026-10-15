import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const code = ts.transpileModule(readFileSync(new URL("./studio-batch.ts", import.meta.url), "utf8"), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText;
const { createBatch, runBatch, retryFailed, batchSummary } = await import(`data:text/javascript;base64,${Buffer.from(code).toString("base64")}`);

const result = index => ({ id: `generation-${index}`, requestId: `request-${index}`, results: [{ id: `result-${index}`, kind: "image", url: `/api/files/result-${index}`, warnings: ["Synthetic warning"] }] });
const failure = (index, fields = {}) => Object.assign(new Error(`Synthetic failure ${index}`), { requestId: `failed-${index}`, code: "provider_unavailable", status: 502, ...fields });
const terminal = () => false;

test("four successful slots keep their original indexes and stable batch ID", async () => {
  const initial = createBatch("food-selfie", 4), calls = [], outputs = [], updates = [];
  const finished = await runBatch(initial, { run: async (index, batchId) => { calls.push({ index, batchId }); return result(index); }, isUnresolved: terminal, onUpdate: batch => updates.push(batch), onResult: (output, index) => outputs.push({ output, index }) });
  assert.deepEqual(calls.map(call => call.index), [1, 2, 3, 4]);
  assert.equal(new Set(calls.map(call => call.batchId)).size, 1);
  assert.equal(calls[0].batchId, initial.batchId);
  assert.deepEqual(batchSummary(finished), { total: 4, completed: 4, failed: 0, unresolved: 0, queued: 0, running: 0, cancelled: 0 });
  assert.equal(outputs.length, 4);
  assert.deepEqual(initial.slots.map(slot => slot.status), ["queued", "queued", "queued", "queued"]);
  assert.equal(updates[0].slots[0].status, "running");
  assert.equal(updates[1].slots[0].status, "completed");
  assert.deepEqual(finished.slots.map(slot => slot.requestId), ["request-1", "request-2", "request-3", "request-4"]);
});

test("a failed fourth slot preserves three successful outputs and records its request metadata", async () => {
  const finished = await runBatch(createBatch("food-selfie", 4), { run: async index => { if (index === 4) throw failure(index); return result(index); }, isUnresolved: terminal });
  const summary = batchSummary(finished);
  assert.equal(summary.completed, 3); assert.equal(summary.failed, 1);
  assert.deepEqual(finished.slots.slice(0, 3).map(slot => slot.output.results[0].id), ["result-1", "result-2", "result-3"]);
  assert.deepEqual(finished.slots[3].error, { message: "Synthetic failure 4", requestId: "failed-4", code: "provider_unavailable", status: 502 });
});

test("explicit retry sends only the failed slot and retains the original batch and scene index", async () => {
  const failed = await runBatch(createBatch("food-selfie", 4), { run: async index => { if (index === 4) throw failure(index); return result(index); }, isUnresolved: terminal });
  const prepared = retryFailed(failed), calls = [];
  assert.deepEqual(prepared.runIndexes, [4]);
  assert.equal(failed.slots[3].status, "failed");
  const completed = await runBatch(prepared, { run: async (index, batchId) => { calls.push({ index, batchId }); return { ...result(index), requestId: "retry-request-4" }; }, isUnresolved: terminal });
  assert.deepEqual(calls, [{ index: 4, batchId: failed.batchId }]);
  assert.equal(batchSummary(completed).completed, 4);
  assert.equal(completed.slots[3].requestId, "retry-request-4");
  assert.deepEqual(completed.slots.slice(0, 3), failed.slots.slice(0, 3));
});

test("a nonfatal failure in the middle still attempts the remaining chosen slots once", async () => {
  const calls = [];
  const finished = await runBatch(createBatch("food-selfie", 4), { run: async index => { calls.push(index); if (index === 2) throw failure(index); return result(index); }, isUnresolved: terminal });
  assert.deepEqual(calls, [1, 2, 3, 4]);
  assert.deepEqual(finished.slots.map(slot => slot.status), ["completed", "failed", "completed", "completed"]);
});

test("an ambiguous response stops the batch and never becomes eligible for retry", async () => {
  const calls = [];
  const interrupted = await runBatch(createBatch("food-selfie", 4), { run: async index => { calls.push(index); if (index === 2) throw failure(index, { code: "gateway_timeout" }); return result(index); }, isUnresolved: () => true });
  assert.deepEqual(calls, [1, 2]);
  assert.deepEqual(interrupted.slots.map(slot => slot.status), ["completed", "unresolved", "queued", "queued"]);
  const prepared = retryFailed(interrupted);
  assert.deepEqual(prepared.runIndexes, []);
  await runBatch(prepared, { run: async () => { assert.fail("Unresolved requests cannot be replayed"); }, isUnresolved: terminal });
  await runBatch(interrupted, { run: async () => { assert.fail("Queued slots cannot run while a response remains unresolved"); }, isUnresolved: terminal });
});

test("retry excludes unattempted queued slots left after an interruption", async () => {
  const interrupted = await runBatch(createBatch("food-selfie", 4), { run: async index => { if (index === 1) throw failure(index); if (index === 2) throw failure(index, { code: "gateway_timeout" }); return result(index); }, isUnresolved: error => error.code === "gateway_timeout" });
  // Simulate a subsequent GET confirming the ambiguous request failed.
  const resolved = { ...interrupted, slots: interrupted.slots.map(slot => slot.index === 2 ? { ...slot, status: "failed" } : slot) };
  const calls = [];
  const retried = await runBatch(retryFailed(resolved), { run: async index => { calls.push(index); return result(index); }, isUnresolved: terminal });
  assert.deepEqual(calls, [1, 2]);
  assert.deepEqual(retried.slots.map(slot => slot.status), ["completed", "completed", "queued", "queued"]);
});

test("completed and currently running slots cannot be replayed", async () => {
  const complete = await runBatch(createBatch("food-selfie", 1), { run: async index => result(index), isUnresolved: terminal });
  await runBatch(complete, { run: async () => { assert.fail("Completed slot replayed"); }, isUnresolved: terminal });
  const running = { ...createBatch("food-selfie", 1), slots: [{ index: 1, status: "running" }] };
  await runBatch(running, { run: async () => { assert.fail("Running slot replayed"); }, isUnresolved: terminal });
});

test("cancellation completes the current request and marks only remaining selected slots cancelled", async () => {
  let cancelled = false;
  const calls = [];
  const stopped = await runBatch(createBatch("food-selfie", 4), { run: async index => { calls.push(index); cancelled = true; return result(index); }, isUnresolved: terminal, shouldCancel: () => cancelled });
  assert.deepEqual(calls, [1]);
  assert.deepEqual(stopped.slots.map(slot => slot.status), ["completed", "cancelled", "cancelled", "cancelled"]);
  assert.equal(batchSummary(stopped).cancelled, 3);
  assert.deepEqual(retryFailed(stopped).runIndexes, []);
});

test("authentication and quota failures stop additional provider requests", async () => {
  for (const [status, code] of [[401, "provider_authentication_failed"], [403, "access_denied"], [429, "rate_limited"]]) {
    const calls = [];
    const stopped = await runBatch(createBatch("food-selfie", 4), { run: async index => { calls.push(index); throw failure(index, { status, code }); }, isUnresolved: terminal });
    assert.deepEqual(calls, [1]);
    assert.deepEqual(stopped.slots.map(slot => slot.status), ["failed", "queued", "queued", "queued"]);
  }
});

test("the caller can stop on a definitive global error without treating remaining slots as failed", async () => {
  const calls = [];
  const stopped = await runBatch(createBatch("food-selfie", 3), { run: async index => { calls.push(index); throw failure(index); }, isUnresolved: terminal, shouldStop: () => true });
  assert.deepEqual(calls, [1]);
  assert.equal(batchSummary(stopped).failed, 1); assert.equal(batchSummary(stopped).queued, 2);
});

test("observer mutations cannot change later snapshots, result callbacks, or the returned batch", async () => {
  const callbacks = [];
  const complete = await runBatch(createBatch("food-selfie", 2), { run: async index => result(index), isUnresolved: terminal, onUpdate: batch => { batch.runIndexes.length = 0; batch.slots[0].status = "failed"; if (batch.slots[0].output) batch.slots[0].output.results[0].warnings.push("Injected observer mutation"); }, onResult: output => { callbacks.push(output); output.results[0].id = "Mutated presentation output"; } });
  assert.equal(batchSummary(complete).completed, 2);
  assert.deepEqual(complete.slots.map(slot => slot.output.results[0].id), ["result-1", "result-2"]);
  assert.deepEqual(complete.slots[0].output.results[0].warnings, ["Synthetic warning"]);
  assert.equal(callbacks.length, 2);
});

test("a presentation callback error leaves the completed slot in the latest published snapshot", async () => {
  let latest;
  await assert.rejects(runBatch(createBatch("food-selfie", 1), { run: async index => result(index), isUnresolved: terminal, onUpdate: batch => { latest = batch; }, onResult: () => { throw new Error("Synthetic renderer failure"); } }), /Synthetic renderer failure/);
  assert.equal(latest.slots[0].status, "completed");
  assert.deepEqual(retryFailed(latest).runIndexes, []);
});

test("empty provider outputs are failures rather than completed image slots", async () => {
  const complete = await runBatch(createBatch("food-selfie", 1), { run: async () => ({ id: "empty", requestId: "empty-request", results: [] }), isUnresolved: terminal });
  assert.equal(complete.slots[0].status, "failed");
  assert.equal(complete.slots[0].error.code, "provider_empty_response");
  assert.equal(complete.slots[0].requestId, "empty-request");
});

test("batch snapshots contain only output/error metadata, with no request credentials or input bytes", async () => {
  const completed = await runBatch(createBatch("food-selfie", 1), { run: async index => result(index), isUnresolved: terminal });
  assert.deepEqual(Object.keys(completed).sort(), ["batchId", "featureId", "runIndexes", "slots", "total"]);
  assert.equal(/apiKey|routerConfig|images|prompt/.test(JSON.stringify(completed)), false);
});

test("invalid feature and count cannot create an unbounded or fractional batch", () => {
  for (const count of [0, -1, 1.5, 11, NaN, Infinity]) assert.throws(() => createBatch("food-selfie", count));
  assert.throws(() => createBatch("../food-selfie", 4));
});
