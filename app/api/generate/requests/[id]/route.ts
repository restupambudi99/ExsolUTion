import { ApiError, authenticatedUser, errorResponse, json } from "@/lib/studio-api";
import { generationRequestId, generationRequestState, ownedGenerationRequest } from "@/lib/studio-generation-requests";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await authenticatedUser();
    const requestId = generationRequestId((await params).id);
    const row = await ownedGenerationRequest(user.userId,requestId);
    if (!row) throw new ApiError(404,"request_not_found","Permintaan tidak ditemukan pada akun ini.");
    const state = await generationRequestState(row);
    return json(state,state.status === "pending" || state.status === "unknown" ? 202 : 200);
  } catch (error) { return errorResponse(error); }
}
