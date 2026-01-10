
import { Scenario, RoiPoint, AppState, TokenStats, ChartDataPoint, Timeframe } from '../types';

export const calculateRoiSimulation = (
  initialPrice: number,
  initialLiquidity: number,
  monthlyUsers: number,
  averageTicket: number,
  weeklyLiquidityAddUSD: number,
  initialTokens: number,
  weeklyTokenInjection: number
): RoiPoint[] => {
  const months = 12;
  const scenarios = [
    { type: Scenario.Optimistic, mult: 1.8 },
    { type: Scenario.Neutral, mult: 1.0 },
    { type: Scenario.Pessimistic, mult: 0.4 }
  ];

  const results: RoiPoint[] = [];

  // Estados temporários para cada cenário baseado na fórmula x * y = k
  // x = tokens na pool, y = USD na pool
  const states = scenarios.map(s => ({
    type: s.type,
    x: initialTokens,
    y: initialLiquidity,
    mult: s.mult
  }));

  // Ponto inicial (Mês 0)
  results.push({
    month: 'Mês 0',
    [Scenario.Optimistic]: initialPrice,
    [Scenario.Neutral]: initialPrice,
    [Scenario.Pessimistic]: initialPrice,
  });

  for (let m = 1; m <= months; m++) {
    const entry: any = { month: `Mês ${m}` };
    
    states.forEach(state => {
      // 1. Fluxo de capital de usuários (Compras)
      const userFlow = (monthlyUsers * averageTicket) * state.mult;
      
      // Impacto de preço AMM: Usuário deposita USD, retira Tokens
      // x_new = (x * y) / (y + userFlow)
      const tokensBeforeBuy = state.x;
      state.x = (tokensBeforeBuy * state.y) / (state.y + userFlow);
      state.y += userFlow;

      // 2. Injeção Manual de Liquidez (USD e Tokens)
      const manualLiquidityUSD = weeklyLiquidityAddUSD * 4;
      const manualTokenInjection = weeklyTokenInjection * 4;
      
      state.y += manualLiquidityUSD;
      state.x += manualTokenInjection;
      
      // 3. Cálculo do novo preço P = y / x
      const currentPrice = state.y / state.x;
      entry[state.type] = currentPrice;
    });
    
    results.push(entry);
  }

  return results;
};

/**
 * Calcula estatísticas realistas e histórico de tendência para o dashboard principal.
 */
export const calculateRealisticStats = (
  state: AppState,
  scenario: Scenario,
  timeframe: Timeframe
): { stats: TokenStats; history: ChartDataPoint[] } => {
  const scenarioMult = {
    [Scenario.Optimistic]: 1.8,
    [Scenario.Neutral]: 1.0,
    [Scenario.Pessimistic]: 0.4,
  }[scenario];

  const weeks = {
    [Timeframe.Weeks4]: 4,
    [Timeframe.Months3]: 12,
    [Timeframe.Months6]: 24,
  }[timeframe];

  let currentPrice = state.initialPrice;
  let currentLiquidity = state.initialLiquidityUSD;
  let currentCirculating = state.initialCirculating;
  
  // Para manter a consistência AMM no dashboard global
  let poolTokens = currentLiquidity / currentPrice;

  const history: ChartDataPoint[] = [];

  // Estado inicial (Semana 0)
  history.push({
    week: 0,
    price: currentPrice,
    liquidity: currentLiquidity,
    supply: currentCirculating,
    marketCap: currentPrice * currentCirculating,
  });

  for (let w = 1; w <= weeks; w++) {
    const dailyNewUsers = state.newUsersPerDay * scenarioMult;
    const weeklyUserFlow = dailyNewUsers * 7 * state.averageTicket;
    const manualLiqUSD = state.weeklyLiquidityAdd; 

    // Compra AMM
    poolTokens = (poolTokens * currentLiquidity) / (currentLiquidity + weeklyUserFlow);
    currentLiquidity += weeklyUserFlow + manualLiqUSD;
    
    // Atualiza preço
    currentPrice = currentLiquidity / poolTokens;
    
    const weeklyRelease = (state.totalSupply - state.initialCirculating) / 104;
    currentCirculating = Math.min(state.totalSupply, currentCirculating + weeklyRelease);

    history.push({
      week: w,
      price: currentPrice,
      liquidity: currentLiquidity,
      supply: currentCirculating,
      marketCap: currentPrice * currentCirculating,
    });
  }

  const finalMC = currentPrice * currentCirculating;
  const liqToMc = (currentLiquidity / finalMC) * 100;
  
  let riskLevel: TokenStats['riskLevel'] = 'Médio';
  if (liqToMc < 5 || state.distTeam > 30) riskLevel = 'Crítico';
  else if (liqToMc < 10 || state.distTeam > 20) riskLevel = 'Alto';
  else if (liqToMc > 20 && state.distTeam < 15) riskLevel = 'Baixo';

  const stats: TokenStats = {
    price: currentPrice,
    marketCap: finalMC,
    liquidity: currentLiquidity,
    circulatingSupply: currentCirculating,
    totalSupply: state.totalSupply,
    teamPercentage: state.distTeam,
    burnPercentage: (state.burnAmount / state.totalSupply) * 100,
    userCount: state.currentUsers + Math.floor((state.newUsersPerDay * scenarioMult) * weeks * 7),
    riskLevel,
    liquidityToMcRatio: liqToMc,
  };

  return { stats, history };
};
