# Sistema de Faixas de Frete - Documentação

## Visão Geral

O sistema de frete foi redesenhado para funcionar com **faixas de quantidade de peças**. Cada faixa define:
- **Até (peças)**: Limite superior da faixa (ex: até 10, até 15, até 20)
- **Altura (cm)**: Altura da caixa
- **Largura (cm)**: Largura da caixa
- **Comprimento (cm)**: Comprimento da caixa
- **Peso (kg)**: Peso do pacote
- **Valor SEDEX (R$)**: Calculado automaticamente via Correios
- **Valor PAC (R$)**: Calculado automaticamente via Correios

## Exemplo de Tabela

```
Até 10 peças   → A: 13cm, L: 22cm, C: 30cm, Peso: 1.8kg  → SEDEX: R$35.00, PAC: R$20.50
Até 15 peças   → A: 13cm, L: 22cm, C: 30cm, Peso: 2.3kg  → SEDEX: R$36.50, PAC: R$21.75
Até 20 peças   → A: 28cm, L: 28cm, C: 36cm, Peso: 3.0kg  → SEDEX: R$40.00, PAC: R$24.50
Até 30 peças   → A: 28cm, L: 28cm, C: 36cm, Peso: 3.5kg  → SEDEX: R$42.50, PAC: R$26.25
Até 40 peças   → A: 40cm, L: 40cm, C: 40cm, Peso: 4.5kg  → SEDEX: R$47.50, PAC: R$28.75
```

## Fluxo de Funcionamento

### 1. Admin Cria Faixas de Frete (`/manage-shipping-rates`)

1. Clica em **"+ Adicionar Nova Tabela"**
2. Preenche:
   - **Quantidade Até**: Ex: 10
   - **Altura**: Ex: 13
   - **Largura**: Ex: 22
   - **Comprimento**: Ex: 30
   - **Peso**: Ex: 1.8
3. Clica em **"Calcular Frete via Correios"**
4. Sistema calcula SEDEX e PAC automaticamente
5. Clica em **"Criar Tabela de Frete"**

### 2. Cálculo de Frete para Pedidos

Quando um usuário vê seus pedidos (`/orders`):

1. **Sistema calcula total de itens** do pedido
2. **Valida o CEP de entrega**:
   - Se CEP está entre 39400-000 e 39409-999 → Mostra "Frete na zona local" (sem valores)
   - Senão → Procura pela faixa apropriada
3. **Busca a faixa de frete correta**:
   - Exemplo: Se pedido tem 12 itens, encontra a menor faixa onde `Até >= 12`
   - Neste caso: Usa a faixa "Até 15"
4. **Exibe SEDEX e PAC** baseado na faixa selecionada

### 3. Fórmula de Cálculo

Os valores SEDEX e PAC são calculados usando:

```
SEDEX = (peso × 50) + 15
PAC   = (peso × 25) + 10
```

Onde `peso` é o valor em kg informado na faixa.

## Arquivos Modificados

### Schema Prisma (`/prisma/schema.prisma`)
```typescript
model ShippingRate {
  id           String   @id @map("_id") @default(auto()) @db.ObjectId
  quantityUpTo Int      // Até X peças
  height       Float    // Altura em cm
  width        Float    // Largura em cm
  length       Float    // Comprimento em cm
  weight       Float    // Peso em kg
  sedexValue   Float    @default(0)
  pacValue     Float    @default(0)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

### Interface TypeScript (`/pages/manage-shipping-rates.tsx`)
```typescript
interface ShippingRate {
  id?: string;
  quantityUpTo: number;  // Alterado de 'quantity'
  height: number;
  width: number;
  length: number;
  weight: number;        // Novo campo
  sedexValue?: number;
  pacValue?: number;
}
```

### API Admin (`/pages/api/admin/calculate-shipping.ts`)
- Recebe: `height`, `width`, `length`, `weight`, `cep`
- Retorna: `sedex`, `pac`, `cep`, `height`, `width`, `length`, `weight`
- Fórmula: SEDEX = peso × 50 + 15, PAC = peso × 25 + 10

### API Pedidos (`/pages/api/orders/calculate-shipping.ts`)
- Recebe: `quantity` (total de itens), `cep` (destino)
- Lógica:
  1. Valida CEP
  2. Verifica se está em zona restrita (39400-000 a 39409-999)
  3. Busca faixa: `findFirst where quantityUpTo >= quantity orderBy quantityUpTo ASC`
  4. Calcula SEDEX/PAC usando peso da faixa
- Retorna: `sedex`, `pac`, `cep`, `quantity`, `quantityUpTo`, `height`, `width`, `length`, `weight`, `shippingRateId`

### Página de Pedidos (`/components/orders/index.tsx`)
- Calcula frete para cada pedido ao carregar
- Exibe SEDEX e PAC em coluna dedicada
- Mostra "Frete na zona local" para CEPs restritos

## Cenários de Exemplo

### Exemplo 1: Pedido com 5 itens
```
Quantidade de itens: 5
CEP destino: 01234-567

Busca: Encontra a faixa onde quantityUpTo >= 5
Resultado: Usa a faixa "Até 10" (1.8kg)
SEDEX = (1.8 × 50) + 15 = R$105.00
PAC   = (1.8 × 25) + 10 = R$55.00
```

### Exemplo 2: Pedido com 15 itens
```
Quantidade de itens: 15
CEP destino: 39400-115 (zona restrita)

CEP validado: 39400115 (entre 39400000 e 39409999)
Resultado: Mostra "Frete na zona local"
SEDEX: não mostrado
PAC:   não mostrado
```

### Exemplo 3: Pedido com 18 itens
```
Quantidade de itens: 18
CEP destino: 30400-000

Busca: Encontra a faixa onde quantityUpTo >= 18
Resultado: Usa a faixa "Até 20" (3.0kg)
SEDEX = (3.0 × 50) + 15 = R$165.00
PAC   = (3.0 × 25) + 10 = R$85.00
```

## Gerenciamento de Faixas

### Adicionar Nova Faixa
1. Ir para `/manage-shipping-rates`
2. Clicar em "+ Adicionar Nova Tabela"
3. Preencher todos os campos
4. Clicar "Calcular Frete via Correios"
5. Clicar "Criar Tabela de Frete"

### Editar Faixa Existente
1. Ir para `/manage-shipping-rates`
2. Clicar em "Editar" na faixa desejada
3. Modificar os valores
4. Clicar "Calcular Frete via Correios" (se mudar dimensões/peso)
5. Clicar "Atualizar Tabela de Frete"

### Deletar Faixa
1. Ir para `/manage-shipping-rates`
2. Clicar em "Deletar" na faixa
3. Confirmar exclusão

## Validações

- **Quantidade Até**: Deve ser positiva
- **Dimensões**: Devem ser positivas (altura, largura, comprimento)
- **Peso**: Deve ser positivo
- **SEDEX/PAC**: Devem ser preenchidos automaticamente (não editáveis manualmente)
- **CEP**: Deve ter 8 dígitos no cálculo para pedidos

## Próximos Passos (Integração Real com Correios)

Para integrar com a API real dos Correios, você pode:

1. Usar o package `node-correios`:
```bash
npm install node-correios
```

2. Adicionar credenciais em `.env.local`:
```env
CORREIOS_USER=seu_usuario
CORREIOS_PASSWORD=sua_senha
CORREIOS_ADMIN_CODE=seu_codigo
CORREIOS_CEP_ORIGEM=39400115
```

3. Modificar `/pages/api/admin/calculate-shipping.ts` para usar a API real

Veja `CORREIOS_INTEGRATION.md` para detalhes completos.

## Troubleshooting

### "Nenhuma tabela de frete encontrada"
- Verifique se há faixas cadastradas no `/manage-shipping-rates`
- Certifique-se que existe uma faixa com `quantityUpTo >= quantidade_do_pedido`

### "CEP inválido"
- CEP deve ter exatamente 8 dígitos
- Remova hífen, ponto ou outros caracteres

### Frete mostrando "na zona local"
- O CEP do pedido está entre 39400-000 e 39409-999
- Isso é esperado para a zona restrita

## Fórmula de Cálculo Explicada

A fórmula `SEDEX = (peso × 50) + 15` significa:
- **Peso × 50**: Valor base por kg (R$50 por kg para SEDEX)
- **+ 15**: Taxa fixa de R$15 (taxa de manipulação)

Exemplo com peso de 2kg:
- SEDEX = (2 × 50) + 15 = 100 + 15 = R$115
- PAC = (2 × 25) + 10 = 50 + 10 = R$60
