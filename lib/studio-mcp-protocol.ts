/** Stateless Streamable HTTP with both initialization-based and 2026 MCP clients. */
export const MCP_PROTOCOL_VERSIONS = ["2026-07-28", "2025-11-25", "2025-06-18", "2025-03-26", "2024-11-05"] as const;
export const MAX_MCP_BODY_BYTES = 256 * 1024;

type JsonObject = Record<string, unknown>;
type RequestId = string | number | null;
export type McpDependencies = {
  listTools: () => object[] | Promise<object[]>;
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  /** The route authenticates data-bearing calls; never derive identity from tool arguments. */
  authorize?: (method: string, toolName: string | undefined, id: RequestId) => Promise<Response | void>;
};

const modernVersion = MCP_PROTOCOL_VERSIONS[0];
const serverInfo = { name: "aimode-aff-go", title: "ExsolUTion", version: "1.0.0" };
const capabilities = { tools: {} };
const instructions = "Gunakan tool ExsolUTion yang tersedia. Akses data dan perubahan mengikuti izin akun yang masuk.";
const object = (value: unknown): value is JsonObject => value !== null && typeof value === "object" && !Array.isArray(value);
const validId = (value: unknown): value is string | number => typeof value === "string" || (typeof value === "number" && Number.isFinite(value));
const implementation = (value: unknown) => object(value) && typeof value.name === "string" && typeof value.version === "string";
const headers = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };

function jsonResponse(body: unknown, status = 200, stream = false, extra: Record<string, string> = {}): Response {
  const serialized = JSON.stringify(body);
  return new Response(stream ? `event: message\ndata: ${serialized}\n\n` : serialized, {
    status,
    headers: { ...headers, "Content-Type": stream ? "text/event-stream; charset=utf-8" : "application/json; charset=utf-8", ...extra },
  });
}

function error(id: RequestId, code: number, message: string, status = 400, data?: unknown): Response {
  return jsonResponse({ jsonrpc: "2.0", id, error: { code, message, ...(data === undefined ? {} : { data }) } }, status);
}

function noContent(): Response { return new Response(null, { status: 202, headers }); }

class BodyTooLarge extends Error {}

/** Count bytes while reading so chunked bodies cannot evade Content-Length checks. */
async function readBody(request: Request): Promise<string> {
  const length = request.headers.get("content-length");
  if (length !== null && /^\d+$/.test(length) && Number(length) > MAX_MCP_BODY_BYTES) throw new BodyTooLarge();
  if (!request.body) return "";
  const reader = request.body.getReader(), decoder = new TextDecoder("utf-8", { fatal: true });
  let size = 0, text = "";
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_MCP_BODY_BYTES) { void reader.cancel().catch(() => {}); throw new BodyTooLarge(); }
      text += decoder.decode(value, { stream: true });
    }
    return text + decoder.decode();
  } finally { reader.releaseLock(); }
}

/** Decode the MCP sentinel once; encoded literal sentinel strings remain literal. */
function headerValue(value: string | null): string | null {
  if (value === null || !/^[\x20-\x7e\t]*$/.test(value)) return null;
  if (value.startsWith("=?base64?") && value.endsWith("?=")) {
    const encoded = value.slice(9, -2);
    if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(encoded)) return null;
    try { return new TextDecoder("utf-8", { fatal: true }).decode(Uint8Array.from(atob(encoded), item => item.charCodeAt(0))); }
    catch { return null; }
  }
  return value;
}

function modernHeaders(request: Request, body: JsonObject, params: JsonObject, version: string): boolean {
  if (request.headers.get("mcp-protocol-version") !== version || request.headers.get("mcp-method") !== body.method) return false;
  const name = body.method === "resources/read" ? params.uri : params.name;
  return !["tools/call", "resources/read", "prompts/get"].includes(body.method as string)
    || (typeof name === "string" && headerValue(request.headers.get("mcp-name")) === name);
}

function result(id: RequestId, value: JsonObject, modern: boolean, stream: boolean, cache = false): Response {
  return jsonResponse({ jsonrpc: "2.0", id, result: modern ? {
    ...value, resultType: "complete", _meta: { "io.modelcontextprotocol/serverInfo": serverInfo },
    ...(cache ? { ttlMs: 0, cacheScope: "private" } : {}),
  } : value }, 200, stream);
}

/** Authentication, input-schema validation, rate limits, and tool effects belong in the route. */
export async function handleMcpRequest(request: Request, deps: McpDependencies): Promise<Response> {
  const origin = request.headers.get("origin");
  if (origin !== null && origin !== new URL(request.url).origin) return error(null, -32600, "Origin tidak diizinkan.", 403);
  if (request.method !== "POST") {
    return jsonResponse({ jsonrpc: "2.0", id: null, error: { code: -32600, message: "Gunakan HTTP POST untuk MCP." } }, 405, false, { Allow: "POST" });
  }
  if (request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase() !== "application/json") {
    return error(null, -32600, "Content-Type harus application/json.", 415);
  }
  const accept = request.headers.get("accept") || "*/*";
  const accepted = accept.split(",").map(item => item.split(";", 1)[0].trim().toLowerCase());
  const json = accepted.includes("application/json") || accepted.includes("application/*") || accepted.includes("*/*");
  const stream = !json && accepted.includes("text/event-stream");
  if (!json && !stream) return error(null, -32600, "Accept harus mendukung application/json atau text/event-stream.", 406);

  let body: unknown;
  try { body = JSON.parse(await readBody(request)); }
  catch (cause) { return cause instanceof BodyTooLarge ? error(null, -32600, "Batas ukuran permintaan MCP adalah 256 KiB.", 413) : error(null, -32700, "JSON permintaan tidak dapat dibaca."); }
  if (!object(body)) return error(null, -32600, "MCP menerima satu objek JSON-RPC per permintaan.");
  const hasId = Object.prototype.hasOwnProperty.call(body, "id"), id = validId(body.id) ? body.id : null;
  if (body.jsonrpc !== "2.0" || typeof body.method !== "string" || !body.method || (hasId && !validId(body.id))) {
    return error(id, -32600, "Permintaan JSON-RPC tidak valid.");
  }
  if (body.params !== undefined && !object(body.params)) return hasId ? error(id, -32602, "Parameter harus berupa objek.") : noContent();
  const params = body.params === undefined ? {} : body.params as JsonObject;
  // Notifications never dispatch a tool, including an accidental tools/call without an ID.
  if (!hasId) return noContent();
  if (body.method.startsWith("notifications/")) return error(id, -32600, "Notifikasi tidak boleh mempunyai ID.");

  const meta = object(params._meta) ? params._meta : {};
  const metadataVersion = meta["io.modelcontextprotocol/protocolVersion"];
  const headerVersion = request.headers.get("mcp-protocol-version");
  const declaredVersion = typeof metadataVersion === "string" ? metadataVersion : headerVersion;
  const modern = body.method !== "initialize" && (body.method === "server/discover" || declaredVersion === modernVersion || metadataVersion !== undefined);
  if (modern) {
    if (typeof metadataVersion !== "string" || !object(meta["io.modelcontextprotocol/clientCapabilities"])
      || (meta["io.modelcontextprotocol/clientInfo"] !== undefined && !implementation(meta["io.modelcontextprotocol/clientInfo"]))) {
      return error(id, -32602, "Metadata protokol dan kapabilitas klien MCP wajib berupa nilai yang valid.");
    }
    if (metadataVersion !== modernVersion) return error(id, -32022, "Versi protokol tidak didukung.", 400, { supported: [...MCP_PROTOCOL_VERSIONS], requested: metadataVersion });
    if (!modernHeaders(request, body, params, metadataVersion)) return error(id, -32020, "Header MCP hilang atau tidak sesuai dengan isi permintaan.");
  } else if (body.method !== "initialize" && headerVersion !== null && !(MCP_PROTOCOL_VERSIONS as readonly string[]).includes(headerVersion)) {
    return error(id, -32022, "Versi protokol tidak didukung.", 400, { supported: [...MCP_PROTOCOL_VERSIONS], requested: headerVersion });
  }

  try {
    if (body.method === "initialize") {
      if (typeof params.protocolVersion !== "string" || !object(params.capabilities) || !implementation(params.clientInfo)) return error(id, -32602, "Parameter inisialisasi MCP tidak lengkap.");
      const version = (MCP_PROTOCOL_VERSIONS.slice(1) as readonly string[]).includes(params.protocolVersion) ? params.protocolVersion : MCP_PROTOCOL_VERSIONS[1];
      return result(id, { protocolVersion: version, capabilities, serverInfo, instructions }, false, stream);
    }
    if (body.method === "server/discover") return result(id, { supportedVersions: [...MCP_PROTOCOL_VERSIONS], capabilities, instructions }, true, stream, true);
    if (body.method === "ping") return result(id, {}, modern, stream);
    if (body.method !== "tools/list" && body.method !== "tools/call") return error(id, -32601, "Metode MCP tidak tersedia.", modern ? 404 : 400);
    if (body.method === "tools/list" && params.cursor !== undefined) return error(id, -32602, "Kursor tidak valid; daftar tool tersedia dalam satu halaman.");
    if (body.method === "tools/call" && (typeof params.name !== "string" || !params.name || (params.arguments !== undefined && !object(params.arguments)))) return error(id, -32602, "Nama tool dan argumen objek wajib valid.");

    const tools = await deps.listTools();
    if (!Array.isArray(tools) || tools.some(tool => !object(tool) || typeof tool.name !== "string")) throw new Error("Invalid tool catalog");
    if (body.method === "tools/list") return result(id, { tools: [...tools].sort((a, b) => ((a as JsonObject).name as string).localeCompare((b as JsonObject).name as string, "en")) }, modern, stream, true);
    if (!tools.some(tool => (tool as JsonObject).name === params.name)) return error(id, -32602, "Tool MCP tidak tersedia.");
    const denied = await deps.authorize?.(body.method, params.name as string, id);
    if (denied) return denied;
    const output = await deps.callTool(params.name as string, (params.arguments || {}) as JsonObject);
    if (!object(output) || !Array.isArray(output.content)) throw new Error("Invalid tool result");
    return result(id, output, modern, stream);
  } catch { return error(id, -32603, "Permintaan MCP belum dapat diproses. Coba lagi nanti.", 500); }
}
