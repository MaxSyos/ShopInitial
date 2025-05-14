import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrometheusService } from '../modules/prometheus/prometheus.service';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly prometheusService: PrometheusService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, path } = request;
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          // Sucesso - status 2xx
          this.recordMetrics(method, path, 200, startTime);
        },
        error: (error) => {
          // Erro - usa o status do erro ou 500
          const status = error.status || 500;
          this.recordMetrics(method, path, status, startTime);
        },
      }),
    );
  }

  private recordMetrics(
    method: string,
    path: string,
    status: number,
    startTime: number,
  ): void {
    const duration = (Date.now() - startTime) / 1000; // Converte para segundos
    this.prometheusService.recordHttpRequest(method, path, status);
    this.prometheusService.recordHttpRequestDuration(method, path, status, duration);
  }
}
