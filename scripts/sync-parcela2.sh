#!/bin/bash

# Script auxiliar para sincronizar Parcelas 2 antigas do Mercado Pago
# Uso: yarn sync-parcela2

echo "🔄 Sincronizando Parcelas 2 com Mercado Pago..."
echo ""

if ! command -v npx &> /dev/null; then
  echo "❌ npx não encontrado. Instale Node.js primeiro."
  exit 1
fi

npx ts-node scripts/sync-old-parcela2.ts

exit_code=$?

if [ $exit_code -eq 0 ]; then
  echo ""
  echo "✅ Sincronização concluída com sucesso!"
else
  echo ""
  echo "❌ Erro na sincronização"
fi

exit $exit_code
