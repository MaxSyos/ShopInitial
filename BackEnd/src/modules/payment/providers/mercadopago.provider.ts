import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';
import { createHmac } from 'crypto';
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
  private readonly logger = new Logger(MercadoPagoProvider.name);

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
          transaction_amount: Number(data.amount),
          payment_method_id: "pix",
          payment_type_id: "pix",
          currency_id: data.currency,
          description: data.description,
          payer: {
            email: data.customer.email,
            first_name: data.customer.firstName,
            last_name: data.customer.lastName,
            identification: {
              type: "CPF",
              number: data.customer.document || '00000000000'
            }
          },
          external_reference: data.orderId,
          notification_url: this.configService.get('PAYMENT_WEBHOOK_URL'),
          date_of_expiration: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 horas
        }
      };

      const result = await this.payment.create(paymentData);
      this.logger.debug(`Pagamento PIX criado: ID=${result.id}, Status=${result.status}`);

      // Validar campos obrigatórios
      if (!result.id || !result.status) {
        throw new Error('Resposta inválida do Mercado Pago: ID ou status ausente');
      }

      if (!result.point_of_interaction?.transaction_data?.qr_code) {
        throw new Error('QR Code PIX não gerado pelo Mercado Pago');
      }

      // Validar e converter datas
      let expirationDate: Date;
      try {
        expirationDate = result.date_of_expiration 
          ? new Date(result.date_of_expiration)
          : new Date(Date.now() + 24 * 60 * 60 * 1000);

        if (isNaN(expirationDate.getTime())) {
          throw new Error('Data de expiração inválida');
        }
      } catch (error) {
        this.logger.error(`Erro ao processar data de expiração: ${error.message}`);
        expirationDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      }

      // Construir resposta com validações
      return {
        id: result.id.toString(),
        status: this.convertMPStatusToPaymentStatus(result.status),
        externalReference: data.orderId,
        processorResponse: {
          pixQrCode: result.point_of_interaction.transaction_data.qr_code_base64,
          pixCode: result.point_of_interaction.transaction_data.qr_code,
          ticket_url: result.point_of_interaction.transaction_data.ticket_url,
          pixExpiresAt: expirationDate,
          createdAt: result.date_created ? new Date(result.date_created) : new Date(),
          lastUpdatedAt: result.date_last_updated ? new Date(result.date_last_updated) : new Date(),
          transactionAmount: Number(result.transaction_amount),
          paymentMethodId: result.payment_method_id,
          paymentTypeId: result.payment_type_id,
          raw: result // Armazenar resposta completa para auditoria
        }
      };
    } catch (error) {
      this.logger.error(`Erro ao criar pagamento PIX: ${error.message}`, {
        error,
        paymentData: data
      });
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
            excluded_payment_methods: []
          },
          notification_url: this.configService.get('PAYMENT_WEBHOOK_URL'),
          back_urls: {
            success: this.configService.get('PAYMENT_SUCCESS_URL'),
            failure: this.configService.get('PAYMENT_FAILURE_URL'),
            pending: this.configService.get('PAYMENT_PENDING_URL')
          },
          auto_return: 'approved'
        }
      };

      const result = await this.preference.create(preferenceData);

      return {
        id: result.id || '',
        status: 'PENDING',
        externalReference: data.orderId,
        paymentUrl: result.init_point,
        processorResponse: result
      };
    } catch (error) {
      this.logger.error(`Erro ao criar preferência de pagamento: ${error.message}`);
      throw new Error(`Erro ao criar preferência de pagamento: ${error.message}`);
    }
  }

  async getPaymentStatus(paymentId: string): Promise<string> {
    try {
      // Em ambiente de teste, simular status COMPLETED
      const isTestEnvironment = this.configService.get('NODE_ENV') !== 'production';
      if (isTestEnvironment) {
        this.logger.debug(`Ambiente de teste: Simulando status COMPLETED para pagamento ${paymentId}`);
        return 'COMPLETED';
      }

      const payment = await this.payment.get({ id: paymentId });
      
      this.logger.debug(`Status do pagamento ${paymentId}: ${payment.status}`);
      
      // Verifica se o pagamento expirou
      if (payment.date_of_expiration && new Date(payment.date_of_expiration) < new Date()) {
        return 'EXPIRED';
      }

      // Tratamento especial para PIX
      if (payment.payment_method_id === 'pix') {
        if (payment.status === 'pending' && payment.point_of_interaction?.transaction_data?.qr_code) {
          return 'WAITING_PAYMENT';
        }
      }

      return this.convertMPStatusToPaymentStatus(payment.status || 'pending');
    } catch (error) {
      this.logger.error(`Erro ao obter status do pagamento: ${error.message}`);
      throw new Error(`Erro ao obter status do pagamento: ${error.message}`);
    }
  }

  async refundPayment(paymentId: string): Promise<boolean> {
    try {
      const payment = await this.payment.get({ id: paymentId });
      if (payment.status === 'approved') {
        const refundResponse = await this.payment.cancel({ id: paymentId });
        return refundResponse.status === 'cancelled';
      }
      return false;
    } catch (error) {
      this.logger.error(`Erro ao processar estorno: ${error.message}`);
      return false;
    }
  }

  async validateWebhook(payload: Buffer, signature?: string): Promise<boolean> {
    try {
      // Em ambiente de teste, aceitar todas as requisições
      const isTestEnvironment = this.configService.get('NODE_ENV') !== 'production';
      if (isTestEnvironment) {
        this.logger.warn('Ambiente de teste: Ignorando validação de assinatura do webhook');
        return true;
      }

      if (!signature) {
        this.logger.warn('Assinatura do webhook ausente');
        return false;
      }

      const webhookSecret = this.configService.get<string>('MERCADOPAGO_WEBHOOK_SECRET');
      if (!webhookSecret) {
        this.logger.error('MERCADOPAGO_WEBHOOK_SECRET não configurado');
        return false;
      }

      // Validar assinatura usando HMAC SHA256
      const hmac = createHmac('sha256', webhookSecret);
      hmac.update(payload);
      const calculatedSignature = hmac.digest('hex');

      const isValid = signature === calculatedSignature;
      if (!isValid) {
        this.logger.warn('Assinatura do webhook inválida', {
          receivedSignature: signature,
          calculatedSignature,
          payload: payload.toString()
        });
      }

      return isValid;
    } catch (error) {
      this.logger.error(`Erro na validação do webhook: ${error.message}`, {
        error,
        payload: payload.toString()
      });
      return false;
    }
  }

  private convertMPStatusToPaymentStatus(mpStatus: string): PaymentResponseDTO['status'] {
    const statusMap: Record<string, PaymentResponseDTO['status']> = {
      'pending': 'WAITING_PAYMENT',
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

    const status = statusMap[mpStatus];
    if (!status) {
      this.logger.warn(`Status desconhecido do Mercado Pago: ${mpStatus}`);
      return 'PENDING';
    }

    this.logger.debug(`Status convertido: ${mpStatus} -> ${status}`);
    return status;
  }
}
