import { NextRequest } from "next/server";
import { query } from "@/lib/db/pool";
import { errorResponse, successResponse } from "@/lib/api/response";

export async function POST(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return errorResponse("UNAUTHORIZED", "CRON_SECRET is not configured on the server.", 401);
  }

  const authHeader = req.headers.get("authorization");
  const customHeader = req.headers.get("x-cron-secret");
  const url = new URL(req.url);
  const querySecret = url.searchParams.get("secret");

  const providedSecret =
    customHeader || querySecret || (authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null);

  if (providedSecret !== cronSecret) {
    return errorResponse("UNAUTHORIZED", "Invalid cron authentication secret.", 401);
  }

  try {
    // 1. Delete consumed or expired OTPs older than 24 hours
    const otpClean = await query(`
      DELETE FROM email_otps
      WHERE (consumed_at IS NOT NULL AND consumed_at < NOW() - INTERVAL '24 hours')
         OR (expires_at < NOW() - INTERVAL '24 hours')
    `);

    // 2. Delete expired or revoked sessions older than 7 days
    const sessClean = await query(`
      DELETE FROM sessions
      WHERE (revoked_at IS NOT NULL AND revoked_at < NOW() - INTERVAL '7 days')
         OR (expires_at < NOW() - INTERVAL '7 days')
    `);

    // 3. Delete rate limits older than 2 hours
    const rateClean = await query(`
      DELETE FROM rate_limits
      WHERE window_start < NOW() - INTERVAL '2 hours'
    `);

    return successResponse({
      cleaned: {
        otps: otpClean.rowCount ?? 0,
        sessions: sessClean.rowCount ?? 0,
        rateLimits: rateClean.rowCount ?? 0,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("[Cron Cleanup Error]", err);
    return errorResponse("INTERNAL_SERVER_ERROR", "Cleanup job encountered a database error.", 500);
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}
