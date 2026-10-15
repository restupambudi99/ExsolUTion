import { env } from "cloudflare:workers";
import { getChatGPTUser } from "@/app/chatgpt-auth";

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

export function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
  });
}

export function errorResponse(error: unknown) {
  if (error instanceof ApiError) return json({ results: [], error: error.message, code: error.code }, error.status);
  // Do not return provider payloads, request bodies, keys, or infrastructure details.
  return json({ results: [], error: "Terjadi masalah pada server. Coba lagi nanti.", code: "server_error" }, 500);
}

export async function authenticatedUser() {
  const user = await getChatGPTUser();
  if (!user) throw new ApiError(401, "authentication_required", "Masuk dengan ChatGPT untuk menggunakan studio dan menyimpan hasil.");
  return user;
}

export function database(): D1Database {
  if (!env.DB) throw new ApiError(503, "storage_not_configured", "Penyimpanan studio belum terhubung.");
  return env.DB;
}

export function bucket(): R2Bucket {
  if (!env.BUCKET) throw new ApiError(503, "storage_not_configured", "Penyimpanan file studio belum terhubung.");
  return env.BUCKET;
}

export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const site = request.headers.get("sec-fetch-site");
  if ((origin && origin !== new URL(request.url).origin) || site === "cross-site") {
    throw new ApiError(403, "invalid_origin", "Permintaan harus berasal dari aplikasi ini.");
  }
}

export async function limitedBody(request: Request, limit: number): Promise<Uint8Array> {
  const declared = request.headers.get("content-length");
  if (declared && Number(declared) > limit) throw new ApiError(413, "payload_too_large", "Ukuran permintaan terlalu besar.");
  if (!request.body) return new Uint8Array();
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const item = await reader.read();
      if (item.done) break;
      length += item.value.byteLength;
      if (length > limit) {
        await reader.cancel();
        throw new ApiError(413, "payload_too_large", "Ukuran permintaan terlalu besar.");
      }
      chunks.push(item.value);
    }
  } finally { reader.releaseLock(); }
  const result = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.byteLength; }
  return result;
}

export async function readJson(request: Request, limit = 64_000): Promise<Record<string, unknown>> {
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    throw new ApiError(415, "invalid_content_type", "Gunakan permintaan JSON.");
  }
  try {
    const value = JSON.parse(new TextDecoder().decode(await limitedBody(request, limit)));
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("shape");
    return value as Record<string, unknown>;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(400, "invalid_json", "Data permintaan tidak valid.");
  }
}

export function validId(value: string) {
  if (!/^[a-zA-Z0-9_-]{1,100}$/.test(value)) throw new ApiError(400, "invalid_id", "ID tidak valid.");
  return value;
}

export async function rateLimit(userId: string, action: "generate" | "upload" | "provider-test", maximum: number) {
  const now = Date.now();
  const row = await database().prepare(`INSERT INTO studio_rate_limits (id, window_started_at, hits) VALUES (?, ?, 1)
    ON CONFLICT(id) DO UPDATE SET
      hits = CASE WHEN window_started_at < ? THEN 1 ELSE hits + 1 END,
      window_started_at = CASE WHEN window_started_at < ? THEN excluded.window_started_at ELSE window_started_at END
    RETURNING hits`).bind(`${userId}:${action}`, now, now - 60_000, now - 60_000).first<{ hits: number }>();
  if (!row || row.hits > maximum) throw new ApiError(429, "rate_limited", "Terlalu banyak permintaan. Tunggu satu menit lalu coba kembali.");
}
