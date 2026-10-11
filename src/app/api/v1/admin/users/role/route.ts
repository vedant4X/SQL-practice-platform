import { NextRequest } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/cookies";
import { appStore } from "@/lib/db/store";
import { errorResponse, successResponse } from "@/lib/api/response";

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== "admin") {
      return errorResponse("FORBIDDEN", "Administrator privileges required", 403);
    }

    const body = await req.json();
    const { userId, role } = body;

    if (!userId || !role || (role !== "user" && role !== "admin")) {
      return errorResponse("BAD_REQUEST", "Valid userId and role ('user' | 'admin') are required", 400);
    }

    if (userId === session.userId && role !== "admin") {
      return errorResponse("BAD_REQUEST", "You cannot revoke your own admin role", 400);
    }

    const targetUser = await appStore.getUserById(userId);
    if (!targetUser) {
      return errorResponse("NOT_FOUND", "User not found", 404);
    }

    const updated = await appStore.updateUser(userId, { role });

    return successResponse({
      message: `User role updated to ${role}`,
      user: {
        id: updated?.id,
        email: updated?.email,
        name: updated?.name,
        role: updated?.role,
      },
    });
  } catch (err: any) {
    return errorResponse("INTERNAL_SERVER_ERROR", err.message || "Failed to update role", 500);
  }
}
