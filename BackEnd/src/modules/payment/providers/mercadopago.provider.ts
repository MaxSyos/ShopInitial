import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { PaymentMethod } from '@prisma/client';
import { IPaymentProvider, CreatePaymentDTO, PaymentResponseDTO } from '../interfaces/payment-provider.interface';
import axios from 'axios';
import * as crypto from 'crypto';

type ValidPaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'WAITING_PAYMENT' | 'EXPIRED';

@Injectable()
export class MercadoPagoProvider implements IPaymentProvider {
  private readonly logger = new Logger(MercadoPagoProvider.name);
  private readonly baseUrl = 'https://api.mercadopago.com';
  private readonly client: Payment;

  constructor(
    private readonly configService: ConfigService,
  ) {
    const accessToken = this.configService.get<string>('MERCADOPAGO_ACCESS_TOKEN');
    if (!accessToken) {
      throw new Error('MERCADOPAGO_ACCESS_TOKEN não configurado');
    }
    const client = new MercadoPagoConfig({ accessToken });
    this.client = new Payment(client);
  }

  private convertMPStatusToPaymentStatus(mpStatus: string): ValidPaymentStatus {
    const statusMap: { [key: string]: ValidPaymentStatus } = {
      'pending': 'PENDING',
      'approved': 'COMPLETED',
      'authorized': 'PENDING',
      'in_process': 'PENDING',
      'in_mediation': 'PENDING',
      'rejected': 'FAILED',
      'cancelled': 'CANCELLED',
      'refunded': 'COMPLETED', // Mapeando refunded para COMPLETED
      'charged_back': 'FAILED'  // Mapeando charged_back para FAILED
    };
    return statusMap[mpStatus] || 'PENDING';
  }

  async createPayment(data: CreatePaymentDTO): Promise<PaymentResponseDTO> {
    try {
      if (data.paymentMethod === PaymentMethod.PIX) {
        return await this.createPixPayment(data);
      }
      // Implementar outros métodos de pagamento aqui se necessário
      throw new Error('Método de pagamento não suportado');
    } catch (error) {
      this.logger.error('Erro ao criar pagamento:', error);
      throw error;
    }
  }

  private async createPixPayment(data: CreatePaymentDTO): Promise<PaymentResponseDTO> {
    try {
      const sellerId = this.configService.get<string>('MERCADOPAGO_SELLER_ID');
      const accessToken = this.configService.get<string>('MERCADOPAGO_ACCESS_TOKEN');
      
      if (!sellerId || !accessToken) {
        throw new Error('Configurações essenciais do Mercado Pago ausentes');
      }

      const webhookUrl = this.configService.get<string>('PAYMENT_WEBHOOK_URL') || '';
      if (!webhookUrl || !webhookUrl.startsWith('https://')) {
        throw new Error('Webhook URL deve usar HTTPS para o Mercado Pago');
      }

      const pixPaymentData = {
        transaction_amount: data.amount,
        description: data.description,
        payment_method_id: 'pix',
        payer: {
          email: data.customer.email,
          first_name: data.customer.firstName,
          last_name: data.customer.lastName,
        },
        external_reference: data.orderId,
        notification_url: webhookUrl,
        metadata: {
          order_id: data.orderId,
          customer_id: data.customerId,
          payment_type: 'pix'
        },
        date_of_expiration: new Date(Date.now() + (30 * 60 * 1000)).toISOString(), // 30 minutos
        capture: true,
        binary_mode: true
      };

      const response = await axios.post(
        `${this.baseUrl}/v1/payments`,
        pixPaymentData,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Idempotency-Key': `pix_${data.orderId}_${Date.now()}`
          }
        }
      );

      this.logger.debug('Resposta do Mercado Pago PIX:', response.data);

      const status = this.convertMPStatusToPaymentStatus(response.data.status);

      return {
        id: response.data.id,
        status,
        externalReference: data.orderId,
        paymentUrl: response.data.point_of_interaction?.transaction_data?.ticket_url || null,
        processorResponse: {
          pixQrCode: response.data.point_of_interaction?.transaction_data?.qr_code,
          pixCode: response.data.point_of_interaction?.transaction_data?.qr_code_base64,
          pixExpiresAt: new Date(response.data.date_of_expiration),
          createdAt: new Date(response.data.date_created),
          lastUpdatedAt: new Date(response.data.date_last_updated),
          transactionAmount: response.data.transaction_amount,
          paymentMethodId: response.data.payment_method_id,
          paymentTypeId: response.data.payment_type_id,
          raw: response.data
        }
      };
    } catch (error) {
      this.logger.error('Erro ao criar pagamento PIX:', error.response?.data || error.message);
      throw new Error(`Erro ao criar pagamento PIX: ${error.response?.data?.message || error.message}`);
    }
  }

  async getPaymentStatus(paymentId: string): Promise<string> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/v1/payments/${paymentId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.configService.get('MERCADOPAGO_ACCESS_TOKEN')}`,
          }
        }
      );

      const payment = response.data;
      
      // Verifica se o pagamento expirou
      if (payment.date_of_expiration && new Date(payment.date_of_expiration) < new Date()) {
        return 'EXPIRED';
      }

      // Tratamento especial para PIX
      if (payment.payment_type_id === 'pix') {
        if (payment.status === 'pending' && payment.point_of_interaction?.transaction_data?.qr_code) {
          return 'WAITING_PAYMENT';
        }
      }

      return this.convertMPStatusToPaymentStatus(payment.status);
    } catch (error) {
      this.logger.error(`Erro ao obter status do pagamento: ${error.message}`, error);
      throw error;
    }
  }

  async refundPayment(paymentId: string): Promise<boolean> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/v1/payments/${paymentId}/refunds`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${this.configService.get('MERCADOPAGO_ACCESS_TOKEN')}`,
          }
        }
      );

      return response.data.status === 'approved';
    } catch (error) {
      this.logger.error(`Erro ao reembolsar pagamento: ${error.message}`, error);
      return false;
    }
  }

  async validateWebhook(signature: string, payload: Buffer): Promise<boolean> {
    try {
      const webhookSecret = this.configService.get<string>('MERCADOPAGO_WEBHOOK_SECRET');
      if (!webhookSecret) {
        throw new Error('MERCADOPAGO_WEBHOOK_SECRET não configurado');
      }

      const computedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(payload)
        .digest('hex');

      return signature === computedSignature;
    } catch (error) {
      this.logger.error(`Erro ao validar webhook: ${error.message}`, error);
      return false;
    }
  }

  async processWebhook(payload: any): Promise<{ received: boolean; message?: string }> {
    try {
      if (!payload.type || !payload.data) {
        return { received: false, message: 'Payload inválido' };
      }

      if (payload.type === 'payment') {
        const paymentId = payload.data.id;
        const status = await this.getPaymentStatus(paymentId);
        return {
          received: true,
          message: `Status do pagamento atualizado: ${status}`
        };
      }

      return { received: true };
    } catch (error) {
      this.logger.error(`Erro ao processar webhook: ${error.message}`, error);
      return {
        received: false,
        message: error.message
      };
    }
  }

  async getPaymentDetails(paymentId: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/v1/payments/${paymentId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.configService.get('MERCADOPAGO_ACCESS_TOKEN')}`,
          }
        }
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Erro ao obter detalhes do pagamento: ${error.message}`, error);
      return null;
    }
  }
}
