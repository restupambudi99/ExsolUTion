import { env } from "cloudflare:workers";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { ApiError, rateLimit } from "@/lib/studio-api";
import { isStudioAdministrator } from "@/lib/studio-admin";
import { providerStatusForUser } from "@/lib/studio-credentials";
import { getFeaturePromptSettings, listPromptChanges, updateFeaturePromptSettings } from "@/lib/studio-prompt-settings";
import { handleMcpRequest } from "@/lib/studio-mcp-protocol";
import { isAdminMcpTool, McpInputError, mcpToolDefinitions, runStudioMcpTool, type McpActor } from "@/lib/studio-mcp-tools";

export const dynamic = "force-dynamic";

/** Sites owns OAuth and the site allowlist. Every data-bearing call also needs a real visitor identity. */
export async function POST(request: Request) {
  let actor: McpActor | undefined;
  return handleMcpRequest(request,{
    listTools: () => mcpToolDefinitions,
    authorize: async (_method,name,id) => {
      const user = await getChatGPTUser();
      if (!user) return denied(id,401,"authentication_required","Hubungkan akun yang memiliki akses ExsolUTion melalui OAuth Sites.");
      actor = { userId: user.userId, isAdministrator: isStudioAdministrator(user.userId,env) };
      if (name && isAdminMcpTool(name) && !actor.isAdministrator) return denied(id,403,"administrator_required","Akun ini tidak mempunyai hak administrator untuk prompt global.");
      try { await rateLimit(user.userId,name === "update_feature_prompt" ? "mcp-write" : "mcp-read",name === "update_feature_prompt" ? 20 : 120); }
      catch (cause) {
        if (cause instanceof ApiError) return denied(id,cause.status,cause.code,cause.message);
        return denied(id,503,"mcp_unavailable","Layanan MCP belum tersedia. Coba kembali nanti.");
      }
    },
    callTool: async (name,args) => {
      try {
        if (!actor) throw new McpInputError("authentication_required","Identitas pengguna diperlukan.");
        const data = await runStudioMcpTool(name,args,actor,{
          getPrompt: (id) => getFeaturePromptSettings(id),
          updatePrompt: (input,userId) => updateFeaturePromptSettings(input,userId),
          changes: (limit) => listPromptChanges(limit),
          providerStatus: () => providerStatusForUser(env,actor!.userId),
        });
        return { content: [{ type: "text", text: JSON.stringify(data) }], structuredContent: data, isError: false };
      } catch (cause) {
        const safe = cause instanceof ApiError || cause instanceof McpInputError;
        const data = { code: safe ? cause.code : "mcp_unavailable", error: safe ? cause.message : "Layanan MCP belum dapat memproses permintaan. Coba kembali nanti." };
        return { content: [{ type: "text", text: data.error }], structuredContent: data, isError: true };
      }
    },
  });
}

function denied(id: string | number | null, status: number, code: string, message: string) {
  return Response.json({ jsonrpc: "2.0", id, error: { code: -32600, message, data: { code } } },{
    status,
    headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", ...(status === 401 ? { "WWW-Authenticate": 'Bearer realm="ExsolUTion"' } : {}), ...(status === 429 ? { "Retry-After": "60" } : {}) },
  });
}

export function GET(request: Request) { return handleMcpRequest(request,{ listTools: () => mcpToolDefinitions, callTool: async () => ({ content: [] }) }); }
export const DELETE = GET;
