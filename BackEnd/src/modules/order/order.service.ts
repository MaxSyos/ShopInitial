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
import { OrderResponse, IOrderItemResponse } from './interfaces/order-response.interface';
import { OrderStatus, Prisma } from '@prisma/client';
import { NotificationService } from '../notification/notification.service';

/**
 * Serviço responsável pelo gerenciamento de pedidos
 */
@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cartService: CartService,
    private readonly productService: ProductService,
    private readonly notificationService: NotificationService,
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
  async create(userId: string, createOrderDto: CreateOrderDto): Promise<OrderResponse> {
    const cart = await this.cartService.findByUserId(userId);
    if (!cart || !cart.items.length) {
      throw new BadRequestException('Carrinho vazio');
    }

    try {
      const order = await this.prisma.$transaction(async (prisma) => {
        // 1. Calcular o total
        const total = cart.items.reduce(
          (sum, item) => sum + Number(item.product.price) * item.quantity,
          0
        );

        // 2. Criar o pedido com os itens do carrinho
        const order = await prisma.order.create({
          data: {
            userId,
            status: OrderStatus.PENDING,
            total,
            street: createOrderDto.street || '',
            city: createOrderDto.city || '',
            state: createOrderDto.state || '',
            country: createOrderDto.country || '',
            postalCode: createOrderDto.postalCode || '',
            items: {
              create: cart.items.map((item) => ({
                quantity: item.quantity,
                price: item.product.price,
                productId: item.product.id,
              })),
            },
          },
          include: {
            items: {
              include: {
                product: true,
              },
            },
            user: true,
          },
        });

        // 3. Atualizar o estoque dos produtos
        for (const item of cart.items) {
          await prisma.product.update({
            where: { id: item.product.id },
            data: { stock: { decrement: item.quantity } },
          });
        }

        // 4. Limpar o carrinho
        await this.cartService.clear(userId);

        // 5. Enviar notificação
        await this.notificationService.notifyOrderCreated(userId, order.id);

        return order;
      });

      // 6. Transformar a resposta
      const items: IOrderItemResponse[] = order.items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        price: Number(item.price),
        product: {
          id: item.product.id,
          name: item.product.name,
          price: Number(item.product.price),
        },
      }));

      return {
        id: order.id,
        status: order.status,
        total: Number(order.total),
        items,
        user: {
          id: order.user.id,
          name: order.user.name,
          email: order.user.email,
        },
        shippingAddress: {
          id: order.id,
          street: order.street,
          city: order.city,
          state: order.state,
          country: order.country,
          postalCode: order.postalCode,
        },
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new BadRequestException('Erro de restrição única');
        }
      }
      throw new InternalServerErrorException('Erro ao criar pedido');
    }
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
  async findOne(orderId: string, userId: string): Promise<OrderResponse> {
    const order = await this.prisma.order.findFirst({
      where: { 
        id: orderId,
        userId,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        user: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }

    const items: IOrderItemResponse[] = order.items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      price: Number(item.price),
      product: {
        id: item.product.id,
        name: item.product.name,
        price: Number(item.product.price),
      },
    }));

    return {
      id: order.id,
      status: order.status,
      total: Number(order.total),
      items,
      user: {
        id: order.user.id,
        name: order.user.name,
        email: order.user.email,
      },
      shippingAddress: {
        id: order.id,
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

  /**
   * Lista todos os pedidos de um usuário
   * 
   * @param userId - ID do usuário
   * @returns Lista de pedidos com detalhes básicos
   */
  async findAll(userId: string): Promise<OrderResponse[]> {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return orders.map((order) => {
      const items: IOrderItemResponse[] = order.items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        price: Number(item.price),
        product: {
          id: item.product.id,
          name: item.product.name,
          price: Number(item.product.price),
        },
      }));

      return {
        id: order.id,
        status: order.status,
        total: Number(order.total),
        items,
        user: {
          id: order.user.id,
          name: order.user.name,
          email: order.user.email,
        },
        shippingAddress: {
          id: order.id,
          street: order.street,
          city: order.city,
          state: order.state,
          country: order.country,
          postalCode: order.postalCode,
        },
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      };
    });
  }

  /**
   * Atualiza o status de um pedido
   * 
   * @param orderId - ID do pedido
   * @param userId - ID do usuário (para validação de acesso)
   * @param status - Novo status do pedido
   * @returns Pedido atualizado com todos os detalhes
   * 
   * @throws NotFoundException
   * - Se o pedido não for encontrado
   */
  async updateStatus(orderId: string, userId: string, status: OrderStatus): Promise<OrderResponse> {
    // 1. Buscar o pedido
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        user: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }

    // 2. Atualizar o status
    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        user: true,
      },
    });

    // 3. Enviar notificação
    await this.notificationService.notifyOrderStatusUpdated(userId, orderId, status);

    // 4. Transformar a resposta
    const items: IOrderItemResponse[] = updatedOrder.items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      price: Number(item.price),
      product: {
        id: item.product.id,
        name: item.product.name,
        price: Number(item.product.price),
      },
    }));

    return {
      id: updatedOrder.id,
      status: updatedOrder.status,
      total: Number(updatedOrder.total),
      items,
      user: {
        id: updatedOrder.user.id,
        name: updatedOrder.user.name,
        email: updatedOrder.user.email,
      },
      shippingAddress: {
        id: updatedOrder.id,
        street: updatedOrder.street,
        city: updatedOrder.city,
        state: updatedOrder.state,
        country: updatedOrder.country,
        postalCode: updatedOrder.postalCode,
      },
      createdAt: updatedOrder.createdAt,
      updatedAt: updatedOrder.updatedAt,
    };
  }
}
