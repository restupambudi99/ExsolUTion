import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const code = ts.transpileModule(readFileSync(new URL("./studio-image-variation.ts",import.meta.url),"utf8"),{ compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
const { imageVariationDirection } = await import(`data:text/javascript;base64,${Buffer.from(code).toString("base64")}`);
const feature = { id: "affiliate", group: "ugc", kind: "image", fields: [] };
const input = (index = 1, more = {}) => ({ featureId: feature.id, prompt: "Foto produk sepatu di studio bersih.", kind: "image", images: [], options: { batchId: "2af315cd-c6c0-450b-bf92-7b7ccad704a5", sequenceIndex: index, sequenceTotal: 4 }, ...more });
const title = value => value.split("\n")[0].split(" — ")[1];

test("four selected outputs receive four genuinely different creative briefs", () => {
  const prompts = [1,2,3,4].map(index => imageVariationDirection(feature,input(index)));
  assert.equal(new Set(prompts.map(title)).size,4);
  assert.equal(new Set(prompts.map(value => value.match(/^Visual story: (.+)$/m)?.[1])).size,4);
  assert.equal(new Set(prompts.map(value => value.match(/^Camera suggestion, only where unspecified: (.+)$/m)?.[1])).size,4);
  assert.equal(new Set(prompts.map(value => value.match(/^Composition suggestion, only where unspecified: (.+)$/m)?.[1])).size,4);
  for (const [index,prompt] of prompts.entries()) {
    assert.match(prompt,new RegExp(`Creative variation ${index + 1} of 4`));
    assert.match(prompt,/at least two unlocked dimensions/);
    assert.match(prompt,/Produce exactly one finished image/);
  }
});

test("every four-image batch balances hero, true overhead, close detail and wide context families", () => {
  const expected = ["hero-eye-level","overhead-editorial","tactile-close-up","wide-lifestyle-context"].sort();
  for (const batchId of ["one","two","three","four","a-different-batch","2af315cd-c6c0-450b-bf92-7b7ccad704a5"]) {
    const prompts = [1,2,3,4].map(index => imageVariationDirection(feature,input(index,{ options: { ...input().options, batchId, sequenceIndex: index } })));
    assert.deepEqual(prompts.map(prompt => prompt.match(/^Creative family: ([a-z-]+)\./m)?.[1]).sort(),expected);
    assert.match(prompts.find(prompt => prompt.includes("Creative family: overhead-editorial.")),/true 90-degree overhead camera/);
    assert.match(prompts.find(prompt => prompt.includes("Creative family: tactile-close-up.")),/80–95%/);
    assert.match(prompts.find(prompt => prompt.includes("Creative family: wide-lifestyle-context.")),/25–40%/);
    assert.match(prompts.find(prompt => prompt.includes("Creative family: hero-eye-level.")),/photograph at product eye level/);
    for (const prompt of prompts) assert.ok(prompt.indexOf("Camera suggestion") < prompt.indexOf("Priority:"));
  }
});

test("the maximum ten-slot batch has no duplicated brief", () => {
  const prompts = Array.from({ length: 10 },(_,i) => imageVariationDirection(feature,input(i + 1,{ options: { ...input().options, sequenceIndex: i + 1, sequenceTotal: 10 } })));
  assert.equal(new Set(prompts.map(title)).size,10);
});

test("retrying a failed slot preserves its direction and a new batch changes the art-direction order", () => {
  const before = imageVariationDirection(feature,input(4));
  assert.equal(imageVariationDirection(feature,input(4)),before);
  const first = [1,2,3,4].map(index => title(imageVariationDirection(feature,input(index))));
  const next = [1,2,3,4].map(index => title(imageVariationDirection(feature,input(index,{ options: { ...input().options, batchId: "a-different-batch", sequenceIndex: index } }))));
  assert.notDeepEqual(next,first);
});

test("flat lay chosen as a style prevents an incompatible camera suggestion", () => {
  const styledFeature = { ...feature, fields: [{ id: "theme", label: "Tema Foto", type: "choice", role: "style" }] };
  const prompt = imageVariationDirection(styledFeature,input(1,{ options: { ...input().options, theme: "flat-lay" } }));
  assert.match(prompt,/Camera constraint: retain the exact requested viewpoint/);
  assert.doesNotMatch(prompt,/Camera suggestion/);
});

test("explicit angle control is respected even when its value is a local preset identifier", () => {
  const selectedFeature = { ...feature, fields: [{ id: "camera-option", label: "Sudut Kamera", type: "choice" }] };
  const prompt = imageVariationDirection(selectedFeature,input(2,{ options: { ...input().options, sequenceIndex: 2, "camera-option": "preset-7" } }));
  assert.match(prompt,/Camera constraint/);
  assert.doesNotMatch(prompt,/Camera suggestion/);
});

test("free camera controls allow a distinct view rather than locking an automatic choice", () => {
  const selectedFeature = { ...feature, fields: [{ id: "camera-option", label: "Sudut Kamera", type: "choice" }] };
  const prompt = imageVariationDirection(selectedFeature,input(2,{ options: { ...input().options, sequenceIndex: 2, "camera-option": "auto" } }));
  assert.match(prompt,/Camera suggestion/);
});

test("a specified POV, hand interaction and fixed composition remain unchanged", () => {
  const prompt = imageVariationDirection(feature,input(3,{ prompt: "POV one hand holding food, keep original composition and framing." }));
  assert.match(prompt,/Camera constraint/);
  assert.match(prompt,/Composition constraint/);
  assert.match(prompt,/Action constraint/);
  assert.doesNotMatch(prompt,/Camera suggestion|Composition suggestion|Moment suggestion/);
  assert.match(prompt,/If all dimensions are fixed, satisfy those constraints/);
});

test("selected Indonesian pose and layout values prevent unrequested rearrangement", () => {
  const selectedFeature = { ...feature, fields: [{ id: "pose", label: "Pilih Pose", type: "choice" },{ id: "layout", label: "Tata letak", type: "choice" }] };
  const prompt = imageVariationDirection(selectedFeature,input(1,{ options: { ...input().options, pose: "duduk", layout: "simetris" } }));
  assert.match(prompt,/Action constraint/);
  assert.match(prompt,/Composition constraint/);
  assert.doesNotMatch(prompt,/Moment suggestion|Composition suggestion/);
});

test("product identity, background, style and truthful claims stay above creative directions", () => {
  const prompt = imageVariationDirection(feature,input());
  assert.match(prompt,/user's explicit instructions, selected controls and image roles override the creative directions/);
  assert.match(prompt,/exact product shape, colors, packaging, labels, logos/);
  assert.match(prompt,/supplied person's identity/);
  assert.match(prompt,/Do not invent product functions, benefits, claims, testimonials or extra people/);
  assert.match(prompt,/Preserve an exact location or background description only when the user explicitly specifies it/);
  assert.match(prompt,/product reference is an identity reference, not a template for the whole photograph/);
  assert.match(prompt,/earlier generated scene/);
  assert.match(prompt,/rebuild the composition and storytelling/);
  assert.match(prompt,/supplies an actual background reference through its background control/);
  assert.match(prompt,/Ordinary category-relevant props are allowed/);
  assert.match(prompt,/photographic elements hyperrealistic/);
  assert.match(prompt,/Preserve any explicitly requested illustration, cartoon, anime, 3D or graphic medium/);
});

const withReferences = { ...feature, fields: [
  { id: "broll-product", label: "Foto Produk", type: "file" },
  { id: "broll-model", label: "Foto Model", type: "file" },
  { id: "broll-background", label: "Background Custom", type: "file" },
  { id: "theme", label: "Tema Foto", type: "choice" },
] };
const photo = fieldId => ({ data: "fixture-not-sent", mimeType: "image/png", fieldId });

test("a product reference and a Luxury theme do not lock the old product-photo background", () => {
  const prompt = imageVariationDirection(withReferences,input(1,{ images: [photo("broll-product"),photo("broll-model")], options: { ...input().options, theme: "luxury" } }));
  assert.match(prompt,/No background reference supplied/);
  assert.match(prompt,/Discard the old product-photo setting and rebuild a fresh scene/);
  assert.match(prompt,/Luxury describes an aesthetic, not one fixed location/);
  assert.match(prompt,/old kitchen, table, props and room.*are not locked/);
  assert.doesNotMatch(prompt,/Background reference supplied through the background control/);
  assert.doesNotMatch(prompt,/Keep the same chosen setting/);
});

test("a populated background image control preserves that exact scene instead of creating a fresh location", () => {
  const prompt = imageVariationDirection(withReferences,input(1,{ images: [photo("broll-product"),photo("broll-background")] }));
  assert.match(prompt,/Background reference supplied through the background control/);
  assert.match(prompt,/Preserve that exact background's recognizable setting, architecture and scene elements/);
  assert.match(prompt,/Do not replace it with a new location/);
  assert.doesNotMatch(prompt,/No background reference supplied|Discard the old product-photo setting/);
  assert.doesNotMatch(prompt,/Set direction: Build/);
});

test("background role detection follows active file controls, including Indonesian labels, not arbitrary metadata", () => {
  const localized = { ...feature, fields: [{ id: "custom-image", label: "Latar Belakang", type: "file" }] };
  assert.match(imageVariationDirection(localized,input(1,{ images: [photo("custom-image")] })),/Background reference supplied through the background control/);
  assert.match(imageVariationDirection(withReferences,input(1,{ images: [photo("unknown-background")] })),/No background reference supplied/);
  assert.match(imageVariationDirection(withReferences,input(1,{ images: [{ ...photo("broll-background"), role: "mask" }] })),/No background reference supplied/);
  assert.match(imageVariationDirection(withReferences,input(1,{ images: [photo("broll-background")] }),withReferences.fields.filter(field => field.id !== "broll-background")),/No background reference supplied/);
});

test("asking for different composition or camera angles does not accidentally freeze those dimensions", () => {
  const prompt = imageVariationDirection(feature,input(1,{ prompt: "Buat komposisi dan layout berbeda, dengan sudut dan perspektif kreatif yang bervariasi." }));
  assert.match(prompt,/Camera suggestion/);
  assert.match(prompt,/Composition suggestion/);
  assert.doesNotMatch(prompt,/Camera constraint|Composition constraint/);
});

test("image edits, upscale, sequence planning and unrelated tools receive no campaign variations", () => {
  assert.equal(imageVariationDirection({ ...feature, group: "photo-editing" },input()),"");
  assert.equal(imageVariationDirection({ ...feature, capability: "upscale" },input()),"");
  assert.equal(imageVariationDirection({ ...feature, capability: "storyboard" },input()),"");
  assert.equal(imageVariationDirection({ ...feature, capability: "image-sequence" },input()),"");
  assert.equal(imageVariationDirection({ ...feature, group: "branding-design" },input()),"");
  for (const id of ["size-guide","virtual-tryon","before-after","testimonial-generator","feedbranding"]) assert.equal(imageVariationDirection({ ...feature, id },input()),"");
  assert.equal(imageVariationDirection(feature,input(1,{ kind: "text" })),"");
  assert.equal(imageVariationDirection(feature,input(1,{ kind: "audio" })),"");
});

test("malformed batch metadata is ignored instead of leaking arbitrary values into the prompt", () => {
  for (const options of [{},{ ...input().options, batchId: "<injected instruction>" },{ ...input().options, sequenceIndex: 0 },{ ...input().options, sequenceIndex: 5 },{ ...input().options, sequenceTotal: 11 },{ ...input().options, sequenceIndex: 1.5 },{ ...input().options, sequenceTotal: "4" }]) {
    assert.equal(imageVariationDirection(feature,input(1,{ options })),"");
  }
});
