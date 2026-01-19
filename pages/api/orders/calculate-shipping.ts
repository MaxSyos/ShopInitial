import { NextApiRequest, NextApiResponse } from 'next';
import { getUserFromRequest } from '../_utils/auth';
import prisma from '../../../lib/prisma';

const DEFAULT_CEP = '39400115';
const RESTRICTED_CEP_START = 39400000;
const RESTRICTED_CEP_END = 39409999;

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

interface DistanceClass {
  class: 'R1' | 'R2' | 'R3' | 'R4' | 'R5';
  minRadius: number;
  maxRadius: number;
}

interface ShippingRates {
  taxaBase: number;
  custoPorKg: number;
}

interface ShippingCalculationInput {
  pesoReal: number; // em kg
  comprimento: number; // em cm
  largura: number; // em cm
  altura: number; // em cm
  raioKm: number; // distância em km
}

interface ShippingCalculationOutput {
  sedex: number | null;
  pac: number | null;
  error?: string;
  debug?: {
    pesoCubico: number;
    pesoBase: number;
    distanceClass: string;
    ajusteSedex: number;
    ajustePac: number;
    ajusteAltura: number;
  };
}

// ============================================================================
// CONSTANTES DE PREÇO E DISTÂNCIA
// ============================================================================

// Limites de peso máximo
const SEDEX_MAX_KG = 10;
const PAC_MAX_KG = 30;

// Classificação de distância em km
const DISTANCE_CLASSES: Record<string, DistanceClass> = {
  R1: { class: 'R1', minRadius: 0, maxRadius: 150 },
  R2: { class: 'R2', minRadius: 150, maxRadius: 400 },
  R3: { class: 'R3', minRadius: 400, maxRadius: 800 },
  R4: { class: 'R4', minRadius: 800, maxRadius: 1300 },
  R5: { class: 'R5', minRadius: 1300, maxRadius: Infinity },
};

// Taxas base (em R$) para SEDEX por classe de distância
const SEDEX_TAXA_BASE: Record<string, number> = {
  R1: 28.5,
  R2: 34.0,
  R3: 45.0,
  R4: 60.0,
  R5: 68.0,
};

// Custo por kg (em R$) para SEDEX
const SEDEX_CUSTO_POR_KG: Record<string, number> = {
  R1: 3.2,
  R2: 4.8,
  R3: 6.8,
  R4: 9.5,
  R5: 11.2,
};

// Taxas base (em R$) para PAC por classe de distância
const PAC_TAXA_BASE: Record<string, number> = {
  R1: 18.0,
  R2: 22.0,
  R3: 30.0,
  R4: 38.0,
  R5: 45.0,
};

// Custo por kg (em R$) para PAC
const PAC_CUSTO_POR_KG: Record<string, number> = {
  R1: 2.2,
  R2: 3.2,
  R3: 4.5,
  R4: 6.2,
  R5: 7.8,
};

// ============================================================================
// FUNÇÕES PURAS DE CÁLCULO
// ============================================================================

/**
 * Calcula o peso cúbico baseado nas dimensões
 * Fórmula: pesoCubico = (comprimento × largura × altura) / 6000
 *
 * @param comprimento - comprimento em cm
 * @param largura - largura em cm
 * @param altura - altura em cm
 * @returns peso cúbico em kg
 */
function calcularPesoCubico(
  comprimento: number,
  largura: number,
  altura: number
): number {
  return (comprimento * largura * altura) / 6000;
}

/**
 * Calcula o peso base (máximo entre peso real e peso cúbico)
 *
 * @param pesoReal - peso real em kg
 * @param pesoCubico - peso cúbico em kg
 * @returns peso base em kg
 */
function calcularPesoBase(pesoReal: number, pesoCubico: number): number {
  return Math.max(pesoReal, pesoCubico);
}

/**
 * Determina a classe de distância baseado no raio em km
 *
 * @param raioKm - raio em km
 * @returns classe de distância (R1-R5)
 */
function determinarClasseDistancia(raioKm: number): string {
  for (const key of Object.keys(DISTANCE_CLASSES)) {
    const range = DISTANCE_CLASSES[key];
    if (raioKm >= range.minRadius && raioKm < range.maxRadius) {
      return key;
    }
  }
  // Se não se enquadrar em nenhuma, retorna R5 (a mais distante)
  return 'R5';
}

/**
 * Calcula o ajuste por faixa de peso para SEDEX
 * Faixas:
 * ≤ 2 kg      → +0
 * 3 – 4 kg    → +8
 * 5 – 6 kg    → +18
 * 7 – 8 kg    → +25
 * 9 – 10 kg   → +18
 *
 * @param pesoBase - peso base em kg
 * @returns ajuste em R$
 */
function calcularAjusteSedex(pesoBase: number): number {
  if (pesoBase <= 2) {
    return 0;
  } else if (pesoBase <= 4) {
    return 8;
  } else if (pesoBase <= 6) {
    return 18;
  } else if (pesoBase <= 8) {
    return 25;
  } else if (pesoBase <= 10) {
    return 18;
  }
  // Para pesos acima de 10kg, aplicar interpolação linear
  // ou considerar como faixa aberta
  return 18;
}

/**
 * Calcula o ajuste por faixa de peso para PAC
 * Faixas:
 * ≤ 3 kg     → +0
 * 4 – 6 kg   → +6
 * 7 – 10 kg  → +12
 *
 * @param pesoBase - peso base em kg
 * @returns ajuste em R$
 */
function calcularAjustePac(pesoBase: number): number {
  if (pesoBase <= 3) {
    return 0;
  } else if (pesoBase <= 6) {
    return 6;
  } else if (pesoBase <= 10) {
    return 12;
  }
  // Para pesos acima de 10kg
  return 12;
}

/**
 * Calcula o ajuste por altura do pacote
 * Faixas:
 * ≤ 20 cm    → +8.00
 * > 20 cm    → +14.00
 *
 * @param altura - altura em cm
 * @returns ajuste em R$
 */
function calcularAjusteAltura(altura: number): number {
  if (altura <= 23) {
    return 8.0;
  } else {
    return 14.0;
  }
}

/**
 * Calcula o valor do SEDEX baseado na classe de distância e peso
 * Fórmula: valorSedex = taxaBase + (pesoBase × custoPorKg) + ajusteFaixa + ajusteAltura
 *
 * @param pesoBase - peso base em kg
 * @param classeDistancia - classe de distância (R1-R5)
 * @param altura - altura em cm
 * @returns valor do SEDEX em R$
 */
function calcularSedex(pesoBase: number, classeDistancia: string, altura: number): number {
  const taxaBase = SEDEX_TAXA_BASE[classeDistancia] || SEDEX_TAXA_BASE.R5;
  const custoPorKg = SEDEX_CUSTO_POR_KG[classeDistancia] || SEDEX_CUSTO_POR_KG.R5;
  const ajustePeso = calcularAjusteSedex(pesoBase);
  const ajusteAlt = calcularAjusteAltura(altura);

  const valor = taxaBase + (pesoBase * custoPorKg) + ajustePeso + ajusteAlt;

  return valor;
}

/**
 * Calcula o valor do PAC baseado na classe de distância e peso
 * Fórmula: valorPac = taxaBase + (pesoBase × custoPorKg) + ajusteFaixa + ajusteAltura
 *
 * @param pesoBase - peso base em kg
 * @param classeDistancia - classe de distância (R1-R5)
 * @param altura - altura em cm
 * @returns valor do PAC em R$
 */
function calcularPac(pesoBase: number, classeDistancia: string, altura: number): number {
  const taxaBase = PAC_TAXA_BASE[classeDistancia] || PAC_TAXA_BASE.R5;
  const custoPorKg = PAC_CUSTO_POR_KG[classeDistancia] || PAC_CUSTO_POR_KG.R5;
  const ajustePeso = calcularAjustePac(pesoBase);
  const ajusteAlt = calcularAjusteAltura(altura);

  const valor = taxaBase + (pesoBase * custoPorKg) + ajustePeso + ajusteAlt;

  return valor;
}

/**
 * Aplica o acréscimo de 20% e arredonda para 2 casas decimais
 *
 * @param valor - valor em R$
 * @returns valor com acréscimo de 20% e arredondado
 */
function aplicarAcrescimoFinal(valor: number): number {
  const valorComAcrescimo = valor * 1.2;
  return Math.round(valorComAcrescimo * 100) / 100;
}

/**
 * Função principal de cálculo de frete estimado para SEDEX e PAC
 *
 * @param input - dados de entrada com dimensões, peso e distância
 * @param debug - se true, retorna informações de debug
 * @returns objeto com valores de SEDEX e PAC calculados
 */
function calcularFreteEstimado(
  input: ShippingCalculationInput,
  debug: boolean = false
): ShippingCalculationOutput {
  // Validação de entrada
  if (input.pesoReal < 0 || input.comprimento < 0 || input.largura < 0 || input.altura < 0) {
    throw new Error('Valores de peso e dimensões devem ser positivos');
  }

  if (input.raioKm < 0) {
    throw new Error('Raio de distância não pode ser negativo');
  }

  // Cálculo do peso cúbico
  const pesoCubico = calcularPesoCubico(
    input.comprimento,
    input.largura,
    input.altura
  );

  // Cálculo do peso base
  const pesoBase = calcularPesoBase(input.pesoReal, pesoCubico);

  // Determinação da classe de distância (usada para ambos os cálculos)
  const classeDistancia = determinarClasseDistancia(input.raioKm);

  // Validação de limites de peso
  let sedex: number | null = null;
  let pac: number | null = null;
  let error: string | undefined = undefined;

  // Verificar limite SEDEX (máximo 10kg)
  if (pesoBase > SEDEX_MAX_KG) {
    error = `SEDEX não disponível: peso (${pesoBase.toFixed(2)}kg) ultrapassa o limite máximo de ${SEDEX_MAX_KG}kg`;
    sedex = null;
  } else {
    // Cálculo SEDEX
    const sedexSemAcrescimo = calcularSedex(pesoBase, classeDistancia, input.altura);
    sedex = aplicarAcrescimoFinal(sedexSemAcrescimo);
  }

  // Verificar limite PAC (máximo 30kg)
  if (pesoBase > PAC_MAX_KG) {
    if (error) {
      error += `; PAC não disponível: peso (${pesoBase.toFixed(2)}kg) ultrapassa o limite máximo de ${PAC_MAX_KG}kg`;
    } else {
      error = `PAC não disponível: peso (${pesoBase.toFixed(2)}kg) ultrapassa o limite máximo de ${PAC_MAX_KG}kg`;
    }
    pac = null;
  } else {
    // Cálculo PAC
    const pacSemAcrescimo = calcularPac(pesoBase, classeDistancia, input.altura);
    pac = aplicarAcrescimoFinal(pacSemAcrescimo);
  }

  const result: ShippingCalculationOutput = {
    sedex,
    pac,
  };

  // Adicionar erro se houver
  if (error) {
    result.error = error;
  }

  // Se debug ativado, adicionar informações de cálculo
  if (debug) {
    result.debug = {
      pesoCubico: Math.round(pesoCubico * 100) / 100,
      pesoBase: Math.round(pesoBase * 100) / 100,
      distanceClass: classeDistancia,
      ajusteSedex: calcularAjusteSedex(pesoBase),
      ajustePac: calcularAjustePac(pesoBase),
      ajusteAltura: calcularAjusteAltura(input.altura),
    };
  }

  return result;
}

// ============================================================================
// FUNÇÃO LEGADA PARA COMPATIBILIDADE COM BANCO DE DADOS
// ============================================================================

// Função para calcular frete de um pedido
// Baseado na quantidade de peças e CEP de destino
async function calculateOrderShipping(
  quantity: number,
  cepDestino: string
) {
  try {
    // Validar CEP
    const cleanCep = cepDestino.replace(/\D/g, '');
    if (cleanCep.length !== 8) {
      throw new Error('CEP inválido');
    }

    // Verificar se está na faixa restrita
    const cepNumber = parseInt(cleanCep, 10);
    if (cepNumber >= RESTRICTED_CEP_START && cepNumber <= RESTRICTED_CEP_END) {
      // Retorna null se estiver na faixa restrita
      return null;
    }

    // Buscar a tabela de frete apropriada para a quantidade
    // Encontra a primeira taxa onde quantityUpTo >= quantidade do pedido
    const shippingRates = await prisma.shippingRate.findMany({
      orderBy: {
        quantityUpTo: 'asc', // Ordena pela quantidade até
      },
    });

    // Encontra a primeira taxa onde quantityUpTo >= quantidade do pedido
    let shippingRate = shippingRates.find((rate: any) => rate.quantityUpTo >= quantity);

    // Se não encontrar nenhuma taxa, usar um cálculo padrão baseado no novo motor
    if (!shippingRate) {
      // Cálculo padrão: assume 0.5kg por item, 10cm cúbicos, 100km de distância
      const defaultWeight = quantity * 0.5;
      const calc = calcularFreteEstimado({
        pesoReal: defaultWeight,
        comprimento: 10,
        largura: 10,
        altura: 10,
        raioKm: 100,
      });

      return {
        sedex: calc.sedex,
        pac: calc.pac,
        cep: cleanCep,
        quantity,
        quantityUpTo: quantity,
        height: 10,
        width: 10,
        length: 10,
        weight: defaultWeight,
        shippingRateId: null,
        isDefault: true, // Indicar que é cálculo padrão
      };
    }

    // Calcular frete usando o novo motor
    // Valida se o peso existe
    if (!shippingRate.weight || shippingRate.weight <= 0) {
      throw new Error('Faixa de frete inválida: peso não definido');
    }

    // Assumir distância média (R3 = 600km)
    const calc = calcularFreteEstimado({
      pesoReal: shippingRate.weight,
      comprimento: shippingRate.length || 10,
      largura: shippingRate.width || 10,
      altura: shippingRate.height || 10,
      raioKm: 600,
    });

    return {
      sedex: calc.sedex,
      pac: calc.pac,
      cep: cleanCep,
      quantity,
      quantityUpTo: shippingRate.quantityUpTo,
      height: shippingRate.height,
      width: shippingRate.width,
      length: shippingRate.length,
      weight: shippingRate.weight,
      shippingRateId: shippingRate.id,
      isDefault: false,
    };
  } catch (error: any) {
    throw new Error(error.message || 'Erro ao calcular frete do pedido');
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getUserFromRequest(req);
  
  if (!user) {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { 
      // Modo legado (compatibilidade)
      quantity, 
      cep,
      // Novo modo com cálculo detalhado
      pesoReal,
      comprimento,
      largura,
      altura,
      raioKm,
      debug
    } = req.body;

    // Se usar modo novo com todos os parâmetros
    if (pesoReal !== undefined && comprimento !== undefined && largura !== undefined && altura !== undefined && raioKm !== undefined) {
      try {
        const result = calcularFreteEstimado({
          pesoReal: parseFloat(pesoReal),
          comprimento: parseFloat(comprimento),
          largura: parseFloat(largura),
          altura: parseFloat(altura),
          raioKm: parseFloat(raioKm),
        }, debug === true);

        return res.status(200).json(result);
      } catch (error: any) {
        console.error('Erro ao calcular frete estimado:', error);
        return res.status(400).json({ error: error.message || 'Erro ao calcular frete' });
      }
    }

    // Modo legado (quantidade e CEP)
    if (!quantity || !cep) {
      return res.status(400).json({
        error: 'Forneça (quantity + cep) para modo legado ou (pesoReal + comprimento + largura + altura + raioKm) para modo estimado',
      });
    }

    const result = await calculateOrderShipping(parseInt(quantity), cep);

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Erro ao calcular frete do pedido:', error);
    return res.status(400).json({ error: error.message || 'Erro ao calcular frete' });
  }
}
