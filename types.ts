
export enum Scenario {
  Pessimistic = 'Pessimista',
  Neutral = 'Neutro',
  Optimistic = 'Otimista'
}

export enum Timeframe {
  Weeks4 = 'Últimas 4 semanas',
  Months3 = 'Últimos 3 meses',
  Months6 = 'Últimos 6 meses'
}

export interface AppState {
  baseCurrency: string;
  initialPrice: number;
  totalSupply: number;
  initialCirculating: number;
  initialLiquidityUSD: number;
  distTeam: number;
  distLiquidity: number;
  distMarketing: number;
  distReserve: number;
  distVesting: number;
  currentUsers: number;
  newUsersPerDay: number;
  averageTicket: number;
  burnAmount: number;
  weeklyLiquidityAdd: number;
}

export interface TokenStats {
  price: number;
  marketCap: number;
  liquidity: number;
  circulatingSupply: number;
  totalSupply: number;
  teamPercentage: number;
  burnPercentage: number;
  userCount: number;
  riskLevel: 'Baixo' | 'Médio' | 'Alto' | 'Crítico';
  liquidityToMcRatio: number;
}

export interface ChartDataPoint {
  week: number;
  price: number;
  liquidity: number;
  supply: number;
  marketCap: number;
}

export interface RoiPoint {
  month: string;
  [Scenario.Optimistic]: number;
  [Scenario.Neutral]: number;
  [Scenario.Pessimistic]: number;
  breakEven: number; // Linha Amarela - Ponto de Equilíbrio
}
