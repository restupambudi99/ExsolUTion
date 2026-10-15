import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const code = ts.transpileModule(readFileSync(new URL("./studio-mcp-protocol.ts", import.meta.url), "utf8"), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText;
const { handleMcpRequest, MCP_PROTOCOL_VERSIONS, MAX_MCP_BODY_BYTES } = await import(`data:text/javascript;base64,${Buffer.from(code).toString("base64")}`);

const url = "https://toolsaff.restupambudi.my.id/mcp";
const tool = name => ({ name, description: "Synthetic test tool", inputSchema: { type: "object", additionalProperties: false } });
const dependencies = changes => ({ listTools: () => [tool("z_tool"), tool("a_tool")], callTool: async (_name, args) => ({ content: [{ type: "text", text: "Success" }], structuredContent: args }), ...changes });
const rpc = (method, params = {}, id = 1) => ({ jsonrpc: "2.0", id, method, params });
const request = (body, headers = {}, method = "POST") => new Request(url, { method, headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream", ...headers }, ...(method === "POST" ? { body: typeof body === "string" ? body : JSON.stringify(body) } : {}) });
const meta = { "io.modelcontextprotocol/protocolVersion": "2026-07-28", "io.modelcontextprotocol/clientCapabilities": {}, "io.modelcontextprotocol/clientInfo": { name: "Synthetic client", version: "1" } };
function modern(method, params = {}, options = {}) {
  return request(rpc(method, { ...params, _meta: { ...meta, ...options.meta } }, options.id ?? 1), {
    "MCP-Protocol-Version": "2026-07-28", "Mcp-Method": method,
    ...(["tools/call", "prompts/get"].includes(method) ? { "Mcp-Name": params.name } : {}),
    ...(method === "resources/read" ? { "Mcp-Name": params.uri } : {}), ...options.headers,
  });
}
const read = async response => ({ status: response.status, body: await response.json() });

for (const version of MCP_PROTOCOL_VERSIONS.slice(1)) {
  test(`legacy ${version} initializes without requiring modern headers or minting a session`, async () => {
    const response = await handleMcpRequest(request(rpc("initialize", { protocolVersion: version, capabilities: {}, clientInfo: { name: "legacy", version: "1" } })), dependencies());
    const { result } = await response.json();
    assert.equal(response.status, 200);
    assert.equal(result.protocolVersion, version);
    assert.deepEqual(result.capabilities, { tools: {} });
    assert.equal(result.serverInfo.name, "aimode-aff-go");
    assert.equal(result.resultType, undefined);
    assert.equal(response.headers.get("Mcp-Session-Id"), null);
  });
}

test("initialize negotiates an unsupported proposal down to a legacy revision", async () => {
  const { result } = await (await handleMcpRequest(request(rpc("initialize", { protocolVersion: "2099-01-01", capabilities: {}, clientInfo: { name: "legacy", version: "1" } })), dependencies())).json();
  assert.equal(result.protocolVersion, "2025-11-25");
});

test("incomplete initialization never invokes tools", async () => {
  let calls = 0;
  const output = await read(await handleMcpRequest(request(rpc("initialize", { protocolVersion: "2025-11-25" })), dependencies({ callTool: async () => { calls++; } })));
  assert.equal(output.body.error.code, -32602);
  assert.equal(calls, 0);
});

test("modern discovery supplies identity, versions, capabilities, and private cache hints without initialize", async () => {
  const response = await handleMcpRequest(modern("server/discover"), dependencies());
  const { result } = await response.json();
  assert.equal(result.resultType, "complete");
  assert.deepEqual(result.supportedVersions, MCP_PROTOCOL_VERSIONS);
  assert.deepEqual(result.capabilities, { tools: {} });
  assert.equal(result._meta["io.modelcontextprotocol/serverInfo"].name, "aimode-aff-go");
  assert.equal(result.cacheScope, "private");
  assert.equal(result.ttlMs, 0);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.equal(response.headers.get("Mcp-Session-Id"), null);
});

test("both eras list tools deterministically without mutating the source catalog", async () => {
  const catalog = [tool("z_tool"), tool("a_tool")];
  for (const req of [request(rpc("tools/list")), modern("tools/list")]) {
    const { result } = await (await handleMcpRequest(req, dependencies({ listTools: async () => catalog }))).json();
    assert.deepEqual(result.tools.map(item => item.name), ["a_tool", "z_tool"]);
  }
  assert.deepEqual(catalog.map(item => item.name), ["z_tool", "a_tool"]);
});

test("a known call dispatches once with exact arguments and preserves actionable tool errors", async () => {
  const calls = [];
  const output = await read(await handleMcpRequest(modern("tools/call", { name: "a_tool", arguments: { theme: "Luxury" } }, { id: "call-1" }), dependencies({ callTool: async (name, args) => { calls.push({ name, args }); return { content: [{ type: "text", text: "Theme invalid" }], isError: true }; } })));
  assert.equal(output.status, 200);
  assert.equal(output.body.id, "call-1");
  assert.equal(output.body.result.resultType, "complete");
  assert.equal(output.body.result.isError, true);
  assert.deepEqual(calls, [{ name: "a_tool", args: { theme: "Luxury" } }]);
});

test("omitted tool arguments become an empty object and numeric zero IDs stay valid", async () => {
  const response = await handleMcpRequest(request(rpc("tools/call", { name: "a_tool" }, 0)), dependencies());
  const output = await response.json();
  assert.equal(output.id, 0);
  assert.deepEqual(output.result.structuredContent, {});
});

test("unknown tools and malformed arguments cannot reach authorization or dispatch", async () => {
  let calls = 0, checks = 0;
  for (const params of [{ name: "private.unknown" }, { name: "a_tool", arguments: [] }, { name: "a_tool", arguments: null }, { name: 17 }]) {
    const output = await read(await handleMcpRequest(request(rpc("tools/call", params)), dependencies({ authorize: async () => { checks++; }, callTool: async () => { calls++; } })));
    assert.equal(output.body.error.code, -32602);
  }
  assert.equal(calls, 0); assert.equal(checks, 0);
});

for (const status of [401, 403]) {
  test(`route authorization can return HTTP ${status} unchanged before any private call`, async () => {
    let calls = 0;
    const denied = new Response(JSON.stringify({ jsonrpc: "2.0", id: 1, error: { code: -32600, message: "Access denied" } }), { status, headers: { "WWW-Authenticate": 'Bearer resource_metadata="https://toolsaff.restupambudi.my.id/.well-known/oauth-protected-resource"' } });
    const response = await handleMcpRequest(modern("tools/call", { name: "a_tool" }), dependencies({ authorize: async (method, name, id) => { assert.equal(method, "tools/call"); assert.equal(name, "a_tool"); assert.equal(id, 1); return denied; }, callTool: async () => { calls++; } }));
    assert.equal(response, denied);
    assert.equal(response.status, status);
    assert.equal(calls, 0);
  });
}

test("public catalog and protocol discovery never require data authorization", async () => {
  let calls = 0;
  for (const req of [modern("server/discover"), modern("tools/list"), modern("ping")]) {
    assert.equal((await handleMcpRequest(req, dependencies({ authorize: async () => { calls++; return new Response(null, { status: 401 }); } }))).status, 200);
  }
  assert.equal(calls, 0);
});

test("absent Origin works for CLIs, same Origin works for browser, cross-origin and null Origin fail", async () => {
  for (const origin of [undefined, "https://toolsaff.restupambudi.my.id", "https://evil.example", "null"]) {
    const response = await handleMcpRequest(request(rpc("ping"), origin === undefined ? {} : { Origin: origin }), dependencies());
    assert.equal(response.status, origin === undefined || origin === "https://toolsaff.restupambudi.my.id" ? 200 : 403);
  }
});

test("GET and DELETE cannot create streams or terminate somebody else's session", async () => {
  for (const method of ["GET", "DELETE", "OPTIONS"]) {
    const response = await handleMcpRequest(request(undefined, {}, method), dependencies());
    assert.equal(response.status, 405);
    assert.equal(response.headers.get("Allow"), "POST");
  }
});

test("unsupported content and response media types fail without dispatch", async () => {
  const wrongType = await handleMcpRequest(request(rpc("ping"), { "Content-Type": "text/plain" }), dependencies());
  const wrongAccept = await handleMcpRequest(request(rpc("ping"), { Accept: "image/png" }), dependencies());
  assert.equal(wrongType.status, 415); assert.equal(wrongAccept.status, 406);
});

test("a client accepting only SSE receives exactly one framed JSON-RPC response", async () => {
  const response = await handleMcpRequest(request(rpc("ping"), { Accept: "text/event-stream" }), dependencies());
  assert.match(response.headers.get("Content-Type"), /^text\/event-stream/);
  assert.equal(await response.text(), 'event: message\ndata: {"jsonrpc":"2.0","id":1,"result":{}}\n\n');
});

test("JSON parse failures and invalid envelopes never reflect request secrets", async () => {
  const secret = "synthetic-secret-do-not-reflect";
  for (const value of [`{\"${secret}\":`, [], null, 17, { jsonrpc: "1.0", id: 7, method: "ping", secret }, rpc("ping", {}, null), rpc("ping", {}, {})]) {
    const response = await handleMcpRequest(request(value), dependencies());
    const text = await response.text();
    assert.equal(response.status, 400);
    assert.doesNotMatch(text, new RegExp(secret));
    assert.match(text, /-32700|-32600/);
  }
});

test("a body exactly at the byte limit works; one byte over is rejected", async () => {
  const base = JSON.stringify({ ...rpc("ping"), padding: "" });
  const valid = base.replace('"padding":""', `"padding":"${"x".repeat(MAX_MCP_BODY_BYTES - Buffer.byteLength(base))}"`);
  assert.equal(Buffer.byteLength(valid), MAX_MCP_BODY_BYTES);
  assert.equal((await handleMcpRequest(request(valid), dependencies())).status, 200);
  assert.equal((await handleMcpRequest(request(`${valid} `), dependencies())).status, 413);
});

test("chunked multibyte input is bounded by bytes, even without Content-Length", async () => {
  const chunk = new TextEncoder().encode("💡".repeat(20000));
  const stream = new ReadableStream({ start(controller) { for (let i = 0; i < 4; i++) controller.enqueue(chunk); controller.close(); } });
  const req = new Request(url, { method: "POST", duplex: "half", headers: { "Content-Type": "application/json" }, body: stream });
  assert.equal((await handleMcpRequest(req, dependencies())).status, 413);
});

test("oversized declared body is rejected before attempting to read", async () => {
  const response = await handleMcpRequest(request(rpc("ping"), { "Content-Length": String(MAX_MCP_BODY_BYTES + 1) }), dependencies());
  assert.equal(response.status, 413);
});

test("notifications have an empty 202 response and never call any tool", async () => {
  let calls = 0;
  for (const method of ["notifications/initialized", "notifications/cancelled", "notifications/unknown", "tools/call"]) {
    const response = await handleMcpRequest(request({ jsonrpc: "2.0", method, params: { name: "a_tool", requestId: 1 } }), dependencies({ callTool: async () => { calls++; } }));
    assert.equal(response.status, 202); assert.equal(await response.text(), "");
  }
  assert.equal(calls, 0);
});

test("notification methods with a request ID are invalid requests", async () => {
  const output = await read(await handleMcpRequest(request(rpc("notifications/initialized")), dependencies()));
  assert.equal(output.body.error.code, -32600);
});

test("modern requests reject absent required metadata and malformed client capabilities", async () => {
  for (const _meta of [{}, { ...meta, "io.modelcontextprotocol/clientCapabilities": [] }, { ...meta, "io.modelcontextprotocol/clientInfo": { name: "missing version" } }]) {
    const response = await handleMcpRequest(request(rpc("tools/list", { _meta }), { "MCP-Protocol-Version": "2026-07-28", "Mcp-Method": "tools/list" }), dependencies());
    assert.equal((await response.json()).error.code, -32602);
  }
});

test("modern headers are required and must exactly agree with the parsed body", async () => {
  const cases = [
    ["tools/list", {}, { "MCP-Protocol-Version": "" }],
    ["tools/list", {}, { "Mcp-Method": "" }],
    ["tools/list", {}, { "MCP-Protocol-Version": "2025-11-25" }],
    ["tools/list", {}, { "Mcp-Method": "TOOLS/LIST" }],
    ["tools/call", { name: "a_tool" }, { "Mcp-Name": "" }],
    ["tools/call", { name: "a_tool" }, { "Mcp-Name": "z_tool" }],
  ];
  for (const [method, params, headers] of cases) {
    const output = await read(await handleMcpRequest(modern(method, params, { headers }), dependencies()));
    assert.equal(output.status, 400); assert.equal(output.body.error.code, -32020);
  }
});

test("Mcp-Name sentinel decoding permits Unicode tool names and rejects invalid encodings", async () => {
  const name = "alat_🌅";
  const encoded = `=?base64?${Buffer.from(name).toString("base64")}?=`;
  const success = await handleMcpRequest(modern("tools/call", { name }, { headers: { "Mcp-Name": encoded } }), dependencies({ listTools: () => [tool(name)] }));
  assert.equal(success.status, 200);
  const failure = await handleMcpRequest(modern("tools/call", { name: "a_tool" }, { headers: { "Mcp-Name": "=?base64?not valid!?=" } }), dependencies());
  assert.equal((await failure.json()).error.code, -32020);
});

test("unsupported modern and legacy-header versions provide supported revisions", async () => {
  for (const req of [modern("tools/list", {}, { meta: { "io.modelcontextprotocol/protocolVersion": "2099-01-01" }, headers: { "MCP-Protocol-Version": "2099-01-01" } }), request(rpc("tools/list"), { "MCP-Protocol-Version": "2099-01-01" })]) {
    const output = await read(await handleMcpRequest(req, dependencies()));
    assert.equal(output.status, 400); assert.equal(output.body.error.code, -32022);
    assert.equal(output.body.error.data.requested, "2099-01-01");
    assert.deepEqual(output.body.error.data.supported, MCP_PROTOCOL_VERSIONS);
  }
});

test("unknown modern methods return JSON-RPC method-not-found with HTTP404", async () => {
  const output = await read(await handleMcpRequest(modern("unknown/method"), dependencies()));
  assert.equal(output.status, 404); assert.equal(output.body.error.code, -32601);
});

test("invalid cursors do not silently return a misleading complete tool catalog", async () => {
  const output = await read(await handleMcpRequest(modern("tools/list", { cursor: "expired" }), dependencies()));
  assert.equal(output.body.error.code, -32602);
});

test("thrown dependency errors and invalid results are sanitized instead of exposing credentials or stacks", async () => {
  const secret = "synthetic-api-key-never-reflect";
  for (const changes of [{ callTool: async () => { throw new Error(secret); } }, { authorize: async () => { throw new Error(secret); } }, { listTools: () => { throw new Error(secret); } }, { callTool: async () => null }]) {
    const response = await handleMcpRequest(modern("tools/call", { name: "a_tool" }), dependencies(changes));
    const text = await response.text();
    assert.equal(response.status, 500);
    assert.equal(JSON.parse(text).error.code, -32603);
    assert.doesNotMatch(text, new RegExp(secret)); assert.doesNotMatch(text, /stack|Error:/);
  }
});
