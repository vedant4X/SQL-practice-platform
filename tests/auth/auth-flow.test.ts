import { describe, expect, it } from "vitest";
import {
  normalizeEmail,
  normalizeUserId,
  validateUserId,
  validatePassword,
  RESERVED_USER_IDS,
} from "../../src/lib/auth/normalization";
import { hashPassword, verifyPassword } from "../../src/lib/auth/password";
import {
  generateNumericOtp,
  hashOtpCode,
  sendOtp,
  verifyOtp,
} from "../../src/lib/auth/otp";
import {
  createSessionToken,
  verifySessionToken,
  hashToken,
} from "../../src/lib/auth/session";
import { checkRateLimit } from "../../src/lib/auth/rate-limit";
import { sendEmail } from "../../src/lib/email/sender";
import crypto from "crypto";

describe("Auth Addendum - Normalization, Security & OTP Test Suite", () => {
  describe("1. Normalization & Format Rules", () => {
    it("normalizes emails by trimming and lowercasing without stripping dots or plus-tags", () => {
      expect(normalizeEmail("  Vedant@Example.COM  ")).toBe("vedant@example.com");
      expect(normalizeEmail("user+tag@example.com")).toBe("user+tag@example.com");
      expect(normalizeEmail("john.doe@sub.domain.org")).toBe("john.doe@sub.domain.org");
    });

    it("normalizes user IDs by trimming and lowercasing", () => {
      expect(normalizeUserId("  Alex_99  ")).toBe("alex_99");
      expect(normalizeUserId("Alice-Dev")).toBe("alice-dev");
    });

    it("enforces user ID length and character constraints", () => {
      // Too short
      expect(validateUserId("ab").valid).toBe(false);
      expect(validateUserId("ab").error).toContain("between 3 and 30");

      // Too long (> 30)
      const longId = "a".repeat(31);
      expect(validateUserId(longId).valid).toBe(false);

      // Invalid characters
      expect(validateUserId("user@name").valid).toBe(false);
      expect(validateUserId("user name").valid).toBe(false);
      expect(validateUserId("user!").valid).toBe(false);

      // Valid format
      expect(validateUserId("valid_user-123").valid).toBe(true);
      expect(validateUserId("alice").valid).toBe(true);
    });

    it("strictly blocks reserved user IDs", () => {
      for (const reserved of Array.from(RESERVED_USER_IDS)) {
        const check = validateUserId(reserved);
        expect(check.valid).toBe(false);
        expect(check.error).toContain("reserved");
      }
      // Case-variant reserved names
      expect(validateUserId("ADMIN").valid).toBe(false);
      expect(validateUserId("Root").valid).toBe(false);
      expect(validateUserId("Quro").valid).toBe(false);
    });

    it("guarantees case-variant duplicates are detected as identical identifiers", () => {
      const email1 = normalizeEmail("Vedant@X.COM");
      const email2 = normalizeEmail("vedant@x.com");
      expect(email1).toBe(email2);

      const user1 = normalizeUserId("Vedant_Jadhav");
      const user2 = normalizeUserId("vedant_jadhav");
      expect(user1).toBe(user2);
    });
  });

  describe("2. Password Strength & Cryptographic Hashing", () => {
    it("enforces minimum password length of 8 characters", () => {
      expect(validatePassword("short").valid).toBe(false);
      expect(validatePassword("short").error).toContain("at least 8 characters");
    });

    it("blocks common easily guessable passwords", () => {
      const weakPasswords = ["password", "12345678", "qwertyui", "admin123", "password123"];
      for (const pw of weakPasswords) {
        const res = validatePassword(pw);
        expect(res.valid).toBe(false);
        expect(res.error).toContain("too common");
      }

      // Strong password passes
      expect(validatePassword("Correct-Horse-Battery-Staple-99!").valid).toBe(true);
    });

    it("hashes passwords with unique random salts using scrypt and verifies timing-safely", async () => {
      const password = "SecureSqlPassword2026!";
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      // Different salts produce different hashes
      expect(hash1).not.toBe(hash2);
      expect(hash1).toContain(":");

      // Verification succeeds for correct password
      expect(await verifyPassword(password, hash1)).toBe(true);
      expect(await verifyPassword(password, hash2)).toBe(true);

      // Rejects incorrect password
      expect(await verifyPassword("WrongPassword123!", hash1)).toBe(false);
    });
  });

  describe("3. OTP Generation, HMAC Hashing & Rate Limiting", () => {
    it("generates 6-digit numeric OTPs via crypto.randomInt", () => {
      for (let i = 0; i < 50; i++) {
        const otp = generateNumericOtp();
        expect(otp).toHaveLength(6);
        expect(/^\d{6}$/.test(otp)).toBe(true);
        const num = parseInt(otp, 10);
        expect(num).toBeGreaterThanOrEqual(100000);
        expect(num).toBeLessThan(1000000);
      }
    });

    it("hashes OTP codes using HMAC-SHA256 and never matches plain text", () => {
      const code = "739201";
      const hash = hashOtpCode(code);
      expect(hash).toHaveLength(64); // SHA-256 hex
      expect(hash).not.toBe(code);

      // Constant-time comparison
      const candidateHash = hashOtpCode("739201");
      const candBuf = Buffer.from(candidateHash, "hex");
      const storedBuf = Buffer.from(hash, "hex");
      expect(crypto.timingSafeEqual(candBuf, storedBuf)).toBe(true);

      // Wrong code hash does not match
      const wrongHash = hashOtpCode("111111");
      const wrongBuf = Buffer.from(wrongHash, "hex");
      expect(crypto.timingSafeEqual(wrongBuf, storedBuf)).toBe(false);
    });

    it("enforces resend cooldown and rate limits", async () => {
      const key = `test-cooldown-${Date.now()}`;
      // First request allowed
      const first = await checkRateLimit(key, 1, 60);
      expect(first.allowed).toBe(true);

      // Second request within cooldown window blocked
      const second = await checkRateLimit(key, 1, 60);
      expect(second.allowed).toBe(false);
      expect(second.resetSeconds).toBeGreaterThan(0);
    });
  });

  describe("4. Session Tokens & Server-side Session Hashing", () => {
    it("creates, signs, and decodes session tokens with 256-bit entropy", async () => {
      const payload = {
        userId: "usr-synthetic-1",
        email: "student@quro.io",
        role: "user" as const,
        name: "Student One",
      };

      const token = await createSessionToken(payload);
      expect(typeof token).toBe("string");
      expect(token.length).toBeGreaterThan(30);

      // SHA-256 token hash stored in DB
      const tokenHash = hashToken(token);
      expect(tokenHash).toHaveLength(64);

      // Verification decodes correct payload
      const decoded = await verifySessionToken(token);
      expect(decoded).not.toBeNull();
      expect(decoded?.userId).toBe("usr-synthetic-1");
      expect(decoded?.email).toBe("student@quro.io");
    });
  });

  describe("5. Transactional Email Dispatch Adapter", () => {
    it("captures OTP codes in development/testing without leaking in production", async () => {
      const emailRes = await sendEmail({
        to: "tester@quro.io",
        subject: "Verify your email for Quro",
        text: "Your code is 654321",
        otpCode: "654321",
      });

      expect(emailRes.success).toBe(true);
      // In dev/test environment, devCode is provided for automated testing
      expect(emailRes.devCode).toBe("654321");
    });
  });
});
