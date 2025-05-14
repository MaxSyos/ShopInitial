import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../services/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CartService } from '../cart/cart.service';
import { ProductService } from '../product/product.service';
import { OrderResponse } from './interfaces/order-response.interface';
import { OrderStatus, Prisma } from '@prisma/client';

/**
 * Serviço responsável pelo gerenciamento de pedidos
 * 
 * @remarks
 * Este serviço gerencia:
 * - Criação de pedidos a partir do carrinho
 * - Validação de estoque
 * - Atualização de status do pedido
 * - Cálculo de valores
 */
@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cartService: CartService,
    private readonly productService: ProductService,
  ) {}

  /**
   * Cria um novo pedido a partir do carrinho do usuário
   * 
   * @param userId - ID do usuário que está realizando o pedido
   * @param createOrderDto - DTO com dados do pedido
   * @returns Pedido criado com todos os detalhes
   * 
   * @throws BadRequestException
   * - Se o carrinho estiver vazio
   * - Se algum produto estiver fora de estoque
   */
  /**
   * Mapeia um pedido do banco de dados para o formato da resposta da API
   */
  private mapOrderToResponse(order: any): OrderResponse {
    return {
      id: order.id,
      userId: order.userId,
      status: order.status,
      total: order.total.toNumber(),
      items: order.items.map((item: any) => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price.toNumber(),
        product: {
          name: item.product.name,
          images: item.product.images,
        },
      })),
      shippingAddress: {
        street: order.street,
        city: order.city,
        state: order.state,
        country: order.country,
        postalCode: order.postalCode,
      },
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }

  async create(userId: string, createOrderDto: CreateOrderDto): Promise<OrderResponse> {
    // Obtém o carrinho do usuário
    const cart = await this.cartService.getOrCreateCart(userId);
    
    if (!cart.items || cart.items.length === 0) {
      throw new BadRequestException('O carrinho está vazio');
    }

    // Valida o estoque de todos os produtos
    for (const item of cart.items) {
      const product = await this.productService.findOne(item.product.id);
      if (product.stock < item.quantity) {
        throw new BadRequestException(
          `Produto ${product.name} não tem estoque suficiente. Disponível: ${product.stock}`,
        );
      }
    }

    // Inicia uma transação
    const order = await this.prisma.$transaction(async (tx) => {
      try {
        // Cria o pedido
        const order = await tx.order.create({
          data: {
            userId,
            status: 'PENDING',
            total: cart.total,
            street: createOrderDto.shippingAddress.street,
            city: createOrderDto.shippingAddress.city,
            state: createOrderDto.shippingAddress.state,
            country: createOrderDto.shippingAddress.country,
            postalCode: createOrderDto.shippingAddress.postalCode,
            items: {
              create: cart.items.map((item) => ({
                productId: item.product.id,
                quantity: item.quantity,
                price: item.product.price,
              })),
            },
          },
          include: {
            items: {
              include: {
                product: true,
              },
            },
            shippingAddress: true,
          },
        });

        // Atualiza o estoque dos produtos
        for (const item of cart.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          });
        }

        // Limpa o carrinho
        await this.cartService.clearCart(userId);

        return order;
      } catch (error) {
        throw new InternalServerErrorException(
          'Erro ao processar o pedido. Por favor, tente novamente.',
        );
      }
    });
  }

  /**
   * Busca um pedido específico
   * 
   * @param orderId - ID do pedido
   * @param userId - ID do usuário (para validação de acesso)
   * @returns Pedido com todos os detalhes
   * 
   * @throws NotFoundException
   * - Se o pedido não for encontrado
   * - Se o pedido não pertencer ao usuário
   */
  async findOne(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        shippingAddress: true,
      },
    });

    if (!order || order.userId !== userId) {
      throw new NotFoundException('Pedido não encontrado');
    }

    return order;
  }

  /**
   * Lista todos os pedidos de um usuário
   * 
   * @param userId - ID do usuário
   * @returns Lista de pedidos com detalhes básicos
   */
  async findAll(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                images: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
