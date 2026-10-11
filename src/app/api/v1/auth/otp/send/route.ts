import { NextRequest } from "next/server";
import { z } from "zod";
import { sendOtp } from "@/lib/auth/otp";
import { errorResponse, successResponse } from "@/lib/api/response";

const SendOtpSchema = z.object({
  email: z.string().email("Invalid email address"),
  purpose: z
    .enum(["registration", "login", "verification", "reset_password"])
    .optional()
    .default("registration"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = SendOtpSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("VALIDATION_ERROR", parsed.error.errors[0].message, 400);
    }

    const { email, purpose } = parsed.data;
    const result = await sendOtp(email, purpose);

    if (!result.success) {
      if (result.cooldownSeconds) {
        return errorResponse("RATE_LIMITED", result.message, 429, {
          cooldownSeconds: result.cooldownSeconds,
        });
      }
      return errorResponse("BAD_REQUEST", result.message, 400);
    }

    return successResponse({
      message: result.message,
      devCode: result.devCode,
    });
  } catch (err: any) {
    return errorResponse("INTERNAL_SERVER_ERROR", err.message || "Failed to send OTP", 500);
  }
}
