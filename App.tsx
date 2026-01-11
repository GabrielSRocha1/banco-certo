
import React, { useState, useMemo, useEffect } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend
} from 'recharts';
import { Scenario, Timeframe, AppState } from './types';
import { calculateRealisticStats, calculateRoiSimulation, calculatePriceFromReserves } from './utils/tokenMath';
import { getAIAnalysis } from './services/geminiService';
import KPICard from './components/KPICard';

const formatUSD = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 4,
  }).format(value).replace('$', '$ ');
};

const formatNumberWithPoints = (value: number, isCurrency: boolean = false) => {
  if (isNaN(value)) return isCurrency ? '$ 0' : '0';
  const formatted = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: isCurrency ? 2 : 0,
    maximumFractionDigits: isCurrency ? 2 : 0,
  }).format(value);
  return isCurrency ? `$ ${formatted}` : formatted;
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState(10); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // App Global State
  const [state] = useState<AppState>({
    baseCurrency: 'USD',
    initialPrice: 0.10,
    totalSupply: 2000000000, // Ajustado para 2B conforme solicitado
    initialCirculating: 20000000,
    initialLiquidityUSD: 100000,
    distTeam: 15,
    distLiquidity: 40,
    distMarketing: 20,
    distReserve: 15,
    distVesting: 10,
    currentUsers: 1000,
    newUsersPerDay: 50,
    averageTicket: 20,
    burnAmount: 5000000,
    weeklyLiquidityAdd: 1000,
  });

  // ROI Simulator - INPUTS AMM
  const [roiInLiquidity, setRoiInLiquidity] = useState(50000.0);
  const [roiInTokensPool, setRoiInTokensPool] = useState(500000.0);
  const [roiTotalSupply, setRoiTotalSupply] = useState(2000000000.0);
  
  const [roiInMonthlyUsers, setRoiInMonthlyUsers] = useState(100);
  const [roiInTicket, setRoiInTicket] = useState(100.0);
  const [roiInMonthlyAddUSD, setRoiInMonthlyAddUSD] = useState(1000.0);
  const [roiInMonthlyAddTokens, setRoiInMonthlyAddTokens] = useState(50000.0); // Novo campo conectado à lógica

  // Variáveis Calculadas (Read Only)
  const currentInitialPrice = useMemo(() => 
    calculatePriceFromReserves(roiInLiquidity, roiInTokensPool),
    [roiInLiquidity, roiInTokensPool]
  );

  const initialMarketCap = useMemo(() => 
    currentInitialPrice * roiTotalSupply,
    [currentInitialPrice, roiTotalSupply]
  );

  const [scenario] = useState<Scenario>(Scenario.Neutral);
  const [timeframe] = useState<Timeframe>(Timeframe.Months3);
  const [aiResult, setAiResult] = useState<any>(null);
  const [loadingAI, setLoadingAI] = useState(false);

  // Motor Matemático x * y = k com Injeção Dinâmica
  const roiData = useMemo(() => 
    calculateRoiSimulation(
      roiInLiquidity,
      roiInTokensPool,
      roiInMonthlyUsers,
      roiInTicket,
      roiInMonthlyAddUSD,
      roiInMonthlyAddTokens
    ), 
    [roiInLiquidity, roiInTokensPool, roiInMonthlyUsers, roiInTicket, roiInMonthlyAddUSD, roiInMonthlyAddTokens]
  );

  const { stats } = useMemo(() => calculateRealisticStats(state, scenario, timeframe), [state, scenario, timeframe]);

  const fetchAI = async () => {
    setLoadingAI(true);
    const result = await getAIAnalysis(stats, scenario);
    setAiResult(result);
    setLoadingAI(false);
  };

  useEffect(() => {
    fetchAI();
  }, [scenario]);

  const renderRoiSimulator = () => {
    const liqToMcRatio = (roiInLiquidity / (initialMarketCap || 1)) * 100;
    
    // Impacto de Preço / Alerta de Diluição
    const priceNeutral = roiData[12][Scenario.Neutral];
    const isDiluting = priceNeutral < currentInitialPrice;

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="bg-[#1a1f2e] p-6 lg:p-8 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden">
          
          <div className="flex flex-col md:absolute md:top-8 md:right-8 items-start md:items-end gap-2 mb-6 md:mb-0">
             <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${liqToMcRatio > 5 ? 'bg-emerald-500' : 'bg-amber-500'} text-black shadow-lg`}>
               <span>{liqToMcRatio > 5 ? '💎' : '⚠️'}</span>
               {liqToMcRatio > 5 ? 'Liquidez Saudável' : 'Liquidez Baixa'}
             </div>
             <span className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">Razão Liquidez/MC (FDV): {liqToMcRatio.toFixed(1)}%</span>
          </div>

          <div className="flex items-center gap-3 mb-8">
            <div className="bg-blue-600 p-3 rounded-2xl text-2xl shadow-lg shadow-blue-500/20">🧠</div>
            <div>
              <h2 className="text-xl lg:text-2xl font-black text-white uppercase tracking-tight">Simulador ROI Sniper v3.1</h2>
              <p className="text-slate-400 text-[10px] font-medium uppercase tracking-widest opacity-70">Engine AMM v3.1 • x * y = k + Injeção Dinâmica</p>
            </div>
          </div>

          {/* INPUT GRID - MANTIDO LAYOUT, APENAS CONECTADO À LÓGICA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 mb-10">
            <div className="space-y-2">
              <label className="block text-[8px] font-black text-blue-400 uppercase tracking-widest">Liquidez Pool (y) $</label>
              <input 
                type="number" 
                value={roiInLiquidity} 
                onChange={e => setRoiInLiquidity(Math.max(Number(e.target.value), 0.1))} 
                className="w-full bg-[#0b0e14] border border-blue-900/30 p-3.5 rounded-xl text-white font-mono font-bold text-sm focus:ring-2 focus:ring-blue-500/50 outline-none transition-all" 
              />
              <p className="text-[9px] font-mono text-slate-500 pl-1">{formatNumberWithPoints(roiInLiquidity, true)}</p>
            </div>

            <div className="space-y-2">
              <label className="block text-[8px] font-black text-blue-400 uppercase tracking-widest">Tokens Pool (x)</label>
              <input 
                type="number" 
                value={roiInTokensPool} 
                onChange={e => setRoiInTokensPool(Math.max(Number(e.target.value), 0.1))} 
                className="w-full bg-[#0b0e14] border border-blue-900/30 p-3.5 rounded-xl text-white font-mono font-bold text-sm focus:ring-2 focus:ring-blue-500/50 outline-none transition-all" 
              />
              <p className="text-[9px] font-mono text-slate-500 pl-1">{formatNumberWithPoints(roiInTokensPool)} tokens</p>
            </div>

            <div className="space-y-2">
              <label className="block text-[8px] font-black text-slate-500 uppercase tracking-widest">Preço Inicial (Calc)</label>
              <div className="w-full bg-slate-900/30 border border-slate-800/50 p-3.5 rounded-xl text-slate-400 font-mono font-bold text-sm">
                {currentInitialPrice.toFixed(6)}
              </div>
              <p className="text-[9px] font-mono text-slate-600 pl-1">Baseado em Reservas</p>
            </div>

            <div className="space-y-2">
              <label className="block text-[8px] font-black text-emerald-500 uppercase tracking-widest">Compradores / Mês</label>
              <input 
                type="number" 
                value={roiInMonthlyUsers} 
                onChange={e => setRoiInMonthlyUsers(Number(e.target.value))} 
                className="w-full bg-[#0b0e14] border border-emerald-900/30 p-3.5 rounded-xl text-white font-mono font-bold text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all" 
              />
              <p className="text-[9px] font-mono text-slate-500 pl-1">{formatNumberWithPoints(roiInMonthlyUsers)} pessoas</p>
            </div>

            <div className="space-y-2">
              <label className="block text-[8px] font-black text-emerald-500 uppercase tracking-widest">Ticket Médio $</label>
              <input 
                type="number" 
                value={roiInTicket} 
                onChange={e => setRoiInTicket(Number(e.target.value))} 
                className="w-full bg-[#0b0e14] border border-emerald-900/30 p-3.5 rounded-xl text-white font-mono font-bold text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all" 
              />
              <p className="text-[9px] font-mono text-slate-500 pl-1">{formatNumberWithPoints(roiInTicket, true)} / compra</p>
            </div>

            <div className="space-y-2">
              <label className="block text-[8px] font-black text-amber-500 uppercase tracking-widest">Inj. Mensal USD</label>
              <input 
                type="number" 
                value={roiInMonthlyAddUSD} 
                onChange={e => setRoiInMonthlyAddUSD(Number(e.target.value))} 
                className="w-full bg-[#0b0e14] border border-amber-900/30 p-3.5 rounded-xl text-white font-mono font-bold text-sm focus:ring-2 focus:ring-amber-500/50 outline-none transition-all" 
              />
              <p className="text-[9px] font-mono text-slate-500 pl-1">{formatNumberWithPoints(roiInMonthlyAddUSD, true)}</p>
            </div>

            <div className="space-y-2">
              <label className="block text-[8px] font-black text-amber-500 uppercase tracking-widest">Inj. Mensal Tokens</label>
              <input 
                type="number" 
                value={roiInMonthlyAddTokens} 
                onChange={e => setRoiInMonthlyAddTokens(Number(e.target.value))} 
                className="w-full bg-[#0b0e14] border border-amber-900/30 p-3.5 rounded-xl text-white font-mono font-bold text-sm focus:ring-2 focus:ring-amber-500/50 outline-none transition-all" 
              />
              <p className="text-[9px] font-mono text-slate-500 pl-1">{formatNumberWithPoints(roiInMonthlyAddTokens)} tokens</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <div className="bg-[#0b0e14] p-5 rounded-2xl border border-slate-800">
              <span className="text-[9px] font-black text-slate-500 uppercase">Market Cap (FDV)</span>
              <div className="text-xl font-black text-white">{formatUSD(roiData[12][Scenario.Neutral] * roiTotalSupply)}</div>
            </div>
            <div className="bg-[#0b0e14] p-5 rounded-2xl border border-slate-800">
              <span className="text-[9px] font-black text-slate-500 uppercase">Impacto de Injeção</span>
              <div className={`text-xl font-black ${isDiluting ? 'text-rose-500' : 'text-emerald-400'}`}>
                {isDiluting ? '⚠️ Diluindo' : '✅ Valorizando'}
              </div>
            </div>
            <div className="bg-emerald-500/10 p-5 rounded-2xl border border-emerald-500/20">
              <span className="text-[9px] font-black text-emerald-500 uppercase">Preço Alvo (12 meses)</span>
              <div className="text-xl font-black text-emerald-400">{formatUSD(roiData[12][Scenario.Neutral])}</div>
            </div>
            <div className="bg-blue-500/10 p-5 rounded-2xl border border-blue-500/20">
              <span className="text-[9px] font-black text-blue-500 uppercase">ROI Estimado</span>
              <div className="text-xl font-black text-blue-400">{(roiData[12][Scenario.Neutral] / (currentInitialPrice || 1)).toFixed(2)}x</div>
            </div>
          </div>

          <div className="h-[400px] w-full bg-[#0b0e14] p-6 rounded-3xl border border-slate-800 shadow-inner">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={roiData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.3} />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickMargin={10} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `$ ${val.toFixed(4)}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1f2e', border: '1px solid #334155', borderRadius: '16px', color: '#f8fafc' }}
                  formatter={(val: number) => [formatUSD(val), 'Preço']}
                />
                <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px', fontSize: '10px', fontWeight: 'bold' }}/>
                <Line name="Otimista" type="monotone" dataKey={Scenario.Optimistic} stroke="#10b981" strokeWidth={4} dot={false} />
                <Line name="Neutro" type="monotone" dataKey={Scenario.Neutral} stroke="#3b82f6" strokeWidth={3} dot={false} />
                <Line name="Pessimista" type="monotone" dataKey={Scenario.Pessimistic} stroke="#f43f5e" strokeWidth={2} dot={false} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  const renderDashboard = () => (
    <div className="animate-in fade-in duration-500">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KPICard title="Preço Atual" value={formatUSD(stats.price)} subtitle="Lógica AMM (Pool Liquidity)" />
        <KPICard title="Market Cap (FDV)" value={`${(stats.marketCap / 1_000_000).toFixed(2)}M`} subtitle="Total Diluted Value" />
        <KPICard title="Liquidez Total" value={formatUSD(stats.liquidity)} subtitle="Depth available for trading" status={stats.liquidityToMcRatio < 5 ? 'red' : 'green'} />
        <KPICard title="Nível de Risco" value={stats.riskLevel} subtitle="Overall Safety Rating" status={stats.riskLevel === 'Crítico' ? 'red' : 'green'} />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#0b0e14]">
      {/* SIDEBAR NAVIGATION - PRESERVADO */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-72 bg-[#0b0e14] border-r border-slate-800 lg:min-h-screen p-8 
        flex flex-col shrink-0
        transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="mb-12 hidden lg:block">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center font-black text-white text-xl">S</div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tighter">SUPER CRÂNIO</h1>
              <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest">Amm Engine v3.1</p>
            </div>
          </div>
        </div>

        <nav className="space-y-2 flex-1">
          <button onClick={() => setActiveTab(10)} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${activeTab === 10 ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-500 hover:bg-slate-800'}`}>
            <span>🧠</span> Simulador ROI Sniper
          </button>
          <button onClick={() => setActiveTab(9)} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${activeTab === 9 ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-500 hover:bg-slate-800'}`}>
            <span>📊</span> Dashboard Resumo
          </button>
        </nav>
      </aside>

      <main className="flex-1 p-4 md:p-10 lg:h-screen overflow-y-auto bg-[#0b0e14]">
        <div className="max-w-7xl mx-auto">
          {activeTab === 10 && renderRoiSimulator()}
          {activeTab === 9 && renderDashboard()}
        </div>
      </main>
    </div>
  );
};

export default App;
