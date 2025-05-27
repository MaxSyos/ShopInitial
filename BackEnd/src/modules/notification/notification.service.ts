import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../services/prisma.service';
import { CreateNotificationDto } from './dto/notification.dto';
import { NotificationType } from '@prisma/client';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createNotificationDto: CreateNotificationDto) {
    return this.prisma.notification.create({
      data: {
        type: createNotificationDto.type,
        userId: createNotificationDto.userId,
        title: createNotificationDto.title,
        message: createNotificationDto.message,
        link: createNotificationDto.link,
        metadata: createNotificationDto.metadata ? createNotificationDto.metadata : { DbNull: true },
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findUnread(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId, read: false },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markAsRead(id: string, userId: string) {
    return this.prisma.notification.update({
      where: { 
        id,
        userId 
      },
      data: { read: true },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }

  async delete(id: string, userId: string) {
    return this.prisma.notification.delete({
      where: { 
        id,
        userId 
      },
    });
  }

  async deleteAll(userId: string) {
    return this.prisma.notification.deleteMany({
      where: { userId },
    });
  }

  // Métodos de conveniência para criar notificações específicas
  async notifyOrderCreated(userId: string, orderId: string) {
    return this.create({
      type: NotificationType.ORDER_CREATED,
      userId,
      title: 'Pedido Confirmado',
      message: `Seu pedido #${orderId} foi confirmado e está em processamento.`,
      link: `/orders/${orderId}`,
    });
  }

  async notifyOrderStatusUpdated(userId: string, orderId: string, status: OrderStatus) {
    const statusMessages: Record<OrderStatus, string> = {
      PENDING: 'está aguardando processamento',
      PROCESSING: 'está em processamento',
      SHIPPED: 'foi enviado',
      DELIVERED: 'foi entregue',
      CANCELLED: 'foi cancelado',
      PAID: 'teve o pagamento confirmado',
      PAYMENT_FAILED: 'teve uma falha no pagamento',
      PAYMENT_EXPIRED: 'teve o prazo de pagamento expirado'
    };

    return this.create({
      type: NotificationType.ORDER_STATUS_UPDATED,
      userId,
      title: 'Status do Pedido Atualizado',
      message: `Seu pedido #${orderId} ${statusMessages[status]}`,
      link: `/orders/${orderId}`,
    });
  }

  async notifyLowStock(userId: string, productId: string, productName: string) {
    return this.create({
      type: NotificationType.LOW_STOCK,
      userId,
      title: 'Estoque Baixo',
      message: `O produto "${productName}" está com estoque baixo.`,
      link: `/products/${productId}`,
    });
  }

  async notifyPromotion(userId: string, promotionId: string, title: string) {
    return this.create({
      type: NotificationType.PROMOTION,
      userId,
      title: 'Nova Promoção',
      message: title,
      link: `/promotions/${promotionId}`,
    });
  }

  async notifyPasswordReset(userId: string, token: string) {
    return this.create({
      type: NotificationType.PASSWORD_RESET,
      userId,
      title: 'Redefinição de Senha',
      message: 'Foi solicitada uma redefinição de senha para sua conta.',
      link: `/reset-password?token=${token}`,
    });
  }

  async notifyAccountCreated(userId: string) {
    return this.create({
      type: NotificationType.ACCOUNT_CREATED,
      userId,
      title: 'Bem-vindo!',
      message: 'Sua conta foi criada com sucesso.',
      link: '/profile',
    });
  }
}
