# Guia de Testes - Sistema de Faixas de Frete

## 🧪 Testes Manuais

### Teste 1: Criar Primeira Faixa

**Objetivo**: Verificar se o formulário funciona corretamente

1. Fazer login como ADMIN
2. Ir para `/manage-shipping-rates`
3. Clicar em "+ Adicionar Nova Tabela"
4. Preencher os campos:
   - Quantidade Até: `10`
   - Altura (cm): `13`
   - Largura (cm): `22`
   - Comprimento (cm): `30`
   - Peso (kg): `1.8`
5. Clicar "Calcular Frete via Correios"
6. **Verificar**: 
   - ✅ Campo SEDEX mostra um valor (deve ser: R$105.00)
   - ✅ Campo PAC mostra um valor (deve ser: R$55.00)
7. Clicar "Criar Tabela de Frete"
8. **Verificar**:
   - ✅ Toast de sucesso aparece
   - ✅ Faixa aparece na tabela abaixo

**Fórmula Esperada**:
- SEDEX = (1.8 × 50) + 15 = 90 + 15 = R$105.00
- PAC = (1.8 × 25) + 10 = 45 + 10 = R$55.00

---

### Teste 2: Criar Segunda Faixa

**Objetivo**: Criar uma tabela com múltiplas faixas

1. Clicar novamente em "+ Adicionar Nova Tabela"
2. Preencher:
   - Quantidade Até: `15`
   - Altura (cm): `13`
   - Largura (cm): `22`
   - Comprimento (cm): `30`
   - Peso (kg): `2.3`
3. Clicar "Calcular Frete via Correios"
4. **Verificar**:
   - ✅ SEDEX = (2.3 × 50) + 15 = 130.00
   - ✅ PAC = (2.3 × 25) + 10 = 67.50
5. Clicar "Criar Tabela de Frete"

---

### Teste 3: Criar Terceira Faixa (Dimensões Maiores)

1. Clicar em "+ Adicionar Nova Tabela"
2. Preencher:
   - Quantidade Até: `20`
   - Altura (cm): `28`
   - Largura (cm): `28`
   - Comprimento (cm): `36`
   - Peso (kg): `3.0`
3. Clicar "Calcular Frete via Correios"
4. **Verificar**:
   - ✅ SEDEX = (3.0 × 50) + 15 = 165.00
   - ✅ PAC = (3.0 × 25) + 10 = 85.00

---

### Teste 4: Verificar Tabela

**Objetivo**: Confirmar que todas as faixas aparecem corretamente

Na tabela de faixas cadastradas, você deve ver:

| Até (peças) | Dimensões (A×L×C) | Peso (kg) | Valor SEDEX | Valor PAC | Ações |
|-------------|-------------------|-----------|-------------|-----------|-------|
| até 10 peças | 13×22×30 cm | 1.8 kg | R$ 105.00 | R$ 55.00 | Editar / Deletar |
| até 15 peças | 13×22×30 cm | 2.3 kg | R$ 130.00 | R$ 67.50 | Editar / Deletar |
| até 20 peças | 28×28×36 cm | 3.0 kg | R$ 165.00 | R$ 85.00 | Editar / Deletar |

**Verificar**:
- ✅ 3 linhas na tabela
- ✅ Dimensões formatadas como "A×L×C"
- ✅ Peso com unidade "kg"
- ✅ Valores formatados como "R$ X.XX"

---

### Teste 5: Editar uma Faixa

**Objetivo**: Verificar se a edição funciona

1. Na tabela, clicar em "Editar" na faixa de 10 peças
2. Modificar o peso de 1.8 para 2.0
3. Clicar "Calcular Frete via Correios"
4. **Verificar**:
   - ✅ SEDEX atualiza para R$115.00 (2.0 × 50 + 15)
   - ✅ PAC atualiza para R$60.00 (2.0 × 25 + 10)
5. Clicar "Atualizar Tabela de Frete"
6. **Verificar**:
   - ✅ Toast de sucesso
   - ✅ Tabela atualiza com novos valores

---

### Teste 6: Deletar uma Faixa

**Objetivo**: Verificar exclusão

1. Na tabela, clicar em "Deletar" na faixa de 20 peças
2. **Verificar**:
   - ✅ Confirmação de diálogo aparece
3. Confirmar exclusão
4. **Verificar**:
   - ✅ Toast de sucesso
   - ✅ Faixa desaparece da tabela (agora 2 faixas)

---

### Teste 7: Visualizar Frete em Pedido (Fora da Zona Restrita)

**Objetivo**: Verificar cálculo de frete para pedido

**Pré-requisito**: Ter pelo menos 1 faixa cadastrada e um pedido criado

1. Ir para `/orders`
2. Visualizar pedido com:
   - CEP fora da faixa 39400-000 a 39409-999 (ex: 85300-000)
   - Vários itens (ex: 5 itens)
3. **Verificar**:
   - ✅ Coluna "Frete" aparece no card
   - ✅ Mostra "SEDEX: R$..." e "PAC: R$..."
   - ✅ Valores correspondem à faixa correta
     - Se 5 itens: Usa faixa "até 10" (1.8kg ou 2.0kg após edição)
     - SEDEX = 115.00, PAC = 60.00

---

### Teste 8: Visualizar Frete em Pedido (Zona Restrita)

**Objetivo**: Verificar se zona restrita mostra "Frete na zona local"

**Pré-requisito**: Ter um pedido com CEP na faixa 39400-000 a 39409-999

1. Ir para `/orders`
2. Visualizar pedido com CEP restrito (ex: 39400-115)
3. **Verificar**:
   - ✅ Coluna "Frete" mostra: "Frete na zona local"
   - ✅ Não mostra valores SEDEX/PAC

---

### Teste 9: Seleção de Faixa Correta

**Objetivo**: Verificar se a lógica de seleção de faixa é correta

Cenários:

#### Cenário A: Pedido com 5 itens
- Faixas disponíveis: 10, 15, 20
- Quantidade do pedido: 5
- **Esperado**: Usa faixa "até 10" ✅

#### Cenário B: Pedido com 10 itens
- Faixas disponíveis: 10, 15, 20
- Quantidade do pedido: 10
- **Esperado**: Usa faixa "até 10" ✅

#### Cenário C: Pedido com 12 itens
- Faixas disponíveis: 10, 15, 20
- Quantidade do pedido: 12
- **Esperado**: Usa faixa "até 15" (pois 15 >= 12 e é a menor) ✅

#### Cenário D: Pedido com 15 itens
- Faixas disponíveis: 10, 15, 20
- Quantidade do pedido: 15
- **Esperado**: Usa faixa "até 15" ✅

#### Cenário E: Pedido com 18 itens
- Faixas disponíveis: 10, 15, 20
- Quantidade do pedido: 18
- **Esperado**: Usa faixa "até 20" ✅

#### Cenário F: Pedido com 25 itens
- Faixas disponíveis: 10, 15, 20
- Quantidade do pedido: 25
- **Esperado**: Erro "Nenhuma tabela de frete encontrada" (precisaria faixa "até 30" ou maior)

---

### Teste 10: Validações

**Objetivo**: Testar validações de entrada

1. Deixar campo "Peso" em branco e clicar "Calcular Frete"
   - **Esperado**: ✅ Erro "Preencha as dimensões e peso..."

2. Deixar campo "Quantidade Até" em branco e clicar "Criar"
   - **Esperado**: ✅ Erro "Preencha todos os campos obrigatórios"

3. Calcular frete mas não salvar, clicar "Cancelar"
   - **Esperado**: ✅ Formulário fecha, valores não salvos

---

## 🔍 Verificações de Lógica

### Verificação 1: Peso Correto na Resposta da API

**Endpoint**: `POST /api/orders/calculate-shipping`

```bash
curl -X POST http://localhost:3000/api/orders/calculate-shipping \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "quantity": 12,
    "cep": "85300-000"
  }'
```

**Resposta Esperada** (com 3 faixas criadas):
```json
{
  "sedex": 130.00,
  "pac": 67.50,
  "cep": "85300000",
  "quantity": 12,
  "quantityUpTo": 15,
  "height": 13,
  "width": 22,
  "length": 30,
  "weight": 2.3,
  "shippingRateId": "..."
}
```

**Verificar**:
- ✅ `quantityUpTo` = 15 (menor faixa >= 12)
- ✅ `weight` = 2.3 (peso da faixa)
- ✅ `sedex` = 130.00 (calculado corretamente: 2.3 × 50 + 15)
- ✅ `pac` = 67.50 (calculado corretamente: 2.3 × 25 + 10)

---

### Verificação 2: Zona Restrita Retorna Null

**Endpoint**: `POST /api/orders/calculate-shipping`

```bash
curl -X POST http://localhost:3000/api/orders/calculate-shipping \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "quantity": 5,
    "cep": "39400-115"
  }'
```

**Resposta Esperada**:
```json
null
```

**Verificar**:
- ✅ Retorna `null` para CEP em zona restrita
- ✅ Nenhum erro HTTP, apenas `null`

---

## 📊 Dados de Teste Recomendados

Para testar adequadamente, crie estas 5 faixas:

| Até | Altura | Largura | Comprimento | Peso | SEDEX Esperado | PAC Esperado |
|-----|--------|---------|-------------|------|----------------|--------------|
| 10 | 13 | 22 | 30 | 1.8 | 105.00 | 55.00 |
| 15 | 13 | 22 | 30 | 2.3 | 130.00 | 67.50 |
| 20 | 28 | 28 | 36 | 3.0 | 165.00 | 85.00 |
| 30 | 28 | 28 | 36 | 3.5 | 190.00 | 97.50 |
| 40 | 40 | 40 | 40 | 4.5 | 240.00 | 122.50 |

---

## ✅ Checklist Final

- [ ] Teste 1: Criar primeira faixa ✅
- [ ] Teste 2: Criar segunda faixa ✅
- [ ] Teste 3: Criar terceira faixa ✅
- [ ] Teste 4: Verificar tabela completa ✅
- [ ] Teste 5: Editar faixa existente ✅
- [ ] Teste 6: Deletar faixa ✅
- [ ] Teste 7: Frete fora zona restrita ✅
- [ ] Teste 8: Frete em zona restrita ✅
- [ ] Teste 9: Seleção de faixa (5 cenários) ✅
- [ ] Teste 10: Validações ✅
- [ ] Verificação 1: API com quantidade correta ✅
- [ ] Verificação 2: API com zona restrita ✅

---

## 🐛 Troubleshooting

### Erro: "Nenhuma tabela de frete encontrada"
- **Causa**: Não há faixa cadastrada ou não há faixa maior que quantidade do pedido
- **Solução**: 
  1. Ir para `/manage-shipping-rates`
  2. Criar faixas que cubram todas as quantidades esperadas

### Erro: "CEP inválido"
- **Causa**: CEP não tem 8 dígitos
- **Solução**: Use CEP válido (ex: 85300-000 → 85300000)

### SEDEX/PAC não calculam
- **Causa**: Campo peso não preenchido
- **Solução**: Preencher peso antes de clicar "Calcular Frete"

### Frete não aparece em `/orders`
- **Causa**: Múltiplas possibilidades
- **Debug**:
  1. Abrir DevTools (F12)
  2. Ir para Console
  3. Procurar erros de requisição
  4. Verificar se há faixas cadastradas
  5. Verificar se CEP é válido

---

## 📞 Suporte

Se encontrar problemas:
1. Verifique console.log no servidor
2. Verifique DevTools (F12) no navegador
3. Verifique `/manage-shipping-rates` se há faixas cadastradas
4. Tente criar um novo pedido com CEP simples (ex: 85300-000)
