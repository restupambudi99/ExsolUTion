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
const storageUrl = load("./studio-storage.ts",[["./studio-api",apiUrl]]);
const featureUrl = load("../app/feature-data.ts");
const api = await import(apiUrl);
const storage = await import(storageUrl);
const session = await import(load("../app/api/session/route.ts",[["cloudflare:workers",envUrl],["@/app/chatgpt-auth",authUrl],["@/lib/studio-api",apiUrl],["@/lib/studio-provider",providerUrl]]));
const preferences = await import(load("../app/api/preferences/route.ts",[["@/lib/studio-api",apiUrl]]));
const files = await import(load("../app/api/files/[id]/route.ts",[["@/lib/studio-api",apiUrl],["@/lib/studio-storage",storageUrl]]));
const history = await import(load("../app/api/history/route.ts",[["@/lib/studio-api",apiUrl]]));
const deleteHistory = await import(load("../app/api/history/[id]/route.ts",[["@/lib/studio-api",apiUrl]]));
const generate = await import(load("../app/api/generate/route.ts",[["cloudflare:workers",envUrl],["@/app/feature-data",featureUrl],["@/lib/studio-api",apiUrl],["@/lib/studio-provider",providerUrl],["@/lib/studio-storage",storageUrl],["@/lib/studio-validation",validationUrl]]));
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
