# Gerenciador de Valor de Envio (Frete)

## Descrição

Esta funcionalidade permite que administradores gerenciem uma tabela de valores de envio baseada nas dimensões da caixa (altura, largura, comprimento) e quantidade de peças.

## Localização

**Página:** `/manage-shipping-rates`

## Funcionalidades

### 1. Listar Tabelas de Frete
Visualize todas as tabelas de frete cadastradas em uma tabela com as seguintes colunas:
- **Quantidade**: Número de peças
- **Tamanho da Caixa**: Dimensões (Altura x Largura x Comprimento em cm)
- **CEP Destino**: CEP de destino para o qual foi calculado o frete
- **Valor SEDEX**: Valor do frete com serviço SEDEX (R$)
- **Valor PAC**: Valor do frete com serviço PAC (R$)
- **Ações**: Editar ou Deletar

### 2. Adicionar Nova Tabela de Frete
Clique no botão "+ Adicionar Nova Tabela" para abrir o formulário de adição.

**Campos do formulário:**
- **Quantidade de Peças** (obrigatório): Número inteiro
- **Altura (cm)** (obrigatório): Valor decimal
- **Largura (cm)** (obrigatório): Valor decimal
- **Comprimento (cm)** (obrigatório): Valor decimal
- **CEP de Destino** (opcional): CEP específico para este frete
- **CEP Padrão**: CEP padrão que será usado quando não informado um CEP específico

### 3. Calcular Frete via Correios
Após preencher as dimensões e informar um CEP, clique no botão "Calcular Frete via Correios" para:
- Validar o CEP (deve conter 8 dígitos)
- Calcular os valores de frete baseado nas dimensões
- Preencher automaticamente os campos de Valor SEDEX e Valor PAC

**Como funciona o cálculo:**
1. O sistema recebe as dimensões (A × L × C)
2. A API calcula o volume: (altura + largura + comprimento) × 5
3. Aplica taxas específicas para SEDEX e PAC
4. Retorna os valores em Real (R$)

### 4. Editar Tabela de Frete
Clique no botão "Editar" em qualquer linha da tabela para modificar os valores. Todos os campos podem ser atualizados.

### 5. Deletar Tabela de Frete
Clique no botão "Deletar" em qualquer linha da tabela. Um aviso de confirmação aparecerá antes de deletar.

## Integração com Correios

### Configuração Necessária

Para integrar com a API real dos Correios, você precisa:

1. Ter uma conta nos Correios
2. Usar as credenciais do webservice SRO (Serviço de Rastreamento)
3. Atualizar o arquivo `/pages/api/admin/calculate-shipping.ts` com a integração real

### Implementação Atual

A implementação atual usa um cálculo estimado baseado nas dimensões. Para usar a API real dos Correios:

```typescript
// Substitua a função calculateCorreiosShipping() no arquivo:
// /pages/api/admin/calculate-shipping.ts

async function calculateCorreiosShipping(
  cepDestino: string,
  altura: number,
  largura: number,
  comprimento: number
) {
  // Integrar com webservice real dos Correios
  // Exemplos de bibliotecas:
  // - node-correios
  // - correios-api
}
```

## Endpoints de API

### GET `/api/admin/shipping-rates`
Retorna todas as tabelas de frete cadastradas.

**Resposta:**
```json
{
  "rates": [
    {
      "id": "...",
      "quantity": 10,
      "height": 15,
      "width": 20,
      "length": 25,
      "sedexValue": 45.90,
      "pacValue": 23.50,
      "cep": "39400000",
      "destination": "Montes Claros, MG",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### POST `/api/admin/shipping-rates`
Cria uma nova tabela de frete.

**Request:**
```json
{
  "quantity": 10,
  "height": 15,
  "width": 20,
  "length": 25,
  "sedexValue": 45.90,
  "pacValue": 23.50,
  "cep": "39400000",
  "destination": "Montes Claros, MG"
}
```

### PATCH `/api/admin/shipping-rates/[id]`
Atualiza uma tabela de frete existente.

### DELETE `/api/admin/shipping-rates/[id]`
Deleta uma tabela de frete.

### POST `/api/admin/calculate-shipping`
Calcula os valores de frete baseado nas dimensões e CEP.

**Request:**
```json
{
  "height": 15,
  "width": 20,
  "length": 25,
  "cep": "39400000"
}
```

**Resposta:**
```json
{
  "sedex": 45.90,
  "pac": 23.50,
  "cep": "39400000"
}
```

## Restrições de Acesso

- Apenas usuários com role `ADMIN` podem acessar essa página
- Todas as operações requerem autenticação via token Bearer

## Modelagem de Dados (MongoDB)

```prisma
model ShippingRate {
  id           String   @id @map("_id") @default(auto()) @db.ObjectId
  quantity     Int      // Quantidade de peças
  height       Float    // Altura em cm
  width        Float    // Largura em cm
  length       Float    // Comprimento em cm
  sedexValue   Float    @default(0) // Valor do frete SEDEX em R$
  pacValue     Float    @default(0) // Valor do frete PAC em R$
  cep          String?  // CEP de destino
  destination  String?  // Descrição do destino
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

## Próximos Passos

1. **Integração com API Real dos Correios**: Implementar chamadas reais à API do webservice dos Correios
2. **Validação de Dimensões**: Adicionar validações para dimensões mínimas e máximas
3. **Histórico de Cálculos**: Manter registro de cálculos realizados
4. **Importação em Massa**: Permitir importação de tabelas via CSV
5. **Regionalização**: Suportar diferentes taxas por região
