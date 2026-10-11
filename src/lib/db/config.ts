import fs from "fs";
import path from "path";

function loadEnvFiles() {
  if (process.env.DATABASE_URL) return;
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
  isProduction: boolean;
}

export function validateConfig(): AppDbConfig {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl || databaseUrl.trim() === "") {
    const errorMsg =
      "[Config Error] Missing required environment variable: DATABASE_URL. Please ensure DATABASE_URL is set.";
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  const isProduction = process.env.NODE_ENV === "production";
  const sessionSecret = process.env.SESSION_SECRET;

  if (!sessionSecret || sessionSecret.trim() === "") {
    if (isProduction) {
      const errorMsg =
        "[Config Error] Missing required environment variable: SESSION_SECRET (required in production mode).";
      console.error(errorMsg);
      throw new Error(errorMsg);
    } else {
      console.warn(
        "[Config Warning] Missing environment variable: SESSION_SECRET. Not configured in development mode."
      );
    }
  }

  return {
    databaseUrl,
    sessionSecret,
    isProduction,
  };
}

export const config = validateConfig();
