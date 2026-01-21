import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';
import { getUserFromRequest } from '../_utils/auth';

/**
 * Gera QR code para uma parcela específica (geralmente a segunda)
 * Chamado quando cliente clica "Pagar Agora" na segunda parcela
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  const user = await getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Não autorizado' });

  const { orderId, installmentNumber } = req.body;
  if (!orderId) return res.status(400).json({ error: 'orderId é obrigatório' });
  if (!installmentNumber) return res.status(400).json({ error: 'installmentNumber é obrigatório' });

  try {
    // Buscar order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { product: true } }, user: true, installments: true }
    });

    if (!order) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    // Verificar se pedido pertence ao usuário
    if (order.userId !== user.id) {
      return res.status(403).json({ error: 'Pedido não pertence ao usuário' });
    }

    // Buscar a parcela solicitada
    const installment = await prisma.paymentInstallment.findUnique({
      where: {
        orderId_installmentNumber: {
          orderId: order.id,
          installmentNumber: Number(installmentNumber),
        },
      },
    });

    if (!installment) {
      return res.status(404).json({ error: `Parcela ${installmentNumber} não encontrada` });
    }

    // Se já tem QR gerado, retornar os dados existentes
    if (installment.mpPreferenceId && installment.mpQrCodeBase64) {
      console.log(`[Generate QR] Parcela ${installmentNumber} já tem QR gerado, retornando dados existentes`);
      return res.status(200).json({
        installment,
        mp: {
          id: installment.mpPreferenceId,
          qr: installment.mpQrCodeUrl,
          qrBase64: installment.mpQrCodeBase64,
        },
      });
    }

    // Obter credenciais do MP
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    const clientIdempotencyKey = (req.body && req.body.idempotencyKey) ? String(req.body.idempotencyKey) : null;

    // Se temos credenciais, criar no MP
    if (accessToken) {
      const amount = installment.amount;
      const body = {
        transaction_amount: Number(amount),
        description: `Pedido #${orderId} - Parcela ${installmentNumber}/${order.installments?.length || 2}`,
        payment_method_id: 'pix',
        external_reference: `${orderId}-INSTALLMENT-${installmentNumber}`,
        payer: {
          email: order?.user?.email || user.email,
          first_name: order?.user?.name?.split(' ')[0] || user.name?.split(' ')[0] || '',
          last_name: order?.user?.name?.split(' ').slice(1).join(' ') || user.name?.split(' ').slice(1).join('') || ''
        }
      };

      // Para segunda parcela, geralmente sem expiração (pode adicionar lógica diferente)
      if (installmentNumber === 1) {
        (body as any).expires_in = 1800; // 30 minutos
      }

      let idempotencyKey = clientIdempotencyKey || `order-${String(orderId)}-inst-${installmentNumber}`;
      if (idempotencyKey.length > 128) idempotencyKey = idempotencyKey.slice(0, 128);

      // Persistir a idempotencyKey
      try {
        await prisma.paymentInstallment.update({
          where: { id: installment.id },
          data: { mpIdempotencyKey: idempotencyKey }
        });
      } catch (err) {
        console.warn('Não foi possível persistir mpIdempotencyKey na parcela:', err);
      }

      console.log(`[Generate QR] Criando QR para parcela ${installmentNumber} — orderId: ${orderId}, amount: ${amount}`);

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
          console.warn(`[Generate QR] MP returned 423 (resource_already_locked), tentando novamente`);
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
        console.error(`[Generate QR] MP create payment error for installment ${installmentNumber}`, data);
        return res.status(502).json({ error: 'Erro ao criar pagamento no MercadoPago', details: data });
      }

      const qr = data?.point_of_interaction?.transaction_data?.qr_code;
      const qrBase64 = data?.point_of_interaction?.transaction_data?.qr_code_base64;

      // Atualizar Parcela com dados do MP
      const updatedInstallment = await prisma.paymentInstallment.update({
        where: { id: installment.id },
        data: {
          mpPreferenceId: data.id?.toString(),
          mpQrCodeUrl: qr || undefined,
          mpQrCodeBase64: qrBase64 || undefined,
          expiresAt: data?.date_of_expiration ? new Date(data.date_of_expiration) : undefined,
          status: 'PAYMENT_CREATED'
        }
      });

      return res.status(200).json({
        installment: updatedInstallment,
        mp: { id: data.id, qr, qrBase64 }
      });
    }

    // Fallback mock para desenvolvimento sem credenciais
    const mockQr = `data:image/png;base64,MOCK_QR_${orderId}_INST_${installmentNumber}`;
    const updated = await prisma.paymentInstallment.update({
      where: { id: installment.id },
      data: {
        mpPreferenceId: `mock-${orderId}-inst-${installmentNumber}`,
        mpQrCodeBase64: mockQr,
        mpQrCodeUrl: `00020.mock.${installmentNumber}...`,
        expiresAt: installmentNumber === 1 ? new Date(Date.now() + 1000 * 60 * 30) : null,
        status: 'PAYMENT_CREATED'
      }
    });

    return res.status(200).json({
      installment: updated,
      mp: { id: `mock-${orderId}-inst-${installmentNumber}`, qr: null, qrBase64: mockQr }
    });
  } catch (error: any) {
    console.error(`[Generate QR] Error for installment ${installmentNumber}`, error);
    return res.status(500).json({ error: 'Erro interno ao gerar QR', details: error.message });
  }
}

export default handler;
