export const RESERVED_USER_IDS = new Set([
  "admin",
  "administrator",
  "root",
  "system",
  "support",
  "quro",
  "moderator",
  "mod",
  "help",
  "api",
  "null",
  "undefined",
  "guest",
  "anonymous",
  "superuser",
  "security",
  "staff",
  "team",
  "billing",
  "auth",
  "login",
  "register",
  "dashboard",
  "playground",
  "practice",
  "topics",
]);

const COMMON_PASSWORDS = new Set([
  "password",
  "12345678",
  "123456789",
  "1234567890",
  "qwertyui",
  "qwertyuiop",
  "password123",
  "admin123",
  "secret12",
  "welcome1",
  "letmein1",
  "iloveyou",
  "pass1234",
  "password1",
  "monkey12",
  "dragon12",
  "sunshine",
  "princess",
  "football",
]);

/**
 * Normalizes email: trims whitespace and converts to lower case.
 * Does NOT strip dots or plus tags (+tag) by default to preserve standard RFC 5322 semantics.
 */
export function normalizeEmail(email: string): string {
  if (!email) return "";
  return email.trim().toLowerCase();
}

/**
 * Normalizes user ID: trims whitespace and converts to lower case.
 */
export function normalizeUserId(userId: string): string {
  if (!userId) return "";
  return userId.trim().toLowerCase();
}

/**
 * Validates user ID rules:
 * - 3 to 30 characters
 * - Alphanumeric, underscores, and hyphens only
 * - Not in reserved names list
 */
export function validateUserId(userId: string): { valid: boolean; error?: string } {
  const trimmed = userId ? userId.trim() : "";
  if (!trimmed) {
    return { valid: false, error: "Username is required." };
  }
  if (trimmed.length < 3 || trimmed.length > 30) {
    return { valid: false, error: "Username must be between 3 and 30 characters." };
  }
  const allowedPattern = /^[a-zA-Z0-9_-]+$/;
  if (!allowedPattern.test(trimmed)) {
    return {
      valid: false,
      error: "Username may only contain letters, numbers, underscores, and hyphens.",
    };
  }
  const normalized = normalizeUserId(trimmed);
  if (RESERVED_USER_IDS.has(normalized)) {
    return {
      valid: false,
      error: `The username '${trimmed}' is reserved. Please choose another username.`,
    };
  }
  return { valid: true };
}

/**
 * Validates password strength:
 * - Minimum 8 characters
 * - Blocks commonly used, easily guessable passwords
 */
export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password || password.length < 8) {
    return { valid: false, error: "Password must be at least 8 characters long." };
  }
  const lower = password.toLowerCase();
  if (COMMON_PASSWORDS.has(lower)) {
    return { valid: false, error: "This password is too common and easily guessed. Please choose a stronger password." };
  }
  return { valid: true };
}
