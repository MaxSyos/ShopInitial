import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CacheTestService } from '../../services/cache-test.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly cacheTestService: CacheTestService) {}

  @Get('redis')
  @ApiOperation({ summary: 'Testa a conexão com Redis' })
  @ApiResponse({
    status: 200,
    description: 'Redis está funcionando corretamente',
    schema: {
      properties: {
        status: { type: 'string' },
        message: { type: 'string' },
      },
    },
  })
  async testRedis() {
    return this.cacheTestService.testConnection();
  }

  @Get('redis/operations')
  @ApiOperation({ summary: 'Testa operações no Redis' })
  @ApiResponse({
    status: 200,
    description: 'Resultado dos testes de operações no Redis',
    schema: {
      properties: {
        status: { type: 'string' },
        operations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              operation: { type: 'string' },
              success: { type: 'boolean' },
              time: { type: 'number' },
            },
          },
        },
      },
    },
  })
  async testRedisOperations() {
    return this.cacheTestService.testCacheOperations();
  }
}
