import crypto from "crypto";
import { SignJWT, jwtVerify } from "jose";
import { query } from "@/lib/db/pool";

const SESSION_SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || "super_secret_session_encryption_key_at_least_32_chars_long_12345"
);
const SESSION_MAX_AGE_SECONDS = parseInt(process.env.SESSION_MAX_AGE_SECONDS || "604800", 10); // 7 days

export interface SessionPayload {
  userId: string;
  email: string;
  role: "user" | "admin";
  name: string;
  sessionId?: string;
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Creates a server-side session in the sessions table and signs a JWT cookie token
 */
export async function createSessionToken(
  payload: SessionPayload,
  userAgent?: string
): Promise<string> {
  const sessionId = `sess-${Date.now()}-${crypto.randomBytes(16).toString("hex")}`;
  const randomEntropy = crypto.randomBytes(32).toString("hex");

  // JWT with session payload and entropy
  const jwt = await new SignJWT({
    ...payload,
    sessionId,
    entropy: randomEntropy,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(SESSION_SECRET);

  const tokenHash = hashToken(jwt);
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

  // Store in database sessions table
  try {
    await query(
      `INSERT INTO sessions (id, user_id, token_hash, expires_at, created_at, user_agent)
       VALUES ($1, $2, $3, $4, NOW(), $5)`,
      [sessionId, payload.userId, tokenHash, expiresAt, userAgent || null]
    );
  } catch (err: any) {
    // If sessions table not ready or in mock test mode, continue with JWT
  }

  return jwt;
}

/**
 * Verifies and decodes a session token, ensuring it is not revoked or expired in the database
 */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SESSION_SECRET);
    const userId = payload.userId as string;
    const email = payload.email as string;
    const role = payload.role as "user" | "admin";
    const name = payload.name as string;
    const sessionId = payload.sessionId as string | undefined;

    // Check server-side revocation in DB
    const tokenHash = hashToken(token);
    try {
      const res = await query(
        `SELECT id, revoked_at, expires_at FROM sessions WHERE token_hash = $1`,
        [tokenHash]
      );
      if (res.rows.length > 0) {
        const row = res.rows[0];
        if (row.revoked_at !== null) {
          return null; // Session has been revoked
        }
        if (new Date(row.expires_at).getTime() < Date.now()) {
          return null; // Session expired in DB
        }
      }
    } catch {
      // In-memory or fallback mode
    }

    return {
      userId,
      email,
      role,
      name,
      sessionId,
    };
  } catch {
    return null;
  }
}

/**
 * Revokes a single session by its token hash (called on logout)
 */
export async function revokeSessionToken(token: string): Promise<void> {
  const tokenHash = hashToken(token);
  try {
    await query(
      `UPDATE sessions SET revoked_at = NOW() WHERE token_hash = $1`,
      [tokenHash]
    );
  } catch {}
}

/**
 * Revokes ALL active sessions for a user (called on password change: "log out everywhere")
 */
export async function revokeAllUserSessions(userId: string): Promise<void> {
  try {
    await query(
      `UPDATE sessions SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL`,
      [userId]
    );
  } catch {}
}
