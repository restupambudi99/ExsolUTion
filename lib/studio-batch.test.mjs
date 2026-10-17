import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const code = ts.transpileModule(readFileSync(new URL("./studio-batch.ts", import.meta.url), "utf8"), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText;
const { createBatch, runBatch, retryFailed, batchSummary, isBatchBlockingError } = await import(`data:text/javascript;base64,${Buffer.from(code).toString("base64")}`);

const result = index => ({ id: `generation-${index}`, requestId: `request-${index}`, results: [{ id: `result-${index}`, kind: "image", url: `/api/files/result-${index}`, warnings: ["Synthetic warning"] }] });
const failure = (index, fields = {}) => Object.assign(new Error(`Synthetic failure ${index}`), { requestId: `failed-${index}`, code: "provider_invalid_response", status: 502, ...fields });
const terminal = () => false;

test("21 camera slots retain one request per angle while ordinary features keep their limit", async () => {
  assert.throws(() => createBatch("affiliate", 21));
  assert.throws(() => createBatch("angle-generator", 22));
  const batch = createBatch("angle-generator", 21), calls = [];
  const complete = await runBatch(batch, { run: async index => { calls.push(index); return result(index); }, isUnresolved: terminal });
  assert.deepEqual(calls, Array.from({ length: 21 }, (_, index) => index + 1));
  assert.equal(batchSummary(complete).completed, 21);
  assert.deepEqual(retryFailed(complete).runIndexes, []);
});

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
  assert.deepEqual(finished.slots[3].error, { message: "Synthetic failure 4", requestId: "failed-4", code: "provider_invalid_response", status: 502 });
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

test("one final transient failure in a four-image batch recovers only its missing slot", async () => {
  const calls = [], updates = [], outputs = [], delays = [];
  let failedFourth = false;
  const initial = createBatch("food-selfie", 4);
  const completed = await runBatch(initial, {
    run: async (index, batchId) => {
      const requestId = `attempt-${calls.length + 1}`;
      calls.push({ index, batchId, requestId });
      if (index === 4 && !failedFourth) { failedFourth = true; throw failure(index, { code: "provider_unavailable", requestId }); }
      return { ...result(index), requestId };
    },
    isUnresolved: terminal,
    retryDelay: async delay => { delays.push(delay); },
    onUpdate: batch => updates.push(batch),
    onResult: (output, index) => outputs.push({ output, index }),
  });
  assert.deepEqual(calls.map(call => call.index), [1, 2, 3, 4, 4]);
  assert.equal(new Set(calls.map(call => call.requestId)).size, 5);
  assert.equal(new Set(calls.map(call => call.batchId)).size, 1);
  assert.equal(calls[4].batchId, initial.batchId);
  assert.deepEqual(delays, [750]);
  assert.equal(batchSummary(completed).completed, 4);
  assert.deepEqual(completed.slots.map(slot => slot.attempts), [1, 1, 1, 2]);
  assert.deepEqual(outputs.map(output => output.index), [1, 2, 3, 4]);
  assert.ok(updates.some(batch => batch.slots[3].status === "running" && batch.slots[3].retrying && batch.slots[3].error?.code === "provider_unavailable"));
  assert.equal(completed.slots[3].retrying, false);
  assert.equal(completed.slots[3].requestId, "attempt-5");
  assert.deepEqual(retryFailed(completed).runIndexes, []);
});

test("two transient failures stop retrying that slot, preserve successful images, and continue the batch", async () => {
  const calls = [];
  const failed = await runBatch(createBatch("food-selfie", 4), {
    run: async index => { calls.push(index); if (index === 2) throw failure(index, { code: "provider_unavailable", requestId: `request-${calls.length}` }); return result(index); },
    isUnresolved: terminal, retryDelay: async () => {},
  });
  assert.deepEqual(calls, [1, 2, 2, 3, 4]);
  assert.deepEqual(failed.slots.map(slot => slot.status), ["completed", "failed", "completed", "completed"]);
  assert.equal(failed.slots[1].attempts, 2);
  assert.equal(failed.slots[1].requestId, "request-3");
  const manualCalls = [];
  const finished = await runBatch(retryFailed(failed), { run: async index => { manualCalls.push(index); return result(index); }, isUnresolved: terminal });
  assert.deepEqual(manualCalls, [2]);
  assert.equal(finished.slots[1].attempts, 3);
  assert.deepEqual(finished.slots.filter(slot => slot.index !== 2), failed.slots.filter(slot => slot.index !== 2));
});

test("a full provider outage pauses 21 angles after at most four definitive requests", async () => {
  const calls = [], updates = [];
  const initial = createBatch("angle-generator", 21);
  const stopped = await runBatch(initial, {
    run: async index => { calls.push(index); throw failure(index, { code: "provider_unavailable", status: calls.length % 2 ? 502 : 503, requestId: `request-${calls.length}` }); },
    isUnresolved: terminal, retryDelay: async () => {}, onUpdate: batch => updates.push(batch),
  });
  assert.deepEqual(calls, [1, 1, 2, 2]);
  assert.equal(stopped.stopReason, "provider_outage");
  assert.deepEqual(batchSummary(stopped), { total: 21, completed: 0, failed: 2, unresolved: 0, queued: 19, running: 0, cancelled: 0 });
  assert.deepEqual(stopped.slots.slice(0, 2).map(slot => slot.attempts), [2, 2]);
  assert.ok(stopped.slots.slice(2).every(slot => slot.requestId === undefined && slot.attempts === undefined));
  assert.equal(updates.at(-1).stopReason, "provider_outage");
  assert.equal(initial.stopReason, undefined);
  await runBatch(stopped, { run: async () => assert.fail("A paused queue cannot automatically resume"), isUnresolved: terminal });
  const retry = retryFailed(stopped), retried = [];
  assert.equal(retry.stopReason, undefined);
  assert.equal(stopped.stopReason, "provider_outage");
  assert.deepEqual(retry.runIndexes, [1, 2]);
  const recovered = await runBatch(retry, { run: async index => { retried.push(index); return result(index); }, isUnresolved: terminal });
  assert.deepEqual(retried, [1, 2]);
  assert.equal(batchSummary(recovered).completed, 2);
  assert.equal(batchSummary(recovered).queued, 19);
});

test("successful images reset the outage streak while later consecutive failures still pause safely", async () => {
  const calls = [];
  const stopped = await runBatch(createBatch("affiliate", 5), {
    run: async index => { calls.push(index); if ([1, 3, 4].includes(index)) throw failure(index, { code: "provider_unavailable", requestId: `request-${calls.length}` }); return result(index); },
    isUnresolved: terminal, retryDelay: async () => {},
  });
  assert.deepEqual(calls, [1, 1, 2, 3, 3, 4, 4]);
  assert.equal(stopped.stopReason, "provider_outage");
  assert.deepEqual(stopped.slots.map(slot => slot.status), ["failed", "completed", "failed", "failed", "queued"]);
  assert.equal(stopped.slots[1].output.results[0].id, "result-2");
  assert.deepEqual(retryFailed(stopped).runIndexes, [1, 3, 4]);
});

test("scene-specific non-outage failures reset the streak rather than falsely opening the circuit", async () => {
  const calls = [];
  const finished = await runBatch(createBatch("affiliate", 4), {
    run: async index => {
      calls.push(index);
      if ([1, 3].includes(index)) throw failure(index, { code: "provider_unavailable", requestId: `request-${calls.length}` });
      if (index === 2) throw failure(index, { code: "provider_rejected", status: 422 });
      return result(index);
    }, isUnresolved: terminal, retryDelay: async () => {},
  });
  assert.deepEqual(calls, [1, 1, 2, 3, 3, 4]);
  assert.equal(finished.stopReason, undefined);
  assert.deepEqual(finished.slots.map(slot => slot.status), ["failed", "failed", "failed", "completed"]);
});

test("an unresolved 21-angle request stops after one attempt and never counts as a confirmed outage", async () => {
  const calls = [];
  const stopped = await runBatch(createBatch("angle-generator", 21), {
    run: async index => { calls.push(index); throw failure(index, { code: "provider_unavailable", status: 503 }); },
    isUnresolved: () => true, retryDelay: async () => assert.fail("An unresolved paid request cannot be replayed"),
  });
  assert.deepEqual(calls, [1]);
  assert.equal(stopped.stopReason, undefined);
  assert.equal(stopped.slots[0].status, "unresolved");
  assert.equal(batchSummary(stopped).queued, 20);
  const retry = retryFailed(stopped);
  assert.deepEqual(retry.runIndexes, []);
  assert.deepEqual(retry.slots, stopped.slots);
  await runBatch(retry, { run: async () => assert.fail("Unresolved slots cannot be replayed"), isUnresolved: terminal });
});

test("9Router no-image failures stop the batch immediately without a transient retry", async () => {
  const calls = [], noImage = failure(1, { code: "router_image_no_output", status: 502 });
  assert.equal(isBatchBlockingError(noImage), true);
  const stopped = await runBatch(createBatch("angle-generator", 21), {
    run: async index => { calls.push(index); throw noImage; }, isUnresolved: terminal,
    retryDelay: async () => assert.fail("A no-image failure must not be treated as a retryable outage"),
  });
  assert.deepEqual(calls, [1]);
  assert.equal(stopped.slots[0].error.code, "router_image_no_output");
  assert.equal(batchSummary(stopped).failed, 1);
  assert.equal(batchSummary(stopped).queued, 20);
  assert.equal(stopped.stopReason, undefined);
});

test("pending requests cannot be auto-retried even when their error resembles a transient provider failure", async () => {
  const calls = [];
  const stopped = await runBatch(createBatch("food-selfie", 4), {
    run: async index => { calls.push(index); throw failure(index, { code: "provider_unavailable" }); },
    isUnresolved: () => true, retryDelay: async () => assert.fail("An unresolved request must not enter retry backoff"),
  });
  assert.deepEqual(calls, [1]);
  assert.deepEqual(stopped.slots.map(slot => slot.status), ["unresolved", "queued", "queued", "queued"]);
});

test("timeout, transport, malformed, authentication, quota, and unidentified failures never auto-retry", async () => {
  for (const fields of [
    { code: "provider_timeout", status: 504 },
    { code: "network_error", status: 0 },
    { code: "request_timeout", status: 408 },
    { code: "provider_connection_failed", status: 502 },
    { code: "provider_invalid_response", status: 502 },
    { code: "invalid_server_response", status: 502 },
    { code: "generation_interrupted", status: 502 },
    { code: "provider_authentication_failed", status: 502 },
    { code: "provider_quota_exceeded", status: 429 },
    { code: "provider_unavailable", status: 401 },
    { code: "provider_unavailable", status: 429 },
    { code: "provider_unavailable", status: 502, requestId: undefined },
  ]) {
    const calls = [];
    await runBatch(createBatch("food-selfie", 1), { run: async index => { calls.push(index); throw failure(index, fields); }, isUnresolved: terminal, retryDelay: async () => assert.fail(`Unsafe backoff for ${fields.code}`) });
    assert.deepEqual(calls, [1], fields.code);
  }
});

test("cancelling during backoff makes no extra paid request and cancels remaining queued slots", async () => {
  let cancelled = false;
  const calls = [];
  const cancelledBatch = await runBatch(createBatch("food-selfie", 4), {
    run: async index => { calls.push(index); throw failure(index, { code: "provider_unavailable" }); },
    isUnresolved: terminal, shouldCancel: () => cancelled, retryDelay: async () => { cancelled = true; },
  });
  assert.deepEqual(calls, [1]);
  assert.deepEqual(cancelledBatch.slots.map(slot => slot.status), ["failed", "cancelled", "cancelled", "cancelled"]);
  assert.equal(cancelledBatch.slots[0].attempts, 1);
  assert.equal(cancelledBatch.slots[0].retrying, false);
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

test("shared model, configuration, account, billing, and access failures stop a four-image batch after one attempt", async () => {
  for (const [status, code] of [
    [502, "authentication_required"], [502, "access_denied"], [502, "rate_limited"],
    [502, "provider_authentication_failed"], [502, "provider_token_revoked"],
    [503, "provider_not_configured"], [503, "provider_configuration_invalid"],
    [400, "provider_invalid_request"], [503, "provider_model_unavailable"],
    [429, "provider_quota_exceeded"], [400, "provider_precondition_failed"],
    [400, "provider_billing_required"], [402, "provider_payment_required"],
    [502, "provider_access_denied"], [400, "provider_region_unsupported"],
    [502, "router_provider_reauthentication_required"], [502, "router_generation_authentication_failed"],
    [400, "router_model_required"], [400, "invalid_router_model"],
    [422, "router_request_rejected"], [422, "router_capability_unavailable"],
    [401, "request_failed"], [402, "request_failed"], [403, "request_failed"], [429, "request_failed"],
  ]) {
    const calls = [], error = failure(1, { status, code });
    assert.equal(isBatchBlockingError(error), true, code);
    const stopped = await runBatch(createBatch("affiliate", 4), {
      run: async index => { calls.push(index); throw error; }, isUnresolved: terminal,
      retryDelay: async () => assert.fail(`A blocking failure cannot enter automatic retry: ${code}`),
    });
    assert.deepEqual(calls, [1], code);
    assert.deepEqual(stopped.slots.map(slot => slot.status), ["failed", "queued", "queued", "queued"], code);
    assert.equal(stopped.slots[0].attempts, 1, code);
    assert.equal(stopped.slots[0].error.code, code);
    assert.deepEqual(retryFailed(stopped).runIndexes, [1], code);
  }
});

test("a scene-specific content rejection preserves the failure and still attempts later scenes", async () => {
  const calls = [], rejected = failure(2, { status: 422, code: "provider_rejected" });
  assert.equal(isBatchBlockingError(rejected), false);
  const finished = await runBatch(createBatch("affiliate", 4), {
    run: async index => { calls.push(index); if (index === 2) throw rejected; return result(index); },
    isUnresolved: terminal, retryDelay: async () => assert.fail("A content rejection cannot be retried automatically"),
  });
  assert.deepEqual(calls, [1, 2, 3, 4]);
  assert.deepEqual(finished.slots.map(slot => slot.status), ["completed", "failed", "completed", "completed"]);
  assert.equal(finished.slots[1].error.code, "provider_rejected");
  assert.deepEqual(retryFailed(finished).runIndexes, [2]);
});

test("the caller can stop on a definitive global error without treating remaining slots as failed", async () => {
  const calls = [];
  const stopped = await runBatch(createBatch("food-selfie", 3), { run: async index => { calls.push(index); throw failure(index, { code: "provider_unavailable" }); }, isUnresolved: terminal, shouldStop: () => true, retryDelay: async () => assert.fail("Explicit global stop takes precedence over retry") });
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
