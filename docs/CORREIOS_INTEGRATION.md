# Integração com API dos Correios - Guia de Implementação

## Visão Geral

A página de gerenciamento de valor de envio (`/manage-shipping-rates`) atualmente usa um cálculo estimado. Para integrar com a API real dos Correios, siga este guia.

## Opções de Integração

### 1. Webservice SRO dos Correios (Recomendado)

O Webservice SRO (Serviço de Rastreamento) dos Correios fornece cálculo de frete em tempo real.

#### Requisitos:
- Conta nos Correios
- Credenciais: `usuário_correios` e `senha_correios`
- Contrato ativo com a Empresa Brasileira de Correios e Telégrafos

#### Passos de Implementação:

1. **Obter Credenciais:**
   - Acesse [Meu Correios](https://www2.correios.com.br/apps/meu-correios)
   - Registre-se ou faça login
   - Solicite acesso ao Webservice

2. **Instalar Dependências:**
   ```bash
   npm install node-correios
   # ou
   yarn add node-correios
   ```

3. **Atualizar o arquivo `/pages/api/admin/calculate-shipping.ts`:**

   ```typescript
   import { NextApiRequest, NextApiResponse } from 'next';
   import { getUserFromRequest } from '../_utils/auth';
   import { Correios } from 'node-correios';

   async function calculateCorreiosShipping(
     cepDestino: string,
     altura: number,
     largura: number,
     comprimento: number,
     peso: number = 1 // peso em kg (padrão 1kg)
   ) {
     try {
       const correios = new Correios();
       
       const usuario = process.env.CORREIOS_USER;
       const senha = process.env.CORREIOS_PASSWORD;
       const codAdministrativo = process.env.CORREIOS_ADMIN_CODE;
       const senha_maximo = process.env.CORREIOS_SENHA_MAXIMO;

       if (!usuario || !senha || !codAdministrativo) {
         throw new Error('Credenciais dos Correios não configuradas');
       }

       const resultado = await correios.calcPreco({
         usuario,
         senha,
         codAdministrativo,
         senha_maximo,
         formato: '2', // 2 = caixa
         tipoPostal: ['04162', '04014'], // 04162 = PAC, 04014 = SEDEX
         peso,
         cepDestino: cepDestino.replace(/\D/g, ''),
         cepOrigem: process.env.CORREIOS_CEP_ORIGEM || '39404000',
         altura,
         largura,
         comprimento,
         mcu: 'g', // unidade de comprimento: cm
       });

       const sedex = resultado.find((r: any) => r.codigo === '04014');
       const pac = resultado.find((r: any) => r.codigo === '04162');

       return {
         sedex: sedex ? parseFloat(sedex.valor) : 0,
         pac: pac ? parseFloat(pac.valor) : 0,
         cep: cepDestino.replace(/\D/g, ''),
       };
     } catch (error: any) {
       throw new Error(error.message || 'Erro ao calcular frete');
     }
   }

   export default async function handler(req: NextApiRequest, res: NextApiResponse) {
     const user = await getUserFromRequest(req);
     
     if (!user || user.role !== 'ADMIN') {
       return res.status(401).json({ error: 'Não autorizado' });
     }

     if (req.method !== 'POST') {
       return res.status(405).json({ error: 'Método não permitido' });
     }

     try {
       const { height, width, length, cep, weight = 1 } = req.body;

       if (!height || !width || !length || !cep) {
         return res.status(400).json({ error: 'Parâmetros obrigatórios não informados' });
       }

       const result = await calculateCorreiosShipping(
         cep,
         parseFloat(height),
         parseFloat(width),
         parseFloat(length),
         parseFloat(weight)
       );

       return res.status(200).json(result);
     } catch (error: any) {
       console.error('Erro ao calcular frete:', error);
       return res.status(400).json({ error: error.message || 'Erro ao calcular frete' });
     }
   }
   ```

4. **Adicionar Variáveis de Ambiente:**

   No arquivo `.env.local`:
   ```env
   CORREIOS_USER=seu_usuario_correios
   CORREIOS_PASSWORD=sua_senha_correios
   CORREIOS_ADMIN_CODE=seu_codigo_administrativo
   CORREIOS_SENHA_MAXIMO=sua_senha_maximo
   CORREIOS_CEP_ORIGEM=39404000
   ```

5. **Atualizar a Página (opcional):**

   Você pode adicionar um campo de peso na página se precisar ser mais preciso:

   ```typescript
   <div>
     <label className="block text-sm font-medium mb-1">Peso (kg)</label>
     <input
       type="number"
       min="0"
       step="0.1"
       value={newRate.weight || '1'}
       onChange={(e) => setNewRate({ ...newRate, weight: parseFloat(e.target.value) || 1 })}
       className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white"
       placeholder="Ex: 1"
     />
   </div>
   ```

### 2. Alternativa: API REST dos Correios

Os Correios também oferecem uma API REST (mais recente). Para usar:

1. **Dependências:**
   ```bash
   npm install axios
   ```

2. **Implementação:**
   ```typescript
   async function calculateCorreiosShipping(...) {
     const response = await axios.post(
       'https://api.correios.com.br/shipping/v1/price',
       {
         services: ['04014', '04162'], // SEDEX e PAC
         zipcode: cepDestino,
         ...
       },
       {
         headers: {
           'Authorization': `Bearer ${process.env.CORREIOS_API_TOKEN}`
         }
       }
     );
     // processar resposta
   }
   ```

## Tratamento de Erros

A implementação deve tratar:

- **CEP inválido**: "CEP não encontrado"
- **Credenciais inválidas**: "Acesso negado às credenciais dos Correios"
- **Serviço indisponível**: "Serviço dos Correios temporariamente indisponível"
- **Dimensões fora do limite**: "Dimensões excedem os limites permitidos"

## Testes

Para testar a integração:

```bash
# 1. Adicionar endpoint de teste em /pages/api/admin/test-shipping.ts
# 2. Executar: curl http://localhost:3000/api/admin/test-shipping
# 3. Verificar logs no console do servidor
```

## Documentação Oficial

- [Webservice dos Correios](https://www.correios.com.br/negocio/integracao)
- [Node Correios - GitHub](https://github.com/xmorales/node-correios)
- [API REST dos Correios](https://developer.correios.com.br)

## Suporte e Troubleshooting

- **Erro "Credenciais inválidas"**: Verifique as variáveis de ambiente
- **CEP não encontrado**: O CEP pode não ser válido ou estar fora de cobertura
- **Timeout**: A API dos Correios pode estar lenta; implemente retry com backoff exponencial

## Próximos Passos

1. ✅ Testar com CEPs reais
2. ✅ Implementar cache de resultados
3. ✅ Adicionar logging de tentativas de cálculo
4. ✅ Implementar fallback para valores estimados se a API falhar
