import { query } from "@/lib/db/pool";

interface MemoryRateLimitEntry {
  windowStart: number;
  count: number;
}

const memoryRateLimitStore = new Map<string, MemoryRateLimitEntry>();

export interface RateLimitResult {
  allowed: boolean;
  count: number;
  remaining: number;
  resetSeconds: number;
}

/**
 * Checks and increments rate limit counter.
 * Uses PostgreSQL rate_limits table if available; falls back to in-memory map.
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  try {
    // Attempt DB rate limiting
    const windowStartBoundary = new Date(now - windowMs);
    
    // Check existing
    const res = await query(
      `SELECT count, window_start FROM rate_limits WHERE key = $1`,
      [key]
    );

    if (res.rows.length === 0) {
      // Create new window
      await query(
        `INSERT INTO rate_limits (key, window_start, count) VALUES ($1, NOW(), 1)
         ON CONFLICT (key) DO UPDATE SET count = 1, window_start = NOW()`,
        [key]
      );
      return {
        allowed: true,
        count: 1,
        remaining: limit - 1,
        resetSeconds: windowSeconds,
      };
    }

    const row = res.rows[0];
    const rowWindowStart = new Date(row.window_start).getTime();

    if (rowWindowStart < windowStartBoundary.getTime()) {
      // Window expired, reset window
      await query(
        `UPDATE rate_limits SET count = 1, window_start = NOW() WHERE key = $1`,
        [key]
      );
      return {
        allowed: true,
        count: 1,
        remaining: limit - 1,
        resetSeconds: windowSeconds,
      };
    }

    // Within active window
    const newCount = row.count + 1;
    const remainingTime = Math.max(1, Math.ceil((rowWindowStart + windowMs - now) / 1000));

    if (newCount > limit) {
      return {
        allowed: false,
        count: row.count,
        remaining: 0,
        resetSeconds: remainingTime,
      };
    }

    await query(
      `UPDATE rate_limits SET count = count + 1 WHERE key = $1`,
      [key]
    );

    return {
      allowed: true,
      count: newCount,
      remaining: Math.max(0, limit - newCount),
      resetSeconds: remainingTime,
    };
  } catch {
    // In-memory fallback
    const entry = memoryRateLimitStore.get(key);
    if (!entry || now - entry.windowStart > windowMs) {
      memoryRateLimitStore.set(key, { windowStart: now, count: 1 });
      return {
        allowed: true,
        count: 1,
        remaining: limit - 1,
        resetSeconds: windowSeconds,
      };
    }

    if (entry.count >= limit) {
      const remainingTime = Math.max(1, Math.ceil((entry.windowStart + windowMs - now) / 1000));
      return {
        allowed: false,
        count: entry.count,
        remaining: 0,
        resetSeconds: remainingTime,
      };
    }

    entry.count += 1;
    const remainingTime = Math.max(1, Math.ceil((entry.windowStart + windowMs - now) / 1000));
    return {
      allowed: true,
      count: entry.count,
      remaining: limit - entry.count,
      resetSeconds: remainingTime,
    };
  }
}
