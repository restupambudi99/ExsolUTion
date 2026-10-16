import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const moduleUrl = path => `data:text/javascript;base64,${Buffer.from(ts.transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText).toString("base64")}`;
const downloadUrl = moduleUrl("../../lib/studio-download.ts");
const code = ts.transpileModule(readFileSync(new URL("./angle-image-export.ts", import.meta.url), "utf8"), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText.replace('"@/lib/studio-download"', JSON.stringify(downloadUrl));
const { exportAngleImage } = await import(`data:text/javascript;base64,${Buffer.from(code).toString("base64")}`);

function browserFixture() {
  const saved = Object.fromEntries(["fetch", "Image", "document", "window"].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const draws = [], links = [], conversions = [], requests = [];
  const context = { fillRect() {}, drawImage(...args) { draws.push(args.slice(1)); } };
  const canvas = { width: 0, height: 0, getContext: () => context, toBlob(callback, type) { conversions.push({ width: this.width, height: this.height, type }); callback(new Blob(["fixture encoded image"], { type })); } };
  globalThis.fetch = async (...args) => { requests.push(args); return new Response(new Blob(["fixture input image"], { type: "image/png" })); };
  globalThis.Image = class { naturalWidth = 1600; naturalHeight = 900; set src(_value) { queueMicrotask(() => this.onload()); } };
  globalThis.document = { body: { appendChild() {} }, createElement(type) { return type === "canvas" ? canvas : { remove() {}, click() { links.push({ download: this.download, href: this.href }); } }; } };
  globalThis.window = { setTimeout(callback) { callback(); } };
  return { draws, links, conversions, requests, restore() { for (const [key, descriptor] of Object.entries(saved)) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]; } } };
}

test("PNG and JPG exports use their actual encoding and requested portrait size without stretching", async () => {
  const fixture = browserFixture();
  try {
    for (const format of ["png", "jpeg"]) await exportAngleImage("/api/files/camera-file", "profile", "9:16", format);
    assert.deepEqual(fixture.conversions, [{ width: 1080, height: 1920, type: "image/png" }, { width: 1080, height: 1920, type: "image/jpeg" }]);
    assert.deepEqual(fixture.links.map(link => link.download), ["ExsolUTion-angle-profile.png", "ExsolUTion-angle-profile.jpg"]);
    for (const [, , width, height] of fixture.draws) assert.equal(width / height, 1600 / 900);
    assert.ok(fixture.requests.every(([url, init]) => url === "/api/files/camera-file" && init.credentials === "same-origin"));
  } finally { fixture.restore(); }
});

test("export rejects third-party URLs and cannot download an HTML sign-in response", async () => {
  const fixture = browserFixture();
  try {
    await assert.rejects(exportAngleImage("https://example.com/private.png", "front", "1:1", "png"), /File gambar tidak tersedia/);
    assert.equal(fixture.requests.length, 0);
    globalThis.fetch = async () => new Response("Sign in", { status: 401 });
    await assert.rejects(exportAngleImage("/api/files/camera-file", "front", "1:1", "png"), /Sesi berakhir/);
    globalThis.fetch = async () => new Response("<html>Sign in</html>", { headers: { "content-type": "text/html" } });
    await assert.rejects(exportAngleImage("/api/files/camera-file", "front", "1:1", "png"), /tidak dapat diekspor/);
    assert.equal(fixture.links.length, 0);
  } finally { fixture.restore(); }
});
