import { Injectable } from '@nestjs/common';
import { Counter, Histogram, Gauge } from 'prom-client';
import { PrometheusService } from '../prometheus/prometheus.service';

@Injectable()
export class DatabaseMetricsService {
  private readonly queryTotal: Counter;
  private readonly queryDuration: Histogram;
  private readonly errors: Counter;
  private readonly connections: Gauge;
  private readonly transactions: Counter;
  private readonly rowsAffected: Counter;

  constructor(private readonly prometheusService: PrometheusService) {
    this.queryTotal = new Counter({
      name: 'database_queries_total',
      help: 'Total de queries executadas',
      labelNames: ['operation', 'entity'],
    });

    this.queryDuration = new Histogram({
      name: 'database_query_duration_seconds',
      help: 'Duração das queries em segundos',
      labelNames: ['operation', 'entity'],
      buckets: [0.1, 0.3, 0.5, 1, 2, 5],
    });

    this.errors = new Counter({
      name: 'database_errors_total',
      help: 'Total de erros nas operações do banco de dados',
      labelNames: ['operation', 'error_type'],
    });

    this.connections = new Gauge({
      name: 'database_connections',
      help: 'Número atual de conexões com o banco de dados',
      labelNames: ['pool'],
    });

    this.transactions = new Counter({
      name: 'database_transactions_total',
      help: 'Total de transações no banco de dados',
      labelNames: ['status'],
    });

    this.rowsAffected = new Counter({
      name: 'database_rows_affected_total',
      help: 'Total de linhas afetadas por operações',
      labelNames: ['operation', 'entity'],
    });
  }

  recordQuery(operation: string, entity: string): void {
    this.queryTotal.inc({ operation, entity });
  }

  recordQueryDuration(operation: string, entity: string, duration: number): void {
    this.queryDuration.observe({ operation, entity }, duration / 1000);
  }

  recordError(operation: string, errorType: string): void {
    this.errors.inc({ operation, error_type: errorType });
  }

  setConnections(pool: string, count: number): void {
    this.connections.set({ pool }, count);
  }

  recordTransaction(status: 'committed' | 'rolled_back'): void {
    this.transactions.inc({ status });
  }

  recordRowsAffected(operation: string, entity: string, count: number): void {
    this.rowsAffected.inc({ operation, entity }, count);
  }

  // Método para medir a duração de uma query
  async measureQuery<T>(
    operation: string,
    entity: string,
    queryFn: () => Promise<T>,
  ): Promise<T> {
    const startTime = Date.now();
    try {
      const result = await queryFn();
      const duration = Date.now() - startTime;
      
      this.recordQuery(operation, entity);
      this.recordQueryDuration(operation, entity, duration);
      
      return result;
    } catch (error) {
      this.recordError(operation, error.name || 'UnknownError');
      throw error;
    }
  }
}
