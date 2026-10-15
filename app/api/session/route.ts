import { env } from "cloudflare:workers";
import { chatGPTSignInPath, chatGPTSignOutPath, getChatGPTUser } from "@/app/chatgpt-auth";
import { json, errorResponse } from "@/lib/studio-api";
import { providerStatus } from "@/lib/studio-config";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getChatGPTUser();
    const providers = providerStatus(env);
    return json({
      authenticated: Boolean(user),
      user,
      provider: providers.gemini,
      providers,
      signInUrl: chatGPTSignInPath("/"),
      signOutUrl: chatGPTSignOutPath("/"),
    });
  } catch (error) { return errorResponse(error); }
}
