import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../../services/prisma.service';
import { Prisma, RefreshToken } from '@prisma/client';

interface CleanupMetrics {
  expiredTokensRemoved: number;
  inactiveTokensRemoved: number;
  lastCleanupTime: Date | null;
  errors: number;
}

interface CleanupResult {
  count: number;
  users?: string[];
}

@Injectable()
export class TokenCleanupService {
  private readonly logger = new Logger(TokenCleanupService.name);
  private metrics: CleanupMetrics = {
    expiredTokensRemoved: 0,
    inactiveTokensRemoved: 0,
    lastCleanupTime: null,
    errors: 0
  };

  constructor(private readonly prisma: PrismaService) {}

  getMetrics(): CleanupMetrics {
    return { ...this.metrics };
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupExpiredTokens(): Promise<void> {
    const startTime = Date.now();
    this.logger.log('Iniciando limpeza de tokens expirados...');

    try {
      const now = new Date();
      
      const result = await this.prisma.$transaction(async (prisma: PrismaService) => {
        const tokensToDelete = await prisma.refreshToken.findMany({
          where: {
            expiresAt: {
              lt: now
            },
            user: {
              orders: {
                none: {
                  status: {
                    in: ['PENDING', 'PROCESSING']
                  }
                }
              }
            }
          },
          include: {
            user: true
          }
        });

        if (tokensToDelete.length === 0) {
          return { count: 0 } as CleanupResult;
        }

        const deleteResult = await prisma.refreshToken.deleteMany({
          where: {
            id: {
              in: tokensToDelete.map((token: RefreshToken & { user: { email: string } }) => token.id)
            }
          }
        });

        return {
          count: deleteResult.count,
          users: tokensToDelete.map((token: RefreshToken & { user: { email: string } }) => token.user.email)
        } as CleanupResult;
      });

      this.metrics.expiredTokensRemoved += result.count;
      this.metrics.lastCleanupTime = new Date();

      const duration = Date.now() - startTime;
      
      if (result.count > 0) {
        this.logger.log(`Removidos ${result.count} tokens expirados em ${duration}ms`);
        this.logger.debug(`Usuários afetados: ${result.users?.join(', ')}`);
      } else {
        this.logger.debug(`Verificação concluída em ${duration}ms. Nenhum token expirado para remover.`);
      }
    } catch (error) {
      this.metrics.errors++;
      this.logger.error('Erro ao limpar tokens expirados:', error instanceof Error ? error.stack : error);
      throw error;
    }
  }

  @Cron(CronExpression.EVERY_WEEK)
  async cleanupInactiveTokens(): Promise<void> {
    const startTime = Date.now();
    this.logger.log('Iniciando limpeza de tokens inativos...');

    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const result = await this.prisma.$transaction(async (prisma: PrismaService) => {
        const inactiveTokens = await prisma.refreshToken.findMany({
          where: {
            lastUsed: {
              lt: thirtyDaysAgo
            },
            user: {
              orders: {
                none: {
                  status: {
                    in: ['PENDING', 'PROCESSING']
                  }
                }
              }
            }
          },
          include: {
            user: true
          }
        });

        if (inactiveTokens.length === 0) {
          return { count: 0 } as CleanupResult;
        }

        const deleteResult = await prisma.refreshToken.deleteMany({
          where: {
            id: {
              in: inactiveTokens.map((token: RefreshToken & { user: { email: string } }) => token.id)
            }
          }
        });

        return {
          count: deleteResult.count,
          users: inactiveTokens.map((token: RefreshToken & { user: { email: string } }) => token.user.email)
        } as CleanupResult;
      });

      this.metrics.inactiveTokensRemoved += result.count;
      this.metrics.lastCleanupTime = new Date();

      const duration = Date.now() - startTime;

      if (result.count > 0) {
        this.logger.log(`Removidos ${result.count} tokens inativos em ${duration}ms`);
        this.logger.debug(`Usuários afetados: ${result.users?.join(', ')}`);
      } else {
        this.logger.debug(`Verificação concluída em ${duration}ms. Nenhum token inativo para remover.`);
      }
    } catch (error) {
      this.metrics.errors++;
      this.logger.error('Erro ao limpar tokens inativos:', error instanceof Error ? error.stack : error);
      throw error;
    }
  }

  async updateTokenLastUsed(tokenId: string): Promise<void> {
    try {
      await this.prisma.refreshToken.update({
        where: { id: tokenId },
        data: { lastUsed: new Date() }
      });
      this.logger.debug(`Token ${tokenId} atualizado com sucesso`);
    } catch (error) {
      this.metrics.errors++;
      this.logger.error(`Erro ao atualizar lastUsed do token ${tokenId}:`, error instanceof Error ? error.stack : error);
      throw error;
    }
  }
}
