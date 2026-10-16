import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const code = ts.transpileModule(readFileSync(new URL("./studio-client.ts", import.meta.url), "utf8"), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText;
const { request, generateRequest, generationStatus, readPending, forgetPending, recoveryAction, StudioRequestError } = await import(`data:text/javascript;base64,${Buffer.from(code).toString("base64")}`);
const originalFetch = globalThis.fetch;
const originalStorageDescriptor = Object.getOwnPropertyDescriptor(globalThis, "sessionStorage");
let storage;
let scope, pendingKey, testSequence = 0;
class MemoryStorage {
  values = new Map();
  getItem(key) { return this.values.get(String(key)) ?? null; }
  setItem(key, value) { this.values.set(String(key), String(value)); }
  removeItem(key) { this.values.delete(String(key)); }
  clear() { this.values.clear(); }
}
test.beforeEach(() => {
  scope = `client-test-owner-${++testSequence}`;
  pendingKey = `aimode.pending-generations.${encodeURIComponent(scope)}`;
  storage = new MemoryStorage();
  Object.defineProperty(globalThis, "sessionStorage", { value: storage, configurable: true });
  globalThis.fetch = async () => { throw new Error("Unexpected network request in client unit test"); };
});
test.afterEach(() => { globalThis.fetch = originalFetch; });
test.after(() => {
  if (originalStorageDescriptor) Object.defineProperty(globalThis, "sessionStorage", originalStorageDescriptor);
  else delete globalThis.sessionStorage;
});

const result = { id: "fixture-generation", results: [{ id: "fixture-result", kind: "image", url: "/api/files/fixture-result", mimeType: "image/png" }], createdAt: 1234 };
const body = { featureId: "food-selfie", kind: "image", prompt: "Synthetic food scene", images: [], options: {} };
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
const html = status => new Response("<html><body>Gateway page</body></html>", { status, headers: { "Content-Type": "text/html" } });
function assertError(code, status) {
  return error => { assert.ok(error instanceof StudioRequestError); assert.equal(error.code, code); if (status !== undefined) assert.equal(error.status, status); return true; };
}
function streamEvents(events, { truncate = false, widths = [1, 2, 7, 3, 11] } = {}) {
  const bytes = new TextEncoder().encode(events.map(event => typeof event === "string" ? event : JSON.stringify(event)).join("\n") + (truncate ? "" : "\n"));
  let offset = 0, index = 0;
  return new Response(new ReadableStream({
    pull(controller) {
      if (offset === bytes.length) { controller.close(); return; }
      const end = Math.min(bytes.length, offset + widths[index++ % widths.length]);
      controller.enqueue(bytes.slice(offset, end)); offset = end;
    },
  }), { headers: { "Content-Type": "application/x-ndjson; charset=utf-8" } });
}

test("request accepts an object JSON response and sends same-origin credentials", async () => {
  const calls = [];
  globalThis.fetch = async (url, init) => { calls.push({ url, init }); return json({ authenticated: true }); };
  assert.deepEqual(await request("/api/session"), { authenticated: true });
  assert.equal(calls.length, 1); assert.equal(calls[0].init.method, "GET");
  assert.equal(calls[0].init.credentials, "same-origin");
  assert.ok(calls[0].init.signal instanceof AbortSignal);
});

test("request rejects HTTP 200 HTML instead of returning fake successful data", async () => {
  globalThis.fetch = async () => html(200);
  await assert.rejects(request("/api/session"), assertError("invalid_server_response", 200));
});

test("request identifies gateway HTML by its HTTP status without exposing page contents", async () => {
  for (const [status, code] of [[502, "gateway_error"], [503, "gateway_error"], [504, "gateway_timeout"], [524, "gateway_timeout"]]) {
    globalThis.fetch = async () => html(status);
    await assert.rejects(request("/api/generate", { ...body, requestId: "gateway-fixture" }), error => {
      assertError(code, status)(error); assert.equal(error.requestId, "gateway-fixture");
      assert.match(error.message, new RegExp(`HTTP ${status}`)); assert.doesNotMatch(error.message, /<html>|Gateway page/); return true;
    });
  }
});

test("request distinguishes an expired site session from provider authentication", async () => {
  globalThis.fetch = async () => html(401);
  await assert.rejects(request("/api/session"), assertError("authentication_required", 401));
  globalThis.fetch = async () => json({ error: "Key fixture rejected", code: "provider_authentication_failed" }, 401);
  await assert.rejects(request("/api/provider/test", { provider: "9router" }), assertError("provider_authentication_failed", 401));
});

test("a JSON error envelope is rejected even when the gateway returned HTTP 200", async () => {
  globalThis.fetch = async () => json({ error: "Fixture policy rejection", code: "provider_rejected" });
  await assert.rejects(request("/api/generate", { ...body, requestId: "error-fixture" }), assertError("provider_rejected", 200));
});

test("generation requires a usable result envelope, including for valid JSON", async () => {
  for (const data of [null, [], {}, { id: "fixture", results: [] }, { id: "fixture", results: [{ id: "x", kind: "image", url: "https://external.invalid/image.png" }] }]) {
    globalThis.fetch = async () => json(data);
    await assert.rejects(request("/api/generate", body), assertError("invalid_server_response", 200));
  }
  globalThis.fetch = async () => json(result);
  assert.deepEqual(await request("/api/generate", body), result);
});

test("a truncated JSON body is reported as an invalid server response", async () => {
  globalThis.fetch = async () => new Response(new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('{"authenticated":')); controller.error(new Error("Fixture connection cut")); } }), { headers: { "Content-Type": "application/json" } });
  await assert.rejects(request("/api/session"), assertError("invalid_server_response", 200));
});

test("request timeout aborts the pending fetch and returns a stable timeout code", async () => {
  let wasAborted = false;
  globalThis.fetch = async (_url, init) => new Promise((_resolve, reject) => init.signal.addEventListener("abort", () => { wasAborted = true; reject(new DOMException("Fixture aborted", "AbortError")); }, { once: true }));
  await assert.rejects(request("/api/session", undefined, undefined, { timeoutMs: 5 }), assertError("request_timeout", 408));
  assert.equal(wasAborted, true);
});

test("split NDJSON accepted/heartbeats/result survives arbitrary UTF-8 chunk boundaries", async () => {
  const textResult = { id: "stream-generation", results: [{ id: "text-result", kind: "text", text: "Makanan hangat — siap 🍜" }] };
  globalThis.fetch = async (_url, init) => {
    assert.match(init.headers.Accept, /application\/x-ndjson/);
    return streamEvents([{ type: "accepted", requestId: "stream-request" }, { type: "heartbeat", requestId: "stream-request" }, { type: "heartbeat" }, { type: "result", data: textResult }]);
  };
  assert.deepEqual(await request("/api/generate", body), { ...textResult, requestId: "stream-request" });
});

test("NDJSON accepts a complete final result without a trailing newline", async () => {
  globalThis.fetch = async () => streamEvents([{ type: "accepted", requestId: "stream-no-newline" }, { type: "result", data: result }], { truncate: true });
  assert.deepEqual(await request("/api/generate", body), { ...result, requestId: "stream-no-newline" });
});

test("NDJSON terminal error retains provider code and status", async () => {
  globalThis.fetch = async () => streamEvents([{ type: "accepted", requestId: "stream-error" }, { type: "error", status: 422, error: "Fixture reference unsupported", code: "router_reference_images_unsupported" }]);
  await assert.rejects(request("/api/generate", body), error => { assertError("router_reference_images_unsupported", 422)(error); assert.equal(error.requestId, "stream-error"); return true; });
});

test("NDJSON ending after a heartbeat is interrupted rather than successful", async () => {
  globalThis.fetch = async () => streamEvents([{ type: "accepted", requestId: "unfinished-stream" }, { type: "heartbeat" }]);
  await assert.rejects(request("/api/generate", body), error => { assertError("generation_interrupted", 502)(error); assert.equal(error.requestId, "unfinished-stream"); return true; });
});

test("NDJSON rejects malformed or truncated terminal events", async () => {
  for (const bad of ['{"type":"result",', '{"type":"unexpected"}', '{"type":"result","data":{"id":"empty","results":[]}}']) {
    globalThis.fetch = async () => streamEvents([{ type: "accepted", requestId: "bad-stream" }, bad], { truncate: true });
    await assert.rejects(request("/api/generate", body), assertError("invalid_server_response", 200));
  }
});

test("lost POST response recovers a committed result with one GET and never reposts", async () => {
  const calls = []; let submittedId;
  globalThis.fetch = async (url, init) => {
    calls.push({ url, method: init.method });
    if (init.method === "POST") { submittedId = JSON.parse(init.body).requestId; throw new TypeError("Fixture response lost"); }
    assert.equal(url, `/api/generate/requests/${submittedId}`);
    return json({ status: "completed", requestId: submittedId, data: result });
  };
  assert.deepEqual(await generateRequest(body, scope), result);
  assert.deepEqual(calls.map(call => call.method), ["POST", "GET"]);
  assert.deepEqual(readPending(scope), []);
});

test("an HTML gateway failure recovers a completed request without another chargeable POST", async () => {
  const methods = [];
  globalThis.fetch = async (_url, init) => { methods.push(init.method); return init.method === "POST" ? html(504) : json({ status: "completed", data: result }); };
  assert.deepEqual(await generateRequest(body, scope), result);
  assert.deepEqual(methods, ["POST", "GET"]);
});

test("an HTTP 200 HTML replacement also recovers a committed result instead of forgetting it", async () => {
  const methods = [];
  globalThis.fetch = async (_url, init) => { methods.push(init.method); return init.method === "POST" ? html(200) : json({ status: "completed", data: result }); };
  assert.deepEqual(await generateRequest(body, scope), result);
  assert.deepEqual(methods, ["POST", "GET"]); assert.deepEqual(readPending(scope), []);
});

test("a JSON gateway error without a code still recovers before discarding the pending request", async () => {
  const methods = [];
  globalThis.fetch = async (_url, init) => { methods.push(init.method); return init.method === "POST" ? json({ error: "Fixture upstream gateway failed" }, 502) : json({ status: "completed", data: result }); };
  assert.deepEqual(await generateRequest(body, scope), result);
  assert.deepEqual(methods, ["POST", "GET"]);
});

test("GET recovery reports a persisted provider failure and clears its pending metadata", async () => {
  const methods = [];
  globalThis.fetch = async (_url, init) => { methods.push(init.method); if (init.method === "POST") throw new TypeError("Fixture network dropped"); return json({ status: "failed", error: "Fixture key was rejected", code: "provider_authentication_failed", errorStatus: 401 }); };
  await assert.rejects(generateRequest(body, scope), assertError("provider_authentication_failed", 401));
  assert.deepEqual(methods, ["POST", "GET"]); assert.deepEqual(readPending(scope), []);
});

test("pending and unknown recovery states keep metadata and never submit a second POST", async () => {
  for (const state of ["pending", "unknown"]) {
    const stateScope = `${scope}-${state}`, methods = [];
    globalThis.fetch = async (_url, init) => { methods.push(init.method); return init.method === "POST" ? html(504) : json({ status: state }); };
    await assert.rejects(generateRequest(body, stateScope), assertError("gateway_timeout", 504));
    assert.deepEqual(methods, ["POST", "GET"]); assert.equal(readPending(stateScope).length, 1);
  }
});

test("a 202 pending generation checks GET status rather than treating acceptance as a completed result", async () => {
  const methods = [];
  globalThis.fetch = async (_url, init) => { methods.push(init.method); return init.method === "POST" ? json({ status: "pending" }, 202) : json({ status: "pending" }); };
  await assert.rejects(generateRequest(body, scope), assertError("generation_pending", 202));
  assert.deepEqual(methods, ["POST", "GET"]); assert.equal(readPending(scope).length, 1);
});

test("explicit provider rejection never triggers recovery or automatic retry", async () => {
  const methods = [];
  globalThis.fetch = async (_url, init) => { methods.push(init.method); return json({ error: "Fixture policy rejected", code: "provider_rejected" }, 422); };
  await assert.rejects(generateRequest(body, scope), assertError("provider_rejected", 422));
  assert.deepEqual(methods, ["POST"]); assert.deepEqual(readPending(scope), []);
});

test("a missing recovery record preserves the original interruption and its pending metadata", async () => {
  const methods = [];
  globalThis.fetch = async (_url, init) => { methods.push(init.method); return init.method === "POST" ? html(504) : json({ error: "Fixture not yet registered", code: "request_not_found" }, 404); };
  await assert.rejects(generateRequest(body, scope), assertError("gateway_timeout", 504));
  assert.deepEqual(methods, ["POST", "GET"]); assert.equal(readPending(scope).length, 1);
});

test("pending storage contains only recovery metadata, with no key, prompt, options, or image bytes", async () => {
  const privateBody = { ...body, apiKey: "fixture-private-key", prompt: "Fixture private prompt", images: [{ data: "fixture-private-image", mimeType: "image/png" }], routerConfig: { baseUrl: "https://fixture-router.example/v1" }, options: { product: "fixture-private-product" } };
  const notified = [];
  globalThis.fetch = async (_url, init) => init.method === "POST" ? html(504) : json({ status: "pending" });
  await assert.rejects(generateRequest(privateBody, scope, item => notified.push(item)), assertError("gateway_timeout"));
  const records = JSON.parse(storage.getItem(pendingKey));
  assert.equal(records.length, 1); assert.equal(notified.length, 1);
  assert.deepEqual(Object.keys(records[0]).sort(), ["featureId", "requestId", "startedAt"]);
  assert.deepEqual(records[0], notified[0]);
  assert.equal(records[0].featureId, "food-selfie"); assert.equal(typeof records[0].startedAt, "number");
  const serialized = JSON.stringify([...storage.values]);
  for (const privateValue of [privateBody.apiKey, privateBody.prompt, privateBody.images[0].data, privateBody.options.product, privateBody.routerConfig.baseUrl]) assert.equal(serialized.includes(privateValue), false);
  assert.deepEqual(readPending("another-owner"), []);
  forgetPending(scope, records[0].requestId); assert.deepEqual(readPending(scope), []);
});

test("pending batch recovery preserves only batch and slot metadata alongside the existing three fields", async () => {
  const privateBody = {
    ...body,
    apiKey: "fixture-batch-private-key",
    prompt: "Fixture private batch prompt",
    images: [{ data: "fixture-batch-private-image", mimeType: "image/png" }],
    routerConfig: { baseUrl: "https://fixture-batch-router.example/v1" },
    options: { batchId: "fixture-batch-id", sequenceIndex: 4, sequenceTotal: 4, product: "fixture-batch-private-product" },
  };
  for (const state of ["pending", "unknown"]) {
    const stateScope = `${scope}-${state}`, notified = [], methods = [];
    globalThis.fetch = async (_url, init) => { methods.push(init.method); return init.method === "POST" ? html(504) : json({ status: state }); };
    await assert.rejects(generateRequest(privateBody, stateScope, item => notified.push(item)), assertError("gateway_timeout", 504));
    const records = readPending(stateScope);
    assert.equal(records.length, 1);
    assert.deepEqual(methods, ["POST", "GET"]);
    assert.deepEqual(Object.keys(records[0]).sort(), ["batchId", "featureId", "requestId", "sequenceIndex", "sequenceTotal", "startedAt"]);
    assert.deepEqual(records[0], notified[0]);
    assert.equal(records[0].batchId, "fixture-batch-id");
    assert.equal(records[0].sequenceIndex, 4); assert.equal(records[0].sequenceTotal, 4);
    assert.equal(records[0].featureId, "food-selfie"); assert.equal(typeof records[0].startedAt, "number");
    assert.deepEqual(JSON.parse(storage.getItem(`aimode.pending-generations.${encodeURIComponent(stateScope)}`)), records);
    const serialized = JSON.stringify([...storage.values]);
    for (const privateValue of [privateBody.apiKey, privateBody.prompt, privateBody.images[0].data, privateBody.options.product, privateBody.routerConfig.baseUrl]) assert.equal(serialized.includes(privateValue), false);
    for (const field of ["apiKey", "prompt", "images", "options", "routerConfig"]) assert.equal(Object.hasOwn(records[0], field), false);
  }
});

test("successful batch generation forgets its recovery metadata while preserving another pending record", async () => {
  const previous = { requestId: "previous-request", featureId: "affiliate", startedAt: 123 };
  storage.setItem(pendingKey, JSON.stringify([previous]));
  const notified = [], methods = [];
  globalThis.fetch = async (_url, init) => {
    methods.push(init.method);
    const pending = readPending(scope);
    assert.equal(pending.length, 2);
    assert.equal(pending[1].batchId, "successful-batch");
    assert.equal(pending[1].sequenceIndex, 2); assert.equal(pending[1].sequenceTotal, 4);
    return json(result);
  };
  assert.deepEqual(await generateRequest({ ...body, options: { batchId: "successful-batch", sequenceIndex: 2, sequenceTotal: 4 } }, scope, item => notified.push(item)), result);
  assert.deepEqual(methods, ["POST"]);
  assert.equal(notified.length, 1);
  assert.deepEqual(readPending(scope), [previous]);
  assert.deepEqual(JSON.parse(storage.getItem(pendingKey)), [previous]);
  forgetPending(scope, previous.requestId);
  assert.deepEqual(readPending(scope), []);
});

test("the 21st camera slot survives recovery metadata and preserves the saved output dimensions", async () => {
  const caseScope = `${scope}-21-camera`, cameraResult = { ...result, results: result.results.map(item => ({ ...item, angleId: "establishing", angleRatio: "9:16" })) };
  globalThis.fetch = async (_url, init) => init.method === "POST" ? html(504) : json({ status: "pending" });
  const cameraBody = { ...body, featureId: "angle-generator", options: { batchId: "camera-batch", sequenceIndex: 21, sequenceTotal: 21 } };
  await assert.rejects(generateRequest(cameraBody, caseScope), assertError("gateway_timeout", 504));
  const pending = readPending(caseScope)[0];
  assert.equal(pending.sequenceIndex, 21); assert.equal(pending.sequenceTotal, 21);
  globalThis.fetch = async () => json({ status: "completed", data: cameraResult });
  const recovered = await generationStatus(pending.requestId);
  assert.deepEqual(recovered.data.results, cameraResult.results);
});

test("legacy recovery records with three fields remain readable and dismissible", () => {
  const legacy = { requestId: "legacy-request", featureId: "food-selfie", startedAt: 1234 };
  storage.setItem(pendingKey, JSON.stringify([legacy]));
  assert.deepEqual(readPending(scope), [legacy]);
  assert.deepEqual(Object.keys(readPending(scope)[0]).sort(), ["featureId", "requestId", "startedAt"]);
  forgetPending(scope, legacy.requestId);
  assert.deepEqual(readPending(scope), []);
  assert.deepEqual(JSON.parse(storage.getItem(pendingKey)), []);
});

test("invalid batch identity or slot bounds are omitted without losing ordinary request recovery", async () => {
  const invalidOptions = [
    { batchId: "../invalid-batch", sequenceIndex: 1, sequenceTotal: 4 },
    { batchId: "fixture-batch", sequenceIndex: 0, sequenceTotal: 4 },
    { batchId: "fixture-batch", sequenceIndex: 1.5, sequenceTotal: 4 },
    { batchId: "fixture-batch", sequenceIndex: 5, sequenceTotal: 4 },
    { batchId: "fixture-batch", sequenceIndex: 1, sequenceTotal: 11 },
    { sequenceIndex: 1, sequenceTotal: 4 },
  ];
  for (const [index, options] of invalidOptions.entries()) {
    const caseScope = `${scope}-invalid-${index}`;
    globalThis.fetch = async (_url, init) => init.method === "POST" ? html(504) : json({ status: "pending" });
    await assert.rejects(generateRequest({ ...body, options }, caseScope), assertError("gateway_timeout", 504));
    const records = readPending(caseScope);
    assert.equal(records.length, 1);
    assert.deepEqual(Object.keys(records[0]).sort(), ["featureId", "requestId", "startedAt"]);
  }
});

test("blocked sessionStorage cannot prevent an otherwise successful generation", async () => {
  Object.defineProperty(globalThis, "sessionStorage", { configurable: true, value: { getItem() { throw new Error("Fixture storage denied"); }, setItem() { throw new Error("Fixture storage denied"); } } });
  globalThis.fetch = async () => json(result);
  assert.deepEqual(await generateRequest(body, scope), result);
});

test("a browser SecurityError on the storage getter cannot prevent generation", async () => {
  Object.defineProperty(globalThis, "sessionStorage", { configurable: true, get() { throw new DOMException("Fixture storage access denied", "SecurityError"); } });
  assert.deepEqual(readPending(scope), []);
  globalThis.fetch = async () => json(result);
  assert.deepEqual(await generateRequest(body, scope), result);
});

test("blocked browser storage retains pending and unknown recovery metadata in memory until dismissed", async () => {
  Object.defineProperty(globalThis, "sessionStorage", { configurable: true, get() { throw new DOMException("Fixture storage access denied", "SecurityError"); } });
  for (const state of ["pending", "unknown"]) {
    const stateScope = `${scope}-${state}`, methods = [], notified = [];
    globalThis.fetch = async (_url, init) => { methods.push(init.method); return init.method === "POST" ? html(504) : json({ status: state }); };
    await assert.rejects(generateRequest({ ...body, apiKey: "fixture-memory-key", prompt: "Fixture private memory prompt" }, stateScope, item => notified.push(item)), assertError("gateway_timeout", 504));
    assert.deepEqual(methods, ["POST", "GET"]);
    const records = readPending(stateScope);
    assert.equal(records.length, 1); assert.equal(notified.length, 1);
    assert.deepEqual(records[0], notified[0]);
    assert.deepEqual(Object.keys(records[0]).sort(), ["featureId", "requestId", "startedAt"]);
    assert.equal(records[0].featureId, body.featureId);
    assert.equal(typeof records[0].startedAt, "number");
    assert.equal(JSON.stringify(records).includes("fixture-memory-key"), false);
    assert.equal(JSON.stringify(records).includes("Fixture private memory prompt"), false);
    assert.deepEqual(readPending(`${stateScope}-another-owner`), []);
    forgetPending(stateScope, records[0].requestId);
    assert.deepEqual(readPending(stateScope), []);
  }
});

test("generation status validates its request ID and completed response contract", async () => {
  let calls = 0;
  globalThis.fetch = async () => { calls++; return json({ status: "completed", data: { id: "fixture", results: [] } }); };
  await assert.rejects(generationStatus("../invalid-id"), assertError("invalid_request_id", 400)); assert.equal(calls, 0);
  await assert.rejects(generationStatus("valid-request-id"), assertError("invalid_server_response", 200)); assert.equal(calls, 1);
});

test("recovery actions match actual authentication, configuration, transport, and input errors", () => {
  const cases = {
    signin: ["authentication_required", "access_denied"],
    settings: ["provider_authentication_failed", "provider_not_configured", "provider_configuration_invalid", "provider_model_unavailable", "provider_token_revoked", "invalid_router_url", "private_router_address", "router_model_required", "router_reference_images_unsupported", "router_provider_reauthentication_required", "router_generation_authentication_failed", "router_capability_unavailable"],
    history: ["network_error", "request_timeout", "gateway_error", "gateway_timeout", "invalid_server_response", "generation_interrupted", "generation_pending", "provider_timeout", "provider_unavailable", "provider_connection_failed", "provider_empty_response", "provider_invalid_response", "download_failed"],
    input: ["invalid_input", "reference_images_required", "transcript_required", "provider_rejected", "clipboard_failed", "local_editor_failed"],
  };
  for (const [action, codes] of Object.entries(cases)) for (const code of codes) assert.equal(recoveryAction(code), action, code);
});
