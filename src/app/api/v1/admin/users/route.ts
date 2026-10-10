import { NextRequest } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/cookies";
import { appStore } from "@/lib/db/store";
import { errorResponse, successResponse } from "@/lib/api/response";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== "admin") {
      return errorResponse("FORBIDDEN", "Administrator privileges required", 403);
    }

    const rawUsers = appStore.getAllUsers();
    const users = rawUsers.map((u) => {
      const totalXp = appStore.getUserXp(u.id);
      const solvedPg = appStore.getUserSolvedQuestions(u.id, "postgresql").length;
      const solvedMy = appStore.getUserSolvedQuestions(u.id, "mysql").length;

      return {
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        passwordPlain: u.passwordPlain || null,
        passwordHash: u.passwordHash,
        totalXp,
        solvedCount: solvedPg + solvedMy,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      };
    });

    return successResponse({
      users,
      totalCount: users.length,
    });
  } catch (err: any) {
    return errorResponse("INTERNAL_SERVER_ERROR", err.message || "Failed to load users", 500);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== "admin") {
      return errorResponse("FORBIDDEN", "Administrator privileges required", 403);
    }

    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return errorResponse("BAD_REQUEST", "userId is required", 400);
    }

    if (userId === session.userId) {
      return errorResponse("BAD_REQUEST", "Cannot delete your own active administrator account", 400);
    }

    const deleted = appStore.deleteUser(userId);
    if (!deleted) {
      return errorResponse("NOT_FOUND", "User not found", 404);
    }

    return successResponse({ message: "User deleted successfully", userId });
  } catch (err: any) {
    return errorResponse("INTERNAL_SERVER_ERROR", err.message || "Failed to delete user", 500);
  }
}
