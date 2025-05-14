import { Injectable } from '@nestjs/common';
import { RedisService } from '../modules/redis/redis.service';
import { PrometheusService } from '../modules/prometheus/prometheus.service';

@Injectable()
export class CacheTestService {
  constructor(
    private readonly redisService: RedisService,
    private readonly prometheusService: PrometheusService,
  ) {}

  async testConnection(): Promise<{ status: string; message: string }> {
    const startTime = Date.now();
    
    try {
      const testKey = 'test:connection';
      const testValue = 'Redis está funcionando! ' + new Date().toISOString();
      
      // Tenta gravar no Redis
      await this.redisService.set(testKey, testValue);
      
      // Tenta ler do Redis
      const retrievedValue = await this.redisService.get(testKey);
      
      // Registra métricas de latência
      const duration = Date.now() - startTime;
      this.prometheusService.recordDatabaseQueryDuration(
        'redis_test',
        'cache',
        duration,
      );

      if (retrievedValue === testValue) {
        return {
          status: 'success',
          message: 'Conexão com Redis estabelecida com sucesso. Valor armazenado e recuperado corretamente.',
        };
      } else {
        throw new Error('Valor recuperado não corresponde ao valor armazenado');
      }
    } catch (error) {
      // Registra erro nas métricas
      this.prometheusService.incrementOrderProcessingError(
        'redis_connection',
        error.message,
      );
      
      return {
        status: 'error',
        message: `Erro ao conectar com Redis: ${error.message}`,
      };
    }
  }

  async testCacheOperations(): Promise<{
    status: string;
    operations: Array<{ operation: string; success: boolean; time: number }>;
  }> {
    const operations = [];
    const startTime = Date.now();

    try {
      // Teste de escrita
      const writeStart = Date.now();
      await this.redisService.set('test:write', 'valor de teste');
      operations.push({
        operation: 'write',
        success: true,
        time: Date.now() - writeStart,
      });

      // Teste de leitura
      const readStart = Date.now();
      const value = await this.redisService.get('test:write');
      operations.push({
        operation: 'read',
        success: value === 'valor de teste',
        time: Date.now() - readStart,
      });

      // Teste de hash
      const hashStart = Date.now();
      await this.redisService.hSet('test:hash', 'campo1', 'valor1');
      const hashValue = await this.redisService.hGet('test:hash', 'campo1');
      operations.push({
        operation: 'hash',
        success: hashValue === 'valor1',
        time: Date.now() - hashStart,
      });

      // Teste de deleção
      const deleteStart = Date.now();
      await this.redisService.del('test:write');
      const deletedValue = await this.redisService.get('test:write');
      operations.push({
        operation: 'delete',
        success: deletedValue === null,
        time: Date.now() - deleteStart,
      });

      // Registra métricas de performance
      const totalTime = Date.now() - startTime;
      this.prometheusService.recordDatabaseQueryDuration(
        'redis_operations',
        'cache',
        totalTime,
      );

      return {
        status: 'success',
        operations,
      };
    } catch (error) {
      this.prometheusService.incrementOrderProcessingError(
        'redis_operations',
        error.message,
      );

      return {
        status: 'error',
        operations,
      };
    }
  }
}
