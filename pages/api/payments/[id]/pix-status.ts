import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end('Method Not Allowed');

  try {
    const { id } = req.query;
    if (!id || Array.isArray(id)) return res.status(400).json({ error: 'id é obrigatório' });

    const mpId = String(id);
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

    // Tentar localizar pedido localmente pelo mpPreferenceId ou pelo id do pedido
    // Primeiro buscar por mpPreferenceId exato
    let order: any = await prisma.order.findFirst({ where: { mpPreferenceId: mpId } });

    // Se não encontrado, talvez o id enviado é o id do pedido local
    if (!order) {
      // buscar por order.id
      order = await prisma.order.findUnique({ where: { id: mpId } });
    }

    // Se não temos accessToken ou não conseguimos consultar o MP, retornamos o status salvo localmente
    if (!accessToken) {
      if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });
      const localStatus = order.paymentStatus || 'PENDING';
      // Normalizar para o formato esperado pelo frontend
      const uiStatus = localStatus === 'PENDING' ? 'WAITING_PAYMENT' : (localStatus === 'PAID' ? 'COMPLETED' : (localStatus === 'FAILED' ? 'FAILED' : localStatus));
      return res.status(200).json({ status: uiStatus, localStatus, order });
    }

    // Consultar detalhes do pagamento no MercadoPago
    const resp = await fetch(`https://api.mercadopago.com/v1/payments/${mpId}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!resp.ok) {
      // se o MP retornou erro, retornar status local se houver
      const text = await resp.text().catch(() => null);
      console.warn('MP status fetch failed', mpId, text);
      if (!order) return res.status(502).json({ error: 'Falha ao consultar MP e pedido não encontrado localmente', details: text });
      const localStatus = order.paymentStatus || 'PENDING';
      const uiStatus = localStatus === 'PENDING' ? 'WAITING_PAYMENT' : (localStatus === 'PAID' ? 'COMPLETED' : (localStatus === 'FAILED' ? 'FAILED' : localStatus));
      return res.status(200).json({ status: uiStatus, localStatus, order, mpError: text });
    }

    const mpDetails = await resp.json();

    // Se o MP retornou external_reference, tentar localizar pedido por ele
    if (!order && mpDetails?.external_reference) {
      order = await prisma.order.findUnique({ where: { id: mpDetails.external_reference } });
    }

    // Mapear status MP para status de UI
    let status = 'WAITING_PAYMENT';
    const mpStatus = mpDetails?.status || mpDetails?.status_detail || '';
    if (mpStatus === 'approved' || mpStatus === 'paid' || mpStatus === 'success') {
      status = 'COMPLETED';
    } else if (mpStatus === 'rejected' || mpStatus === 'cancelled' || mpStatus === 'refunded') {
      status = 'FAILED';
    } else if (mpStatus === 'in_process' || mpStatus === 'pending' || mpStatus === '') {
      status = 'WAITING_PAYMENT';
    }

    // Atualizar registro local com o status do pagamento quando possível
    try {
      if (order) {
        const updateData: any = {};
        // Mapear para o schema local
        if (status === 'COMPLETED') {
          updateData.paymentStatus = 'PAID';
          updateData.paidAt = new Date();
        } else if (status === 'FAILED') {
          updateData.paymentStatus = 'FAILED';
        } else {
          updateData.paymentStatus = 'PENDING';
        }

        // também persistir mpPreferenceId e mpQrCodeBase64 se vierem
        if (mpDetails?.id) updateData.mpPreferenceId = mpDetails.id?.toString();
        const qrBase64 = mpDetails?.point_of_interaction?.transaction_data?.qr_code_base64 || mpDetails?.qr_code_base64 || null;
        if (qrBase64) updateData.mpQrCodeBase64 = qrBase64;

        await prisma.order.update({ where: { id: order.id }, data: updateData });
      }
    } catch (e) {
      console.warn('Falha ao atualizar pedido com status MP', e);
    }

    return res.status(200).json({ status, mpDetails, order: order || null });
  } catch (error: any) {
    console.error('pix-status error', error);
    return res.status(500).json({ error: 'Erro interno', details: error.message });
  }
}
