import { NextRequest } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/cookies";
import { appStore } from "@/lib/db/store";
import { hashPassword } from "@/lib/auth/password";
import { errorResponse, successResponse } from "@/lib/api/response";

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== "admin") {
      return errorResponse("FORBIDDEN", "Administrator privileges required", 403);
    }

    const body = await req.json();
    const { userId, newPassword } = body;

    if (!userId || !newPassword) {
      return errorResponse("BAD_REQUEST", "userId and newPassword are required", 400);
    }

    if (typeof newPassword !== "string" || newPassword.length < 6) {
      return errorResponse("BAD_REQUEST", "Password must be at least 6 characters", 400);
    }

    const targetUser = await appStore.getUserById(userId);
    if (!targetUser) {
      return errorResponse("NOT_FOUND", "User not found", 404);
    }

    const passwordHash = await hashPassword(newPassword);
    const updated = await appStore.updateUser(userId, {
      passwordHash,
      passwordPlain: newPassword,
    });

    return successResponse({
      message: "Password updated successfully",
      user: {
        id: updated?.id,
        email: updated?.email,
        name: updated?.name,
        passwordPlain: updated?.passwordPlain,
      },
    });
  } catch (err: any) {
    return errorResponse("INTERNAL_SERVER_ERROR", err.message || "Failed to update password", 500);
  }
}
