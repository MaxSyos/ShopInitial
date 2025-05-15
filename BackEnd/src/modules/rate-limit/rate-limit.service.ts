import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';
import { PrometheusService } from '../prometheus/prometheus.service';

@Injectable()
export class RateLimitService {
  private readonly RATE_LIMIT_PREFIX = 'ratelimit:';
  private readonly defaultTTL: number;
  private readonly defaultLimit: number;

  constructor(
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
    private readonly prometheusService: PrometheusService,
  ) {
    this.defaultTTL = this.configService.get('RATE_LIMIT_TTL', 60); // 60 segundos
    this.defaultLimit = this.configService.get('RATE_LIMIT_MAX', 100); // 100 requisições
  }

  private getKey(identifier: string, route: string): string {
    return `${this.RATE_LIMIT_PREFIX}${identifier}:${route}`;
  }

  async checkRateLimit(
    identifier: string,
    route: string,
    limit?: number,
    ttl?: number,
  ): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
  }> {
    const startTime = Date.now();
    const key = this.getKey(identifier, route);
    
    try {
      const current = await this.redisService.get(key);
      const currentCount = current ? parseInt(current, 10) : 0;
      const maxLimit = limit || this.defaultLimit;
      const timeWindow = ttl || this.defaultTTL;

      if (currentCount >= maxLimit) {
        this.recordMetrics('blocked', startTime);
        return {
          allowed: false,
          remaining: 0,
          resetTime: timeWindow,
        };
      }

      // Incrementa o contador
      await this.redisService.set(
        key,
        (currentCount + 1).toString(),
        timeWindow,
      );

      this.recordMetrics('allowed', startTime);
      return {
        allowed: true,
        remaining: maxLimit - (currentCount + 1),
        resetTime: timeWindow,
      };
    } catch (error) {
      // Em caso de erro, permite a requisição mas registra o erro
      this.prometheusService.incrementOrderProcessingError(
        'rate_limit',
        error.message,
      );
      
      return {
        allowed: true,
        remaining: 0,
        resetTime: 0,
      };
    }
  }

  async resetLimit(identifier: string, route: string): Promise<void> {
    const key = this.getKey(identifier, route);
    await this.redisService.del(key);
  }

  async getRemainingLimit(
    identifier: string,
    route: string,
    limit?: number,
  ): Promise<number> {
    const key = this.getKey(identifier, route);
    const current = await this.redisService.get(key);
    const maxLimit = limit || this.defaultLimit;

    return current ? maxLimit - parseInt(current, 10) : maxLimit;
  }

  private recordMetrics(type: 'allowed' | 'blocked', startTime: number): void {
    const duration = Date.now() - startTime;
    
    this.prometheusService.recordDatabaseQueryDuration(
      'rate_limit',
      type,
      duration,
    );

    if (type === 'blocked') {
      this.prometheusService.incrementOrderProcessingError(
        'rate_limit',
        'limit_exceeded',
      );
    }
  }
}
