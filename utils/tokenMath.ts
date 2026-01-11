
import { Scenario, RoiPoint, AppState, TokenStats, ChartDataPoint, Timeframe } from '../types';

/**
 * Calcula a Constante K de uma pool
 */
export const calculateConstantK = (liquidityUSD: number, tokensInPool: number): number => {
  return Math.max(liquidityUSD, 0.001) * Math.max(tokensInPool, 0.001);
};

/**
 * Calcula o Preço atual baseado nas reservas
 */
export const calculatePriceFromReserves = (liquidityUSD: number, tokensInPool: number): number => {
  if (tokensInPool <= 0) return 0;
  return liquidityUSD / tokensInPool;
};

/**
 * MOTOR DE SIMULAÇÃO ROI SNIPER (AMM V2 DINÂMICO)
 * Ordem por Semana: 1. Swap (Compradores) -> 2. Injeção (Add Liquidity) -> 3. Recalcular K
 */
export const calculateRoiSimulation = (
  initialLiquidityUSD: number,
  initialTokensInPool: number,
  monthlyUsers: number,
  averageTicket: number,
  monthlyExternalLiquidityUSD: number,
  monthlyTokenInjection: number = 0 // Novo campo de injeção de tokens
): RoiPoint[] => {
  const months = 12;
  const scenarios = [Scenario.Optimistic, Scenario.Neutral, Scenario.Pessimistic];
  
  const scenarioMultipliers = {
    [Scenario.Optimistic]: 1.5,
    [Scenario.Neutral]: 1.0,
    [Scenario.Pessimistic]: 0.5
  };

  const results: RoiPoint[] = [];

  // Ponto inicial
  const initialPrice = calculatePriceFromReserves(initialLiquidityUSD, initialTokensInPool);
  results.push({
    month: 'Início',
    [Scenario.Optimistic]: initialPrice,
    [Scenario.Neutral]: initialPrice,
    [Scenario.Pessimistic]: initialPrice,
  });

  // Simulamos cada cenário de forma independente para garantir precisão
  scenarios.forEach(s => {
    let currentY = Math.max(initialLiquidityUSD, 1);
    let currentX = Math.max(initialTokensInPool, 1);
    let currentK = currentY * currentX;
    const mult = scenarioMultipliers[s];

    // Simulação mês a mês
    for (let m = 1; m <= months; m++) {
      // Loop Semanal (4 semanas por mês)
      for (let w = 1; w <= 4; w++) {
        // FASE A: ENTRADA DE MERCADO (SWAP)
        const weeklyVolume = ((monthlyUsers * averageTicket) / 4) * mult;
        
        // y_new = y + inflow
        // x_new = k / y_new
        currentY += weeklyVolume;
        currentX = currentK / currentY;

        // FASE B: INJEÇÃO DO DEV (ADD LIQUIDITY)
        const weeklyUsdInj = (monthlyExternalLiquidityUSD / 4);
        const weeklyTokenInj = (monthlyTokenInjection / 4);

        currentY += weeklyUsdInj;
        currentX += weeklyTokenInj;

        // RECALCULAR K (Expansão da Pool)
        currentK = currentY * currentX;
      }

      // Registro do preço final do mês para o gráfico
      const monthPrice = currentY / currentX;
      
      if (!results[m]) {
        results[m] = { month: `Mês ${m}` } as RoiPoint;
      }
      results[m][s] = monthPrice;
    }
  });

  return results;
};

/**
 * Calcula estatísticas para o dashboard principal
 */
export const calculateRealisticStats = (
  state: AppState,
  scenario: Scenario,
  timeframe: Timeframe
): { stats: TokenStats; history: ChartDataPoint[] } => {
  const price = calculatePriceFromReserves(state.initialLiquidityUSD, state.initialCirculating * 0.1); 
  
  const stats: TokenStats = {
    price: price,
    marketCap: price * state.totalSupply, // FDV Real
    liquidity: state.initialLiquidityUSD,
    circulatingSupply: state.initialCirculating,
    totalSupply: state.totalSupply,
    teamPercentage: state.distTeam,
    burnPercentage: (state.burnAmount / state.totalSupply) * 100,
    userCount: state.currentUsers,
    riskLevel: 'Médio',
    liquidityToMcRatio: (state.initialLiquidityUSD / (price * state.totalSupply)) * 100,
  };

  return { stats, history: [] };
};
