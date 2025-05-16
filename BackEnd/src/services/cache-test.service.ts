import { Injectable } from '@nestjs/common';
import { RedisService } from '../modules/redis/redis.service';
import { PrometheusService } from '../modules/prometheus/prometheus.service';

@Injectable()
export class CacheTestService {
  constructor(
    private readonly redisService: RedisService,
    private readonly prometheusService: PrometheusService,
  ) {}

  async testConnection() {
    const startTime = Date.now();
    try {
      const pingResponse = await this.redisService.ping();
      this.prometheusService.recordRedisOperation('ping', Date.now() - startTime);

      return {
        status: pingResponse === 'PONG' ? 'up' : 'down',
        message: pingResponse === 'PONG' ? 'Redis está funcionando corretamente' : 'Redis não está respondendo corretamente',
      };
    } catch (error) {
      this.prometheusService.incrementCacheErrors();
      return {
        status: 'down',
        message: `Erro ao conectar ao Redis: ${error.message}`,
      };
    }
  }

  async testCacheOperations() {
    const startTime = Date.now();
    const testKey = 'health:test';
    const testValue = 'health-check-' + Date.now();
    const operations = [];

    try {
      // Teste SET
      const setResult = await this.setCacheValue(testKey, testValue);
      operations.push({
        operation: 'set',
        success: setResult,
        time: Date.now() - startTime,
      });

      // Teste GET
      const getValue = await this.getCacheValue(testKey);
      operations.push({
        operation: 'get',
        success: getValue === testValue,
        time: Date.now() - startTime,
      });

      // Teste DELETE
      const deleteResult = await this.deleteCacheValue(testKey);
      operations.push({
        operation: 'delete',
        success: deleteResult,
        time: Date.now() - startTime,
      });

      // Teste INFO
      const info = await this.getRedisInfo();
      operations.push({
        operation: 'info',
        success: !!info,
        time: Date.now() - startTime,
      });

      return {
        status: 'success',
        operations,
      };
    } catch (error) {
      this.prometheusService.incrementCacheErrors();
      return {
        status: 'error',
        message: `Erro ao executar operações no Redis: ${error.message}`,
        operations,
      };
    }
  }

  async setCacheValue(key: string, value: string): Promise<boolean> {
    const startTime = Date.now();
    try {
      const result = await this.redisService.set(key, value);
      this.prometheusService.recordRedisOperation('set', Date.now() - startTime);
      return result;
    } catch (error) {
      this.prometheusService.incrementCacheErrors();
      throw error;
    }
  }

  async getCacheValue(key: string): Promise<string | null> {
    const startTime = Date.now();
    try {
      const value = await this.redisService.get(key);
      if (value) {
        this.prometheusService.incrementCacheHits();
        this.prometheusService.observeCacheHitDuration(Date.now() - startTime);
      } else {
        this.prometheusService.incrementCacheMisses();
        this.prometheusService.observeCacheMissDuration(Date.now() - startTime);
      }
      return value;
    } catch (error) {
      this.prometheusService.incrementCacheErrors();
      throw error;
    }
  }

  async deleteCacheValue(key: string): Promise<boolean> {
    const startTime = Date.now();
    try {
      const result = await this.redisService.del(key);
      this.prometheusService.recordRedisOperation('del', Date.now() - startTime);
      return result;
    } catch (error) {
      this.prometheusService.incrementCacheErrors();
      throw error;
    }
  }

  async getRedisInfo(): Promise<string> {
    const startTime = Date.now();
    try {
      const info = await this.redisService.info();
      this.prometheusService.recordRedisOperation('info', Date.now() - startTime);
      return info;
    } catch (error) {
      this.prometheusService.incrementCacheErrors();
      throw error;
    }
  }
}
