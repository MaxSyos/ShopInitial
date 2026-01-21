import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../lib/prisma';
import { getUserFromRequest } from '../../_utils/auth';
import { InstallmentStatus } from '@prisma/client';

/**
 * Endpoint para verificar o status da Parcela 2 com o Mercado Pago
 * e sincronizar no banco de dados local
 * 
 * Similar a: /api/payments/[id]/pix-status para Parcela 1
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end('Method Not Allowed');

  const user = await getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Não autorizado' });

  const { id } = req.query;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'ID obrigatório' });
  }

  try {
    // Buscar a Parcela 2 pelo ID ou pelo orderId
    let installment2 = await prisma.paymentInstallment.findUnique({
      where: { id },
      include: { order: { include: { user: true } } }
    });

    // Se não encontrou por ID direto, tentar como orderId
    if (!installment2) {
      const order = await prisma.order.findUnique({
        where: { id },
        include: { installments: true, user: true }
      });

      if (order) {
        // Buscar Parcela 2 do pedido
        installment2 = order.installments?.find((i: any) => i.installmentNumber === 2) || null;
        if (installment2) {
          installment2 = { ...installment2, order } as any;
        }
      }
    }

    if (!installment2) {
      return res.status(404).json({ error: 'Parcela 2 não encontrada' });
    }

    // Verificar se pertence ao usuário
    if (installment2.order?.userId !== user.id) {
      return res.status(403).json({ error: 'Não autorizado' });
    }

    // Se não é Parcela 2, retornar erro
    if (installment2.installmentNumber !== 2) {
      return res.status(400).json({ error: 'Este endpoint é apenas para Parcela 2' });
    }

    // Se não tem mpPreferenceId, retornar status atual
    if (!installment2.mpPreferenceId) {
      return res.status(200).json({
        id: installment2.id,
        status: installment2.status,
        message: 'Parcela 2 ainda não foi criada no Mercado Pago'
      });
    }

    // Buscar status no Mercado Pago
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!accessToken) {
      return res.status(200).json({
        id: installment2.id,
        status: installment2.status,
        message: 'Sem credenciais do MP'
      });
    }

    console.log(`[pix-status-2] Verificando status da Parcela 2: ${installment2.mpPreferenceId}`);

    const resp = await fetch(
      `https://api.mercadopago.com/v1/payments/${installment2.mpPreferenceId}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );

    if (!resp.ok) {
      console.error('Erro ao buscar status do MP:', resp.status, await resp.text());
      return res.status(200).json({
        id: installment2.id,
        status: installment2.status,
        error: 'Erro ao buscar no MP'
      });
    }

    const mpData = await resp.json();
    const mpStatus = mpData?.status?.toString()?.toLowerCase() || '';
    const mpStatusDetail = mpData?.status_detail?.toString()?.toLowerCase() || '';

    console.log(`[pix-status-2] MP Status: ${mpStatus}, Detail: ${mpStatusDetail}`);

    // Determinar novo status
    let newStatus = installment2.status;
    if (['approved', 'paid', 'success'].includes(mpStatus) || mpStatusDetail.includes('accredited') || mpStatusDetail.includes('paid')) {
      newStatus = InstallmentStatus.PAID;
    } else if (['rejected', 'cancelled', 'refunded'].includes(mpStatus) || mpStatusDetail.includes('rejected') || mpStatusDetail.includes('cancelled')) {
      newStatus = InstallmentStatus.FAILED;
    } else if (['in_process', 'pending'].includes(mpStatus) || mpStatus === '') {
      newStatus = InstallmentStatus.PENDING;
    }

    // Se status mudou, atualizar no banco
    if (newStatus !== installment2.status) {
      console.log(`[pix-status-2] Atualizando status de ${installment2.status} para ${newStatus}`);

      const updateData: any = {
        status: newStatus,
        webhookLog: {
          ...((installment2.webhookLog as object) || {}),
          [new Date().toISOString()]: {
            action: 'sync-pix-status',
            mpStatus,
            mpStatusDetail,
            mpPaymentId: installment2.mpPreferenceId,
            resolved: true,
            installmentNumber: 2,
          },
        },
      };

      // Se status é PAID, atualizar paidAt
      if (newStatus === InstallmentStatus.PAID) {
        updateData.paidAt = new Date();
      }

      const updated = await prisma.paymentInstallment.update({
        where: { id: installment2.id },
        data: updateData,
      });

      // Verificar se ambas as parcelas estão PAID
      const allInstallments = await prisma.paymentInstallment.findMany({
        where: { orderId: installment2.orderId }
      });

      const allPaid = allInstallments.every((inst) => inst.status === InstallmentStatus.PAID);

      if (allPaid) {
        console.log(`[pix-status-2] ✅ Ambas as parcelas PAID! Atualizando Order para CONFIRMED`);
        await prisma.order.update({
          where: { id: installment2.orderId },
          data: {
            paymentStatus: 'PAID',
            status: 'CONFIRMED',
          },
        });
      }

      return res.status(200).json({
        id: updated.id,
        status: updated.status,
        paidAt: updated.paidAt,
        message: 'Status atualizado'
      });
    }

    // Status não mudou
    return res.status(200).json({
      id: installment2.id,
      status: installment2.status,
      message: 'Status sem mudanças'
    });
  } catch (error: any) {
    console.error('pix-status-2 error', error);
    return res.status(500).json({ error: 'Erro interno', details: error.message });
  }
}

export default handler;
