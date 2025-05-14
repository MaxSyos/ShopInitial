import { Controller, Get } from '@nestjs/common';
import { PrometheusService } from './prometheus.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';

@ApiTags('metrics')
@Controller('metrics')
export class MetricsController {
  constructor(private readonly prometheusService: PrometheusService) {}

  @Get()
  @SkipThrottle()
  @ApiOperation({ summary: 'Obter métricas Prometheus' })
  async getMetrics(): Promise<string> {
    return this.prometheusService.getMetrics();
  }
}
