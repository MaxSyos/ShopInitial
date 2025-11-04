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

  // Se o cliente forneceu uma idempotencyKey (frontend), use-a; caso contrário gere uma baseada no orderId
  // Isso permite rastrear e reutilizar a mesma chave em re-submits do cliente.
  const clientIdempotencyKey = (req.body && req.body.idempotencyKey) ? String(req.body.idempotencyKey) : null;

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
      // Preferir a chave enviada pelo frontend (persistida localmente), senão gerar uma determinística
      let idempotencyKey = clientIdempotencyKey || `order-${String(orderId)}`;
      if (idempotencyKey.length > 128) idempotencyKey = idempotencyKey.slice(0, 128);

      // Persistir a idempotencyKey no pedido local como uma defesa adicional
      if (order) {
        try {
          // @ts-ignore
          await prisma.order.update({ where: { id: orderId }, data: { mpIdempotencyKey: idempotencyKey } });
        } catch (err) {
          console.warn('Não foi possível persistir mpIdempotencyKey no pedido:', err);
        }
      }

      console.log('Criando pagamento MP — orderId:', orderId, 'idempotencyKey:', idempotencyKey);

      // Tentar criar pagamento no Mercado Pago com idempotência e tratamento para status 423
      const mpUrl = 'https://api.mercadopago.com/v1/payments';
      let resp: Response | null = null;
      let data: any = null;

      // Tentativas limitadas (retry simples) para lidar com condições transitórias
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

        // Se recebeu 423 (resource locked), tentar buscar pagamento existente e retornar
        if (resp.status === 423) {
          console.warn('MP returned 423 (resource_already_locked), tentando localizar pagamento existente (attempt', attempt + 1, ')');

          try {
            const searchUrl = `https://api.mercadopago.com/v1/payments/search?external_reference=${encodeURIComponent(orderId)}`;
            const searchResp = await fetch(searchUrl, {
              headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }
            });
            if (searchResp.ok) {
              const searchData = await searchResp.json();
              const results = searchData.results || [];
              if (results.length > 0) {
                const existing = results[0];
                const qr = existing?.point_of_interaction?.transaction_data?.qr_code;
                const qrBase64 = existing?.point_of_interaction?.transaction_data?.qr_code_base64;

                // Atualizar pedido local se existir
                let updatedExisting = null;
                try {
                  // @ts-ignore
                  updatedExisting = await prisma.order.update({
                    where: { id: orderId },
                    data: {
                      mpPreferenceId: existing.id?.toString(),
                      mpQrCodeUrl: qr || undefined,
                      mpQrCodeBase64: qrBase64 || undefined,
                      paymentExpiresAt: existing?.date_of_expiration ? new Date(existing.date_of_expiration) : undefined,
                      paymentStatus: 'PENDING'
                    }
                  });
                } catch (err) {
                  console.warn('Falha ao atualizar pedido local com pagamento existente do MP', err);
                }

                return res.status(200).json({ order: updatedExisting || externalOrder || null, mp: { id: existing.id, qr, qrBase64 } });
              }
            }
          } catch (err) {
            console.warn('Erro ao buscar pagamento existente no MP após 423:', err);
          }

          // Se não encontrou, aguardar um backoff curto e tentar novamente
          const backoffMs = 200 * Math.pow(2, attempt);
          await new Promise(r => setTimeout(r, backoffMs));
          continue; // próxima tentativa
        }

        // Se não for OK e não for 423, interrompe o loop para tratar como erro
        if (!resp.ok) break;

        // sucesso
        break;
      }

      // Se não obteve resposta bem-sucedida
      if (!resp || !resp.ok) {
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
