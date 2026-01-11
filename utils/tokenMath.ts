
import { Scenario, RoiPoint, AppState, TokenStats, ChartDataPoint, Timeframe } from '../types';

/**
 * Calcula o Preço atual baseado nas reservas
 */
export const calculatePriceFromReserves = (liquidityUSD: number, tokensInPool: number): number => {
  if (tokensInPool <= 0) return 0;
  return liquidityUSD / tokensInPool;
};

/**
 * MOTOR DE SIMULAÇÃO ROI SNIPER V4.0 (AMM + SUSTAINABILITY LINE)
 * Executa 4 ciclos semanais por mês
 */
export const calculateRoiSimulation = (
  initialLiquidityUSD: number,
  initialTokensInPool: number,
  monthlyUsers: number,
  averageTicket: number,
  monthlyExternalLiquidityUSD: number,
  monthlyTokenInjection: number = 0
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
    breakEven: initialPrice // A linha amarela começa no preço de lançamento
  });

  scenarios.forEach(s => {
    let currentY = Math.max(initialLiquidityUSD, 1);
    let currentX = Math.max(initialTokensInPool, 1);
    let currentK = currentY * currentX;
    const mult = scenarioMultipliers[s];

    for (let m = 1; m <= months; m++) {
      // Loop Semanal (Precisão sniper)
      for (let w = 1; w <= 4; w++) {
        // 1. BUY PRESSURE (Swap)
        const weeklyVolume = ((monthlyUsers * averageTicket) / 4) * mult;
        currentY += weeklyVolume;
        currentX = currentK / currentY;

        // 2. DEV STRATEGY (USD Injection)
        const weeklyUsdInj = (monthlyExternalLiquidityUSD / 4);
        currentY += weeklyUsdInj;

        // 3. DILUTION (Token Injection)
        const weeklyTokenInj = (monthlyTokenInjection / 4);
        currentX += weeklyTokenInj;

        // 4. RECALCULATE CONSTANT K
        currentK = currentY * currentX;
      }

      const monthPrice = currentY / currentX;
      
      if (!results[m]) {
        results[m] = { 
          month: `Mês ${m}`,
          breakEven: initialPrice // Manter sustentabilidade baseada no preço inicial
        } as RoiPoint;
      }
      results[m][s] = monthPrice;
    }
  });

  return results;
};

export const calculateRealisticStats = (
  state: AppState,
  scenario: Scenario,
  timeframe: Timeframe
): { stats: TokenStats; history: ChartDataPoint[] } => {
  const price = calculatePriceFromReserves(state.initialLiquidityUSD, state.initialCirculating * 0.1); 
  
  const stats: TokenStats = {
    price: price,
    marketCap: price * state.totalSupply, 
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
