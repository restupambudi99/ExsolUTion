import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

function load(relative) {
  const code = ts.transpileModule(readFileSync(new URL(relative, import.meta.url), "utf8"), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(code).toString("base64")}`);
}
const { features } = await load("./feature-data.ts");
const { applicableFields, applicableValues, variantTarget } = await load("./feature-controls.ts");
const all = features.flatMap(feature => [feature, ...(feature.variants || [])]);
const feature = id => all.find(item => item.id === id);
const fields = (id, values = {}) => applicableFields(feature(id), values);
const fieldIds = (id, values = {}) => fields(id, values).map(field => field.id);

test("preserves the complete navigation registry with valid independent controls", () => {
  assert.equal(features.length, 82);
  assert.equal(all.length, 102);
  assert.equal(new Set(all.map(item => item.id)).size, all.length);
  for (const item of all) {
    assert.equal(new Set(item.fields.map(field => field.id)).size, item.fields.length, item.id);
    for (const field of item.fields) {
      if (field.options?.length && field.defaultValue !== "") {
        assert.ok(field.options.some(option => option.value === String(field.defaultValue)), `${item.id}/${field.id}`);
      }
      if (field.role === "ratio") {
        assert.ok(field.options?.every(option => /^(?:\d+:\d+|original|auto)$/.test(option.value)), `${item.id}/${field.id} is an aspect ratio`);
      }
    }
    const active = applicableFields(item);
    assert.ok(active.filter(field => field.role === "ratio").length <= 1, `${item.id} has one active ratio`);
    assert.ok(active.filter(field => field.role === "count").length <= 1, `${item.id} has one active count`);
  }
});

test("before-after text mode works without a photo and excludes stale upload/product controls", () => {
  const values = { "before-after-input-mode": "text", "ba-text-prompt": "An empty room becomes a furnished room", "ba-transform-prompt": "stale upload brief", "beforeafter-aspect-selection": "1:1", "ba-ratio-options": "9:16" };
  const active = fields("before-after", values);
  assert.equal(active.some(field => field.type === "file"), false);
  assert.deepEqual(active.filter(field => field.role === "ratio").map(field => field.id), ["ba-ratio-options"]);
  assert.equal(active.find(field => field.id === "ba-text-prompt").required, true);
  const options = applicableValues(feature("before-after"), values);
  assert.equal(options["ba-ratio-options"], "9:16");
  assert.equal(options["beforeafter-aspect-selection"], undefined);
  assert.equal(options["ba-transform-prompt"], undefined);
});

test("before-after upload and product modes require their own photo and generate one result", () => {
  const upload = fields("before-after");
  assert.deepEqual(upload.filter(field => field.type === "file" && field.required).map(field => field.id), ["ba-before-upload"]);
  assert.equal(upload.some(field => field.role === "count"), false);
  const product = fields("before-after", { "before-after-input-mode": "product" });
  assert.deepEqual(product.filter(field => field.type === "file" && field.required).map(field => field.id), ["beforeafter-image-upload"]);
  assert.deepEqual(product.filter(field => field.role === "ratio").map(field => field.id), ["beforeafter-aspect-selection"]);
  assert.equal(product.some(field => field.id === "ba-transform-prompt"), false);
});

test("profession portrait and composite choices cannot override each other's age, ratio, or count", () => {
  assert.ok(fieldIds("profesi-anak").includes("profesi-age-select"));
  assert.equal(fieldIds("profesi-anak").includes("profesi-comp-age"), false);
  const values = { "profesi-mode": "composite", "profesi-count-selection-grid": "10", "profesi-comp-count-grid": "3" };
  const active = fields("profesi-anak", values);
  assert.deepEqual(active.filter(field => field.role === "ratio").map(field => field.id), ["profesi-comp-ratio-options"]);
  assert.deepEqual(active.filter(field => field.role === "count").map(field => field.id), ["profesi-comp-count-grid"]);
  const options = applicableValues(feature("profesi-anak"), values);
  assert.equal(options["profesi-comp-count-grid"], "3");
  assert.equal(options["profesi-count-selection-grid"], undefined);
  assert.equal(options["profesi-age-select"], undefined);
});

test("interior and exterior house modes expose only their own references and ratio", () => {
  const interior = fields("desain-rumah");
  assert.deepEqual(interior.filter(field => field.role === "ratio").map(field => field.id), ["dr-interior-ratio-options"]);
  assert.equal(interior.some(field => field.id.startsWith("dr-eksterior-")), false);
  const exterior = fields("desain-rumah", { "dr-mode": "eksterior" });
  assert.deepEqual(exterior.filter(field => field.role === "ratio").map(field => field.id), ["dr-eksterior-ratio-options"]);
  assert.equal(exterior.some(field => field.id.startsWith("dr-interior-")), false);
  assert.equal(exterior.find(field => field.id === "dr-eksterior-instruction-input").role, "prompt");
});

test("birthday memories require adult and childhood photos without an unrelated party upload", () => {
  const values = { "birthday-mode-options": "kenangan", "birthday-theme-options": "rainbow-party" };
  const memory = fields("birthday-photo", values);
  assert.deepEqual(memory.filter(field => field.type === "file" && field.required).map(field => field.id), ["birthday-upload-now", "birthday-upload-childhood"]);
  assert.equal(memory.some(field => field.id === "birthday-photo-upload"), false);
  assert.equal(memory.some(field => field.id === "birthday-decoration-options"), false);
  assert.equal(applicableValues(feature("birthday-photo"), values)["birthday-theme-options"], "memory-projection");
  const party = fields("birthday-photo");
  assert.deepEqual(party.filter(field => field.type === "file" && field.required).map(field => field.id), ["birthday-photo-upload"]);
  assert.equal(party.some(field => field.id === "birthday-mood-options"), false);
});

test("source navigation controls resolve a real variant and are excluded from generation options", () => {
  const item = feature("affiliate");
  assert.equal(variantTarget(item, "affiliate-choice-1", "affiliate-islami"), "affiliate-islami");
  assert.equal(variantTarget(item, "affiliate-choice-1", "https://outside.invalid"), undefined);
  assert.equal(applicableFields(item).some(field => field.label === "Mode studio"), false);
  assert.equal(applicableValues(item, { "affiliate-choice-1": "affiliate-islami", sequenceIndex: 2, sequenceTotal: 4 }).sequenceIndex, 2);
  assert.equal(applicableValues(item, { "affiliate-choice-1": "affiliate-islami" })["affiliate-choice-1"], undefined);
});

test("advertised frame counts fit the implemented ten-frame limit", () => {
  for (const id of ["story-board", "video-analyzer"]) {
    const count = fields(id).find(field => field.role === "count");
    assert.ok(count.options.every(option => Number(option.value) <= 10));
    assert.ok(count.options.some(option => option.value === "10"));
  }
  assert.equal(feature("voice-over").fields.find(field => field.id === "voice-over-choice-1").role, undefined);
  assert.equal(feature("birthday-photo").fields.find(field => field.id === "birthday-decoration-options").role, undefined);
});

test("Eid greeting cards can be created without their optional family photo", () => {
  const photos = fields("kartu-lebaran").filter(field => field.type === "file");
  assert.equal(photos.length, 1);
  assert.equal(photos[0].id, "lebaran-photo-upload");
  assert.equal(photos[0].required, false);
  for (const item of all) {
    assert.equal(item.fields.some(field => field.required && /opsional|optional/i.test(field.label)), false, item.id);
  }
});

test("reference comparisons require both compared images", () => {
  assert.deepEqual(fields("style-matcher").filter(field => field.type === "file" && field.required).map(field => field.id), ["sm-your-photo", "sm-ref-photo"]);
  assert.deepEqual(fields("ab-testing").filter(field => field.type === "file" && field.required).map(field => field.id), ["abtest-variant-a", "abtest-variant-b"]);
});

test("background reference uploads are required only when the selected replacement uses them", () => {
  assert.equal(fieldIds("bg-remover").includes("bgremover-refbg-input"), false);
  assert.equal(fieldIds("bg-remover").includes("bgremover-custom-input"), false);
  const reference = fields("bg-remover", { "bgremover-bg-options": "reference-bg" });
  assert.deepEqual(reference.filter(field => field.type === "file" && field.required).map(field => field.id), ["bgremover-input", "bgremover-refbg-input"]);
  const custom = fields("bg-remover", { "bgremover-bg-options": "custom" });
  assert.equal(custom.some(field => field.id === "bgremover-custom-input"), true);
  assert.equal(custom.some(field => field.id === "bgremover-refbg-input"), false);
  assert.equal(applicableValues(feature("bg-remover"), { "bgremover-bg-options": "white", "bgremover-custom-input": "stale garden" })["bgremover-custom-input"], undefined);
});

test("source variation counts override neither the user's choice nor a duplicate generic count", () => {
  for (const [id, sourceId, genericId, selected] of [
    ["object-remover", "object-remover-choice-2", "object-remover-result-count", "3"],
    ["poster-generator", "poster-generator-choice-4", "poster-generator-result-count", "9"],
  ]) {
    const values = { [sourceId]: selected, [genericId]: "4" };
    assert.deepEqual(fields(id, values).filter(field => field.role === "count").map(field => field.id), [sourceId]);
    assert.equal(applicableValues(feature(id), values)[sourceId], selected);
    assert.equal(applicableValues(feature(id), values)[genericId], undefined);
  }
});

test("upload format claims match the PNG, JPEG, and WebP image pipeline", () => {
  for (const item of all) {
    for (const field of item.fields.filter(field => field.type === "file" && field.role !== "video")) {
      assert.doesNotMatch(`${field.label} ${field.help || ""}`, /\bHEI[CF]\b/i, `${item.id}/${field.id} advertises an unsupported format`);
      if (field.accept) assert.ok(field.accept.split(",").every(mime => ["image/png", "image/jpeg", "image/webp"].includes(mime)), `${item.id}/${field.id} accepts an unsupported image type`);
    }
  }
});

test("upscale describes the browser interpolation actually used by this tool", () => {
  const item = feature("upscale");
  const limitations = item.limitations.join(" ");
  assert.match(limitations, /browser.*interpolasi/i);
  assert.match(limitations, /bukan AI ESRGAN/);
  assert.match(limitations, /8192 px.*32 megapiksel/);
  assert.doesNotMatch(limitations, /hasil AI meningkatkan detail/i);
});
