import { DynamicModule, Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';
import { REDIS_OPTIONS } from './redis.constants';
import { RedisOptions } from './interfaces/redis-options.interface';

@Global()
@Module({})
export class RedisModule {
  static forRoot(options?: { config: Partial<RedisOptions> }): DynamicModule {
    return {
      module: RedisModule,
      imports: [ConfigModule],
      providers: [
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
            retryStrategy: (times) => {
              if (times > 3) {
                return null; // desiste após 3 tentativas
              }
              return Math.min(times * 1000, 3000); // espera exponencial até 3s
            },
            ...options?.config,
          }),
        },
        RedisService,
      ],
      exports: [RedisService],
    };
  }
}
