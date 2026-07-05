const rateLimit = new Map<string, { count: number; resetAt: number }>();
const LIMIT = 20; // requests per window
const WINDOW = 60 * 1000; // 1 minute

export function checkRateLimit(key: string, limit = LIMIT, windowMs = WINDOW): boolean {
  const now = Date.now();
  const entry = rateLimit.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimit.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}
