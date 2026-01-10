
import React from 'react';

interface KPICardProps {
  title: string;
  value: string;
  subtitle: string;
  status?: 'green' | 'yellow' | 'red' | 'neutral';
}

const KPICard: React.FC<KPICardProps> = ({ title, value, subtitle, status = 'neutral' }) => {
  const statusColors = {
    green: 'border-emerald-500/50 bg-emerald-500/5 text-emerald-400',
    yellow: 'border-amber-500/50 bg-amber-500/5 text-amber-400',
    red: 'border-rose-500/50 bg-rose-500/5 text-rose-400',
    neutral: 'border-blue-500/50 bg-blue-500/5 text-white'
  };

  return (
    <div className={`p-6 rounded-2xl border-l-4 shadow-xl backdrop-blur-sm transition-all hover:translate-y-[-2px] hover:shadow-2xl ${statusColors[status]}`}>
      <h3 className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-500 mb-2">{title}</h3>
      <div className="text-2xl font-black mb-1 tracking-tight">{value}</div>
      <p className="text-[10px] font-medium leading-tight text-slate-500 uppercase tracking-wide">{subtitle}</p>
    </div>
  );
};

export default KPICard;
