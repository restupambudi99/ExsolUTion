import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

function moduleUrl(path, replacements = []) {
  let source = ts.transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
  for (const [from, to] of replacements) source = source.replaceAll(JSON.stringify(from), JSON.stringify(to));
  return `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
}
const validationUrl = moduleUrl("./studio-validation.ts");
const validation = await import(validationUrl);
const providerUrl = moduleUrl("./studio-provider.ts", [["./studio-validation", validationUrl]]);
const capabilitiesUrl = moduleUrl("./studio-capabilities.ts");
const routerUrl = moduleUrl("./studio-router.ts", [["./studio-validation", validationUrl], ["./studio-provider", providerUrl], ["./studio-capabilities", capabilitiesUrl]]);
const configUrl = moduleUrl("./studio-config.ts", [["./studio-provider", providerUrl], ["./studio-router", routerUrl]]);
const credentialsUrl = moduleUrl("./studio-credentials.ts", [["./studio-config", configUrl], ["./studio-provider", providerUrl], ["./studio-router", routerUrl], ["./studio-validation", validationUrl]]);
const config = await import(configUrl);
const credentials = await import(credentialsUrl);
const owner = "owner-fixture";
const personalKey = "owned-router-key-fixture-never-public";
const otherKey = "second-router-key-fixture-never-public";
const input = { provider: "9router", apiKey: personalKey, routerConfig: { baseUrl: "https://gateway.example.com/v1", textModel: "custom/text", imageModel: "custom/image", voice: "speaker" } };
const environmentSecret = "a8".repeat(32);

function fixture() {
  const rows = new Map();
  const operations = [];
  const environment = {
    STUDIO_CREDENTIAL_ENCRYPTION_KEY: environmentSecret,
    NINEROUTER_BASE_URL: "https://environment.example.com/v1",
    NINEROUTER_TEXT_MODEL: "server/text",
    DB: { prepare(sql) {
      return { bind(...values) {
        operations.push({ sql, values });
        return {
          async first() { const value = rows.get(`${values[0]}:${values[1]}`); return value ? { ...value } : null; },
          async run() {
            let changes = 1;
            if (sql.includes("NULL, NULL, '{}', 0")) {
              const [user_id, provider, updated_at, revision] = values;
              rows.set(`${user_id}:${provider}`, { user_id, provider, encrypted_key: null, iv: null, config_json: "{}", expires_at: 0, updated_at, revision, deleted: 1 });
            } else if (sql.startsWith("INSERT")) {
              const [user_id, provider, encrypted_key, iv, config_json, expires_at, updated_at, revision] = values;
              if (rows.has(`${user_id}:${provider}`)) changes = 0;
              else rows.set(`${user_id}:${provider}`, { user_id, provider, encrypted_key, iv, config_json, expires_at, updated_at, revision, deleted: 0 });
            } else if (sql.startsWith("UPDATE")) {
              const [encrypted_key, iv, config_json, expires_at, updated_at, revision, user_id, provider, expectedRevision] = values;
              if (rows.get(`${user_id}:${provider}`)?.revision !== expectedRevision) changes = 0;
              else rows.set(`${user_id}:${provider}`, { user_id, provider, encrypted_key, iv, config_json, expires_at, updated_at, revision, deleted: 0 });
            }
            return { success: true, meta: { changes } };
          },
        };
      } };
    } },
  };
  return { environment, rows, operations };
}

async function remember(f, request = input, userId = owner) {
  const selected = await credentials.resolveProviderForUser(request, f.environment, userId);
  assert.equal(await credentials.rememberProviderForUser(request, selected, f.environment, userId), true);
  return selected;
}

test("saved credential survives a fresh request, while database and session contain no plaintext key", async () => {
  const f = fixture();
  await remember(f);
  const stored = JSON.stringify([...f.rows.values()]);
  assert.equal(stored.includes(personalKey), false);
  assert.equal(stored.includes(environmentSecret), false);
  assert.equal(f.rows.get(`${owner}:9router`).iv.length, 16);
  const selected = await credentials.resolveProviderForUser({ provider: "9router" }, f.environment, owner);
  assert.equal(selected.settings.apiKey, personalKey);
  assert.equal(selected.settings.baseUrl, input.routerConfig.baseUrl);
  assert.equal(selected.settings.imageModel, "custom/image");
  const status = await credentials.providerStatusForUser(f.environment, owner);
  assert.equal(status["9router"].configured, true);
  assert.equal(status["9router"].savedCredential, true);
  assert.equal(status["9router"].credentialState, "saved");
  assert.equal(status["9router"].imageModel, "custom/image");
  assert.equal(JSON.stringify(status).includes(personalKey), false);
  assert.equal(JSON.stringify(status).includes("encrypted_key"), false);
});

test("long dotted Gemini keys survive encrypted save and a fresh request without leaking into metadata", async () => {
  for (const length of [600, 4096]) {
    const f = fixture();
    const key = `AQ.${"x".repeat(length - 3)}`;
    const request = validation.validateProviderSelection({ provider: "gemini", apiKey: ` \t${key}\r\n` });
    assert.equal(request.apiKey, key);
    await remember(f, request);
    const row = f.rows.get(`${owner}:gemini`);
    assert.ok(row.encrypted_key);
    assert.equal(JSON.stringify([...f.rows.values()]).includes(key), false);
    assert.equal(JSON.stringify(f.operations).includes(key), false);
    assert.equal(row.config_json.includes(key), false);
    const reloaded = await credentials.resolveProviderForUser({ provider: "gemini" }, f.environment, owner);
    assert.equal(reloaded.provider, "gemini");
    assert.equal(reloaded.settings.apiKey, key);
    const status = await credentials.providerStatusForUser(f.environment, owner);
    assert.equal(status.gemini.configured, true);
    assert.equal(status.gemini.savedCredential, true);
    assert.equal(status.gemini.credentialState, "saved");
    assert.equal(JSON.stringify(status).includes(key), false);
    assert.equal(JSON.stringify(status).includes("encrypted_key"), false);
    await assert.rejects(credentials.resolveProviderForUser({ provider: "gemini" }, f.environment, "other-owner"), { code: "provider_not_configured" });
  }
});

test("explicit request key takes priority over both owned and server keys", async () => {
  const f = fixture();
  await remember(f);
  f.environment.NINEROUTER_API_KEY = "server-key-fixture";
  const selected = await credentials.resolveProviderForUser({ ...input, apiKey: otherKey }, f.environment, owner);
  assert.equal(selected.settings.apiKey, otherKey);
  const saved = await credentials.resolveProviderForUser({ provider: "9router" }, f.environment, owner);
  assert.equal(saved.settings.apiKey, personalKey);
});

test("saved keys do not cross owner boundaries or providers", async () => {
  const f = fixture();
  await remember(f);
  await assert.rejects(credentials.resolveProviderForUser({ provider: "9router" }, f.environment, "other-owner"), { code: "provider_not_configured" });
  await assert.rejects(credentials.resolveProviderForUser({ provider: "gemini" }, f.environment, owner), { code: "provider_not_configured" });
  const status = await credentials.providerStatusForUser(f.environment, "other-owner");
  assert.equal(status["9router"].configured, false);
  assert.equal(status["9router"].savedCredential, false);
  // Even a database-row copy cannot transplant encrypted material to a new owner.
  f.rows.set("other-owner:9router", { ...f.rows.get(`${owner}:9router`), user_id: "other-owner" });
  await assert.rejects(credentials.resolveProviderForUser({ provider: "9router" }, f.environment, "other-owner"), { code: "provider_saved_credentials_unavailable" });
});

test("normalizes matching endpoints, refuses key forwarding, and allows only an independently configured server endpoint", async () => {
  const f = fixture();
  await remember(f);
  const same = await credentials.resolveProviderForUser({ provider: "9router", routerConfig: { baseUrl: "https://gateway.example.com/", imageModel: "override/image" } }, f.environment, owner);
  assert.equal(same.settings.apiKey, personalKey);
  assert.equal(same.settings.imageModel, "override/image");
  await assert.rejects(credentials.resolveProviderForUser({ provider: "9router", routerConfig: { baseUrl: "https://attacker.example.com/v1" } }, f.environment, owner), { code: "provider_not_configured" });
  f.environment.NINEROUTER_API_KEY = "server-key-fixture";
  await assert.rejects(credentials.resolveProviderForUser({ provider: "9router", routerConfig: { baseUrl: "https://attacker.example.com/v1" } }, f.environment, owner), { code: "router_endpoint_mismatch" });
  const fallback = await credentials.resolveProviderForUser({ provider: "9router", routerConfig: { baseUrl: f.environment.NINEROUTER_BASE_URL } }, f.environment, owner);
  assert.equal(fallback.settings.apiKey, "server-key-fixture");
});

test("ciphertext tampering and endpoint/config tampering fail closed without leaking material", async () => {
  for (const tamper of [
    row => { row.encrypted_key = "AAAA" + row.encrypted_key.slice(4); },
    row => { row.config_json = JSON.stringify({ baseUrl: "https://attacker.example.com/v1", imageModel: "custom/image" }); },
    row => { row.config_json = row.config_json.replace("custom/image", "changed/image"); },
    row => { row.iv = "bad"; },
  ]) {
    const f = fixture();
    await remember(f);
    tamper(f.rows.get(`${owner}:9router`));
    await assert.rejects(credentials.resolveProviderForUser({ provider: "9router" }, f.environment, owner), error => {
      assert.equal(error.code, "provider_saved_credentials_unavailable");
      assert.equal(error.message.includes(personalKey), false);
      assert.equal(error.message.includes(environmentSecret), false);
      return true;
    });
    const status = await credentials.providerStatusForUser(f.environment, owner);
    assert.equal(status["9router"].configured, false);
    assert.equal(status["9router"].credentialState, "unavailable");
    assert.equal(JSON.stringify(status).includes(personalKey), false);
    assert.equal(JSON.stringify(status).includes("attacker.example.com"), false);
  }
});

test("expired or rotated encryption keys yield safe actionable errors and readiness metadata", async () => {
  const f = fixture();
  await remember(f);
  f.rows.get(`${owner}:9router`).expires_at = Date.now() - 1;
  await assert.rejects(credentials.resolveProviderForUser({ provider: "9router" }, f.environment, owner), { code: "provider_saved_credentials_expired" });
  assert.equal((await credentials.providerStatusForUser(f.environment, owner))["9router"].credentialState, "expired");
  await remember(f);
  f.environment.STUDIO_CREDENTIAL_ENCRYPTION_KEY = "b9".repeat(32);
  await assert.rejects(credentials.resolveProviderForUser({ provider: "9router" }, f.environment, owner), { code: "provider_saved_credentials_unavailable" });
});

test("AES-GCM writes use a fresh nonce and replacing one owner's key leaves the other owner unchanged", async () => {
  const f = fixture();
  await remember(f);
  const original = { ...f.rows.get(`${owner}:9router`) };
  await remember(f, input, "other-owner");
  await remember(f, { ...input, apiKey: otherKey });
  const updated = f.rows.get(`${owner}:9router`);
  assert.notEqual(updated.iv, original.iv);
  assert.notEqual(updated.encrypted_key, original.encrypted_key);
  assert.equal((await credentials.resolveProviderForUser({ provider: "9router" }, f.environment, owner)).settings.apiKey, otherKey);
  assert.equal((await credentials.resolveProviderForUser({ provider: "9router" }, f.environment, "other-owner")).settings.apiKey, personalKey);
});

test("clear deletes only the requested owner/provider and returns to environment fallback", async () => {
  const f = fixture();
  await remember(f);
  await remember(f, input, "other-owner");
  const gemini = { provider: "gemini", apiKey: "gemini_fixture_key_1234567890" };
  await remember(f, gemini);
  f.environment.NINEROUTER_API_KEY = "server-key-fixture";
  await credentials.forgetProviderForUser("9router", f.environment, owner);
  assert.equal(f.rows.get(`${owner}:9router`).deleted, 1);
  assert.equal(f.rows.get(`${owner}:9router`).encrypted_key, null);
  assert.equal(f.rows.has("other-owner:9router"), true);
  assert.equal(f.rows.has(`${owner}:gemini`), true);
  const status = await credentials.providerStatusForUser(f.environment, owner);
  assert.equal(status["9router"].credentialState, "server");
  assert.equal(status["9router"].savedCredential, false);
  assert.equal(status.gemini.credentialState, "saved");
  assert.equal((await credentials.resolveProviderForUser({ provider: "9router" }, f.environment, owner)).settings.apiKey, "server-key-fixture");
});

test("env-only deployments remain compatible and do not touch a missing vault table", async () => {
  const f = fixture();
  delete f.environment.STUDIO_CREDENTIAL_ENCRYPTION_KEY;
  f.environment.NINEROUTER_API_KEY = "server-key-fixture";
  const selected = await credentials.resolveProviderForUser({ provider: "9router" }, f.environment, owner);
  assert.equal(selected.settings.apiKey, "server-key-fixture");
  assert.equal(await credentials.rememberProviderForUser(input, config.resolveProvider(input, f.environment), f.environment, owner), false);
  const status = await credentials.providerStatusForUser(f.environment, owner);
  assert.equal(status["9router"].credentialState, "server");
  assert.equal(f.operations.length, 0);
});

test("persistence failures cannot fail a successful paid generation and mismatched keys are not saved", async () => {
  const f = fixture();
  const selected = await credentials.resolveProviderForUser(input, f.environment, owner);
  assert.equal(await credentials.rememberProviderForUser({ ...input, apiKey: otherKey }, selected, f.environment, owner), false);
  assert.equal(await credentials.rememberProviderForUser({ provider: "9router" }, selected, f.environment, owner), false);
  assert.equal(f.rows.size, 0);
  f.environment.DB = { prepare() { throw new Error("private database error"); } };
  assert.equal(await credentials.rememberProviderForUser(input, selected, f.environment, owner), false);
  await assert.rejects(credentials.resolveProviderForUser({ provider: "9router" }, f.environment, owner), error => error.code === "provider_saved_credentials_unavailable" && !error.message.includes("private database error"));
});

test("an older successful request cannot recreate a key deleted while that request was running", async () => {
  for (const existed of [false, true]) {
    const f = fixture();
    if (existed) await remember(f);
    const inFlight = await credentials.resolveProviderForUser(input, f.environment, owner);
    await credentials.forgetProviderForUser("9router", f.environment, owner);
    assert.equal(await credentials.rememberProviderForUser(input, inFlight, f.environment, owner), false);
    assert.equal(f.rows.get(`${owner}:9router`).deleted, 1);
    assert.equal(f.rows.get(`${owner}:9router`).encrypted_key, null);
    assert.equal((await credentials.providerStatusForUser(f.environment, owner))["9router"].savedCredential, false);
    // A newly entered key after the deletion can deliberately replace the tombstone.
    await remember(f, { ...input, apiKey: otherKey });
    assert.equal((await credentials.resolveProviderForUser({ provider: "9router" }, f.environment, owner)).settings.apiKey, otherKey);
  }
});

test("an older successful request cannot overwrite a key replaced by a newer request", async () => {
  const f = fixture();
  await remember(f);
  const oldInFlight = await credentials.resolveProviderForUser(input, f.environment, owner);
  await remember(f, { ...input, apiKey: otherKey });
  assert.equal(await credentials.rememberProviderForUser(input, oldInFlight, f.environment, owner), false);
  assert.equal((await credentials.resolveProviderForUser({ provider: "9router" }, f.environment, owner)).settings.apiKey, otherKey);
  // The first successful write also wins when both requests started with no row.
  const newOwner = "new-owner";
  const first = await credentials.resolveProviderForUser(input, f.environment, newOwner);
  const secondInput = { ...input, apiKey: otherKey };
  const second = await credentials.resolveProviderForUser(secondInput, f.environment, newOwner);
  assert.equal(await credentials.rememberProviderForUser(secondInput, second, f.environment, newOwner), true);
  assert.equal(await credentials.rememberProviderForUser(input, first, f.environment, newOwner), false);
  assert.equal((await credentials.resolveProviderForUser({ provider: "9router" }, f.environment, newOwner)).settings.apiKey, otherKey);
});

test("invalid owned credentials fall back only to a usable server key at its trusted endpoint", async () => {
  const f = fixture();
  await remember(f);
  f.rows.get(`${owner}:9router`).expires_at = 0;
  f.environment.NINEROUTER_API_KEY = "server-key-fixture";
  const selected = await credentials.resolveProviderForUser({ provider: "9router" }, f.environment, owner);
  assert.equal(selected.settings.apiKey, "server-key-fixture");
  assert.equal(selected.settings.baseUrl, f.environment.NINEROUTER_BASE_URL);
  assert.equal((await credentials.providerStatusForUser(f.environment, owner))["9router"].credentialState, "server");
  await assert.rejects(credentials.resolveProviderForUser({ provider: "9router", routerConfig: { baseUrl: "https://attacker.example.com/v1" } }, f.environment, owner), { code: "provider_saved_credentials_expired" });
  f.environment.DB = { prepare() { throw new Error("private database error"); } };
  assert.equal((await credentials.resolveProviderForUser({ provider: "9router" }, f.environment, owner)).settings.apiKey, "server-key-fixture");
});

test("the credential DELETE route authenticates, validates origin and cannot select another owner", async () => {
  const f = fixture();
  await remember(f);
  await remember(f, input, "other-owner");
  globalThis.__credentialTestEnvironment = f.environment;
  globalThis.__credentialTestUser = { userId: owner };
  const apiUrl = `data:text/javascript;base64,${Buffer.from(`
    export class ApiError extends Error { constructor(status,code,message){super(message);this.status=status;this.code=code} }
    export function json(value,status=200){return Response.json(value,{status})}
    export function errorResponse(error){return json({code:error.code||'server_error'},error.status||500)}
    export async function authenticatedUser(){if(!globalThis.__credentialTestUser)throw new ApiError(401,'authentication_required','Sign in');return globalThis.__credentialTestUser}
    export function assertSameOrigin(request){if(request.headers.get('origin')&&request.headers.get('origin')!==new URL(request.url).origin)throw new ApiError(403,'invalid_origin','Origin')}
    export async function readJson(request){return request.json()}
  `).toString("base64")}`;
  const envUrl = `data:text/javascript;base64,${Buffer.from("export const env = globalThis.__credentialTestEnvironment;").toString("base64")}`;
  const route = await import(moduleUrl("../app/api/provider/credentials/route.ts", [["cloudflare:workers", envUrl], ["@/lib/studio-api", apiUrl], ["@/lib/studio-credentials", credentialsUrl], ["@/lib/studio-provider", providerUrl]]));
  const request = (provider, origin = "https://site.example") => new Request("https://site.example/api/provider/credentials", { method: "DELETE", headers: { "content-type": "application/json", origin }, body: JSON.stringify({ provider, userId: "other-owner" }) });
  assert.equal((await route.DELETE(request("9router", "https://attacker.example"))).status, 403);
  assert.equal((await route.DELETE(request("unknown"))).status, 400);
  globalThis.__credentialTestUser = null;
  assert.equal((await route.DELETE(request("9router"))).status, 401);
  globalThis.__credentialTestUser = { userId: owner };
  const response = await route.DELETE(request("9router"));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(JSON.stringify(body).includes(personalKey), false);
  assert.equal(f.rows.get(`${owner}:9router`).deleted, 1);
  assert.equal(f.rows.has("other-owner:9router"), true);
  delete globalThis.__credentialTestEnvironment;
  delete globalThis.__credentialTestUser;
});

test("a failed provider test never persists its key, while a successful test persists and confirms readiness", async () => {
  const f = fixture();
  globalThis.__credentialRouteEnvironment = f.environment;
  globalThis.__credentialRouteShouldFail = true;
  const sourceUrl = (source) => `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
  const envUrl = sourceUrl("export const env = globalThis.__credentialRouteEnvironment;");
  const apiUrl = sourceUrl(`
    export class ApiError extends Error { constructor(status,code,message){super(message);this.status=status;this.code=code} }
    export function json(value,status=200){return Response.json(value,{status})}
    export function errorResponse(error){return json({code:error.code||'server_error'},error.status||500)}
    export async function authenticatedUser(){return {userId:${JSON.stringify(owner)}}}
    export function assertSameOrigin(){}
    export async function readJson(request){return request.json()}
    export async function rateLimit(){}
  `);
  const routerTestUrl = sourceUrl(`
    import {ProviderError} from ${JSON.stringify(providerUrl)};
    export async function testRouterConnection(){
      if(globalThis.__credentialRouteShouldFail)throw new ProviderError(502,'provider_authentication_failed','Provider rejected this key.');
      return {ok:true,provider:'9router',models:['custom/text'],imageModels:['custom/image'],audioModels:[]};
    }
  `);
  const providerTestUrl = sourceUrl(`export {ProviderError} from ${JSON.stringify(providerUrl)}; export async function testGeminiConnection(){return {ok:true,models:[]}}`);
  const route = await import(moduleUrl("../app/api/provider/test/route.ts", [["cloudflare:workers", envUrl], ["@/lib/studio-api", apiUrl], ["@/lib/studio-credentials", credentialsUrl], ["@/lib/studio-provider", providerTestUrl], ["@/lib/studio-router", routerTestUrl], ["@/lib/studio-validation", validationUrl]]));
  const request = () => new Request("https://site.example/api/provider/test", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(input) });
  const failed = await route.POST(request());
  assert.equal(failed.status, 502);
  assert.equal(f.rows.size, 0);
  assert.equal(JSON.stringify(await failed.json()).includes(personalKey), false);
  globalThis.__credentialRouteShouldFail = false;
  const success = await route.POST(request());
  assert.equal(success.status, 200);
  const body = await success.json();
  assert.equal(body.credentialsSaved, true);
  assert.equal(JSON.stringify(body).includes(personalKey), false);
  assert.equal((await credentials.providerStatusForUser(f.environment, owner))["9router"].savedCredential, true);
  delete globalThis.__credentialRouteEnvironment;
  delete globalThis.__credentialRouteShouldFail;
});

test("session endpoint exposes only the signed-in owner's safe readiness metadata", async () => {
  const f = fixture();
  await remember(f);
  globalThis.__credentialSessionEnvironment = f.environment;
  globalThis.__credentialSessionUser = { userId: owner };
  const sourceUrl = (source) => `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
  const envUrl = sourceUrl("export const env = globalThis.__credentialSessionEnvironment;");
  const authUrl = sourceUrl("export async function getChatGPTUser(){return globalThis.__credentialSessionUser} export function chatGPTSignInPath(){return '/signin'} export function chatGPTSignOutPath(){return '/signout'}");
  const apiUrl = sourceUrl("export function json(value,status=200){return Response.json(value,{status})} export function errorResponse(){return Response.json({code:'server_error'},{status:500})}");
  const route = await import(moduleUrl("../app/api/session/route.ts", [["cloudflare:workers", envUrl], ["@/app/chatgpt-auth", authUrl], ["@/lib/studio-api", apiUrl], ["@/lib/studio-credentials", credentialsUrl]]));
  const ownerResponse = await route.GET();
  assert.equal(ownerResponse.status, 200);
  const body = await ownerResponse.json();
  assert.equal(body.providers["9router"].configured, true);
  assert.equal(body.providers["9router"].savedCredential, true);
  const serialized = JSON.stringify(body);
  for (const privateValue of [personalKey, environmentSecret, "encrypted_key", "revision", "expires_at"]) assert.equal(serialized.includes(privateValue), false, privateValue);
  globalThis.__credentialSessionUser = { userId: "other-owner" };
  const otherResponse = await (await route.GET()).json();
  assert.equal(otherResponse.providers["9router"].configured, false);
  globalThis.__credentialSessionUser = null;
  const anonymousResponse = await (await route.GET()).json();
  assert.equal(anonymousResponse.authenticated, false);
  assert.equal(anonymousResponse.providers["9router"].configured, false);
  delete globalThis.__credentialSessionEnvironment;
  delete globalThis.__credentialSessionUser;
});
