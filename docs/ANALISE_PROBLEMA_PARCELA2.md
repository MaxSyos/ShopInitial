/**
 * ANÁLISE DO PROBLEMA: Parcela 2 Não Se Atualiza
 */

// ===== FLUXO ATUAL (INCORRETO) =====

// PARCELA 1:
// 1. Endpoint /payments/create faz POST em /v1/payments
// 2. MP retorna: payment_id (ID do pagamento)
// 3. Sistema salva em mpPreferenceId: payment_id ❌ ERRO!
// 4. Webhook recebe: payment_id
// 5. Webhook procura por mpPreferenceId === payment_id ✅ ENCONTRA

// PARCELA 2:
// 1. Webhook cria Parcela 2 em /checkout/preferences
// 2. MP retorna: preference_id (ID da preference)
// 3. Sistema salva em mpPreferenceId: preference_id ✅ CORRETO
// 4. Webhook recebe: payment_id (de um pagamento realizado)
// 5. Webhook procura por mpPreferenceId === payment_id ❌ NÃO ENCONTRA!

// ===== O PROBLEMA =====
// A Parcela 2 usa external_reference no formato correto:
//   `${order.id}-INSTALLMENT-2`
// 
// Mas quando o webhook recebe o pagamento da Parcela 2:
// - Procura por external_reference ✅ DEVE ENCONTRAR
// - Mas se external_reference não vier do MP, procura por mpPreferenceId
// - E mpPreferenceId (preference_id) NÃO IGUALA payment_id ❌ FALHA

// ===== SOLUÇÃO =====
// 1. Usar campos separados para payment_id e preference_id
// 2. Melhorar a busca para suportar ambos
// 3. Garantir que external_reference seja usado como prioridade
