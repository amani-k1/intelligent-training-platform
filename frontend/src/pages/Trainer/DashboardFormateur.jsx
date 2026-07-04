// src/pages/Trainer/DashboardFormateur.jsx
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { 
  ChartBarIcon, 
  UserGroupIcon, 
  CurrencyDollarIcon, 
  AcademicCapIcon, 
  CalendarIcon, 
  BoltIcon, 
  ArrowRightIcon,
  SparklesIcon,
  PlayIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';

const DashboardFormateur = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Overview');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Export Modal State
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportConfig, setExportConfig] = useState({
     columns: ['titre', 'inscrits', 'note', 'revenus', 'completion'],
     format: 'PDF'
  });

  // Mock Data (Modernized)
  const formations = [
    { id: 1, title: 'IA pour Décideurs', category: 'Technologie', students: 450, rating: 4.8, revenue: '15.2K', progress: 74, color: 'teal' },
    { id: 2, title: 'Marketing Digital Avancé', category: 'Marketing', students: 820, rating: 4.9, revenue: '28.4K', progress: 92, color: 'indigo' },
    { id: 3, title: 'Design Thinking 2.0', category: 'Design', students: 120, rating: 4.6, revenue: '5.4K', progress: 45, color: 'amber' },
  ];

  const upcomingSessions = [
    { id: 1, time: '09:00', date: 'Demain', title: 'Workshop IA & Neurones', participants: 45, type: 'Live' },
    { id: 2, time: '14:30', date: '12 Mai', title: 'Q&A Marketing Stratégique', participants: 120, type: 'Webinaire' },
  ];

  const recentActivity = [
    { id: 1, user: 'Alexandre D.', action: 'a posé une question critique', time: 'il y a 2h', type: 'support' },
    { id: 2, user: 'Sofia L.', action: 'a complété le Module 3', time: 'il y a 4h', type: 'progress' },
    { id: 3, user: 'Marc A.', action: 'est en retard sur le projet final', time: 'il y a 6h', type: 'alert' },
  ];

  const stats = [
    { label: 'Formations', value: '12', variation: '+2', icon: AcademicCapIcon, color: 'text-teal-600' },
    { label: 'Étudiants Totaux', value: '1.4K', variation: '+12%', icon: UserGroupIcon, color: 'text-indigo-600' },
    { label: 'Revenus Mensuels', value: '8.2K KDA', variation: '+18%', icon: CurrencyDollarIcon, color: 'text-emerald-600' },
    { label: 'Score de Prestige', value: '4.8/5', variation: '+0.1', icon: SparklesIcon, color: 'text-amber-500' },
  ];

  const filteredFormations = useMemo(() => {
    return formations.filter(f => f.title.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [searchQuery]);

  return (
    <DashboardLayout role="formateur">
      <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0b0f19] font-['Inter'] pb-20 transition-colors duration-700">
        
        {/* --- EXPORT MODAL --- */}
        {showExportModal && (
           <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-2xl bg-slate-900/40">
              <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[3.5rem] border border-white/20 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                 <div className="bg-slate-900 p-10 text-white relative">
                    <button onClick={() => setShowExportModal(false)} className="absolute top-8 right-8 text-white/50 hover:text-white"><PlusIcon className="h-6 w-6 rotate-45" /></button>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-teal-400 mb-2 block">Configuration d'Export</span>
                    <h2 className="text-3xl font-black tracking-tight leading-none">Personnaliser le Rapport</h2>
                 </div>
                 
                 <div className="p-10 space-y-8">
                    <div>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Colonnes à inclure</p>
                       <div className="grid grid-cols-2 gap-4">
                          {[
                            { id: 'titre', label: 'Titre Formation' },
                            { id: 'inscrits', label: 'Nombre d\'inscrits' },
                            { id: 'note', label: 'Note Moyenne' },
                            { id: 'revenus', label: 'Revenus' },
                            { id: 'completion', label: 'Taux de Complétion' },
                          ].map(col => (
                             <label key={col.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl cursor-pointer hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-all border border-transparent hover:border-teal-500/30">
                                <input 
                                  type="checkbox" 
                                  checked={exportConfig.columns.includes(col.id)}
                                  onChange={() => {
                                     const newCols = exportConfig.columns.includes(col.id)
                                        ? exportConfig.columns.filter(c => c !== col.id)
                                        : [...exportConfig.columns, col.id];
                                     setExportConfig({...exportConfig, columns: newCols});
                                  }}
                                  className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                                />
                                <span className="text-xs font-bold dark:text-white">{col.label}</span>
                             </label>
                          ))}
                       </div>
                    </div>

                    <div>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Format du fichier</p>
                       <div className="flex gap-4">
                          {['PDF', 'CSV'].map(fmt => (
                             <button 
                               key={fmt}
                               onClick={() => setExportConfig({...exportConfig, format: fmt})}
                               className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
                                 exportConfig.format === fmt 
                                   ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/30' 
                                   : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                               }`}
                             >
                                {fmt} Document
                             </button>
                          ))}
                       </div>
                    </div>

                    <button 
                      onClick={() => { alert(`Génération du rapport ${exportConfig.format} avec ${exportConfig.columns.length} colonnes...`); setShowExportModal(false); }}
                      className="w-full py-5 bg-slate-900 dark:bg-white dark:text-slate-900 rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-2xl hover:bg-teal-600 hover:text-white transition-all"
                    >
                       {t('common.generate_export')}
                    </button>
                 </div>
              </div>
           </div>
        )}

        {/* --- STICKY HEADER --- */}
        <header className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 transition-all">
          <div className="max-w-[1600px] mx-auto px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="h-2 w-2 rounded-full bg-teal-500 animate-pulse"></span>
                <span className="text-[10px] font-black text-teal-600 dark:text-teal-400 uppercase tracking-[0.3em] leading-none">Status: En Ligne</span>
              </div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none">Bonjour, Ahmed</h1>
            </div>

            <div className="flex items-center gap-4 w-full md:w-auto">
               <div className="relative flex-1 md:w-80">
                  <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Rechercher une formation..." 
                    className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-2xl pl-12 pr-4 py-3.5 text-xs font-bold focus:ring-2 focus:ring-teal-500 outline-none transition-all dark:text-white"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
               </div>
               <button className="flex items-center gap-2 px-6 py-3.5 bg-slate-900 dark:bg-teal-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-teal-600/10">
                  <PlusIcon className="h-4 w-4" /> Nouvelle Œuvre
               </button>
            </div>
          </div>
        </header>

        <main className="max-w-[1600px] mx-auto px-8 py-10">
           
           {/* --- GLOBAL STATS GRID --- */}
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
              {stats.map((s, i) => (
                 <div key={i} className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:border-teal-500 transition-all group">
                    <div className="flex items-center justify-between mb-4">
                       <s.icon className={`h-6 w-6 ${s.color} group-hover:rotate-12 transition-transform`} />
                       <span className="text-[10px] font-black px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg">{s.variation}</span>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">{s.label}</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white leading-none">{s.value}</p>
                 </div>
              ))}
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              
              {/* --- MAIN CONTENT: FORMATIONS --- */}
              <div className="lg:col-span-2 space-y-10">
                 <div className="flex items-center justify-between">
                    <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Ateliers en cours</h2>
                    <div className="flex gap-4">
                       <button 
                         onClick={() => setShowExportModal(true)}
                         className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-teal-600 transition-colors"
                       >
                          <ArrowDownTrayIcon className="h-4 w-4" /> {t('common.export_report')}
                       </button>
                       <button onClick={() => navigate('/dashboard/formateur/formations')} className="text-[10px] font-black text-teal-600 uppercase tracking-widest hover:underline">Voir tout le catalogue</button>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 gap-6">
                    {filteredFormations.map(f => (
                       <div 
                         key={f.id} 
                         onClick={() => navigate(`/dashboard/formateur/formation/${f.id}`)}
                         className="bg-white dark:bg-slate-900 p-8 rounded-[3.5rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:border-teal-500 transition-all cursor-pointer group flex flex-col md:flex-row items-center gap-8"
                       >
                          <div className={`h-24 w-24 rounded-[2rem] flex items-center justify-center bg-${f.color}-100 dark:bg-${f.color}-900/30 text-${f.color}-600 group-hover:scale-110 transition-transform shadow-inner`}>
                             <BoltIcon className="h-10 w-10" />
                          </div>
                          <div className="flex-1 text-center md:text-left">
                             <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                                <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest bg-${f.color}-50 text-${f.color}-600 border border-${f.color}-100`}>{f.category}</span>
                                <div className="flex items-center text-amber-500 text-[10px] font-black">
                                   <StarIcon className="h-3.5 w-3.5 mr-1" /> {f.rating}
                                </div>
                             </div>
                             <h3 className="text-xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">{f.title}</h3>
                             <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                                <span>👥 {f.students}</span>
                                <span className="h-1.5 w-1.5 bg-slate-300 rounded-full"></span>
                                <span>💰 {f.revenue} KDA</span>
                                <span className="h-1.5 w-1.5 bg-slate-300 rounded-full"></span>
                                <span className="text-teal-600">{f.progress}% Complétion</span>
                             </div>
                          </div>
                          <div className="flex flex-col items-center gap-3">
                             <div className="h-16 w-16 relative">
                                <svg className="w-full h-full transform -rotate-90">
                                   <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-100 dark:text-slate-800" />
                                   <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray={175.9} strokeDashoffset={175.9 - (175.9 * f.progress) / 100} className="text-teal-500" />
                                </svg>
                                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black dark:text-white">{f.progress}%</span>
                             </div>
                             <button className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:text-teal-600 rounded-2xl transition-all"><ArrowRightIcon className="h-5 w-5" /></button>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>

              {/* --- SIDEBAR BENTO: SESSIONS & ACTIVITY --- */}
              <div className="space-y-10">
                 {/* Upcoming Sessions */}
                 <div className="bg-white dark:bg-slate-900 p-8 rounded-[3.5rem] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between mb-8">
                       <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">Agenda Maestro</h2>
                       <CalendarIcon className="h-5 w-5 text-teal-600" />
                    </div>
                    <div className="space-y-8">
                       {upcomingSessions.map(s => (
                          <div key={s.id} className="relative pl-6 border-l-2 border-teal-500 group/item">
                             <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-teal-500 border-4 border-white dark:border-slate-900 group-hover/item:scale-125 transition-transform"></div>
                             <div className="flex justify-between items-center mb-2">
                                <span className="text-[9px] font-black text-teal-600 uppercase tracking-widest">{s.date} • {s.time}</span>
                                <span className="text-[8px] font-black px-2 py-0.5 bg-teal-50 text-teal-600 rounded">{s.type}</span>
                             </div>
                             <h4 className="text-sm font-black dark:text-white mb-4 uppercase tracking-tight leading-tight">{s.title}</h4>
                             <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">👥 {s.participants} attendus</span>
                                <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-teal-600 hover:text-white transition-all">
                                   <PlayIcon className="h-3 w-3" /> Lancer
                                </button>
                             </div>
                          </div>
                       ))}
                    </div>
                 </div>

                 {/* Real-time Activity Feed */}
                 <div className="bg-slate-900 p-8 rounded-[3.5rem] border border-white/5 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 h-40 w-40 bg-teal-500/10 blur-[80px] group-hover:bg-teal-500/20 transition-all duration-700"></div>
                    <h2 className="text-[10px] font-black text-teal-400 uppercase tracking-[0.2em] mb-8 leading-none relative z-10">Activité Live</h2>
                    <div className="space-y-6 relative z-10">
                       {recentActivity.map(a => (
                          <div key={a.id} className="flex gap-4 group/act cursor-pointer">
                             <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                               a.type === 'support' ? 'bg-rose-500/20 text-rose-500' : a.type === 'alert' ? 'bg-amber-500/20 text-amber-500' : 'bg-teal-500/20 text-teal-500'
                             }`}>
                                <ClockIcon className="h-5 w-5" />
                             </div>
                             <div>
                                <p className="text-[11px] font-black text-white leading-none mb-1 group-hover/act:text-teal-400 transition-colors">{a.user}</p>
                                <p className="text-[10px] text-slate-400 font-bold leading-tight mb-1">{a.action}</p>
                                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{a.time}</span>
                             </div>
                          </div>
                       ))}
                    </div>
                    <button className="w-full mt-8 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[9px] font-black text-teal-400 uppercase tracking-widest transition-all">{t('common.view_history')}</button>
                 </div>
              </div>

           </div>
        </main>
      </div>
    </DashboardLayout>
  );
};

export default DashboardFormateur;
