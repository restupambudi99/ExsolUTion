import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import ts from "typescript";

const sqlite = new DatabaseSync(":memory:");
const journal = JSON.parse(readFileSync(new URL("../drizzle/meta/_journal.json", import.meta.url), "utf8"));
for (const migration of journal.entries) sqlite.exec(readFileSync(new URL(`../drizzle/${migration.tag}.sql`, import.meta.url), "utf8"));
const objects = new Map();
const database = {
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
};
const bucket = {
  async put(key, bytes) { objects.set(key, new Uint8Array(bytes)); },
  async delete(keys) { for (const key of typeof keys === "string" ? [keys] : keys) objects.delete(key); },
};
globalThis.__studioStorageTest = { database, bucket };
const moduleUrl = source => `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
function load(path, replacements = []) {
  let source = ts.transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
  for (const [from, to] of replacements) source = source.replaceAll(JSON.stringify(from), JSON.stringify(to));
  return moduleUrl(source);
}
const api = moduleUrl(`
  export const database = () => globalThis.__studioStorageTest.database;
  export const bucket = () => globalThis.__studioStorageTest.bucket;
  export async function authenticatedUser() { return { userId: "alice" }; }
  export class ApiError extends Error { constructor(status, code, message) { super(message); this.status=status; this.code=code; } }
  export const json = (value, status=200) => Response.json(value, {status});
  export const errorResponse = error => Response.json({error:error.message, code:error.code}, {status:error.status || 500});
`);
const angles = load("./studio-angle-generator.ts");
const storage = await import(load("./studio-storage.ts", [["./studio-api", api], ["./studio-angle-generator", angles], ["@/lib/studio-angle-generator", angles]]));
const cleanup = load("./studio-file-cleanup.ts", [["./studio-api", api]]);
const history = await import(load("../app/api/history/route.ts", [["@/lib/studio-api", api], ["@/lib/studio-file-cleanup", cleanup]]));
const requests = await import(load("./studio-generation-requests.ts", [["./studio-api", api]]));
const input = () => ({ featureId: "angle-generator", kind: "image", prompt: "Synthetic camera test", images: [], options: { "angle-ids": "back,front", "angle-ratio": "16:9", "angle-expression": "", sequenceIndex: 2, sequenceTotal: 2 } });
const output = () => [{ kind: "image", bytes: new Uint8Array([137, 80, 78, 71]), mimeType: "image/png", warnings: ["Synthetic warning"] }];

test.beforeEach(() => { sqlite.exec("DELETE FROM studio_files; DELETE FROM generations; DELETE FROM studio_generation_requests; DELETE FROM studio_file_cleanup;"); objects.clear(); });
test.after(() => { sqlite.close(); delete globalThis.__studioStorageTest; });

test("angle identity and export ratio survive persistence and history, independent of current form values", async () => {
  const selected = input();
  const saved = await storage.persistGeneration("alice", selected, output());
  assert.equal(saved.results[0].angleId, "back");
  assert.equal(saved.results[0].angleRatio, "16:9");
  selected.options["angle-ids"] = "front";
  selected.options["angle-ratio"] = "9:16";
  const response = await history.GET(new Request("https://studio.example.invalid/api/history"));
  assert.equal(response.status, 200);
  const [item] = (await response.json()).items;
  assert.equal(item.results[0].angleId, "back");
  assert.equal(item.results[0].angleRatio, "16:9");
  assert.equal(item.options.sequenceIndex, 2);
  assert.equal(item.options["angle-ratio"], "16:9");
  assert.deepEqual(item.results[0].warnings, ["Synthetic warning"]);
});

test("an interrupted final receipt recovers the saved angle metadata and repairs the ledger", async () => {
  const requestId = crypto.randomUUID();
  const receipt = await requests.claimGenerationRequest("alice", requestId, "synthetic-fingerprint");
  await storage.persistGeneration("alice", input(), output(), receipt.row.generation_id);
  const recovered = await requests.generationRequestState(receipt.row);
  assert.equal(recovered.status, "completed");
  assert.equal(recovered.data.requestId, requestId);
  assert.equal(recovered.data.results[0].angleId, "back");
  assert.equal(recovered.data.results[0].angleRatio, "16:9");
  const repaired = await requests.ownedGenerationRequest("alice", requestId);
  assert.equal(repaired.status, "completed");
  assert.equal(JSON.parse(repaired.response_json).results[0].angleId, "back");
  assert.equal(objects.size, 1);
});

test("ordinary image tools do not acquire angle metadata", async () => {
  const selected = { ...input(), featureId: "affiliate" };
  const saved = await storage.persistGeneration("alice", selected, output());
  assert.equal(Object.hasOwn(saved.results[0], "angleId"), false);
  assert.equal(Object.hasOwn(saved.results[0], "angleRatio"), false);
});
