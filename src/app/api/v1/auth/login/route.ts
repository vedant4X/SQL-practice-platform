import { NextRequest } from "next/server";
import { z } from "zod";
import { appStore } from "@/lib/db/store";
import { verifyPassword } from "@/lib/auth/password";
import { normalizeEmail, normalizeUserId } from "@/lib/auth/normalization";
import { createSessionToken } from "@/lib/auth/session";
import { setSessionCookie } from "@/lib/auth/cookies";
import { checkRateLimit } from "@/lib/auth/rate-limit";
import { errorResponse, successResponse } from "@/lib/api/response";

const LoginSchema = z.object({
  identifier: z.string().optional(),
  email: z.string().optional(),
  userId: z.string().optional(),
  password: z.string().min(1, "Password is required"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = LoginSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("VALIDATION_ERROR", "Username or email and password are required.", 400);
    }

    const rawIdentifier = parsed.data.identifier || parsed.data.email || parsed.data.userId;
    if (!rawIdentifier || !rawIdentifier.trim()) {
      return errorResponse("VALIDATION_ERROR", "Username or email is required.", 400);
    }

    const password = parsed.data.password;
    const clientIp = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";

    // 1. IP rate limiting (max 30 login attempts per 15 minutes per IP)
    const ipCheck = await checkRateLimit(`login-ip:${clientIp}`, 30, 900);
    if (!ipCheck.allowed) {
      return errorResponse(
        "TOO_MANY_REQUESTS",
        "Too many login attempts from this network. Please wait a few minutes before trying again.",
        429
      );
    }

    // 2. Lookup user by normalized user ID or email
    const norm = rawIdentifier.trim().toLowerCase();
    let user = await appStore.getUserByIdentifier(norm);
    if (!user) {
      user = await appStore.getUserByEmail(norm);
    }

    if (!user) {
      return errorResponse("INVALID_CREDENTIALS", "Invalid credentials.", 401);
    }

    // 3. Check account lockout
    if (user.lockedUntil && new Date(user.lockedUntil).getTime() > Date.now()) {
      const remainingMinutes = Math.ceil(
        (new Date(user.lockedUntil).getTime() - Date.now()) / (60 * 1000)
      );
      return errorResponse(
        "ACCOUNT_LOCKED",
        `Account is temporarily locked due to multiple failed login attempts. Please try again in ${remainingMinutes} minute(s).`,
        423
      );
    }

    // 4. Verify password
    let valid = false;
    try {
      valid = await verifyPassword(password, user.passwordHash);
    } catch (hashErr) {
      console.error("[Password Verification Exception]", hashErr);
      return errorResponse("INTERNAL_SERVER_ERROR", "Authentication error. Please try again.", 500);
    }

    if (!valid) {
      // Record failed login and possibly lock account
      const lockStatus = await appStore.recordFailedLogin(user.id);
      if (lockStatus.locked) {
        return errorResponse(
          "ACCOUNT_LOCKED",
          "Account is temporarily locked due to multiple failed login attempts. Please try again in 15 minutes.",
          423
        );
      }
      return errorResponse("INVALID_CREDENTIALS", "Invalid credentials.", 401);
    }

    // 5. Check account verification status
    if (user.status === "pending" || (!user.emailVerified && !user.emailVerifiedAt)) {
      // Allow legacy admin account or require verification for regular users
      if (user.role !== "admin") {
        return errorResponse(
          "ACCOUNT_UNVERIFIED",
          "Your account is pending verification. Please verify your email before signing in.",
          403,
          { email: user.email, requiresVerification: true }
        );
      }
    }

    if (user.status === "disabled") {
      return errorResponse("INVALID_CREDENTIALS", "Invalid credentials.", 401);
    }

    // 6. Reset failed login counter and record login time
    await appStore.recordSuccessfulLogin(user.id);

    // 7. Rotate session: create new session token in DB and set cookie
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
  } catch (err: any) {
    console.error("[Login Internal Error]", err);
    return errorResponse("INTERNAL_SERVER_ERROR", "Login service encountered an error. Please try again.", 500);
  }
}
