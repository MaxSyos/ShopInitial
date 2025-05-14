import { CacheModule } from '@nestjs/cache-manager';
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as redisStore from 'cache-manager-redis-store';

@Global()
@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        store: redisStore,
        host: configService.get('REDIS_HOST'),
        port: configService.get('REDIS_PORT'),
        ttl: 60 * 60 * 24, // 24 horas em segundos
        max: 1000, // Máximo de itens em cache
        retryStrategy: (times: number) => {
          // Estratégia de retry: espera exponencial com máximo de 3 tentativas
          if (times > 3) {
            throw new Error('Redis indisponível após 3 tentativas');
          }
          return Math.min(times * 1000, 3000);
        }
      }),
    }),
  ],
  exports: [CacheModule],
})
export class RedisCacheModule {}
