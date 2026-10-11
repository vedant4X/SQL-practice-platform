import { NextRequest } from "next/server";
import { z } from "zod";
import { appStore } from "@/lib/db/store";
import { hashPassword } from "@/lib/auth/password";
import {
  normalizeEmail,
  normalizeUserId,
  validateUserId,
  validatePassword,
} from "@/lib/auth/normalization";
import { sendOtp } from "@/lib/auth/otp";
import { errorResponse, successResponse } from "@/lib/api/response";

const RegisterSchema = z.object({
  user_id: z.string().optional(),
  username: z.string().optional(),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  name: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("VALIDATION_ERROR", parsed.error.errors[0].message, 400);
    }

    const rawUserId = parsed.data.user_id || parsed.data.username || parsed.data.email.split("@")[0];
    const rawEmail = parsed.data.email;
    const rawPassword = parsed.data.password;
    const name = parsed.data.name?.trim() || rawUserId;

    // 1. Validate username rules
    const userVal = validateUserId(rawUserId);
    if (!userVal.valid) {
      return errorResponse("INVALID_USER_ID", userVal.error || "Invalid username.", 400);
    }

    // 2. Validate password strength and block common passwords
    const passVal = validatePassword(rawPassword);
    if (!passVal.valid) {
      return errorResponse("WEAK_PASSWORD", passVal.error || "Password is too weak.", 400);
    }

    // 3. Normalization
    const normalizedUserId = normalizeUserId(rawUserId);
    const normalizedEmail = normalizeEmail(rawEmail);

    const clientIp = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip");

    // 4. Check if user already exists
    const existingUser =
      (await appStore.getUserByIdentifier(normalizedEmail)) ||
      (await appStore.getUserByEmail(normalizedEmail));

    if (existingUser) {
      // If already verified/active: return generic response to prevent account enumeration
      if (existingUser.status === "active" && (existingUser.emailVerified || existingUser.emailVerifiedAt)) {
        return successResponse({
          message: "If this email can be used, a verification code has been sent.",
          email: normalizedEmail,
          status: "pending_verification",
        });
      }

      // If unverified/pending: update pending credentials with latest password/name/username
      const newPasswordHash = await hashPassword(rawPassword);
      await appStore.updateUser(existingUser.id, {
        name,
        userId: rawUserId,
        userIdNormalized: normalizedUserId,
        passwordHash: newPasswordHash,
      });

      // Resend verification code
      const otpRes = await sendOtp({
        email: normalizedEmail,
        purpose: "register",
        userId: existingUser.id,
        clientIp,
      });

      if (!otpRes.success) {
        return errorResponse("EMAIL_DISPATCH_FAILED", otpRes.message, 502);
      }

      return successResponse({
        message: "A verification code has been sent to your email.",
        email: normalizedEmail,
        status: "pending_verification",
        devCode: otpRes.devCode,
      });
    }

    // Check if username is taken by another account
    const existingByUsername = await appStore.getUserByUserId(normalizedUserId);
    if (existingByUsername && existingByUsername.emailNormalized !== normalizedEmail) {
      return errorResponse(
        "USER_ID_EXISTS",
        "This username is already taken. Please choose another username.",
        409
      );
    }

    // 5. Create new user in "pending" status
    const passwordHash = await hashPassword(rawPassword);
    const id = `usr-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    try {
      await appStore.createUser({
        id,
        userId: rawUserId,
        userIdNormalized: normalizedUserId,
        email: rawEmail,
        emailNormalized: normalizedEmail,
        passwordHash,
        name,
        role: "user",
        timezone: "UTC",
        emailVerified: false,
        status: "pending",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } catch (dbErr: any) {
      // Catch PostgreSQL unique constraint violation (code 23505)
      if (dbErr?.code === "23505" || dbErr?.message?.includes("unique")) {
        return successResponse({
          message: "If this email can be used, a verification code has been sent.",
          email: normalizedEmail,
          status: "pending_verification",
        });
      }
      throw dbErr;
    }

    // 6. Send OTP verification code
    const otpRes = await sendOtp({
      email: normalizedEmail,
      purpose: "register",
      userId: id,
      clientIp,
    });

    if (!otpRes.success) {
      return errorResponse("EMAIL_DISPATCH_FAILED", otpRes.message, 502);
    }

    return successResponse(
      {
        message: "Account created. A 6-digit verification code has been sent to your email.",
        email: normalizedEmail,
        status: "pending_verification",
        devCode: otpRes.devCode,
      },
      201
    );
  } catch (err: any) {
    console.error("[Register Error]", err);
    return errorResponse("INTERNAL_SERVER_ERROR", "Registration could not be completed. Please try again.", 500);
  }
}
