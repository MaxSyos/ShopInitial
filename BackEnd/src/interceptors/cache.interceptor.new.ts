import {
  Injectable,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { RedisService } from '../modules/redis/redis.service';
import { PrometheusService } from '../modules/prometheus/prometheus.service';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';

@Injectable()
export class CustomCacheInterceptor {
  private readonly logger = new Logger(CustomCacheInterceptor.name);
  private readonly defaultTTL: number;

  constructor(
    private readonly redisService: RedisService,
    private readonly prometheusService: PrometheusService,
    private readonly configService: ConfigService,
    private readonly reflector: Reflector,
  ) {
    this.defaultTTL = this.configService.get<number>('REDIS_CACHE_TTL') || 300;
  }

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const cacheKey = this.getCacheKey(request);

    try {
      // Tentar obter do cache
      const cachedData = await this.redisService.get(cacheKey);
      
      if (cachedData) {
        this.prometheusService.incrementCacheHits();
        return of(JSON.parse(cachedData));
      }

      this.prometheusService.incrementCacheMisses();
      
      // Se não estiver no cache, executar o handler
      return next.handle().pipe(
        tap(async (data) => {
          try {
            await this.redisService.set(cacheKey, JSON.stringify(data), this.defaultTTL);
          } catch (error) {
            this.logger.error(`Erro ao salvar no cache: ${error.message}`);
            this.prometheusService.incrementCacheErrors();
          }
        })
      );
    } catch (error) {
      this.logger.error(`Erro no interceptor de cache: ${error.message}`);
      this.prometheusService.incrementCacheErrors();
      return next.handle();
    }
  }

  private getCacheKey(request: any): string {
    const url = request.url;
    const query = request.query ? `?${new URLSearchParams(request.query).toString()}` : '';
    return `cache:${url}${query}`;
  }
}
