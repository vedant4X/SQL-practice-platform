import { NextRequest } from "next/server";
import { z } from "zod";
import { appStore } from "@/lib/db/store";
import { sendOtp } from "@/lib/auth/otp";
import { normalizeEmail } from "@/lib/auth/normalization";
import { errorResponse, successResponse } from "@/lib/api/response";

const LoginOtpSchema = z.object({
  identifier: z.string().min(1, "Identifier is required"),
});

export async function POST(req: NextRequest) {
  if (process.env.AUTH_OTP_LOGIN_ENABLED !== "true") {
    return errorResponse(
      "FEATURE_DISABLED",
      "Passwordless login via email code is not enabled in this deployment.",
      403
    );
  }

  try {
    const body = await req.json();
    const parsed = LoginOtpSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("VALIDATION_ERROR", parsed.error.errors[0].message, 400);
    }

    const { identifier } = parsed.data;
    const norm = identifier.trim().toLowerCase();
    const clientIp = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip");

    const user = await appStore.getUserByIdentifier(norm);
    if (!user || user.status !== "active") {
      // Generic response to avoid enumeration
      return successResponse({
        message: "If an active account exists, a 6-digit login code has been sent.",
      });
    }

    const otpRes = await sendOtp({
      email: user.email,
      purpose: "login",
      userId: user.id,
      clientIp,
    });

    if (!otpRes.success) {
      return errorResponse(
        "OTP_ERROR",
        otpRes.message,
        429,
        otpRes.cooldownSeconds ? { cooldownSeconds: otpRes.cooldownSeconds } : undefined
      );
    }

    return successResponse({
      message: `A 6-digit login code has been sent to ${user.email}`,
      email: user.email,
      devCode: otpRes.devCode,
    });
  } catch (err: any) {
    console.error("[Login OTP Error]", err);
    return errorResponse("INTERNAL_SERVER_ERROR", "Could not send login code.", 500);
  }
}
