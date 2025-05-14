import {
  Injectable,
  CacheInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { RedisService } from '../modules/redis/redis.service';
import { PrometheusService } from '../modules/prometheus/prometheus.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CustomCacheInterceptor extends CacheInterceptor {
  private readonly logger = new Logger(CustomCacheInterceptor.name);
  private readonly defaultTTL: number;

  constructor(
    private readonly redisService: RedisService,
    private readonly prometheusService: PrometheusService,
    private readonly configService: ConfigService,
  ) {
    super();
    this.defaultTTL = this.configService.get('REDIS_CACHE_TTL', 300); // 5 minutos por padrão
  }

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const cacheKey = this.getCacheKey(context);

    // Ignora cache para métodos não-GET ou rotas específicas
    if (this.shouldSkipCache(request)) {
      return next.handle();
    }

    const startTime = Date.now();
    
    try {
      // Tenta obter do cache
      const cachedData = await this.redisService.get(cacheKey);
      
      if (cachedData) {
        this.recordMetrics('hit', Date.now() - startTime);
        return of(JSON.parse(cachedData));
      }

      // Se não estiver em cache, executa a requisição
      return next.handle().pipe(
        tap(async (response) => {
          try {
            await this.redisService.set(
              cacheKey,
              JSON.stringify(response),
              this.defaultTTL,
            );
            this.recordMetrics('miss', Date.now() - startTime);
          } catch (error) {
            this.logger.error(`Erro ao armazenar no cache: ${error.message}`, error.stack);
            this.prometheusService.incrementOrderProcessingError(
              'cache_store',
              error.message,
            );
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
}
