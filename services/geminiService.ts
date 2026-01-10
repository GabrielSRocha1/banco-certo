
import { GoogleGenAI, Type } from "@google/genai";
import { TokenStats, Scenario } from "../types";

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const getAIAnalysis = async (stats: TokenStats, scenario: Scenario, retries = 2): Promise<any> => {
  // Garantia de acesso à chave via process.env injetado ou polyfill
  const apiKey = (window as any).process?.env?.API_KEY || process.env.API_KEY;

  if (!apiKey) {
    return { 
      error: "missing_key", 
      situacao: "Chave de API não configurada no ambiente." 
    };
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `
    Atue como um Arquiteto de Dashboards e Gestor de Tokenomics.
    Analise os seguintes dados do token:
    - Preço: $${stats.price.toFixed(4)}
    - Market Cap: $${stats.marketCap.toLocaleString()}
    - Liquidez: $${stats.liquidity.toLocaleString()}
    - Circulação: ${stats.circulatingSupply.toLocaleString()} tokens
    - Relação Liquidez/Market Cap: ${stats.liquidityToMcRatio.toFixed(2)}%
    - % do Time: ${stats.teamPercentage}%
    - Usuários: ${stats.userCount}
    - Cenário Selecionado: ${scenario}

    Forneça uma análise em Português estruturada em JSON:
    1. situacao: Resumo curto da saúde atual.
    2. pontosFortes: Lista de 2 pontos.
    3. pontosFracos: Lista de 2 pontos (identifique riscos reais).
    4. recomendacoes: O que o gestor deve fazer agora?
    5. alertaRealismo: Se os números parecem irreais (ex: preço alto com pouca liquidez), explique porquê.

    Linguagem simples para iniciantes.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            situacao: { type: Type.STRING },
            pontosFortes: { type: Type.ARRAY, items: { type: Type.STRING } },
            pontosFracos: { type: Type.ARRAY, items: { type: Type.STRING } },
            recomendacoes: { type: Type.ARRAY, items: { type: Type.STRING } },
            alertaRealismo: { type: Type.STRING },
          },
          required: ["situacao", "pontosFortes", "pontosFracos", "recomendacoes", "alertaRealismo"]
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error: any) {
    const isQuotaError = error?.status === 429 || 
                        error?.message?.includes('429') || 
                        error?.message?.includes('RESOURCE_EXHAUSTED');

    if (retries > 0 && isQuotaError) {
      await delay(2000 * (3 - retries));
      return getAIAnalysis(stats, scenario, retries - 1);
    }

    console.error("Erro na análise da IA:", error);
    
    if (isQuotaError) {
      return { 
        error: "quota_exceeded", 
        situacao: "IA temporariamente indisponível (Limite de Quota atingido)." 
      };
    }

    return { 
      error: "generic_error", 
      situacao: "Não foi possível gerar o insight da IA no momento." 
    };
  }
};
