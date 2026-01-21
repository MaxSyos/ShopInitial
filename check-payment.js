const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

if (!accessToken) {
  console.error('❌ MERCADOPAGO_ACCESS_TOKEN não configurado');
  process.exit(1);
}

console.log('🔄 Buscando status da transação 142834461102...\n');

fetch('https://api.mercadopago.com/v1/payments/142834461102', {
  headers: { Authorization: `Bearer ${accessToken}` }
})
  .then(res => res.json())
  .then(data => {
    if (data.error) {
      console.error('❌ Erro do Mercado Pago:', data.message);
      console.error(JSON.stringify(data, null, 2));
      return;
    }
    
    console.log('✅ Status da Transação:\n');
    console.log('ID:', data.id);
    console.log('Status:', data.status);
    console.log('Status Detail:', data.status_detail);
    console.log('Valor:', data.transaction_amount);
    console.log('Referência Externa:', data.external_reference);
    console.log('Data Criação:', data.date_created);
    console.log('Data Aprovação:', data.date_approved);
    console.log('Tipo de Pagamento:', data.payment_type_id);
    console.log('Método de Pagamento:', data.payment_method_id);
    
    console.log('\n📄 Resposta Completa:\n');
    console.log(JSON.stringify(data, null, 2));
  })
  .catch(err => console.error('❌ Erro na requisição:', err.message));
