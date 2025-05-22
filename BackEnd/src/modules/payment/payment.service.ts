import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../services/prisma.service';
import { RedisService } from '../redis/redis.service';
import { NotificationService } from '../notification/notification.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { Payment, PaymentStatus, PaymentMethod, NotificationType } from '@prisma/client';
import { MercadoPagoProvider } from './providers/mercadopago.provider';
import { StripeProvider } from './providers/stripe.provider';
import { IPaymentProvider } from './interfaces/payment-provider.interface';

@Injectable()
export class PaymentService {
  private provider: IPaymentProvider;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly notificationService: NotificationService,
    private readonly mercadoPagoProvider: MercadoPagoProvider,
    private readonly stripeProvider: StripeProvider,
  ) {
    const paymentProvider = this.configService.get<string>('PAYMENT_PROVIDER');
    this.provider = paymentProvider === 'stripe' ? stripeProvider : mercadoPagoProvider;
  }

  async create(createPaymentDto: CreatePaymentDto): Promise<Payment> {
    const { orderId, amount, currency = 'BRL', paymentMethod = PaymentMethod.CREDIT_CARD } = createPaymentDto;

    try {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: {
          user: true,
          items: {
            include: {
              product: true
            }
          }
        }
      });

      if (!order) {
        throw new BadRequestException('Pedido não encontrado');
      }

      const paymentData = {
        amount,
        currency,
        description: `Pedido #${orderId}`,
        orderId,
        customerId: order.userId,
        paymentMethod,
        items: order.items.map(item => ({
          id: item.product.id,
          title: item.product.name,
          quantity: item.quantity,
          unitPrice: Number(item.price)
        })),
        customer: {
          email: order.user.email,
          firstName: order.user.name.split(' ')[0],
          lastName: order.user.name.split(' ').slice(1).join(' '),
        },
        billingAddress: {
          street: order.street,
          city: order.city,
          state: order.state,
          zipCode: order.postalCode,
          country: order.country
        }
      };

      const paymentResponse = await this.provider.createPayment(paymentData);

      // Criar o registro de pagamento
      const payment = await this.prisma.payment.create({
        data: {
          order: {
            connect: { id: orderId }
          },
          amount,
          currency,
          status: paymentMethod === PaymentMethod.PIX ? PaymentStatus.WAITING_PAYMENT : PaymentStatus.PENDING,
          paymentMethod,
          transactionId: paymentResponse.id,
          pixCode: paymentResponse.processorResponse?.pixCode,
          pixQrCode: paymentResponse.processorResponse?.pixQrCode,
          pixExpiresAt: paymentResponse.processorResponse?.pixExpiresAt,
          paymentUrl: paymentResponse.paymentUrl,
        },
      });

      // Cache da URL de pagamento
      if (paymentResponse.paymentUrl) {
        await this.redisService.set(
          `payment_url:${payment.id}`,
          paymentResponse.paymentUrl,
          60 * 30 // 30 minutos
        );
      }

      // Notificar usuário
      await this.notificationService.create({
        userId: order.userId,
        type: NotificationType.PAYMENT_PENDING,
        title: 'Pagamento Iniciado',
        message: this.getPaymentMessage(payment),
        link: paymentResponse.paymentUrl || `/orders/${orderId}`,
      });

      return payment;
    } catch (error: any) {
      throw new BadRequestException(`Erro ao processar pagamento: ${error.message}`);
    }
  }

  async webhook(signature: string, payload: Buffer): Promise<{ received: boolean }> {
    try {
      const isValid = await this.provider.validateWebhook(payload, signature);
      if (!isValid) {
        throw new Error('Assinatura do webhook inválida');
      }

      const paymentData = JSON.parse(payload.toString());
      const payment = await this.prisma.payment.findUnique({
        where: { transactionId: paymentData.id.toString() },
        include: { order: true }
      });

      if (!payment) {
        throw new Error('Pagamento não encontrado');
      }

      const newStatus = await this.provider.getPaymentStatus(paymentData.id.toString());
      await this.updatePaymentStatus(payment, newStatus);

      return { received: true };
    } catch (error: any) {
      throw new BadRequestException(`Erro no webhook: ${error.message}`);
    }
  }

  async updatePaymentStatus(payment: Payment, newStatus: string): Promise<void> {
    const statusMap: Record<string, { status: PaymentStatus; type: NotificationType; title: string; }> = {
      'PENDING': {
        status: PaymentStatus.PENDING,
        type: NotificationType.PAYMENT_PENDING,
        title: 'Pagamento Pendente'
      },
      'COMPLETED': {
        status: PaymentStatus.COMPLETED,
        type: NotificationType.PAYMENT_COMPLETED,
        title: 'Pagamento Confirmado'
      },
      'FAILED': {
        status: PaymentStatus.FAILED,
        type: NotificationType.PAYMENT_FAILED,
        title: 'Falha no Pagamento'
      },
      'CANCELLED': {
        status: PaymentStatus.CANCELLED,
        type: NotificationType.PAYMENT_CANCELLED,
        title: 'Pagamento Cancelado'
      },
      'EXPIRED': {
        status: PaymentStatus.EXPIRED,
        type: NotificationType.PAYMENT_EXPIRED,
        title: 'Pagamento Expirado'
      },
      'WAITING_PAYMENT': {
        status: PaymentStatus.WAITING_PAYMENT,
        type: NotificationType.PAYMENT_WAITING,
        title: 'Aguardando Pagamento'
      }
    };

    const statusInfo = statusMap[newStatus];
    if (!statusInfo) return;

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: statusInfo.status }
    });

    // Busca o order para obter o userId
    const order = await this.prisma.order.findUnique({
      where: { id: payment.orderId },
      select: { userId: true }
    });

    if (!order) {
      throw new Error('Pedido não encontrado');
    }

    await this.notificationService.create({
      userId: order.userId,
      type: statusInfo.type,
      title: statusInfo.title,
      message: this.getStatusMessage(payment, statusInfo.status),
      link: `/orders/${payment.orderId}`,
    });
  }

  async findOne(id: string): Promise<Payment | null> {
    return this.prisma.payment.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            user: true,
            items: true
          }
        }
      }
    });
  }

  async checkPaymentStatus(id: string): Promise<{ status: PaymentStatus; pixCode?: string; pixQrCode?: string; pixExpiresAt?: Date }> {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        order: {
          select: {
            userId: true
          }
        }
      }
    });

    if (!payment) {
      throw new NotFoundException('Pagamento não encontrado');
    }

    // Se for um pagamento PIX, verifica o status atual no provedor
    if (payment.paymentMethod === PaymentMethod.PIX && payment.transactionId) {
      const status = await this.provider.getPaymentStatus(payment.transactionId);
      if (status !== payment.status) {
        await this.updatePaymentStatus(payment, status);
        payment.status = status as PaymentStatus;
      }
    }

    return {
      status: payment.status,
      pixCode: payment.pixCode || undefined,
      pixQrCode: payment.pixQrCode || undefined,
      pixExpiresAt: payment.pixExpiresAt || undefined
    };
  }

  async refund(id: string): Promise<Payment> {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            user: true
          }
        }
      }
    });

    if (!payment) {
      throw new BadRequestException('Pagamento não encontrado');
    }

    if (payment.status !== PaymentStatus.COMPLETED) {
      throw new BadRequestException('Apenas pagamentos confirmados podem ser reembolsados');
    }

    try {
      if (!payment.transactionId) {
        throw new Error('ID da transação não encontrado');
      }

      const refunded = await this.provider.refundPayment(payment.transactionId);
      if (!refunded) {
        throw new Error('Falha ao processar reembolso no provedor de pagamento');
      }

      const updatedPayment = await this.prisma.payment.update({
        where: { id },
        data: { status: PaymentStatus.REFUNDED }
      });

      // Notificar o usuário sobre o reembolso
      await this.notificationService.create({
        userId: payment.order.userId,
        type: NotificationType.PAYMENT_REFUNDED,
        title: 'Reembolso Processado',
        message: `O reembolso do seu pedido #${payment.orderId} foi processado com sucesso.`,
        link: `/orders/${payment.orderId}`,
      });

      return updatedPayment;
    } catch (error: any) {
      throw new BadRequestException(`Erro ao processar reembolso: ${error.message}`);
    }
  }

  private getPaymentMessage(payment: Payment): string {
    if (payment.paymentMethod === PaymentMethod.PIX) {
      return `Seu pagamento PIX para o pedido #${payment.orderId} foi gerado. Use o QR Code ou código PIX para pagar.`;
    }
    return `Seu pagamento para o pedido #${payment.orderId} foi iniciado. Por favor, complete o pagamento.`;
  }

  private getStatusMessage(payment: Payment, status: PaymentStatus): string {
    const messages: Record<PaymentStatus, string> = {
      [PaymentStatus.PENDING]: `Aguardando confirmação do pagamento do pedido #${payment.orderId}`,
      [PaymentStatus.COMPLETED]: `O pagamento do seu pedido #${payment.orderId} foi confirmado com sucesso!`,
      [PaymentStatus.FAILED]: `Houve uma falha no processamento do pagamento do pedido #${payment.orderId}`,
      [PaymentStatus.CANCELLED]: `O pagamento do pedido #${payment.orderId} foi cancelado`,
      [PaymentStatus.REFUNDED]: `O reembolso do seu pedido #${payment.orderId} foi processado`,
      [PaymentStatus.WAITING_PAYMENT]: `Aguardando o pagamento PIX do pedido #${payment.orderId}`,
      [PaymentStatus.EXPIRED]: `O prazo para pagamento do pedido #${payment.orderId} expirou`
    };

    return messages[status] || `Status do pagamento do pedido #${payment.orderId} foi atualizado`;
  }
}
