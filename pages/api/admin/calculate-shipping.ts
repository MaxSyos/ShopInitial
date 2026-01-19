import { NextApiRequest, NextApiResponse } from 'next';
import { getUserFromRequest } from '../_utils/auth';

// Integração com API dos Correios - SRO (Webservice)
// API: https://www.correios.com.br/
async function calculateCorreiosShipping(
  cepDestino: string,
  altura: number,
  largura: number,
  comprimento: number,
  peso: number
) {
  try {
    // Validação básica do CEP
    const cleanCep = cepDestino.replace(/\D/g, '');
    if (cleanCep.length !== 8) {
      throw new Error('CEP inválido. Deve conter 8 dígitos.');
    }

    // Para integração real com Correios, você pode usar:
    // 1. Webservice SOAP dos Correios (implementação mais complexa)
    // 2. API REST não-oficial (cuidado com termos de serviço)
    // 3. Integração via package npm como "node-correios"

    // Atualmente, usando uma integração simulada que segue a lógica dos Correios
    // Usando peso fornecido pelo usuário em vez de calcular do volume
    const pesoFinal = Math.max(0.3, peso); // Peso mínimo 0.3kg

    // Fazer requisição para API dos Correios
    // Nota: A API real dos Correios requer autenticação e configuração específica
    // Para exemplo, estamos usando valores baseados em tabelas de preço padrão

    // Simulação de consulta - para implementação real, integre com API dos Correios
    const sedex = Math.round((pesoFinal * 50 + 15) * 100) / 100; // Taxa base + percentual
    const pac = Math.round((pesoFinal * 25 + 10) * 100) / 100;   // Taxa base + percentual

    return {
      sedex,
      pac,
      cep: cleanCep,
      height: altura,
      width: largura,
      length: comprimento,
      weight: pesoFinal,
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
    const { height, width, length, weight, cep } = req.body;

    if (!height || !width || !length || !weight || !cep) {
      return res.status(400).json({ error: 'Parâmetros obrigatórios não informados: height, width, length, weight, cep' });
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
