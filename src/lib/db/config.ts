import fs from "fs";
import path from "path";

function loadEnvFiles() {
  const envFiles = [".env.local", ".env"];
  for (const file of envFiles) {
    const fullPath = path.resolve(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      try {
        const content = fs.readFileSync(fullPath, "utf-8");
        for (const line of content.split("\n")) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith("#")) continue;
          const eqIdx = trimmed.indexOf("=");
          if (eqIdx > 0) {
            const key = trimmed.substring(0, eqIdx).trim();
            const val = trimmed.substring(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
            if (key && !(key in process.env)) {
              process.env[key] = val;
            }
          }
        }
      } catch {
        // ignore
      }
    }
  }
}

loadEnvFiles();

export interface AppDbConfig {
  databaseUrl: string;
  sessionSecret?: string;
  otpHmacSecret?: string;
  cronSecret?: string;
  emailProvider?: string;
  emailApiKey?: string;
  emailFrom?: string;
  appBaseUrl?: string;
  isProduction: boolean;
}

let cachedConfig: AppDbConfig | null = null;

export function validateConfig(): AppDbConfig {
  if (cachedConfig) return cachedConfig;

  loadEnvFiles();
  const isProduction = process.env.NODE_ENV === "production";
  const missingRequired: string[] = [];
  const missingRecommended: string[] = [];

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl || databaseUrl.trim() === "") {
    missingRequired.push("DATABASE_URL");
  }

  const sessionSecret = process.env.SESSION_SECRET || "super_secret_session_encryption_key_at_least_32_chars_long_12345";
  if (!process.env.SESSION_SECRET) {
    missingRecommended.push("SESSION_SECRET");
  }

  const otpHmacSecret = process.env.OTP_HMAC_SECRET || process.env.SESSION_SECRET || "default_otp_hmac_secret_for_development_and_testing";
  if (!process.env.OTP_HMAC_SECRET) {
    missingRecommended.push("OTP_HMAC_SECRET");
  }

  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || cronSecret.trim() === "") {
    missingRecommended.push("CRON_SECRET");
  }

  if (missingRecommended.length > 0) {
    console.warn(
      `[Config Warning] The following optional environment variables are not configured: ${missingRecommended.join(
        ", "
      )}`
    );
  }

  if (missingRequired.length > 0) {
    const errorMsg = `[Config Error] Missing required environment variable(s): ${missingRequired.join(
      ", "
    )}. Please configure them in your environment or .env.local file.`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  cachedConfig = {
    databaseUrl: databaseUrl!,
    sessionSecret,
    otpHmacSecret,
    cronSecret,
    emailProvider: process.env.EMAIL_PROVIDER,
    emailApiKey: process.env.EMAIL_API_KEY,
    emailFrom: process.env.EMAIL_FROM,
    appBaseUrl: process.env.APP_BASE_URL,
    isProduction,
  };

  return cachedConfig;
}

export function getConfig(): AppDbConfig {
  return validateConfig();
}
