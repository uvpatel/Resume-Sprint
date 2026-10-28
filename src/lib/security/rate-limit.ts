interface RateLimitBucket {
  tokens: number;
  lastRefill: number;
}

class RateLimiter {
  private buckets = new Map<string, RateLimitBucket>();
  private maxTokens: number;
  private refillIntervalMs: number;

  constructor(maxTokens = 20, refillIntervalMs = 60000) {
    this.maxTokens = maxTokens;
    this.refillIntervalMs = refillIntervalMs;
  }

  public check(key: string, cost = 1): { allowed: boolean; retryAfterSeconds?: number } {
    const now = Date.now();
    let bucket = this.buckets.get(key);

    if (!bucket) {
      bucket = { tokens: this.maxTokens, lastRefill: now };
      this.buckets.set(key, bucket);
    } else {
      // Refill tokens based on elapsed time
      const elapsed = now - bucket.lastRefill;
      const tokensToAdd = Math.floor((elapsed / this.refillIntervalMs) * this.maxTokens);
      if (tokensToAdd > 0) {
        bucket.tokens = Math.min(this.maxTokens, bucket.tokens + tokensToAdd);
        bucket.lastRefill = now;
      }
    }

    if (bucket.tokens >= cost) {
      bucket.tokens -= cost;
      return { allowed: true };
    }

    const waitMs = this.refillIntervalMs - (now - bucket.lastRefill);
    const retryAfterSeconds = Math.max(1, Math.ceil(waitMs / 1000));
    return { allowed: false, retryAfterSeconds };
  }

  public reset(key?: string): void {
    if (key) {
      this.buckets.delete(key);
    } else {
      this.buckets.clear();
    }
  }
}

// Global singletons for sensitive actions
export const proposalRateLimiter = new RateLimiter(15, 60000); // 15 calls / minute
export const rescoreRateLimiter = new RateLimiter(10, 60000);  // 10 calls / minute
export const exportRateLimiter = new RateLimiter(10, 60000);   // 10 calls / minute
