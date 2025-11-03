import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';
import { requireAuth, getUserFromRequest } from '../_utils/auth';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  // @ts-ignore
  const user = await getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Não autorizado' });

  const { orderId } = req.body;
  if (!orderId) return res.status(400).json({ error: 'orderId é obrigatório' });

  try {
    // @ts-ignore - prisma client model typing may need regeneration
    let order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { product: true } }, user: true }
    });

    // Se não encontramos o pedido no banco local, tentamos buscar na API externa
    let externalOrder: any = null;
    if (!order) {
      try {
        const externalUrl = `${process.env.NEXT_PUBLIC_API_URL}/orders/${orderId}`;
        const externalResp = await fetch(externalUrl, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: req.headers.authorization || ''
          }
        });

        if (externalResp.ok) {
          externalOrder = await externalResp.json();
        } else {
          console.warn('Não foi possível buscar pedido na API externa', await externalResp.text());
        }
      } catch (err) {
        console.warn('Erro ao buscar pedido na API externa', err);
      }
    }

    if (!order && !externalOrder) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    // Se o pedido existe localmente, garantimos que pertence ao usuário
    if (order && order.userId !== user.id) return res.status(403).json({ error: 'Pedido não pertence ao usuário' });

    // Se o pedido já possui um pagamento criado (mpPreferenceId ou mpQrCodeBase64),
    // não devemos criar outro pagamento no MercadoPago para evitar duplicidade.
    // Retornamos os dados existentes para o frontend.
    if (order && (order.mpPreferenceId || order.mpQrCodeBase64)) {
      return res.status(200).json({
        order,
        mp: {
          id: order.mpPreferenceId || null,
          qr: order.mpQrCodeUrl || null,
          qrBase64: order.mpQrCodeBase64 || null,
        },
      });
    }

    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

    // Monta payload simplificado para criar pagamento PIX via MercadoPago
    if (accessToken) {
      // Determina o valor a ser cobrado a partir do pedido local ou externo
      const amount = order ? order.total : (externalOrder?.total || externalOrder?.totalAmount || 0);
      // Criar pagamento via Payments API (PIX)
      const body = {
        transaction_amount: Number(amount),
        description: `Pedido #${orderId}`,
        payment_method_id: 'pix',
        external_reference: orderId,
        payer: {
          email: order?.user?.email || externalOrder?.user?.email || user.email,
          first_name: order?.user?.name?.split(' ')[0] || externalOrder?.user?.firstName || user.name?.split(' ')[0] || '',
          last_name: order?.user?.name?.split(' ').slice(1).join(' ') || externalOrder?.user?.lastName || user.name?.split(' ').slice(1).join('') || ''
        }
      };

      // Usar uma chave de idempotência determinística baseada no orderId.
      // Isso evita que múltiplas requisições concorrentes criem pagamentos duplicados no MP.
      // Ainda assim, mantemos um fallback caso orderId contenha caracteres impróprios.
      let idempotencyKey = `order-${String(orderId)}`;
      // Garantir que a chave não exceda limites conhecidos (por segurança)
      if (idempotencyKey.length > 64) idempotencyKey = idempotencyKey.slice(0, 64);

      const resp = await fetch('https://api.mercadopago.com/v1/payments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
            'x-idempotency-key': idempotencyKey
          },
          body: JSON.stringify(body)
        });

      const data = await resp.json();
      if (!resp.ok) {
        console.error('MP create payment error', data);
        return res.status(502).json({ error: 'Erro ao criar pagamento no MercadoPago', details: data });
      }

      const qr = data?.point_of_interaction?.transaction_data?.qr_code;
      const qrBase64 = data?.point_of_interaction?.transaction_data?.qr_code_base64;

      // Se temos um pedido local, atualizamos os campos de pagamento
      let updated = null;
      if (order) {
        try {
          // @ts-ignore - prisma client model typing may need regeneration
          updated = await prisma.order.update({
            where: { id: orderId },
            data: {
              mpPreferenceId: data.id?.toString(),
              mpQrCodeUrl: qr || undefined,
              mpQrCodeBase64: qrBase64 || undefined,
              paymentExpiresAt: data?.date_of_expiration ? new Date(data.date_of_expiration) : undefined,
              paymentStatus: 'PENDING'
            }
          });
        } catch (err) {
          console.warn('Falha ao atualizar pedido local com dados do MP', err);
        }
      }

      return res.status(200).json({ order: updated || externalOrder || null, mp: { id: data.id, qr, qrBase64 } });
    }

    // Fallback mock para desenvolvimento sem credenciais
    const mockQr = `data:image/png;base64,MOCK_QR_${orderId}`;
    // @ts-ignore - prisma client model typing may need regeneration
    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { mpPreferenceId: `mock-${orderId}`, mpQrCodeBase64: mockQr, paymentExpiresAt: new Date(Date.now() + 1000 * 60 * 30), paymentStatus: 'PENDING' }
    });

    return res.status(200).json({ order: updated, mp: { id: `mock-${orderId}`, qr: null, qrBase64: mockQr } });
  } catch (error: any) {
    console.error('create payment error', error);
    return res.status(500).json({ error: 'Erro interno ao criar pagamento', details: error.message });
  }
}

export default handler;
