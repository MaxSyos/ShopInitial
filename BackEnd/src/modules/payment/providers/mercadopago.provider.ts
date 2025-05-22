import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';
import {
  IPaymentProvider,
  CreatePaymentDTO,
  PaymentResponseDTO,
} from '../interfaces/payment-provider.interface';

@Injectable()
export class MercadoPagoProvider implements IPaymentProvider {
  private readonly client: MercadoPagoConfig;
  private readonly payment: Payment;
  private readonly preference: Preference;

  constructor(private configService: ConfigService) {
    const accessToken = this.configService.get<string>('MERCADOPAGO_ACCESS_TOKEN');
    if (!accessToken) {
      throw new Error('MERCADOPAGO_ACCESS_TOKEN não configurado');
    }
    this.client = new MercadoPagoConfig({ accessToken });
    this.payment = new Payment(this.client);
    this.preference = new Preference(this.client);
  }

  async createPayment(data: CreatePaymentDTO): Promise<PaymentResponseDTO> {
    if (data.paymentMethod === 'PIX') {
      return this.createPixPayment(data);
    }
    return this.createRegularPayment(data);
  }

  private async createPixPayment(data: CreatePaymentDTO): Promise<PaymentResponseDTO> {
    try {
      const paymentData = {
        body: {
          items: [{
            id: data.orderId,
            title: data.description,
            quantity: 1,
            unit_price: Number(data.amount)
          }],
          description: data.description,
          external_reference: data.orderId,
          payment_method_id: 'pix',
          transaction_amount: Number(data.amount),
          notification_url: this.configService.get('PAYMENT_WEBHOOK_URL'),
          payer: {
            email: data.customer.email,
            first_name: data.customer.firstName,
            last_name: data.customer.lastName
          }
        }
      };

      const result = await this.payment.create(paymentData);

      return {
        id: result.id?.toString() || '',
        status: this.convertMPStatusToPaymentStatus(result.status || 'pending'),
        externalReference: data.orderId,
        paymentUrl: undefined,
        processorResponse: {
          pixQrCode: result.point_of_interaction?.transaction_data?.qr_code_base64,
          pixCode: result.point_of_interaction?.transaction_data?.qr_code,
          pixExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 horas
        },
      };
    } catch (error) {
      throw new Error(`Erro ao criar pagamento PIX: ${error.message}`);
    }
  }

  private async createRegularPayment(data: CreatePaymentDTO): Promise<PaymentResponseDTO> {
    try {
      const preferenceData = {
        body: {
          items: data.items.map(item => ({
            id: item.id,
            title: item.title,
            quantity: item.quantity,
            unit_price: Number(item.unitPrice),
            currency_id: data.currency
          })),
          external_reference: data.orderId,
          payer: {
            email: data.customer.email,
            name: data.customer.firstName,
            surname: data.customer.lastName
          },
          payment_methods: {
            installments: data.installments || 1,
            excluded_payment_methods: data.paymentMethod === 'CREDIT_CARD' ? [{ id: 'pix' }] : []
          },
          back_urls: {
            success: this.configService.get('PAYMENT_SUCCESS_URL') || '',
            failure: this.configService.get('PAYMENT_FAILURE_URL') || '',
            pending: this.configService.get('PAYMENT_PENDING_URL') || ''
          },
          auto_return: 'approved'
        }
      };

      const result = await this.preference.create(preferenceData);

      return {
        id: result.id || '',
        status: 'PENDING',
        externalReference: data.orderId,
        paymentUrl: result.init_point || undefined,
        processorResponse: result
      };
    } catch (error) {
      throw new Error(`Erro ao criar preferência de pagamento: ${error.message}`);
    }
  }

  async getPaymentStatus(paymentId: string): Promise<string> {
    try {
      const payment = await this.payment.get({
        id: paymentId
      });
      return this.convertMPStatusToPaymentStatus(payment.status || 'pending');
    } catch (error) {
      throw new Error(`Erro ao obter status do pagamento: ${error.message}`);
    }
  }

  async refundPayment(paymentId: string): Promise<boolean> {
    try {
      const payment = await this.payment.get({ id: paymentId });
      if (payment.status === 'approved') {
        await this.payment.cancel({ id: paymentId });
      }
      return true;
    } catch (error) {
      return false;
    }
  }

  async validateWebhook(body: any, signature: string): Promise<boolean> {
    // O Mercado Pago recomenda validar o IP de origem e o token
    // https://www.mercadopago.com.br/developers/pt/guides/notifications/webhooks
    const webhookSecret = this.configService.get<string>('MERCADOPAGO_WEBHOOK_SECRET');
    if (!webhookSecret) {
      throw new Error('MERCADOPAGO_WEBHOOK_SECRET não configurado');
    }
    
    // Na prática, você deve implementar a validação do IP e do token
    return true;
  }

  private convertMPStatusToPaymentStatus(mpStatus: string): PaymentResponseDTO['status'] {
    const statusMap: Record<string, PaymentResponseDTO['status']> = {
      'pending': 'PENDING',
      'approved': 'COMPLETED',
      'authorized': 'PENDING',
      'in_process': 'PENDING',
      'in_mediation': 'PENDING',
      'rejected': 'FAILED',
      'cancelled': 'CANCELLED',
      'refunded': 'CANCELLED',
      'charged_back': 'CANCELLED',
      'expired': 'EXPIRED'
    };

    return statusMap[mpStatus] || 'PENDING';
  }
}
