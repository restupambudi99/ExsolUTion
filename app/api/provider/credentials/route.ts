import { env } from "cloudflare:workers";
import { ApiError, assertSameOrigin, authenticatedUser, errorResponse, json, readJson } from "@/lib/studio-api";
import { forgetProviderForUser, providerStatusForUser } from "@/lib/studio-credentials";
import { ProviderError } from "@/lib/studio-provider";

export const dynamic = "force-dynamic";

export async function DELETE(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await authenticatedUser();
    const input = await readJson(request, 1024);
    if (input.provider !== "gemini" && input.provider !== "9router") throw new ApiError(400, "invalid_provider", "Pilih provider yang valid.");
    await forgetProviderForUser(input.provider, env, user.userId);
    return json({ ok: true, providers: await providerStatusForUser(env, user.userId) });
  } catch (error) {
    if (error instanceof ProviderError) return json({ error: error.message, code: error.code }, error.status);
    return errorResponse(error);
  }
}
