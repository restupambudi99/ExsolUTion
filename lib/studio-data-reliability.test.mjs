import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import ts from "typescript";

const sqlite = new DatabaseSync(":memory:");
const journal = JSON.parse(readFileSync(new URL("../drizzle/meta/_journal.json", import.meta.url), "utf8"));
for (const migration of journal.entries) sqlite.exec(readFileSync(new URL(`../drizzle/${migration.tag}.sql`, import.meta.url), "utf8"));
const objects = new Map();
const deletedObjects = [];
const reads = [];
let failBatch = false;
let failBlobDelete = false;
let failCleanupAck = false;
const db = {
  prepare(sql) {
    const statement = sqlite.prepare(sql);
    let values = [];
    return {
      sql,
      bind(...parameters) { values = parameters; return this; },
      async first() { return statement.get(...values) ?? null; },
      async all() { return { results: statement.all(...values), success: true }; },
      async run() { return { success: true, meta: statement.run(...values) }; },
    };
  },
  async batch(statements) {
    if (failBatch || (failCleanupAck && statements.some((statement) => statement.sql.startsWith("DELETE FROM studio_file_cleanup")))) throw new Error("synthetic database failure");
    sqlite.exec("BEGIN");
    try {
      const result = [];
      for (const statement of statements) result.push(await statement.run());
      sqlite.exec("COMMIT");
      return result;
    } catch (error) { sqlite.exec("ROLLBACK"); throw error; }
  },
};
const storage = {
  async delete(keys) {
    if (failBlobDelete) throw new Error("synthetic object store failure");
    for (const key of typeof keys === "string" ? [keys] : keys) { deletedObjects.push(key); objects.delete(key); }
  },
  async get(key, options) {
    reads.push({ key, options });
    const bytes = objects.get(key);
    if (!bytes) return null;
    const range = options?.range;
    return { size: bytes.byteLength, httpEtag: '"synthetic-etag"', body: range ? bytes.subarray(range.offset, range.offset + range.length) : bytes };
  },
  async head(key) { const bytes = objects.get(key); return bytes ? { size: bytes.byteLength, httpEtag: '"synthetic-etag"' } : null; },
};
globalThis.__dataReliabilityTest = { user: null, env: { DB: db, BUCKET: storage } };
const moduleUrl = (source) => `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
function load(path, replacements = []) {
  let source = ts.transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
  for (const [from, to] of replacements) source = source.replaceAll(JSON.stringify(from), JSON.stringify(to));
  return moduleUrl(source);
}
const env = moduleUrl("export const env = globalThis.__dataReliabilityTest.env;");
const auth = moduleUrl("export async function getChatGPTUser(){return globalThis.__dataReliabilityTest.user;}");
const api = load("./studio-api.ts", [["cloudflare:workers", env], ["@/app/chatgpt-auth", auth]]);
const cleanup = load("./studio-file-cleanup.ts", [["./studio-api", api]]);
const angles = load("./studio-angle-generator.ts");
const fileStorage = load("./studio-storage.ts", [["./studio-api", api], ["./studio-angle-generator", angles]]);
const download = load("./studio-download.ts");
const deletion = await import(load("../app/api/history/[id]/route.ts", [["@/lib/studio-api", api], ["@/lib/studio-file-cleanup", cleanup]]));
const history = await import(load("../app/api/history/route.ts", [["@/lib/studio-api", api], ["@/lib/studio-file-cleanup", cleanup]]));
const files = await import(load("../app/api/files/[id]/route.ts", [["@/lib/studio-api", api], ["@/lib/studio-storage", fileStorage], ["@/lib/studio-download", download]]));
const { cleanupDeletedFiles } = await import(cleanup);
const { downloadFilename, serverDownloadUrl } = await import(download);
const context = (id) => ({ params: Promise.resolve({ id }) });
const request = (id, headers = {}, method = "GET") => new Request(`https://studio.example.invalid/api/files/${id}`, { method, headers });
const deleteRequest = () => new Request("https://studio.example.invalid/api/history/generation-1", { method: "DELETE", headers: { Origin: "https://studio.example.invalid" } });

function seed(id = "generation-1", user = "alice", fileId = "file-1") {
  const bytes = Uint8Array.from({ length: 16 }, (_, index) => index);
  const key = `private/${fileId}.mp3`;
  objects.set(key, bytes);
  sqlite.prepare("INSERT INTO generations (id, user_id, feature_id, prompt, options_json, results_json, created_at) VALUES (?, ?, 'audio', 'Synthetic', '{}', '[]', 1)").run(id, user);
  sqlite.prepare("INSERT INTO studio_files (id, user_id, generation_id, object_key, mime_type, byte_size, original_name, created_at) VALUES (?, ?, ?, ?, 'audio/mpeg', ?, 'audio.mp3', 1)").run(fileId, user, id, key, bytes.byteLength);
  return { key, bytes };
}
test.beforeEach(() => {
  failBatch = failBlobDelete = failCleanupAck = false;
  sqlite.exec("DROP TRIGGER IF EXISTS synthetic_delete_failure; DELETE FROM studio_file_cleanup; DELETE FROM studio_files; DELETE FROM generations; DELETE FROM studio_generation_requests;");
  objects.clear(); deletedObjects.length = reads.length = 0;
  globalThis.__dataReliabilityTest.user = { userId: "alice" };
});
test.after(() => { sqlite.close(); delete globalThis.__dataReliabilityTest; });

test("failed metadata transaction keeps history and files intact, without deleting R2", async () => {
  const { key } = seed();
  failBatch = true;
  assert.equal((await deletion.DELETE(deleteRequest(), context("generation-1"))).status, 500);
  assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM generations").get().n, 1);
  assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM studio_files").get().n, 1);
  assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM studio_file_cleanup").get().n, 0);
  assert.equal(objects.has(key), true);
  assert.deepEqual(deletedObjects, []);
});

test("R2 failure removes visible history safely and the next owner history visit retries cleanup", async () => {
  const { key } = seed();
  failBlobDelete = true;
  const response = await deletion.DELETE(deleteRequest(), context("generation-1"));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { deleted: true, id: "generation-1" });
  assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM generations").get().n, 0);
  assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM studio_files").get().n, 0);
  assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM studio_file_cleanup").get().n, 1);
  assert.equal((await files.GET(request("file-1"), context("file-1"))).status, 404);
  assert.equal(objects.has(key), true);
  failBlobDelete = false;
  const listing = await history.GET(new Request("https://studio.example.invalid/api/history"));
  assert.equal(listing.status, 200);
  assert.deepEqual((await listing.json()).items, []);
  assert.equal(objects.has(key), false);
  assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM studio_file_cleanup").get().n, 0);
});

test("a failure midway through the atomic delete rolls back the outbox and visible metadata", async () => {
  const { key } = seed();
  sqlite.exec("CREATE TRIGGER synthetic_delete_failure BEFORE DELETE ON generations BEGIN SELECT RAISE(ABORT, 'synthetic failure after outbox insert'); END");
  assert.equal((await deletion.DELETE(deleteRequest(), context("generation-1"))).status, 500);
  assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM generations").get().n, 1);
  assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM studio_files").get().n, 1);
  assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM studio_file_cleanup").get().n, 0);
  assert.equal(objects.has(key), true);
  assert.deepEqual(deletedObjects, []);
});

test("deletion also redacts the recovery receipt and prevents an old request from regenerating", async () => {
  seed(); seed("generation-2", "bob", "file-2");
  const insert = sqlite.prepare("INSERT INTO studio_generation_requests (user_id, request_id, fingerprint, generation_id, status, response_json, created_at, updated_at) VALUES (?, ?, 'hash', ?, 'completed', ?, 1, 1)");
  insert.run("alice", "request-alice", "generation-1", JSON.stringify({ results: [{ kind: "text", text: "Deleted private result" }], requestId: "request-alice" }));
  insert.run("bob", "request-bob", "generation-2", JSON.stringify({ results: [{ kind: "text", text: "Retained private result" }], requestId: "request-bob" }));
  assert.equal((await deletion.DELETE(deleteRequest(), context("generation-1"))).status, 200);
  const row = sqlite.prepare("SELECT * FROM studio_generation_requests WHERE user_id = 'alice'").get();
  assert.equal(row.status, "failed");
  assert.equal(row.error_status, 410);
  assert.equal(row.generation_id, "generation-1");
  assert.deepEqual(JSON.parse(row.response_json), { results: [], error: "Hasil ini sudah dihapus dari Riwayat Kreasi.", code: "generation_deleted", requestId: "request-alice" });
  const other = sqlite.prepare("SELECT * FROM studio_generation_requests WHERE user_id = 'bob'").get();
  assert.equal(other.status, "completed");
  assert.equal(JSON.parse(other.response_json).results[0].text, "Retained private result");
});

test("cleanup acknowledgement failure remains retryable after the object is already gone", async () => {
  seed(); failCleanupAck = true;
  assert.equal((await deletion.DELETE(deleteRequest(), context("generation-1"))).status, 200);
  assert.equal(objects.size, 0);
  assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM studio_file_cleanup").get().n, 1);
  failCleanupAck = false;
  await cleanupDeletedFiles("alice");
  assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM studio_file_cleanup").get().n, 0);
});

test("deletion and cleanup are owner scoped and each cleanup call is capped at 20 objects", async () => {
  const { key } = seed();
  globalThis.__dataReliabilityTest.user = { userId: "bob" };
  assert.equal((await deletion.DELETE(deleteRequest(), context("generation-1"))).status, 404);
  assert.equal(objects.has(key), true);
  for (let index = 0; index < 25; index++) {
    const objectKey = `private/pending-${index}`;
    objects.set(objectKey, new Uint8Array([1]));
    sqlite.prepare("INSERT INTO studio_file_cleanup (id,user_id,object_key,created_at) VALUES (?,?,?,?)").run(`pending-${index}`, "alice", objectKey, index);
  }
  await cleanupDeletedFiles("bob");
  assert.equal(deletedObjects.length, 0);
  await cleanupDeletedFiles("alice");
  assert.equal(deletedObjects.length, 20);
  assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM studio_file_cleanup").get().n, 5);
});

test("audio byte ranges return correct partial bytes, length and cache/security headers", async () => {
  seed();
  for (const [range, start, end] of [["bytes=0-3", 0, 3], ["bytes=12-", 12, 15], ["bytes=-3", 13, 15], ["bytes=14-200", 14, 15]]) {
    const response = await files.GET(request("file-1", { Range: range }), context("file-1"));
    assert.equal(response.status, 206);
    assert.equal(response.headers.get("Content-Range"), `bytes ${start}-${end}/16`);
    assert.equal(response.headers.get("Content-Length"), String(end - start + 1));
    assert.equal(response.headers.get("Accept-Ranges"), "bytes");
    assert.equal(response.headers.get("Cache-Control"), "private, no-store");
    assert.equal(response.headers.get("Cross-Origin-Resource-Policy"), "same-origin");
    assert.deepEqual([...new Uint8Array(await response.arrayBuffer())], Array.from({ length: end - start + 1 }, (_, index) => start + index));
  }
});

test("unsatisfiable audio ranges return 416 without downloading an object", async () => {
  seed();
  for (const range of ["bytes=16-", "bytes=-0", "bytes=10-2"]) {
    const response = await files.GET(request("file-1", { Range: range }), context("file-1"));
    assert.equal(response.status, 416);
    assert.equal(response.headers.get("Content-Range"), "bytes */16");
    assert.equal(await response.text(), "");
  }
  assert.equal(reads.length, 0);
});

test("HEAD, unhandled range units, multiple ranges and If-Range return complete metadata safely", async () => {
  seed();
  const head = await files.HEAD(request("file-1", {}, "HEAD"), context("file-1"));
  assert.equal(head.status, 200);
  assert.equal(head.headers.get("Content-Length"), "16");
  assert.equal(await head.text(), "");
  assert.equal(reads.length, 0);
  for (const headers of [{ Range: "items=1-2" }, { Range: "bytes=0-2,4-6" }, { Range: "bytes=0-3", "If-Range": '"old-etag"' }]) {
    const response = await files.GET(request("file-1", headers), context("file-1"));
    assert.equal(response.status, 200);
    assert.equal((await response.arrayBuffer()).byteLength, 16);
  }
});

test("range requests never bypass ownership or authentication", async () => {
  seed();
  globalThis.__dataReliabilityTest.user = { userId: "bob" };
  assert.equal((await files.GET(request("file-1", { Range: "bytes=0-3" }), context("file-1"))).status, 404);
  globalThis.__dataReliabilityTest.user = null;
  assert.equal((await files.GET(request("file-1", { Range: "bytes=0-3" }), context("file-1"))).status, 401);
  assert.equal(reads.length, 0);
});

test("image downloads stream the exact owned file with attachment headers and a MIME-correct filename", async () => {
  const { key } = seed();
  const png = Uint8Array.from(Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2oQAAAABJRU5ErkJggg==", "base64"));
  objects.set(key, png);
  sqlite.prepare("UPDATE studio_files SET mime_type = 'image/png', byte_size = ?, original_name = ? WHERE id = 'file-1'").run(png.byteLength, 'foto \"hasil\".jpeg');
  const response = await files.GET(request("file-1?download=1"), context("file-1"));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Content-Disposition"), 'attachment; filename="ExsolUTion-file-1.png"; filename*=UTF-8\'\'ExsolUTion-file-1.png');
  assert.equal(response.headers.get("Content-Type"), "image/png");
  assert.equal(response.headers.get("Content-Length"), String(png.byteLength));
  assert.equal(response.headers.get("Cache-Control"), "private, no-store");
  assert.equal(response.headers.get("X-Content-Type-Options"), "nosniff");
  assert.equal(response.headers.get("Cross-Origin-Resource-Policy"), "same-origin");
  assert.deepEqual(new Uint8Array(await response.arrayBuffer()), png);
});

test("download HEAD returns attachment metadata without reading file bytes; previews remain inline", async () => {
  seed();
  const head = await files.HEAD(request("file-1?download=1", { Range: "bytes=0-3" }, "HEAD"), context("file-1"));
  assert.equal(head.status, 200);
  assert.equal(head.headers.get("Content-Disposition"), 'attachment; filename="ExsolUTion-file-1.mp3"; filename*=UTF-8\'\'ExsolUTion-file-1.mp3');
  assert.equal(head.headers.get("Content-Length"), "16");
  assert.equal(head.headers.get("Content-Type"), "audio/mpeg");
  assert.equal(await head.text(), "");
  assert.equal(reads.length, 0);
  for (const id of ["file-1", "file-1?download=0", "file-1?download=true"]) {
    const preview = await files.GET(request(id), context("file-1"));
    assert.equal(preview.status, 200);
    assert.equal(preview.headers.get("Content-Disposition"), "inline; filename*=UTF-8''audio.mp3");
  }
});

test("downloads preserve byte ranges and never bypass ownership or authentication", async () => {
  const { bytes } = seed();
  const response = await files.GET(request("file-1?download=1", { Range: "bytes=3-7" }), context("file-1"));
  assert.equal(response.status, 206);
  assert.equal(response.headers.get("Content-Range"), "bytes 3-7/16");
  assert.equal(response.headers.get("Content-Length"), "5");
  assert.match(response.headers.get("Content-Disposition"), /^attachment;/);
  assert.deepEqual(new Uint8Array(await response.arrayBuffer()), bytes.subarray(3, 8));
  const readsBeforeDenied = reads.length;
  for (const [user, status] of [[{ userId: "bob" }, 404], [null, 401]]) {
    globalThis.__dataReliabilityTest.user = user;
    for (const method of ["GET", "HEAD"]) {
      const denied = await files[method](request("file-1?download=1", {}, method), context("file-1"));
      assert.equal(denied.status, status);
      assert.equal(denied.headers.get("Content-Disposition"), null);
    }
  }
  assert.equal(reads.length, readsBeforeDenied);
});

test("download helpers only create safe same-origin owned-file links and MIME-based filenames", () => {
  assert.equal(serverDownloadUrl("/api/files/file-1"), "/api/files/file-1?download=1");
  assert.equal(serverDownloadUrl("/api/files/file-1?download=0#preview"), "/api/files/file-1?download=1");
  for (const value of [undefined, "", "https://external.example/api/files/file-1", "//external.example/api/files/file-1", "data:image/png;base64,AAAA", "blob:local", "/api/files/../secret", "/api/files/file%2Fsecret", "/api/files/file-1/extra"]) assert.equal(serverDownloadUrl(value), null);
  for (const [mime, extension] of [["image/png", "png"], ["image/jpeg", "jpg"], ["image/webp", "webp"], ["audio/mpeg", "mp3"], ["audio/wav", "wav"], ["audio/ogg", "ogg"], ["audio/mp4", "m4a"], ["text/plain;charset=utf-8", "txt"], ["unknown/type", "bin"]]) assert.equal(downloadFilename("file-1", mime), `ExsolUTion-file-1.${extension}`);
  assert.equal(downloadFilename('id/\r\n\".png', "image/jpeg"), "ExsolUTion-id_____png.jpg");
});
