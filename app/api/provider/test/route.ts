import { env } from "cloudflare:workers";
import { ApiError, assertSameOrigin, authenticatedUser, errorResponse, json, rateLimit, readJson } from "@/lib/studio-api";
import { resolveProvider } from "@/lib/studio-config";
import { ProviderError, testGeminiConnection } from "@/lib/studio-provider";
import { testRouterConnection } from "@/lib/studio-router";
import { validateProviderSelection, ValidationError } from "@/lib/studio-validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await authenticatedUser();
    const input = validateProviderSelection(await readJson(request,16_000));
    const selected = resolveProvider(input,env);
    await rateLimit(user.userId,"provider-test",6);
    const result = selected.provider === "gemini" ? await testGeminiConnection(selected.settings) : await testRouterConnection(selected.settings);
    return json(result);
  } catch (error) {
    if (error instanceof ValidationError) return errorResponse(new ApiError(400,"invalid_input",error.message));
    if (error instanceof ProviderError) return json({ results: [], error: error.message, code: error.code, ...(error.diagnostic ? { diagnostic: error.diagnostic } : {}) },error.status);
    return errorResponse(error);
  }
}
