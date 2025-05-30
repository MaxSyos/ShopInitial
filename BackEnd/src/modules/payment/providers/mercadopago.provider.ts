import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { PaymentMethod, PaymentStatus } from '@prisma/client';
import { IPaymentProvider, CreatePaymentDTO, PaymentResponseDTO } from '../interfaces/payment-provider.interface';
import axios from 'axios';
import * as crypto from 'crypto';

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
      const posId = this.configService.get<string>('MERCADOPAGO_POS_ID');
      const sponsorId = this.configService.get<string>('MERCADOPAGO_SPONSOR_ID');
      const accessToken = this.configService.get<string>('MERCADOPAGO_ACCESS_TOKEN');

      if (!sellerId || !posId || !sponsorId || !accessToken) {
        throw new Error('Configurações do Mercado Pago incompletas');
      }

      const qrData = {
        external_reference: data.orderId,
        title: `Pedido #${data.orderId}`,
        description: data.description,
        notification_url: this.configService.get<string>('PAYMENT_WEBHOOK_URL'),
        total_amount: Number(data.amount),
        items: data.items.map(item => ({
          sku_number: item.id,
          category: "shop",
          title: item.title,
          description: item.title,
          unit_price: Number(item.unitPrice),
          quantity: item.quantity,
          unit_measure: "unit",
          total_amount: Number(item.unitPrice) * item.quantity
        })),
        sponsor: {
          id: Number(sponsorId)
        },
        cash_out: {
          amount: 0
        }
      };

      const response = await axios.post(
        `${this.baseUrl}/instore/orders/qr/seller/collectors/${sellerId}/pos/${posId}/qrs`,
        qrData,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.data.qr_data) {
        throw new Error('QR Code não gerado pelo Mercado Pago');
      }

      // Formatando a resposta conforme a interface PaymentResponseDTO
      return {
        id: response.data.in_store_order_id,
        status: PaymentStatus.WAITING_PAYMENT,
        externalReference: data.orderId,
        processorResponse: {
          pixQrCode: response.data.qr_data,
          pixCode: response.data.qr_data, // O mesmo QR code pode ser usado como código PIX
          pixExpiresAt: new Date(Date.now() + (30 * 60 * 1000)), // 30 minutos de validade
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
        return PaymentStatus.EXPIRED;
      }

      // Tratamento especial para PIX
      if (payment.payment_type_id === 'pix') {
        if (payment.status === 'pending' && payment.point_of_interaction?.transaction_data?.qr_code) {
          return PaymentStatus.WAITING_PAYMENT;
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

  private convertMPStatusToPaymentStatus(mpStatus: string): PaymentStatus {
    const statusMap: { [key: string]: PaymentStatus } = {
      approved: PaymentStatus.COMPLETED,
      pending: PaymentStatus.PENDING,
      in_process: PaymentStatus.PENDING,
      rejected: PaymentStatus.FAILED,
      cancelled: PaymentStatus.CANCELLED,
      refunded: PaymentStatus.REFUNDED,
    };

    return statusMap[mpStatus] || PaymentStatus.PENDING;
  }
}
