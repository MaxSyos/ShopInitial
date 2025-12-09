import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  try {
    const body = req.body;

    // MP sends different webhook shapes; try multiple paths to find the payment id
    // Examples: { data: { id } }, { id }, { data: { resource: { id } } }, { data: { object: { id } } }
    const mpId = body?.data?.id
      || body?.data?.resource?.id
      || body?.data?.object?.id
      || body?.id
      || null;
    if (!mpId) {
      console.warn('Webhook recebido sem mp id', body);
      return res.status(200).json({ received: true });
    }

    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    let mpDetails: any = null;

    if (accessToken) {
      // tentar buscar detalhes do pagamento no MP
      try {
        const resp = await fetch(`https://api.mercadopago.com/v1/payments/${mpId}`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        mpDetails = await resp.json();
      } catch (err) {
        console.warn('Falha ao buscar detalhes do MP no webhook', err);
      }
    }

    // Tentar localizar pedido pelo external_reference (mpDetails.external_reference) ou pelo mpPreferenceId
    let order: any = null;
    if (mpDetails?.external_reference) {
      // @ts-ignore - prisma client model typing may need regeneration
      order = await prisma.order.findUnique({ where: { id: mpDetails.external_reference } });
    }

    if (!order) {
      // procurar por mpPreferenceId que contenha mpId (fallback)
      // @ts-ignore - prisma client model typing may need regeneration
      order = await prisma.order.findFirst({ where: { mpPreferenceId: mpId.toString() } });
    }

    if (!order && mpDetails?.metadata?.orderId) {
      // @ts-ignore - prisma client model typing may need regeneration
      order = await prisma.order.findUnique({ where: { id: mpDetails.metadata.orderId } });
    }

    if (!order) {
      console.warn('Pedido não encontrado para webhook MP id:', mpId);
      return res.status(200).json({ received: true, message: 'Pedido não encontrado' });
    }

    // Determinar status usando status e status_detail do MP (mais robusto)
    let status: string = 'PENDING';
    const mpStatus = mpDetails?.status?.toString()?.toLowerCase() || '';
    const mpStatusDetail = mpDetails?.status_detail?.toString()?.toLowerCase() || '';

    if (['approved', 'paid', 'success'].includes(mpStatus) || mpStatusDetail.includes('accredited') || mpStatusDetail.includes('paid')) {
      status = 'PAID';
    } else if (['rejected', 'cancelled', 'refunded'].includes(mpStatus) || mpStatusDetail.includes('rejected') || mpStatusDetail.includes('cancelled')) {
      status = 'FAILED';
    } else if (['in_process', 'pending'].includes(mpStatus) || mpStatus === '') {
      status = 'PENDING';
    }

    const updateData: any = { paymentStatus: status };
    // Quando o pagamento estiver confirmado, marcar paidAt e avançar o fluxo do pedido
    if (status === 'PAID') {
      updateData.paidAt = new Date();
      // avançar o status do pedido para permitir processamento/logística no frontend
      updateData.status = 'IN_PROCESS';
    }

    // persistir outros campos retornados pelo MP quando disponíveis
    try {
      if (mpDetails?.id) updateData.mpPreferenceId = mpDetails.id?.toString();
      const qrBase64 = mpDetails?.point_of_interaction?.transaction_data?.qr_code_base64 || mpDetails?.qr_code_base64 || null;
      if (qrBase64) updateData.mpQrCodeBase64 = qrBase64;
      if (mpDetails?.point_of_interaction?.transaction_data?.qr_code) updateData.mpQrCodeUrl = mpDetails.point_of_interaction.transaction_data.qr_code;
      if (mpDetails?.date_of_expiration) updateData.paymentExpiresAt = new Date(mpDetails.date_of_expiration);

      // @ts-ignore - prisma client model typing may need regeneration
      await prisma.order.update({ where: { id: order.id }, data: updateData });
    } catch (err) {
      console.warn('Falha ao atualizar pedido via webhook', err);
    }

    return res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('webhook error', error);
    return res.status(500).json({ received: false, error: error.message });
  }
}
