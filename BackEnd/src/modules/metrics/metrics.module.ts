import { Module } from '@nestjs/common';
import { DatabaseMetricsService } from './database-metrics.service';
import { PrometheusModule } from '../prometheus/prometheus.module';

@Module({
  imports: [PrometheusModule],
  providers: [DatabaseMetricsService],
  exports: [DatabaseMetricsService],
})
export class MetricsModule {}
