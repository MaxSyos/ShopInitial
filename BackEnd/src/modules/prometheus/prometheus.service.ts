import { Injectable } from '@nestjs/common';
import { Registry, Counter, Histogram, Gauge } from 'prom-client';

@Injectable()
export class PrometheusService {
  private readonly registry: Registry;
  private readonly httpRequestsTotal: Counter;
  private readonly httpRequestDuration: Histogram;
  private readonly activeUsers: Gauge;
  
  // Métricas de Cache
  private readonly cacheHits: Counter;
  private readonly cacheMisses: Counter;
  private readonly cacheHitDuration: Histogram;
  private readonly cacheMissDuration: Histogram;
  
  // Métricas do Redis
  private readonly redisOperations: Counter;
  private readonly redisErrors: Counter;
  private readonly redisLatency: Histogram;
  
  // Métricas do PostgreSQL
  private readonly dbQueryTotal: Counter;
  private readonly dbQueryDuration: Histogram;
  private readonly dbErrors: Counter;
  private readonly dbConnections: Gauge;
  private readonly dbTransactions: Counter;
  private readonly dbRowsAffected: Counter;

  constructor() {
    this.registry = new Registry();

    // Contador total de requisições HTTP
    this.httpRequestsTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total de requisições HTTP',
      labelNames: ['method', 'path', 'status'],
      registers: [this.registry],
    });

    // Histograma de duração das requisições
    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duração das requisições HTTP em segundos',
      labelNames: ['method', 'path', 'status'],
      buckets: [0.1, 0.5, 1, 2, 5],
      registers: [this.registry],
    });

    // Medidor de usuários ativos
    this.activeUsers = new Gauge({
      name: 'active_users',
      help: 'Número de usuários ativos no momento',
      registers: [this.registry],
    });

    // Coletar métricas padrão do Node.js
    this.registry.setDefaultLabels({
      app: 'shop-backend',
    });

    // Inicialização das métricas de cache
    this.cacheHits = new Counter({
      name: 'cache_hits_total',
      help: 'Total de hits no cache',
      labelNames: ['service'],
      registers: [this.registry],
    });

    this.cacheMisses = new Counter({
      name: 'cache_misses_total',
      help: 'Total de misses no cache',
      labelNames: ['service'],
      registers: [this.registry],
    });

    this.cacheHitDuration = new Histogram({
      name: 'cache_hit_duration_seconds',
      help: 'Duração das operações de cache hit',
      labelNames: ['service'],
      buckets: [0.1, 0.5, 1, 2, 5],
      registers: [this.registry],
    });

    this.cacheMissDuration = new Histogram({
      name: 'cache_miss_duration_seconds',
      help: 'Duração das operações de cache miss',
      labelNames: ['service'],
      buckets: [0.1, 0.5, 1, 2, 5],
      registers: [this.registry],
    });

    // Inicialização das métricas do Redis
    this.redisOperations = new Counter({
      name: 'redis_operations_total',
      help: 'Total de operações no Redis',
      labelNames: ['operation', 'status'],
      registers: [this.registry],
    });

    this.redisErrors = new Counter({
      name: 'redis_errors_total',
      help: 'Total de erros nas operações do Redis',
      labelNames: ['operation', 'error_type'],
      registers: [this.registry],
    });

    this.redisLatency = new Histogram({
      name: 'redis_operation_duration_seconds',
      help: 'Latência das operações do Redis',
      labelNames: ['operation'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1],
      registers: [this.registry],
    });
  }

  // Incrementa o contador de requisições
  recordHttpRequest(method: string, path: string, status: number): void {
    this.httpRequestsTotal.labels(method, path, status.toString()).inc();
  }

  // Registra a duração de uma requisição
  recordHttpRequestDuration(
    method: string,
    path: string,
    status: number,
    duration: number,
  ): void {
    this.httpRequestDuration
      .labels(method, path, status.toString())
      .observe(duration);
  }

  // Métodos para métricas de cache
  incrementCacheHits(service = 'product'): void {
    this.cacheHits.inc({ service });
  }

  incrementCacheMisses(service = 'product'): void {
    this.cacheMisses.inc({ service });
  }

  observeCacheHitDuration(duration: number, service = 'product'): void {
    this.cacheHitDuration.observe({ service }, duration / 1000);
  }

  observeCacheMissDuration(duration: number, service = 'product'): void {
    this.cacheMissDuration.observe({ service }, duration / 1000);
  }

  // Métodos para métricas do Redis
  recordRedisOperation(operation: string, duration: number, status = 'success'): void {
    this.redisOperations.inc({ operation, status });
    this.redisLatency.observe({ operation }, duration / 1000);
  }

  recordRedisError(operation: string, errorType: string): void {
    this.redisErrors.inc({ operation, error_type: errorType });
  }
    path: string,
    status: number,
    duration: number,
  ): void {
    this.httpRequestDuration
      .labels(method, path, status.toString())
      .observe(duration);
  }

  // Atualiza o número de usuários ativos
  setActiveUsers(count: number): void {
    this.activeUsers.set(count);
  }

  // Retorna todas as métricas coletadas
  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }
}
