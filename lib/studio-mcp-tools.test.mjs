import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const moduleUrl = source => `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
function load(path,replacements = []) {
  let source = ts.transpileModule(readFileSync(new URL(path,import.meta.url),"utf8"),{ compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
  for (const [from,to] of replacements) source = source.replaceAll(JSON.stringify(from),JSON.stringify(to));
  return moduleUrl(source);
}
const catalog = load("../app/feature-data.ts");
const info = load("./studio-mcp-info.ts");
const tools = await import(load("./studio-mcp-tools.ts",[["../app/feature-data",catalog],["./studio-mcp-info",info]]));
const { isStudioAdministrator } = await import(load("./studio-admin.ts"));
const { generationFingerprint } = await import(load("./studio-generation-requests.ts",[["./studio-api",moduleUrl("export class ApiError extends Error {} export function database(){throw new Error('Unexpected DB access');}")]]));
const owner = { userId: "verified-owner", isAdministrator: true };
const viewer = { userId: "verified-viewer", isAdministrator: false };

function fixture() {
  const calls = [];
  let settings = { featureId: "affiliate", basePrompt: "Base product photography", additionalInstructions: "", revision: 0, updatedAt: null };
  return { calls, services: {
    async getPrompt(id) { calls.push(["get",id]); return { ...settings, featureId: id }; },
    async updatePrompt(input,actor) { calls.push(["update",input,actor]); settings = { ...settings, additionalInstructions: input.additionalInstructions, revision: settings.revision+1 }; return settings; },
    async changes(limit) { calls.push(["changes",limit]); return []; },
    async providerStatus() { return { "9router": { configured: true, credentialState: "saved", savedCredential: true, imageModel: "image/test", apiKey: "private-key-fixture", encryptedKey: "ciphertext-fixture", baseUrl: "https://private-provider.example", allowedHttpOrigins: ["http://private-origin.example"] } }; },
  } };
}

test("administrator is bound to exact verified ID, fails closed, and ignores email-like mismatches",() => {
  assert.equal(isStudioAdministrator("verified-owner",{}),false);
  assert.equal(isStudioAdministrator(null,{STUDIO_ADMIN_USER_IDS:"verified-owner"}),false);
  assert.equal(isStudioAdministrator("verified-owner",{STUDIO_ADMIN_USER_IDS:" verified-owner, other-owner "}),true);
  assert.equal(isStudioAdministrator("owner",{STUDIO_ADMIN_USER_IDS:"verified-owner"}),false);
  assert.equal(isStudioAdministrator("owner@example.com",{STUDIO_ADMIN_USER_IDS:"verified-owner"}),false);
});

test("discovery has explicit schemas and mutation annotations without data or credentials",() => {
  assert.equal(tools.mcpToolDefinitions.length,9);
  assert.equal(new Set(tools.mcpToolDefinitions.map(item=>item.name)).size,9);
  for (const item of tools.mcpToolDefinitions) {
    assert.equal(item.inputSchema.additionalProperties,false);
    assert.equal(item.annotations.readOnlyHint,item.name!=="update_feature_prompt");
    assert.equal(item.annotations.openWorldHint,false);
    assert.equal(JSON.stringify(item).includes("private-key-fixture"),false);
  }
});

test("unauthenticated and non-admin callers cannot change global prompt or read its audit",async() => {
  const { services,calls } = fixture();
  for (const name of ["update_feature_prompt","list_prompt_changes"]) {
    await assert.rejects(tools.runStudioMcpTool(name,{},viewer,services),error=>error.code==="administrator_required");
  }
  await assert.rejects(tools.runStudioMcpTool("get_site_summary",{}, {userId:"",isAdministrator:true},services),error=>error.code==="authentication_required");
  assert.deepEqual(calls,[]);
});

test("tool arguments cannot impersonate an owner or supply credentials",async() => {
  const { services,calls } = fixture();
  for (const args of [{userId:"verified-owner"},{isAdministrator:true},{apiKey:"private-key-fixture"}]) {
    await assert.rejects(tools.runStudioMcpTool("get_site_summary",args,viewer,services),error=>error.code==="invalid_input");
  }
  assert.deepEqual(calls,[]);
});

test("AI status returns caller's configuration projection without key or infrastructure",async() => {
  const { services } = fixture();
  const data = await tools.runStudioMcpTool("get_ai_connection_status",{},viewer,services);
  assert.deepEqual(data.providers["9router"],{configured:true,savedCredential:true,credentialState:"saved",imageModel:"image/test"});
  assert.equal(data.testedLive,false);
  for (const sensitive of ["private-key-fixture","ciphertext-fixture","private-provider.example","private-origin.example"]) assert.equal(JSON.stringify(data).includes(sensitive),false);
});

test("catalog search returns exact feature IDs and declares editable capabilities honestly",async() => {
  const { services } = fixture();
  const list = await tools.runStudioMcpTool("list_features",{search:"affiliate"},viewer,services);
  assert.ok(list.features.some(item=>item.id==="affiliate"));
  const audio = await tools.runStudioMcpTool("list_features",{kind:"audio"},viewer,services);
  assert.ok(audio.features.length>0);
  assert.ok(audio.features.every(item=>item.promptEditable===false));
  const details = await tools.runStudioMcpTool("get_feature_details",{featureId:"affiliate"},viewer,services);
  assert.ok(details.fields.length>0);
  assert.equal(details.promptEditable,true);
});

test("preview and reads do not save settings or call AI providers",async() => {
  const { services,calls } = fixture();
  const preview = await tools.runStudioMcpTool("preview_feature_prompt",{featureId:"affiliate",additionalInstructions:"  Natural imperfect styling  "},owner,services);
  assert.equal(preview.effectiveFeatureIntent,"Base product photography\nAdditional studio directions:\nNatural imperfect styling");
  assert.equal(preview.basedOnRevision,0);
  assert.equal(preview.saved,false);
  assert.equal(preview.providerCalled,false);
  assert.deepEqual(calls,[["get","affiliate"]]);
});

test("saving passes expected revision and verified actor separately from patch",async() => {
  const { services,calls } = fixture();
  const patch = {featureId:"affiliate",additionalInstructions:"Distinct scene",expectedRevision:0,reason:"Improve variety"};
  const result = await tools.runStudioMcpTool("update_feature_prompt",patch,owner,services);
  assert.equal(result.sourceDeployed,false);
  assert.equal(result.settings.revision,1);
  assert.deepEqual(calls,[["update",patch,"verified-owner"]]);
});

test("malformed writes and overlong preview never reach persistence",async() => {
  const { services,calls } = fixture();
  for (const expectedRevision of [-1,1.2,"0",null,Number.MAX_SAFE_INTEGER+1]) {
    await assert.rejects(tools.runStudioMcpTool("update_feature_prompt",{featureId:"affiliate",additionalInstructions:"",expectedRevision,reason:"test"},owner,services),error=>error.code==="invalid_input");
  }
  for (const additionalInstructions of ["x".repeat(3001),"bad\0text"]) await assert.rejects(tools.runStudioMcpTool("preview_feature_prompt",{featureId:"affiliate",additionalInstructions},owner,services),error=>error.code==="invalid_input");
  assert.ok(calls.every(item=>item[0]!=="update"));
});

test("invalid filters, unknown features, and unknown tools are rejected",async() => {
  const { services } = fixture();
  for (const args of [{limit:0},{limit:121},{kind:""},{kind:"unknown"}]) await assert.rejects(tools.runStudioMcpTool("list_features",args,viewer,services));
  await assert.rejects(tools.runStudioMcpTool("get_feature_prompt",{featureId:"not-real"},viewer,services));
  await assert.rejects(tools.runStudioMcpTool("run_shell",{},owner,services));
});

test("configuration changes affect generation deduplication; same configuration is stable",async() => {
  const input = {featureId:"affiliate",kind:"image",prompt:"Product",options:{},images:[]};
  const provider = {provider:"gemini",settings:{imageModel:"test-image",apiKey:"private-key-fixture"}};
  const before = await generationFingerprint(input,provider,{revision:0,featureIntent:"Base"});
  assert.equal(before,await generationFingerprint(input,provider,{revision:0,featureIntent:"Base"}));
  assert.notEqual(before,await generationFingerprint(input,provider,{revision:1,featureIntent:"Base\nNew direction"}));
  assert.notEqual(before,await generationFingerprint(input,provider,{revision:0,featureIntent:"Changed source prompt"}));
});
