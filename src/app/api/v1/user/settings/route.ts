import { NextRequest } from "next/server";
import { z } from "zod";
import { getSessionFromRequest } from "@/lib/auth/cookies";
import { appStore } from "@/lib/db/store";
import { errorResponse, successResponse } from "@/lib/api/response";

const SettingsSchema = z.object({
  practiceModeEnabled: z.boolean().optional(),
  theme: z.enum(["dark", "light"]).optional(),
  leaderboardVisible: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return errorResponse("UNAUTHORIZED", "Not authenticated", 401);
  }

  const settings = appStore.getUserSettings(session.userId);
  return successResponse({ settings });
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return errorResponse("UNAUTHORIZED", "Not authenticated", 401);
  }

  const body = await req.json();
  const parsed = SettingsSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "Invalid settings format", 400);
  }

  const updated = appStore.updateUserSettings(session.userId, parsed.data);
  return successResponse({ settings: updated });
}
