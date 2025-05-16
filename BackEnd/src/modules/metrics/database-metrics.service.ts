import { Injectable } from '@nestjs/common';
import { Counter, Histogram } from 'prom-client';
import { PrometheusService } from '../prometheus/prometheus.service';

@Injectable()
export class DatabaseMetricsService {
  private readonly queryCounter: Counter<string>;
  private readonly queryDurationHistogram: Histogram<string>;
  private readonly queryErrorCounter: Counter<string>;
  private readonly rowsAffectedCounter: Counter<string>;

  constructor(private readonly prometheusService: PrometheusService) {
    // Query Counter
    this.queryCounter = new Counter({
      name: 'database_query_total',
      help: 'Total number of database queries',
      labelNames: ['action', 'model'],
    });

    // Query Duration
    this.queryDurationHistogram = new Histogram({
      name: 'database_query_duration_seconds',
      help: 'Duration of database queries in seconds',
      labelNames: ['action', 'model'],
      buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
    });

    // Query Errors
    this.queryErrorCounter = new Counter({
      name: 'database_query_errors_total',
      help: 'Total number of database query errors',
      labelNames: ['action', 'model'],
    });

    // Rows Affected
    this.rowsAffectedCounter = new Counter({
      name: 'database_rows_affected_total',
      help: 'Total number of rows affected by database operations',
      labelNames: ['action', 'model'],
    });
  }

  recordQuery(action: string, model: string): void {
    this.queryCounter.labels(action, model).inc();
  }

  recordQueryDuration(action: string, model: string, durationMs: number): void {
    this.queryDurationHistogram.labels(action, model).observe(durationMs / 1000);
  }

  recordQueryError(action: string, model: string): void {
    this.queryErrorCounter.labels(action, model).inc();
  }

  recordRowsAffected(action: string, model: string, count: number): void {
    this.rowsAffectedCounter.labels(action, model).inc(count);
  }
}
