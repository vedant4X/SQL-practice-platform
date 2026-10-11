import { NextRequest } from "next/server";
import { z } from "zod";
import { appStore } from "@/lib/db/store";
import { sendOtp, OtpPurpose } from "@/lib/auth/otp";
import { normalizeEmail } from "@/lib/auth/normalization";
import { errorResponse, successResponse } from "@/lib/api/response";

const SendOtpSchema = z.object({
  email: z.string().email(),
  purpose: z.enum(["register", "login", "reset"]).default("register"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = SendOtpSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("VALIDATION_ERROR", parsed.error.errors[0].message, 400);
    }

    const { email, purpose } = parsed.data;
    const normalizedEmail = normalizeEmail(email);
    const clientIp = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip");

    // For login or reset: check if account exists
    const user = await appStore.getUserByEmail(normalizedEmail);
    if ((purpose === "login" || purpose === "reset") && !user) {
      // Return generic success response to avoid account enumeration
      return successResponse({
        message: "If this email can be used, a verification code has been sent.",
      });
    }

    const otpRes = await sendOtp({
      email: normalizedEmail,
      purpose: purpose as OtpPurpose,
      userId: user?.id,
      clientIp,
    });

    if (!otpRes.success) {
      return errorResponse(
        "OTP_ERROR",
        otpRes.message,
        otpRes.cooldownSeconds ? 429 : 502,
        otpRes.cooldownSeconds ? { cooldownSeconds: otpRes.cooldownSeconds } : undefined
      );
    }

    return successResponse({
      message: `A verification code has been sent to ${normalizedEmail}`,
      cooldownSeconds: 60,
      devCode: otpRes.devCode,
    });
  } catch (err: any) {
    console.error("[Send OTP Error]", err);
    return errorResponse("INTERNAL_SERVER_ERROR", "Failed to dispatch verification code.", 500);
  }
}
