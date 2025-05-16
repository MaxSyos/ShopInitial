import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../modules/redis/redis.service';
import { PrometheusService } from '../modules/prometheus/prometheus.service';

interface CacheOptions {
  ttl?: number;
  prefix?: string;
}

@Injectable()
export class DistributedCacheService {
  private readonly logger = new Logger(DistributedCacheService.name);
  private readonly defaultTTL = 3600; // 1 hora em segundos
  private readonly keyPrefix: string;

  constructor(
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
    private readonly prometheusService: PrometheusService,
  ) {
    this.keyPrefix = 'cache:';
  }

  async get<T>(key: string): Promise<T | null> {
    const startTime = Date.now();

    try {
      const cacheKey = `${this.keyPrefix}${key}`;
      const value = await this.redisService.get(cacheKey);

      if (!value) {
        this.prometheusService.incrementCacheMisses();
        this.prometheusService.observeCacheMissDuration(Date.now() - startTime);
        return null;
      }

      this.prometheusService.incrementCacheHits();
      this.prometheusService.observeCacheHitDuration(Date.now() - startTime);
      return JSON.parse(value) as T;
    } catch (error) {
      this.logger.error(`Erro ao recuperar do cache: ${error.message}`, error.stack);
      this.recordError('get', error.message);
      return null;
    }
  }

  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    const startTime = Date.now();

    try {
      const cacheKey = `${this.keyPrefix}${key}`;
      const ttl = options?.ttl || this.defaultTTL;
      await this.redisService.set(cacheKey, JSON.stringify(value), ttl);
      this.prometheusService.recordRedisOperation('set', Date.now() - startTime);
    } catch (error) {
      this.logger.error(`Erro ao definir no cache: ${error.message}`, error.stack);
      this.recordError('set', error.message);
    }
  }

  async del(key: string): Promise<void> {
    const startTime = Date.now();

    try {
      const cacheKey = `${this.keyPrefix}${key}`;
      await this.redisService.del(cacheKey);
      this.prometheusService.recordRedisOperation('del', Date.now() - startTime);
    } catch (error) {
      this.logger.error(`Erro ao excluir do cache: ${error.message}`, error.stack);
      this.recordError('del', error.message);
    }
  }

  async delByPattern(pattern: string): Promise<void> {
    const startTime = Date.now();

    try {
      const cachePattern = `${this.keyPrefix}${pattern}`;
      const keys = await this.redisService.keys(cachePattern);
      
      if (keys.length > 0) {
        await Promise.all(keys.map(key => this.redisService.del(key)));
      }

      this.prometheusService.recordRedisOperation('delByPattern', Date.now() - startTime);
    } catch (error) {
      this.logger.error(`Erro ao excluir por padrão do cache: ${error.message}`, error.stack);
      this.recordError('delByPattern', error.message);
    }
  }

  async clearAllCache(): Promise<void> {
    const startTime = Date.now();

    try {
      const pattern = `${this.keyPrefix}*`;
      const keys = await this.redisService.keys(pattern);
      
      if (keys.length > 0) {
        await Promise.all(keys.map(key => this.redisService.del(key)));
      }

      this.prometheusService.recordRedisOperation('clearAll', Date.now() - startTime);
    } catch (error) {
      this.logger.error(`Erro ao limpar todo o cache: ${error.message}`, error.stack);
      this.recordError('clearAll', error.message);
    }
  }

  private recordError(operation: string, errorMessage: string): void {
    this.prometheusService.incrementCacheErrors();
    this.logger.error(`Operação ${operation} falhou: ${errorMessage}`);
  }
}
