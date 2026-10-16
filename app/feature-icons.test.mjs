import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import { features, featureGroups } from "./feature-data.ts";

const require = createRequire(import.meta.url);
const reactUrl = pathToFileURL(require.resolve("react")).href;
const source = ts.transpileModule(readFileSync(new URL("./feature-icons.tsx",import.meta.url),"utf8"),{
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText.replaceAll('"react"',JSON.stringify(reactUrl));
const { FeatureIcon, featureIconArtwork } = await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
const featureIds = features.flatMap(feature => [feature.id,...(feature.variants?.map(variant => variant.id) || [])]);
const utilityIds = ["settings","history","help","sign-out","favorites","search","light-mode","dark-mode","clear-search","close"].map(id => `utility:${id}`);
const navigationIds = [...featureIds,...featureGroups.map(group => `group:${group.id}`),...utilityIds];

test("every feature, variant, category, and sidebar utility has an explicit multicolor illustration", () => {
  assert.equal(featureIds.length,103);
  assert.equal(new Set(navigationIds).size,navigationIds.length);
  assert.deepEqual(Object.keys(featureIconArtwork).sort(),[...navigationIds].sort());
  for (const id of navigationIds) {
    const artwork = featureIconArtwork[id];
    assert.ok(artwork?.length >= 3,`${id}: missing semantic artwork`);
    const fills = new Set(artwork.map(shape => shape.fill).filter(fill => fill !== "none" && fill !== "#ffffff"));
    assert.ok(fills.size >= 2,`${id}: needs multiple filled colors, not just recolored outlines`);
    assert.ok(artwork.every(shape => typeof shape.d === "string" && shape.d.length && !/NaN|undefined/.test(shape.d)),`${id}: invalid geometry`);
  }
});

test("navigation icons have distinct geometry independent of palette", () => {
  const seen = new Map();
  for (const id of navigationIds) {
    const geometry = JSON.stringify(featureIconArtwork[id].map(({d}) => d));
    assert.equal(seen.has(geometry),false,`${id} repeats the artwork of ${seen.get(geometry)}`);
    seen.set(geometry,id);
  }
});

test("the SVG component stays decorative beside navigation labels and preserves explicit sizing", () => {
  for (const id of navigationIds) {
    const html = renderToStaticMarkup(createElement(FeatureIcon,{ id,size:24 }));
    assert.ok(html.startsWith('<svg '),id);
    assert.ok(html.includes('aria-hidden="true"'),id);
    assert.ok(html.includes('focusable="false"'),id);
    assert.ok(html.includes('viewBox="0 0 32 32"'),id);
    assert.ok(html.includes('width="24" height="24"'),id);
    assert.ok(html.includes(`data-feature-icon="${id}"`),id);
    assert.equal(/<image|<text|<script|currentColor|tabindex/i.test(html),false,id);
  }
});
