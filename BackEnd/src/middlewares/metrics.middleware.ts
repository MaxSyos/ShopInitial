import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrometheusService } from '../modules/prometheus/prometheus.service';

@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  constructor(private readonly prometheusService: PrometheusService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = process.hrtime();

    res.on('finish', () => {
      const [seconds, nanoseconds] = process.hrtime(startTime);
      const responseTime = seconds * 1000 + nanoseconds / 1000000;

      // Registra métricas de duração da requisição
      this.prometheusService.recordHttpRequestDuration(
        req.method,
        req.path,
        res.statusCode,
        responseTime,
      );

      // Registra métricas de contagem de requisições
      this.prometheusService.incrementHttpRequestCount(
        req.method,
        req.path,
        res.statusCode,
      );
    });

    next();
  }
}
