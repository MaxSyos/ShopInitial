#!/usr/bin/env node

/**
 * Script para testar se o webhook consegue encontrar uma Parcela 2 específica
 * Simula o que o webhook faz para localizar a parcela
 * 
 * Uso: npx ts-node scripts/test-webhook-parcela2.ts <payment_id>
 * 
 * Exemplo: npx ts-node scripts/test-webhook-parcela2.ts 14225147465
 */

import prisma from '../lib/prisma';
import { InstallmentStatus } from '@prisma/client';

async function testWebhookSearch(mpId: string) {
  console.log(`🔍 Testando localização de Parcela 2 para MP ID: ${mpId}\n`);
  console.log('='.repeat(80));

  let found: any = null;
  let method = '';

  // Método 1: Buscar por mpPreferenceId
  console.log('\n[1] Buscando por mpPreferenceId...');
  const byPreference = await prisma.paymentInstallment.findMany({
    where: { mpPreferenceId: mpId.toString() },
    include: { order: true },
    take: 1,
  });

  if (byPreference.length > 0) {
    found = byPreference[0];
    method = 'mpPreferenceId';
    console.log(`    ✅ ENCONTRADA via mpPreferenceId!`);
  } else {
    console.log('    ❌ Não encontrada');
  }

  // Método 2: Buscar Parcelas 2 com PAYMENT_CREATED
  if (!found) {
    console.log('\n[2] Buscando Parcela 2 com status PAYMENT_CREATED...');
    const payment2 = await prisma.paymentInstallment.findMany({
      where: {
        installmentNumber: 2,
        status: InstallmentStatus.PAYMENT_CREATED,
        mpPreferenceId: mpId.toString(),
      },
      include: { order: true },
      take: 1,
    });

    if (payment2.length > 0) {
      found = payment2[0];
      method = 'Parcela 2 PAYMENT_CREATED';
      console.log(`    ✅ ENCONTRADA via Parcela 2 PAYMENT_CREATED!`);
    } else {
      console.log('    ❌ Não encontrada');
    }
  }

  // Método 3: Listar TODAS as Parcelas 2
  if (!found) {
    console.log('\n[3] Listando TODAS as Parcelas 2...');
    const allParcelas2 = await prisma.paymentInstallment.findMany({
      where: { installmentNumber: 2 },
      include: { order: true },
    });

    console.log(`    Total: ${allParcelas2.length}`);

    if (allParcelas2.length > 0) {
      console.log('\n    Primeiras 5 Parcelas 2:');
      for (let i = 0; i < Math.min(5, allParcelas2.length); i++) {
        const p = allParcelas2[i];
        console.log(`      [${i + 1}] Order: ${p.orderId}`);
        console.log(`          mpPreferenceId: ${p.mpPreferenceId}`);
        console.log(`          Status: ${p.status}`);
        console.log(`          Match: ${p.mpPreferenceId === mpId.toString() ? '✅ SIM' : '❌ NÃO'}`);
      }

      // Procurar por match
      const matching = allParcelas2.find((p) => p.mpPreferenceId === mpId.toString());
      if (matching) {
        found = matching;
        method = 'Listagem manual';
        console.log(`\n    ✅ ENCONTRADA via listagem!`);
      }
    }
  }

  // Resultado
  console.log('\n' + '='.repeat(80));

  if (found) {
    console.log(`\n✅ SUCESSO! Parcela 2 ENCONTRADA`);
    console.log(`\nDetalhes:`);
    console.log(`  Método: ${method}`);
    console.log(`  Parcela ID: ${found.id}`);
    console.log(`  Order ID: ${found.orderId}`);
    console.log(`  Installment: ${found.installmentNumber}/2`);
    console.log(`  Amount: R$ ${Number(found.amount).toFixed(2)}`);
    console.log(`  Status: ${found.status}`);
    console.log(`  mpPreferenceId: ${found.mpPreferenceId}`);
    console.log(`  Created: ${found.createdAt}`);
    console.log(`  Paid At: ${found.paidAt || 'Não paga'}`);
  } else {
    console.log(`\n❌ FALHA! Parcela 2 NÃO encontrada`);
    console.log(`\nVerifique:`);
    console.log(`  1. O mpId ${mpId} está correto?`);
    console.log(`  2. Existe uma Parcela 2 no banco com este mpPreferenceId?`);
    console.log(`  3. A Parcela 2 tem status PAYMENT_CREATED?`);
  }

  console.log('\n');
}

const mpId = process.argv[2];

if (!mpId) {
  console.error('❌ Uso: npx ts-node scripts/test-webhook-parcela2.ts <payment_id>');
  console.error('\nExemplo:');
  console.error('  npx ts-node scripts/test-webhook-parcela2.ts 14225147465');
  process.exit(1);
}

testWebhookSearch(mpId)
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Erro:', err);
    process.exit(1);
  });
