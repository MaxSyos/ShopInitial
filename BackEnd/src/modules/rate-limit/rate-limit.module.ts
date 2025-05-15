import { Module, Global } from '@nestjs/common';
import { RateLimitService } from './rate-limit.service';
import { RedisModule } from '../redis/redis.module';
import { PrometheusModule } from '../prometheus/prometheus.module';

@Global()
@Module({
  imports: [RedisModule, PrometheusModule],
  providers: [RateLimitService],
  exports: [RateLimitService],
})
export class RateLimitModule {}
