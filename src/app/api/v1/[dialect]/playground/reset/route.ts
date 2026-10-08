import { NextRequest } from "next/server";
import { parseDialect } from "@/lib/api/dialect";
import { resetPlaygroundDb } from "@/lib/engine/playground-db";
import { resetPlaygroundDb as resetMySqlPlaygroundDb } from "@/lib/engine/mysql/mysql-playground-db";
import { successResponse } from "@/lib/api/response";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ dialect: string }> }
) {
  const { dialect: rawDialect } = await params;
  const parsedDialect = parseDialect(rawDialect);
  if ("error" in parsedDialect) return parsedDialect.error;
  const { dialect } = parsedDialect;

  const sessionId = req.cookies.get("sql_platform_session")?.value || "guest-playground";

  if (dialect === "mysql") {
    await resetMySqlPlaygroundDb(sessionId);
  } else {
    resetPlaygroundDb(sessionId);
  }

  return successResponse({ message: `${dialect.toUpperCase()} playground schema reset successfully.` });
}
