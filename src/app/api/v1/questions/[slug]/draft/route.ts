import { NextRequest } from "next/server";
import { z } from "zod";
import { getSessionFromRequest } from "@/lib/auth/cookies";
import { getQuestionBySlug } from "@/lib/curriculum/questions";
import { appStore } from "@/lib/db/store";
import { errorResponse, successResponse } from "@/lib/api/response";

const DraftSchema = z.object({
  draft: z.string(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const session = await getSessionFromRequest(req);
  if (!session) {
    return errorResponse("UNAUTHORIZED", "Sign in required to load cloud drafts", 401);
  }

  const question = getQuestionBySlug(slug);
  if (!question) {
    return errorResponse("QUESTION_NOT_FOUND", `Question '${slug}' not found`, 404);
  }

  const draftText = await appStore.getDraft(session.userId, question.id, "postgresql");

  return successResponse({
    draft: draftText || null,
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const session = await getSessionFromRequest(req);
  if (!session) {
    return errorResponse("UNAUTHORIZED", "Sign in required to save cloud drafts", 401);
  }

  const question = getQuestionBySlug(slug);
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
      "postgresql",
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
