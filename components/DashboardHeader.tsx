
import React from 'react';
import { Scenario, Timeframe } from '../types';

interface HeaderProps {
  scenario: Scenario;
  timeframe: Timeframe;
  onScenarioChange: (s: Scenario) => void;
  onTimeframeChange: (t: Timeframe) => void;
}

const DashboardHeader: React.FC<HeaderProps> = ({ scenario, timeframe, onScenarioChange, onTimeframeChange }) => {
  return (
    <div className="bg-[#1a1f2e] p-6 rounded-3xl shadow-sm border border-slate-800 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div>
        <h1 className="text-xl font-black text-white tracking-tight uppercase">Dashboard Executivo</h1>
        <p className="text-slate-500 text-xs font-medium">Controle total de tokenomics e liquidez.</p>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="flex flex-col">
          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Variável de Mercado</label>
          <select 
            value={scenario}
            onChange={(e) => onScenarioChange(e.target.value as Scenario)}
            className="bg-[#0b0e14] border border-slate-700 text-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer hover:border-slate-600 transition-all"
          >
            {Object.values(Scenario).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Horizonte Temporal</label>
          <select 
            value={timeframe}
            onChange={(e) => onTimeframeChange(e.target.value as Timeframe)}
            className="bg-[#0b0e14] border border-slate-700 text-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer hover:border-slate-600 transition-all"
          >
            {Object.values(Timeframe).map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
