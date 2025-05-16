import { Injectable } from '@nestjs/common';
import { Registry, Counter, Histogram, Gauge } from 'prom-client';

@Injectable()
export class PrometheusService {
  private readonly registry: Registry;
  
  // Métricas de Sistema
  private readonly activeUsers: Gauge<string>;
  
  // Métricas HTTP
  private readonly httpRequestsTotal: Counter<string>;
  private readonly httpRequestDuration: Histogram<string>;
  
  // Métricas de Cache
  private readonly cacheHits: Counter<string>;
  private readonly cacheMisses: Counter<string>;
  private readonly cacheErrors: Counter<string>;
  private readonly cacheHitDuration: Histogram<string>;
  private readonly cacheMissDuration: Histogram<string>;
  
  // Métricas de Redis
  private readonly redisOperations: Counter<string>;
  private readonly redisLatency: Histogram<string>;
  
  // Métricas de Database
  private readonly dbQueryTotal: Counter<string>;
  private readonly dbErrors: Counter<string>;
  private readonly dbQueryDuration: Histogram<string>;
  private readonly dbRowsAffected: Counter<string>;

  // Métricas de Erros de Processamento
  private readonly processingErrors: Counter<string>;

  constructor() {
    this.registry = new Registry();
    
    // Inicialização das métricas de sistema
    this.activeUsers = new Gauge({
      name: 'active_users',
      help: 'Número de usuários ativos'
    });
    
    // Inicialização das métricas HTTP
    this.httpRequestsTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total de requisições HTTP',
      labelNames: ['method', 'path', 'status']
    });
    
    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duração das requisições HTTP',
      labelNames: ['method', 'path', 'status']
    });
    
    // Inicialização das métricas de Cache
    this.cacheHits = new Counter({
      name: 'cache_hits_total',
      help: 'Total de hits no cache'
    });
    
    this.cacheMisses = new Counter({
      name: 'cache_misses_total',
      help: 'Total de misses no cache'
    });
    
    this.cacheErrors = new Counter({
      name: 'cache_errors_total',
      help: 'Total de erros no cache'
    });
    
    this.cacheHitDuration = new Histogram({
      name: 'cache_hit_duration_seconds',
      help: 'Duração das operações de hit no cache'
    });
    
    this.cacheMissDuration = new Histogram({
      name: 'cache_miss_duration_seconds',
      help: 'Duração das operações de miss no cache'
    });
    
    // Inicialização das métricas de Redis
    this.redisOperations = new Counter({
      name: 'redis_operations_total',
      help: 'Total de operações no Redis',
      labelNames: ['operation']
    });
    
    this.redisLatency = new Histogram({
      name: 'redis_operation_duration_seconds',
      help: 'Latência das operações no Redis',
      labelNames: ['operation']
    });
    
    // Inicialização das métricas de Database
    this.dbQueryTotal = new Counter({
      name: 'db_queries_total',
      help: 'Total de queries no banco de dados',
      labelNames: ['type', 'model']
    });
    
    this.dbErrors = new Counter({
      name: 'db_errors_total',
      help: 'Total de erros no banco de dados',
      labelNames: ['type', 'error']
    });
    
    this.dbQueryDuration = new Histogram({
      name: 'db_query_duration_seconds',
      help: 'Duração das queries no banco de dados',
      labelNames: ['operation']
    });
    
    this.dbRowsAffected = new Counter({
      name: 'db_rows_affected_total',
      help: 'Total de linhas afetadas no banco de dados',
      labelNames: ['operation', 'model']
    });

    // Inicialização das métricas de Erros de Processamento
    this.processingErrors = new Counter({
      name: 'processing_errors_total',
      help: 'Total de erros de processamento',
      labelNames: ['type', 'error'],
    });

    // Registrando todas as métricas
    this.registry.registerMetric(this.activeUsers);
    this.registry.registerMetric(this.httpRequestsTotal);
    this.registry.registerMetric(this.httpRequestDuration);
    this.registry.registerMetric(this.cacheHits);
    this.registry.registerMetric(this.cacheMisses);
    this.registry.registerMetric(this.cacheErrors);
    this.registry.registerMetric(this.cacheHitDuration);
    this.registry.registerMetric(this.cacheMissDuration);
    this.registry.registerMetric(this.redisOperations);
    this.registry.registerMetric(this.redisLatency);
    this.registry.registerMetric(this.dbQueryTotal);
    this.registry.registerMetric(this.dbErrors);
    this.registry.registerMetric(this.dbQueryDuration);
    this.registry.registerMetric(this.dbRowsAffected);
    this.registry.registerMetric(this.processingErrors);
  }

  // Métodos de sistema
  setActiveUsers(count: number): void {
    this.activeUsers.set(count);
  }

  // Métodos HTTP
  recordHttpRequest(method: string, path: string, status: number): void {
    this.httpRequestsTotal.inc({ method, path, status });
  }

  recordHttpRequestDuration(method: string, path: string, status: number, duration: number): void {
    this.httpRequestDuration.observe({ method, path, status }, duration);
  }

  // Métodos de Cache
  incrementCacheHits(): void {
    this.cacheHits.inc();
  }

  incrementCacheMisses(): void {
    this.cacheMisses.inc();
  }

  incrementCacheErrors(): void {
    this.cacheErrors.inc();
  }

  observeCacheHitDuration(seconds: number): void {
    this.cacheHitDuration.observe(seconds);
  }

  observeCacheMissDuration(seconds: number): void {
    this.cacheMissDuration.observe(seconds);
  }

  // Métodos Redis
  recordRedisOperation(operation: string, duration: number): void {
    this.redisOperations.inc({ operation });
    this.redisLatency.observe({ operation }, duration);
  }

  // Métodos Database
  recordDatabaseQuery(type: string, model: string): void {
    this.dbQueryTotal.inc({ type, model });
  }

  recordDatabaseError(type: string, error: string): void {
    this.dbErrors.inc({ type, error });
  }

  recordDatabaseQueryDuration(operation: string, duration: number): void {
    this.dbQueryDuration.observe({ operation }, duration);
  }

  recordRowsAffected(operation: string, model: string, count: number): void {
    this.dbRowsAffected.inc({ operation, model }, count);
  }

  // Adicionando métodos faltantes
  incrementHttpRequestCount(method: string, path: string, status: number): void {
    this.httpRequestsTotal.inc({ method, path, status });
  }

  incrementOrderProcessingError(type: string, error: string): void {
    this.dbErrors.inc({ type, error });
  }

  incrementProcessingError(type: string, error: string): void {
    this.processingErrors.inc({ type, error });
  }
  
  // Métodos de métricas
  getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  getContentType(): string {
    return this.registry.contentType;
  }

  clearRegistry(): void {
    this.registry.clear();
  }
}
