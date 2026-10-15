import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import ts from "typescript";

const moduleUrl = (source) => `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
function load(path, replacements = []) {
  let source = ts.transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
  for (const [from, to] of replacements) source = source.replaceAll(JSON.stringify(from), JSON.stringify(to));
  return moduleUrl(source);
}
const api = moduleUrl(`export class ApiError extends Error { constructor(status, code, message) { super(message); this.status = status; this.code = code; } } export function database() { throw new Error("No configured database"); }`);
const catalog = load("../app/feature-data.ts");
const settings = await import(load("./studio-prompt-settings.ts", [["../app/feature-data", catalog], ["./studio-api", api]]));
const { features } = await import(catalog);
const flatten = (items) => items.flatMap((item) => [item, ...flatten(item.variants ?? [])]);
const allFeatures = flatten(features);
const aiFeature = allFeatures.find((feature) => feature.id === "affiliate");
assert.ok(aiFeature);

function fixture(migrate = true) {
  const sqlite = new DatabaseSync(":memory:");
  if (migrate) {
    const journal = JSON.parse(readFileSync(new URL("../drizzle/meta/_journal.json", import.meta.url), "utf8"));
    for (const migration of journal.entries) sqlite.exec(readFileSync(new URL(`../drizzle/${migration.tag}.sql`, import.meta.url), "utf8"));
  }
  const db = {
    prepare(sql) {
      const statement = sqlite.prepare(sql);
      let values = [];
      return {
        bind(...parameters) { values = parameters; return this; },
        async first() { return statement.get(...values) ?? null; },
        async all() { return { results: statement.all(...values), success: true }; },
        execute() {
          if (/RETURNING/.test(sql) || /^SELECT/i.test(sql.trim())) return { results: statement.all(...values), success: true };
          return { results: [], success: true, meta: statement.run(...values) };
        },
      };
    },
    async batch(statements) {
      sqlite.exec("BEGIN");
      try {
        const result = statements.map((statement) => statement.execute());
        sqlite.exec("COMMIT");
        return result;
      } catch (error) { sqlite.exec("ROLLBACK"); throw error; }
    },
  };
  return { sqlite, db, close: () => sqlite.close() };
}
const update = (patch = {}) => ({ featureId: aiFeature.id, additionalInstructions: "Gunakan komposisi editorial kreatif.", expectedRevision: 0, reason: "Perbaiki keragaman komposisi", ...patch });
const hasError = (status, code) => (error) => error.status === status && error.code === code;

test("empty persisted settings return immutable catalog intent and revision zero", async () => {
  const f = fixture();
  try {
    assert.deepEqual(await settings.getFeaturePromptSettings(aiFeature.id, f.db), { featureId: aiFeature.id, basePrompt: aiFeature.promptIntent, additionalInstructions: "", revision: 0, updatedAt: null });
    assert.deepEqual(await settings.listPromptChanges(undefined, f.db), []);
  } finally { f.close(); }
});

test("unknown or unsupported tools cannot acquire configuration rows", async () => {
  const f = fixture();
  try {
    await assert.rejects(settings.getFeaturePromptSettings("does-not-exist", f.db), hasError(404, "unknown_feature"));
    for (const kind of ["local", "store", "video", "audio"]) {
      const feature = allFeatures.find((item) => item.kind === kind);
      assert.ok(feature, `catalog contains ${kind}`);
      await assert.rejects(settings.updateFeaturePromptSettings(update({ featureId: feature.id }), "owner", f.db), hasError(400, "unsupported_prompt_feature"));
    }
    assert.equal(f.sqlite.prepare("SELECT count(*) AS n FROM studio_prompt_settings").get().n, 0);
  } finally { f.close(); }
});

test("audio tools explicitly reject prompt reads and edits until adapters apply studio directions", async () => {
  const f = fixture();
  try {
    const audio = allFeatures.find((item) => item.kind === "audio");
    assert.ok(audio);
    await assert.rejects(settings.getFeaturePromptSettings(audio.id, f.db), hasError(400, "unsupported_prompt_feature"));
    await assert.rejects(settings.updateFeaturePromptSettings(update({ featureId: audio.id }), "owner", f.db), hasError(400, "unsupported_prompt_feature"));
    assert.equal(f.sqlite.prepare("SELECT count(*) AS n FROM studio_prompt_settings").get().n, 0);
  } finally { f.close(); }
});

test("nested AI modes are resolved from the actual registry", () => {
  const nested = features.flatMap((item) => flatten(item.variants ?? [])).find((item) => ["image", "text", "chat"].includes(item.kind));
  assert.ok(nested);
  assert.equal(settings.promptSettingsFeature(nested.id).id, nested.id);
});

test("first update persists revision one and recoverable audit without exposing actor identity", async () => {
  const f = fixture();
  try {
    const result = await settings.updateFeaturePromptSettings(update(), "private-owner-account-id", f.db);
    assert.equal(result.revision, 1);
    assert.equal(result.basePrompt, aiFeature.promptIntent);
    assert.equal(result.additionalInstructions, update().additionalInstructions);
    assert.ok(result.updatedAt > 0);
    assert.deepEqual(await settings.getFeaturePromptSettings(aiFeature.id, f.db), result);
    const audit = await settings.listPromptChanges(10, f.db);
    assert.deepEqual(audit, [{ featureId: aiFeature.id, previousRevision: 0, revision: 1, previousInstructions: "", additionalInstructions: update().additionalInstructions, reason: update().reason, createdAt: result.updatedAt }]);
    assert.equal(JSON.stringify(audit).includes("private-owner-account-id"), false);
    assert.equal(f.sqlite.prepare("SELECT actor_id FROM studio_prompt_changes").get().actor_id, "private-owner-account-id");
  } finally { f.close(); }
});

test("reset creates a new revision and keeps immutable base intent", async () => {
  const f = fixture();
  try {
    await settings.updateFeaturePromptSettings(update(), "owner", f.db);
    await settings.updateFeaturePromptSettings(update({ expectedRevision: 1, additionalInstructions: "Sudut baru" }), "owner", f.db);
    const reset = await settings.updateFeaturePromptSettings(update({ expectedRevision: 2, additionalInstructions: "   ", reason: "Kembali ke arahan dasar" }), "owner", f.db);
    assert.equal(reset.revision, 3);
    assert.equal(reset.additionalInstructions, "");
    assert.equal(reset.basePrompt, aiFeature.promptIntent);
    assert.equal((await settings.listPromptChanges(100, f.db)).length, 3);
  } finally { f.close(); }
});

test("audit snapshots restore an earlier value through a new CAS-guarded revision", async () => {
  const f = fixture();
  try {
    const first = await settings.updateFeaturePromptSettings(update(), "owner", f.db);
    const second = await settings.updateFeaturePromptSettings(update({ expectedRevision: 1, additionalInstructions: "Komposisi pengganti" }), "owner", f.db);
    const changes = await settings.listPromptChanges(100, f.db);
    const replacement = changes.find((change) => change.revision === second.revision);
    assert.equal(replacement.previousInstructions, first.additionalInstructions);
    assert.equal(replacement.additionalInstructions, second.additionalInstructions);
    const restored = await settings.updateFeaturePromptSettings(update({ expectedRevision: second.revision, additionalInstructions: replacement.previousInstructions, reason: "Pulihkan instruksi sebelum revisi 2" }), "owner", f.db);
    assert.equal(restored.revision, 3);
    assert.equal(restored.additionalInstructions, first.additionalInstructions);
    const restoreChange = (await settings.listPromptChanges(100, f.db)).find((change) => change.revision === 3);
    assert.equal(restoreChange.previousInstructions, second.additionalInstructions);
    assert.equal(restoreChange.additionalInstructions, first.additionalInstructions);
    assert.equal((await settings.listPromptChanges(100, f.db)).length, 3);
  } finally { f.close(); }
});

test("reset audit retains text that can later be recovered", async () => {
  const f = fixture();
  try {
    const first = await settings.updateFeaturePromptSettings(update(), "owner", f.db);
    await settings.updateFeaturePromptSettings(update({ expectedRevision: 1, additionalInstructions: "", reason: "Reset arahan tambahan" }), "owner", f.db);
    const reset = (await settings.listPromptChanges(100, f.db)).find((change) => change.revision === 2);
    assert.equal(reset.previousInstructions, first.additionalInstructions);
    assert.equal(reset.additionalInstructions, "");
    const recovered = await settings.updateFeaturePromptSettings(update({ expectedRevision: 2, additionalInstructions: reset.previousInstructions, reason: "Pulihkan teks sebelum reset" }), "owner", f.db);
    assert.equal(recovered.additionalInstructions, first.additionalInstructions);
    assert.equal(recovered.revision, 3);
  } finally { f.close(); }
});

test("stale or duplicate first-writer revisions do not change state or create audit entries", async () => {
  const f = fixture();
  try {
    const first = await settings.updateFeaturePromptSettings(update(), "owner", f.db);
    await assert.rejects(settings.updateFeaturePromptSettings(update({ additionalInstructions: "Stale" }), "other-owner", f.db), hasError(409, "prompt_revision_conflict"));
    assert.deepEqual(await settings.getFeaturePromptSettings(aiFeature.id, f.db), first);
    assert.equal((await settings.listPromptChanges(100, f.db)).length, 1);
  } finally { f.close(); }
});

test("nonzero revision cannot create an absent feature setting", async () => {
  const f = fixture();
  try {
    await assert.rejects(settings.updateFeaturePromptSettings(update({ expectedRevision: 5 }), "owner", f.db), hasError(409, "prompt_revision_conflict"));
    assert.equal(f.sqlite.prepare("SELECT count(*) AS n FROM studio_prompt_settings").get().n, 0);
    assert.deepEqual(await settings.listPromptChanges(10, f.db), []);
  } finally { f.close(); }
});

test("concurrent requests with the same expected revision produce one winning change", async () => {
  const f = fixture();
  try {
    const responses = await Promise.allSettled([
      settings.updateFeaturePromptSettings(update(), "owner-A", f.db),
      settings.updateFeaturePromptSettings(update({ additionalInstructions: "Penulis kedua" }), "owner-B", f.db),
    ]);
    assert.equal(responses.filter((result) => result.status === "fulfilled").length, 1);
    assert.equal(responses.find((result) => result.status === "rejected").reason.status, 409);
    assert.equal((await settings.getFeaturePromptSettings(aiFeature.id, f.db)).revision, 1);
    assert.equal((await settings.listPromptChanges(100, f.db)).length, 1);
  } finally { f.close(); }
});

test("audit insertion failure rolls back the configuration update atomically", async () => {
  const f = fixture();
  try {
    const initial = await settings.updateFeaturePromptSettings(update(), "owner", f.db);
    f.sqlite.exec("CREATE TRIGGER fail_audit BEFORE INSERT ON studio_prompt_changes BEGIN SELECT RAISE(ABORT, 'fixture audit failure'); END;");
    await assert.rejects(settings.updateFeaturePromptSettings(update({ expectedRevision: 1, additionalInstructions: "Tidak boleh tersimpan" }), "owner", f.db), hasError(503, "prompt_settings_unavailable"));
    assert.deepEqual(await settings.getFeaturePromptSettings(aiFeature.id, f.db), initial);
    assert.equal((await settings.listPromptChanges(100, f.db)).length, 1);
  } finally { f.close(); }
});

test("missing migrations fail closed instead of silently using base configuration", async () => {
  const f = fixture(false);
  try {
    await assert.rejects(settings.getFeaturePromptSettings(aiFeature.id, f.db), hasError(503, "prompt_settings_unavailable"));
    await assert.rejects(settings.listPromptChanges(10, f.db), hasError(503, "prompt_settings_unavailable"));
    await assert.rejects(settings.updateFeaturePromptSettings(update(), "owner", f.db), hasError(503, "prompt_settings_unavailable"));
  } finally { f.close(); }
});

test("an unconfigured database fails closed with a safe response", async () => {
  await assert.rejects(settings.getFeaturePromptSettings(aiFeature.id), hasError(503, "prompt_settings_unavailable"));
});

test("instructions are additive, preserve base/quality/variation text, and allow multiline content", () => {
  const base = "Catalog intent\nHyperrealistic image quality\nUnique batch camera variation";
  const result = settings.appendFeaturePromptInstructions(base, "  Gunakan pencahayaan alami.\nWarna netral.  ");
  assert.equal(result, `${base}\nAdditional studio directions:\nGunakan pencahayaan alami.\nWarna netral.`);
  assert.equal(settings.appendFeaturePromptInstructions(base, ""), base);
});

test("instruction limits reject oversized or control characters before persistence", () => {
  assert.equal(settings.validateAdditionalInstructions("x".repeat(3000)).length, 3000);
  for (const invalid of [null, {}, "x".repeat(3001), "bad\u0000text", "bad\u0007text", "bad\u007ftext"]) {
    assert.throws(() => settings.validateAdditionalInstructions(invalid), hasError(400, "invalid_prompt_instructions"));
  }
});

test("invalid revision, feature ID or reason cannot start a write", () => {
  for (const expectedRevision of [-1, 0.5, NaN, Infinity, "0", Number.MAX_SAFE_INTEGER]) {
    assert.throws(() => settings.validateFeaturePromptUpdate(update({ expectedRevision })), hasError(400, "invalid_prompt_revision"));
  }
  for (const reason of ["", "   ", "x".repeat(501), "two\nlines", "bad\u0000text", null]) {
    assert.throws(() => settings.validateFeaturePromptUpdate(update({ reason })), hasError(400, "invalid_change_reason"));
  }
  assert.throws(() => settings.promptSettingsFeature("../affiliate"), hasError(400, "invalid_feature"));
});

test("absent or malformed actor cannot write configuration", async () => {
  const f = fixture();
  try {
    for (const actorId of ["", "x".repeat(201), "bad\u0000actor", null]) {
      await assert.rejects(settings.updateFeaturePromptSettings(update(), actorId, f.db), hasError(403, "prompt_actor_required"));
    }
    assert.equal(f.sqlite.prepare("SELECT count(*) AS n FROM studio_prompt_settings").get().n, 0);
  } finally { f.close(); }
});

test("audit limits are bounded rather than accepting arbitrary SQL or unbounded reads", async () => {
  const f = fixture();
  try {
    for (const limit of [0, -1, 101, 1.5, NaN, "30"]) {
      await assert.rejects(settings.listPromptChanges(limit, f.db), hasError(400, "invalid_audit_limit"));
    }
    await settings.updateFeaturePromptSettings(update(), "owner", f.db);
    assert.equal((await settings.listPromptChanges(1, f.db)).length, 1);
  } finally { f.close(); }
});
