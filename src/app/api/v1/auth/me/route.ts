import { NextRequest } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/cookies";
import { appStore } from "@/lib/db/store";
import { errorResponse, successResponse } from "@/lib/api/response";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return errorResponse("UNAUTHORIZED", "Not authenticated", 401);
  }

  const user = appStore.getUserById(session.userId);
  if (!user) {
    return errorResponse("USER_NOT_FOUND", "User not found", 404);
  }

  const settings = appStore.getUserSettings(user.id);
  const totalXp = appStore.getUserXp(user.id);

  return successResponse({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      timezone: user.timezone,
      totalXp,
      settings,
    },
  });
}
