import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const moduleUrl = source => `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
function load(path, replacements = []) {
  let source = ts.transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  }).outputText;
  for (const [from, to] of replacements) source = source.replaceAll(JSON.stringify(from), JSON.stringify(to));
  return moduleUrl(source);
}

const catalogUrl = load("../app/feature-data.ts");
const infoUrl = load("./studio-mcp-info.ts");
const toolsUrl = load("./studio-mcp-tools.ts", [["../app/feature-data", catalogUrl], ["./studio-mcp-info", infoUrl]]);
const protocolUrl = load("./studio-mcp-protocol.ts");
const adminUrl = load("./studio-admin.ts");
let fixtureNumber = 0;

/** Only platform identity and external services are fixtures; route/protocol/tools are the real source. */
async function fixture() {
  const stateUrl = moduleUrl(`
    export const fixtureNumber = ${++fixtureNumber};
    export const state = {
      user: null,
      environment: { STUDIO_ADMIN_USER_IDS: "site-owner-fixture" },
      calls: [],
      rateError: null,
      providerError: null,
      settings: { featureId: "affiliate", basePrompt: "Product photography", additionalInstructions: "Previous directions", revision: 4, updatedAt: 100 },
      audit: [],
      providers: {
        gemini: { configured: false, savedCredential: false, credentialState: "none", apiKey: "gemini-secret-fixture" },
        "9router": { configured: true, savedCredential: true, credentialState: "saved", textModel: "text-fixture", imageModel: "image-fixture", apiKey: "router-secret-fixture", encryptedKey: "ciphertext-secret-fixture", baseUrl: "https://private-router.unit.example", allowedHttpOrigins: ["http://private.unit.example"] }
      }
    };
  `);
  const apiUrl = moduleUrl(`
    import { state } from ${JSON.stringify(stateUrl)};
    export class ApiError extends Error { constructor(status, code, message) { super(message); this.status = status; this.code = code; } }
    export async function rateLimit(userId, action, maximum) {
      state.calls.push(["rate", userId, action, maximum]);
      if (state.rateError) throw state.rateError;
    }
  `);
  const authUrl = moduleUrl(`import { state } from ${JSON.stringify(stateUrl)}; export async function getChatGPTUser() { state.calls.push(["identity"]); return state.user; }`);
  const environmentUrl = moduleUrl(`import { state } from ${JSON.stringify(stateUrl)}; export const env = state.environment;`);
  const providersUrl = moduleUrl(`
    import { state } from ${JSON.stringify(stateUrl)};
    export async function providerStatusForUser(environment, userId) {
      state.calls.push(["provider", userId, environment === state.environment]);
      if (state.providerError) throw state.providerError;
      return state.providers;
    }
  `);
  const promptsUrl = moduleUrl(`
    import { state } from ${JSON.stringify(stateUrl)};
    import { ApiError } from ${JSON.stringify(apiUrl)};
    export async function getFeaturePromptSettings(id) { state.calls.push(["getPrompt", id]); return { ...state.settings, featureId: id }; }
    export async function listPromptChanges(limit) { state.calls.push(["changes", limit]); return state.audit.map(item => ({ ...item })); }
    export async function updateFeaturePromptSettings(input, userId) {
      state.calls.push(["update", { ...input }, userId]);
      if (input.expectedRevision !== state.settings.revision) throw new ApiError(409, "prompt_revision_conflict", "Read the latest revision.");
      state.settings = { ...state.settings, additionalInstructions: input.additionalInstructions, revision: state.settings.revision + 1, updatedAt: 200 };
      state.audit.push({ featureId: input.featureId, revision: state.settings.revision, reason: input.reason });
      return { ...state.settings };
    }
  `);
  const route = await import(load("../app/mcp/route.ts", [
    ["cloudflare:workers", environmentUrl], ["@/app/chatgpt-auth", authUrl], ["@/lib/studio-api", apiUrl],
    ["@/lib/studio-admin", adminUrl], ["@/lib/studio-credentials", providersUrl], ["@/lib/studio-prompt-settings", promptsUrl],
    ["@/lib/studio-mcp-protocol", protocolUrl], ["@/lib/studio-mcp-tools", toolsUrl],
  ]));
  const { state } = await import(stateUrl), { ApiError } = await import(apiUrl);
  return { route, state, ApiError };
}

const endpoint = "https://toolsaff.restupambudi.my.id/mcp";
const owner = { userId: "site-owner-fixture", email: "owner@unit.example", displayName: "Owner" };
const viewer = { userId: "site-viewer-fixture", email: "viewer@unit.example", displayName: "Viewer" };
const update = { featureId: "affiliate", additionalInstructions: "Distinct camera angles", expectedRevision: 4, reason: "Increase visual variety" };
function request(method, params = {}, id = "request-fixture", options = {}) {
  const modern = options.modern !== false;
  const _meta = { "io.modelcontextprotocol/protocolVersion": "2026-07-28", "io.modelcontextprotocol/clientCapabilities": {} };
  return new Request(endpoint, {
    method: "POST", headers: {
      "Content-Type": "application/json", Accept: "application/json, text/event-stream",
      ...(modern ? { "MCP-Protocol-Version": "2026-07-28", "Mcp-Method": method, ...(method === "tools/call" ? { "Mcp-Name": params.name } : {}) } : {}),
      ...options.headers,
    },
    body: JSON.stringify({ jsonrpc: "2.0", id, method, params: { ...params, ...(modern ? { _meta } : {}) } }),
  });
}
async function call(f, name, args = {}, id = "call-fixture", options) {
  const response = await f.route.POST(request("tools/call", { name, arguments: args }, id, options));
  return { response, body: await response.json() };
}

test("real route permits anonymous protocol initialization, discovery, and public tool schemas without reading private services", async () => {
  const f = await fixture();
  const initial = await f.route.POST(request("initialize", { protocolVersion: "2025-11-25", capabilities: {}, clientInfo: { name: "synthetic", version: "1" } }, 1, { modern: false }));
  assert.equal(initial.status, 200);
  assert.equal((await initial.json()).result.protocolVersion, "2025-11-25");
  const discovery = await f.route.POST(request("server/discover"));
  assert.equal(discovery.status, 200);
  assert.deepEqual((await discovery.json()).result.capabilities, { tools: {} });
  const listing = await f.route.POST(request("tools/list"));
  const text = await listing.text(), output = JSON.parse(text);
  assert.equal(listing.status, 200);
  assert.equal(output.result.tools.length, 9);
  assert.ok(output.result.tools.some(item => item.name === "update_feature_prompt"));
  assert.doesNotMatch(text, /Previous directions|router-secret|gemini-secret|ciphertext-secret|site-owner-fixture/);
  assert.deepEqual(f.state.calls, []);
});

test("real data-bearing route rejects anonymous users with HTTP401 and the original JSON-RPC ID", async () => {
  const f = await fixture();
  for (const name of ["get_site_summary", "get_ai_connection_status", "get_feature_prompt", "update_feature_prompt", "list_prompt_changes"]) {
    const { response, body } = await call(f, name, name === "get_feature_prompt" ? { featureId: "affiliate" } : name === "update_feature_prompt" ? update : {}, `missing-${name}`);
    assert.equal(response.status, 401);
    assert.equal(body.id, `missing-${name}`);
    assert.equal(body.error.data.code, "authentication_required");
    assert.match(response.headers.get("WWW-Authenticate"), /^Bearer /);
  }
  assert.ok(f.state.calls.every(item => item[0] === "identity"));
  assert.equal(f.state.settings.revision, 4);
});

test("a service bypass bearer without a visitor identity cannot access private data or become administrator", async () => {
  const f = await fixture();
  const { response, body } = await call(f, "get_ai_connection_status", {}, 27, { headers: { Authorization: "Bearer synthetic-hosting-bypass-not-a-real-token" } });
  assert.equal(response.status, 401); assert.equal(body.id, 27);
  assert.deepEqual(f.state.calls, [["identity"]]);
  assert.equal(f.state.settings.revision, 4);
});

test("viewer cannot update global prompts or read audit even though tool schemas are discoverable", async () => {
  const f = await fixture(); f.state.user = viewer;
  for (const name of ["update_feature_prompt", "list_prompt_changes"]) {
    const { response, body } = await call(f, name, name === "update_feature_prompt" ? update : {});
    assert.equal(response.status, 403);
    assert.equal(body.error.data.code, "administrator_required");
  }
  assert.equal(f.state.settings.revision, 4);
  assert.ok(f.state.calls.every(item => item[0] === "identity"));
});

test("administrator comes from verified Site ID and sends the exact actor and CAS revision to storage", async () => {
  const f = await fixture(); f.state.user = owner;
  const { response, body } = await call(f, "update_feature_prompt", update, "owner-update");
  assert.equal(response.status, 200); assert.equal(body.id, "owner-update");
  assert.equal(body.result.isError, false);
  assert.equal(body.result.structuredContent.settings.revision, 5);
  assert.equal(body.result.structuredContent.sourceDeployed, false);
  assert.deepEqual(f.state.calls.find(item => item[0] === "update"), ["update", update, owner.userId]);
  assert.deepEqual(f.state.calls.find(item => item[0] === "rate"), ["rate", owner.userId, "mcp-write", 20]);
  assert.equal(f.state.audit.length, 1);
  const summary = await call(f, "get_site_summary");
  assert.deepEqual(summary.body.result.structuredContent.caller, { role: "administrator", canUpdateGlobalPrompts: true });
});

test("same email with a different Site ID cannot gain owner privileges", async () => {
  const f = await fixture(); f.state.user = { ...owner, userId: "different-site-id-fixture" };
  const { response } = await call(f, "update_feature_prompt", update);
  assert.equal(response.status, 403);
  assert.equal(f.state.settings.revision, 4);
});

test("missing administrator environment fails closed for the verified owner", async () => {
  const f = await fixture(); f.state.user = owner; delete f.state.environment.STUDIO_ADMIN_USER_IDS;
  const { response } = await call(f, "update_feature_prompt", update);
  assert.equal(response.status, 403);
  assert.equal(f.state.settings.revision, 4);
});

test("identity and role spoofing in arguments cannot access any service or alter a prompt", async () => {
  const f = await fixture(); f.state.user = owner;
  for (const spoof of [{ userId: viewer.userId }, { isAdministrator: true }, { actor: owner }, { email: owner.email }, { apiKey: "synthetic-key-fixture" }]) {
    const { response, body } = await call(f, "update_feature_prompt", { ...update, ...spoof });
    assert.equal(response.status, 200);
    assert.equal(body.result.isError, true);
    assert.equal(body.result.structuredContent.code, "invalid_input");
  }
  assert.equal(f.state.settings.revision, 4);
  assert.equal(f.state.calls.some(item => ["update", "getPrompt", "changes", "provider"].includes(item[0])), false);
});

test("viewer sees only their configuration readiness; provider keys and locations never leave the real tool output", async () => {
  const f = await fixture(); f.state.user = viewer;
  const { response, body } = await call(f, "get_ai_connection_status");
  assert.equal(response.status, 200); assert.equal(body.result.isError, false);
  assert.equal(body.result.structuredContent.testedLive, false);
  assert.deepEqual(body.result.structuredContent.providers["9router"], { configured: true, savedCredential: true, credentialState: "saved", textModel: "text-fixture", imageModel: "image-fixture" });
  assert.deepEqual(f.state.calls.find(item => item[0] === "provider"), ["provider", viewer.userId, true]);
  assert.doesNotMatch(JSON.stringify(body), /router-secret|gemini-secret|ciphertext-secret|private-router|private\.unit|apiKey|encryptedKey|baseUrl|allowedHttpOrigins/);
});

test("prompt read and preview are authenticated operations that never write or call a provider", async () => {
  const f = await fixture(); f.state.user = viewer;
  const read = await call(f, "get_feature_prompt", { featureId: "affiliate" });
  const preview = await call(f, "preview_feature_prompt", { featureId: "affiliate", additionalInstructions: "New directions" });
  assert.equal(read.body.result.structuredContent.revision, 4);
  assert.equal(preview.body.result.structuredContent.saved, false);
  assert.equal(preview.body.result.structuredContent.providerCalled, false);
  assert.equal(f.state.settings.revision, 4);
  assert.equal(f.state.calls.some(item => ["update", "provider", "changes"].includes(item[0])), false);
});

test("stale CAS update returns an actionable tool error without changing settings or auditing another write", async () => {
  const f = await fixture(); f.state.user = owner;
  const { response, body } = await call(f, "update_feature_prompt", { ...update, expectedRevision: 3 });
  assert.equal(response.status, 200); assert.equal(body.result.isError, true);
  assert.equal(body.result.structuredContent.code, "prompt_revision_conflict");
  assert.equal(f.state.settings.revision, 4); assert.equal(f.state.audit.length, 0);
});

test("rate limits preserve HTTP429 and block storage/provider operations", async () => {
  const f = await fixture(); f.state.user = owner;
  f.state.rateError = new f.ApiError(429, "rate_limited", "Try later.");
  const { response, body } = await call(f, "update_feature_prompt", update, "limited-write");
  assert.equal(response.status, 429); assert.equal(response.headers.get("Retry-After"), "60");
  assert.equal(body.id, "limited-write"); assert.equal(body.error.data.code, "rate_limited");
  assert.equal(f.state.settings.revision, 4);
  assert.equal(f.state.calls.some(item => item[0] === "update"), false);
});

test("unexpected service and rate-limit errors do not leak keys, stacks, or database diagnostics", async () => {
  const f = await fixture(); f.state.user = owner;
  f.state.providerError = new Error("synthetic-sensitive-provider-token diagnostic stack");
  const { body } = await call(f, "get_ai_connection_status");
  assert.equal(body.result.isError, true); assert.equal(body.result.structuredContent.code, "mcp_unavailable");
  assert.doesNotMatch(JSON.stringify(body), /synthetic-sensitive|diagnostic|stack/);
  f.state.rateError = new Error("synthetic-sensitive-database-credential");
  const failed = await call(f, "get_site_summary");
  assert.equal(failed.response.status, 503);
  assert.doesNotMatch(JSON.stringify(failed.body), /synthetic-sensitive|database-credential/);
});

test("viewer data reads remain compatible with initialization-era clients", async () => {
  const f = await fixture(); f.state.user = viewer;
  const { response, body } = await call(f, "get_site_summary", {}, "legacy-read", { modern: false });
  assert.equal(response.status, 200); assert.equal(body.id, "legacy-read");
  assert.equal(body.result.resultType, undefined);
  assert.deepEqual(body.result.structuredContent.caller, { role: "user", canUpdateGlobalPrompts: false });
});

test("GET and DELETE use protocol rejection and never run the private authorization callback", async () => {
  const f = await fixture();
  for (const method of ["GET", "DELETE"]) {
    const response = await f.route[method](new Request(endpoint, { method }));
    assert.equal(response.status, 405); assert.equal(response.headers.get("Allow"), "POST");
  }
  assert.deepEqual(f.state.calls, []);
});
