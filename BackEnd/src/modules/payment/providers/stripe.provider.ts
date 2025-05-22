import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import {
  IPaymentProvider,
  CreatePaymentDTO,
  PaymentResponseDTO,
} from '../interfaces/payment-provider.interface';

@Injectable()
export class StripeProvider implements IPaymentProvider {
  private stripe: Stripe;

  constructor(private configService: ConfigService) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY não configurado');
    }
    this.stripe = new Stripe(secretKey, {
      apiVersion: '2025-04-30.basil',
    });
  }

  async createPayment(data: CreatePaymentDTO): Promise<PaymentResponseDTO> {
    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: data.items.map(item => ({
        price_data: {
          currency: data.currency.toLowerCase(),
          product_data: {
            name: item.title,
          },
          unit_amount: Math.round(item.unitPrice * 100), // Stripe usa centavos
        },
        quantity: item.quantity,
      })),
      customer_email: data.customer.email,
      client_reference_id: data.orderId,
      mode: 'payment',
      success_url: this.configService.get('PAYMENT_SUCCESS_URL') || '',
      cancel_url: this.configService.get('PAYMENT_FAILURE_URL') || '',
    });

    return {
      id: session.id,
      status: 'PENDING',
      externalReference: data.orderId,
      paymentUrl: session.url || undefined,
      processorResponse: session,
    };
  }

  async getPaymentStatus(paymentId: string): Promise<string> {
    const session = await this.stripe.checkout.sessions.retrieve(paymentId);
    const statusMap: Record<string, PaymentResponseDTO['status']> = {
      'open': 'PENDING',
      'complete': 'COMPLETED',
      'expired': 'EXPIRED',
    };
    return statusMap[session.status || ''] || 'PENDING';
  }

  async refundPayment(paymentId: string): Promise<boolean> {
    try {
      const session = await this.stripe.checkout.sessions.retrieve(paymentId);
      if (session.payment_intent) {
        await this.stripe.refunds.create({
          payment_intent: session.payment_intent as string,
        });
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  async validateWebhook(body: any, signature: string): Promise<boolean> {
    try {
      const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
      if (!webhookSecret) {
        throw new Error('STRIPE_WEBHOOK_SECRET não configurado');
      }

      const event = this.stripe.webhooks.constructEvent(
        body,
        signature,
        webhookSecret
      );
      return !!event;
    } catch (error) {
      return false;
    }
  }
}
