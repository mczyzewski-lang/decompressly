const hits = new Map<string, number[]>();

/**
 * Abuse guard per IP. A long guided session is generated paragraph by paragraph (60–120 requests in a
 * few minutes), so paid calls get a roomy limit; RATE_LIMIT_PER_MIN overrides it. Returns the seconds
 * to wait, or 0 when the request may go ahead.
 */
export function rateLimited(ip: string, limit: number, windowMs = 60_000, now = Date.now()): number {
  const arr = (hits.get(ip) ?? []).filter((t) => now - t < windowMs);
  if (arr.length >= limit) {
    hits.set(ip, arr);
    return Math.max(1, Math.ceil((arr[0] + windowMs - now) / 1000));
  }
  arr.push(now);
  hits.set(ip, arr);
  return 0;
}
