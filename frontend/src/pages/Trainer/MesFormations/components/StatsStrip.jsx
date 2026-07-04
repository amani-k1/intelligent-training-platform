// src/pages/Trainer/MesFormations/components/StatsStrip.jsx
import React from 'react';
import {
  AcademicCapIcon,
  UserGroupIcon,
  ClockIcon,
  CurrencyDollarIcon,
  BookOpenIcon,
  CheckCircleIcon,
  BanknotesIcon,
  StarIcon,
} from '@heroicons/react/24/outline';

const formatRevenu = (val) => {
  if (val == null) return '—';
  const n = parseFloat(val);
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M DZD';
  if (n >= 1_000)     return (n / 1_000).toFixed(1)     + 'K DZD';
  return n + ' DZD';
};

export const StatsStrip = ({ stats }) => {
  if (!stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 h-full">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 animate-pulse h-32" />
        ))}
      </div>
    );
  }

  const revenusReels = stats.revenus_reels ?? stats.revenus_potentiels ?? 0;
  const noteMoy      = stats.note_moyenne ?? 0;

  const metrics = [
    {
      label: 'Formations Actives',
      value: stats.formations_actives ?? 0,
      badge: stats.taux_actif != null ? `${stats.taux_actif}%` : null,
      badgePositive: (stats.taux_actif ?? 0) >= 50,
      icon: AcademicCapIcon,
      color: 'text-teal-600',
      bg: 'bg-teal-50 dark:bg-teal-900/20',
    },
    {
      label: 'Total Heures',
      value: `${stats.total_heures ?? 0}h`,
      badge: null,
      icon: ClockIcon,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    },
    {
      label: 'Total Stagiaires',
      value: stats.total_stagiaires ?? stats.total_places ?? 0,
      badge: stats.total_acceptes != null ? `${stats.total_acceptes} acc.` : null,
      badgePositive: true,
      icon: UserGroupIcon,
      color: 'text-violet-600',
      bg: 'bg-violet-50 dark:bg-violet-900/20',
    },
    {
      label: 'Revenus Réels',
      value: formatRevenu(revenusReels),
      sub: formatRevenu(stats.revenus_potentiels) + ' potentiels',
      badge: null,
      icon: BanknotesIcon,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    },
    {
      label: 'Note Moyenne',
      value: noteMoy > 0 ? `${noteMoy}/5` : '—',
      badge: null,
      icon: StarIcon,
      color: 'text-amber-500',
      bg: 'bg-amber-50 dark:bg-amber-900/20',
    },
    {
      label: 'Formations Complètes',
      value: stats.formations_completes ?? 0,
      badge: null,
      icon: CheckCircleIcon,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 h-full">
      {metrics.map((m, i) => (
        <div key={i} className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between transition-all hover:border-teal-500/50 group">
          <div className="flex items-center justify-between mb-6">
            <div className={`${m.bg} p-2.5 rounded-xl transition-transform group-hover:rotate-6`}>
              <m.icon className={`h-5 w-5 ${m.color}`} />
            </div>
            {m.badge != null && (
              <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg border ${
                m.badgePositive
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 border-emerald-100 dark:border-emerald-800'
                  : 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 border-rose-100 dark:border-rose-800'
              }`}>
                {m.badge}
              </span>
            )}
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">{m.label}</p>
            <p className="text-xl font-black text-slate-900 dark:text-white tracking-tight group-hover:text-teal-600 transition-colors">{m.value}</p>
            {m.sub && <p className="text-[9px] font-bold text-slate-400 mt-0.5">{m.sub}</p>}
          </div>
        </div>
      ))}
    </div>
  );
};

export const ObjectiveProgressBar = ({ progress }) => {
  return (
    <div className="bg-slate-900 dark:bg-teal-950 p-7 rounded-[2rem] h-full flex flex-col justify-between border border-white/5 shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 h-32 w-32 bg-teal-500/10 blur-[60px] pointer-events-none group-hover:bg-teal-500/20 transition-all duration-700"></div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] font-black text-teal-400 uppercase tracking-widest">Taux d'Activation</span>
          <div className="h-2 w-2 rounded-full bg-teal-500 animate-pulse"></div>
        </div>
        <h4 className="text-white text-xl font-black tracking-tight mb-6 leading-tight">Formations<br/>En Cours</h4>
      </div>

      <div className="relative z-10">
        <div className="flex items-end justify-between mb-3">
          <span className="text-3xl font-black text-white">{progress}%</span>
          <span className="text-[10px] font-bold text-teal-400 mb-1.5 uppercase tracking-tighter">Actives</span>
        </div>
        <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden mb-2">
          <div
            className="h-full bg-gradient-to-r from-teal-500 to-teal-300 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(20,184,166,0.5)]"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <p className="text-[9px] font-bold text-white/40 italic">* Données synchronisées en temps réel.</p>
      </div>
    </div>
  );
};
