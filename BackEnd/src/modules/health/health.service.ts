import { Injectable, Logger } from '@nestjs/common';
import {
  HealthCheckService,
  HealthCheck,
  HealthCheckResult,
  HealthIndicator,
  HealthIndicatorResult,
  MemoryHealthIndicator,
  DiskHealthIndicator,
  HttpHealthIndicator,
} from '@nestjs/terminus';
import { PrismaService } from '../services/prisma.service';
import { RedisService } from '../modules/redis/redis.service';

@Injectable()
export class HealthService {
  constructor(
    private health: HealthCheckService,
    private prisma: PrismaService,
    private redis: RedisService,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
    private http: HttpHealthIndicator,
  ) {}

  @HealthCheck()
  async check() {
    return this.health.check([
      // Verifica a conexão com o banco de dados
      async () => {
        try {
          await this.prisma.$queryRaw`SELECT 1`;
          return {
            database: {
              status: 'up',
            },
          };
        } catch (error) {
          return {
            database: {
              status: 'down',
              error: error.message,
            },
          };
        }
      },

      // Verifica a conexão com o Redis
      async () => {
        try {
          await this.redis.ping();
          return {
            redis: {
              status: 'up',
            },
          };
        } catch (error) {
          return {
            redis: {
              status: 'down',
              error: error.message,
            },
          };
        }
      },

      // Verifica o uso de memória
      () => this.memory.checkHeap('memory_heap', 200 * 1024 * 1024), // 200MB
      () => this.memory.checkRSS('memory_rss', 3000 * 1024 * 1024),  // 3GB

      // Verifica o espaço em disco
      () => this.disk.checkStorage('disk', {
        thresholdPercent: 0.9,
        path: '/',
      }),

      // Verifica serviços externos
      () => this.http.pingCheck('frontend', 'http://frontend:3000/api/health'),
      () => this.http.pingCheck('prometheus', 'http://prometheus:9090/-/healthy'),
      () => this.http.pingCheck('grafana', 'http://grafana:3000/api/health'),
    ]);
  }

  @HealthCheck()
  async checkDetailed() {
    const baseCheck = await this.check();
    
    // Adiciona métricas detalhadas do banco de dados
    const dbMetrics = await this.prisma.$queryRaw`
      SELECT 
        count(*) as total_connections,
        count(*) filter (where state = 'active') as active_connections,
        count(*) filter (where state = 'idle') as idle_connections
      FROM pg_stat_activity
    `;

    // Adiciona métricas detalhadas do Redis
    const redisInfo = await this.redis.info();

    return {
      ...baseCheck,
      details: {
        database: dbMetrics,
        redis: redisInfo,
      },
    };
  }
}
