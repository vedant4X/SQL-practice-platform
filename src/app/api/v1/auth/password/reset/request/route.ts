import { NextRequest } from "next/server";
import { z } from "zod";
import { appStore } from "@/lib/db/store";
import { sendOtp } from "@/lib/auth/otp";
import { normalizeEmail } from "@/lib/auth/normalization";
import { errorResponse, successResponse } from "@/lib/api/response";

const ResetRequestSchema = z.object({
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ResetRequestSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("VALIDATION_ERROR", parsed.error.errors[0].message, 400);
    }

    const { email } = parsed.data;
    const normalizedEmail = normalizeEmail(email);
    const clientIp = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip");

    const user = await appStore.getUserByEmail(normalizedEmail);
    if (!user || user.status !== "active") {
      // Generic response to avoid enumeration
      return successResponse({
        message: "If an active account exists with this email, a reset code has been sent.",
      });
    }

    const otpRes = await sendOtp({
      email: normalizedEmail,
      purpose: "reset",
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
      message: "A 6-digit password reset code has been sent to your email.",
      email: normalizedEmail,
      devCode: otpRes.devCode,
    });
  } catch (err: any) {
    console.error("[Reset Request Error]", err);
    return errorResponse("INTERNAL_SERVER_ERROR", "Password reset request failed.", 500);
  }
}
