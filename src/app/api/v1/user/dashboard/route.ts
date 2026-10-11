import { NextRequest } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/cookies";
import { getUserProgressStats } from "@/lib/progress/service";
import { errorResponse, successResponse } from "@/lib/api/response";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return errorResponse("UNAUTHORIZED", "Not authenticated", 401);
  }

  const stats = await getUserProgressStats(session.userId);
  return successResponse({ stats });
}
