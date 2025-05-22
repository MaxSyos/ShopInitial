import { PaymentMethod } from '@prisma/client';

export interface PaymentMethodDTO {
  id: string;
  type: string;
  name: string;
  expirationMonth?: string;
  expirationYear?: string;
  lastFourDigits?: string;
}

export interface CreatePaymentDTO {
  amount: number;
  currency: string;
  description: string;
  orderId: string;
  customerId: string;
  paymentMethod: PaymentMethod;
  installments?: number;
  items: Array<{
    id: string;
    title: string;
    quantity: number;
    unitPrice: number;
  }>;
  customer: {
    email: string;
    firstName: string;
    lastName: string;
    document?: string;
  };
  billingAddress?: {
    street: string;
    number?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

export interface PaymentResponseDTO {
  id: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'WAITING_PAYMENT' | 'EXPIRED';
  externalReference: string;
  paymentUrl?: string;
  processorResponse?: {
    pixQrCode?: string;
    pixCode?: string;
    pixExpiresAt?: Date;
    [key: string]: any;
  };
}

export interface IPaymentProvider {
  createPayment(data: CreatePaymentDTO): Promise<PaymentResponseDTO>;
  getPaymentStatus(paymentId: string): Promise<string>;
  refundPayment(paymentId: string): Promise<boolean>;
  validateWebhook(body: any, signature: string): Promise<boolean>;
}
