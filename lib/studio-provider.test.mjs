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

test("accepts opaque Gemini keys including dotted and long formats without changing their contents", () => {
  const keys = [
    `AIza${"a".repeat(35)}`,
    "x".repeat(20),
    "opaque+fixture/key==.v2",
    `AQ.${"x".repeat(597)}`,
    `AQ.${"x".repeat(4093)}`,
  ];
  for (const key of keys) {
    const selected = validation.validateProviderSelection({ provider: "gemini", apiKey: ` \t${key}\r\n` });
    assert.equal(selected.provider, "gemini");
    assert.equal(selected.apiKey, key);
    assert.equal(validation.validateGenerate({ ...base, apiKey: key }).apiKey, key);
  }
});

test("rejects unsafe or oversized Gemini key input without including the submitted credential in errors", () => {
  const marker = "fixture-sensitive-key";
  const invalidKeys = [
    null, 123, false, {}, [marker],
    "short_fixture_key", " \t\r\n ",
    `${marker} internal-space`, `${marker}\tinternal-tab`,
    `${marker}\r\nheader-injection`, `${marker}\0null`,
    `${marker}\x7fdelete`, `${marker}\u200binvisible`, `${marker}\u00e9unicode`,
    `AQ.${"x".repeat(4094)}`,
  ];
  for (const key of invalidKeys) {
    assert.throws(() => validation.validateProviderSelection({ provider: "gemini", apiKey: key }), error => {
      assert.ok(error instanceof validation.ValidationError);
      assert.equal(error.message.includes(marker), false);
      if (typeof key === "string" && key.trim()) assert.equal(error.message.includes(key), false);
      return true;
    });
  }
});

test("keeps 9Router key length and header safety rules independent of Gemini", () => {
  for (const key of ["x", "x".repeat(4096)]) {
    assert.equal(validation.validateProviderSelection({ provider: "9router", apiKey: key }).apiKey, key);
  }
  for (const key of ["x".repeat(4097), "key with spaces", "key\r\nheader"]) {
    assert.throws(() => validation.validateProviderSelection({ provider: "9router", apiKey: key }), validation.ValidationError);
  }
});

test("accepts 14 valid image references within the aggregate byte budget", () => {
  const input = validation.validateGenerate({ ...base, images: Array.from({ length: 14 }, () => ({ data: png, mimeType: "image/png" })) });
  assert.equal(input.images.length,14);
});

test("validates mask roles separately from photo references and requires PNG plus a source photo", () => {
  const photo = { data: png, mimeType: "image/png" };
  const mask = { ...photo, role: "mask", fieldId: "object-removal-mask" };
  const input = validation.validateGenerate({ ...base, images: [photo,mask] });
  assert.equal(input.images.filter((image) => image.role !== "mask").length,1);
  assert.equal(input.images[1].role,"mask");
  assert.throws(() => validation.validateGenerate({ ...base, images: [mask] }),validation.ValidationError);
  assert.throws(() => validation.validateGenerate({ ...base, images: [photo,mask,mask] }),validation.ValidationError);
  assert.throws(() => validation.validateGenerate({ ...base, images: [photo,{ ...mask,mimeType: "image/jpeg" }] }),validation.ValidationError);
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
  // Contract checked against the current official REST image generation guide:
  // https://ai.google.dev/gemini-api/docs/generate-content/image-generation
  globalThis.fetch = async (url, request) => {
    assert.equal(url, "https://generativelanguage.googleapis.com/v1/models/gemini-3.1-flash-image:generateContent");
    assert.equal(request.redirect,"manual");
    assert.equal(request.headers["x-goog-api-key"],settings.apiKey);
    const body = JSON.parse(request.body);
    assert.equal(body.generationConfig.maxOutputTokens,32768);
    assert.deepEqual(body.generationConfig.responseModalities,["TEXT","IMAGE"]);
    assert.deepEqual(body.generationConfig.responseFormat,{ image: { aspectRatio: "9:16", imageSize: "2K" } });
    assert.equal("imageConfig" in body.generationConfig,false);
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

test("maps quota and access failures separately without forwarding provider data", async () => {
  globalThis.fetch = async () => Response.json({ error: { message: "sensitive provider detail" } }, { status: 429 });
  await assert.rejects(() => provider.generateWithGemini(base,"Product studio",settings), { code: "provider_quota_exceeded", status: 429 });
  globalThis.fetch = async () => Response.json({ error: { message: "sensitive provider detail" } }, { status: 403 });
  await assert.rejects(() => provider.generateWithGemini(base,"Product studio",settings), { code: "provider_access_denied", status: 403 });
});

const classifiedErrors = [
  [400,{ status: "INVALID_ARGUMENT", details: [{ "@type": "type.googleapis.com/google.rpc.ErrorInfo", reason: "API_KEY_INVALID" }] },"provider_authentication_failed",502],
  [400,{ status: "INVALID_ARGUMENT", details: [{ reason: "API_KEY_EXPIRED" }] },"provider_authentication_failed",502],
  [403,{ details: [{ reason: "API_KEY_REVOKED" }] },"provider_authentication_failed",502],
  [400,{ message: "API key not valid. Please pass a valid API key." },"provider_authentication_failed",502],
  [400,{ message: "API key has expired. Please renew the API key." },"provider_authentication_failed",502],
  [400,{ message: "API key expired. Please renew the API key." },"provider_authentication_failed",502],
  [401,{ code: "authentication" },"provider_authentication_failed",502],
  [400,{ status: "FAILED_PRECONDITION" },"provider_precondition_failed",400],
  [400,{ code: "failed_precondition" },"provider_precondition_failed",400],
  [400,{ status: "FAILED_PRECONDITION", details: [{ reason: "BILLING_DISABLED" }] },"provider_billing_required",400],
  [403,{ details: [{ reason: "BILLING_ACCOUNT_DISABLED" }] },"provider_billing_required",400],
  [400,{ message: "Billing has not been enabled for this project." },"provider_billing_required",400],
  [400,{ message: "Please enable billing on your Google Cloud project." },"provider_billing_required",400],
  [400,{ message: "A prerequisite failed; consult account settings." },"provider_invalid_request",400],
  [400,{ status: "INVALID_ARGUMENT", message: "Review billing reports for an unrelated parameter error." },"provider_invalid_request",400],
  [402,{ code: "payment_required" },"provider_payment_required",402],
  [403,{ status: "PERMISSION_DENIED", details: [{ reason: "API_KEY_SERVICE_BLOCKED" }] },"provider_access_denied",403],
  [403,{ details: [{ reason: "API_KEY_HTTP_REFERRER_BLOCKED" }] },"provider_access_denied",403],
  [404,{ status: "NOT_FOUND" },"provider_model_unavailable",503],
  [429,{ status: "RESOURCE_EXHAUSTED" },"provider_quota_exceeded",429],
];

for (const [status,upstream,code,mappedStatus] of classifiedErrors) test(`classifies Gemini ${status} ${code} without retaining upstream content`, async () => {
  let requests = 0;
  const privateMarker = "private-project-and-user-prompt";
  globalThis.fetch = async () => {
    requests++;
    return Response.json({ error: { ...upstream, message: `${upstream.message || ""} ${settings.apiKey} ${privateMarker}`, privateMetadata: privateMarker } },{ status });
  };
  await assert.rejects(() => provider.generateWithGemini(base,"Product studio",settings),error => {
    assert.equal(error.code,code);
    assert.equal(error.status,mappedStatus);
    for (const text of [error.message,JSON.stringify(error),error.stack]) {
      assert.equal(text.includes(settings.apiKey),false);
      assert.equal(text.includes(privateMarker),false);
    }
    return true;
  });
  assert.equal(requests,1);
});

for (const field of ["responseFormat","response_format","imageConfig","image_config","responseModalities","maxOutputTokens","inlineData","mimeType","contents","parts","generationConfig"]) test(`identifies only the allowlisted rejected Gemini field ${field}`, async () => {
  const privateMarker = "private-project-and-user-prompt";
  globalThis.fetch = async () => Response.json({ error: {
    status: "INVALID_ARGUMENT",
    message: `Invalid JSON payload received. Unknown name "${field}" at 'private_field': Cannot find field. ${settings.apiKey} ${privateMarker}`,
    details: [{ "@type": "type.googleapis.com/google.rpc.BadRequest", fieldViolations: [{ field: `private_field.${field}`, description: `Unknown name "${field}": Cannot find field. ${settings.apiKey} ${privateMarker}` }] }],
  } },{ status: 400 });
  await assert.rejects(() => provider.generateWithGemini(base,"Product studio",settings),error => {
    assert.equal(error.code,"provider_configuration_invalid");
    assert.equal(error.status,400);
    assert.match(error.message,new RegExp(field));
    assert.doesNotMatch(`${error.message} ${JSON.stringify(error)}`,new RegExp(`${settings.apiKey}|${privateMarker}|private_field|Unknown name|Cannot find field`));
    return true;
  });
});

test("classifies structured unknown-field violations without copying a private field path", async () => {
  globalThis.fetch = async () => Response.json({ error: { status: "INVALID_ARGUMENT", details: [{ fieldViolations: [{ field: "private_path.generationConfig.responseFormat", description: `Cannot find field. ${settings.apiKey}` }] }] } },{ status: 400 });
  await assert.rejects(() => provider.generateWithGemini(base,"Product studio",settings),error => {
    assert.equal(error.code,"provider_configuration_invalid");
    assert.match(error.message,/parameter responseFormat\./);
    assert.doesNotMatch(error.message,/private_path|generationConfig/);
    assert.equal(error.message.includes(settings.apiKey),false);
    return true;
  });
});

test("does not expose unknown unlisted fields or classify incidental request-field mentions", async () => {
  for (const message of [
    `Unknown name "private_field_${settings.apiKey}": Cannot find field.`,
    `Check responseFormat in your private instructions; unrelated invalid parameter ${settings.apiKey}`,
    `Unknown name "responseFormatPrivateSuffix": Cannot find field. ${settings.apiKey}`,
  ]) {
    globalThis.fetch = async () => Response.json({ error: { status: "INVALID_ARGUMENT", message } },{ status: 400 });
    await assert.rejects(() => provider.generateWithGemini(base,"Product studio",settings),error => {
      assert.equal(error.code,"provider_invalid_request");
      assert.match(error.message,/INVALID_ARGUMENT/);
      assert.doesNotMatch(error.message,/responseFormat|private_field|Unknown name/);
      assert.equal(error.message.includes(settings.apiKey),false);
      return true;
    });
  }
});

const requestContractErrors = [
  [{ message: "maxOutputTokens must be less than 8193." },"provider_configuration_invalid",/maxOutputTokens/],
  [{ details: [{ fieldViolations: [{ field: "generationConfig.maxOutputTokens", description: "Value is out of range." }] }] },"provider_configuration_invalid",/maxOutputTokens/],
  [{ message: "Unable to decode image: invalid bytes." },"provider_invalid_request",/gambar referensi/],
  [{ message: "Invalid image data." },"provider_invalid_request",/gambar referensi/],
  [{ message: "Unsupported MIME type: image/example." },"provider_invalid_request",/gambar referensi/],
  [{ message: "The model does not support the requested response modalities: IMAGE." },"provider_configuration_invalid",/jenis keluaran/],
  [{ message: "Image generation is not supported for this model." },"provider_configuration_invalid",/jenis keluaran/],
  [{ message: "User location is not supported for the API use." },"provider_region_unsupported",/lokasi akun atau server/],
  [{ message: "Gemini API is not available in your country." },"provider_region_unsupported",/lokasi akun atau server/],
];

for (const [upstream,code,wording] of requestContractErrors) test(`classifies safe Gemini request diagnostics as ${code}`, async () => {
  const privateMarker = "private-project-and-user-prompt";
  globalThis.fetch = async () => Response.json({ error: { ...upstream, status: "INVALID_ARGUMENT", message: `${upstream.message || ""} ${settings.apiKey} ${privateMarker}` } },{ status: 400 });
  await assert.rejects(() => provider.generateWithGemini(base,"Product studio",settings),error => {
    assert.equal(error.code,code);
    assert.equal(error.status,400);
    assert.match(error.message,wording);
    assert.equal(error.message.includes(settings.apiKey),false);
    assert.equal(error.message.includes(privateMarker),false);
    return true;
  });
});

test("uses the HTTP classification for malformed and unexpected Gemini JSON errors", async () => {
  for (const text of ["{broken-json", "null", "[]", "{}", '{"error":[]}', '{"error":"private text"}']) {
    globalThis.fetch = async () => new Response(text,{ status: 402, headers: { "Content-Type": "application/json" } });
    await assert.rejects(() => provider.generateWithGemini(base,"Product studio",settings),{ code: "provider_payment_required", status: 402 });
  }
});

test("cancels oversized Gemini error streams instead of parsing a partial classification", async () => {
  let cancelled = false, pulls = 0;
  const encoder = new TextEncoder();
  globalThis.fetch = async () => new Response(new ReadableStream({
    pull(controller) {
      pulls++;
      controller.enqueue(encoder.encode(pulls === 1 ? '{"error":{"details":[{"reason":"API_KEY_INVALID"}],"message":"' + "x".repeat(32768) : "x".repeat(32768)));
    },
    cancel() { cancelled = true; },
  }),{ status: 400, headers: { "Content-Type": "application/json" } });
  await assert.rejects(() => provider.generateWithGemini(base,"Product studio",settings),{ code: "provider_invalid_request", status: 400 });
  assert.equal(cancelled,true);
  assert.ok(pulls <= 2);
});

test("rejects an oversized declared Gemini error body without reading it", async () => {
  let cancelled = false;
  globalThis.fetch = async () => new Response(new ReadableStream({ cancel() { cancelled = true; } }),{ status: 400, headers: { "Content-Type": "application/json", "Content-Length": "32769" } });
  await assert.rejects(() => provider.generateWithGemini(base,"Product studio",settings),{ code: "provider_invalid_request", status: 400 });
  assert.equal(cancelled,true);
});

test("ignores classifications in non-JSON Gemini error pages and cancels their body", async () => {
  let cancelled = false;
  globalThis.fetch = async () => new Response(new ReadableStream({ cancel() { cancelled = true; } }),{ status: 403, headers: { "Content-Type": "text/html" } });
  await assert.rejects(() => provider.generateWithGemini(base,"Product studio",settings),{ code: "provider_access_denied", status: 403 });
  assert.equal(cancelled,true);
});

test("connection catalog warns about missing configured models without echoing model settings or claiming generation works", async () => {
  globalThis.fetch = async (url,request) => {
    assert.equal(url,"https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000");
    assert.equal(request.method,"GET");
    return Response.json({ models: [{ name: `models/${settings.textModel}` }] });
  };
  const result = await provider.testGeminiConnection({ ...settings, imageModel: `gemini-${settings.apiKey}` });
  assert.equal(result.ok,true);
  assert.equal(result.warnings.length,3);
  assert.match(result.warnings[0],/belum membuat gambar/);
  assert.match(result.warnings[1],/Model gambar/);
  assert.match(result.warnings[2],/Model suara/);
  assert.equal(JSON.stringify(result).includes(settings.apiKey),false);
});

test("complete model catalogs retain only the non-paid connection-test scope warning", async () => {
  globalThis.fetch = async () => Response.json({ models: Object.values(provider.DEFAULT_MODELS).map(name => ({ name: `models/${name}` })) });
  const result = await provider.testGeminiConnection(settings);
  assert.equal(result.warnings.length,1);
  assert.match(result.warnings[0],/kuota dan billing/);
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
  let requests = 0, cancelled = false;
  globalThis.fetch = async (url,request) => {
    requests++;
    assert.ok(url.startsWith("https://generativelanguage.googleapis.com/"));
    assert.equal(request.redirect,"manual");
    return new Response(new ReadableStream({ cancel() { cancelled = true; } }),{ status: 302, headers: { Location: "https://other-provider.example.com/collect", "Content-Type": "application/json" } });
  };
  await assert.rejects(() => provider.generateWithGemini(base,"Product studio",settings),{ code: "provider_redirect_refused", status: 502 });
  assert.equal(requests,1);
  assert.equal(cancelled,true);
});

for (const status of [408,504,522,524]) test(`Gemini HTTP ${status} remains an ambiguous timeout and never retries the generation POST`, async () => {
  let generations = 0;
  globalThis.fetch = async (url,request) => {
    generations++;
    assert.equal(url,"https://generativelanguage.googleapis.com/v1/models/gemini-3.1-flash-image:generateContent");
    assert.equal(request.method,"POST");
    return new Response("<html>private gateway timeout diagnostic</html>",{ status, headers: { "Content-Type": "text/html" } });
  };
  await assert.rejects(() => provider.generateWithGemini(base,"Product studio",settings),error => {
    assert.equal(error.code,"provider_timeout");
    assert.equal(error.status,504);
    assert.doesNotMatch(error.message,/private gateway/);
    return true;
  });
  assert.equal(generations,1);
});

for (const status of [500,503]) test(`Gemini HTTP ${status} is a final availability failure without an adapter-level retry`, async () => {
  let generations = 0;
  globalThis.fetch = async (_url,request) => {
    generations++;
    assert.equal(request.method,"POST");
    return Response.json({ error: { message: "private unavailable diagnostic" } },{ status });
  };
  await assert.rejects(() => provider.generateWithGemini(base,"Product studio",settings),error => {
    assert.equal(error.code,"provider_unavailable");
    assert.equal(error.status,502);
    assert.doesNotMatch(error.message,/private unavailable/);
    return true;
  });
  assert.equal(generations,1);
});
