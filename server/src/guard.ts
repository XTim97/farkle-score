import type { Context, MiddlewareHandler } from "hono";
import { bodyLimit } from "hono/body-limit";

/** First hop of X-Forwarded-For (set by Caddy); "direct" in local dev. */
export function clientIp(c: Context): string {
  return c.req.header("x-forwarded-for")?.split(",")[0]?.trim() || "direct";
}

/**
 * Anonymous per-browser household id (random UUID minted by the client).
 * Players, games, stats, and custom rulesets are partitioned by it. An
 * absent or malformed id reads as empty: unknown callers see a blank app.
 */
export function clubOf(c: Context): string {
  const club = c.req.header("x-farkle-club")?.trim() ?? "";
  return /^[A-Za-z0-9-]{8,64}$/.test(club) ? club : "";
}

interface Bucket {
  tokens: number;
  last: number;
}
const buckets = new Map<string, Bucket>();

function take(key: string, perMinute: number, burst: number): boolean {
  const now = Date.now();
  const b = buckets.get(key) ?? { tokens: burst, last: now };
  b.tokens = Math.min(burst, b.tokens + ((now - b.last) / 60_000) * perMinute);
  b.last = now;
  buckets.set(key, b);
  if (b.tokens < 1) return false;
  b.tokens -= 1;
  return true;
}

setInterval(() => {
  const cutoff = Date.now() - 10 * 60_000;
  for (const [key, b] of buckets) if (b.last < cutoff) buckets.delete(key);
}, 60_000).unref();

/**
 * Lean per-IP rate limiting. Live-state pushes get their own generous bucket
 * so a fast scorer never stalls the leaderboard; other writes create rows in
 * SQLite and are tighter; reads are looser still.
 */
export const apiGuard: MiddlewareHandler = async (c, next) => {
  const ip = clientIp(c);
  const read = c.req.method === "GET" || c.req.method === "HEAD";
  const live = c.req.path.startsWith("/api/live");
  const ok = read
    ? take(`r:${ip}`, 600, 200)
    : live
      ? take(`l:${ip}`, 240, 80)
      : take(`w:${ip}`, 30, 15);
  if (!ok) return c.json({ error: "rate limited" }, 429);
  await next();
};

export const apiBodyLimit = bodyLimit({
  maxSize: 256 * 1024,
  onError: (c) => c.json({ error: "payload too large" }, 413)
});
