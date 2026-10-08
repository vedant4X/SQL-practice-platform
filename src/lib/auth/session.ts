import { SignJWT, jwtVerify } from "jose";

const SESSION_SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || "super_secret_session_encryption_key_at_least_32_chars_long_12345"
);
const SESSION_MAX_AGE_SECONDS = parseInt(process.env.SESSION_MAX_AGE_SECONDS || "604800", 10); // 7 days

export interface SessionPayload {
  userId: string;
  email: string;
  role: "user" | "admin";
  name: string;
}

/**
 * Creates a signed JWT session token
 */
export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(SESSION_SECRET);
}

/**
 * Verifies and decodes a session token
 */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SESSION_SECRET);
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      role: payload.role as "user" | "admin",
      name: payload.name as string,
    };
  } catch {
    return null;
  }
}
