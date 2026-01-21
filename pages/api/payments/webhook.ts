import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';
import { InstallmentStatus } from '@prisma/client';

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

    // Tentar localizar parcela pelo external_reference (formato: ORDER_ID-INSTALLMENT-1 ou ORDER_ID-INSTALLMENT-2)
    let installment: any = null;
    let order: any = null;
    
    if (mpDetails?.external_reference) {
      const match = mpDetails.external_reference.match(/^([0-9a-f]{24})-INSTALLMENT-([12])$/);
      if (match) {
        const orderId = match[1];
        const installmentNumber = parseInt(match[2]);
        
        // @ts-ignore
        installment = await prisma.paymentInstallment.findUnique({
          where: {
            orderId_installmentNumber: {
              orderId,
              installmentNumber,
            },
          },
          include: { order: true },
        });
        
        if (installment) {
          order = installment.order;
          console.log(`[Webhook] ✅ Parcela encontrada via external_reference: ${orderId}-INSTALLMENT-${installmentNumber}`);
        }
      }
    }

    // Fallback 1: procurar por mpPreferenceId na tabela de installments
    if (!installment) {
      console.log(`[Webhook] Tentando localizar por mpPreferenceId: ${mpId}`);
      // @ts-ignore
      const found = await prisma.paymentInstallment.findMany({
        where: { mpPreferenceId: mpId.toString() },
        include: { order: true },
        take: 1
      });
      
      if (found.length > 0) {
        installment = found[0];
        order = installment.order;
        console.log(`[Webhook] ✅ Parcela encontrada via mpPreferenceId`);
      }
    }

    // Fallback 2: Se não conseguir achar por mpPreferenceId, procurar em todos os webhookLog
    // para ver se esse payment_id foi registrado antes
    if (!installment && mpId) {
      console.log(`[Webhook] Procurando em webhookLog pelo payment_id: ${mpId}`);
      const allInstallments = await prisma.paymentInstallment.findMany({
        include: { order: true }
      });

      for (const inst of allInstallments) {
        if (inst.webhookLog) {
          const logs = Object.values(inst.webhookLog as any);
          const found = logs.some((log: any) => log?.mpPaymentId === mpId || log?.mpPaymentId?.toString() === mpId.toString());
          if (found) {
            installment = inst;
            order = inst.order;
            console.log(`[Webhook] ✅ Parcela encontrada via webhookLog: ${inst.orderId}-INSTALLMENT-${inst.installmentNumber}`);
            break;
          }
        }
      }
    }

    // Fallback 3: Buscar em Orders por external_reference para encontrar a Parcela 2
    // (casos em que external_reference contém ORDER_ID-INSTALLMENT-2)
    if (!installment && mpDetails?.external_reference) {
      console.log(`[Webhook] Fallback 3: Procurando Parcela 2 por external_reference: ${mpDetails.external_reference}`);
      const match = mpDetails.external_reference.match(/^([0-9a-f]{24})-INSTALLMENT-2$/);
      if (match) {
        const orderId = match[1];
        installment = await prisma.paymentInstallment.findUnique({
          where: {
            orderId_installmentNumber: {
              orderId,
              installmentNumber: 2,
            },
          },
          include: { order: true },
        });
        if (installment) {
          order = installment.order;
          console.log(`[Webhook] ✅ Parcela 2 encontrada via Fallback 3`);
        }
      }
    }

    // Fallback 4: Se MP não enviou external_reference, procurar em TODAS as Parcelas 2 PENDING
    // para ver se alguma corresponde ao preference_id antigo armazenado
    if (!installment && mpId) {
      console.log(`[Webhook] Fallback 4: Procurando Parcela 2 PENDING com mpPreferenceId antigo`);
      const allInstallments2 = await prisma.paymentInstallment.findMany({
        where: {
          installmentNumber: 2,
          status: InstallmentStatus.PAYMENT_CREATED,
        },
        include: { order: true },
      });

      // Procurar por mpPreferenceId (pode ser preference_id antigo ou payment_id novo)
      for (const inst of allInstallments2) {
        if (inst.mpPreferenceId === mpId.toString()) {
          installment = inst;
          order = inst.order;
          console.log(`[Webhook] ✅ Parcela 2 encontrada via Fallback 4: ${inst.orderId}-INSTALLMENT-2`);
          break;
        }
      }
    }

    if (!installment || !order) {
      console.warn('Parcela não encontrada para webhook MP id:', mpId, 'external_ref:', mpDetails?.external_reference);
      console.warn('Dados do MP recebidos:', JSON.stringify({ status: mpDetails?.status, status_detail: mpDetails?.status_detail, external_reference: mpDetails?.external_reference }, null, 2));
      return res.status(200).json({ received: true, message: 'Parcela não encontrada' });
    }

    // Determinar status usando status e status_detail do MP (mais robusto)
    let installmentStatus: InstallmentStatus = InstallmentStatus.PENDING;
    const mpStatus = mpDetails?.status?.toString()?.toLowerCase() || '';
    const mpStatusDetail = mpDetails?.status_detail?.toString()?.toLowerCase() || '';

    console.log(`[Webhook] MP ID: ${mpId}, Status: ${mpStatus}, Detail: ${mpStatusDetail}, External Ref: ${mpDetails?.external_reference}`);

    if (['approved', 'paid', 'success'].includes(mpStatus) || mpStatusDetail.includes('accredited') || mpStatusDetail.includes('paid')) {
      installmentStatus = InstallmentStatus.PAID;
    } else if (['rejected', 'cancelled', 'refunded'].includes(mpStatus) || mpStatusDetail.includes('rejected') || mpStatusDetail.includes('cancelled')) {
      installmentStatus = InstallmentStatus.FAILED;
    } else if (['in_process', 'pending'].includes(mpStatus) || mpStatus === '') {
      installmentStatus = InstallmentStatus.PENDING;
    }

    // Processar em transação para garantir atomicidade
    await prisma.$transaction(async (tx) => {
      // 1. Atualizar status da parcela
      console.log(`[Webhook] Atualizando parcela ${installment.orderId}-INSTALLMENT-${installment.installmentNumber} para status: ${installmentStatus}`);
      
      const updateData: any = {
        status: installmentStatus,
        webhookLog: {
          ...((installment.webhookLog as object) || {}),
          [new Date().toISOString()]: {
            action: body.action,
            mpStatus: mpDetails?.status,
            mpStatusDetail: mpDetails?.status_detail,
            mpPaymentId: mpId,
            mpExternalReference: mpDetails?.external_reference,
            resolved: true,
            installmentNumber: installment.installmentNumber,
          },
        },
      };

      // Se status é PAID, atualizar paidAt
      if (installmentStatus === InstallmentStatus.PAID) {
        updateData.paidAt = new Date();
      }

      await tx.paymentInstallment.update({
        where: { id: installment.id },
        data: updateData,
      });

      // 2. Se a Parcela 1 foi PAGA, criar Parcela 2 no MP
      if (installment.installmentNumber === 1 && installmentStatus === InstallmentStatus.PAID) {
        // Buscar a Parcela 2 NOVAMENTE para garantir dados atualizados
        let installment2 = await tx.paymentInstallment.findUnique({
          where: {
            orderId_installmentNumber: {
              orderId: order.id,
              installmentNumber: 2,
            },
          },
        });

        if (installment2 && installment2.status === InstallmentStatus.PENDING) {
          // Criar pagamento no MP para Parcela 2 (MESMO FLUXO QUE PARCELA 1)
          try {
            const mpAccessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
            const inst2IdempotencyKey = `order-${order.id}-inst-2`;
            if (inst2IdempotencyKey.length > 128) inst2IdempotencyKey.slice(0, 128);

            // Usar EXATAMENTE O MESMO FLUXO DA PARCELA 1 (/v1/payments)
            const inst2Body = {
              transaction_amount: Number(installment2.amount),
              description: `Pedido #${order.id} - Parcela 2/2`,
              payment_method_id: 'pix',
              external_reference: `${order.id}-INSTALLMENT-2`,
              payer: {
                email: order?.user?.email || '',
                first_name: order?.user?.name?.split(' ')[0] || '',
                last_name: order?.user?.name?.split(' ').slice(1).join(' ') || ''
              }
            };

            console.log('Criando pagamento MP para Parcela 2 — orderId:', order.id, 'installment: 2/2', 'amount:', installment2.amount, 'idempotencyKey:', inst2IdempotencyKey);

            const inst2Response = await fetch(
              'https://api.mercadopago.com/v1/payments',
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${mpAccessToken}`,
                  'x-idempotency-key': inst2IdempotencyKey
                },
                body: JSON.stringify(inst2Body),
              }
            );

            if (inst2Response.ok) {
              const inst2Data = await inst2Response.json();

              const inst2Qr = inst2Data?.point_of_interaction?.transaction_data?.qr_code;
              const inst2QrBase64 = inst2Data?.point_of_interaction?.transaction_data?.qr_code_base64;

              console.log('✅ Parcela 2 criada com sucesso no MP — payment_id:', inst2Data.id);

              // Atualizar Parcela 2 com dados do MP (IDÊNTICO AO FLUXO DA PARCELA 1)
              await tx.paymentInstallment.update({
                where: { id: installment2.id },
                data: {
                  status: InstallmentStatus.PAYMENT_CREATED,
                  mpPreferenceId: inst2Data.id?.toString(),
                  mpQrCodeUrl: inst2Qr || undefined,
                  mpQrCodeBase64: inst2QrBase64 || undefined,
                  mpIdempotencyKey: inst2IdempotencyKey,
                  expiresAt: inst2Data?.date_of_expiration ? new Date(inst2Data.date_of_expiration) : undefined,
                },
              });
            } else {
              const errText = await inst2Response.text();
              console.error('Erro ao criar Parcela 2 no MP:', inst2Response.status, errText);
            }
          } catch (err) {
            console.error('Erro ao criar Parcela 2:', err);
          }
        }
      }

      // 3. Se ambas as parcelas estão PAID, marcar pedido como PAID e CONFIRMED
      const allInstallments = await tx.paymentInstallment.findMany({
        where: { orderId: order.id },
      });

      const allPaid = allInstallments.every((inst) => inst.status === InstallmentStatus.PAID);

      if (allPaid) {
        console.log(`[Webhook] ✅ Ambas as parcelas PAID! Atualizando Order para CONFIRMED`);
        await tx.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: 'PAID',
            status: 'CONFIRMED', // Liberar para preparação/envio
          },
        });
      }
    });

    return res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('webhook error', error);
    return res.status(500).json({ received: false, error: error.message });
  }
}
