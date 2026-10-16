import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import ts from "typescript";

const sqlite = new DatabaseSync(":memory:");
for (const migration of readdirSync(new URL("../drizzle/",import.meta.url)).filter((name) => name.endsWith(".sql")).sort()) sqlite.exec(readFileSync(new URL(`../drizzle/${migration}`,import.meta.url),"utf8"));
const objects = new Map();
const d1 = {
  prepare(sql) {
    const statement = sqlite.prepare(sql);
    let parameters = [];
    return {
      bind(...values) { parameters = values; return this; },
      async first() { return statement.get(...parameters) ?? null; },
      async all() { return { results: statement.all(...parameters), success: true }; },
      async run() { return { success: true, meta: statement.run(...parameters) }; },
      execute() {
        if (statement.columns().length) return { results: statement.all(...parameters), success: true };
        return { results: [], success: true, meta: statement.run(...parameters) };
      },
    };
  },
  async batch(statements) {
    sqlite.exec("BEGIN");
    try {
      const results = statements.map((statement) => statement.execute());
      sqlite.exec("COMMIT");
      return results;
    } catch (error) { sqlite.exec("ROLLBACK"); throw error; }
  },
};
const bucket = {
  async put(key,bytes) { objects.set(key,new Uint8Array(bytes)); },
  async delete(keys) { for (const key of typeof keys === "string" ? [keys] : keys) objects.delete(key); },
  async get(key) { const bytes = objects.get(key); return bytes ? { body: bytes, size: bytes.byteLength, httpEtag: '"test-etag"' } : null; },
};
globalThis.__studioTest = { user: null, env: { DB: d1, BUCKET: bucket } };
function url(source) { return `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`; }
function load(path,replacements = []) {
  let source = ts.transpileModule(readFileSync(new URL(path,import.meta.url),"utf8"),{ compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
  for (const [from,to] of replacements) source = source.replaceAll(JSON.stringify(from),JSON.stringify(to));
  return url(source);
}
const envUrl = url("export const env = globalThis.__studioTest.env;");
const authUrl = url("export async function getChatGPTUser(){return globalThis.__studioTest.user;} export function chatGPTSignInPath(){return '/signin-with-chatgpt?return_to=%2F';} export function chatGPTSignOutPath(){return '/signout-with-chatgpt?return_to=%2F';}");
const apiUrl = load("./studio-api.ts",[["cloudflare:workers",envUrl],["@/app/chatgpt-auth",authUrl]]);
const validationUrl = load("./studio-validation.ts");
const providerUrl = load("./studio-provider.ts",[["./studio-validation",validationUrl]]);
const capabilitiesUrl = load("./studio-capabilities.ts");
const routerUrl = load("./studio-router.ts",[["./studio-validation",validationUrl],["./studio-provider",providerUrl],["./studio-capabilities",capabilitiesUrl]]);
const configUrl = load("./studio-config.ts",[["./studio-provider",providerUrl],["./studio-router",routerUrl]]);
const credentialsUrl = load("./studio-credentials.ts",[["./studio-config",configUrl],["./studio-provider",providerUrl],["./studio-router",routerUrl],["./studio-validation",validationUrl]]);
const variationUrl = load("./studio-image-variation.ts");
const maskUrl = load("./studio-mask.ts",[["./studio-validation",validationUrl],["./studio-provider",providerUrl]]);
const anglesUrl = load("./studio-angle-generator.ts");
const storageUrl = load("./studio-storage.ts",[["./studio-api",apiUrl],["./studio-angle-generator",anglesUrl]]);
const downloadUrl = load("./studio-download.ts");
const cleanupUrl = load("./studio-file-cleanup.ts",[["./studio-api",apiUrl]]);
const generationRequestsUrl = load("./studio-generation-requests.ts",[["./studio-api",apiUrl]]);
const featureUrl = load("../app/feature-data.ts");
const promptSettingsUrl = load("./studio-prompt-settings.ts",[["../app/feature-data",featureUrl],["./studio-api",apiUrl]]);
const controlsUrl = load("../app/feature-controls.ts");
const featureRegistry = await import(featureUrl);
const featureControls = await import(controlsUrl);
const api = await import(apiUrl);
const storage = await import(storageUrl);
const session = await import(load("../app/api/session/route.ts",[["cloudflare:workers",envUrl],["@/app/chatgpt-auth",authUrl],["@/lib/studio-api",apiUrl],["@/lib/studio-credentials",credentialsUrl]]));
const preferences = await import(load("../app/api/preferences/route.ts",[["@/lib/studio-api",apiUrl]]));
const files = await import(load("../app/api/files/[id]/route.ts",[["@/lib/studio-api",apiUrl],["@/lib/studio-storage",storageUrl],["@/lib/studio-download",downloadUrl]]));
const history = await import(load("../app/api/history/route.ts",[["@/lib/studio-api",apiUrl],["@/lib/studio-file-cleanup",cleanupUrl]]));
const deleteHistory = await import(load("../app/api/history/[id]/route.ts",[["@/lib/studio-api",apiUrl],["@/lib/studio-file-cleanup",cleanupUrl]]));
const generationRequests = await import(generationRequestsUrl);
const promptSettings = await import(promptSettingsUrl);
const generationStatus = await import(load("../app/api/generate/requests/[id]/route.ts",[["@/lib/studio-api",apiUrl],["@/lib/studio-generation-requests",generationRequestsUrl]]));
const generate = await import(load("../app/api/generate/route.ts",[["cloudflare:workers",envUrl],["@/app/feature-data",featureUrl],["@/app/feature-controls",controlsUrl],["@/lib/studio-api",apiUrl],["@/lib/studio-provider",providerUrl],["@/lib/studio-storage",storageUrl],["@/lib/studio-validation",validationUrl],["@/lib/studio-credentials",credentialsUrl],["@/lib/studio-image-variation",variationUrl],["@/lib/studio-prompt-settings",promptSettingsUrl],["@/lib/studio-router",routerUrl],["@/lib/studio-mask",maskUrl],["@/lib/studio-generation-requests",generationRequestsUrl],["@/lib/studio-angle-generator",anglesUrl]]));
const providerTest = await import(load("../app/api/provider/test/route.ts",[["cloudflare:workers",envUrl],["@/lib/studio-api",apiUrl],["@/lib/studio-provider",providerUrl],["@/lib/studio-validation",validationUrl],["@/lib/studio-credentials",credentialsUrl],["@/lib/studio-image-variation",variationUrl],["@/lib/studio-router",routerUrl]]));
const uploads = await import(load("../app/api/uploads/route.ts",[["@/lib/studio-api",apiUrl],["@/lib/studio-validation",validationUrl],["@/lib/studio-storage",storageUrl]]));
const originalFetch = globalThis.fetch;
const alice = { userId: "site-user-a", email: "a@example.invalid", displayName: "A" };
const bob = { userId: "site-user-b", email: "b@example.invalid", displayName: "B" };
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRuoAAAAASUVORK5CYII=","base64");
const request = (path,body,origin = "https://studio.example.invalid") => new Request(`https://studio.example.invalid${path}`,{ method: "POST", headers: { "Content-Type": "application/json", Origin: origin }, body: JSON.stringify(body) });

test.after(() => { globalThis.fetch = originalFetch; delete globalThis.__studioTest; sqlite.close(); });

test("session reports missing provider configuration without exposing secrets", async () => {
  globalThis.__studioTest.user = null;
  const result = await (await session.GET()).json();
  assert.equal(result.authenticated,false);
  assert.equal(result.provider.configured,false);
  assert.ok(result.signInUrl.startsWith("/signin-with-chatgpt"));
  assert.equal(JSON.stringify(result).includes("apiKey"),false);
});

test("generation rejects anonymous callers and missing keys before paid provider calls", async () => {
  globalThis.fetch = async () => { throw new Error("unexpected paid call"); };
  globalThis.__studioTest.user = null;
  const body = { featureId: "beranda", kind: "text", prompt: "Hello", options: {}, images: [] };
  let result = await generate.POST(request("/api/generate",body));
  assert.equal(result.status,401);
  assert.equal((await result.json()).code,"authentication_required");
  globalThis.__studioTest.user = alice;
  result = await generate.POST(request("/api/generate",body));
  assert.equal(result.status,503);
  assert.equal((await result.json()).code,"provider_not_configured");
});

test("preferences persist by the stable Site user ID and reject cross-origin writes", async () => {
  globalThis.__studioTest.user = alice;
  const saved = await preferences.POST(request("/api/preferences",{ favorites: ["beranda"], theme: "light", language: "en" }));
  assert.equal(saved.status,200);
  globalThis.__studioTest.user = bob;
  assert.deepEqual((await (await preferences.GET()).json()).favorites,[]);
  assert.equal((await preferences.POST(request("/api/preferences",{ theme: "dark" },"https://attacker.example.invalid"))).status,403);
  globalThis.__studioTest.user = alice;
  assert.equal((await (await preferences.GET()).json()).language,"en");
  assert.equal((await preferences.POST(request("/api/preferences",{ language: "ms" }))).status,200);
  assert.equal((await (await preferences.GET()).json()).language,"ms");
});

test("uploaded files can only be retrieved by their owner", async () => {
  globalThis.__studioTest.user = alice;
  const form = new FormData(); form.set("file",new File([png],"product.png",{ type: "image/png" }));
  const uploaded = await uploads.POST(new Request("https://studio.example.invalid/api/uploads",{ method: "POST", body: form, headers: { Origin: "https://studio.example.invalid" } }));
  assert.equal(uploaded.status,201);
  const item = await uploaded.json();
  assert.ok(item.url.startsWith("/api/files/"));
  globalThis.__studioTest.user = bob;
  assert.equal((await files.GET(new Request(`https://studio.example.invalid${item.url}`),{ params: Promise.resolve({ id: item.id }) })).status,404);
  globalThis.__studioTest.user = alice;
  const response = await files.GET(new Request(`https://studio.example.invalid${item.url}`),{ params: Promise.resolve({ id: item.id }) });
  assert.equal(response.status,200);
  assert.equal(response.headers.get("Cache-Control"),"private, no-store");
  assert.deepEqual(Buffer.from(await response.arrayBuffer()),png);
});

test("generation metadata excludes ephemeral API keys and is owner scoped", async () => {
  const input = { featureId: "beranda", prompt: "Example", kind: "text", options: { language: "en" }, images: [], apiKey: "ephemeral_key_must_not_persist" };
  const saved = await storage.persistGeneration(alice.userId,input,[{ kind: "text", text: "Actual provider output" }]);
  const row = sqlite.prepare("SELECT * FROM generations WHERE id = ?").get(saved.id);
  assert.equal(JSON.stringify(row).includes(input.apiKey),false);
  globalThis.__studioTest.user = bob;
  assert.deepEqual((await (await history.GET(new Request("https://studio.example.invalid/api/history"))).json()).items,[]);
  assert.equal((await deleteHistory.DELETE(new Request(`https://studio.example.invalid/api/history/${saved.id}`,{ method: "DELETE" }),{ params: Promise.resolve({ id: saved.id }) })).status,404);
  globalThis.__studioTest.user = alice;
  assert.equal((await deleteHistory.DELETE(new Request(`https://studio.example.invalid/api/history/${saved.id}`,{ method: "DELETE" }),{ params: Promise.resolve({ id: saved.id }) })).status,200);
});

test("history pagination retains records with equal timestamps", async () => {
  const insert = sqlite.prepare("INSERT INTO generations (id,user_id,feature_id,prompt,options_json,results_json,created_at) VALUES (?,?, 'beranda','Test','{}','[]',123456)");
  insert.run("same-time-b",alice.userId); insert.run("same-time-a",alice.userId);
  globalThis.__studioTest.user = alice;
  const first = await (await history.GET(new Request("https://studio.example.invalid/api/history?limit=1"))).json();
  assert.equal(first.items[0].id,"same-time-b");
  const second = await (await history.GET(new Request(`https://studio.example.invalid/api/history?limit=1&cursor=${encodeURIComponent(first.nextCursor)}`))).json();
  assert.equal(second.items[0].id,"same-time-a");
});

test("rate limits are durable and isolate different users", async () => {
  await api.rateLimit("rate-test-a","generate",1);
  await assert.rejects(() => api.rateLimit("rate-test-a","generate",1),{ code: "rate_limited", status: 429 });
  await api.rateLimit("rate-test-b","generate",1);
  sqlite.prepare("UPDATE studio_rate_limits SET window_started_at = ? WHERE id = ?").run(Date.now()-61_000,"rate-test-a:generate");
  await api.rateLimit("rate-test-a","generate",1);
});

test("provider tests authenticate callers and reject missing keys without making network requests", async () => {
  globalThis.fetch = async () => { throw new Error("unexpected network request"); };
  globalThis.__studioTest.user = null;
  assert.equal((await providerTest.POST(request("/api/provider/test",{ provider: "9router" }))).status,401);
  globalThis.__studioTest.user = alice;
  assert.equal((await providerTest.POST(request("/api/provider/test",{ provider: "9router", routerConfig: { baseUrl: "https://router.example.com/v1" } }))).status,503);
  assert.equal((await providerTest.POST(request("/api/provider/test",{ provider: "gemini" },"https://attacker.example.com"))).status,403);
});

test("Gemini connection tests use only a free GET models request and the selected personal key", async () => {
  globalThis.__studioTest.user = alice;
  globalThis.__studioTest.env.GEMINI_API_KEY = "server_gemini_key_fixture_12345";
  globalThis.fetch = async (url,options) => {
    assert.equal(url,"https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000");
    assert.equal(options.method,"GET");
    assert.equal(options.redirect,"manual");
    assert.equal(options.body,undefined);
    assert.equal(options.headers["x-goog-api-key"],"personal_gemini_key_fixture_12345");
    return Response.json({ models: [{ name: "models/gemini-3.8-flash" }, { name: "models/gemini-3.1-flash-image" }] });
  };
  try {
    const response = await providerTest.POST(request("/api/provider/test",{ provider: "gemini", apiKey: "personal_gemini_key_fixture_12345" }));
    assert.equal(response.status,200);
    const data = await response.json();
    assert.equal(data.provider,"gemini");
    assert.deepEqual(data.imageModels,["gemini-3.1-flash-image"]);
    assert.equal(JSON.stringify(data).includes("key_fixture"),false);
  } finally { delete globalThis.__studioTest.env.GEMINI_API_KEY; }
});

test("Gemini auth keys reach the official catalog and generation unchanged without leaking to responses or history", async () => {
  globalThis.__studioTest.user = alice;
  const key = "AQ." + "synthetic_fixture_".repeat(40) + ".only-for-tests";
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push(options.method);
    assert.equal(options.headers["x-goog-api-key"], key);
    assert.equal(options.headers.Authorization, undefined);
    assert.equal(new URL(url).hostname, "generativelanguage.googleapis.com");
    assert.equal(String(url).includes(key), false);
    if (options.method === "GET") return Response.json({ models: [{ name: "models/gemini-3.8-flash" }] });
    return Response.json({ candidates: [{ content: { parts: [{ text: "Auth key caption" }] } }] });
  };
  const tested = await providerTest.POST(request("/api/provider/test", { provider: "gemini", apiKey: ` \n${key}\r\n` }));
  assert.equal(tested.status, 200);
  assert.equal(JSON.stringify(await tested.json()).includes(key), false);
  const generated = await generate.POST(request("/api/generate", { provider: "gemini", apiKey: key, featureId: "beranda", kind: "text", prompt: "Write a caption", options: {}, images: [] }));
  assert.equal(generated.status, 200);
  const data = await generated.json();
  assert.equal(JSON.stringify(data).includes(key), false);
  assert.deepEqual(calls, ["GET", "POST"]);
  assert.equal(JSON.stringify(sqlite.prepare("SELECT * FROM generations WHERE user_id = ?").all(alice.userId)).includes(key), false);
});

test("9Router connection tests discover separate catalogs without generation charges", async () => {
  globalThis.__studioTest.user = alice;
  globalThis.fetch = async (url,options) => {
    assert.equal(options.method ?? "GET","GET");
    assert.equal(options.redirect,"manual");
    if (url.startsWith("https://cloudflare-dns.com/")) {
      assert.equal(options.headers.Authorization,undefined);
      return Response.json({ Status: 0, Answer: [{ type: 1, data: "93.184.216.34", TTL: 1 }] });
    }
    assert.equal(options.headers.Authorization,"Bearer personal_router_key_fixture");
    if (url.endsWith("/models")) return Response.json({ data: [{ id: "selected/text-model" }] });
    if (url.endsWith("/models/image")) return Response.json({ data: [{ id: "cx/image-model" }] });
    if (url.endsWith("/models/tts")) return Response.json({ error: "unsupported" },{ status: 404 });
    throw new Error("unexpected URL");
  };
  const response = await providerTest.POST(request("/api/provider/test",{ provider: "9router", apiKey: "personal_router_key_fixture", routerConfig: { baseUrl: "https://probe.example.com" } }));
  assert.equal(response.status,200);
  const data = await response.json();
  assert.deepEqual(data.models,["selected/text-model"]);
  assert.deepEqual(data.imageModels,["cx/image-model"]);
  assert.deepEqual(data.audioModels,[]);
  assert.ok(data.warnings.length);
});

test("9Router catalog diagnostics identify the remote authentication gate and distinguish HTTP 403", async () => {
  globalThis.__studioTest.user = { ...alice, userId: "router-auth-diagnostic-user" };
  const key = "personal_diagnostic_key_fixture";
  for (const status of [401,403]) {
    let catalogRequests = 0;
    globalThis.fetch = async (url,options) => {
      if (url.startsWith("https://cloudflare-dns.com/")) return Response.json({ Status: 0, Answer: [{ type: 1, data: "93.184.216.34", TTL: 1 }] });
      assert.equal(url,"https://auth-diagnostic.example.com/v1/models");
      assert.equal(options.headers.Authorization,`Bearer ${key}`);
      assert.equal(options.method,"GET");
      catalogRequests++;
      return Response.json({ error: status === 401 ? "API key required for remote API access" : `private diagnostic ${key}`, secret: key },{ status });
    };
    const response = await providerTest.POST(request("/api/provider/test",{ provider: "9router", apiKey: key, routerConfig: { baseUrl: "https://auth-diagnostic.example.com" } }));
    assert.equal(response.status,502);
    const data = await response.json();
    assert.equal(data.code,status === 401 ? "provider_authentication_failed" : "router_access_denied");
    assert.deepEqual(data.diagnostic,{ provider: "9router", stage: "catalog", endpoint: "models", method: "GET", upstreamStatus: status, reason: status === 401 ? "remote_api_key_not_accepted" : "access_denied" });
    assert.ok(data.error.includes(`GET models (HTTP ${status})`));
    assert.equal(data.error.includes("tidak mempunyai akses ke model"),false);
    assert.equal(JSON.stringify(data).includes(key),false);
    assert.equal(JSON.stringify(data).includes("private diagnostic"),false);
    assert.equal(catalogRequests,1);
  }
});

test("optional media authentication failures retain the successful text catalog with per-endpoint diagnostics", async () => {
  globalThis.__studioTest.user = { ...alice, userId: "router-partial-auth-user" };
  globalThis.fetch = async (url) => {
    if (url.startsWith("https://cloudflare-dns.com/")) return Response.json({ Status: 0, Answer: [{ type: 1, data: "93.184.216.34", TTL: 1 }] });
    if (url.endsWith("/models")) return Response.json({ data: [{ id: "provider/text-model" }] });
    if (url.endsWith("/models/image")) return Response.json({ error: "API key required for remote API access" },{ status: 401 });
    if (url.endsWith("/models/tts")) return new Response("private upstream proxy rejection",{ status: 403 });
    throw new Error("unexpected URL");
  };
  const response = await providerTest.POST(request("/api/provider/test",{ provider: "9router", apiKey: "router_fixture_key", routerConfig: { baseUrl: "https://partial-auth.example.com/v1" } }));
  assert.equal(response.status,200);
  const data = await response.json();
  assert.equal(data.ok,true);
  assert.equal(data.tested,"connection");
  assert.deepEqual(data.models,["provider/text-model"]);
  assert.deepEqual(data.imageModels,[]);
  assert.deepEqual(data.audioModels,[]);
  assert.equal(data.capabilities.text.catalogAvailable,true);
  assert.equal(data.capabilities.image.catalogAvailable,false);
  assert.equal(data.capabilities.audio.catalogAvailable,false);
  assert.equal(data.catalogErrors.image.diagnostic.endpoint,"models/image");
  assert.equal(data.catalogErrors.image.diagnostic.upstreamStatus,401);
  assert.equal(data.catalogErrors.audio.code,"router_access_denied");
  assert.equal(data.catalogErrors.audio.diagnostic.endpoint,"models/tts");
  assert.equal(data.catalogErrors.audio.diagnostic.upstreamStatus,403);
  assert.equal(data.warnings.length,2);
  assert.equal(JSON.stringify(data).includes("private upstream"),false);
});

test("9Router generation authentication failures report their generation endpoint and save no result", async () => {
  const userId = "router-generation-auth-user";
  globalThis.__studioTest.user = { ...alice, userId };
  let requests = 0;
  globalThis.fetch = async (url,options) => {
    if (url.startsWith("https://cloudflare-dns.com/")) return Response.json({ Status: 0, Answer: [{ type: 1, data: "93.184.216.34", TTL: 1 }] });
    assert.equal(url,"https://generation-auth.example.com/v1/chat/completions");
    assert.equal(options.method,"POST");
    requests++;
    return Response.json({ error: { message: "sensitive provider credential" } },{ status: 401 });
  };
  const response = await generate.POST(request("/api/generate",{ provider: "9router", featureId: "beranda", kind: "text", prompt: "Hello", options: {}, images: [], apiKey: "router_fixture_key", routerConfig: { baseUrl: "https://generation-auth.example.com/v1", textModel: "my-router/text-model" } }));
  assert.equal(response.status,502);
  const data = await response.json();
  assert.equal(data.code,"router_generation_authentication_failed");
  assert.deepEqual(data.diagnostic,{ provider: "9router", stage: "generation", endpoint: "chat/completions", method: "POST", upstreamStatus: 401, reason: "unauthorized" });
  assert.ok(data.error.includes("POST chat/completions (HTTP 401)"));
  assert.equal(JSON.stringify(data).includes("sensitive provider credential"),false);
  assert.equal(sqlite.prepare("SELECT COUNT(*) AS total FROM generations WHERE user_id = ?").get(userId).total,0);
  assert.equal(requests,1);
});

test("a revoked upstream OAuth token requests provider reconnection without blaming the 9Router key", async () => {
  globalThis.__studioTest.user = { ...alice, userId: "router-provider-reconnect-user" };
  const secret = "must_not_expose_provider_secret";
  const providerError = `[codex/gpt-5.4-mini] [401]: ${JSON.stringify({ error: { message: `Encountered invalidated oauth token for user, failing request ${secret}`, type: "invalid_request_error", code: "token_revoked", param: null }, status: 401 })} (reset after 2m)`;
  globalThis.fetch = async (url) => {
    if (url.startsWith("https://cloudflare-dns.com/")) return Response.json({ Status: 0, Answer: [{ type: 1, data: "93.184.216.34", TTL: 1 }] });
    return Response.json({ error: { message: providerError } },{ status: 401 });
  };
  const selection = { provider: "9router", apiKey: "router_fixture_key", routerConfig: { baseUrl: "https://reconnect.example.com/v1", textModel: "codex/gpt-5.4-mini" } };
  const response = await generate.POST(request("/api/generate",{ ...selection, featureId: "beranda", kind: "text", prompt: "Hello", options: {}, images: [] }));
  assert.equal(response.status,502);
  const data = await response.json();
  assert.equal(data.code,"router_provider_reauthentication_required");
  assert.equal(data.diagnostic.stage,"generation");
  assert.equal(data.diagnostic.reason,"provider_token_revoked");
  assert.ok(data.error.includes("login ulang provider"));
  assert.equal(JSON.stringify(data).includes(secret),false);
  assert.equal(JSON.stringify(data).includes("[codex/gpt-5.4-mini]"),false);
  assert.equal(sqlite.prepare("SELECT COUNT(*) AS total FROM generations WHERE user_id = ?").get("router-provider-reconnect-user").total,0);

  // The same untrusted marker from a catalog response must not be interpreted
  // as proof of an upstream generation/provider authentication failure.
  const catalog = await providerTest.POST(request("/api/provider/test",selection));
  const catalogData = await catalog.json();
  assert.equal(catalogData.code,"provider_authentication_failed");
  assert.equal(catalogData.diagnostic.stage,"catalog");
  assert.equal(catalogData.diagnostic.reason,"unauthorized");
});

test("an explicit 9Router remote API-key rejection during generation remains an instance authentication error", async () => {
  globalThis.__studioTest.user = { ...alice, userId: "router-generation-keygate-user" };
  globalThis.fetch = async (url) => {
    if (url.startsWith("https://cloudflare-dns.com/")) return Response.json({ Status: 0, Answer: [{ type: 1, data: "93.184.216.34", TTL: 1 }] });
    return Response.json({ error: "API key required for remote API access" },{ status: 401 });
  };
  const response = await generate.POST(request("/api/generate",{ provider: "9router", apiKey: "router_fixture_key", routerConfig: { baseUrl: "https://generation-keygate.example.com/v1", textModel: "provider/text-model" }, featureId: "beranda", kind: "text", prompt: "Hello", options: {}, images: [] }));
  const data = await response.json();
  assert.equal(response.status,502);
  assert.equal(data.code,"provider_authentication_failed");
  assert.equal(data.diagnostic.stage,"generation");
  assert.equal(data.diagnostic.reason,"remote_api_key_not_accepted");
});

test("explicit 9Router generation never borrows a Gemini key or falls back to Google", async () => {
  globalThis.__studioTest.user = { ...alice, userId: "router-route-user" };
  globalThis.__studioTest.env.GEMINI_API_KEY = "server_gemini_key_fixture_12345";
  globalThis.fetch = async (url,options) => {
    if (url.startsWith("https://cloudflare-dns.com/")) return Response.json({ Status: 0, Answer: [{ type: 1, data: "93.184.216.34", TTL: 1 }] });
    assert.equal(url,"https://generation.example.com/v1/chat/completions");
    assert.equal(options.headers.Authorization,"Bearer personal_router_key_fixture");
    assert.equal(options.headers["x-goog-api-key"],undefined);
    assert.equal(JSON.parse(options.body).model,"my-router/text-model");
    return Response.json({ choices: [{ message: { content: "Router-generated text" } }] });
  };
  const input = { provider: "9router", featureId: "beranda", kind: "text", prompt: "Hello", options: {}, images: [], routerConfig: { baseUrl: "https://generation.example.com/v1", textModel: "my-router/text-model" } };
  try {
    const missing = await generate.POST(request("/api/generate",input));
    assert.equal(missing.status,503);
    const response = await generate.POST(request("/api/generate",{ ...input, apiKey: "personal_router_key_fixture" }));
    assert.equal(response.status,200);
    const data = await response.json();
    assert.equal(data.results[0].text,"Router-generated text");
    const stored = sqlite.prepare("SELECT * FROM generations WHERE id = ?").get(data.id);
    assert.equal(JSON.stringify(stored).includes("personal_router_key_fixture"),false);
    assert.equal(JSON.stringify(stored).includes("generation.example.com"),false);
  } finally { delete globalThis.__studioTest.env.GEMINI_API_KEY; }
});

test("a failed optional media catalog preserves available catalogs and records an honest connection-only status", async () => {
  globalThis.__studioTest.user = { ...alice, userId: "partial-catalog-user" };
  globalThis.fetch = async (url) => {
    if (url.startsWith("https://cloudflare-dns.com/")) return Response.json({ Status: 0, Answer: [{ type: 1, data: "93.184.216.34", TTL: 1 }] });
    if (url.endsWith("/models")) return Response.json({ data: [{ id: "provider/text-model" }] });
    if (url.endsWith("/models/image")) return Response.json({ error: "upstream private diagnostic" },{ status: 500 });
    if (url.endsWith("/models/tts")) return Response.json({ data: [{ id: "openai/tts-model/alloy" }] });
    throw new Error("unexpected URL");
  };
  const response = await providerTest.POST(request("/api/provider/test",{ provider: "9router", apiKey: "router_fixture_key", routerConfig: { baseUrl: "https://partial-catalog.example.com/v1" } }));
  assert.equal(response.status,200);
  const data = await response.json();
  assert.equal(data.tested,"connection");
  assert.deepEqual(data.models,["provider/text-model"]);
  assert.deepEqual(data.audioModels,["openai/tts-model/alloy"]);
  assert.deepEqual(data.imageModels,[]);
  assert.equal(data.capabilities.image.catalogAvailable,false);
  assert.equal(data.catalogErrors.image.code,"provider_unavailable");
  assert.equal(JSON.stringify(data).includes("upstream private diagnostic"),false);
});

test("missing models and incompatible references do not consume generation quota or contact providers", async () => {
  const userId = "configuration-errors-user";
  globalThis.__studioTest.user = { ...alice, userId };
  globalThis.fetch = async () => { throw new Error("configuration errors must not call a provider"); };
  const baseRequest = { provider: "9router", apiKey: "router_fixture_key", prompt: "Test", options: {}, images: [], routerConfig: { baseUrl: "https://config-errors.example.com/v1" } };
  const missing = await generate.POST(request("/api/generate",{ ...baseRequest, featureId: "beranda", kind: "text" }));
  assert.equal(missing.status,400);
  assert.equal((await missing.json()).code,"router_model_required");
  const imageFeature = featureRegistry.features.find((feature) => feature.kind === "image" && !feature.fields.some((field) => field.type === "file" && field.required));
  assert.ok(imageFeature);
  const incompatible = await generate.POST(request("/api/generate",{ ...baseRequest, featureId: imageFeature.id, kind: "image", images: [{ data: png.toString("base64"), mimeType: "image/png" }], routerConfig: { ...baseRequest.routerConfig, imageModel: "openai/image-model" } }));
  assert.equal(incompatible.status,422);
  assert.equal((await incompatible.json()).code,"router_reference_images_unsupported");
  const unsupportedRatio = await generate.POST(request("/api/generate",{ ...baseRequest, featureId: imageFeature.id, kind: "image", options: { aspectRatio: "4:5" }, routerConfig: { ...baseRequest.routerConfig, imageModel: "nb/image-model" } }));
  assert.equal(unsupportedRatio.status,422);
  assert.equal((await unsupportedRatio.json()).code,"router_aspect_ratio_unsupported");
  assert.equal(sqlite.prepare("SELECT hits FROM studio_rate_limits WHERE id = ?").get(`${userId}:generate`),undefined);
  assert.equal(sqlite.prepare("SELECT count(*) AS count FROM generations WHERE user_id = ?").get(userId).count,0);
});

test("known inactive branch photos are removed while explicit generic and legacy references are preserved", async () => {
  const userId = "active-reference-user";
  globalThis.__studioTest.user = { ...alice, userId };
  const feature = featureRegistry.features.flatMap((item) => [item,...(item.variants ?? [])]).find((item) => item.id === "before-after");
  assert.ok(feature);
  const options = { "before-after-input-mode": "product" };
  const activeRefs = featureControls.applicableFields(feature,options).filter((field) => field.type === "file" && field.required).map((field) => ({ data: png.toString("base64"), mimeType: "image/png", fieldId: field.id }));
  const inactiveRef = { data: png.toString("base64"), mimeType: "image/png", fieldId: "ba-before-upload" };
  const genericRef = { data: png.toString("base64"), mimeType: "image/png", fieldId: "source-image" };
  const legacyRef = { data: png.toString("base64"), mimeType: "image/png" };
  globalThis.fetch = async (_url,init) => {
    const parts = JSON.parse(init.body).contents[0].parts;
    assert.equal(parts.filter((part) => part.inlineData).length,activeRefs.length+2);
    assert.equal(parts[0].text.includes("ba-before-upload"),false);
    return Response.json({ candidates: [{ content: { parts: [{ inlineData: { data: png.toString("base64"), mimeType: "image/png" } }] } }] });
  };
  const response = await generate.POST(request("/api/generate",{ provider: "gemini", apiKey: "gemini_fixture_key_long_enough", featureId: feature.id, kind: "image", prompt: "Make a comparison", options, images: [...activeRefs,inactiveRef,genericRef,legacyRef] }));
  assert.equal(response.status,200);
});

test("inactive branch fields and cached ratios are omitted from both provider controls and stored options", async () => {
  const userId = "active-branch-user";
  globalThis.__studioTest.user = { ...alice, userId };
  const feature = featureRegistry.features.find((item) => item.id === "desain-rumah");
  const options = { "dr-mode": "interior", "dr-interior-ratio-options": "1:1", "dr-eksterior-ratio-options": "16:9", "dr-interior-instruction-input": "Paint the room blue", "dr-eksterior-instruction-input": "EXTERIOR_DO_NOT_LEAK", aspectRatio: "16:9" };
  const refs = featureControls.applicableFields(feature,options).filter((field) => field.type === "file" && field.required).map((field) => ({ data: png.toString("base64"), mimeType: "image/png", fieldId: field.id }));
  globalThis.fetch = async (_url,init) => {
    const prompt = JSON.parse(init.body).contents[0].parts[0].text;
    assert.equal(prompt.includes("dr-eksterior-"),false);
    assert.equal(prompt.includes("EXTERIOR_DO_NOT_LEAK"),false);
    assert.ok(prompt.includes('"aspectRatio":"1:1"'));
    return Response.json({ candidates: [{ content: { parts: [{ inlineData: { data: png.toString("base64"), mimeType: "image/png" } }] } }] });
  };
  const response = await generate.POST(request("/api/generate",{ provider: "gemini", apiKey: "gemini_fixture_key_long_enough", featureId: feature.id, kind: "image", prompt: "Repaint the living room", options, images: refs }));
  assert.equal(response.status,200);
  const data = await response.json();
  const stored = JSON.parse(sqlite.prepare("SELECT options_json FROM generations WHERE id = ?").get(data.id).options_json);
  assert.equal(stored["dr-eksterior-instruction-input"],undefined);
  assert.equal(stored["dr-eksterior-ratio-options"],undefined);
  assert.equal(stored.aspectRatio,"1:1");
});

test("a full generation quota blocks provider calls and creates no fake history", async () => {
  const userId = "quota-route-user";
  globalThis.__studioTest.user = { ...alice, userId };
  sqlite.prepare("INSERT INTO studio_rate_limits (id,window_started_at,hits) VALUES (?,?,12)").run(`${userId}:generate`,Date.now());
  globalThis.fetch = async () => { throw new Error("quota exhaustion must not call a provider"); };
  const response = await generate.POST(request("/api/generate",{ provider: "9router", apiKey: "router_fixture_key", featureId: "beranda", kind: "text", prompt: "Test", options: {}, images: [], routerConfig: { baseUrl: "https://quota.example.com/v1", textModel: "provider/text-model" } }));
  assert.equal(response.status,429);
  assert.equal((await response.json()).code,"rate_limited");
  assert.equal(sqlite.prepare("SELECT count(*) AS count FROM generations WHERE user_id = ?").get(userId).count,0);
});

test("partial R2 persistence failures remove staged files and never report a saved generation", async () => {
  const userId = "r2-failure-user";
  globalThis.__studioTest.user = { ...alice, userId };
  const imageFeature = featureRegistry.features.find((feature) => feature.kind === "image" && !feature.fields.some((field) => field.type === "file" && field.required));
  const originalPut = bucket.put;
  const initialObjects = objects.size;
  let puts = 0;
  bucket.put = async (...args) => { if (++puts === 2) throw new Error("simulated R2 outage"); return originalPut(...args); };
  globalThis.fetch = async () => Response.json({ candidates: [{ content: { parts: [1,2].map(() => ({ inlineData: { data: png.toString("base64"), mimeType: "image/png" } })) } }] });
  try {
    const response = await generate.POST(request("/api/generate",{ provider: "gemini", apiKey: "gemini_fixture_key_long_enough", featureId: imageFeature.id, kind: "image", prompt: "Test", options: {}, images: [] }));
    assert.equal(response.status,500);
    assert.deepEqual((await response.json()).results,[]);
    assert.equal(sqlite.prepare("SELECT count(*) AS count FROM generations WHERE user_id = ?").get(userId).count,0);
    assert.equal(sqlite.prepare("SELECT count(*) AS count FROM studio_files WHERE user_id = ?").get(userId).count,0);
    assert.equal(objects.size,initialObjects);
  } finally { bucket.put = originalPut; }
});

test("manual object removal requires an explicit PNG mask without treating it as an additional source photo", async () => {
  globalThis.__studioTest.user = { ...alice, userId: "manual-mask-user" };
  const photo = { data: png.toString("base64"), mimeType: "image/png", fieldId: "remover-upload-input" };
  const mask = { data: png.toString("base64"), mimeType: "image/png", fieldId: "object-removal-mask", role: "mask" };
  const input = { provider: "gemini", apiKey: "gemini_fixture_key_long_enough", featureId: "object-remover", kind: "image", prompt: "Remove the selected object", options: { "object-remover-choice-1": "manual", "object-remover-choice-2": "2" }, images: [photo] };
  globalThis.fetch = async () => { throw new Error("a missing mask must not call a provider"); };
  const missing = await generate.POST(request("/api/generate",input));
  assert.equal(missing.status,400);
  assert.equal((await missing.json()).code,"mask_required");
  assert.equal(sqlite.prepare("SELECT hits FROM studio_rate_limits WHERE id = ?").get("manual-mask-user:generate"),undefined);
  globalThis.fetch = async (_url,init) => {
    const parts = JSON.parse(init.body).contents[0].parts;
    assert.equal(parts.filter((part) => part.inlineData).length,2);
    assert.ok(parts[0].text.includes("EDIT MASK, not a second subject/photo"));
    assert.ok(parts[0].text.includes("White selects the area to remove"));
    return Response.json({ candidates: [{ content: { parts: [{ inlineData: { data: png.toString("base64"), mimeType: "image/png" } }] } }] });
  };
  const success = await generate.POST(request("/api/generate",{ ...input, images: [photo,mask] }));
  assert.equal(success.status,200);
  const result = await success.json();
  assert.equal(result.results.length,1);
  assert.ok(result.warnings.some((warning) => warning.includes("bukan inpainting")));
  assert.deepEqual(result.results[0].warnings,result.warnings);
  const historyItem = (await (await history.GET(new Request("https://studio.example.invalid/api/history"))).json()).items.find((item) => item.id === result.id);
  assert.deepEqual(historyItem.results[0].warnings,result.warnings);
});

test("stale or misplaced masks are rejected before generation quota and network calls", async () => {
  globalThis.__studioTest.user = { ...alice, userId: "invalid-mask-user" };
  const photo = { data: png.toString("base64"), mimeType: "image/png", fieldId: "remover-upload-input" };
  const mask = { data: png.toString("base64"), mimeType: "image/png", fieldId: "object-removal-mask", role: "mask" };
  const input = { provider: "gemini", apiKey: "gemini_fixture_key_long_enough", featureId: "object-remover", kind: "image", prompt: "Remove the selected object", options: { "object-remover-choice-1": "auto" }, images: [photo,mask] };
  globalThis.fetch = async () => { throw new Error("an invalid mask must not call a provider"); };
  const automatic = await generate.POST(request("/api/generate",input));
  assert.equal(automatic.status,400);
  assert.equal((await automatic.json()).code,"mask_unexpected");
  const changedSize = Buffer.from(png); changedSize.writeUInt32BE(2,16);
  const mismatch = await generate.POST(request("/api/generate",{ ...input, options: { "object-remover-choice-1": "manual" }, images: [photo,{ ...mask,data: changedSize.toString("base64") }] }));
  assert.equal(mismatch.status,400);
  assert.equal((await mismatch.json()).code,"mask_dimensions_mismatch");
  assert.equal(sqlite.prepare("SELECT hits FROM studio_rate_limits WHERE id = ?").get("invalid-mask-user:generate"),undefined);
});

function generationBody(overrides = {}) {
  return { provider: "gemini", apiKey: "gemini_fixture_key_long_enough", featureId: "beranda", kind: "text", prompt: "Write a short caption", options: {}, images: [], requestId: crypto.randomUUID(), ...overrides };
}
function statusRequest(requestId) {
  return generationStatus.GET(new Request(`https://studio.example.invalid/api/generate/requests/${requestId}`),{ params: Promise.resolve({ id: requestId }) });
}
function streamRequest(body) {
  const value = request("/api/generate",body);
  value.headers.set("Accept","application/x-ndjson");
  return value;
}
const geminiText = () => Response.json({ candidates: [{ content: { parts: [{ text: "A real fixture caption" }] } }] });

test("generation streams acceptance before provider work, sends heartbeats, and deduplicates an in-flight replay", async (t) => {
  globalThis.__studioTest.user = { ...alice, userId: "stream-receipt-user" };
  let tickHeartbeat;
  const intervalToken = Symbol("heartbeat");
  t.mock.method(globalThis,"setInterval",(callback,delay) => { assert.equal(delay,10_000); tickHeartbeat = callback; return intervalToken; });
  const clearHeartbeat = t.mock.method(globalThis,"clearInterval",(token) => assert.equal(token,intervalToken));
  let calls = 0, release;
  globalThis.fetch = () => { calls++; return new Promise((resolve) => { release = resolve; }); };
  const body = generationBody();
  const response = await generate.POST(streamRequest(body));
  assert.equal(response.status,200);
  assert.match(response.headers.get("content-type"),/^application\/x-ndjson/);
  assert.equal(response.headers.get("x-request-id"),body.requestId);
  assert.equal(calls,0,"the response must be returned before starting a paid call");
  const reader = response.body.getReader();
  const first = JSON.parse(new TextDecoder().decode((await reader.read()).value));
  assert.deepEqual(first,{ type: "accepted", requestId: body.requestId });
  assert.equal(calls,0,"acceptance must precede the provider request");
  const heartbeatRead = reader.read();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(calls,1);
  const replay = await generate.POST(streamRequest(body));
  assert.equal(replay.status,202);
  assert.deepEqual(await replay.json(),{ status: "pending", requestId: body.requestId });
  assert.equal(calls,1);
  tickHeartbeat();
  assert.deepEqual(JSON.parse(new TextDecoder().decode((await heartbeatRead).value)),{ type: "heartbeat", requestId: body.requestId });
  release(geminiText());
  const terminal = JSON.parse(new TextDecoder().decode((await reader.read()).value));
  assert.equal(terminal.type,"result");
  assert.equal(terminal.data.requestId,body.requestId);
  assert.equal(terminal.data.results[0].text,"A real fixture caption");
  assert.equal((await reader.read()).done,true);
  assert.equal(clearHeartbeat.mock.callCount(),1,"completed work must stop the heartbeat interval");
});

test("canceling a stream stops heartbeats and never starts a replacement provider call", async (t) => {
  const userId = "stream-cancel-user";
  globalThis.__studioTest.user = { ...alice,userId };
  let heartbeat, calls = 0, release;
  const intervalToken = Symbol("heartbeat");
  t.mock.method(globalThis,"setInterval",(callback) => { heartbeat = callback; return intervalToken; });
  const clearHeartbeat = t.mock.method(globalThis,"clearInterval",(token) => assert.equal(token,intervalToken));
  globalThis.fetch = () => { calls++; return new Promise((resolve) => { release = resolve; }); };
  const body = generationBody();
  const response = await generate.POST(streamRequest(body));
  const reader = response.body.getReader();
  await reader.read();
  const pendingRead = reader.read();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(calls,1);
  await reader.cancel();
  assert.equal((await pendingRead).done,true);
  assert.equal(clearHeartbeat.mock.callCount(),1,"disconnect must immediately stop interval work");
  assert.doesNotThrow(() => heartbeat(),"a late interval callback cannot write to a canceled stream");
  // A still-running local process may finish the original request after cancel.
  // Production Workers may terminate it instead; the receipt remains recoverable/unknown.
  release(geminiText());
  await new Promise((resolve) => setImmediate(resolve));
  const status = await (await statusRequest(body.requestId)).json();
  assert.equal(status.status,"completed");
  assert.equal(calls,1);
});

test("canceling before provider demand leaves a receipt without invoking AI", async () => {
  const userId = "stream-early-cancel-user";
  globalThis.__studioTest.user = { ...alice,userId };
  let calls = 0;
  globalThis.fetch = async () => { calls++; return geminiText(); };
  const body = generationBody();
  const response = await generate.POST(streamRequest(body));
  await response.body.cancel();
  assert.equal(calls,0);
  assert.deepEqual(await (await statusRequest(body.requestId)).json(),{ status: "pending",requestId: body.requestId });
  sqlite.prepare("UPDATE studio_generation_requests SET created_at = ? WHERE user_id = ? AND request_id = ?").run(Date.now()-generationRequests.REQUEST_PENDING_MS-1,userId,body.requestId);
  const staleReplay = await generate.POST(streamRequest(body));
  assert.equal(staleReplay.status,202);
  assert.deepEqual(await staleReplay.json(),{ status: "unknown",requestId: body.requestId });
  assert.equal(calls,0,"an interrupted receipt must never silently restart generation");
});

test("completed requests replay without provider charges while changed input conflicts and secrets never enter receipts", async () => {
  const userId = "completed-receipt-user";
  globalThis.__studioTest.user = { ...alice, userId };
  let calls = 0;
  globalThis.fetch = async () => { calls++; return geminiText(); };
  const body = generationBody({ options: { language: "id", z: 2, a: 1 } });
  const original = await (await generate.POST(request("/api/generate",body))).json();
  assert.equal(calls,1);
  const replay = await generate.POST(streamRequest({ ...body, apiKey: "another_fixture_key_long_enough", options: { a: 1, z: 2, language: "id" } }));
  assert.equal(replay.status,200);
  assert.deepEqual(await replay.json(),original);
  assert.equal(calls,1);
  const conflict = await generate.POST(request("/api/generate",{ ...body,prompt: "Different content" }));
  assert.equal(conflict.status,409);
  assert.equal((await conflict.json()).code,"request_id_conflict");
  assert.equal(calls,1);
  const row = sqlite.prepare("SELECT * FROM studio_generation_requests WHERE user_id = ? AND request_id = ?").get(userId,body.requestId);
  assert.equal(row.status,"completed");
  assert.equal(row.generation_id,original.id);
  assert.match(row.fingerprint,/^[0-9a-f]{64}$/);
  assert.equal(JSON.stringify(row).includes(body.apiKey),false);
  assert.equal(JSON.stringify(row).includes(body.prompt),false);
  assert.equal(sqlite.prepare("SELECT count(*) AS count FROM generations WHERE user_id = ?").get(userId).count,1);
});

test("receipt status is owner-scoped and unauthenticated or invalid lookup is rejected", async () => {
  const body = generationBody();
  globalThis.__studioTest.user = { ...alice,userId: "status-owner-user" };
  globalThis.fetch = async () => geminiText();
  const generated = await (await generate.POST(request("/api/generate",body))).json();
  const owned = await statusRequest(body.requestId);
  assert.equal(owned.status,200);
  assert.deepEqual(await owned.json(),{ status: "completed", data: generated });
  globalThis.__studioTest.user = bob;
  assert.equal((await statusRequest(body.requestId)).status,404);
  assert.equal((await statusRequest("not-a-uuid")).status,400);
  globalThis.__studioTest.user = null;
  assert.equal((await statusRequest(body.requestId)).status,401);
});

test("atomic receipt claims cap each user's pending work at two and retain stale requests as unknown without retry", async () => {
  const userId = "concurrent-receipt-user";
  globalThis.__studioTest.user = { ...alice,userId };
  const [a,b,c] = [crypto.randomUUID(),crypto.randomUUID(),crypto.randomUUID()];
  const claims = await Promise.allSettled([a,b,c].map((id) => generationRequests.claimGenerationRequest(userId,id,"fingerprint")));
  assert.equal(claims.filter((result) => result.status === "fulfilled").length,2);
  const rejection = claims.find((result) => result.status === "rejected").reason;
  assert.equal(rejection.code,"generation_concurrency_limited");
  assert.equal((await generationRequests.claimGenerationRequest(userId,a,"fingerprint")).claimed,false);
  await assert.rejects(() => generationRequests.claimGenerationRequest(userId,a,"changed"),{ code: "request_id_conflict" });
  assert.equal((await generationRequests.claimGenerationRequest("other-pending-user",a,"fingerprint")).claimed,true);
  sqlite.prepare("UPDATE studio_generation_requests SET created_at = ? WHERE user_id = ? AND request_id = ?").run(Date.now()-generationRequests.REQUEST_PENDING_MS-1,userId,a);
  const status = await statusRequest(a);
  assert.equal(status.status,202);
  assert.deepEqual(await status.json(),{ status: "unknown", requestId: a });
  assert.equal((await generationRequests.claimGenerationRequest(userId,a,"fingerprint")).claimed,false);
  assert.equal((await generationRequests.claimGenerationRequest(userId,c,"fingerprint")).claimed,true);
});

test("failed streamed generations retain classified errors, replay safely, and save no fabricated history", async () => {
  const userId = "failed-receipt-user";
  globalThis.__studioTest.user = { ...alice,userId };
  const body = generationBody();
  let calls = 0;
  globalThis.fetch = async () => { calls++; return Response.json({ error: { message: "private provider detail" } },{ status: 429 }); };
  const response = await generate.POST(streamRequest(body));
  const events = (await response.text()).trim().split("\n").map(JSON.parse);
  assert.equal(events[0].type,"accepted");
  assert.equal(events.at(-1).type,"error");
  assert.equal(events.at(-1).status,429);
  assert.equal(events.at(-1).code,"provider_quota_exceeded");
  assert.equal(JSON.stringify(events).includes("private provider detail"),false);
  const status = await (await statusRequest(body.requestId)).json();
  assert.equal(status.status,"failed");
  assert.equal(status.errorStatus,429);
  assert.equal(status.code,"provider_quota_exceeded");
  const replay = await generate.POST(request("/api/generate",body));
  assert.equal(replay.status,429);
  assert.equal((await replay.json()).code,"provider_quota_exceeded");
  assert.equal(calls,1);
  assert.equal(sqlite.prepare("SELECT count(*) AS count FROM generations WHERE user_id = ?").get(userId).count,0);
});

test("saved generation repairs an interrupted receipt update without another provider request", async () => {
  const userId = "receipt-update-failure-user";
  globalThis.__studioTest.user = { ...alice,userId };
  const body = generationBody();
  let calls = 0, failedUpdates = 0;
  globalThis.fetch = async () => { calls++; return geminiText(); };
  const originalPrepare = d1.prepare;
  d1.prepare = function (sql) {
    if (failedUpdates < 2 && sql.startsWith("UPDATE studio_generation_requests SET status = 'completed'")) { failedUpdates++; throw new Error("simulated final D1 update outage"); }
    return originalPrepare.call(this,sql);
  };
  try {
    const generated = await (await generate.POST(request("/api/generate",body))).json();
    assert.equal(sqlite.prepare("SELECT status FROM studio_generation_requests WHERE user_id = ? AND request_id = ?").get(userId,body.requestId).status,"pending");
    const recovered = await (await statusRequest(body.requestId)).json();
    assert.equal(recovered.status,"completed");
    assert.deepEqual(recovered.data,generated);
    assert.equal(sqlite.prepare("SELECT status FROM studio_generation_requests WHERE user_id = ? AND request_id = ?").get(userId,body.requestId).status,"pending");
    assert.deepEqual((await (await statusRequest(body.requestId)).json()).data,generated);
    assert.equal(sqlite.prepare("SELECT status FROM studio_generation_requests WHERE user_id = ? AND request_id = ?").get(userId,body.requestId).status,"completed");
    assert.equal(calls,1);
  } finally { d1.prepare = originalPrepare; }
});

test("invalid request IDs are rejected before receipt creation, quota, or provider work", async () => {
  const userId = "invalid-receipt-user";
  globalThis.__studioTest.user = { ...alice,userId };
  globalThis.fetch = async () => { throw new Error("invalid IDs must not call a provider"); };
  const response = await generate.POST(request("/api/generate",generationBody({ requestId: "../../other-account" })));
  assert.equal(response.status,400);
  assert.equal((await response.json()).code,"invalid_request_id");
  assert.equal(sqlite.prepare("SELECT count(*) AS count FROM studio_generation_requests WHERE user_id = ?").get(userId).count,0);
  assert.equal(sqlite.prepare("SELECT hits FROM studio_rate_limits WHERE id = ?").get(`${userId}:generate`),undefined);
});

test("all 103 registered modes honor route availability, active reference requirements, mapped controls, storage, and receipts", async () => {
  const all = featureRegistry.features.flatMap((feature) => [feature,...(feature.variants || [])]);
  assert.equal(all.length,103);
  const wave = Buffer.alloc(44); wave.write("RIFF",0); wave.write("WAVE",8);
  let modes = 0, aiModes = 0;
  for (const feature of all) {
    modes++;
    const userId = `registry-${feature.id}`;
    globalThis.__studioTest.user = { ...alice,userId };
    let paidCalls = 0, sent;
    const kind = feature.kind === "chat" ? "text" : feature.kind;
    const options = Object.fromEntries(feature.fields.filter((field) => field.type !== "file").map((field) => [field.id,field.defaultValue ?? field.options?.[0]?.value ?? ""]));
    if (feature.id === "angle-generator") Object.assign(options,{ "angle-ids": "front,back", sequenceIndex: 2, sequenceTotal: 2 });
    for (const field of featureControls.applicableFields(feature,options)) if (field.role === "prompt" && !String(options[field.id] || "").trim()) options[field.id] = `Fixture instructions for ${field.id}`;
    const active = featureControls.applicableFields(feature,options);
    const required = active.filter((field) => field.type === "file" && field.required);
    const images = required.map((field) => ({ data: png.toString("base64"),mimeType: "image/png",fieldId: field.id }));
    if (feature.id === "object-remover" && options["object-remover-choice-1"] === "manual") images.push({ data: png.toString("base64"),mimeType: "image/png",role: "mask",fieldId: "object-removal-mask" });
    const body = generationBody({ featureId: feature.id,kind,options,images,prompt: `Contract fixture for ${feature.id}` });
    globalThis.fetch = async (url,init) => {
      paidCalls++;
      assert.match(url,/^https:\/\/generativelanguage\.googleapis\.com\//,feature.id);
      sent = JSON.parse(init.body);
      if (kind === "audio") return Response.json({ status: "completed",steps: [{ type: "model_output",content: [{ type: "audio",data: wave.toString("base64"),mime_type: "audio/wav" }] }] });
      return kind === "text" ? geminiText() : Response.json({ candidates: [{ content: { parts: [{ inlineData: { data: png.toString("base64"),mimeType: "image/png" } }] } }] });
    };
    if (["local","store","video"].includes(feature.kind)) {
      const response = await generate.POST(request("/api/generate",body));
      assert.equal(response.status,feature.kind === "video" ? 503 : 400,feature.id);
      assert.equal((await response.json()).code,feature.kind === "video" ? "video_provider_not_configured" : "local_tool",feature.id);
      assert.equal(paidCalls,0,feature.id);
      continue;
    }
    aiModes++;
    // Each missing active reference must be rejected on its own, before quota or AI.
    for (const field of required) {
      const missing = await generate.POST(request("/api/generate",{ ...body,images: images.filter((image) => image.fieldId !== field.id) }));
      assert.equal(missing.status,400,`${feature.id}/${field.id}`);
      assert.equal((await missing.json()).code,"reference_images_required",`${feature.id}/${field.id}`);
      assert.equal(paidCalls,0,feature.id);
    }
    const response = await generate.POST(request("/api/generate",body));
    assert.equal(response.status,200,`${feature.id}: ${JSON.stringify(await response.clone().json())}`);
    const result = await response.json();
    assert.equal(paidCalls,1,feature.id);
    assert.equal(result.results.length,1,feature.id);
    assert.equal(result.results[0].kind,kind,feature.id);
    assert.equal(result.requestId,body.requestId,feature.id);
    if (feature.id === "angle-generator") {
      assert.equal(result.results[0].angleId,"back");
      assert.equal(result.results[0].angleRatio,"1:1");
      assert.match(sent.contents[0].parts[0].text,/Angle Generator slot 2 of 2: Back Angle/);
      assert.match(sent.contents[0].parts[0].text,/camera directly behind the reference subject/);
    }
    const row = sqlite.prepare("SELECT * FROM generations WHERE id = ? AND user_id = ?").get(result.id,userId);
    assert.ok(row,feature.id);
    assert.deepEqual(JSON.parse(row.results_json),result.results,feature.id);
    const stored = JSON.parse(row.options_json);
    const activeIds = new Set(active.map((field) => field.id));
    for (const field of feature.fields) if (!activeIds.has(field.id)) assert.equal(stored[field.id],undefined,`${feature.id}: inactive ${field.id}`);
    const finalRoleField = Object.fromEntries(active.filter((field) => field.type !== "file" && field.role).map((field) => [field.role,field]));
    for (const field of active) {
      if (["resolution","voice","style","language","count"].includes(field.role) && field.type !== "file") {
        if (finalRoleField[field.role].id === field.id && !(kind === "audio" && field.role === "style")) assert.equal(stored[field.role],options[field.id] ?? field.defaultValue ?? field.options?.[0]?.value ?? "",`${feature.id}/${field.role}`);
      }
      if (["ratio","aspectRatio"].includes(field.role) && (/^[1-9][0-9]?:[1-9][0-9]?$/.test(String(options[field.id])) || options[field.id] === "original")) assert.equal(stored.aspectRatio,options[field.id],`${feature.id}/aspectRatio`);
    }
    if (kind === "audio") {
      const transcript = active.find((field) => field.role === "prompt");
      assert.equal(sent.input[0].content[0].text,options[transcript.id],feature.id);
      assert.equal(sent.response_format.mime_type,"audio/wav",feature.id);
    } else {
      assert.equal(sent.contents[0].parts.filter((part) => part.inlineData).length,images.length,feature.id);
      assert.ok(sent.contents[0].parts[0].text.includes(feature.label),feature.id);
      assert.equal(sent.generationConfig.responseModalities?.includes("IMAGE") || false,kind === "image",feature.id);
    }
    const receipt = await (await statusRequest(body.requestId)).json();
    assert.equal(receipt.status,"completed",feature.id);
    assert.deepEqual(receipt.data,result,feature.id);
    assert.equal(JSON.stringify(row).includes(body.apiKey),false,feature.id);
  }
  assert.equal(modes,103);
  assert.ok(aiModes > 90,`expected most modes to invoke an AI contract, got ${aiModes}`);
});

test("invalid angle selection or reference counts are rejected before quota, receipts or provider calls", async () => {
  const userId = "invalid-angle-selection-user";
  globalThis.__studioTest.user = { ...alice,userId };
  let paidCalls = 0;
  globalThis.fetch = async () => { paidCalls++; throw new Error("invalid angle selections must not reach a provider"); };
  const options = { "angle-ids": "front,back", "angle-ratio": "1:1", "angle-expression": "", sequenceIndex: 1, sequenceTotal: 2 };
  const image = { data: png.toString("base64"),mimeType: "image/png",fieldId: "angle-reference" };
  const cases = [
    [{ ...options,"angle-ids": "" },[image],"invalid_angle_selection"],
    [{ ...options,"angle-ids": "front,front" },[image],"invalid_angle_selection"],
    [{ ...options,"angle-ids": "front,unknown" },[image],"invalid_angle_selection"],
    [{ ...options,sequenceIndex: 3 },[image],"invalid_angle_selection"],
    [{ ...options,sequenceTotal: 21 },[image],"invalid_angle_selection"],
    [options,[],"reference_images_required"],
    [options,[image,image],"reference_images_required"],
  ];
  for (const [selected,images,code] of cases) {
    const response = await generate.POST(request("/api/generate",generationBody({ featureId: "angle-generator",kind: "image",options: selected,images })));
    assert.equal(response.status,400);
    assert.equal((await response.json()).code,code);
  }
  assert.equal(paidCalls,0);
  assert.equal(sqlite.prepare("SELECT hits FROM studio_rate_limits WHERE id = ?").get(`${userId}:generate`),undefined);
  assert.equal(sqlite.prepare("SELECT count(*) AS n FROM studio_generation_requests WHERE user_id = ?").get(userId).n,0);
});

test("the twenty-first angle keeps its assigned camera and one saved result through status recovery", async () => {
  const userId = "angle-slot-twenty-one-user";
  globalThis.__studioTest.user = { ...alice,userId };
  const { ANGLE_DEFINITIONS } = await import(anglesUrl);
  const lastAngle = ANGLE_DEFINITIONS.at(-1);
  let calls = 0, sent;
  globalThis.fetch = async (_url,init) => {
    calls++; sent = JSON.parse(init.body);
    return Response.json({ candidates: [{ content: { parts: [1,2].map(() => ({ inlineData: { data: png.toString("base64"),mimeType: "image/png" } })) } }] });
  };
  const body = generationBody({ featureId: "angle-generator",kind: "image",options: { "angle-ids": ANGLE_DEFINITIONS.map(angle => angle.id).join(","),"angle-ratio": "9:16","angle-expression": "Smile",sequenceIndex: 21,sequenceTotal: 21 },images: [{ data: png.toString("base64"),mimeType: "image/png",fieldId: "angle-reference" }] });
  const response = await generate.POST(request("/api/generate",body));
  assert.equal(response.status,200);
  const saved = await response.json();
  assert.equal(calls,1);
  assert.equal(saved.results.length,1);
  assert.equal(saved.results[0].angleId,lastAngle.id);
  assert.equal(saved.results[0].angleRatio,"9:16");
  assert.ok(sent.contents[0].parts[0].text.includes(`Angle Generator slot 21 of 21: ${lastAngle.labelEn}`));
  assert.ok(sent.contents[0].parts[0].text.includes(lastAngle.prompt));
  const recovered = await (await statusRequest(body.requestId)).json();
  assert.deepEqual(recovered.data,saved);
  assert.equal(calls,1);
  assert.equal(sqlite.prepare("SELECT count(*) AS n FROM studio_files WHERE user_id = ?").get(userId).n,1);
});

test("conditional mode branches require only their active photos and retain their own ratio controls", async () => {
  const branches = [
    ["before-after","before-after-input-mode"],
    ["profesi-anak","profesi-mode"],
    ["desain-rumah","dr-mode"],
    ["birthday-photo","birthday-mode-options"],
    ["bg-remover","bgremover-bg-options"],
  ];
  let checked = 0;
  for (const [featureId,selector] of branches) {
    const feature = featureRegistry.features.flatMap((item) => [item,...(item.variants || [])]).find((item) => item.id === featureId);
    for (const choice of feature.fields.find((field) => field.id === selector).options) {
      const userId = `branch-${featureId}-${choice.value}`;
      globalThis.__studioTest.user = { ...alice,userId };
      const options = { [selector]: choice.value };
      const active = featureControls.applicableFields(feature,options);
      const required = active.filter((field) => field.type === "file" && field.required);
      const images = required.map((field) => ({ data: png.toString("base64"),mimeType: "image/png",fieldId: field.id }));
      const body = generationBody({ featureId,kind: "image",options,images });
      let calls = 0;
      globalThis.fetch = async (_url,init) => {
        calls++;
        const sent = JSON.parse(init.body);
        assert.equal(sent.contents[0].parts.filter((part) => part.inlineData).length,required.length,`${featureId}/${choice.value}`);
        return Response.json({ candidates: [{ content: { parts: [{ inlineData: { data: png.toString("base64"),mimeType: "image/png" } }] } }] });
      };
      if (required.length) {
        const invalid = await generate.POST(request("/api/generate",{ ...body,images: images.slice(1) }));
        assert.equal(invalid.status,400,`${featureId}/${choice.value}`);
        assert.equal((await invalid.json()).code,"reference_images_required");
        assert.equal(calls,0);
      }
      const response = await generate.POST(request("/api/generate",body));
      assert.equal(response.status,200,`${featureId}/${choice.value}: ${JSON.stringify(await response.clone().json())}`);
      const result = await response.json();
      const row = sqlite.prepare("SELECT options_json FROM generations WHERE id = ?").get(result.id);
      const stored = JSON.parse(row.options_json);
      const ratio = active.find((field) => field.role === "ratio" || field.role === "aspectRatio");
      if (ratio) assert.equal(stored.aspectRatio,ratio.defaultValue ?? ratio.options?.[0]?.value,`${featureId}/${choice.value}`);
      const activeIds = new Set(active.map((field) => field.id));
      for (const field of feature.fields) if (!activeIds.has(field.id)) assert.equal(stored[field.id],undefined,`${featureId}/${choice.value}: ${field.id}`);
      assert.equal(calls,1);
      checked++;
    }
  }
  assert.ok(checked >= 15);
});

test("saved studio directions reach both real image adapters while base intent, quality and batch variation stay intact", async () => {
  const feature = featureRegistry.features.find((item) => item.id === "affiliate");
  assert.ok(feature);
  const extra = "Arah editorial fixture: gunakan cerita visual sesuai produk.";
  try {
    await promptSettings.updateFeaturePromptSettings({ featureId: feature.id, additionalInstructions: extra, expectedRevision: 0, reason: "Uji integrasi prompt kedua provider" }, "fixture-owner", d1);
    for (const provider of ["gemini", "9router"]) {
      globalThis.__studioTest.user = { ...alice, userId: `additive-image-${provider}-user` };
      const options = { ...Object.fromEntries(feature.fields.filter((field) => field.defaultValue !== undefined).map((field) => [field.id, field.defaultValue])), batchId: "fixture-creative-batch", sequenceIndex: 1, sequenceTotal: 4 };
      const required = featureControls.applicableFields(feature, options).filter((field) => field.type === "file" && field.required);
      const images = required.map((field) => ({ data: png.toString("base64"), mimeType: "image/png", fieldId: field.id }));
      let providerCalls = 0, sentPrompt;
      globalThis.fetch = async (target, init) => {
        if (target.startsWith("https://cloudflare-dns.com/")) return Response.json({ Status: 0, Answer: [{ type: 1, data: "93.184.216.34", TTL: 1 }] });
        providerCalls++;
        const sent = JSON.parse(init.body);
        if (provider === "gemini") {
          assert.equal(target, "https://generativelanguage.googleapis.com/v1/models/gemini-3.1-flash-image:generateContent");
          sentPrompt = sent.contents[0].parts[0].text;
          return Response.json({ candidates: [{ content: { parts: [{ inlineData: { data: png.toString("base64"), mimeType: "image/png" } }] } }] });
        }
        assert.equal(target, "https://additive-prompt.example.com/v1/images/generations?response_format=binary");
        sentPrompt = sent.prompt;
        return Response.json({ data: [{ b64_json: png.toString("base64") }] });
      };
      const body = generationBody({ provider, apiKey: provider === "gemini" ? "gemini_fixture_key_long_enough" : "router_fixture_key", featureId: feature.id, kind: "image", prompt: "Buat foto kampanye produk kreatif", options, images, ...(provider === "9router" ? { routerConfig: { baseUrl: "https://additive-prompt.example.com/v1", imageModel: "cx/image-model" } } : {}) });
      const response = await generate.POST(request("/api/generate", body));
      assert.equal(response.status, 200, `${provider}: ${JSON.stringify(await response.clone().json())}`);
      assert.equal((await response.json()).results[0].kind, "image");
      assert.equal(providerCalls, 1);
      assert.ok(sentPrompt.includes(feature.promptIntent), `${provider} keeps catalog intent`);
      assert.ok(sentPrompt.includes(`Additional studio directions:\n${extra}`), `${provider} receives saved directions`);
      assert.ok(sentPrompt.includes("Creative variation 1 of 4"), `${provider} keeps batch slot direction`);
      assert.ok(sentPrompt.includes("Creative family:"), `${provider} keeps assigned composition family`);
      assert.ok(sentPrompt.includes("Visual quality direction for image generation:"), `${provider} keeps image quality direction`);
      assert.ok(sentPrompt.includes("default to hyperrealistic, believable real-world photography"), `${provider} keeps photographic realism`);
      assert.ok(sentPrompt.includes("Buat foto kampanye produk kreatif"), `${provider} keeps user instructions`);
    }
  } finally {
    sqlite.prepare("DELETE FROM studio_prompt_changes WHERE feature_id = ?").run(feature.id);
    sqlite.prepare("DELETE FROM studio_prompt_settings WHERE feature_id = ?").run(feature.id);
  }
});

test("changing studio prompt revision rejects old request IDs without provider charges and new IDs use the changed directions", async () => {
  const featureId = "beranda";
  const oldInstructions = "Fixture pertama: tulis jawaban singkat.";
  const newInstructions = "Fixture kedua: gunakan contoh yang konkret.";
  let calls = 0;
  const sentPrompts = [];
  globalThis.__studioTest.user = { ...alice, userId: "prompt-revision-receipt-user" };
  globalThis.fetch = async (_target, init) => {
    calls++;
    sentPrompts.push(JSON.parse(init.body).contents[0].parts[0].text);
    return geminiText();
  };
  try {
    await promptSettings.updateFeaturePromptSettings({ featureId, additionalInstructions: oldInstructions, expectedRevision: 0, reason: "Pasang arahan fixture awal" }, "fixture-owner", d1);
    const body = generationBody();
    const firstResponse = await generate.POST(request("/api/generate", body));
    assert.equal(firstResponse.status, 200);
    const first = await firstResponse.json();
    assert.equal(calls, 1);
    assert.ok(sentPrompts[0].includes(oldInstructions));
    const replay = await generate.POST(request("/api/generate", body));
    assert.equal(replay.status, 200);
    assert.deepEqual(await replay.json(), first);
    assert.equal(calls, 1, "same revision replays the durable result");
    await promptSettings.updateFeaturePromptSettings({ featureId, additionalInstructions: newInstructions, expectedRevision: 1, reason: "Ubah arahan fixture sebelum replay" }, "fixture-owner", d1);
    const conflict = await generate.POST(request("/api/generate", body));
    assert.equal(conflict.status, 409);
    assert.equal((await conflict.json()).code, "request_id_conflict");
    assert.equal(calls, 1, "config changes must not replay a completed paid call");
    const receipt = await (await statusRequest(body.requestId)).json();
    assert.equal(receipt.status, "completed");
    assert.deepEqual(receipt.data, first, "the original completion remains recoverable");
    const next = await generate.POST(request("/api/generate", { ...body, requestId: crypto.randomUUID() }));
    assert.equal(next.status, 200);
    assert.equal(calls, 2);
    assert.ok(sentPrompts[1].includes(newInstructions));
    assert.equal(sentPrompts[1].includes(oldInstructions), false);
  } finally {
    sqlite.prepare("DELETE FROM studio_prompt_changes WHERE feature_id = ?").run(featureId);
    sqlite.prepare("DELETE FROM studio_prompt_settings WHERE feature_id = ?").run(featureId);
  }
});
