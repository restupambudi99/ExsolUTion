import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

function moduleUrl(path,replacements = []) {
  let source = ts.transpileModule(readFileSync(new URL(path,import.meta.url),"utf8"),{ compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
  for (const [from,to] of replacements) source = source.replaceAll(JSON.stringify(from),JSON.stringify(to));
  return `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
}
const validationUrl = moduleUrl("./studio-validation.ts");
const providerUrl = moduleUrl("./studio-provider.ts",[["./studio-validation",validationUrl]]);
const routerUrl = moduleUrl("./studio-router.ts",[["./studio-validation",validationUrl],["./studio-provider",providerUrl]]);
const configUrl = moduleUrl("./studio-config.ts",[["./studio-provider",providerUrl],["./studio-router",routerUrl]]);
const validation = await import(validationUrl);
const router = await import(routerUrl);
const config = await import(configUrl);
const originalFetch = globalThis.fetch;
const png = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRuoAAAAASUVORK5CYII=";
const base = { provider: "9router", featureId: "fixture", prompt: "Create a product photograph", kind: "image", options: {}, images: [] };
const settings = { apiKey: "router_fixture_key", baseUrl: "https://gateway.example.com/v1", textModel: "provider/text-model", imageModel: "cx/image-model", audioModel: "openai/tts-model", voice: "" };
function mockDns(url,options,ip = "93.184.216.34") {
  if (!url.startsWith("https://cloudflare-dns.com/")) return null;
  assert.equal(options.headers.Authorization,undefined);
  assert.equal(options.redirect,"manual");
  return Response.json({ Status: 0, Answer: [{ type: 1, data: ip, TTL: 1 }] });
}
test.after(() => { globalThis.fetch = originalFetch; });

test("validates explicit provider selection and keeps its key/config separate from options", () => {
  const input = validation.validateGenerate({ ...base, apiKey: "router.token-with.other:syntax", routerConfig: { baseUrl: settings.baseUrl, textModel: "provider/custom-model" } });
  assert.equal(input.provider,"9router");
  assert.equal(input.apiKey,"router.token-with.other:syntax");
  assert.deepEqual(input.options,{});
  assert.throws(() => validation.validateProviderSelection({ provider: "unknown", apiKey: "fixture" }),validation.ValidationError);
  assert.throws(() => validation.validateProviderSelection({ provider: "9router", apiKey: "bad\r\nheader" }),validation.ValidationError);
});

test("normalizes root and /v1 endpoints and rejects local, credentialed, or non-HTTPS URLs", () => {
  assert.equal(router.normalizeRouterBaseUrl("https://gateway.example.com"),settings.baseUrl);
  assert.equal(router.normalizeRouterBaseUrl(`${settings.baseUrl}/`),settings.baseUrl);
  assert.equal(router.normalizeRouterBaseUrl("https://gateway.example.com/api/v1"),"https://gateway.example.com/api/v1");
  for (const value of ["http://gateway.example.com/v1","https://127.0.0.1/v1","https://2130706433/v1","https://0x7f000001/v1","https://[::1]/v1","https://localhost/v1","https://router.local/v1","https://router.internal/v1","https://user:password@gateway.example.com/v1","https://gateway.example.com/v1?key=secret","https://gateway.example.com/v1#secret","https://gateway.example.com:8443/v1","https://gateway.example.com/not-an-api"]) assert.throws(() => router.normalizeRouterBaseUrl(value),{ code: "invalid_router_url" });
});

test("permits only an administrator-approved public HTTP origin and still rejects private IPs", async () => {
  const origin = "http://38.47.191.228:20128";
  const allowed = router.allowedRouterHttpOrigins(`${origin},http://127.0.0.1:20128,http://169.254.169.254,http://10.1.2.3:20128`);
  assert.deepEqual(allowed,[origin]);
  assert.equal(router.normalizeRouterBaseUrl(origin,allowed),`${origin}/v1`);
  assert.equal(router.normalizeRouterBaseUrl(`${origin}/v1`,allowed),`${origin}/v1`);
  assert.throws(() => router.normalizeRouterBaseUrl(`${origin}/v1`),{ code: "invalid_router_url" });
  assert.throws(() => router.normalizeRouterBaseUrl("http://38.47.191.229:20128/v1",allowed),{ code: "invalid_router_url" });
  for (const privateOrigin of ["http://127.0.0.1:20128","http://10.1.2.3:20128","http://169.254.169.254"]) assert.throws(() => router.normalizeRouterBaseUrl(`${privateOrigin}/v1`,[privateOrigin]),{ code: "invalid_router_url" });
  const environment = { NINEROUTER_BASE_URL: `${origin}/v1`, NINEROUTER_ALLOWED_HTTP_ORIGINS: origin };
  assert.deepEqual(config.providerStatus(environment)["9router"].allowedHttpOrigins,[origin]);
  assert.equal(config.providerStatus(environment)["9router"].configured,false);
  globalThis.fetch = async () => { throw new Error("this validation test must not contact the real endpoint"); };
  assert.throws(() => config.resolveProvider({ provider: "9router" },environment),{ code: "provider_not_configured" });
  await router.assertPublicRouterAddress(`${origin}/v1`,allowed);
});

test("requires selected-provider keys and never sends a server key to a caller-chosen router URL", () => {
  const environment = { GEMINI_API_KEY: "server_gemini_fixture", NINEROUTER_API_KEY: "server_router_fixture", NINEROUTER_BASE_URL: settings.baseUrl, NINEROUTER_TEXT_MODEL: "server/text" };
  assert.equal(config.resolveProvider({ provider: "gemini", apiKey: "personal_gemini_fixture" },environment).settings.apiKey,"personal_gemini_fixture");
  assert.equal(config.resolveProvider({ provider: "9router", apiKey: "personal_router_fixture", routerConfig: { baseUrl: "https://personal.example.com/v1" } },environment).settings.apiKey,"personal_router_fixture");
  assert.throws(() => config.resolveProvider({ provider: "9router", routerConfig: { baseUrl: "https://attacker.example.com/v1" } },environment),{ code: "router_endpoint_mismatch", status: 403 });
  assert.throws(() => config.resolveProvider({ provider: "9router" },{ GEMINI_API_KEY: environment.GEMINI_API_KEY }),{ code: "provider_not_configured" });
  assert.throws(() => config.resolveProvider({ provider: "gemini" },{ NINEROUTER_API_KEY: environment.NINEROUTER_API_KEY }),{ code: "provider_not_configured" });
  const status = config.providerStatus({ NINEROUTER_BASE_URL: settings.baseUrl });
  assert.equal(status["9router"].configured,false);
  assert.equal(config.providerStatus({})["9router"].baseUrl,"");
  assert.equal(JSON.stringify(config.providerStatus(environment)).includes("fixture"),false);
});

test("rejects private and special DNS answers without sending the router credential", async () => {
  for (const ip of ["127.0.0.1","10.0.0.1","169.254.169.254","172.16.0.1","192.168.1.1","100.64.0.1","203.0.113.1","::1","fc00::1","fe80::1","::ffff:127.0.0.1","2001:db8::1","2::1"]) assert.equal(router.isPublicAddress(ip),false);
  assert.equal(router.isPublicAddress("93.184.216.34"),true);
  assert.equal(router.isPublicAddress("2606:4700:4700::1111"),true);
  globalThis.fetch = async (url,options) => { const result = mockDns(url,options,"10.2.3.4"); assert.ok(result); return result; };
  await assert.rejects(() => router.assertPublicRouterAddress("https://private-answer.example.com/v1"),{ code: "private_router_address" });
});

test("sends vision references as inline OpenAI content and uses only the selected router key", async () => {
  globalThis.fetch = async (url,options) => {
    const dns = mockDns(url,options); if (dns) return dns;
    assert.equal(url,`${settings.baseUrl}/chat/completions`);
    assert.equal(options.redirect,"manual");
    assert.equal(options.headers.Authorization,`Bearer ${settings.apiKey}`);
    assert.equal(options.headers["x-goog-api-key"],undefined);
    const body = JSON.parse(options.body);
    assert.equal(body.model,settings.textModel);
    assert.equal(body.stream,false);
    assert.equal(body.messages[0].content[1].image_url.url,`data:image/png;base64,${png}`);
    return Response.json({ choices: [{ message: { content: "A reference-aware description" } }] });
  };
  const output = await router.generateWithRouter({ ...base, kind: "text", images: [{ data: png, mimeType: "image/png" }] },"Describe the supplied product",settings);
  assert.equal(output[0].text,"A reference-aware description");
});

test("preserves references for verified image adapters and requests router-side binary conversion", async () => {
  globalThis.fetch = async (url,options) => {
    const dns = mockDns(url,options); if (dns) return dns;
    assert.equal(url,`${settings.baseUrl}/images/generations?response_format=binary`);
    const body = JSON.parse(options.body);
    assert.equal(body.n,1);
    assert.equal(body.response_format,"b64_json");
    assert.equal(body.images[0],`data:image/png;base64,${png}`);
    return new Response(Buffer.from(png,"base64"),{ headers: { "Content-Type": "image/png" } });
  };
  const output = await router.generateWithRouter({ ...base, images: [{ data: png, mimeType: "image/png" }] },"Edit the reference product",settings);
  assert.equal(output[0].kind,"image");
  assert.equal(output[0].mimeType,"image/png");
});

test("rejects reference-incompatible adapters and never silently discards reference images", async () => {
  globalThis.fetch = async () => { throw new Error("must reject before network"); };
  const input = { ...base, images: [{ data: png, mimeType: "image/png" }] };
  await assert.rejects(() => router.generateWithRouter(input,"Edit the product",{ ...settings, imageModel: "gemini/image-model" }),{ code: "router_reference_images_unsupported" });
  await assert.rejects(() => router.generateWithRouter({ ...input, images: [...input.images,...input.images] },"Edit the product",{ ...settings, imageModel: "fal/image-model" }),{ code: "router_reference_images_unsupported" });
});

test("handles JSON TTS audio and encodes explicit voices in the supported model ID", async () => {
  const wave = Buffer.alloc(44); wave.write("RIFF",0); wave.write("WAVE",8);
  globalThis.fetch = async (url,options) => {
    const dns = mockDns(url,options); if (dns) return dns;
    assert.equal(url,`${settings.baseUrl}/audio/speech?response_format=json`);
    const body = JSON.parse(options.body);
    assert.equal(body.input,"Halo dunia");
    assert.equal(body.model,"openai/tts-model/alloy");
    assert.equal(body.voice,undefined);
    return Response.json({ audio: wave.toString("base64"), format: "wav" });
  };
  const output = await router.generateWithRouter({ ...base, kind: "audio", prompt: "Halo dunia" },"Voice-over",{ ...settings, voice: "alloy" });
  assert.equal(output[0].mimeType,"audio/wav");
  assert.equal(output[0].bytes.byteLength,44);
});

test("never fetches response-supplied image URLs or treats invalid audio as successful", async () => {
  globalThis.fetch = async (url,options) => {
    const dns = mockDns(url,options); if (dns) return dns;
    assert.ok(url.startsWith(settings.baseUrl));
    return Response.json({ data: [{ url: "http://169.254.169.254/metadata" }] });
  };
  await assert.rejects(() => router.generateWithRouter(base,"Create an image",settings),{ code: "router_no_image_data" });
  globalThis.fetch = async (url,options) => mockDns(url,options) || Response.json({ audio: Buffer.from("not an audio file").toString("base64"), format: "mp3" });
  await assert.rejects(() => router.generateWithRouter({ ...base, kind: "audio" },"Voice-over",settings),{ code: "provider_invalid_audio" });
});

test("surfaces router errors without raw provider details or automatic fallback requests", async () => {
  let requests = 0;
  globalThis.fetch = async (url,options) => {
    const dns = mockDns(url,options); if (dns) return dns;
    requests++;
    assert.ok(url.startsWith(settings.baseUrl));
    return Response.json({ error: { message: "upstream-sensitive-detail" } },{ status: 401 });
  };
  await assert.rejects(() => router.generateWithRouter({ ...base, kind: "text" },"Write copy",settings),(error) => error.code === "provider_authentication_failed" && !error.message.includes("upstream-sensitive-detail"));
  assert.equal(requests,1);
});

test("rejects router redirects without following their Location or forwarding the selected key", async () => {
  let requests = 0;
  globalThis.fetch = async (url,options) => {
    const dns = mockDns(url,options); if (dns) return dns;
    requests++;
    assert.ok(url.startsWith(settings.baseUrl));
    assert.equal(options.redirect,"manual");
    return new Response("",{ status: 307, headers: { Location: "http://169.254.169.254/metadata" } });
  };
  await assert.rejects(() => router.generateWithRouter({ ...base, kind: "text" },"Write copy",settings),{ code: "router_redirect_refused", status: 502 });
  assert.equal(requests,1);
});

test("rejects DNS resolver redirects using manual mode and no provider credentials", async () => {
  globalThis.fetch = async (url,options) => {
    assert.ok(url.startsWith("https://cloudflare-dns.com/"));
    assert.equal(options.redirect,"manual");
    assert.equal(options.headers.Authorization,undefined);
    return new Response("",{ status: 302, headers: { Location: "http://127.0.0.1/private" } });
  };
  await assert.rejects(() => router.assertPublicRouterAddress("https://dns-redirect.example.com/v1"),{ code: "router_dns_redirect_refused", status: 502 });
});
