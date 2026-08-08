/**
 * Rate limiting with an optional distributed backend.
 *
 * Audit fix 1.9 — the original implementation used a module-level Map. On
 * Vercel each request may hit a different lambda instance, and instances cold
 * start constantly, so the limit was effectively unenforced: an attacker just
 * had to spread requests across instances. The file's own comment conceded
 * this.
 *
 * Behaviour now:
 *  - If UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are set, limits are
 *    enforced globally through Upstash's REST API (no extra dependency — it is
 *    a plain fetch, so nothing is added to the bundle).
 *  - Otherwise it falls back to the in-memory limiter, which still stops
 *    trivial floods within a single instance and keeps local development
 *    working without any Redis.
 *
 * The synchronous rateLimit() is preserved so existing call sites keep
 * compiling; new async code should prefer rateLimitAsync().
 */

const buckets = new Map<string, number[]>();

/** Synchronous, per-instance limiter. Best-effort only. */
export function rateLimit(key: string, limit = 10, windowMs = 60_000): boolean {
  const now = Date.now();
  const hits = (buckets.get(key) || []).filter((t) => now - t < windowMs);

  if (hits.length >= limit) {
    buckets.set(key, hits);
    return false;
  }

  hits.push(now);
  buckets.set(key, hits);

  if (buckets.size > 5000) {
    for (const [k, v] of buckets) {
      if (v.every((t) => now - t > windowMs)) buckets.delete(k);
    }
  }
  return true;
}

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

export const hasDistributedRateLimit = Boolean(REDIS_URL && REDIS_TOKEN);

/**
 * Distributed sliding-window limiter backed by Upstash, with automatic
 * fallback to the in-memory limiter.
 *
 * Uses INCR + EXPIRE, which is atomic and sufficient for abuse prevention.
 */
export async function rateLimitAsync(
  key: string,
  limit = 10,
  windowMs = 60_000
): Promise<boolean> {
  if (!hasDistributedRateLimit) return rateLimit(key, limit, windowMs);

  const windowSeconds = Math.ceil(windowMs / 1000);
  // Bucket by window so counters reset predictably.
  const bucket = Math.floor(Date.now() / windowMs);
  const redisKey = `cah:rl:${key}:${bucket}`;

  try {
    const res = await fetch(`${REDIS_URL}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${REDIS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        ['INCR', redisKey],
        ['EXPIRE', redisKey, String(windowSeconds)],
      ]),
      signal: AbortSignal.timeout(2000),
    });

    if (!res.ok) return rateLimit(key, limit, windowMs);

    const data = (await res.json()) as { result: number }[];
    const count = Number(data?.[0]?.result ?? 0);
    return count <= limit;
  } catch {
    // Never let the limiter's own failure take down the endpoint.
    return rateLimit(key, limit, windowMs);
  }
}

export function clientIp(request: Request): string {
  const h = (name: string) => request.headers.get(name) || '';
  return h('x-forwarded-for').split(',')[0].trim() || h('x-real-ip') || 'anon';
}
