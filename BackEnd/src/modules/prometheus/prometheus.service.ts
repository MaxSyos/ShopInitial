import { Injectable } from '@nestjs/common';
import { Registry, Counter, Histogram, Gauge } from 'prom-client';

@Injectable()
export class PrometheusService {
  private readonly registry: Registry;
  private readonly httpRequestsTotal: Counter;
  private readonly httpRequestDuration: Histogram;
  private readonly activeUsers: Gauge;

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

  // Atualiza o número de usuários ativos
  setActiveUsers(count: number): void {
    this.activeUsers.set(count);
  }

  // Retorna todas as métricas coletadas
  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }
}
