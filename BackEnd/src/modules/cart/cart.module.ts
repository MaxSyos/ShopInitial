import { Module } from '@nestjs/common';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { PrismaService } from '../../services/prisma.service';
import { ProductModule } from '../product/product.module';
import { RedisModule } from '../redis/redis.module';

/**
 * Módulo responsável por gerenciar as operações do carrinho de compras
 * 
 * @remarks
 * Este módulo integra:
 * - Controlador do carrinho para endpoints da API
 * - Serviço do carrinho para lógica de negócios
 * - Serviço Prisma para acesso ao banco de dados
 * - Módulo de produtos para validações de estoque
 */
@Module({
  imports: [ProductModule, RedisModule], // Importa o módulo de produtos e o RedisModule
  controllers: [CartController], // Registra o controlador do carrinho
  providers: [CartService, PrismaService], // Registra os serviços necessários
  exports: [CartService], // Exporta o serviço do carrinho para uso em outros módulos
})
export class CartModule {}
