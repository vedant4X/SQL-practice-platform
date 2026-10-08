import { NextRequest } from "next/server";
import { resetPlaygroundDb } from "@/lib/engine/playground-db";
import { successResponse } from "@/lib/api/response";

export async function POST(req: NextRequest) {
  const sessionId = req.cookies.get("sql_platform_session")?.value || "guest-playground";
  resetPlaygroundDb(sessionId);
  return successResponse({ message: "Playground schema reset successfully." });
}
