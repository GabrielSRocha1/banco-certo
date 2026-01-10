
import { GoogleGenAI, Type } from "@google/genai";
import { TokenStats, Scenario } from "../types";

export const getAIAnalysis = async (stats: TokenStats, scenario: Scenario) => {
  // Always initialize right before use as per guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
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

    // response.text is a property, not a method.
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Erro na análise da IA:", error);
    return null;
  }
};
