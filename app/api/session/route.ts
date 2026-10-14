import { env } from "cloudflare:workers";
import { chatGPTSignInPath, chatGPTSignOutPath, getChatGPTUser } from "@/app/chatgpt-auth";
import { json, errorResponse } from "@/lib/studio-api";
import { DEFAULT_MODELS } from "@/lib/studio-provider";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getChatGPTUser();
    return json({
      authenticated: Boolean(user),
      user,
      provider: {
        configured: Boolean(env.GEMINI_API_KEY?.trim()),
        imageModel: env.GEMINI_IMAGE_MODEL || DEFAULT_MODELS.imageModel,
        textModel: env.GEMINI_TEXT_MODEL || DEFAULT_MODELS.textModel,
        audioModel: env.GEMINI_AUDIO_MODEL || DEFAULT_MODELS.audioModel,
      },
      signInUrl: chatGPTSignInPath("/"),
      signOutUrl: chatGPTSignOutPath("/"),
    });
  } catch (error) { return errorResponse(error); }
}
