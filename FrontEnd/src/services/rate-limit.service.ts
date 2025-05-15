import { DistributedCacheService } from '../services/distributed-cache.service';

export class RateLimitService {
  private readonly cache: DistributedCacheService;
  private readonly maxRequests: number = 100;
  private readonly windowMs: number = 60000; // 1 minuto

  constructor() {
    this.cache = new DistributedCacheService();
  }

  async isRateLimited(key: string): Promise<{ limited: boolean; remaining: number }> {
    const requests = await this.cache.incr(key);
    
    if (requests === 1) {
      await this.cache.expire(key, Math.ceil(this.windowMs / 1000));
    }

    const remaining = Math.max(0, this.maxRequests - requests);
    const limited = requests > this.maxRequests;

    return { limited, remaining };
  }

  async getRateLimit(key: string): Promise<number> {
    const count = await this.cache.get<number>(key);
    return count || 0;
  }

  getHeaders(remaining: number): Record<string, string> {
    return {
      'X-RateLimit-Limit': String(this.maxRequests),
      'X-RateLimit-Remaining': String(remaining),
      'X-RateLimit-Reset': String(Date.now() + this.windowMs),
    };
  }
}
