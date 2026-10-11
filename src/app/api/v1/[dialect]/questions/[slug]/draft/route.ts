import { NextRequest } from "next/server";
import { z } from "zod";
import { getSessionFromRequest } from "@/lib/auth/cookies";
import { getQuestionBySlug } from "@/lib/curriculum/questions";
import { appStore } from "@/lib/db/store";
import { errorResponse, successResponse } from "@/lib/api/response";
import { parseDialect } from "@/lib/api/dialect";

const DraftSchema = z.object({
  draft: z.string(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ dialect: string; slug: string }> }
) {
  const { dialect: rawDialect, slug } = await params;
  const parsed = parseDialect(rawDialect);
  if ("error" in parsed) return parsed.error;
  const { dialect } = parsed;

  const session = await getSessionFromRequest(req);
  if (!session) {
    return errorResponse("UNAUTHORIZED", "Sign in required to load cloud drafts", 401);
  }

  const question = getQuestionBySlug(slug, dialect);
  if (!question) {
    return errorResponse("QUESTION_NOT_FOUND", `Question '${slug}' not found`, 404);
  }

  const draftText = await appStore.getDraft(session.userId, question.id, dialect);

  return successResponse({
    draft: draftText || null,
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ dialect: string; slug: string }> }
) {
  const { dialect: rawDialect, slug } = await params;
  const parsed = parseDialect(rawDialect);
  if ("error" in parsed) return parsed.error;
  const { dialect } = parsed;

  const session = await getSessionFromRequest(req);
  if (!session) {
    return errorResponse("UNAUTHORIZED", "Sign in required to save cloud drafts", 401);
  }

  const question = getQuestionBySlug(slug, dialect);
  if (!question) {
    return errorResponse("QUESTION_NOT_FOUND", `Question '${slug}' not found`, 404);
  }

  try {
    const body = await req.json();
    const parsedBody = DraftSchema.safeParse(body);
    if (!parsedBody.success) {
      return errorResponse("VALIDATION_ERROR", "Draft content required", 400);
    }

    const saved = await appStore.saveDraft(
      session.userId,
      question.id,
      dialect,
      parsedBody.data.draft
    );

    return successResponse({
      saved: true,
      updatedAt: saved.updatedAt,
    });
  } catch (err: any) {
    return errorResponse("DRAFT_SAVE_ERROR", err.message || "Failed to save draft", 500);
  }
}
