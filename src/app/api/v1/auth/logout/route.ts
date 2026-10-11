import { NextRequest } from "next/server";
import { clearSessionCookie, SESSION_COOKIE_NAME } from "@/lib/auth/cookies";
import { revokeSessionToken } from "@/lib/auth/session";
import { successResponse } from "@/lib/api/response";

export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    await revokeSessionToken(token);
  }
  const res = successResponse({ message: "Logged out successfully" });
  clearSessionCookie(res);
  return res;
}
