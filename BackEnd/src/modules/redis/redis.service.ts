import { Injectable, OnModuleDestroy, Inject, Logger } from '@nestjs/common';
import { createClient, RedisClientType, RedisModules, RedisFunctions, RedisScripts } from 'redis';
import type { RedisClientOptions } from 'redis';
import { REDIS_OPTIONS } from './redis.constants';
import { CircuitBreakerService } from './services/circuit-breaker.service';
import { PrometheusService } from '../prometheus/prometheus.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: RedisClientType<RedisModules, RedisFunctions, RedisScripts>;
  private readonly logger = new Logger(RedisService.name);

  constructor(
    @Inject(REDIS_OPTIONS) private readonly options: RedisClientOptions,
    private readonly circuitBreaker: CircuitBreakerService,
    private readonly prometheusService: PrometheusService,
    private readonly configService: ConfigService
  ) {
    this.client = createClient(this.options) as RedisClientType<RedisModules, RedisFunctions, RedisScripts>;
    this.client.connect().catch((err: Error) => {
      this.logger.error('Redis connection error:', err);
      this.prometheusService.incrementCacheErrors();
    });
  }

  async onModuleDestroy() {
    await this.client.disconnect();
  }

  private async executeWithCircuitBreaker<T>(
    operation: string,
    action: () => Promise<T>,
    fallbackValue: T
  ): Promise<T> {
    const startTime = Date.now();

    try {
      if (!this.circuitBreaker.canExecute(operation)) {
        this.logger.warn(`Circuit breaker aberto para operação ${operation}`);
        this.prometheusService.incrementCacheErrors();
        return fallbackValue;
      }

      const result = await action();
      this.circuitBreaker.recordSuccess(operation);
      this.prometheusService.recordRedisOperation(operation, Date.now() - startTime);
      return result;
    } catch (error) {
      this.logger.error(`Redis ${operation} error:`, error);
      if (this.circuitBreaker.recordFailure(operation, error as Error)) {
        this.prometheusService.recordRedisOperation('circuit_breaker_trip', Date.now() - startTime);
      }
      this.prometheusService.incrementCacheErrors();
      return fallbackValue;
    }
  }

  async get(key: string): Promise<string | null> {
    return this.executeWithCircuitBreaker('get', async () => {
      const result = await this.client.get(key);
      return result !== undefined ? result : null;
    }, null);
  }

  async set(key: string, value: string, ttl?: number): Promise<boolean> {
    return this.executeWithCircuitBreaker('set', async () => {
      if (ttl) {
        await this.client.setEx(key, ttl, value);
      } else {
        await this.client.set(key, value);
      }
      return true;
    }, false);
  }

  async del(key: string): Promise<boolean> {
    return this.executeWithCircuitBreaker('del', async () => {
      await this.client.del(key);
      return true;
    }, false);
  }

  async keys(pattern: string): Promise<string[]> {
    return this.executeWithCircuitBreaker('keys', async () => {
      return await this.client.keys(pattern);
    }, []);
  }

  async ping(): Promise<string> {
    return this.executeWithCircuitBreaker('ping', async () => {
      return await this.client.ping();
    }, 'ERROR');
  }

  async info(): Promise<string> {
    return this.executeWithCircuitBreaker('info', async () => {
      return await this.client.info();
    }, 'ERROR');
  }

  async hGet(key: string, field: string): Promise<string | null> {
    return this.executeWithCircuitBreaker('hGet', async () => {
      const result = await this.client.hGet(key, field);
      return result !== undefined ? result : null;
    }, null);
  }

  async hSet(key: string, field: string, value: string): Promise<boolean> {
    return this.executeWithCircuitBreaker('hSet', async () => {
      await this.client.hSet(key, field, value);
      return true;
    }, false);
  }

  async hGetAll(key: string): Promise<Record<string, string>> {
    return this.executeWithCircuitBreaker('hGetAll', async () => {
      const result = await this.client.hGetAll(key);
      const convertedResult: Record<string, string> = {};
      for (const [k, v] of Object.entries(result)) {
        if (v !== null && v !== undefined) {
          convertedResult[k] = String(v);
        }
      }
      return convertedResult;
    }, {});
  }
}
