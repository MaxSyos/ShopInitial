#!/usr/bin/env node
/**
 * Script de segurança para deletar TODOS os registros de `orderItem` e `order` no banco.
 * Uso:
 *  - Primeiro execute para listar contagens: `node FrontEnd/scripts/clear-orders.js`
 *  - Para executar a deleção real, defina CONFIRM=yes: `CONFIRM=yes node FrontEnd/scripts/clear-orders.js`
 *
 * Atenção: esta operação é destrutiva. Só execute se tiver certeza.
 */

const { PrismaClient } = require('@prisma/client');

(async () => {
  const prisma = new PrismaClient();
  try {
    // Contar registros atuais
    const countOrderItems = await prisma.orderItem.count().catch(() => 0);
    const countOrders = await prisma.order.count().catch(() => 0);

    console.log(`Found ${countOrderItems} orderItem(s) and ${countOrders} order(s) in the database.`);

    const confirm = process.env.CONFIRM === 'yes' || process.argv.includes('--yes') || process.argv.includes('-y');
    if (!confirm) {
      console.log('\nDry run — no changes made. To actually delete, run with CONFIRM=yes or --yes flag.');
      process.exit(0);
    }

    console.log('Deleting order items...');
    const delItems = await prisma.orderItem.deleteMany();
    console.log(`Deleted ${delItems.count || 0} orderItem(s).`);

    console.log('Deleting orders...');
    const delOrders = await prisma.order.deleteMany();
    console.log(`Deleted ${delOrders.count || 0} order(s).`);

    console.log('Done.');
  } catch (e) {
    console.error('Error while clearing orders:', e);
    process.exitCode = 2;
  } finally {
    try { await prisma.$disconnect(); } catch (e) {}
  }
})();
