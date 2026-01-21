#!/usr/bin/env node

/**
 * Script para corrigir Parcelas 2 criadas com o sistema antigo (/checkout/preferences)
 * Sincroniza com Mercado Pago para verificar se foram pagas e atualiza o banco
 * 
 * Uso: npx ts-node scripts/sync-old-parcela2.ts
 */

import prisma from '../lib/prisma';
import { InstallmentStatus } from '@prisma/client';

const MERCADOPAGO_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;

async function main() {
  console.log('🔄 Sincronizando Parcelas 2 antigas com Mercado Pago...\n');

  if (!MERCADOPAGO_ACCESS_TOKEN) {
    console.error('❌ MERCADOPAGO_ACCESS_TOKEN não configurado');
    process.exit(1);
  }

  try {
    // Buscar todas as Parcelas 2 que ainda estão com status PAYMENT_CREATED
    const oldParcelas2 = await prisma.paymentInstallment.findMany({
      where: {
        installmentNumber: 2,
        status: InstallmentStatus.PAYMENT_CREATED,
      },
      include: { order: true },
    });

    console.log(`📋 Encontradas ${oldParcelas2.length} Parcelas 2 com status PAYMENT_CREATED`);
    console.log(`${'='.repeat(80)}\n`);

    if (oldParcelas2.length === 0) {
      console.log('✅ Nenhuma Parcela 2 para sincronizar!');
      process.exit(0);
    }

    let updated = 0;
    let paid = 0;
    let failed = 0;
    let noChange = 0;

    for (const inst of oldParcelas2) {
      console.log(`\n🔍 Verificando: ${inst.orderId}-INSTALLMENT-2`);
      console.log(`   ID Local: ${inst.id}`);
      console.log(`   mpPreferenceId: ${inst.mpPreferenceId}`);

      if (!inst.mpPreferenceId) {
        console.log('   ⚠️  Sem mpPreferenceId, pulando...');
        continue;
      }

      try {
        // Buscar status no Mercado Pago usando o preference_id ou payment_id
        const resp = await fetch(
          `https://api.mercadopago.com/v1/payments/${inst.mpPreferenceId}`,
          {
            headers: { Authorization: `Bearer ${MERCADOPAGO_ACCESS_TOKEN}` },
          }
        );

        if (!resp.ok) {
          console.log(`   ⚠️  Erro ao buscar no MP: ${resp.status}`);
          continue;
        }

        const mpData = await resp.json();
        const mpStatus = mpData?.status?.toLowerCase() || '';
        const mpStatusDetail = mpData?.status_detail?.toLowerCase() || '';

        console.log(`   MP Status: ${mpStatus}`);
        console.log(`   MP Status Detail: ${mpStatusDetail}`);

        // Determinar novo status
        let newStatus = inst.status;
        if (
          ['approved', 'paid', 'success'].includes(mpStatus) ||
          mpStatusDetail.includes('accredited') ||
          mpStatusDetail.includes('paid')
        ) {
          newStatus = InstallmentStatus.PAID;
          console.log(`   ✅ Pagamento CONFIRMADO no MP!`);
        } else if (
          ['rejected', 'cancelled', 'refunded'].includes(mpStatus) ||
          mpStatusDetail.includes('rejected') ||
          mpStatusDetail.includes('cancelled')
        ) {
          newStatus = InstallmentStatus.FAILED;
          console.log(`   ❌ Pagamento REJEITADO no MP`);
        }

        // Se mudou, atualizar
        if (newStatus !== inst.status) {
          console.log(`   📝 Atualizando de ${inst.status} para ${newStatus}...`);

          const updateData: any = {
            status: newStatus,
            webhookLog: {
              ...((inst.webhookLog as object) || {}),
              [new Date().toISOString()]: {
                action: 'sync-old-parcela2',
                mpStatus,
                mpStatusDetail,
                mpPaymentId: inst.mpPreferenceId,
                resolved: true,
                installmentNumber: 2,
              },
            },
          };

          if (newStatus === InstallmentStatus.PAID) {
            updateData.paidAt = new Date();
          }

          await prisma.paymentInstallment.update({
            where: { id: inst.id },
            data: updateData,
          });

          console.log(`   ✅ Parcela 2 atualizada!`);
          updated++;

          if (newStatus === InstallmentStatus.PAID) {
            paid++;

            // Verificar se ambas as parcelas estão PAID
            const allInstallments = await prisma.paymentInstallment.findMany({
              where: { orderId: inst.orderId },
            });

            const allPaid = allInstallments.every(
              (i) => i.id === inst.id ? newStatus === InstallmentStatus.PAID : i.status === InstallmentStatus.PAID
            );

            if (allPaid) {
              console.log(`   🎉 AMBAS as parcelas PAID! Marcando Order como CONFIRMED...`);
              await prisma.order.update({
                where: { id: inst.orderId },
                data: {
                  paymentStatus: 'PAID',
                  status: 'CONFIRMED',
                },
              });
            }
          }
        } else {
          console.log(`   ℹ️  Nenhuma mudança (status já é ${inst.status})`);
          noChange++;
        }
      } catch (err: any) {
        console.error(`   ❌ Erro ao processar: ${err.message}`);
        failed++;
      }
    }

    console.log(`\n${'='.repeat(80)}`);
    console.log('\n📊 RESUMO DA SINCRONIZAÇÃO:');
    console.log(`   Processadas: ${oldParcelas2.length}`);
    console.log(`   Atualizadas: ${updated}`);
    console.log(`   Pagas: ${paid}`);
    console.log(`   Sem mudança: ${noChange}`);
    console.log(`   Erros: ${failed}`);
    console.log(`\n✅ Sincronização concluída!\n`);

    process.exit(0);
  } catch (err: any) {
    console.error('❌ Erro geral:', err.message);
    process.exit(1);
  }
}

main();
