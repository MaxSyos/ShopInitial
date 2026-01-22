import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';

/**
 * Endpoint de diagnóstico para verificar status de um pagamento
 * GET /api/payments/diagnose-payment?mpPreferenceId=142283786737
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { mpPreferenceId } = req.query;

    if (!mpPreferenceId || typeof mpPreferenceId !== 'string') {
      return res.status(400).json({ error: 'mpPreferenceId é obrigatório' });
    }

    console.log(`[Diagnose] Iniciando diagnóstico para mpPreferenceId: ${mpPreferenceId}`);

    // 1. Buscar no banco de dados local
    const installment = await prisma.paymentInstallment.findFirst({
      where: { mpPreferenceId },
      include: { order: { include: { user: true } } }
    });

    const dbStatus = {
      found: !!installment,
      id: installment?.id,
      status: installment?.status,
      paidAt: installment?.paidAt,
      installmentNumber: installment?.installmentNumber,
      orderId: installment?.orderId,
      webhookLog: installment?.webhookLog
    };

    console.log(`[Diagnose] Status no BD:`, dbStatus);

    // 2. Buscar no Mercado Pago
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    let mpStatus: any = { error: 'Sem token' };

    if (accessToken) {
      try {
        const resp = await fetch(`https://api.mercadopago.com/v1/payments/${mpPreferenceId}`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });

        if (resp.ok) {
          const mpData = await resp.json();
          mpStatus = {
            id: mpData.id,
            status: mpData.status,
            status_detail: mpData.status_detail,
            payment_method: mpData.payment_method,
            date_created: mpData.date_created,
            date_approved: mpData.date_approved,
            external_reference: mpData.external_reference,
            payer: mpData.payer?.email,
            amount: mpData.transaction_amount,
            description: mpData.description
          };
          console.log(`[Diagnose] Status no MP:`, mpStatus);
        } else {
          mpStatus = { error: `HTTP ${resp.status}`, details: await resp.text() };
          console.error(`[Diagnose] Erro ao buscar MP:`, mpStatus);
        }
      } catch (e: any) {
        mpStatus = { error: e.message };
        console.error(`[Diagnose] Exceção ao buscar MP:`, e);
      }
    }

    // 3. Comparar e sugerir ação
    let diagnosis = '';
    let suggestion = '';

    if (!installment) {
      diagnosis = '❌ Parcela NÃO encontrada no banco de dados local';
      suggestion = 'Verifique se o mpPreferenceId está correto ou se a Parcela foi criada';
    } else if (installment.status === 'PAID') {
      diagnosis = '✅ Parcela já está marcada como PAID no banco';
      suggestion = 'Status já foi sincronizado. Nenhuma ação necessária.';
    } else if (mpStatus.status === 'approved') {
      diagnosis = '⚠️ MISMATCH: MP diz APPROVED mas BD diz ' + installment.status;
      suggestion = 'Sincronizar manualmente marcando como PAID';
    } else if (mpStatus.status === 'pending' || mpStatus.status === 'in_process') {
      diagnosis = '⏳ Pagamento ainda não foi aprovado no MP';
      suggestion = 'Aguarde a aprovação do MP ou verifique se o PIX foi realmente enviado';
    } else if (mpStatus.error) {
      diagnosis = `❌ Erro ao consultar MP: ${mpStatus.error}`;
      suggestion = 'Verifique se o token de acesso está válido ou se o ID é correto';
    }

    // 4. Se MP diz approved mas BD não, sincronizar
    if (installment && mpStatus.status === 'approved' && installment.status !== 'PAID') {
      console.log(`[Diagnose] Tentando sincronizar automaticamente...`);
      
      const updated = await prisma.paymentInstallment.update({
        where: { id: installment.id },
        data: {
          status: 'PAID',
          paidAt: new Date(),
          webhookLog: {
            ...((installment.webhookLog as object) || {}),
            [new Date().toISOString()]: {
              action: 'auto-sync-from-diagnose',
              mpStatus: mpStatus.status,
              mpStatusDetail: mpStatus.status_detail,
              resolved: true
            }
          }
        }
      });

      // Verificar se ambas parcelas estão pagas
      const allInstallments = await prisma.paymentInstallment.findMany({
        where: { orderId: installment.orderId }
      });

      const allPaid = allInstallments.every((i) => i.status === 'PAID');
      if (allPaid) {
        await prisma.order.update({
          where: { id: installment.orderId },
          data: {
            paymentStatus: 'PAID',
            status: 'CONFIRMED'
          }
        });
        diagnosis += ' → ✅ SINCRONIZADO! Parcela marcada como PAID e Order confirmado';
      } else {
        diagnosis += ' → ✅ SINCRONIZADO! Parcela marcada como PAID';
      }

      suggestion = 'Sincronização automática foi executada com sucesso!';
    }

    return res.status(200).json({
      mpPreferenceId,
      diagnosis,
      suggestion,
      dbStatus,
      mpStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('[Diagnose] Erro:', error);
    return res.status(500).json({
      error: 'Erro ao diagnosticar',
      message: error.message
    });
  }
}
