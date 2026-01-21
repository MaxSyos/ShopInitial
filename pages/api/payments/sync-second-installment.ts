import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';
import { InstallmentStatus } from '@prisma/client';

/**
 * Endpoint para sincronizar status da Parcela 2 com Mercado Pago
 * POST /api/payments/sync-second-installment
 * Body: { orderId: "..." }
 * 
 * Função: Sem necessidade de webhook, este endpoint:
 * 1. Busca a Parcela 2 da Order
 * 2. Consulta o status no Mercado Pago
 * 3. Atualiza o banco de dados se necessário
 * 4. Retorna o status atual
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { orderId } = req.body;

    if (!orderId || typeof orderId !== 'string') {
      return res.status(400).json({ error: 'orderId é obrigatório' });
    }

    console.log(`[Sync Inst2] Sincronizando Parcela 2 para Order: ${orderId}`);

    // 1. Buscar a Parcela 2
    const installment2 = await prisma.paymentInstallment.findFirst({
      where: { 
        orderId,
        installmentNumber: 2
      },
      include: { order: true }
    });

    if (!installment2) {
      return res.status(404).json({ 
        error: 'Parcela 2 não encontrada para este pedido',
        orderId 
      });
    }

    console.log(`[Sync Inst2] Parcela 2 encontrada:`, {
      id: installment2.id,
      status: installment2.status,
      mpPreferenceId: installment2.mpPreferenceId
    });

    // Se já está paga, nenhuma ação necessária
    if (installment2.status === InstallmentStatus.PAID) {
      return res.status(200).json({
        message: 'Parcela 2 já está paga',
        installmentId: installment2.id,
        status: installment2.status,
        paidAt: installment2.paidAt
      });
    }

    // Se não tem mpPreferenceId, não pode sincronizar
    if (!installment2.mpPreferenceId) {
      return res.status(400).json({
        error: 'Parcela 2 ainda não foi criada no Mercado Pago',
        installmentId: installment2.id,
        status: installment2.status
      });
    }

    // 2. Consultar status no Mercado Pago
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!accessToken) {
      return res.status(500).json({ 
        error: 'Token do Mercado Pago não configurado' 
      });
    }

    console.log(`[Sync Inst2] Consultando MP para mpPreferenceId: ${installment2.mpPreferenceId}`);

    const mpResp = await fetch(
      `https://api.mercadopago.com/v1/payments/${installment2.mpPreferenceId}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );

    if (!mpResp.ok) {
      const text = await mpResp.text().catch(() => null);
      console.error(`[Sync Inst2] Erro ao buscar MP:`, mpResp.status, text);
      return res.status(502).json({
        error: 'Erro ao consultar Mercado Pago',
        statusCode: mpResp.status,
        details: text
      });
    }

    const mpData = await mpResp.json();
    const mpStatus = mpData?.status?.toString()?.toLowerCase() || '';
    const mpStatusDetail = mpData?.status_detail?.toString()?.toLowerCase() || '';

    console.log(`[Sync Inst2] MP Response:`, {
      id: mpData.id,
      status: mpStatus,
      statusDetail: mpStatusDetail,
      dateApproved: mpData.date_approved,
      amount: mpData.transaction_amount
    });

    // 3. Determinar novo status
    let newStatus: string = installment2.status;
    let shouldUpdate = false;

    if (['approved', 'paid', 'success'].includes(mpStatus) || 
        mpStatusDetail.includes('accredited') || 
        mpStatusDetail.includes('paid')) {
      newStatus = 'PAID';
      shouldUpdate = true;
      console.log(`[Sync Inst2] ✅ MP diz APPROVED! Atualizando para PAID`);
    } else if (['rejected', 'cancelled', 'refunded'].includes(mpStatus) || 
               mpStatusDetail.includes('rejected') || 
               mpStatusDetail.includes('cancelled')) {
      newStatus = 'FAILED';
      shouldUpdate = true;
      console.log(`[Sync Inst2] ❌ MP diz REJECTED! Atualizando para FAILED`);
    } else if (['in_process', 'pending'].includes(mpStatus) || mpStatus === '') {
      newStatus = 'PENDING';
      shouldUpdate = false; // Não atualizar se ainda estiver pendente
      console.log(`[Sync Inst2] ⏳ MP ainda está pendente`);
    }

    // 4. Atualizar banco de dados se necessário
    let result: any = {
      orderId,
      installmentId: installment2.id,
      previousStatus: installment2.status,
      currentMpStatus: mpStatus,
      updated: false
    };

    if (shouldUpdate) {
      const updateData: any = {
        status: newStatus,
        webhookLog: {
          ...((installment2.webhookLog as object) || {}),
          [new Date().toISOString()]: {
            action: 'sync-second-installment',
            mpStatus,
            mpStatusDetail,
            mpPaymentId: installment2.mpPreferenceId,
            resolved: true,
            installmentNumber: 2
          }
        }
      };

      if (newStatus === 'PAID') {
        updateData.paidAt = new Date();
      }

      const updated = await prisma.paymentInstallment.update({
        where: { id: installment2.id },
        data: updateData
      });

      result.status = updated.status;
      result.paidAt = updated.paidAt;
      result.updated = true;

      console.log(`[Sync Inst2] ✅ Parcela 2 atualizada para: ${newStatus}`);

      // 5. Verificar se ambas parcelas estão PAID
      const allInstallments = await prisma.paymentInstallment.findMany({
        where: { orderId }
      });

      const allPaid = allInstallments.every((i) => i.status === 'PAID');

      if (allPaid) {
        console.log(`[Sync Inst2] 🎉 Ambas parcelas PAID! Confirmando Order...`);
        
        const updatedOrder = await prisma.order.update({
          where: { id: orderId },
          data: {
            paymentStatus: 'PAID',
            status: 'CONFIRMED'
          }
        });

        result.orderUpdated = {
          status: updatedOrder.status,
          paymentStatus: updatedOrder.paymentStatus
        };

        console.log(`[Sync Inst2] 🎉 Order confirmada!`);
      }
    } else {
      result.status = installment2.status;
    }

    return res.status(200).json({
      success: true,
      message: result.updated ? 'Sincronização bem-sucedida' : 'Sem atualizações necessárias',
      ...result,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('[Sync Inst2] Erro:', error);
    return res.status(500).json({
      error: 'Erro ao sincronizar',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
