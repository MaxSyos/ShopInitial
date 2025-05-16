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
import { PrismaService } from '../../services/prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

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
          this.logger.error(`Erro na verificação do banco de dados: ${error.message}`);
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
          const pingResponse = await this.redis.ping();
          return {
            redis: {
              status: pingResponse === 'PONG' ? 'up' : 'down',
            },
          };
        } catch (error) {
          this.logger.error(`Erro na verificação do Redis: ${error.message}`);
          return {
            redis: {
              status: 'down',
              error: error.message,
            },
          };
        }
      },

      // Verifica o uso de memória
      async () => this.memory.checkHeap('memory_heap', 200 * 1024 * 1024), // 200MB
      async () => this.memory.checkRSS('memory_rss', 3000 * 1024 * 1024),  // 3GB

      // Verifica o espaço em disco
      async () => this.disk.checkStorage('disk', {
        thresholdPercent: 0.9,
        path: '/',
      }),

      // Verifica serviços externos
      async () => this.http.pingCheck('frontend', 'http://frontend:3000/api/health'),
      async () => this.http.pingCheck('prometheus', 'http://prometheus:9090/-/healthy'),
      async () => this.http.pingCheck('grafana', 'http://grafana:3000/api/health'),
    ]);
  }

  @HealthCheck()
  async checkDetailed() {
    const baseCheck = await this.check();
    
    try {
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
          redis: redisInfo ? JSON.parse(redisInfo) : null,
        },
      };
    } catch (error) {
      this.logger.error(`Erro ao obter métricas detalhadas: ${error.message}`);
      return {
        ...baseCheck,
        details: {
          error: 'Falha ao obter métricas detalhadas',
          message: error.message,
        },
      };
    }
  }
}
