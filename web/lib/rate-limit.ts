const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 30;

type Bucket = {
  count: number;
  windowStart: number;
};

const buckets: Record<string, Bucket> = {};

export function isRateLimited(identifier: string): boolean {
  const now = Date.now();
  const key = identifier || "unknown";
  const bucket = buckets[key];

  if (!bucket) {
    buckets[key] = { count: 1, windowStart: now };
    return false;
  }

  if (now - bucket.windowStart > WINDOW_MS) {
    buckets[key] = { count: 1, windowStart: now };
    return false;
  }

  bucket.count += 1;
  if (bucket.count > MAX_REQUESTS_PER_WINDOW) {
    return true;
  }

  return false;
}

