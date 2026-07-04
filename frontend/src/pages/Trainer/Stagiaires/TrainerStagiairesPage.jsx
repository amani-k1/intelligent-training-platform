import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from '../../../context/LanguageContext';
import DashboardLayout from '../../../components/DashboardLayout';
import {
  UserGroupIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  CalendarIcon,
  ArrowTrendingUpIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  ChatBubbleLeftRightIcon,
  TrophyIcon,
  AdjustmentsVerticalIcon,
  SparklesIcon,
  ArrowDownTrayIcon,
  XMarkIcon,
  ArrowTopRightOnSquareIcon,
  EnvelopeIcon,
  MapPinIcon,
  IdentificationIcon,
  ChevronDownIcon,
  ArrowPathIcon,
  PhoneIcon,
  BriefcaseIcon,
  CheckIcon,
  NoSymbolIcon,
} from '@heroicons/react/24/outline';
import { fetchCandidats } from '../../../services/userService';
import api from '../../../api/axios';

// ── helpers ──────────────────────────────────────────────────────────────────
const normalizeStatut = (s) => {
  const v = (s || '').toLowerCase();
  if (v.includes('accept'))              return 'Accepté';
  if (v.includes('refus'))               return 'Refusé';
  if (v.includes('attend') || v.includes('pend') || v.includes('attente')) return 'En attente';
  if (v === 'actif')                     return 'Actif';
  if (v === 'inactif')                   return 'Inactif';
  return s || 'Inconnu';
};

const statutCfg = (s) => {
  const v = normalizeStatut(s);
  switch (v) {
    case 'Accepté':    return { dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400' };
    case 'Refusé':     return { dot: 'bg-rose-500',    badge: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-400' };
    case 'En attente': return { dot: 'bg-amber-400',   badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400' };
    default:           return { dot: 'bg-slate-300',   badge: 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400' };
  }
};

const parseFrDate = (str) => {
  if (!str || str === '—') return null;
  const p = str.split('/');
  if (p.length !== 3) return null;
  return new Date(parseInt(p[2]), parseInt(p[1]) - 1, parseInt(p[0]));
};

// ── Loading Skeleton ──────────────────────────────────────────────────────────
const TableSkeleton = () => (
  <div className="space-y-3 p-6">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
    ))}
  </div>
);

// ── KPI Card ─────────────────────────────────────────────────────────────────
const KpiCard = ({ label, value, icon: Icon, iconBg, iconColor, loading, highlight }) => (
  <div className={`bg-white dark:bg-slate-900 p-6 rounded-[2rem] border shadow-sm transition-all hover:scale-[1.02] hover:shadow-md group
    ${highlight ? 'border-teal-200 dark:border-teal-800' : 'border-slate-100 dark:border-slate-800'}`}>
    <div className={`inline-flex items-center justify-center h-11 w-11 rounded-xl mb-4 ${iconBg} transition-transform group-hover:rotate-6`}>
      <Icon className={`h-5 w-5 ${iconColor}`} />
    </div>
    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{label}</p>
    {loading
      ? <div className="h-7 w-16 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
      : <p className={`text-2xl font-black tracking-tight ${highlight ? 'text-teal-600' : 'text-slate-900 dark:text-white'}`}>{value}</p>
    }
  </div>
);

// ── Donut SVG (CSS-only) ─────────────────────────────────────────────────────
const DonutChart = ({ segments }) => {
  let offset = 25;
  const r = 38, C = 2 * Math.PI * r;
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  return (
    <svg viewBox="0 0 100 100" className="w-40 h-40 -rotate-90">
      <circle cx="50" cy="50" r={r} fill="none" stroke="#f1f5f9" strokeWidth="14" />
      {total === 0
        ? <circle cx="50" cy="50" r={r} fill="none" stroke="#e2e8f0" strokeWidth="14" />
        : segments.map((seg, i) => {
            const pct   = seg.value / total;
            const dash  = pct * C;
            const gap   = C - dash;
            const el = (
              <circle key={i} cx="50" cy="50" r={r} fill="none"
                stroke={seg.color} strokeWidth="14"
                strokeDasharray={`${dash} ${gap}`}
                strokeDashoffset={-offset * C / 100}
                strokeLinecap="butt"
              />
            );
            offset += pct * 100;
            return el;
          })
      }
    </svg>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
const TrainerStagiairesPage = () => {
  const { t } = useTranslation();
  const [viewMode, setViewMode]           = useState('list');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [activeStudent, setActiveStudent] = useState(null);
  const [isFilterOpen, setIsFilterOpen]   = useState(false);
  const [studentsData, setStudentsData]   = useState([]);
  const [loading, setLoading]             = useState(true);
  const [searchTerm, setSearchTerm]       = useState('');
  const [statusFilter, setStatusFilter]   = useState('Tous');
  const [refreshKey, setRefreshKey]       = useState(0);
  const [actionLoading, setActionLoading] = useState(false); // chargement action statut

  // ── Fetch ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const user = JSON.parse(localStorage.getItem('brn_user') || '{}');
        const data = await fetchCandidats(user.id);
        setStudentsData(data);
      } catch (err) {
        console.error('Erreur chargement stagiaires:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [refreshKey]);

  // ── KPIs dynamiques ───────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const total    = studentsData.length;
    const acceptes = studentsData.filter(s => normalizeStatut(s.statut) === 'Accepté').length;
    const attente  = studentsData.filter(s => normalizeStatut(s.statut) === 'En attente').length;
    const refuses  = studentsData.filter(s => normalizeStatut(s.statut) === 'Refusé').length;
    const now      = new Date();
    const ceMois   = studentsData.filter(s => {
      const d = parseFrDate(s.dateInscription);
      return d && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    const taux = total > 0 ? Math.round((acceptes / total) * 100) : 0;

    return [
      { label: 'Total Inscrits',      value: total,      icon: UserGroupIcon,     iconBg: 'bg-indigo-50 dark:bg-indigo-900/20',  iconColor: 'text-indigo-600' },
      { label: 'Acceptés',            value: acceptes,   icon: CheckCircleIcon,   iconBg: 'bg-emerald-50 dark:bg-emerald-900/20', iconColor: 'text-emerald-600' },
      { label: 'En Attente',          value: attente,    icon: ClockIcon,         iconBg: 'bg-amber-50 dark:bg-amber-900/20',    iconColor: 'text-amber-500' },
      { label: 'Refusés',             value: refuses,    icon: XCircleIcon,       iconBg: 'bg-rose-50 dark:bg-rose-900/20',      iconColor: 'text-rose-500' },
      { label: 'Inscrits ce Mois',    value: ceMois,     icon: CalendarIcon,      iconBg: 'bg-violet-50 dark:bg-violet-900/20',  iconColor: 'text-violet-600' },
      { label: "Taux d'Acceptation",  value: `${taux}%`, icon: ArrowTrendingUpIcon, iconBg: 'bg-teal-50 dark:bg-teal-900/20',   iconColor: 'text-teal-600', highlight: true },
    ];
  }, [studentsData]);

  // ── Filtrage ──────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...studentsData];
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(s =>
        (s.name  || '').toLowerCase().includes(q) ||
        (s.prenom|| '').toLowerCase().includes(q) ||
        (s.email || '').toLowerCase().includes(q) ||
        (s.adresse || '').toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'Tous') {
      list = list.filter(s => normalizeStatut(s.statut) === statusFilter);
    }
    return list;
  }, [studentsData, searchTerm, statusFilter]);

  // ── Changer statut inscription → met à jour studentsData → KPIs recalculés immédiatement
  const handleStatutChange = async (inscriptionId, newStatut) => {
    // 1. Sauvegarde ancienne valeur pour revert si erreur
    const previous = studentsData.find(s => s.id === inscriptionId)?.statut;

    // 2. Mise à jour optimiste : UI réagit IMMÉDIATEMENT, KPIs aussi
    const applyUpdate = (statut) => {
      setStudentsData(prev => prev.map(s => s.id === inscriptionId ? { ...s, statut } : s));
      setActiveStudent(prev => prev?.id === inscriptionId ? { ...prev, statut } : prev);
    };
    applyUpdate(newStatut);
    setActionLoading(true);

    // 3. Appel API en arrière-plan
    try {
      if (newStatut === 'accepte') {
        await api.post(`/app/demandes/candidats/accepter/${inscriptionId}`);
      } else if (newStatut === 'refuse') {
        await api.post(`/app/demandes/candidats/refuser/${inscriptionId}`);
      }
      // 'en_attente' : pas d'endpoint dédié, la mise à jour UI suffit
    } catch (err) {
      console.error('Erreur changement statut:', err);
      applyUpdate(previous); // revert si échec
    } finally {
      setActionLoading(false);
    }
  };

  const toggleSelect = (id) =>
    setSelectedStudents(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const toggleAll = () =>
    setSelectedStudents(prev => prev.length === filtered.length ? [] : filtered.map(s => s.id));

  // ── Insights IA calculés depuis les données réelles ────────────────────────
  const iaInsights = useMemo(() => {
    const total     = studentsData.length;
    const acceptes  = studentsData.filter(s => normalizeStatut(s.statut) === 'Accepté').length;
    const enAttente = studentsData.filter(s => normalizeStatut(s.statut) === 'En attente').length;
    const refuses   = studentsData.filter(s => normalizeStatut(s.statut) === 'Refusé').length;
    const tauxActuel   = total > 0 ? Math.round((acceptes / total) * 100) : 0;
    const tauxPotentiel = total > 0 ? Math.round(((acceptes + enAttente) / total) * 100) : 0;
    const gain = tauxPotentiel - tauxActuel;

    const now = new Date();
    const vieux = studentsData.filter(s => {
      if (normalizeStatut(s.statut) !== 'En attente') return false;
      const d = parseFrDate(s.dateInscription);
      return d && (now - d) > 7 * 24 * 60 * 60 * 1000;
    }).length;

    return { total, acceptes, enAttente, refuses, tauxActuel, tauxPotentiel, gain, vieux };
  }, [studentsData]);

  // ── Analytics data ────────────────────────────────────────────────────────
  const analyticsData = useMemo(() => {
    const total    = studentsData.length;
    const acceptes = studentsData.filter(s => normalizeStatut(s.statut) === 'Accepté').length;
    const attente  = studentsData.filter(s => normalizeStatut(s.statut) === 'En attente').length;
    const refuses  = studentsData.filter(s => normalizeStatut(s.statut) === 'Refusé').length;
    const autres   = total - acceptes - attente - refuses;

    const donut = [
      { label: 'Acceptés',    value: acceptes, color: '#10b981', pct: total ? Math.round(acceptes/total*100) : 0 },
      { label: 'En attente',  value: attente,  color: '#f59e0b', pct: total ? Math.round(attente/total*100)  : 0 },
      { label: 'Refusés',     value: refuses,  color: '#f43f5e', pct: total ? Math.round(refuses/total*100)  : 0 },
      { label: 'Autres',      value: autres,   color: '#94a3b8', pct: total ? Math.round(autres/total*100)   : 0 },
    ].filter(d => d.value > 0);

    // Inscriptions par mois (derniers 6 mois)
    const now    = new Date();
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return { label: d.toLocaleDateString('fr-FR', { month: 'short' }), month: d.getMonth(), year: d.getFullYear(), count: 0 };
    });
    studentsData.forEach(s => {
      const d = parseFrDate(s.dateInscription);
      if (!d) return;
      const m = months.find(x => x.month === d.getMonth() && x.year === d.getFullYear());
      if (m) m.count++;
    });
    const maxCount = Math.max(...months.map(m => m.count), 1);

    return { donut, months, maxCount, total };
  }, [studentsData]);

  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <DashboardLayout role="formateur">
      <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0b0f19] font-['Inter'] pb-20 transition-colors duration-700">

        {/* ── DRAWER profil ── */}
        {activeStudent && (
          <div className="fixed inset-0 z-[100] flex justify-end animate-in fade-in duration-300">
            <div onClick={() => setActiveStudent(null)} className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
            <div className="relative w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-400 flex flex-col overflow-hidden">

              {/* Drawer header */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 text-white shrink-0">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-teal-600 flex items-center justify-center text-xl font-black shadow-lg shadow-teal-600/30 overflow-hidden">
                      <img src={activeStudent.avatar} alt="" className="h-full w-full object-cover" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black tracking-tight leading-none mb-1">
                        {activeStudent.name} {activeStudent.prenom}
                      </h2>
                      <p className="text-[10px] font-bold text-slate-400 leading-none">{activeStudent.email}</p>
                    </div>
                  </div>
                  <button onClick={() => setActiveStudent(null)} className="p-2 hover:bg-white/10 rounded-xl transition-all">
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                {/* Statut badge */}
                <span className={`inline-flex items-center gap-1.5 text-[9px] font-black px-3 py-1.5 rounded-xl border uppercase tracking-widest ${statutCfg(activeStudent.statut).badge}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${statutCfg(activeStudent.statut).dot}`} />
                  {normalizeStatut(activeStudent.statut)}
                </span>
              </div>

              {/* Drawer body */}
              <div className="flex-1 overflow-y-auto p-8 space-y-6">

                {/* Boutons changement de statut — chaque clic met à jour les KPI instantanément */}
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">{t('common.change_status')}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleStatutChange(activeStudent.id, 'accepte')}
                      disabled={actionLoading || activeStudent.statut === 'accepte'}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all
                        ${activeStudent.statut === 'accepte'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-900/20 dark:border-emerald-800'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-600 dark:hover:bg-emerald-900/20'}
                        disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <CheckIcon className="h-3.5 w-3.5" />
                      {t('common.accept')}
                    </button>
                    <button
                      onClick={() => handleStatutChange(activeStudent.id, 'en_attente')}
                      disabled={actionLoading || activeStudent.statut === 'en_attente'}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all
                        ${activeStudent.statut === 'en_attente'
                          ? 'bg-amber-50 border-amber-200 text-amber-600 dark:bg-amber-900/20 dark:border-amber-800'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-600 dark:hover:bg-amber-900/20'}
                        disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <ClockIcon className="h-3.5 w-3.5" />
                      {t('common.waiting')}
                    </button>
                    <button
                      onClick={() => handleStatutChange(activeStudent.id, 'refuse')}
                      disabled={actionLoading || activeStudent.statut === 'refuse'}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all
                        ${activeStudent.statut === 'refuse'
                          ? 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-900/20 dark:border-rose-800'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-600 dark:hover:bg-rose-900/20'}
                        disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <NoSymbolIcon className="h-3.5 w-3.5" />
                      {t('common.refuse')}
                    </button>
                  </div>
                  {actionLoading && (
                    <p className="text-[9px] text-slate-400 text-center mt-2 animate-pulse">{t('common.updating')}</p>
                  )}
                </div>

                {/* Info grid */}
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { icon: IdentificationIcon, label: 'Prénom',             value: activeStudent.prenom || '—' },
                    { icon: EnvelopeIcon,        label: 'Email',              value: activeStudent.email },
                    { icon: MapPinIcon,          label: 'Adresse',            value: activeStudent.adresse || '—' },
                    { icon: PhoneIcon,           label: 'Téléphone',          value: activeStudent.telephone || '—' },
                    { icon: BriefcaseIcon,       label: 'Situation',          value: activeStudent.situation || '—' },
                    { icon: IdentificationIcon,  label: 'État Civil',         value: activeStudent.etatCivil || '—' },
                    { icon: CalendarIcon,        label: "Date d'inscription",  value: activeStudent.dateInscription || '—' },
                  ].map(row => (
                    <div key={row.label} className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800 rounded-2xl px-5 py-4 border border-slate-100 dark:border-slate-700">
                      <div className="h-9 w-9 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center shrink-0 shadow-sm border border-slate-100 dark:border-slate-600">
                        <row.icon className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">{row.label}</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[220px]">{row.value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Timeline */}
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Historique</p>
                  <div className="space-y-2">
                    {[
                      { label: 'Inscription enregistrée',  date: activeStudent.dateInscription, color: 'teal' },
                      { label: `Statut: ${normalizeStatut(activeStudent.statut)}`, date: '—', color: 'indigo' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3 py-2">
                        <div className={`h-2 w-2 rounded-full bg-${item.color}-500 shrink-0`} />
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex-1">{item.label}</span>
                        <span className="text-[10px] text-slate-400">{item.date}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Drawer footer */}
              <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex gap-3 shrink-0">
                <a
                  href={`mailto:${activeStudent.email}`}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-teal-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-teal-600/20 hover:bg-teal-500 transition-all"
                >
                  <EnvelopeIcon className="h-4 w-4" />
                  Contacter
                </a>
                <button
                  onClick={() => { navigator.clipboard.writeText(activeStudent.email); }}
                  className="p-3.5 bg-slate-100 dark:bg-slate-800 rounded-2xl text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
                  title="Copier l'email"
                >
                  <ArrowTopRightOnSquareIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── HEADER ── */}
        <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 p-6">
          <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row items-center justify-between gap-5">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] font-black text-teal-600 dark:text-teal-400 uppercase tracking-[0.3em]">{t('common.personal_space')}</span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">{t('common.my_trainees')}</h1>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setRefreshKey(k => k + 1)}
                className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-xl hover:text-teal-600 transition-all"
                title="Actualiser"
              >
                <ArrowPathIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-xl hover:text-indigo-600 transition-all" title="Exporter CSV">
                <ArrowDownTrayIcon className="h-5 w-5" />
              </button>
              <button className="flex items-center gap-2 px-5 py-3 bg-teal-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-teal-500 transition-all shadow-lg shadow-teal-600/20">
                <PlusIcon className="h-4 w-4" /> Ajouter
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-[1600px] mx-auto px-6 py-8 space-y-8">

          {/* ── 6 KPIs dynamiques ── */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {kpis.map((kpi, i) => (
              <KpiCard key={i} {...kpi} loading={loading} />
            ))}
          </div>

          {/* ── Barre recherche + filtres ── */}
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">

              <div className="flex items-center gap-3 w-full md:w-auto flex-1">
                {/* Recherche */}
                <div className="relative flex-1 max-w-sm">
                  <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Nom, email, adresse..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl pl-11 pr-4 py-2.5 text-sm font-medium dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                  />
                </div>

                {/* Filtre statut */}
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl pl-4 pr-8 py-2.5 text-sm font-bold dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all cursor-pointer"
                  >
                    {['Tous', 'Accepté', 'En attente', 'Refusé'].map(s => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                  <ChevronDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                </div>

                <button
                  onClick={() => setIsFilterOpen(p => !p)}
                  className={`p-2.5 rounded-xl border transition-all ${isFilterOpen ? 'bg-teal-600 text-white border-teal-600' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-100 dark:border-slate-700 hover:border-teal-400'}`}
                >
                  <FunnelIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Vue toggle + compteur */}
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {loading ? '…' : `${filtered.length} résultat${filtered.length !== 1 ? 's' : ''}`}
                </span>
                <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex">
                  {['list', 'analytics'].map(mode => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === mode ? 'bg-white dark:bg-slate-700 text-teal-600 shadow-sm' : 'text-slate-400'}`}
                    >
                      {mode === 'list' ? 'Liste' : 'Analytique'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Filtres avancés */}
            {isFilterOpen && (
              <div className="bg-white dark:bg-slate-900 p-6 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 shadow-inner grid grid-cols-2 md:grid-cols-4 gap-4 animate-in slide-in-from-top-2 duration-300">
                {[
                  { label: 'Mois inscription', opts: ['Tous les mois', 'Ce mois', 'Mois dernier'] },
                  { label: 'Adresse',          opts: ['Toutes', 'Alger', 'Oran', 'Constantine', 'Annaba'] },
                  { label: 'Trier par',        opts: ['Plus récent', 'Plus ancien', 'Nom A→Z', 'Nom Z→A'] },
                  { label: 'Par page',         opts: ['10', '25', '50', 'Tous'] },
                ].map(f => (
                  <div key={f.label}>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{f.label}</label>
                    <select className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-bold dark:text-white focus:ring-2 focus:ring-teal-500 outline-none">
                      {f.opts.map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Bulk actions ── */}
          {selectedStudents.length > 0 && (
            <div className="bg-teal-600 px-6 py-4 rounded-[1.5rem] flex items-center justify-between animate-in slide-in-from-top-2 duration-300 shadow-xl shadow-teal-600/20">
              <p className="text-[10px] font-black text-white uppercase tracking-widest">
                {selectedStudents.length} sélectionné{selectedStudents.length > 1 ? 's' : ''}
              </p>
              <div className="flex gap-2">
                {[
                  { icon: EnvelopeIcon,     label: 'Message collectif' },
                  { icon: TrophyIcon,       label: t('common.assign_badge') },
                  { icon: ArrowDownTrayIcon,label: t('common.export_csv') },
                ].map(a => (
                  <button key={a.label} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">
                    <a.icon className="h-4 w-4" /> {a.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── CONTENT ── */}
          {viewMode === 'list' ? (
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
              {loading ? (
                <TableSkeleton />
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="h-16 w-16 bg-slate-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center mb-4 border border-slate-100 dark:border-slate-700">
                    <UserGroupIcon className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                  </div>
                  <p className="text-sm font-black text-slate-400 mb-1">{t('common.no_trainee')}</p>
                  <p className="text-xs text-slate-300 dark:text-slate-600">
                    {searchTerm || statusFilter !== 'Tous' ? t('common.adjust_filters') : t('common.no_trainee_enrolled')}
                  </p>
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800">
                    <tr>
                      <th className="px-6 py-5 w-10">
                        <input
                          type="checkbox"
                          checked={selectedStudents.length === filtered.length && filtered.length > 0}
                          onChange={toggleAll}
                          className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                        />
                      </th>
                      {['Stagiaire', 'Email', 'Adresse', 'Statut', 'Inscription', 'Actions'].map(h => (
                        <th key={h} className="px-6 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                    {filtered.map(student => (
                      <tr
                        key={student.id}
                        onClick={() => setActiveStudent(student)}
                        className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-all cursor-pointer group ${selectedStudents.includes(student.id) ? 'bg-teal-50/40 dark:bg-teal-900/10' : ''}`}
                      >
                        {/* Checkbox */}
                        <td className="px-6 py-5" onClick={e => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedStudents.includes(student.id)}
                            onChange={() => toggleSelect(student.id)}
                            className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                          />
                        </td>

                        {/* Nom */}
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            <div className="relative h-10 w-10 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-700 shrink-0">
                              <img src={student.avatar} alt="" className="h-full w-full object-cover" />
                              <span className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-slate-900 ${statutCfg(student.statut).dot}`} />
                            </div>
                            <div>
                              <p className="text-sm font-black text-slate-900 dark:text-white leading-none mb-1">
                                {student.name}
                              </p>
                              <p className="text-[10px] font-medium text-slate-400">{student.prenom}</p>
                            </div>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="px-6 py-5">
                          <p className="text-xs font-bold text-slate-600 dark:text-slate-300">{student.email}</p>
                        </td>

                        {/* Adresse */}
                        <td className="px-6 py-5">
                          <p className="text-xs text-slate-500 dark:text-slate-400">{student.adresse || '—'}</p>
                        </td>

                        {/* Statut */}
                        <td className="px-6 py-5">
                          <span className={`inline-flex items-center gap-1.5 text-[9px] font-black px-3 py-1.5 rounded-xl border uppercase tracking-widest ${statutCfg(student.statut).badge}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${statutCfg(student.statut).dot} shrink-0`} />
                            {normalizeStatut(student.statut)}
                          </span>
                        </td>

                        {/* Date */}
                        <td className="px-6 py-5">
                          <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">{student.dateInscription}</p>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-5" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center gap-2">
                            <a href={`mailto:${student.email}`}
                              className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-teal-600 rounded-xl transition-all border border-slate-100 dark:border-slate-700"
                              title="Envoyer un email"
                            >
                              <ChatBubbleLeftRightIcon className="h-4 w-4" />
                            </a>
                            <button
                              className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-indigo-600 rounded-xl transition-all border border-slate-100 dark:border-slate-700"
                              title="Voir le profil"
                              onClick={() => setActiveStudent(student)}
                            >
                              <AdjustmentsVerticalIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

          ) : (
            /* ── VUE ANALYTIQUE ── */
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Donut statuts */}
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col">
                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Répartition des Statuts</h5>
                  <div className="flex-1 flex items-center justify-center gap-8">
                    <div className="relative">
                      <DonutChart segments={analyticsData.donut} />
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <p className="text-2xl font-black text-slate-900 dark:text-white leading-none">{analyticsData.total}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Total</p>
                      </div>
                    </div>
                    <div className="space-y-2.5">
                      {analyticsData.donut.map((d, i) => (
                        <div key={i} className="flex items-center gap-2.5">
                          <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">{d.label}</span>
                          <span className="text-[11px] font-black text-slate-900 dark:text-white ml-auto pl-4">{d.pct}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Histogramme inscriptions / mois */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">Inscriptions — 6 Derniers Mois</h5>
                  <div className="h-44 flex items-end gap-3">
                    {analyticsData.months.map((m, i) => {
                      const pct = analyticsData.maxCount > 0 ? (m.count / analyticsData.maxCount) * 100 : 0;
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                          <span className="text-[9px] font-black text-teal-600 opacity-0 group-hover:opacity-100 transition-opacity">{m.count}</span>
                          <div
                            className="w-full rounded-t-xl bg-teal-500/20 hover:bg-teal-500 transition-all duration-500 cursor-pointer"
                            style={{ height: `${Math.max(pct, 4)}%` }}
                          />
                          <span className="text-[9px] font-black text-slate-400 uppercase">{m.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Top 5 récents */}
              <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Dernières Inscriptions</h5>
                {loading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => <div key={i} className="h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />)}
                  </div>
                ) : studentsData.length === 0 ? (
                  <p className="text-sm text-slate-400 italic text-center py-6">Aucune donnée disponible.</p>
                ) : (
                  <div className="divide-y divide-slate-50 dark:divide-slate-800">
                    {[...studentsData]
                      .sort((a, b) => {
                        const da = parseFrDate(a.dateInscription);
                        const db = parseFrDate(b.dateInscription);
                        return (db || 0) - (da || 0);
                      })
                      .slice(0, 5)
                      .map(s => (
                        <div key={s.id} className="flex items-center gap-4 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 -mx-2 px-2 rounded-xl transition-all cursor-pointer" onClick={() => { setActiveStudent(s); setViewMode('list'); }}>
                          <img src={s.avatar} alt="" className="h-9 w-9 rounded-xl object-cover border border-slate-100 dark:border-slate-700" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-slate-900 dark:text-white truncate">{s.name} {s.prenom}</p>
                            <p className="text-[10px] text-slate-400 truncate">{s.email}</p>
                          </div>
                          <span className={`text-[9px] font-black px-2.5 py-1 rounded-lg border uppercase tracking-widest shrink-0 ${statutCfg(s.statut).badge}`}>
                            {normalizeStatut(s.statut)}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 shrink-0">{s.dateInscription}</span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Bloc Insights — 100% données réelles ── */}
          {!loading && iaInsights.total > 0 && (
            <div className="bg-slate-900 p-10 rounded-[3rem] border border-white/5 relative overflow-hidden group shadow-2xl">
              <div className="absolute top-0 left-0 h-full w-1 bg-gradient-to-b from-teal-500 to-indigo-500 rounded-l-[3rem]" />
              <div className="absolute top-0 right-0 h-40 w-40 bg-teal-500/10 blur-[80px] pointer-events-none group-hover:bg-teal-500/20 transition-all duration-700" />
              <div className="relative z-10 flex flex-col lg:flex-row items-start gap-10">

                {/* Icône */}
                <div className="h-20 w-20 bg-white/5 rounded-[2rem] flex items-center justify-center border border-white/10 group-hover:rotate-12 transition-transform shrink-0">
                  <SparklesIcon className="h-10 w-10 text-teal-400" />
                </div>

                {/* Texte dynamique */}
                <div className="flex-1">
                  <p className="text-[9px] font-black text-teal-400 uppercase tracking-widest mb-2">Analyse · Données réelles</p>
                  <h4 className="text-xl font-black text-white tracking-tight mb-4">
                    {iaInsights.enAttente === 0
                      ? 'Tous les dossiers sont traités !'
                      : `${iaInsights.enAttente} dossier${iaInsights.enAttente > 1 ? 's' : ''} en attente de décision`}
                  </h4>

                  {/* Stats réelles en ligne */}
                  <div className="flex flex-wrap gap-4 mb-4">
                    {[
                      { label: 'Total inscrits',    value: iaInsights.total,      color: 'text-white' },
                      { label: 'Taux actuel',        value: `${iaInsights.tauxActuel}%`,   color: 'text-teal-400' },
                      { label: 'Potentiel max',      value: `${iaInsights.tauxPotentiel}%`, color: 'text-emerald-400' },
                      { label: 'Gain possible',      value: iaInsights.gain > 0 ? `+${iaInsights.gain}%` : '—', color: 'text-amber-400' },
                      ...(iaInsights.vieux > 0 ? [{ label: `En att. > 7j`, value: iaInsights.vieux, color: 'text-rose-400' }] : []),
                    ].map(stat => (
                      <div key={stat.label} className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 min-w-[80px]">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                        <p className={`text-lg font-black ${stat.color}`}>{stat.value}</p>
                      </div>
                    ))}
                  </div>

                  <p className="text-sm text-slate-400 leading-relaxed max-w-2xl">
                    {iaInsights.enAttente === 0 && iaInsights.refuses === 0
                      ? `Excellent suivi ! Tous vos ${iaInsights.acceptes} stagiaires sont acceptés.`
                      : iaInsights.enAttente > 0 && iaInsights.gain > 0
                        ? `Accepter les ${iaInsights.enAttente} dossier${iaInsights.enAttente > 1 ? 's' : ''} en attente ferait passer votre taux d'acceptation de ${iaInsights.tauxActuel}% à ${iaInsights.tauxPotentiel}% (+${iaInsights.gain}%).${iaInsights.vieux > 0 ? ` ${iaInsights.vieux} dossier${iaInsights.vieux > 1 ? 's' : ''} attendent depuis plus de 7 jours.` : ''}`
                        : `Votre taux d'acceptation est de ${iaInsights.tauxActuel}% sur ${iaInsights.total} inscription${iaInsights.total > 1 ? 's' : ''}.`
                    }
                  </p>
                </div>

                {/* Bouton action */}
                {iaInsights.enAttente > 0 && (
                  <button
                    onClick={() => setStatusFilter('En attente')}
                    className="px-8 py-4 bg-teal-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-teal-500 transition-all shadow-xl shadow-teal-600/20 shrink-0 self-center"
                  >
                    Voir les {iaInsights.enAttente} en attente
                  </button>
                )}
              </div>
            </div>
          )}

        </main>
      </div>
    </DashboardLayout>
  );
};

export default TrainerStagiairesPage;
