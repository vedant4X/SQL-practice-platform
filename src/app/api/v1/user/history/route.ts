import { NextRequest } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/cookies";
import { appStore } from "@/lib/db/store";
import { errorResponse, successResponse } from "@/lib/api/response";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return errorResponse("UNAUTHORIZED", "Not authenticated", 401);
  }

  const history = await appStore.getUserHistory(session.userId);
  return successResponse({ history });
}
