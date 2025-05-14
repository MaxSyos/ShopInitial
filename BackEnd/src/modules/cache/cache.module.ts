import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisModule } from '@nestjs/redis';
import { RedisService } from '../config/redis.config';
import { CustomCacheInterceptor } from '../interceptors/cache.interceptor';

@Global()
@Module({
  imports: [
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        config: {
          url: configService.get('REDIS_URL'),
          // Configurações adicionais do Redis
          retryStrategy: (times: number) => {
            // Estratégia de retry exponencial
            return Math.min(times * 50, 2000);
          },
          maxRetriesPerRequest: 3,
          enableReadyCheck: true,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    RedisService,
    {
      provide: 'APP_INTERCEPTOR',
      useClass: CustomCacheInterceptor,
    },
  ],
  exports: [RedisService],
})
export class CacheModule {}
