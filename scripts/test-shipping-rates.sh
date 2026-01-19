#!/bin/bash

# Script de teste para a funcionalidade de Valor de Envio
# Coloque seu token Bearer aqui ou passe como argumento

TOKEN=${1:-"seu_token_aqui"}
BASE_URL="http://localhost:3000"

echo "=========================================="
echo "Teste - Gerenciador de Valor de Envio"
echo "=========================================="
echo ""

# 1. Testar GET (listar)
echo "1. Buscando tabelas de frete existentes..."
curl -s -X GET "$BASE_URL/api/admin/shipping-rates" \
  -H "Authorization: Bearer $TOKEN" \
  | jq . || echo "Erro na requisição"
echo ""
echo ""

# 2. Testar POST (criar)
echo "2. Criando nova tabela de frete..."
curl -s -X POST "$BASE_URL/api/admin/shipping-rates" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": 10,
    "height": 15,
    "width": 20,
    "length": 25,
    "sedexValue": 45.90,
    "pacValue": 23.50,
    "cep": "39400000",
    "destination": "Montes Claros, MG"
  }' \
  | jq . || echo "Erro na requisição"
echo ""
echo ""

# 3. Testar calcular frete
echo "3. Calculando frete via Correios..."
curl -s -X POST "$BASE_URL/api/admin/calculate-shipping" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "height": 15,
    "width": 20,
    "length": 25,
    "cep": "39400000"
  }' \
  | jq . || echo "Erro na requisição"
echo ""
echo ""

echo "=========================================="
echo "Testes concluídos!"
echo "=========================================="
