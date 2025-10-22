import { db } from "./db";

type BucketResult = {
  allowed: boolean;
  remaining: number;
  retryAfter: number;
};

export interface RateLimiter {
  hit(key: string): Promise<BucketResult> | BucketResult;
}

export class PrismaRateLimiter implements RateLimiter {
  constructor(private readonly windowMs: number, private readonly maxAttempts: number) {}

  async hit(key: string): Promise<BucketResult> {
    const now = new Date();
    const bucket = await db.rateLimit.findUnique({ where: { key } });

    if (!bucket || bucket.expiresAt <= now) {
      await db.rateLimit.upsert({
        where: { key },
        create: {
          key,
          count: 1,
          expiresAt: new Date(now.getTime() + this.windowMs),
        },
        update: {
          count: 1,
          expiresAt: new Date(now.getTime() + this.windowMs),
        },
      });
      return { allowed: true, remaining: this.maxAttempts - 1, retryAfter: 0 };
    }

    if (bucket.count >= this.maxAttempts) {
      return {
        allowed: false,
        remaining: 0,
        retryAfter: Math.max(0, bucket.expiresAt.getTime() - now.getTime()),
      };
    }

    await db.rateLimit.update({
      where: { key },
      data: { count: { increment: 1 } },
    });

    return {
      allowed: true,
      remaining: this.maxAttempts - (bucket.count + 1),
      retryAfter: 0,
    };
  }
}

// Fallback in-memory limiter (useful for tests or local dev)
type MemoryBucket = {
  count: number;
  expiresAt: number;
};

export class MemoryRateLimiter implements RateLimiter {
  private readonly buckets = new Map<string, MemoryBucket>();

  constructor(private readonly windowMs: number, private readonly maxAttempts: number) {}

  hit(key: string): BucketResult {
    const now = Date.now();
    const bucket = this.buckets.get(key);

    if (!bucket || bucket.expiresAt <= now) {
      this.buckets.set(key, { count: 1, expiresAt: now + this.windowMs });
      return { allowed: true, remaining: this.maxAttempts - 1, retryAfter: 0 };
    }

    if (bucket.count >= this.maxAttempts) {
      return { allowed: false, remaining: 0, retryAfter: bucket.expiresAt - now };
    }

    bucket.count += 1;
    this.buckets.set(key, bucket);

    return { allowed: true, remaining: this.maxAttempts - bucket.count, retryAfter: 0 };
  }
}
