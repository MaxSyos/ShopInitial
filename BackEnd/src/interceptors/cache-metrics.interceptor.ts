import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { RedisService } from '../modules/redis/redis.service';
import { PrometheusService } from '../modules/prometheus/prometheus.service';

@Injectable()
export class CacheMetricsInterceptor implements NestInterceptor {
  constructor(
    private readonly redisService: RedisService,
    private readonly prometheusService: PrometheusService,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const cacheKey = this.getCacheKey(context);
    const startTime = Date.now();
    const cachedValue = await this.redisService.get(cacheKey);

    if (cachedValue) {
      this.prometheusService.incrementCacheHits();
      return next.handle().pipe(
        tap(() => {
          const duration = Date.now() - startTime;
          this.prometheusService.observeCacheHitDuration(duration);
        }),
      );
    }

    this.prometheusService.incrementCacheMisses();
    
    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        this.prometheusService.observeCacheMissDuration(duration);
      }),
    );
  }

  private getCacheKey(context: ExecutionContext): string {
    const request = context.switchToHttp().getRequest();
    const { url, method, query, params, body } = request;
    
    return `cache:${method}:${url}:${JSON.stringify({
      query,
      params,
      ...(method !== 'GET' && { body }),
    })}`;
  }
}
