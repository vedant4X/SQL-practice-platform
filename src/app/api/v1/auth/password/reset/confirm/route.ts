import { NextRequest } from "next/server";
import { z } from "zod";
import { appStore } from "@/lib/db/store";
import { verifyOtp } from "@/lib/auth/otp";
import { hashPassword } from "@/lib/auth/password";
import { normalizeEmail, validatePassword } from "@/lib/auth/normalization";
import { revokeAllUserSessions } from "@/lib/auth/session";
import { errorResponse, successResponse } from "@/lib/api/response";

const ResetConfirmSchema = z.object({
  email: z.string().email(),
  otp: z.string().min(6).max(6),
  new_password: z.string().min(8),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ResetConfirmSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("VALIDATION_ERROR", parsed.error.errors[0].message, 400);
    }

    const { email, otp, new_password: newPassword } = parsed.data;
    const normalizedEmail = normalizeEmail(email);

    // 1. Validate new password strength
    const passVal = validatePassword(newPassword);
    if (!passVal.valid) {
      return errorResponse("WEAK_PASSWORD", passVal.error || "Password is too weak.", 400);
    }

    // 2. Verify OTP
    const verifyRes = await verifyOtp({
      email: normalizedEmail,
      otpCode: otp,
      purpose: "reset",
    });

    if (!verifyRes.success) {
      return errorResponse("INVALID_OTP", verifyRes.message, 400, {
        remainingAttempts: verifyRes.remainingAttempts,
      });
    }

    // 3. User lookup
    const user = await appStore.getUserByEmail(normalizedEmail);
    if (!user) {
      return errorResponse("USER_NOT_FOUND", "Account not found.", 404);
    }

    // 4. Update password
    const newHash = await hashPassword(newPassword);
    await appStore.updateUserPassword(user.id, newHash);

    // 5. Invalidate all active sessions across all devices
    await revokeAllUserSessions(user.id);

    return successResponse({
      message: "Password reset successfully. Please sign in with your new password.",
    });
  } catch (err: any) {
    console.error("[Reset Confirm Error]", err);
    return errorResponse("INTERNAL_SERVER_ERROR", "Password reset failed. Please try again.", 500);
  }
}
