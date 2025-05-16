import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../services/prisma.service';
import { RedisService } from '../redis/redis.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentStatus, Payment } from '@prisma/client';
import Stripe from 'stripe';

@Injectable()
export class PaymentService {
  private stripe: Stripe;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {
    this.stripe = new Stripe(this.configService.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2025-04-30.basil',
    });
  }

  async findByOrderId(orderId: string): Promise<Payment | null> {
    return this.prisma.payment.findUnique({
      where: {
        orderId,
      },
    });
  }

  async create(createPaymentDto: CreatePaymentDto): Promise<Payment> {
    const { orderId, paymentMethodId, amount, currency = 'BRL' } = createPaymentDto;

    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency,
        payment_method: paymentMethodId,
        confirm: true,
        return_url: this.configService.get('PAYMENT_RETURN_URL'),
      });

      return await this.prisma.payment.create({
        data: {
          order: {
            connect: { id: orderId }
          },
          amount,
          currency,
          status: PaymentStatus.COMPLETED,
          transactionId: paymentIntent.id,
          paymentMethod: 'CREDIT_CARD',
        },
      });
    } catch (error: any) {
      throw new BadRequestException(`Erro ao processar pagamento: ${error.message}`);
    }
  }

  async refund(paymentId: string): Promise<Payment> {
    const existingPayment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!existingPayment) {
      throw new BadRequestException('Pagamento não encontrado');
    }

    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: existingPayment.transactionId || '',
      });

      return await this.prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.REFUNDED,
          refundId: refund.id,
        },
      });
    } catch (error: any) {
      throw new BadRequestException(`Erro ao processar reembolso: ${error.message}`);
    }
  }

  async webhook(signature: string, payload: Buffer): Promise<{ received: boolean }> {
    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        this.configService.get('STRIPE_WEBHOOK_SECRET') || '',
      );

      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailure(event.data.object as Stripe.PaymentIntent);
          break;
        default:
          console.log(`Evento não tratado: ${event.type}`);
          break;
      }

      return { received: true };
    } catch (error: any) {
      throw new BadRequestException(`Webhook error: ${error.message}`);
    }
  }

  private async handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const existingPayment = await this.prisma.payment.findFirst({
      where: { transactionId: paymentIntent.id },
    });

    if (existingPayment) {
      await this.prisma.payment.update({
        where: { id: existingPayment.id },
        data: { status: PaymentStatus.COMPLETED },
      });
    }
  }

  private async handlePaymentFailure(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const existingPayment = await this.prisma.payment.findFirst({
      where: { transactionId: paymentIntent.id },
    });

    if (existingPayment) {
      await this.prisma.payment.update({
        where: { id: existingPayment.id },
        data: { status: PaymentStatus.FAILED },
      });
    }
  }
}
