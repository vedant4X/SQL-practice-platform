import { NextRequest } from "next/server";
import { z } from "zod";
import { verifyOtp } from "@/lib/auth/otp";
import { errorResponse, successResponse } from "@/lib/api/response";

const VerifyOtpSchema = z.object({
  email: z.string().email("Invalid email address"),
  otp: z.string().length(6, "Verification code must be 6 digits"),
  purpose: z
    .enum(["registration", "login", "verification", "reset_password"])
    .optional()
    .default("registration"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = VerifyOtpSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("VALIDATION_ERROR", parsed.error.errors[0].message, 400);
    }

    const { email, otp, purpose } = parsed.data;
    const result = await verifyOtp(email, otp, purpose);

    if (!result.success) {
      return errorResponse("VERIFICATION_FAILED", result.message, 400, {
        remainingAttempts: result.remainingAttempts,
      });
    }

    return successResponse({
      verified: true,
      message: result.message,
    });
  } catch (err: any) {
    return errorResponse("INTERNAL_SERVER_ERROR", err.message || "Failed to verify OTP", 500);
  }
}
