import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import ts from "typescript";

const sqlite = new DatabaseSync(":memory:");
sqlite.exec(readFileSync(new URL("../drizzle/0000_broken_lester.sql",import.meta.url),"utf8"));
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
    };
  },
  async batch(statements) { return Promise.all(statements.map((statement) => statement.run())); },
};
const bucket = {
  async put(key,bytes) { objects.set(key,new Uint8Array(bytes)); },
  async delete(keys) { for (const key of typeof keys === "string" ? [keys] : keys) objects.delete(key); },
  async get(key) { const bytes = objects.get(key); return bytes ? { body: bytes, httpEtag: '"test-etag"' } : null; },
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
const maskUrl = load("./studio-mask.ts",[["./studio-validation",validationUrl],["./studio-provider",providerUrl]]);
const storageUrl = load("./studio-storage.ts",[["./studio-api",apiUrl]]);
const featureUrl = load("../app/feature-data.ts");
const controlsUrl = load("../app/feature-controls.ts");
const featureRegistry = await import(featureUrl);
const featureControls = await import(controlsUrl);
const api = await import(apiUrl);
const storage = await import(storageUrl);
const session = await import(load("../app/api/session/route.ts",[["cloudflare:workers",envUrl],["@/app/chatgpt-auth",authUrl],["@/lib/studio-api",apiUrl],["@/lib/studio-config",configUrl]]));
const preferences = await import(load("../app/api/preferences/route.ts",[["@/lib/studio-api",apiUrl]]));
const files = await import(load("../app/api/files/[id]/route.ts",[["@/lib/studio-api",apiUrl],["@/lib/studio-storage",storageUrl]]));
const history = await import(load("../app/api/history/route.ts",[["@/lib/studio-api",apiUrl]]));
const deleteHistory = await import(load("../app/api/history/[id]/route.ts",[["@/lib/studio-api",apiUrl]]));
const generate = await import(load("../app/api/generate/route.ts",[["cloudflare:workers",envUrl],["@/app/feature-data",featureUrl],["@/app/feature-controls",controlsUrl],["@/lib/studio-api",apiUrl],["@/lib/studio-provider",providerUrl],["@/lib/studio-storage",storageUrl],["@/lib/studio-validation",validationUrl],["@/lib/studio-config",configUrl],["@/lib/studio-router",routerUrl],["@/lib/studio-mask",maskUrl]]));
const providerTest = await import(load("../app/api/provider/test/route.ts",[["cloudflare:workers",envUrl],["@/lib/studio-api",apiUrl],["@/lib/studio-provider",providerUrl],["@/lib/studio-validation",validationUrl],["@/lib/studio-config",configUrl],["@/lib/studio-router",routerUrl]]));
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
