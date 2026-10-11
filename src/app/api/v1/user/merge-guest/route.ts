import { NextRequest } from "next/server";
import { z } from "zod";
import { getSessionFromRequest } from "@/lib/auth/cookies";
import { appStore } from "@/lib/db/store";
import { errorResponse, successResponse } from "@/lib/api/response";
import { parseDialect } from "@/lib/api/dialect";

const MergeGuestSchema = z.object({
  solvedQuestionIds: z.array(z.string()),
  dialect: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return errorResponse("UNAUTHORIZED", "User must be authenticated to merge guest progress", 401);
  }

  try {
    const body = await req.json();
    const parsed = MergeGuestSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("VALIDATION_ERROR", "Invalid merge payload", 400);
    }

    const { solvedQuestionIds, dialect: rawDialect } = parsed.data;
    const parsedDialect = parseDialect(rawDialect || "postgresql");
    const dialect = "error" in parsedDialect ? "postgresql" : parsedDialect.dialect;

    await appStore.mergeGuestProgress(session.userId, solvedQuestionIds, undefined, dialect);

    return successResponse({
      merged: true,
      solvedCount: (await appStore.getUserSolvedQuestions(session.userId, dialect)).length,
    });
  } catch (err: any) {
    return errorResponse("MERGE_ERROR", err.message || "Failed to merge progress", 500);
  }
}
