import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth/cookies";
import { successResponse } from "@/lib/api/response";

export async function POST() {
  const res = successResponse({ message: "Logged out successfully" });
  clearSessionCookie(res);
  return res;
}
