import { NextRequest } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/cookies";
import { getUserProgressStats } from "@/lib/progress/service";
import { errorResponse, successResponse } from "@/lib/api/response";
import { parseDialect } from "@/lib/api/dialect";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ dialect: string }> }
) {
  const { dialect: rawDialect } = await params;
  const parsedDialect = parseDialect(rawDialect);
  if ("error" in parsedDialect) return parsedDialect.error;
  const { dialect } = parsedDialect;

  const session = await getSessionFromRequest(req);
  if (!session) {
    return errorResponse("UNAUTHORIZED", "Not authenticated", 401);
  }

  const stats = getUserProgressStats(session.userId, dialect);
  return successResponse({ stats });
}
