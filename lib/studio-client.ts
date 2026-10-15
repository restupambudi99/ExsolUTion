// The client never repeats a generation POST. Only its owner-scoped status GET
// may be retried after a connection interruption.
export class StudioRequestError extends Error {
  constructor(message: string, public status: number, public code: string, public requestId?: string) { super(message); }
}

export type GenerationResult = { id: string; kind: string; url?: string; text?: string; mimeType?: string; warnings?: string[] };
export type GenerationResponse = { id: string; results: GenerationResult[]; createdAt?: number; warnings?: string[]; requestId?: string };
export type PendingGeneration = { requestId: string; featureId: string; startedAt: number };
export type GenerationStatus = { status: "pending" | "unknown" | "completed" | "failed"; requestId?: string; data?: GenerationResponse; error?: string; code?: string; errorStatus?: number };

const MAX_RESPONSE_BYTES = 4 * 1024 * 1024;
const idPattern = /^[a-zA-Z0-9_-]{1,100}$/;
function object(value: unknown): value is Record<string, unknown> { return !!value && typeof value === "object" && !Array.isArray(value); }
function safeId(value: unknown) { return typeof value === "string" && idPattern.test(value) ? value : undefined; }
function validGeneration(value: unknown): value is GenerationResponse {
  return object(value) && typeof value.id === "string" && Array.isArray(value.results) && value.results.length > 0 && value.results.every(item => object(item) && typeof item.id === "string" && ["image", "text", "audio"].includes(String(item.kind)) && (item.kind === "text" ? typeof item.text === "string" && !!item.text.trim() : typeof item.url === "string" && /^\/api\/files\/[a-zA-Z0-9_-]+$/.test(item.url)));
}

function transportError(status: number, requestId?: string, generation = false) {
  const recovery = generation ? " Periksa status permintaan atau Riwayat Kreasi sebelum membuat permintaan baru; generate tidak diulang otomatis." : " Coba kembali setelah koneksi pulih.";
  if (status === 401) return new StudioRequestError("Sesi akun sudah berakhir. Masuk kembali ke akun situs.", status, "authentication_required", requestId);
  if (status === 403) return new StudioRequestError("Akses permintaan ditolak. Periksa sesi akun dan izin situs.", status, "access_denied", requestId);
  if (status === 429) return new StudioRequestError("Batas permintaan tercapai. Tunggu satu menit sebelum mencoba kembali.", status, "rate_limited", requestId);
  if ([408, 504, 522, 524].includes(status)) return new StudioRequestError(`Koneksi server melewati batas waktu (HTTP ${status}).${recovery}`, status, "gateway_timeout", requestId);
  if (status >= 500) return new StudioRequestError(`Layanan server sedang terganggu (HTTP ${status}).${recovery}`, status, "gateway_error", requestId);
  return new StudioRequestError(`Server mengirim respons yang tidak sesuai${status ? ` (HTTP ${status})` : ""}.${recovery}`, status || 502, "invalid_server_response", requestId);
}
function malformedResponse(status: number, requestId?: string, generation = false) {
  return new StudioRequestError(`Server mengirim respons yang tidak sesuai (HTTP ${status}).${generation ? " Periksa status permintaan atau Riwayat Kreasi; generate tidak diulang otomatis." : " Coba kembali setelah layanan pulih."}`, status, "invalid_server_response", requestId);
}

function payloadError(data: Record<string, unknown>, status: number, requestId?: string) {
  const fallback = transportError(status, requestId);
  return new StudioRequestError(typeof data.error === "string" && data.error.trim() ? data.error.slice(0, 3000) : fallback.message, status, typeof data.code === "string" ? data.code : status >= 500 ? fallback.code : "request_failed", safeId(data.requestId) || requestId);
}

async function readJson(response: Response): Promise<unknown> {
  if (!response.body) throw new Error("empty_response");
  const reader = response.body.getReader(); const decoder = new TextDecoder(); let text = "", size = 0;
  try {
    while (true) { const chunk = await reader.read(); if (chunk.done) break; size += chunk.value.byteLength; if (size > MAX_RESPONSE_BYTES) { await reader.cancel(); throw new Error("response_limit"); } text += decoder.decode(chunk.value, { stream: true }); }
    return JSON.parse(text + decoder.decode());
  } finally { reader.releaseLock(); }
}

export async function request<T>(url: string, body?: unknown, method?: string, options: { timeoutMs?: number } = {}): Promise<T> {
  const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 45_000);
  const generation = url === "/api/generate";
  const requestId = object(body) ? safeId(body.requestId) : undefined;
  try {
    const response = await fetch(url, { method: method || (body !== undefined ? "POST" : "GET"), credentials: "same-origin", headers: body !== undefined ? { "Content-Type": "application/json", ...(generation ? { Accept: "application/x-ndjson, application/json" } : {}) } : { Accept: "application/json" }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}), signal: controller.signal });
    const contentType = response.headers.get("content-type") || "";
    if (generation && response.ok && contentType.includes("application/x-ndjson")) return await readGenerationStream(response, requestId) as T;
    let data: unknown;
    try { data = await readJson(response); } catch (error) { if (controller.signal.aborted) throw error; throw response.ok ? malformedResponse(response.status, requestId, generation) : transportError(response.status, requestId, generation); }
    if (!object(data)) throw response.ok ? malformedResponse(response.status, requestId, generation) : transportError(response.status, requestId, generation);
    if (!response.ok || typeof data.error === "string" && data.status !== "failed") throw payloadError(data, response.status, requestId);
    if (generation && data.status !== "pending" && data.status !== "unknown" && !validGeneration(data)) throw malformedResponse(response.status, requestId, true);
    return data as T;
  } catch (error) {
    if (error instanceof StudioRequestError) throw error;
    if (controller.signal.aborted) throw new StudioRequestError(`Koneksi melewati batas waktu.${generation ? " Periksa status permintaan atau Riwayat Kreasi; generate tidak diulang otomatis." : " Coba kembali setelah koneksi pulih."}`, 408, "request_timeout", requestId);
    throw new StudioRequestError(`Koneksi ke server terputus.${generation ? " Periksa status permintaan atau Riwayat Kreasi sebelum generate ulang." : " Periksa internet lalu coba kembali."}`, 0, "network_error", requestId);
  } finally { clearTimeout(timer); }
}

async function readGenerationStream(response: Response, requestId?: string): Promise<GenerationResponse> {
  if (!response.body) throw malformedResponse(response.status, requestId, true);
  const reader = response.body.getReader(), decoder = new TextDecoder(); let buffer = "", size = 0;
  const consume = (line: string): GenerationResponse | undefined => {
    if (!line.trim()) return;
    let event: unknown; try { event = JSON.parse(line); } catch { throw malformedResponse(response.status, requestId, true); }
    if (!object(event)) throw malformedResponse(response.status, requestId, true);
    requestId = safeId(event.requestId) || requestId;
    if (event.type === "accepted" || event.type === "heartbeat") return;
    if (event.type === "error") throw payloadError(event, typeof event.status === "number" ? event.status : 502, requestId);
    if (event.type !== "result" || !validGeneration(event.data)) throw malformedResponse(response.status, requestId, true);
    return { ...event.data, requestId: event.data.requestId || requestId };
  };
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) { buffer += decoder.decode(); if (buffer.trim()) { const data = consume(buffer); if (data) return data; } throw new StudioRequestError("Koneksi proses gambar terputus sebelum hasil diterima. Periksa status permintaan atau Riwayat Kreasi; generate tidak diulang otomatis.", 502, "generation_interrupted", requestId); }
      size += chunk.value.byteLength; if (size > MAX_RESPONSE_BYTES) throw malformedResponse(response.status, requestId, true);
      buffer += decoder.decode(chunk.value, { stream: true });
      let newline: number;
      while ((newline = buffer.indexOf("\n")) >= 0) { const line = buffer.slice(0, newline); buffer = buffer.slice(newline + 1); const data = consume(line); if (data) return data; }
    }
  } finally { await reader.cancel().catch(() => undefined); reader.releaseLock(); }
}

const pendingKey = (scope: string) => `aimode.pending-generations.${encodeURIComponent(scope)}`;
const pendingMemory = new Map<string, PendingGeneration[]>();
export function readPending(scope: string): PendingGeneration[] {
  if (!scope) return [];
  try { if (typeof sessionStorage === "undefined") return pendingMemory.get(scope) || []; const stored = sessionStorage.getItem(pendingKey(scope)); if (stored === null) return pendingMemory.get(scope) || []; const value: unknown = JSON.parse(stored); if (!Array.isArray(value)) return pendingMemory.get(scope) || []; const items = value.filter((item): item is PendingGeneration => object(item) && !!safeId(item.requestId) && !!safeId(item.featureId) && typeof item.startedAt === "number").slice(-20); pendingMemory.set(scope, items); return items; } catch { return pendingMemory.get(scope) || []; }
}
function writePending(scope: string, items: PendingGeneration[]) { if (!scope) return; pendingMemory.set(scope, items.slice(-20)); try { if (typeof sessionStorage !== "undefined") sessionStorage.setItem(pendingKey(scope), JSON.stringify(items.slice(-20))); } catch { /* The current tab can still recover the request using its in-memory metadata. */ } }
export function forgetPending(scope: string, requestId: string) { writePending(scope, readPending(scope).filter(item => item.requestId !== requestId)); }
export async function generationStatus(requestId: string) {
  if (!safeId(requestId)) throw new StudioRequestError("ID permintaan tidak valid.", 400, "invalid_request_id");
  const status = await request<GenerationStatus>(`/api/generate/requests/${encodeURIComponent(requestId)}`);
  if (!["pending", "unknown", "completed", "failed"].includes(status.status) || status.status === "completed" && !validGeneration(status.data)) throw malformedResponse(200, requestId);
  return status;
}
export async function generateRequest(body: Record<string, unknown>, scope: string, onPending?: (item: PendingGeneration) => void): Promise<GenerationResponse> {
  const requestId = crypto.randomUUID();
  const item = { requestId, featureId: String(body.featureId), startedAt: Date.now() };
  writePending(scope, [...readPending(scope), item]); onPending?.(item);
  try {
    const response = await request<GenerationResponse | GenerationStatus>("/api/generate", { ...body, requestId }, undefined, { timeoutMs: 180_000 });
    if ("status" in response) throw new StudioRequestError("Permintaan masih diproses atau hasilnya belum dapat dipastikan. Periksa status sebelum membuat permintaan baru.", 202, "generation_pending", requestId);
    forgetPending(scope, requestId); return response;
  } catch (error) {
    const failure = error instanceof StudioRequestError ? error : new StudioRequestError("Permintaan belum berhasil.", 502, "request_failed", requestId);
    // A lost response can already have been committed. Recover it via a read,
    // never by replaying the expensive POST.
    if (failure.status === 0 || failure.status >= 500 || ["request_timeout", "generation_pending", "invalid_server_response", "generation_interrupted"].includes(failure.code)) {
      try {
        const status = await generationStatus(requestId);
        if (status.status === "completed" && status.data) { forgetPending(scope, requestId); return status.data; }
        if (status.status === "failed") { forgetPending(scope, requestId); throw new StudioRequestError(status.error || "Provider tidak dapat menyelesaikan permintaan.", status.errorStatus || 502, status.code || "generation_failed", requestId); }
      } catch (recoveryError) {
        if (recoveryError instanceof StudioRequestError && !["network_error", "request_timeout", "gateway_error", "gateway_timeout", "invalid_server_response", "not_found", "request_not_found"].includes(recoveryError.code)) throw recoveryError;
      }
    } else { forgetPending(scope, requestId); }
    throw failure;
  }
}

export function recoveryAction(code: string): "settings" | "signin" | "history" | "input" {
  if (code === "authentication_required" || code === "access_denied") return "signin";
  if (/^(provider_(authentication_failed|not_configured|configuration_invalid|model_unavailable|token_revoked)|invalid_router_url|private_router_address|router_(model|voice|reference|aspect_ratio|mask|provider|domain|dns|access|generation_authentication|capability)|invalid_(router|gemini)|unsupported_model)/.test(code)) return "settings";
  if (/^(network_error|request_timeout|gateway_|invalid_server_response|generation_|server_error|provider_(timeout|unavailable|rate_limited|connection_failed|empty_response|invalid_response)|download_)/.test(code)) return "history";
  return "input";
}
