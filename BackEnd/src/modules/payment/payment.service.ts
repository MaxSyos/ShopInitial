import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../services/prisma.service';
import { RedisService } from '../redis/redis.service';
import { NotificationService } from '../notification/notification.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { Payment, PaymentStatus, PaymentMethod, NotificationType, OrderStatus, Prisma } from '@prisma/client';
import { MercadoPagoProvider } from './providers/mercadopago.provider';
import { StripeProvider } from './providers/stripe.provider';
import { IPaymentProvider } from './interfaces/payment-provider.interface';

@Injectable()
export class PaymentService {
  private provider: IPaymentProvider;
  private readonly logger = new Logger(PaymentService.name);

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
          provider: 'MERCADOPAGO',
          transactionId: paymentResponse.id,
          pixCode: paymentResponse.processorResponse?.pixCode,
          pixQrCode: paymentResponse.processorResponse?.pixQrCode,
          pixExpiresAt: paymentResponse.processorResponse?.pixExpiresAt,
          paymentUrl: paymentResponse.paymentUrl,
          metadata: {
            createdAt: paymentResponse.processorResponse?.createdAt,
            lastUpdatedAt: paymentResponse.processorResponse?.lastUpdatedAt,
            transactionAmount: paymentResponse.processorResponse?.transactionAmount,
            paymentMethodId: paymentResponse.processorResponse?.paymentMethodId,
            paymentTypeId: paymentResponse.processorResponse?.paymentTypeId,
            rawResponse: paymentResponse.processorResponse?.raw
          }
        },
        include: {
          order: {
            include: {
              user: true
            }
          }
        }
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
      // Validar assinatura
      const isValid = await this.provider.validateWebhook(payload, signature);
      if (!isValid) {
        throw new Error('Assinatura do webhook inválida');
      }

      // Parse do payload
      const webhookData = JSON.parse(payload.toString());
      if (webhookData.type === 'payment' && webhookData.data?.id) {
        const paymentId = webhookData.data.id.toString();
        const payment = await this.prisma.payment.findUnique({
          where: { transactionId: paymentId }
        });

        if (payment) {
          const newStatus = await this.provider.getPaymentStatus(paymentId);
          await this.updatePaymentStatus(payment.id, newStatus as PaymentStatus);
        }
      }

      return { received: true };
    } catch (error: any) {
      this.logger.error(`Erro ao processar webhook: ${error.message}`);
      throw new Error(`Erro ao processar webhook: ${error.message}`);
    }
  }

  private async getCompletePayment(paymentId: string): Promise<Payment & { order: { id: string; userId: string; status: OrderStatus } }> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        order: {
          select: {
            id: true,
            userId: true,
            status: true
          }
        }
      }
    });

    if (!payment || !payment.order) {
      throw new Error('Pagamento ou ordem não encontrado');
    }

    return payment;
  }

  private async updatePaymentStatus(paymentId: string, status: PaymentStatus): Promise<void> {
    const completePayment = await this.getCompletePayment(paymentId);

    const updates: any[] = [];

    // Atualizar status do pagamento
    updates.push(
      this.prisma.payment.update({
        where: { id: paymentId },
        data: { status }
      })
    );

    // Mapear status de pagamento para status de pedido
    let orderStatus: typeof OrderStatus[keyof typeof OrderStatus];
    switch (status) {
      case PaymentStatus.COMPLETED:
        orderStatus = 'PAID';
        break;
      case PaymentStatus.FAILED:
        orderStatus = 'PAYMENT_FAILED';
        break;
      case PaymentStatus.EXPIRED:
        orderStatus = 'PAYMENT_EXPIRED';
        break;
      case PaymentStatus.CANCELLED:
        orderStatus = 'CANCELLED';
        break;
      default:
        orderStatus = 'PENDING';
    }

    // Atualizar status do pedido
    updates.push(
      this.prisma.order.update({
        where: { id: completePayment.order.id },
        data: { status: orderStatus }
      })
    );

    // Criar notificação usando PrismaPromise
    updates.push(
      this.prisma.notification.create({
        data: {
          userId: completePayment.order.userId,
          type: NotificationType.ORDER_STATUS_UPDATED,
          title: 'Atualização de Pagamento',
          message: `O status do seu pagamento foi atualizado para ${status}`,
          link: `/orders/${completePayment.order.id}`
        }
      })
    );

    // Executar todas as atualizações em uma transação
    await this.prisma.$transaction(updates);
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
      where: { id }
    });

    if (!payment) {
      throw new NotFoundException('Pagamento não encontrado');
    }

    // Se for um pagamento PIX, verifica o status atual no provedor
    if (payment.paymentMethod === PaymentMethod.PIX && payment.transactionId) {
      const status = await this.provider.getPaymentStatus(payment.transactionId);
      if (status !== payment.status) {
        await this.updatePaymentStatus(payment.id, status as PaymentStatus);
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

  async processPaymentUpdate(paymentId: string): Promise<void> {
    try {
      this.logger.debug(`Processando atualização do pagamento: ${paymentId}`);
      
      const payment = await this.prisma.payment.findUnique({
        where: { transactionId: paymentId },
        include: {
          order: true
        }
      });

      if (!payment) {
        throw new Error(`Pagamento não encontrado: ${paymentId}`);
      }

      // Obter status atual do pagamento no Mercado Pago
      const newStatus = await this.provider.getPaymentStatus(paymentId);
      const currentStatus = payment.status;

      if (newStatus !== currentStatus) {
        this.logger.debug(`Atualizando status do pagamento ${paymentId}: ${currentStatus} -> ${newStatus}`);
        
        await this.updatePaymentStatus(payment.id, newStatus as PaymentStatus);

        // Se o pagamento foi concluído, enviar notificação
        if (newStatus === PaymentStatus.COMPLETED) {
          await this.notificationService.create({
            userId: payment.order.userId,
            type: 'PAYMENT_COMPLETED',
            title: 'Pagamento confirmado',
            message: `Seu pagamento para o pedido #${payment.orderId} foi confirmado.`,
            metadata: {
              orderId: payment.orderId,
              paymentId: payment.id
            }
          });
        }
      }
    } catch (error) {
      this.logger.error(`Erro ao processar atualização do pagamento: ${error.message}`);
      throw error;
    }
  }
}
