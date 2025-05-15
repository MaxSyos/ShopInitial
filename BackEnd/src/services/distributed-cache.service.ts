import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../modules/redis/redis.service';
import { PrometheusService } from '../modules/prometheus/prometheus.service';

interface CacheOptions {
  ttl?: number;
  tags?: string[];
  invalidateOnUpdate?: boolean;
}

@Injectable()
export class DistributedCacheService {
  private readonly logger = new Logger(DistributedCacheService.name);
  private readonly defaultTTL: number;

  constructor(
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
    private readonly prometheusService: PrometheusService,
  ) {
    this.defaultTTL = this.configService.get('REDIS_CACHE_TTL', 300); // 5 minutos
  }

  private getCacheKey(key: string): string {
    return `cache:data:${key}`;
  }

  private getTagKey(tag: string): string {
    return `cache:tag:${tag}`;
  }

  async get<T>(key: string): Promise<T | null> {
    const startTime = Date.now();
    const cacheKey = this.getCacheKey(key);

    try {
      const cachedData = await this.redisService.get(cacheKey);
      
      if (cachedData) {
        this.recordMetrics('hit', Date.now() - startTime);
        return JSON.parse(cachedData);
      }

      this.recordMetrics('miss', Date.now() - startTime);
      return null;
    } catch (error) {
      this.logger.error(`Erro ao buscar cache: ${error.message}`, error.stack);
      this.recordError('get', error.message);
      return null;
    }
  }

  async set<T>(
    key: string,
    value: T,
    options: CacheOptions = {},
  ): Promise<void> {
    const startTime = Date.now();
    const cacheKey = this.getCacheKey(key);

    try {
      const ttl = options.ttl || this.defaultTTL;
      await this.redisService.set(
        cacheKey,
        JSON.stringify(value),
        ttl,
      );

      // Se houver tags, associa o cache a elas
      if (options.tags?.length) {
        await this.associateTagsToKey(cacheKey, options.tags);
      }

      this.recordMetrics('set', Date.now() - startTime);
    } catch (error) {
      this.logger.error(`Erro ao definir cache: ${error.message}`, error.stack);
      this.recordError('set', error.message);
    }
  }

  async invalidate(key: string): Promise<void> {
    const startTime = Date.now();
    const cacheKey = this.getCacheKey(key);

    try {
      await this.redisService.del(cacheKey);
      this.recordMetrics('invalidate', Date.now() - startTime);
    } catch (error) {
      this.logger.error(`Erro ao invalidar cache: ${error.message}`, error.stack);
      this.recordError('invalidate', error.message);
    }
  }

  async invalidateByTags(tags: string[]): Promise<void> {
    const startTime = Date.now();

    try {
      // Busca todas as chaves associadas às tags
      const keysToInvalidate = new Set<string>();
      
      for (const tag of tags) {
        const tagKey = this.getTagKey(tag);
        const associatedKeys = await this.redisService.hGetAll(tagKey);
        
        Object.keys(associatedKeys).forEach(key => keysToInvalidate.add(key));
      }

      // Remove todas as chaves encontradas
      if (keysToInvalidate.size > 0) {
        await Promise.all([
          ...Array.from(keysToInvalidate).map(key => this.redisService.del(key)),
          ...tags.map(tag => this.redisService.del(this.getTagKey(tag))),
        ]);
      }

      this.recordMetrics('invalidateByTags', Date.now() - startTime);
    } catch (error) {
      this.logger.error(`Erro ao invalidar por tags: ${error.message}`, error.stack);
      this.recordError('invalidateByTags', error.message);
    }
  }

  private async associateTagsToKey(key: string, tags: string[]): Promise<void> {
    try {
      await Promise.all(
        tags.map(tag => {
          const tagKey = this.getTagKey(tag);
          return this.redisService.hSet(tagKey, key, Date.now().toString());
        }),
      );
    } catch (error) {
      this.logger.error(`Erro ao associar tags: ${error.message}`, error.stack);
      this.recordError('associateTagsToKey', error.message);
    }
  }

  private recordMetrics(operation: string, duration: number): void {
    this.prometheusService.recordDatabaseQueryDuration(
      'distributed_cache',
      operation,
      duration,
    );
  }

  private recordError(operation: string, errorMessage: string): void {
    this.prometheusService.incrementOrderProcessingError(
      'distributed_cache',
      `${operation}_error: ${errorMessage}`,
    );
  }

  async clearAllCache(): Promise<void> {
    const startTime = Date.now();

    try {
      const pattern = 'cache:*';
      const keys = await this.redisService.keys(pattern);
      
      if (keys.length > 0) {
        await Promise.all(keys.map(key => this.redisService.del(key)));
      }

      this.recordMetrics('clearAll', Date.now() - startTime);
    } catch (error) {
      this.logger.error(`Erro ao limpar todo o cache: ${error.message}`, error.stack);
      this.recordError('clearAll', error.message);
    }
  }
}
