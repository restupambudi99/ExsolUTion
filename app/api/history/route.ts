import { ApiError, authenticatedUser, database, errorResponse, json } from "@/lib/studio-api";

export const dynamic = "force-dynamic";

type GenerationRow = { id: string; feature_id: string; prompt: string; options_json: string; results_json: string; created_at: number };

export async function GET(request: Request) {
  try {
    const user = await authenticatedUser();
    const params = new URL(request.url).searchParams;
    const rawCursor = params.get("cursor");
    const cursorParts = rawCursor?.split(":");
    const cursor = cursorParts ? Number(cursorParts[0]) : null;
    const cursorId = cursorParts?.[1] ?? "~";
    if (cursor !== null && (!Number.isSafeInteger(cursor) || cursor < 0 || (cursorParts?.length !== 1 && cursorParts?.length !== 2) || (cursorId !== "~" && !/^[a-zA-Z0-9_-]{1,100}$/.test(cursorId)))) throw new ApiError(400, "invalid_cursor", "Halaman riwayat tidak valid.");
    const limit = Math.trunc(Math.min(Math.max(Number(params.get("limit")) || 30, 1), 60));
    const statement = cursor === null
      ? database().prepare("SELECT id, feature_id, prompt, options_json, results_json, created_at FROM generations WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT ?").bind(user.userId, limit + 1)
      : database().prepare("SELECT id, feature_id, prompt, options_json, results_json, created_at FROM generations WHERE user_id = ? AND (created_at < ? OR (created_at = ? AND id < ?)) ORDER BY created_at DESC, id DESC LIMIT ?").bind(user.userId, cursor, cursor, cursorId, limit + 1);
    const rows = (await statement.all<GenerationRow>()).results;
    const page = rows.slice(0,limit);
    const last = page.at(-1);
    return json({ items: page.map((row) => ({ id: row.id, featureId: row.feature_id, prompt: row.prompt, options: JSON.parse(row.options_json), results: JSON.parse(row.results_json), createdAt: row.created_at })), nextCursor: rows.length > limit && last ? `${last.created_at}:${last.id}` : null });
  } catch (error) { return errorResponse(error); }
}
