import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { CacheTestService } from '../../services/cache-test.service';
import { RedisModule } from '../redis/redis.module';
import { PrometheusModule } from '../prometheus/prometheus.module';

@Module({
  imports: [RedisModule, PrometheusModule],
  controllers: [HealthController],
  providers: [CacheTestService],
})
export class HealthModule {}
