import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';

/**
 * Endpoint de TESTE para disparar webhook manualmente
 * APENAS para desenvolvimento/debugging
 * 
 * POST /api/payments/trigger-webhook-test
 * Body: { orderId: "...", installmentNumber: 1 }
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Apenas permitir em desenvolvimento
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Endpoint não disponível em produção' });
  }

  if (req.method !== 'POST') {
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const { orderId, installmentNumber = 1 } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: 'orderId é obrigatório' });
    }

    console.log(`[TEST WEBHOOK] Disparando webhook manual para orderId: ${orderId}, installment: ${installmentNumber}`);

    // Buscar a parcela
    const installment = await prisma.paymentInstallment.findUnique({
      where: {
        orderId_installmentNumber: {
          orderId,
          installmentNumber
        }
      },
      include: { order: true }
    });

    if (!installment) {
      return res.status(404).json({ error: 'Parcela não encontrada' });
    }

    if (!installment.order) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    // Marcar Parcela 1 como PAID
    if (installmentNumber === 1) {
      console.log(`[TEST WEBHOOK] Marcando Parcela 1 como PAID...`);

      await prisma.paymentInstallment.update({
        where: { id: installment.id },
        data: {
          status: 'PAID',
          paidAt: new Date(),
          webhookLog: {
            testTrigger: true,
            triggeredAt: new Date().toISOString(),
            reason: 'Manual trigger via /api/payments/trigger-webhook-test'
          }
        }
      });

      // Buscar Parcela 2
      const installment2 = await prisma.paymentInstallment.findUnique({
        where: {
          orderId_installmentNumber: {
            orderId,
            installmentNumber: 2
          }
        }
      });

      if (installment2) {
        console.log(`[TEST WEBHOOK] Criando Parcela 2 no Mercado Pago...`);

        const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

        if (accessToken) {
          // Criar Preference no MP para Parcela 2 (SEM expiração)
          const inst2Body = {
            items: [
              {
                title: `Pedido #${orderId.substring(0, 8)} - Parcela 2/2`,
                unit_price: installment2.amount,
                quantity: 1
              }
            ],
            external_reference: `${orderId}-INSTALLMENT-2`,
            payment_methods: {
              excluded_payment_types: [{ id: 'ticket' }],
              installments: 1
            }
            // SEM expires_in = permanente
          };

          const inst2IdempotencyKey = `order-${String(orderId)}-inst-2`;

          console.log(`[TEST WEBHOOK] Body para MP:`, JSON.stringify(inst2Body));

          const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
              'Idempotency-Key': inst2IdempotencyKey
            },
            body: JSON.stringify(inst2Body)
          });

          const mpData = await mpResponse.json();

          if (!mpResponse.ok) {
            console.error('[TEST WEBHOOK] Erro ao criar Parcela 2 no MP:', mpData);
            return res.status(502).json({
              error: 'Erro ao criar Parcela 2 no Mercado Pago',
              details: mpData
            });
          }

          console.log(`[TEST WEBHOOK] Parcela 2 criada no MP com ID: ${mpData.id}`);

          // Atualizar Parcela 2 com dados do MP
          await prisma.paymentInstallment.update({
            where: { id: installment2.id },
            data: {
              status: 'PAYMENT_CREATED',
              mpPreferenceId: mpData.id,
              mpQrCodeBase64: mpData.qr_code_base64 || undefined,
              mpQrCodeUrl: mpData.qr_code || undefined,
              webhookLog: {
                created: true,
                createdAt: new Date().toISOString(),
                mpId: mpData.id
              }
            }
          });

          console.log(`[TEST WEBHOOK] Parcela 2 atualizada com dados do MP`);
        } else {
          console.warn('[TEST WEBHOOK] Sem credenciais MP, usando mock para Parcela 2');

          const mockQr = `data:image/png;base64,MOCK_QR_INST2_${orderId}`;

          await prisma.paymentInstallment.update({
            where: { id: installment2.id },
            data: {
              status: 'PAYMENT_CREATED',
              mpPreferenceId: `mock-${orderId}-inst-2`,
              mpQrCodeBase64: mockQr,
              webhookLog: {
                mock: true,
                createdAt: new Date().toISOString()
              }
            }
          });
        }
      }

      // Retornar os dados atualizados
      const updatedOrder = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          installments: true,
          items: true
        }
      });

      return res.status(200).json({
        success: true,
        message: 'Webhook manual disparado com sucesso',
        order: updatedOrder,
        installments: updatedOrder?.installments
      });
    }

    // Marcar Parcela 2 como PAID
    if (installmentNumber === 2) {
      console.log(`[TEST WEBHOOK] Marcando Parcela 2 como PAID...`);

      await prisma.paymentInstallment.update({
        where: { id: installment.id },
        data: {
          status: 'PAID',
          paidAt: new Date(),
          webhookLog: {
            testTrigger: true,
            triggeredAt: new Date().toISOString(),
            reason: 'Manual trigger via /api/payments/trigger-webhook-test'
          }
        }
      });

      // Verificar se ambas as parcelas estão PAID
      const allInstallments = await prisma.paymentInstallment.findMany({
        where: { orderId }
      });

      const allPaid = allInstallments.every((i) => i.status === 'PAID');

      if (allPaid) {
        console.log(`[TEST WEBHOOK] Ambas parcelas pagas! Atualizando Order...`);

        await prisma.order.update({
          where: { id: orderId },
          data: {
            paymentStatus: 'PAID',
            status: 'CONFIRMED'
          }
        });
      }

      // Retornar os dados atualizados
      const updatedOrder = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          installments: true,
          items: true
        }
      });

      return res.status(200).json({
        success: true,
        message: 'Parcela 2 marcada como paga',
        order: updatedOrder,
        installments: updatedOrder?.installments,
        allPaid
      });
    }

    return res.status(400).json({ error: 'installmentNumber deve ser 1 ou 2' });
  } catch (error: any) {
    console.error('[TEST WEBHOOK] Erro:', error);
    return res.status(500).json({
      error: 'Erro ao disparar webhook',
      details: error.message
    });
  }
}
