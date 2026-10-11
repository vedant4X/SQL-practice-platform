import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { appStore } from "@/lib/db/store";
import { hashPassword } from "@/lib/auth/password";
import { createSessionToken } from "@/lib/auth/session";
import { setSessionCookie } from "@/lib/auth/cookies";
import { errorResponse, successResponse } from "@/lib/api/response";

const RegisterSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  otp: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("VALIDATION_ERROR", parsed.error.errors[0].message, 400);
    }

    const { email, password, name, otp } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    const existing = await appStore.getUserByEmail(normalizedEmail);
    if (existing) {
      return errorResponse("EMAIL_EXISTS", "An account with this email already exists.", 409);
    }

    let isEmailVerified = false;
    if (otp) {
      const { verifyOtp } = await import("@/lib/auth/otp");
      const verifyRes = await verifyOtp(normalizedEmail, otp, "registration");
      if (!verifyRes.success) {
        return errorResponse("INVALID_OTP", verifyRes.message, 400);
      }
      isEmailVerified = true;
    } else if (process.env.REQUIRE_EMAIL_VERIFICATION === "true") {
      return errorResponse(
        "OTP_REQUIRED",
        "A verification code is required to complete registration.",
        400
      );
    }

    const passwordHash = await hashPassword(password);
    const userId = `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const user = await appStore.createUser({
      id: userId,
      email: normalizedEmail,
      passwordHash,
      name,
      role: "user",
      timezone: "UTC",
      emailVerified: isEmailVerified,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    const res = successResponse(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
      201
    );

    setSessionCookie(res, token);
    return res;
  } catch (err: any) {
    return errorResponse("INTERNAL_SERVER_ERROR", err.message || "Registration failed", 500);
  }
}
