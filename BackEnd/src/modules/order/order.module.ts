import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { PrismaService } from '../../services/prisma.service';
import { CartModule } from '../cart/cart.module';
import { ProductModule } from '../product/product.module';

/**
 * Módulo responsável pelo gerenciamento de pedidos
 * 
 * @remarks
 * Este módulo integra:
 * - CartModule para acesso ao carrinho
 * - ProductModule para validação de estoque
 * - PrismaService para acesso ao banco de dados
 * 
 * @dependencies
 * - CartModule
 * - ProductModule
 * - PrismaService
 */
@Module({
  imports: [CartModule, ProductModule],
  controllers: [OrderController],
  providers: [OrderService, PrismaService],
  exports: [OrderService],
})
export class OrderModule {}
