import { Injectable } from '@nestjs/common';
import { PrismaService } from '../services/prisma.service';
import { DatabaseMetricsService } from '../modules/metrics/database-metrics.service';

@Injectable()
export class PrismaMetricsMiddleware {
  constructor(
    private readonly databaseMetrics: DatabaseMetricsService,
    private readonly prisma: PrismaService,
  ) {
    this.setupMetricsMiddleware();
  }

  private setupMetricsMiddleware() {
    this.prisma.$use(async (params, next) => {
      const startTime = Date.now();
      
      try {
        const result = await next(params);
        
        // Registra métricas da query
        this.databaseMetrics.recordQuery(params.action, params.model);
        this.databaseMetrics.recordQueryDuration(
          params.action,
          params.model,
          Date.now() - startTime
        );

        // Registra linhas afetadas para operações de escrita
        if (['create', 'update', 'delete', 'upsert'].includes(params.action)) {
          const rowCount = Array.isArray(result) ? result.length : 1;
          this.databaseMetrics.recordRowsAffected(params.action, params.model, rowCount);
        }

        return result;
      } catch (error) {
        // Registra erros
        this.databaseMetrics.recordError(
          `${params.model}.${params.action}`,
          error.name || 'UnknownError'
        );
        throw error;
      }
    });
  }
}
