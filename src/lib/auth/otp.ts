import crypto from "crypto";
import { appStore } from "@/lib/db/store";
import { sendEmail } from "@/lib/email/sender";

export type OtpPurpose = "registration" | "login" | "verification" | "reset_password";

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
}

const OTP_LENGTH = 6;
const OTP_EXPIRES_MINUTES = 10;
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_ATTEMPTS = 5;

export function generateNumericOtp(length = OTP_LENGTH): string {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return crypto.randomInt(min, max + 1).toString();
}

export async function sendOtp(
  email: string,
  purpose: OtpPurpose = "registration"
): Promise<SendOtpResult> {
  const normalizedEmail = email.toLowerCase().trim();

  // If purpose is registration, ensure the email isn't already taken!
  if (purpose === "registration") {
    const existing = await appStore.getUserByEmail(normalizedEmail);
    if (existing) {
      return {
        success: false,
        message: "An account with this email address already exists.",
      };
    }
  }

  // Check rate limit / cooldown
  const activeOtp = await appStore.getLatestActiveOtp(normalizedEmail, purpose);
  if (activeOtp) {
    const elapsedSeconds = Math.floor((Date.now() - activeOtp.createdAt.getTime()) / 1000);
    if (elapsedSeconds < RESEND_COOLDOWN_SECONDS) {
      const remainingCooldown = RESEND_COOLDOWN_SECONDS - elapsedSeconds;
      return {
        success: false,
        cooldownSeconds: remainingCooldown,
        message: `Please wait ${remainingCooldown} seconds before requesting a new code.`,
      };
    }
  }

  // Generate code and save to DB
  const otpCode = generateNumericOtp(OTP_LENGTH);
  await appStore.createEmailOtp(normalizedEmail, otpCode, purpose, OTP_EXPIRES_MINUTES);

  // Send email dispatch
  const subjectMap: Record<OtpPurpose, string> = {
    registration: "Verify your email for Quro",
    verification: "Your Quro Verification Code",
    login: "Your Quro Login Code",
    reset_password: "Reset your Quro Password",
  };

  const emailResult = await sendEmail({
    to: normalizedEmail,
    subject: subjectMap[purpose] || "Your Quro Verification Code",
    text: `Your Quro verification code is: ${otpCode}\n\nThis code will expire in ${OTP_EXPIRES_MINUTES} minutes. If you did not request this, please ignore this email.`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <h2 style="color: #0f172a; margin-top: 0;">Verify your email</h2>
        <p style="color: #475569; font-size: 14px;">Use the following verification code to continue:</p>
        <div style="background-color: #f1f5f9; padding: 16px; border-radius: 8px; text-align: center; margin: 24px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #0284c7;">${otpCode}</span>
        </div>
        <p style="color: #64748b; font-size: 12px;">This code expires in ${OTP_EXPIRES_MINUTES} minutes. Do not share this code with anyone.</p>
      </div>
    `,
    otpCode,
  });

  return {
    success: true,
    message: `Verification code sent to ${normalizedEmail}`,
    devCode: emailResult.devCode,
  };
}

export async function verifyOtp(
  email: string,
  otpCode: string,
  purpose: OtpPurpose = "registration"
): Promise<VerifyOtpResult> {
  const normalizedEmail = email.toLowerCase().trim();
  const activeOtp = await appStore.getLatestActiveOtp(normalizedEmail, purpose);

  if (!activeOtp) {
    return {
      success: false,
      message: "No active verification code found. Please request a new code.",
    };
  }

  if (activeOtp.expiresAt.getTime() < Date.now()) {
    await appStore.markOtpConsumed(activeOtp.id);
    return {
      success: false,
      message: "Verification code has expired. Please request a new code.",
    };
  }

  if (activeOtp.attempts >= MAX_ATTEMPTS) {
    await appStore.markOtpConsumed(activeOtp.id);
    return {
      success: false,
      message: "Too many failed attempts. This code is invalidated, please request a new one.",
    };
  }

  if (activeOtp.otpCode.trim() !== otpCode.trim()) {
    const attempts = await appStore.recordOtpAttempt(activeOtp.id);
    const remaining = Math.max(0, MAX_ATTEMPTS - attempts);
    return {
      success: false,
      message: `Invalid verification code. ${remaining} attempt(s) remaining.`,
      remainingAttempts: remaining,
    };
  }

  // Mark consumed and update user if exists
  await appStore.markOtpConsumed(activeOtp.id);
  await appStore.setUserEmailVerified(normalizedEmail, true);

  return {
    success: true,
    message: "Email successfully verified.",
  };
}
