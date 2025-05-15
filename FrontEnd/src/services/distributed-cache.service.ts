import Redis from 'ioredis';
import { redisConfig } from '../config/redis.config';

export class DistributedCacheService {
  private readonly redis: Redis;
  private readonly defaultTTL: number = 3600; // 1 hora

  constructor() {
    this.redis = new Redis(redisConfig);
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.redis.get(key);
    if (!value) return null;
    return JSON.parse(value);
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const stringValue = JSON.stringify(value);
    if (ttl) {
      await this.redis.setex(key, ttl, stringValue);
    } else {
      await this.redis.setex(key, this.defaultTTL, stringValue);
    }
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async delByPattern(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  async incr(key: string): Promise<number> {
    return await this.redis.incr(key);
  }

  async expire(key: string, ttl: number): Promise<boolean> {
    return await this.redis.expire(key, ttl) === 1;
  }
}
