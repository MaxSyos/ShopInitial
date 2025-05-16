import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisModule } from '../redis/redis.module';
import { PrometheusModule } from '../prometheus/prometheus.module';
import { DistributedCacheService } from '../../services/distributed-cache.service';
import { CustomCacheInterceptor } from '../../interceptors/cache.interceptor';

@Global()
@Module({
  imports: [
    RedisModule.forRoot({
      config: {
        keyPrefix: 'cache:',
        ttl: 3600, // 1 hora em segundos
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
      },
    }),
    ConfigModule,
    PrometheusModule,
  ],
  providers: [
    DistributedCacheService,
    {
      provide: 'APP_INTERCEPTOR',
      useClass: CustomCacheInterceptor,
    },
  ],
  exports: [DistributedCacheService],
})
export class CacheModule {}
