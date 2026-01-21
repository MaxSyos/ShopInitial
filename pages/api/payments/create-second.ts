import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';
import { getUserFromRequest } from '../_utils/auth';
import { InstallmentStatus } from '@prisma/client';

/**
 * Endpoint para criar/obter a Parcela 2 de um pedido
 * Usa o MESMO FLUXO da Parcela 1 (/v1/payments)
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  const user = await getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Não autorizado' });

  const { orderId } = req.body;
  if (!orderId) return res.status(400).json({ error: 'orderId é obrigatório' });

  try {
    // Buscar order no banco local
    let order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { product: true } }, user: true }
    });

    if (!order) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    // Verificar se pedido pertence ao usuário
    if (order.userId !== user.id) {
      return res.status(403).json({ error: 'Pedido não pertence ao usuário' });
    }

    // Buscar a Parcela 1 para verificar se foi paga
    const installment1 = await prisma.paymentInstallment.findUnique({
      where: {
        orderId_installmentNumber: {
          orderId: order.id,
          installmentNumber: 1,
        },
      },
    });

    if (!installment1) {
      return res.status(404).json({ error: 'Parcela 1 não encontrada' });
    }

    if (installment1.status !== InstallmentStatus.PAID) {
      return res.status(400).json({ error: 'Parcela 1 ainda não foi paga' });
    }

    // Buscar a Parcela 2
    const installment2 = await prisma.paymentInstallment.findUnique({
      where: {
        orderId_installmentNumber: {
          orderId: order.id,
          installmentNumber: 2,
        },
      },
    });

    if (!installment2) {
      return res.status(404).json({ error: 'Parcela 2 não encontrada' });
    }

    // Se já tem QR gerado, retornar os dados existentes
    if (installment2.mpPreferenceId && installment2.mpQrCodeBase64 && installment2.status === InstallmentStatus.PAYMENT_CREATED) {
      return res.status(200).json({
        order,
        installment2: {
          id: installment2.id,
          amount: installment2.amount,
          mpPreferenceId: installment2.mpPreferenceId,
          mpQrCodeUrl: installment2.mpQrCodeUrl,
          mpQrCodeBase64: installment2.mpQrCodeBase64,
          expiresAt: installment2.expiresAt,
          status: installment2.status,
        },
        mp: {
          id: installment2.mpPreferenceId,
          qr: installment2.mpQrCodeUrl,
          qrBase64: installment2.mpQrCodeBase64,
        },
      });
    }

    // Obter credenciais do MP
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

    // Se temos credenciais, criar no MP
    if (accessToken) {
      const amount = installment2.amount;
      const body = {
        transaction_amount: Number(amount),
        description: `Pedido #${orderId} - Parcela 2/2`,
        payment_method_id: 'pix',
        external_reference: `${orderId}-INSTALLMENT-2`,
        payer: {
          email: order?.user?.email || user.email,
          first_name: order?.user?.name?.split(' ')[0] || user.name?.split(' ')[0] || '',
          last_name: order?.user?.name?.split(' ').slice(1).join(' ') || user.name?.split(' ').slice(1).join('') || ''
        }
      };

      let idempotencyKey = `order-${String(orderId)}-inst-2`;
      if (idempotencyKey.length > 128) idempotencyKey = idempotencyKey.slice(0, 128);

      // Persistir a idempotencyKey
      try {
        await prisma.paymentInstallment.update({
          where: { id: installment2.id },
          data: { mpIdempotencyKey: idempotencyKey }
        });
      } catch (err) {
        console.warn('Não foi possível persistir mpIdempotencyKey na parcela 2:', err);
      }

      console.log('Criando pagamento MP — orderId:', orderId, 'installment: 2/2', 'amount:', amount, 'idempotencyKey:', idempotencyKey);

      // Tentar criar pagamento no Mercado Pago
      const mpUrl = 'https://api.mercadopago.com/v1/payments';
      let resp: Response | null = null;
      let data: any = null;

      const maxAttempts = 3;
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        resp = await fetch(mpUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
            'x-idempotency-key': idempotencyKey
          },
          body: JSON.stringify(body)
        });

        try {
          data = await resp.json();
        } catch (e) {
          data = null;
        }

        // Se recebeu 423 (resource locked)
        if (resp.status === 423) {
          console.warn('MP returned 423 (resource_already_locked), tentando localizar pagamento existente');
          const backoffMs = 200 * Math.pow(2, attempt);
          await new Promise(r => setTimeout(r, backoffMs));
          continue;
        }

        // Se não for OK e não for 423, interrompe
        if (!resp.ok) break;
        break;
      }

      // Se não obteve resposta bem-sucedida
      if (!resp || !resp.ok) {
        console.error('MP create payment error para Parcela 2', data);
        return res.status(502).json({ error: 'Erro ao criar pagamento no MercadoPago', details: data });
      }

      const qr = data?.point_of_interaction?.transaction_data?.qr_code;
      const qrBase64 = data?.point_of_interaction?.transaction_data?.qr_code_base64;

      // Atualizar Parcela 2 com dados do MP
      const updatedInstallment2 = await prisma.paymentInstallment.update({
        where: { id: installment2.id },
        data: {
          mpPreferenceId: data.id?.toString(),
          mpQrCodeUrl: qr || undefined,
          mpQrCodeBase64: qrBase64 || undefined,
          expiresAt: data?.date_of_expiration ? new Date(data.date_of_expiration) : undefined,
          status: InstallmentStatus.PAYMENT_CREATED
        }
      });

      console.log('✅ Parcela 2 criada com sucesso no MP — payment_id:', data.id);

      return res.status(200).json({
        order,
        installment2: updatedInstallment2,
        mp: { id: data.id, qr, qrBase64 }
      });
    }

    // Fallback mock para desenvolvimento sem credenciais
    const mockQr = `data:image/png;base64,MOCK_QR_${orderId}_INST2`;
    const updated = await prisma.paymentInstallment.update({
      where: { id: installment2.id },
      data: {
        mpPreferenceId: `mock-${orderId}-inst-2`,
        mpQrCodeBase64: mockQr,
        expiresAt: new Date(Date.now() + 1000 * 60 * 30),
        status: InstallmentStatus.PAYMENT_CREATED
      }
    });

    console.log('Parcela 2 criada em modo mock');

    return res.status(200).json({
      order,
      installment2: updated,
      mp: { id: `mock-${orderId}-inst-2`, qr: null, qrBase64: mockQr }
    });
  } catch (error: any) {
    console.error('create second payment error', error);
    return res.status(500).json({ error: 'Erro interno ao criar pagamento', details: error.message });
  }
}

export default handler;
