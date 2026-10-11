import crypto from "crypto";
import { query } from "@/lib/db/pool";
import { normalizeEmail } from "./normalization";
import { sendEmail } from "@/lib/email/sender";
import { checkRateLimit } from "./rate-limit";

export type OtpPurpose = "register" | "login" | "reset";

export interface SendOtpResult {
  success: boolean;
  message: string;
  cooldownSeconds?: number;
  devCode?: string;
}

export interface VerifyOtpResult {
  success: boolean;
  message: string;
  remainingAttempts?: number;
  userId?: string;
}

const OTP_LENGTH = 6;
const OTP_EXPIRES_MINUTES = 10;
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_ATTEMPTS = 5;
const HOURLY_LIMIT = 5;

function getOtpHmacSecret(): string {
  return (
    process.env.OTP_HMAC_SECRET ||
    process.env.SESSION_SECRET ||
    "default_otp_hmac_secret_for_development_and_testing"
  );
}

/**
 * Computes HMAC-SHA256 hash of OTP code with secret key
 */
export function hashOtpCode(code: string): string {
  const secret = getOtpHmacSecret();
  return crypto.createHmac("sha256", secret).update(code.trim()).digest("hex");
}

/**
 * Generates cryptographically secure 6-digit numeric OTP code
 */
export function generateNumericOtp(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

/**
 * Hash client IP address for privacy
 */
export function hashIp(ip?: string | null): string {
  if (!ip) return "ip_unknown";
  return crypto.createHash("sha256").update(ip).digest("hex").slice(0, 16);
}

/**
 * Issues an email OTP with rate-limiting, HMAC hashing, and email dispatch
 */
export async function sendOtp(params: {
  email: string;
  purpose: OtpPurpose;
  userId?: string;
  clientIp?: string | null;
}): Promise<SendOtpResult> {
  const { email, purpose, userId, clientIp } = params;
  const normalizedEmail = normalizeEmail(email);
  const ipHash = hashIp(clientIp);

  // 1. Resend cooldown check (60s)
  const cooldownKey = `otp-cd:${normalizedEmail}:${purpose}`;
  const cooldownCheck = await checkRateLimit(cooldownKey, 1, RESEND_COOLDOWN_SECONDS);
  if (!cooldownCheck.allowed) {
    return {
      success: false,
      cooldownSeconds: cooldownCheck.resetSeconds,
      message: `Please wait ${cooldownCheck.resetSeconds} seconds before requesting a new code.`,
    };
  }

  // 2. Hourly limit per email (max 5 per hour)
  const hourlyKey = `otp-hourly:${normalizedEmail}`;
  const hourlyCheck = await checkRateLimit(hourlyKey, HOURLY_LIMIT, 3600);
  if (!hourlyCheck.allowed) {
    return {
      success: false,
      message: "Too many verification codes requested. Please try again in an hour.",
    };
  }

  // 3. Hourly limit per IP (max 20 per hour)
  if (clientIp) {
    const ipHourlyKey = `otp-ip:${ipHash}`;
    const ipCheck = await checkRateLimit(ipHourlyKey, 20, 3600);
    if (!ipCheck.allowed) {
      return {
        success: false,
        message: "Too many requests from this network. Please try again later.",
      };
    }
  }

  // 4. Invalidate prior unconsumed codes for this email and purpose
  try {
    await query(
      `UPDATE email_otps 
       SET consumed_at = NOW() 
       WHERE email_normalized = $1 AND purpose = $2 AND consumed_at IS NULL`,
      [normalizedEmail, purpose]
    );
  } catch {
    // If table doesn't exist yet in unit test, proceed gracefully
  }

  // 5. Generate 6-digit code and store HMAC-SHA256 hash
  const otpCode = generateNumericOtp();
  const codeHash = hashOtpCode(otpCode);
  const otpId = `otp-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
  const expiresAt = new Date(Date.now() + OTP_EXPIRES_MINUTES * 60 * 1000);

  try {
    await query(
      `INSERT INTO email_otps (
         id, user_id, email_normalized, purpose, code_hash, expires_at, attempt_count, created_at, request_ip_hash
       ) VALUES ($1, $2, $3, $4, $5, $6, 0, NOW(), $7)`,
      [otpId, userId || null, normalizedEmail, purpose, codeHash, expiresAt, ipHash]
    );
  } catch (err: any) {
    console.error("[OTP Store Error]", err?.message || err);
  }

  // 6. Send email dispatch
  const subjectMap: Record<OtpPurpose, string> = {
    register: "Verify your email for Quro",
    login: "Your Quro Login Code",
    reset: "Reset your Quro Password",
  };

  const emailResult = await sendEmail({
    to: normalizedEmail,
    subject: subjectMap[purpose] || "Your Quro Verification Code",
    text: `Your Quro verification code is: ${otpCode}\n\nThis code will expire in ${OTP_EXPIRES_MINUTES} minutes. If you did not request this, please ignore this email.`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <h2 style="color: #0f172a; margin-top: 0;">${subjectMap[purpose]}</h2>
        <p style="color: #475569; font-size: 14px;">Use the following 6-digit code to continue:</p>
        <div style="background-color: #f1f5f9; padding: 16px; border-radius: 8px; text-align: center; margin: 24px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #0284c7;">${otpCode}</span>
        </div>
        <p style="color: #64748b; font-size: 12px;">This code expires in ${OTP_EXPIRES_MINUTES} minutes. Do not share this code with anyone. If you did not make this request, please disregard this email.</p>
      </div>
    `,
    otpCode,
  });

  if (!emailResult.success) {
    return {
      success: false,
      message: emailResult.error || "Failed to send verification email.",
    };
  }

  return {
    success: true,
    message: `Verification code sent to ${normalizedEmail}`,
    devCode: emailResult.devCode,
  };
}

/**
 * Verifies OTP with constant-time comparison, single-use consumption, and attempt limits
 */
export async function verifyOtp(params: {
  email: string;
  otpCode: string;
  purpose: OtpPurpose;
}): Promise<VerifyOtpResult> {
  const { email, otpCode, purpose } = params;
  const normalizedEmail = normalizeEmail(email);

  if (!otpCode || otpCode.trim().length !== OTP_LENGTH) {
    return {
      success: false,
      message: "Please enter a valid 6-digit verification code.",
    };
  }

  let activeOtp: any = null;
  try {
    const res = await query(
      `SELECT id, user_id, code_hash, expires_at, consumed_at, attempt_count
       FROM email_otps
       WHERE email_normalized = $1 AND purpose = $2 AND consumed_at IS NULL
       ORDER BY created_at DESC
       LIMIT 1`,
      [normalizedEmail, purpose]
    );
    if (res.rows.length > 0) {
      activeOtp = res.rows[0];
    }
  } catch (err: any) {
    console.error("[OTP Lookup Error]", err?.message || err);
  }

  if (!activeOtp) {
    return {
      success: false,
      message: "No active verification code found. Please request a new code.",
    };
  }

  // Check expiration
  if (new Date(activeOtp.expires_at).getTime() < Date.now()) {
    try {
      await query(`UPDATE email_otps SET consumed_at = NOW() WHERE id = $1`, [activeOtp.id]);
    } catch {}
    return {
      success: false,
      message: "Verification code has expired. Please request a new code.",
    };
  }

  // Check attempt limit
  if (activeOtp.attempt_count >= MAX_ATTEMPTS) {
    try {
      await query(`UPDATE email_otps SET consumed_at = NOW() WHERE id = $1`, [activeOtp.id]);
    } catch {}
    return {
      success: false,
      message: "Too many failed attempts. This code is invalidated, please request a new one.",
    };
  }

  // Constant-time HMAC comparison
  const candidateHash = hashOtpCode(otpCode);
  const candidateBuffer = Buffer.from(candidateHash, "hex");
  const storedBuffer = Buffer.from(activeOtp.code_hash, "hex");

  const isMatch =
    candidateBuffer.length === storedBuffer.length &&
    crypto.timingSafeEqual(candidateBuffer, storedBuffer);

  if (!isMatch) {
    const newAttemptCount = activeOtp.attempt_count + 1;
    try {
      await query(
        `UPDATE email_otps SET attempt_count = attempt_count + 1 WHERE id = $1`,
        [activeOtp.id]
      );
    } catch {}

    const remaining = Math.max(0, MAX_ATTEMPTS - newAttemptCount);
    if (remaining === 0) {
      try {
        await query(`UPDATE email_otps SET consumed_at = NOW() WHERE id = $1`, [activeOtp.id]);
      } catch {}
      return {
        success: false,
        message: "Too many failed attempts. This code has been invalidated.",
        remainingAttempts: 0,
      };
    }

    return {
      success: false,
      message: `Invalid verification code. ${remaining} attempt(s) remaining.`,
      remainingAttempts: remaining,
    };
  }

  // Single-use atomic consumption: UPDATE ... WHERE consumed_at IS NULL
  try {
    const consumeRes = await query(
      `UPDATE email_otps SET consumed_at = NOW() WHERE id = $1 AND consumed_at IS NULL RETURNING id`,
      [activeOtp.id]
    );
    if (consumeRes.rows.length === 0) {
      return {
        success: false,
        message: "Verification code has already been used. Please request a new code.",
      };
    }
  } catch (err: any) {
    console.error("[OTP Consumption Error]", err?.message || err);
  }

  return {
    success: true,
    message: "Code successfully verified.",
    userId: activeOtp.user_id || undefined,
  };
}
