/**
 * Script para verificar o status de um pagamento no Mercado Pago
 * e compará-lo com o banco de dados local
 */

async function checkMPPayment() {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  const mpId = '142834461102';

  if (!accessToken) {
    console.error('❌ MERCADOPAGO_ACCESS_TOKEN não configurado');
    process.exit(1);
  }

  console.log('\n=== VERIFICANDO PAGAMENTO NO MERCADO PAGO ===\n');
  console.log('MP ID:', mpId);

  try {
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${mpId}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Erro do Mercado Pago:', data);
      console.error('Status HTTP:', response.status);
      process.exit(1);
    }

    console.log('✅ Pagamento encontrado no Mercado Pago\n');
    console.log('Status MP:', data.status);
    console.log('Status Detail MP:', data.status_detail);
    console.log('Valor:', data.transaction_amount);
    console.log('Referência Externa:', data.external_reference);
    console.log('Data Criação:', data.date_created);
    console.log('Data Aprovação:', data.date_approved);
    console.log('Tipo Pagamento:', data.payment_type_id);
    console.log('Método Pagamento:', data.payment_method_id);

    // Análise
    console.log('\n=== ANÁLISE ===\n');
    const mpStatus = data.status?.toString()?.toLowerCase() || '';
    const mpStatusDetail = data.status_detail?.toString()?.toLowerCase() || '';

    if (['approved', 'paid', 'success'].includes(mpStatus) || mpStatusDetail.includes('accredited') || mpStatusDetail.includes('paid')) {
      console.log('✅ Status no MP: PAID (Pago)');
    } else if (['rejected', 'cancelled', 'refunded'].includes(mpStatus)) {
      console.log('❌ Status no MP: FAILED (Falhou)');
    } else if (['in_process', 'pending'].includes(mpStatus)) {
      console.log('⏳ Status no MP: PENDING (Processando)');
    } else {
      console.log('❓ Status no MP:', mpStatus, '-', mpStatusDetail);
    }

    console.log('\n✅ External Reference:', data.external_reference);
    if (data.external_reference) {
      const match = data.external_reference.match(/^([0-9a-f]{24})-INSTALLMENT-([12])$/);
      if (match) {
        console.log('   - Order ID:', match[1]);
        console.log('   - Installment:', match[2]);
      } else {
        console.log('   - ⚠️ Não está no formato esperado!');
      }
    } else {
      console.log('   - ❌ SEM external_reference!');
    }

    console.log('\n📄 Resposta Completa do Mercado Pago:\n');
    console.log(JSON.stringify(data, null, 2));

  } catch (error: any) {
    console.error('❌ Erro na requisição:', error.message);
    process.exit(1);
  }
}

checkMPPayment();
