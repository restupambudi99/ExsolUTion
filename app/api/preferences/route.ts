import { ApiError, assertSameOrigin, authenticatedUser, database, errorResponse, json, readJson } from "@/lib/studio-api";

export const dynamic = "force-dynamic";

type PreferenceRow = { favorites_json: string; theme: "light" | "dark"; language: "id" | "en" | "ms" };
const defaults = { favorites: [] as string[], theme: "light", language: "id" };

async function readPreferences(userId: string) {
  const row = await database().prepare("SELECT favorites_json, theme, language FROM preferences WHERE user_id = ?").bind(userId).first<PreferenceRow>();
  return row ? { favorites: JSON.parse(row.favorites_json) as string[], theme: row.theme, language: row.language } : defaults;
}

export async function GET() {
  try { const user = await authenticatedUser(); return json(await readPreferences(user.userId)); }
  catch (error) { return errorResponse(error); }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await authenticatedUser();
    const input = await readJson(request, 16_000);
    const current = await readPreferences(user.userId);
    const favorites = input.favorites ?? current.favorites;
    const theme = input.theme ?? current.theme;
    const language = input.language ?? current.language;
    if (!Array.isArray(favorites) || favorites.length > 150 || favorites.some((id) => typeof id !== "string" || !/^[a-zA-Z0-9_-]{1,100}$/.test(id))) throw new ApiError(400, "invalid_preferences", "Daftar favorit tidak valid.");
    if (theme !== "light" && theme !== "dark") throw new ApiError(400, "invalid_preferences", "Tema tidak valid.");
    if (language !== "id" && language !== "en" && language !== "ms") throw new ApiError(400, "invalid_preferences", "Bahasa tidak valid.");
    const result = { favorites: Array.from(new Set(favorites)), theme, language };
    await database().prepare("INSERT INTO preferences (user_id, favorites_json, theme, language, updated_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET favorites_json = excluded.favorites_json, theme = excluded.theme, language = excluded.language, updated_at = excluded.updated_at")
      .bind(user.userId, JSON.stringify(result.favorites), theme, language, Date.now()).run();
    return json(result);
  } catch (error) { return errorResponse(error); }
}
