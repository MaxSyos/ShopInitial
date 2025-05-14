import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../services/prisma.service';
import { RedisService } from '../redis/redis.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentStatus } from '@prisma/client';
import * as stripe from 'stripe';

@Injectable()
export class PaymentService {
  private readonly stripe: stripe.Stripe;
  private readonly PAYMENT_CACHE_PREFIX = 'payment:';
  private readonly PAYMENT_CACHE_TTL = 3600; // 1 hora

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {
    this.stripe = new stripe(this.configService.get('STRIPE_SECRET_KEY'), {
      apiVersion: '2023-10-16',
    });
  }

  async createPayment(createPaymentDto: CreatePaymentDto) {
    const { orderId, amount, provider = 'STRIPE', metadata = {} } = createPaymentDto;

    // Verifica se já existe um pagamento para este pedido
    const existingPayment = await this.prisma.payment.findFirst({
      where: { orderId },
    });

    if (existingPayment) {
      throw new BadRequestException('Já existe um pagamento para este pedido');
    }

    // Cria a intenção de pagamento no Stripe
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe trabalha com centavos
      currency: 'brl',
      metadata: {
        orderId,
        ...metadata,
      },
    });

    // Cria o registro de pagamento no banco
    const payment = await this.prisma.payment.create({
      data: {
        orderId,
        amount,
        status: PaymentStatus.PENDING,
        provider,
        transactionId: paymentIntent.id,
      },
    });

    // Cache do pagamento para consultas rápidas
    await this.cachePayment(payment);

    return {
      ...payment,
      clientSecret: paymentIntent.client_secret,
    };
  }

  async confirmPayment(paymentIntentId: string) {
    // Recupera o pagamento do banco
    const payment = await this.prisma.payment.findFirst({
      where: { transactionId: paymentIntentId },
      include: { order: true },
    });

    if (!payment) {
      throw new BadRequestException('Pagamento não encontrado');
    }

    // Confirma o pagamento no Stripe
    const paymentIntent = await this.stripe.paymentIntents.retrieve(
      paymentIntentId,
    );

    if (paymentIntent.status === 'succeeded') {
      // Atualiza o status do pagamento e do pedido
      const updatedPayment = await this.prisma.$transaction(async (prisma) => {
        const payment = await prisma.payment.update({
          where: { id: payment.id },
          data: { status: PaymentStatus.COMPLETED },
          include: { order: true },
        });

        await prisma.order.update({
          where: { id: payment.orderId },
          data: { status: 'PROCESSING' },
        });

        return payment;
      });

      await this.cachePayment(updatedPayment);
      return updatedPayment;
    }

    throw new BadRequestException('Falha ao confirmar o pagamento');
  }

  async refundPayment(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment || payment.status !== PaymentStatus.COMPLETED) {
      throw new BadRequestException('Pagamento não pode ser reembolsado');
    }

    // Processa o reembolso no Stripe
    await this.stripe.refunds.create({
      payment_intent: payment.transactionId,
    });

    // Atualiza o status do pagamento
    const updatedPayment = await this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: PaymentStatus.REFUNDED },
    });

    await this.cachePayment(updatedPayment);
    return updatedPayment;
  }

  async getPaymentStatus(paymentId: string) {
    // Tenta recuperar do cache primeiro
    const cacheKey = `${this.PAYMENT_CACHE_PREFIX}${paymentId}`;
    const cachedPayment = await this.redisService.get(cacheKey);

    if (cachedPayment) {
      return JSON.parse(cachedPayment);
    }

    // Se não estiver no cache, busca do banco
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { order: true },
    });

    if (payment) {
      await this.cachePayment(payment);
      return payment;
    }

    throw new BadRequestException('Pagamento não encontrado');
  }

  private async cachePayment(payment: any) {
    const cacheKey = `${this.PAYMENT_CACHE_PREFIX}${payment.id}`;
    await this.redisService.set(
      cacheKey,
      JSON.stringify(payment),
      this.PAYMENT_CACHE_TTL,
    );
  }
}
