import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../services/prisma.service';
import { RedisService } from '../redis/redis.service';
import { NotificationService } from '../notification/notification.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { Payment, PaymentStatus, PaymentMethod, NotificationType, OrderStatus, OrderItem } from '@prisma/client';
import { MercadoPagoProvider } from './providers/mercadopago.provider';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly notificationService: NotificationService,
    private readonly mercadoPagoProvider: MercadoPagoProvider,
  ) {}

  private serializePayment(payment: Payment): any {
    return {
      ...payment,
      transactionId: payment.transactionId ? payment.transactionId.toString() : null,
      amount: payment.amount ? Number(payment.amount) : null
    };
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

      // 1. Primeiro criar o registro do pagamento no banco com status inicial
      const initialPayment = await this.prisma.payment.create({
        data: {
          amount,
          currency,
          status: PaymentStatus.PENDING,
          paymentMethod,
          provider: 'MERCADOPAGO',
          orderId: orderId // Estabelece a relação diretamente usando orderId
        },
        include: {
          order: {
            include: {
              user: true
            }
          }
        }
      });

      const paymentData = {
        amount,
        currency,
        description: `Pedido #${orderId}`,
        orderId, // Usar o ID do pedido como referência externa
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

      // 2. Criar o pagamento no Mercado Pago
      const paymentResponse = await this.mercadoPagoProvider.createPayment(paymentData);

      // Verificar se o pagamento criado no MP corresponde ao nosso orderId
      if (paymentResponse.externalReference !== orderId) {
        this.logger.error('Inconsistência na criação do pagamento:', {
          expectedOrderId: orderId,
          receivedExternalReference: paymentResponse.externalReference
        });
        throw new Error('Erro de consistência na criação do pagamento');
      }

      // 3. Atualizar o registro com os dados do Mercado Pago
      const updatedPayment = await this.prisma.payment.update({
        where: { id: initialPayment.id },
        data: {
          status: paymentMethod === PaymentMethod.PIX ? PaymentStatus.WAITING_PAYMENT : PaymentStatus.PENDING,
          transactionId: BigInt(paymentResponse.id),
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

      if (paymentResponse.paymentUrl) {
        await this.redisService.set(
          `payment_url:${updatedPayment.id}`,
          paymentResponse.paymentUrl,
          60 * 30
        );
      }

      await this.notificationService.create({
        userId: order.userId,
        type: NotificationType.PAYMENT_PENDING,
        title: paymentMethod === PaymentMethod.PIX ? 'Pagamento PIX Gerado' : 'Pagamento Iniciado',
        message: this.getPaymentMessage(updatedPayment),
        link: paymentResponse.paymentUrl || `/orders/${orderId}`,
      });

      return this.serializePayment(updatedPayment);
    } catch (error: any) {
      throw new BadRequestException(`Erro ao processar pagamento: ${error.message}`);
    }
  }

  async webhook(signature: string, payload: Buffer): Promise<{ received: boolean; message?: string }> {
    try {
      this.logger.debug('Processando webhook do Mercado Pago', {
        payload: payload.toString(),
      });

      const webhookData = JSON.parse(payload.toString());
      
      if (!webhookData.type || !webhookData.data || !webhookData.data.id) {
        return { received: false, message: 'Estrutura do webhook inválida' };
      }

      const isTestEnvironment = this.configService.get('NODE_ENV') !== 'production';
      
      if (!isTestEnvironment) {
        const isValid = await this.mercadoPagoProvider.validateWebhook(signature, payload);
        if (!isValid) {
          return { received: false, message: 'Assinatura do webhook inválida' };
        }
      }

      if (webhookData.type === 'payment') {
        const mpPaymentId = webhookData.data.id;
        
        // Busca os detalhes do pagamento no Mercado Pago para obter o external_reference
        const mpPaymentDetails = await this.mercadoPagoProvider.getPaymentDetails(mpPaymentId);
        if (!mpPaymentDetails) {
          return { 
            received: true, 
            message: 'Não foi possível obter detalhes do pagamento do Mercado Pago' 
          };
        }

        // Busca o pagamento usando orderId (external_reference) e transactionId
        const payment = await this.prisma.payment.findFirst({
          where: {
            OR: [
              { orderId: mpPaymentDetails.external_reference },
              { transactionId: BigInt(mpPaymentId) }
            ]
          },
          include: { order: true }
        });

        if (!payment) {
          this.logger.warn(`Pagamento não encontrado. MP Payment ID: ${mpPaymentId}, External Reference: ${mpPaymentDetails.external_reference}`);
          return { 
            received: true, 
            message: 'Pagamento ainda não existe no sistema' 
          };
        }

        // Verifica se o orderId corresponde ao external_reference
        if (payment.orderId !== mpPaymentDetails.external_reference) {
          this.logger.error(`Inconsistência encontrada - OrderId: ${payment.orderId}, External Reference: ${mpPaymentDetails.external_reference}`);
          return {
            received: false,
            message: 'Inconsistência entre OrderId e External Reference'
          };
        }

        try {
          if (isTestEnvironment) {
            await this.updatePaymentStatus(payment.id, PaymentStatus.COMPLETED);
          } else {
            const newStatus = await this.mercadoPagoProvider.getPaymentStatus(mpPaymentId);
            if (newStatus !== payment.status) {
              await this.updatePaymentStatus(payment.id, newStatus as PaymentStatus);
            }
          }
        } catch (error) {
          this.logger.error(`Erro ao processar atualização do pagamento: ${error.message}`);
          return { 
            received: true, 
            message: `Erro ao processar atualização: ${error.message}` 
          };
        }
      }

      return { received: true };
    } catch (error: any) {
      this.logger.error(`Erro ao processar webhook: ${error.message}`, error);
      return { received: false, message: error.message };
    }
  }

  async processPaymentUpdate(paymentId: string): Promise<void> {
    try {
      this.logger.debug(`Processando atualização do pagamento: ${paymentId}`);
      
      const payment = await this.prisma.payment.findUnique({
        where: { transactionId: BigInt(paymentId) },
        include: { order: true }
      });

      if (!payment) {
        throw new Error(`Pagamento não encontrado: ${paymentId}`);
      }

      const newStatus = await this.mercadoPagoProvider.getPaymentStatus(paymentId);
      const currentStatus = payment.status;

      if (newStatus !== currentStatus) {
        await this.updatePaymentStatus(payment.id, newStatus as PaymentStatus);
      }
    } catch (error) {
      this.logger.error(`Erro ao processar atualização do pagamento: ${error.message}`, error);
      throw error;
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

    updates.push(
      this.prisma.payment.update({
        where: { id: paymentId },
        data: { status }
      })
    );

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

    updates.push(
      this.prisma.order.update({
        where: { id: completePayment.order.id },
        data: { status: orderStatus }
      })
    );

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

    await this.prisma.$transaction(updates);
  }

  async findOne(id: string): Promise<Payment | null> {
    const payment = await this.prisma.payment.findUnique({
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

    return payment ? this.serializePayment(payment) : null;
  }

  async checkPaymentStatus(id: string): Promise<{ status: PaymentStatus; pixCode?: string; pixQrCode?: string; pixExpiresAt?: Date }> {
    const payment = await this.prisma.payment.findUnique({
      where: { id }
    });

    if (!payment) {
      throw new NotFoundException('Pagamento não encontrado');
    }

    if (payment.paymentMethod === PaymentMethod.PIX && payment.transactionId) {
      const status = await this.mercadoPagoProvider.getPaymentStatus(payment.transactionId.toString());
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

      const refunded = await this.mercadoPagoProvider.refundPayment(payment.transactionId.toString());
      if (!refunded) {
        throw new Error('Falha ao processar reembolso no provedor de pagamento');
      }

      const updatedPayment = await this.prisma.payment.update({
        where: { id },
        data: { status: PaymentStatus.REFUNDED }
      });

      return this.serializePayment(updatedPayment);
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
