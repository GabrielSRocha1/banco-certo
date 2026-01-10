
import React, { useState, useMemo, useEffect } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend
} from 'recharts';
import { Scenario, Timeframe, AppState } from './types';
import { calculateRealisticStats } from './utils/tokenMath';
import { calculateRoiSimulation } from './utils/tokenMath';
import { getAIAnalysis } from './services/geminiService';
import KPICard from './components/KPICard';

// Formatação solicitada: $ 1.250,50
const formatUSD = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value).replace('$', '$ ');
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState(10); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // App Global State
  const [state, setState] = useState<AppState>({
    baseCurrency: 'USD',
    initialPrice: 0.10,
    totalSupply: 100000000,
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

  // ROI Simulator Specific Inputs
  const [roiInPrice, setRoiInPrice] = useState(0.10);
  const [roiInLiquidity, setRoiInLiquidity] = useState(50000.0);
  const [roiInMonthlyUsers, setRoiInMonthlyUsers] = useState(100);
  const [roiInTicket, setRoiInTicket] = useState(100.0);
  const [roiInWeeklyAddUSD, setRoiInWeeklyAddUSD] = useState(1000.0);
  const [roiInTokensSupply, setRoiInTokensSupply] = useState(500000); // Tokens na Pool
  const [roiInWeeklyTokenInj, setRoiInWeeklyTokenInj] = useState(0); // Injeção de Tokens

  const [scenario, setScenario] = useState<Scenario>(Scenario.Neutral);
  const [timeframe, setTimeframe] = useState<Timeframe>(Timeframe.Months3);
  const [aiResult, setAiResult] = useState<any>(null);
  const [loadingAI, setLoadingAI] = useState(false);

  // Math Calculations
  const { stats, history } = useMemo(() => calculateRealisticStats(state, scenario, timeframe), [state, scenario, timeframe]);
  
  const roiData = useMemo(() => 
    calculateRoiSimulation(
      roiInPrice, 
      roiInLiquidity, 
      roiInMonthlyUsers, 
      roiInTicket, 
      roiInWeeklyAddUSD,
      roiInTokensSupply,
      roiInWeeklyTokenInj
    ), 
    [roiInPrice, roiInLiquidity, roiInMonthlyUsers, roiInTicket, roiInWeeklyAddUSD, roiInTokensSupply, roiInWeeklyTokenInj]
  );

  // Liquidity Health Logic
  const liqHealth = useMemo(() => {
    const mc = roiInPrice * roiInTokensSupply;
    const ratio = (roiInLiquidity / (mc || 1)) * 100;
    
    if (ratio < 5) return { label: 'CRÍTICO', color: 'bg-rose-600 text-white', icon: '🚨' };
    if (ratio >= 10 && ratio <= 15) return { label: 'SAUDÁVEL', color: 'bg-emerald-600 text-white', icon: '✅' };
    if (ratio > 20) return { label: 'ÓTIMA', color: 'bg-[#00ff9d] text-black shadow-[0_0_15px_rgba(0,255,157,0.4)]', icon: '💎' };
    return { label: 'ESTÁVEL', color: 'bg-blue-600 text-white', icon: '⚖️' };
  }, [roiInLiquidity, roiInPrice, roiInTokensSupply]);

  const fetchAI = async () => {
    setLoadingAI(true);
    const result = await getAIAnalysis(stats, scenario);
    setAiResult(result);
    setLoadingAI(false);
  };

  useEffect(() => {
    fetchAI();
  }, [stats, scenario]);

  const toggleTab = (id: number) => {
    setActiveTab(id);
    setIsSidebarOpen(false); // Fecha o menu ao trocar de aba no mobile
  };

  const renderRoiSimulator = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-[#1a1f2e] p-6 lg:p-8 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden">
        {/* Dynamic Health Badge */}
        <div className="flex flex-col md:absolute md:top-8 md:right-8 items-start md:items-end gap-2 mb-6 md:mb-0">
           <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all duration-500 ${liqHealth.color}`}>
             <span>{liqHealth.icon}</span>
             {liqHealth.label}
           </div>
           <span className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">Razão Liquidez/MC: {((roiInLiquidity / (roiInPrice * roiInTokensSupply)) * 100).toFixed(1)}%</span>
        </div>

        <div className="flex items-center gap-3 mb-8">
          <div className="bg-blue-600 p-3 rounded-2xl text-2xl shadow-lg shadow-blue-500/20">🧠</div>
          <div>
            <h2 className="text-xl lg:text-2xl font-black text-white uppercase tracking-tight">Simulador ROI Sniper</h2>
            <p className="text-slate-400 text-[10px] font-medium uppercase tracking-widest opacity-70">Engine AMM v2.0 • Constante x * y = k</p>
          </div>
        </div>

        {/* INPUT GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 mb-10">
          {[
            { label: 'Preço Inicial ($)', value: roiInPrice, setter: setRoiInPrice, step: "0.0001" },
            { label: 'Liquidez Pool ($)', value: roiInLiquidity, setter: setRoiInLiquidity },
            { label: 'Qtd Circulante (Tokens)', value: roiInTokensSupply, setter: setRoiInTokensSupply },
            { label: 'Compradores/Mês', value: roiInMonthlyUsers, setter: setRoiInMonthlyUsers },
            { label: 'Ticket Médio ($)', value: roiInTicket, setter: setRoiInTicket },
            { label: 'Liq. Add/Sem ($)', value: roiInWeeklyAddUSD, setter: setRoiInWeeklyAddUSD, color: 'text-blue-400', border: 'border-blue-900/30' },
            { label: 'Inj. Semanal (Tokens)', value: roiInWeeklyTokenInj, setter: setRoiInWeeklyTokenInj, color: 'text-amber-500', border: 'border-amber-900/30' },
          ].map((input, idx) => (
            <div key={idx} className="space-y-2">
              <label className={`block text-[8px] font-black ${input.color || 'text-slate-500'} uppercase tracking-widest`}>{input.label}</label>
              <input 
                type="number" step={input.step || "1"} 
                value={input.value} 
                onChange={e => input.setter(Number(e.target.value))} 
                className={`w-full bg-[#0b0e14] border ${input.border || 'border-slate-700'} p-3.5 rounded-xl text-white font-mono font-bold text-sm focus:ring-2 focus:ring-blue-500/50 outline-none transition-all`} 
              />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-[#10b9811a] border border-[#10b98133] p-6 rounded-2xl group transition-all hover:bg-[#10b9812a]">
            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Projeção Otimista (12m)</span>
            <div className="text-2xl lg:text-3xl font-black text-emerald-400 mt-1">{formatUSD(roiData[12][Scenario.Optimistic])}</div>
            <p className="text-[10px] text-emerald-500/60 mt-2 font-bold uppercase tracking-tighter">Impacto AMM: Forte Acúmulo</p>
          </div>
          <div className="bg-[#3b82f61a] border border-[#3b82f633] p-6 rounded-2xl group transition-all hover:bg-[#3b82f62a]">
            <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Projeção Conservadora (12m)</span>
            <div className="text-2xl lg:text-3xl font-black text-blue-400 mt-1">{formatUSD(roiData[12][Scenario.Neutral])}</div>
            <p className="text-[10px] text-blue-500/60 mt-2 font-bold uppercase tracking-tighter">Equilíbrio Supply/Liquidez</p>
          </div>
          <div className="bg-[#f43f5e1a] border border-[#f43f5e33] p-6 rounded-2xl group transition-all hover:bg-[#f43f5e2a]">
            <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Projeção Pessimista (12m)</span>
            <div className="text-2xl lg:text-3xl font-black text-rose-400 mt-1">{formatUSD(roiData[12][Scenario.Pessimistic])}</div>
            <p className="text-[10px] text-rose-500/60 mt-2 font-bold uppercase tracking-tighter">Efeito de Diluição e Baixa Depth</p>
          </div>
        </div>

        <div className="h-[300px] lg:h-[400px] w-full bg-[#0b0e14] p-4 lg:p-6 rounded-3xl border border-slate-800 shadow-inner">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={roiData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.3} />
              <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickMargin={10} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `$ ${val.toFixed(2)}`} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1a1f2e', border: '1px solid #334155', borderRadius: '16px', color: '#f8fafc', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}
                itemStyle={{ fontSize: '12px', fontWeight: 'bold', padding: '4px 0' }}
                formatter={(val: number) => [formatUSD(val), 'Preço Projetado']}
              />
              <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}/>
              <Line name="Otimista" type="monotone" dataKey={Scenario.Optimistic} stroke="#10b981" strokeWidth={4} dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#0b0e14' }} activeDot={{ r: 8, strokeWidth: 0 }} />
              <Line name="Conservador" type="monotone" dataKey={Scenario.Neutral} stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#0b0e14' }} activeDot={{ r: 6, strokeWidth: 0 }} />
              <Line name="Pessimista" type="monotone" dataKey={Scenario.Pessimistic} stroke="#f43f5e" strokeWidth={2} strokeDasharray="6 4" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const renderDashboard = () => (
    <div className="animate-in fade-in duration-500">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KPICard title="Preço Atual" value={formatUSD(stats.price)} subtitle="Lógica AMM (Pool Liquidity)" />
        <KPICard title="Market Cap" value={`${(stats.marketCap / 1_000_000).toFixed(2)}M`} subtitle="Total Diluted Value" />
        <KPICard title="Liquidez Total" value={formatUSD(stats.liquidity)} subtitle="Depth available for trading" status={stats.liquidityToMcRatio < 10 ? 'red' : 'green'} />
        <KPICard title="Nível de Risco" value={stats.riskLevel} subtitle="Overall Safety Rating" status={stats.riskLevel === 'Crítico' ? 'red' : 'green'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#1a1f2e] p-6 rounded-2xl border border-slate-800 shadow-xl">
          <h3 className="text-lg font-bold text-white mb-6">Tendência de Preço (Simulação Global)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                <XAxis dataKey="week" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: '#1a1f2e', border: 'none', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.3)' }} />
                <Area type="monotone" dataKey="price" stroke="#3b82f6" fillOpacity={1} fill="url(#colorPrice)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#1a1f2e] p-6 rounded-2xl border border-slate-800 shadow-xl space-y-6">
          <h3 className="text-lg font-bold text-white">Fatores de Segurança</h3>
          <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
            <span className="text-[10px] font-black text-slate-500 uppercase">Concentração do Time</span>
            <div className="text-2xl font-bold text-slate-200">{stats.teamPercentage}%</div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2">
              <div className={`h-full rounded-full ${stats.teamPercentage > 20 ? 'bg-rose-500' : 'bg-blue-500'}`} style={{ width: `${stats.teamPercentage}%` }}></div>
            </div>
          </div>
          <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
            <span className="text-[10px] font-black text-slate-500 uppercase">Liquidez / MC</span>
            <div className="text-2xl font-bold text-slate-200">{stats.liquidityToMcRatio.toFixed(1)}%</div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2">
              <div className={`h-full rounded-full ${stats.liquidityToMcRatio < 10 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(stats.liquidityToMcRatio * 3, 100)}%` }}></div>
            </div>
          </div>
          {aiResult && (
            <div className={`p-4 rounded-xl border ${aiResult.error ? 'bg-rose-900/20 border-rose-500/30' : 'bg-blue-900/20 border-blue-500/30'}`}>
               <div className="flex justify-between items-center mb-1">
                <span className={`text-[10px] font-black uppercase ${aiResult.error ? 'text-rose-400' : 'text-blue-400'}`}>Insight do Analista IA</span>
                {aiResult.error && (
                  <button onClick={fetchAI} className="text-[9px] font-black uppercase text-white bg-rose-600 px-2 py-0.5 rounded hover:bg-rose-700 transition-colors">Tentar novamente</button>
                )}
               </div>
               <p className={`text-xs italic leading-relaxed mt-1 ${aiResult.error ? 'text-rose-200' : 'text-blue-200'}`}>"{aiResult.situacao}"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#0b0e14]">
      {/* MOBILE HEADER WITH HAMBURGER */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-[#0b0e14] border-b border-slate-800 sticky top-0 z-[60]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center font-black text-white text-lg">S</div>
          <span className="font-black text-white tracking-tighter text-sm uppercase">Super Crânio</span>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 text-slate-400 hover:text-white transition-colors"
          aria-label="Menu"
        >
          {isSidebarOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          )}
        </button>
      </div>

      {/* OVERLAY FOR MOBILE SIDEBAR */}
      {isSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR NAVIGATION */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-72 bg-[#0b0e14] border-r border-slate-800 lg:min-h-screen p-8 
        flex flex-col shrink-0
        transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="mb-12 hidden lg:block">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center font-black text-white text-xl shadow-lg shadow-blue-500/20">S</div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tighter">SUPER CRÂNIO</h1>
              <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest">Token Control Center</p>
            </div>
          </div>
        </div>

        <nav className="space-y-2 flex-1 mt-4 lg:mt-0">
          {[
            { id: 10, label: 'Simulador ROI', icon: '🧠' },
            { id: 9, label: 'Dashboard Resumo', icon: '📊' },
            { id: 0, label: 'Inputs Gerais', icon: '⚙️' },
            { id: 1, label: 'Tokenomics', icon: '🥧' },
            { id: 8, label: 'Analista Virtual IA', icon: '🤖' },
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => toggleTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/30' : 'text-slate-500 hover:bg-slate-800/50 hover:text-slate-200'}`}
            >
              <span className="text-lg opacity-80">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="pt-8 mt-8 border-t border-slate-800">
          <div className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-2xl border border-slate-800">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-[10px] font-bold text-white shadow-lg">G</div>
            <div>
              <p className="text-xs font-bold text-white">Gestor Alpha</p>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">Fintech Engine v3.1</p>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-4 md:p-10 lg:h-screen overflow-y-auto bg-[#0b0e14]">
        <div className="max-w-7xl mx-auto">
          {activeTab === 10 && renderRoiSimulator()}
          {activeTab === 9 && renderDashboard()}
          
          {(activeTab < 9 || activeTab === 8) && (
             <div className="bg-[#1a1f2e] p-8 lg:p-12 rounded-3xl border border-slate-800 text-center animate-in zoom-in duration-500 shadow-2xl">
                <div className="text-4xl lg:text-5xl mb-6">⚙️</div>
                <h2 className="text-xl lg:text-2xl font-black text-white mb-2">Módulo {activeTab} em Sincronização</h2>
                <p className="text-slate-400 max-w-sm mx-auto text-sm font-medium">Os parâmetros globais incluindo <span className="text-blue-400">Suprimento de Tokens</span> já estão sendo processados pela engine.</p>
                <button onClick={() => setActiveTab(10)} className="mt-8 bg-blue-600 text-white px-8 lg:px-10 py-3 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-blue-900/20">Voltar ao Simulador Principal</button>
             </div>
          )}
        </div>
        
        <footer className="mt-20 text-center text-slate-600 text-[9px] font-black uppercase tracking-[0.3em] pb-12 opacity-50">
          © 2024 SUPER CRÂNIO — Fintech & Web3 Software Engineering
          <p className="mt-2 text-slate-700">Powered by AMM Mathematical Engine v2.0.0 (Sniper Upgrade)</p>
        </footer>
      </main>
    </div>
  );
};

export default App;
