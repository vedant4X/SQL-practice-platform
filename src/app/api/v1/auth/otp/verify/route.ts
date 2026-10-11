import { NextRequest } from "next/server";
import { z } from "zod";
import { appStore } from "@/lib/db/store";
import { verifyOtp, OtpPurpose } from "@/lib/auth/otp";
import { normalizeEmail } from "@/lib/auth/normalization";
import { createSessionToken } from "@/lib/auth/session";
import { setSessionCookie } from "@/lib/auth/cookies";
import { errorResponse, successResponse } from "@/lib/api/response";

const VerifySchema = z.object({
  email: z.string().email(),
  otp: z.string().min(6).max(6),
  purpose: z.enum(["register", "login", "reset"]).default("register"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = VerifySchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("VALIDATION_ERROR", parsed.error.errors[0].message, 400);
    }

    const { email, otp, purpose } = parsed.data;
    const normalizedEmail = normalizeEmail(email);

    // Verify OTP with attempt-tracking and HMAC constant-time check
    const verifyRes = await verifyOtp({
      email: normalizedEmail,
      otpCode: otp,
      purpose: purpose as OtpPurpose,
    });

    if (!verifyRes.success) {
      return errorResponse("INVALID_OTP", verifyRes.message, 400, {
        remainingAttempts: verifyRes.remainingAttempts,
      });
    }

    // User lookup
    const user = await appStore.getUserByEmail(normalizedEmail);
    if (!user) {
      return errorResponse("USER_NOT_FOUND", "Account not found.", 404);
    }

    // If registration: activate user account
    if (purpose === "register") {
      await appStore.setUserEmailVerified(normalizedEmail, true);
      await appStore.setUserStatus(user.id, "active");
      await appStore.updateUser(user.id, {
        emailVerified: true,
        emailVerifiedAt: new Date().toISOString(),
        status: "active",
      });
    }

    // If registration or login: issue session and set cookie
    if (purpose === "register" || purpose === "login") {
      const userAgent = req.headers.get("user-agent") || undefined;
      const token = await createSessionToken(
        {
          userId: user.id,
          email: user.email,
          role: user.role,
          name: user.name,
        },
        userAgent
      );

      const res = successResponse({
        message: "Account verified successfully",
        user: {
          id: user.id,
          userId: user.userId,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      });

      setSessionCookie(res, token);
      return res;
    }

    // Reset password purpose: return verified confirmation
    return successResponse({
      message: "Code verified successfully. Please enter your new password.",
      verified: true,
      email: normalizedEmail,
    });
  } catch (err: any) {
    console.error("[Verify OTP Error]", err);
    return errorResponse("INTERNAL_SERVER_ERROR", "Verification failed. Please try again.", 500);
  }
}
