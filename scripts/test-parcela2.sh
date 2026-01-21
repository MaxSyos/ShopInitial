#!/bin/bash

# Script para testar o fluxo completo de Parcela 2
# Uso: ./scripts/test-parcela2.sh <orderId>

if [ -z "$1" ]; then
  echo "❌ Uso: ./scripts/test-parcela2.sh <orderId>"
  echo ""
  echo "Exemplo:"
  echo "  ./scripts/test-parcela2.sh 65e8f1a2c9d3e4b5a6c7d8e9"
  exit 1
fi

ORDER_ID=$1
API_URL=${API_URL:-"http://localhost:3000"}

echo "🔍 Testando fluxo de Parcela 2"
echo "================================"
echo "Order ID: $ORDER_ID"
echo "API URL: $API_URL"
echo ""

# Teste 1: Criar/recuperar Parcela 2
echo "📌 Teste 1: Criar Parcela 2"
echo "----------------------------"
curl -X POST "$API_URL/api/payments/create-second" \
  -H "Content-Type: application/json" \
  -H "Cookie: token=YOUR_TOKEN_HERE" \
  -d "{\"orderId\": \"$ORDER_ID\"}" \
  -s | jq '.' || echo "❌ Erro na requisição"

echo ""
echo ""

# Teste 2: Listar todas as parcelas do pedido
echo "📌 Teste 2: Listar Parcelas do Pedido"
echo "-------------------------------------"
curl -X GET "$API_URL/api/orders/$ORDER_ID" \
  -H "Cookie: token=YOUR_TOKEN_HERE" \
  -s | jq '.installments // .paymentInstallments // .' || echo "❌ Erro na requisição"

echo ""
echo ""

# Teste 3: Se houver Parcela 2, verificar status
echo "📌 Teste 3: Verificar Status Parcela 2"
echo "--------------------------------------"
INSTALLMENT2_ID=$(curl -s -X GET "$API_URL/api/orders/$ORDER_ID" \
  -H "Cookie: token=YOUR_TOKEN_HERE" | jq -r '.installments[1].id // empty')

if [ -n "$INSTALLMENT2_ID" ]; then
  echo "Parcela 2 ID: $INSTALLMENT2_ID"
  curl -X GET "$API_URL/api/payments/$INSTALLMENT2_ID/pix-status-second" \
    -H "Cookie: token=YOUR_TOKEN_HERE" \
    -s | jq '.' || echo "❌ Erro na requisição"
else
  echo "⚠️  Parcela 2 não encontrada ainda"
fi

echo ""
echo "✅ Testes concluídos"
