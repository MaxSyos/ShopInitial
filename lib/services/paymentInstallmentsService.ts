// ============================================================================
// IMPLEMENTAÇÃO PRÁTICA: Sistema de Pagamento em 2 Parcelas PIX
// ============================================================================

import { Prisma, PaymentStatus, InstallmentStatus } from "@prisma/client";
import prisma from "../prisma";

// ============================================================================
// 1. TIPOS E INTERFACES
// ============================================================================

interface CreateOrderPayload {
  userId: string;
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
  }>;
  shippingAddress: {
    street: string;
    number: string;
    complement?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
}

interface InstallmentConfig {
  installmentNumber: 1 | 2;
  amount: number;
  expiresIn?: number; // segundos (apenas para Inst1)
}

interface MercadoPagoPreferencePayload {
  items: Array<{
    title: string;
    unit_price: number;
    quantity: number;
  }>;
  external_reference: string;
  notification_url: string;
  payment_methods?: {
    excluded_payment_types?: Array<{ id: string }>;
    installments?: number;
    default_payment_method_id?: string;
  };
  expires_in?: number; // Para Inst1 apenas
}

// ============================================================================
// 2. SERVIÇO DE CRIAÇÃO DE PEDIDOS
// ============================================================================

export class OrderCreationService {
  /**
   * Cria um pedido completo com 2 parcelas PIX
   * Garante atomicidade: tudo ou nada
   */
  async createOrderWithInstallments(payload: CreateOrderPayload) {
    try {
      return await prisma.$transaction(async (tx) => {
        // ETAPA 1: Validar dados
        this.validateOrderPayload(payload);

        // ETAPA 2: Criar Order
        const order = await tx.order.create({
          data: {
            userId: payload.userId,
            shippingAddress: payload.shippingAddress,
            billingAddress: payload.shippingAddress, // pode ser diferente
            paymentMethod: "PIX",
            paymentStatus: PaymentStatus.PENDING,
            paymentInstallments: 2,
            subtotal: payload.subtotal,
            shippingCost: payload.shippingCost,
            tax: payload.tax,
            total: payload.total,
            status: "PENDING",
            items: {
              create: payload.items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                total: item.quantity * item.unitPrice,
              })),
            },
          },
          include: { items: true },
        });

        // ETAPA 3: Calcular parcelas
        const installmentConfig = this.calculateInstallments(payload.total);

        // ETAPA 4: Criar 2 registros PaymentInstallment
        const installments = await tx.paymentInstallment.createMany({
          data: [
            {
              orderId: order.id,
              installmentNumber: 1,
              amount: installmentConfig.inst1.amount,
              status: InstallmentStatus.PENDING,
              expiresAt: installmentConfig.inst1.expiresAt,
            },
            {
              orderId: order.id,
              installmentNumber: 2,
              amount: installmentConfig.inst2.amount,
              status: InstallmentStatus.PENDING,
              expiresAt: null, // SEM EXPIRAÇÃO
            },
          ],
        });

        return { order, installments };
      });
    } catch (error) {
      console.error("Erro ao criar pedido com parcelas:", error);
      throw error;
    }
  }

  /**
   * Valida dados do pedido
   */
  private validateOrderPayload(payload: CreateOrderPayload) {
    if (!payload.userId) throw new Error("userId é obrigatório");
    if (!Array.isArray(payload.items) || payload.items.length === 0) {
      throw new Error("Pedido deve ter pelo menos 1 item");
    }
    if (payload.total <= 0) throw new Error("Total deve ser maior que zero");
    if (payload.total < 5) {
      throw new Error("Valor mínimo para parcelamento é R$ 5,00");
    }
  }

  /**
   * Calcula divisão das parcelas
   * Por padrão: 50% cada
   */
  private calculateInstallments(total: number) {
    const inst1Amount = Math.round((total / 2) * 100) / 100;
    const inst2Amount = Math.round((total - inst1Amount) * 100) / 100;

    return {
      inst1: {
        amount: inst1Amount,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutos
      },
      inst2: {
        amount: inst2Amount,
        expiresAt: null,
      },
    };
  }
}

// ============================================================================
// 3. SERVIÇO DE INTEGRAÇÃO COM MERCADO PAGO
// ============================================================================

export class MercadoPagoService {
  private apiUrl = "https://api.mercadopago.com";
  private accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  private publicKey = process.env.MERCADO_PAGO_PUBLIC_KEY;

  /**
   * Cria uma Preference (QR Code PIX) no Mercado Pago
   */
  async createPixPreference(
    orderId: string,
    installmentNumber: 1 | 2,
    amount: number,
    expiresIn?: number // segundos
  ) {
    const idempotencyKey = this.generateIdempotencyKey(
      orderId,
      installmentNumber
    );
    const externalReference = `${orderId}-INSTALLMENT-${installmentNumber}`;

    const payload: MercadoPagoPreferencePayload = {
      items: [
        {
          title: `Pedido #${orderId.substring(0, 8)} - Parcela ${installmentNumber}/2`,
          unit_price: amount,
          quantity: 1,
        },
      ],
      external_reference: externalReference,
      notification_url: `${process.env.APP_URL}/api/webhooks/mercadopago`,
      payment_methods: {
        excluded_payment_types: [{ id: "ticket" }],
        installments: 1, // NÃO permitir sub-parcelamento
        default_payment_method_id: "account_money",
      },
    };

    // Apenas Parcela 1 tem expiração
    if (installmentNumber === 1 && expiresIn) {
      payload.expires_in = expiresIn;
    }

    try {
      const response = await fetch(
        `${this.apiUrl}/checkout/preferences`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
            "Idempotency-Key": idempotencyKey,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Mercado Pago API error: ${response.status} - ${await response.text()}`
        );
      }

      const data = await response.json();

      return {
        mpPreferenceId: data.id,
        mpQrCodeBase64: data.qr_code, // Já vem em base64
        mpQrCodeUrl: data.qr_code_url,
        idempotencyKey,
      };
    } catch (error) {
      console.error(
        `Erro ao criar preference no MP para pedido ${orderId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Gera chave de idempotência única
   */
  private generateIdempotencyKey(
    orderId: string,
    installmentNumber: number
  ): string {
    return `${orderId}-INST-${installmentNumber}-${Date.now()}`;
  }

  /**
   * Consulta status de um pagamento no Mercado Pago
   */
  async getPaymentStatus(mpPreferenceId: string) {
    try {
      const response = await fetch(
        `${this.apiUrl}/v1/payments/search?external_reference=${mpPreferenceId}`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`MP API error: ${response.status}`);
      }

      const data = await response.json();
      return data.results?.[0];
    } catch (error) {
      console.error("Erro ao consultar pagamento no MP:", error);
      throw error;
    }
  }
}

// ============================================================================
// 4. SERVIÇO DE PROCESSAMENTO DE WEBHOOKS
// ============================================================================

export class WebhookProcessorService {
  /**
   * Processa webhook do Mercado Pago
   * Atualiza status de parcelas e cria Parcela 2 se necessário
   */
  async processMercadoPagoWebhook(payload: any) {
    const { data, action } = payload;

    try {
      // VALIDAÇÃO 1: Verificar external_reference
      if (!data?.external_reference) {
        console.warn("Webhook sem external_reference");
        return { processed: false };
      }

      const { orderId, installmentNumber } = this.parseExternalReference(
        data.external_reference
      );

      // VALIDAÇÃO 2: Encontrar installment
      const installment = await prisma.paymentInstallment.findUnique({
        where: {
          orderId_installmentNumber: {
            orderId,
            installmentNumber,
          },
        },
        include: { order: true },
      });

      if (!installment) {
        console.warn(`Installment não encontrada: ${orderId}-${installmentNumber}`);
        return { processed: false };
      }

      // VALIDAÇÃO 3: Verificar valor
      if (Math.abs(data.transaction_amount - installment.amount) > 0.01) {
        throw new Error(
          `Valor divergente: MP=${data.transaction_amount}, Sistema=${installment.amount}`
        );
      }

      // ATUALIZAÇÃO: Processar em transação
      await prisma.$transaction(async (tx) => {
        // Atualizar parcela
        if (data.status === "approved") {
          await tx.paymentInstallment.update({
            where: { id: installment.id },
            data: {
              status: InstallmentStatus.PAID,
              paidAt: new Date(),
            },
          });

          // Se Parcela 1 foi paga, criar Parcela 2
          if (installmentNumber === 1) {
            await this.createInstallment2(tx, orderId);
          }

          // Se Parcela 2 foi paga, validar pedido completo
          if (installmentNumber === 2) {
            await this.validateAndCompleteOrder(tx, orderId);
          }
        } else if (data.status === "rejected") {
          await tx.paymentInstallment.update({
            where: { id: installment.id },
            data: {
              status: InstallmentStatus.FAILED,
            },
          });
        }

        // Log do webhook
        await tx.paymentInstallment.update({
          where: { id: installment.id },
          data: {
            webhookLog: {
              ...((installment.webhookLog as object) || {}),
              [new Date().toISOString()]: {
                action,
                mpStatus: data.status,
                mpPaymentId: data.id,
              },
            },
          },
        });
      });

      return { processed: true, orderId, installmentNumber };
    } catch (error) {
      console.error("Erro ao processar webhook:", error);
      throw error;
    }
  }

  /**
   * Parse da external_reference
   * Formato: ORDER_ID-INSTALLMENT-1 ou ORDER_ID-INSTALLMENT-2
   */
  private parseExternalReference(reference: string) {
    const regex = /^([0-9a-f]{24})-INSTALLMENT-([12])$/;
    const match = reference.match(regex);

    if (!match) {
      throw new Error(`external_reference inválido: ${reference}`);
    }

    return {
      orderId: match[1],
      installmentNumber: parseInt(match[2]) as 1 | 2,
    };
  }

  /**
   * Cria Parcela 2 após confirmação de Parcela 1
   */
  private async createInstallment2(tx: any, orderId: string) {
    const mpService = new MercadoPagoService();
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: {
        installments: {
          where: { installmentNumber: 2 },
        },
      },
    });

    if (!order) throw new Error(`Order não encontrada: ${orderId}`);

    const inst2 = order.installments[0];
    if (!inst2) throw new Error(`Parcela 2 não encontrada para: ${orderId}`);

    // Criar preference no MP
    const mpData = await mpService.createPixPreference(
      orderId,
      2,
      inst2.amount
      // SEM expiresIn para Parcela 2
    );

    // Atualizar Parcela 2
    await tx.paymentInstallment.update({
      where: { id: inst2.id },
      data: {
        status: InstallmentStatus.PAYMENT_CREATED,
        mpPreferenceId: mpData.mpPreferenceId,
        mpQrCodeBase64: mpData.mpQrCodeBase64,
        mpQrCodeUrl: mpData.mpQrCodeUrl,
        mpIdempotencyKey: mpData.idempotencyKey,
      },
    });
  }

  /**
   * Valida e marca pedido como completo se ambas as parcelas foram pagas
   */
  private async validateAndCompleteOrder(tx: any, orderId: string) {
    const installments = await tx.paymentInstallment.findMany({
      where: { orderId },
      orderBy: { installmentNumber: "asc" },
    });

    // Verificar se ambas estão PAID
    const allPaid = installments.every(
      (inst) => inst.status === InstallmentStatus.PAID
    );

    if (allPaid) {
      await tx.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: PaymentStatus.PAID,
          status: "CONFIRMED", // Agora pode ser processado
        },
      });
    }
  }
}

// ============================================================================
// 5. SERVIÇO DE RECONCILIAÇÃO (Job Periódico)
// ============================================================================

export class ReconciliationService {
  /**
   * Verifica inconsistências entre sistema e Mercado Pago
   * Deve ser executado a cada 1 hora
   */
  async reconcilePayments() {
    console.log("🔄 Iniciando reconciliação de pagamentos...");

    // Buscar installments em status duvidoso (PAYMENT_CREATED > 1h)
    const stuckInstallments = await prisma.paymentInstallment.findMany({
      where: {
        status: InstallmentStatus.PAYMENT_CREATED,
        createdAt: {
          lt: new Date(Date.now() - 60 * 60 * 1000), // Mais de 1 hora
        },
      },
      include: { order: true },
    });

    console.log(`📊 Encontradas ${stuckInstallments.length} parcelas presas`);

    for (const installment of stuckInstallments) {
      try {
        // Consultar status real no MP
        const mpService = new MercadoPagoService();
        const mpPayment = await mpService.getPaymentStatus(
          installment.mpPreferenceId!
        );

        if (!mpPayment) {
          console.warn(
            `⚠️ Pagamento não encontrado no MP: ${installment.mpPreferenceId}`
          );
          continue;
        }

        // Se divergir, corrigir
        if (
          mpPayment.status === "approved" &&
          installment.status !== InstallmentStatus.PAID
        ) {
          console.warn(
            `🚨 INCONSISTÊNCIA: Parcela ${installment.id} não foi marcada como paga`
          );

          // Reprocessar via webhook
          const webhookProcessor = new WebhookProcessorService();
          await webhookProcessor.processMercadoPagoWebhook({
            action: "payment.updated",
            data: {
              id: mpPayment.id,
              status: "approved",
              transaction_amount: installment.amount,
              external_reference: `${installment.orderId}-INSTALLMENT-${installment.installmentNumber}`,
            },
          });

          console.log(`✅ Parcela ${installment.id} corrigida`);
        }
      } catch (error) {
        console.error(
          `❌ Erro ao reconciliar parcela ${installment.id}:`,
          error
        );
      }
    }

    console.log("✅ Reconciliação concluída");
  }

  /**
   * Expira QR codes que venceram
   */
  async expireQrCodes() {
    const now = new Date();

    const expired = await prisma.paymentInstallment.updateMany({
      where: {
        status: InstallmentStatus.PENDING,
        expiresAt: {
          lt: now,
        },
      },
      data: {
        status: InstallmentStatus.EXPIRED,
      },
    });

    if (expired.count > 0) {
      console.log(`⏰ ${expired.count} QR codes expiraram`);
    }
  }
}

// ============================================================================
// 6. VALIDAÇÕES DE INTEGRIDADE
// ============================================================================

export class IntegrityValidator {
  /**
   * Valida integridade completa de um pedido
   */
  async validateOrder(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { installments: true },
    });

    if (!order) throw new Error(`Order não encontrada: ${orderId}`);

    // Verificação 1: Deve ter exatamente 2 parcelas
    if (order.installments.length !== 2) {
      throw new Error(
        `❌ Pedido ${orderId} tem ${order.installments.length} parcelas. Esperado: 2`
      );
    }

    // Verificação 2: Soma das parcelas deve bater
    const total = order.installments.reduce(
      (sum, inst) => sum + inst.amount,
      0
    );
    if (Math.abs(total - order.total) > 0.01) {
      throw new Error(
        `❌ Soma de parcelas (R$ ${total.toFixed(2)}) diferente do total (R$ ${order.total.toFixed(2)})`
      );
    }

    // Verificação 3: Números devem ser 1 e 2
    const numbers = new Set(
      order.installments.map((inst) => inst.installmentNumber)
    );
    if (!numbers.has(1) || !numbers.has(2)) {
      throw new Error(
        `❌ Parcelas devem ter installmentNumber 1 e 2 no pedido ${orderId}`
      );
    }

    // Verificação 4: Parcela 2 nunca deve ter expiração
    const inst2 = order.installments.find(
      (inst) => inst.installmentNumber === 2
    );
    if (inst2?.expiresAt !== null) {
      throw new Error(
        `❌ Parcela 2 do pedido ${orderId} não deve ter expiração`
      );
    }

    // Verificação 5: Status deve ser coerente
    if (
      order.installments.every((inst) => inst.status === InstallmentStatus.PAID)
    ) {
      if (order.paymentStatus !== PaymentStatus.PAID) {
        throw new Error(
          `❌ Pedido ${orderId}: todas as parcelas pagas mas paymentStatus não é PAID`
        );
      }
    }

    console.log(`✅ Pedido ${orderId} passou em todas as validações`);
    return true;
  }
}

// ============================================================================
// 7. USO DOS SERVIÇOS
// ============================================================================

/*
// Exemplo de uso:

// 1. Criar pedido com parcelas
const orderService = new OrderCreationService();
const { order, installments } = await orderService.createOrderWithInstallments({
  userId: "user123",
  items: [...],
  shippingAddress: {...},
  subtotal: 100,
  shippingCost: 10,
  tax: 5,
  total: 115,
});

// 2. Criar QR Code para Parcela 1 imediatamente
const mpService = new MercadoPagoService();
const mpData = await mpService.createPixPreference(
  order.id,
  1,
  installments[0].amount,
  1800 // 30 minutos
);

// 3. Retornar ao cliente
return {
  orderId: order.id,
  qrCode: mpData.mpQrCodeBase64,
  message: "Escaneie para pagar a primeira parcela",
};

// 4. Webhook chega e processa
const webhookService = new WebhookProcessorService();
await webhookService.processMercadoPagoWebhook(webhookPayload);

// 5. Job de reconciliação a cada hora
const reconciliationService = new ReconciliationService();
setInterval(() => {
  reconciliationService.reconcilePayments();
  reconciliationService.expireQrCodes();
}, 60 * 60 * 1000);
*/
