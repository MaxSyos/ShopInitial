import {
  Injectable,
  ExecutionContext,
  CallHandler,
  Logger,
  NestInterceptor
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { RedisService } from '../modules/redis/redis.service';
import { PrometheusService } from '../modules/prometheus/prometheus.service';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';

@Injectable()
export class CustomCacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CustomCacheInterceptor.name);
  private readonly defaultTTL: number;

  constructor(
    private readonly redisService: RedisService,
    private readonly prometheusService: PrometheusService,
    private readonly configService: ConfigService,
    private readonly reflector: Reflector,
  ) {
    this.defaultTTL = this.configService.get('REDIS_CACHE_TTL', 300); // 5 minutos por padrão
  }

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const request = context.switchToHttp().getRequest();
    const cacheKey = this.trackBy(context);

    // Ignora cache para métodos não-GET ou rotas específicas
    if (request.method !== 'GET' || this.shouldSkipCache(context)) {
      return next.handle();
    }

    const startTime = Date.now();
    
    try {
      // Tenta obter do cache
      const cachedData = await this.redisService.get(cacheKey);
      
      if (cachedData) {
        this.recordMetrics('hit', Date.now() - startTime);
        try {
          return of(JSON.parse(cachedData));
        } catch (parseError) {
          this.logger.error(`Erro ao fazer parse do cache: ${parseError.message}`);
          await this.redisService.del(cacheKey);
        }
      }

      // Se não estiver em cache, executa a requisição
      return next.handle().pipe(
        tap({
          next: async (response: unknown) => {
            const duration = Date.now() - startTime;
            try {
              if (response !== undefined && response !== null) {
                await this.redisService.set(
                  cacheKey,
                  JSON.stringify(response),
                  this.defaultTTL,
                );
                this.recordMetrics('miss', duration);
              }
            } catch (error) {
              this.logger.error(`Erro ao armazenar no cache: ${error.message}`, error.stack);
              this.prometheusService.recordRedisOperation('cache_store_error', duration);
            }
          },
          error: (error) => {
            this.logger.error(`Erro na execução: ${error.message}`, error.stack);
          }
        }),
      );
    } catch (error) {
      // Em caso de erro no cache, executa normalmente
      console.error('Erro no cache:', error);
      return next.handle();
    }
  }

  /**
   * Gera uma chave única para o cache baseada na URL e query params
   */
  trackBy(context: ExecutionContext): string {
    const request = context.switchToHttp().getRequest();
    const { url, query } = request;
    
    return `cache:${url}:${JSON.stringify(query)}`;
  }

  private recordMetrics(type: 'hit' | 'miss', duration: number): void {
    if (type === 'hit') {
      this.prometheusService.incrementCacheHits();
      this.prometheusService.observeCacheHitDuration(duration);
    } else {
      this.prometheusService.incrementCacheMisses();
      this.prometheusService.observeCacheMissDuration(duration);
    }
  }

  private shouldSkipCache(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    
    // Skip cache for non-GET requests
    if (request.method !== 'GET') {
      return true;
    }

    // Check for cache control headers
    const cacheControl = request.headers['cache-control'];
    if (cacheControl && (
      cacheControl.includes('no-cache') || 
      cacheControl.includes('no-store')
    )) {
      return true;
    }

    // Check for custom cache skip metadata
    const skipCache = this.reflector.get<boolean>(
      'skipCache',
      context.getHandler(),
    );

    return skipCache === true;
  }
}
