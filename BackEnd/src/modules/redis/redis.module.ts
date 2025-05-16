import { DynamicModule, Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';
import { REDIS_OPTIONS } from './redis.constants';
import { RedisOptions } from './interfaces/redis-options.interface';
import { CircuitBreakerService } from './services/circuit-breaker.service';
import { PrometheusModule } from '../prometheus/prometheus.module';

@Global()
@Module({})
export class RedisModule {
  static forRoot(options?: { config: Partial<RedisOptions> }): DynamicModule {
    return {
      module: RedisModule,
      imports: [ConfigModule, PrometheusModule],
      providers: [
        CircuitBreakerService,
        {
          provide: REDIS_OPTIONS,
          inject: [ConfigService],
          useFactory: (configService: ConfigService): RedisOptions => ({
            host: options?.config?.host || configService.get('REDIS_HOST') || 'localhost',
            port: options?.config?.port || configService.get('REDIS_PORT') || 6379,
            password: options?.config?.password || configService.get('REDIS_PASSWORD'),
            db: options?.config?.db || 0,
            keyPrefix: options?.config?.keyPrefix || 'shop:',
            ttl: options?.config?.ttl || 86400, // 24 horas
            maxRetriesPerRequest: options?.config?.maxRetriesPerRequest || 3,
            enableReadyCheck: options?.config?.enableReadyCheck !== false,
            retryStrategy: (times) => Math.min(times * 50, 2000),
          }),
        },
        RedisService,
      ],
      exports: [RedisService, CircuitBreakerService],
    };
  }
}
