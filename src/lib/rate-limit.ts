/**
 * Simple in-memory rate limiter for API routes.
 * In production with multiple instances, use Redis instead.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt < now) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

interface RateLimitConfig {
  /** Max requests allowed in the window */
  limit: number;
  /** Window duration in seconds */
  windowSeconds: number;
}

const PRESETS: Record<string, RateLimitConfig> = {
  login: { limit: 5, windowSeconds: 60 },
  search: { limit: 100, windowSeconds: 60 },
  crud: { limit: 60, windowSeconds: 60 },
  reports: { limit: 10, windowSeconds: 60 },
  exports: { limit: 5, windowSeconds: 60 },
};

export function rateLimit(
  identifier: string,
  preset: keyof typeof PRESETS = "crud"
): { allowed: boolean; remaining: number; resetIn: number } {
  const config = PRESETS[preset];
  const now = Date.now();
  const key = `${preset}:${identifier}`;

  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + config.windowSeconds * 1000 });
    return { allowed: true, remaining: config.limit - 1, resetIn: config.windowSeconds };
  }

  entry.count++;
  const remaining = Math.max(0, config.limit - entry.count);
  const resetIn = Math.ceil((entry.resetAt - now) / 1000);

  if (entry.count > config.limit) {
    return { allowed: false, remaining: 0, resetIn };
  }

  return { allowed: true, remaining, resetIn };
}
