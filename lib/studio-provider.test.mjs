import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

// Load the isolated validation/provider modules without a running Cloudflare Worker.
// Requests are intercepted below; these tests never call a paid AI endpoint.
function moduleUrl(path, replacements = []) {
  let source = ts.transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  }).outputText;
  for (const [from, to] of replacements) source = source.replace(from, to);
  return `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
}
const validationUrl = moduleUrl("./studio-validation.ts");
const validation = await import(validationUrl);
const provider = await import(moduleUrl("./studio-provider.ts", [["\"./studio-validation\"", JSON.stringify(validationUrl)]]));
const png = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRuoAAAAASUVORK5CYII=";
const base = { featureId: "text-to-image", prompt: "A product photograph", kind: "image", options: {}, images: [] };
const settings = { ...provider.DEFAULT_MODELS, apiKey: "test_key_is_never_a_real_credential" };
const originalFetch = globalThis.fetch;

test.after(() => { globalThis.fetch = originalFetch; });

test("accepts 14 valid image references within the aggregate byte budget", () => {
  const input = validation.validateGenerate({ ...base, images: Array.from({ length: 14 }, () => ({ data: png, mimeType: "image/png" })) });
  assert.equal(input.images.length,14);
});

test("honors source language labels and common language codes with an Indonesian fallback", () => {
  for (const value of ["en", "en-US", "English", "english", "Bahasa Inggris"]) assert.equal(provider.outputLanguage(value),"English");
  for (const value of [undefined, "", "id", "id-ID", "Bahasa Indonesia", "indonesian"]) assert.equal(provider.outputLanguage(value),"Indonesian");
  for (const value of ["ms", "ms-MY", "Malay", "Bahasa Melayu"]) assert.equal(provider.outputLanguage(value),"Malay");
  assert.equal(provider.outputLanguage("日本語"),"日本語");
  assert.equal(provider.outputLanguage("Español"),"Español");
  assert.equal(provider.outputLanguage("English\nInjected control"),"Indonesian");
  assert.equal(provider.outputLanguage("x".repeat(81)),"Indonesian");
});

test("rejects forged MIME data, oversized reference counts, and secrets inside stored options", () => {
  assert.throws(() => validation.validateGenerate({ ...base, images: [{ data: png, mimeType: "image/jpeg" }] }), validation.ValidationError);
  assert.throws(() => validation.validateGenerate({ ...base, images: Array.from({ length: 15 }, () => ({ data: png, mimeType: "image/png" })) }), validation.ValidationError);
  assert.throws(() => validation.validateGenerate({ ...base, options: { nested: { apiKey: "do-not-store-this" } } }), validation.ValidationError);
  assert.throws(() => validation.validateGenerate({ ...base, images: [{ data: "../../secret", mimeType: "image/png" }] }), validation.ValidationError);
});

test("sends image inputs and aspect/resolution controls only to the official Google endpoint", async () => {
  globalThis.fetch = async (url, request) => {
    assert.equal(url, "https://generativelanguage.googleapis.com/v1/models/gemini-3.1-flash-image:generateContent");
    assert.equal(request.redirect,"manual");
    assert.equal(request.headers["x-goog-api-key"],settings.apiKey);
    const body = JSON.parse(request.body);
    assert.deepEqual(body.generationConfig.responseFormat,{ image: { aspectRatio: "9:16", imageSize: "2K" } });
    assert.equal(body.contents[0].parts[1].inlineData.mimeType,"image/png");
    assert.ok(body.contents[0].parts[0].text.includes("Product studio"));
    return Response.json({ candidates: [{ content: { parts: [{ text: "Done" }, { inlineData: { data: png, mimeType: "image/png" } }] } }] });
  };
  const output = await provider.generateWithGemini({ ...base, options: { ratio: "9:16", resolution: "2K" }, images: [{ data: png, mimeType: "image/png" }] },"Product studio",settings);
  assert.equal(output.length,1);
  assert.equal(output[0].kind,"image");
  assert.ok(output[0].bytes.byteLength > 8);
});

test("distinguishes a no-image reply from a successful generation", async () => {
  globalThis.fetch = async () => Response.json({ candidates: [{ content: { parts: [{ text: "Cannot make this image" }] } }] });
  await assert.rejects(() => provider.generateWithGemini(base,"Product studio",settings), { code: "provider_no_image", status: 422 });
});

test("surfaces safety rejection without persisting a fake output", async () => {
  globalThis.fetch = async () => Response.json({ promptFeedback: { blockReason: "SAFETY" } });
  await assert.rejects(() => provider.generateWithGemini(base,"Product studio",settings), { code: "provider_rejected", status: 422 });
});

test("returns generated text and discards internal thought parts", async () => {
  globalThis.fetch = async (_url,request) => {
    assert.ok(JSON.parse(request.body).contents[0].parts[0].text.includes("Output language: English."));
    return Response.json({ candidates: [{ content: { parts: [{ thought: true, text: "private reasoning" }, { text: "Ready-to-use caption" }] } }] });
  };
  const output = await provider.generateWithGemini({ ...base, kind: "text", options: { language: "English" } },"Caption",settings);
  assert.equal(output[0].text,"Ready-to-use caption");
});

test("maps quota and credential failures to actionable errors without forwarding provider data", async () => {
  globalThis.fetch = async () => Response.json({ error: { message: "sensitive provider detail" } }, { status: 429 });
  await assert.rejects(() => provider.generateWithGemini(base,"Product studio",settings), { code: "provider_quota_exceeded", status: 429 });
  globalThis.fetch = async () => Response.json({ error: { message: "sensitive provider detail" } }, { status: 403 });
  await assert.rejects(() => provider.generateWithGemini(base,"Product studio",settings), { code: "provider_authentication_failed", status: 502 });
});

test("uses the current TTS Interactions schema and returns complete WAV audio", async () => {
  const wave = Buffer.alloc(44); wave.write("RIFF",0); wave.write("WAVE",8);
  globalThis.fetch = async (url, request) => {
    assert.equal(url,"https://generativelanguage.googleapis.com/v1beta/interactions");
    const body = JSON.parse(request.body);
    assert.equal(body.model,"gemini-3.8-flash-tts");
    assert.equal(body.input[0].content[0].text,"Halo Indonesia");
    assert.deepEqual(body.generation_config.speech_config,[{ voice: "Kore" }]);
    assert.equal(body.response_format.mime_type,"audio/wav");
    return Response.json({ status: "completed", steps: [{ type: "model_output", content: [{ type: "audio", data: wave.toString("base64"), mime_type: "audio/wav" }] }] });
  };
  const output = await provider.generateWithGemini({ ...base, prompt: "Halo Indonesia", kind: "audio", options: { voice: "Kore", style: "Cheerful" } },"Voice over",settings);
  assert.equal(output[0].mimeType,"audio/wav");
  assert.equal(output[0].bytes.byteLength,44);
});

test("rejects invalid model paths before making a network request", async () => {
  globalThis.fetch = async () => { throw new Error("must not fetch"); };
  await assert.rejects(() => provider.generateWithGemini(base,"Product studio",{ ...settings, imageModel: "../../private" }), { code: "provider_configuration_invalid" });
});

test("rejects Gemini redirects before parsing and never forwards credentials to their destination", async () => {
  let requests = 0;
  globalThis.fetch = async (url,request) => {
    requests++;
    assert.ok(url.startsWith("https://generativelanguage.googleapis.com/"));
    assert.equal(request.redirect,"manual");
    return new Response("",{ status: 302, headers: { Location: "https://other-provider.example.com/collect" } });
  };
  await assert.rejects(() => provider.generateWithGemini(base,"Product studio",settings),{ code: "provider_redirect_refused", status: 502 });
  assert.equal(requests,1);
});
