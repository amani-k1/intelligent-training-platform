// src/pages/Trainer/MesFormations/FormationDetailDashboard.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from '../../../context/LanguageContext';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  Title, Tooltip, Legend, Filler, ArcElement, BarElement,
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
  ArrowLeftIcon,
  UserGroupIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  ClockIcon,
  AcademicCapIcon,
  CalendarIcon,
  ChatBubbleLeftRightIcon,
  AdjustmentsVerticalIcon,
  MegaphoneIcon,
  PencilSquareIcon,
  CheckCircleIcon,
  TrophyIcon,
  PlusIcon,
  ArrowRightIcon,
  ExclamationCircleIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  BoltIcon,
  TagIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import api from '../../../api/axios';
import { fetchFormationsDetaill, fetchResources, uploadResource, deleteResource } from '../../../services/Formationservice';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  Title, Tooltip, Legend, Filler, ArcElement, BarElement,
);

// ─── helpers ─────────────────────────────────────────────────────────────────
const fmtRevenu = (v) => {
  if (!v && v !== 0) return '—';
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M DZD`;
  if (v >= 1_000)     return `${(v / 1_000).toFixed(1)}K DZD`;
  return `${v} DZD`;
};

const statutBadge = (s) => ({
  accepte:   'bg-emerald-50 text-emerald-600 border-emerald-100',
  refuse:    'bg-rose-50 text-rose-600 border-rose-100',
  en_attente:'bg-amber-50 text-amber-600 border-amber-100',
}[s] ?? 'bg-slate-50 text-slate-500 border-slate-100');

const STATUT_KEYS = { accepte: 'status_accepted_short', refuse: 'status_refused_short', en_attente: 'status_pending_short' };

const EmptyChart = () => {
  const { t } = useTranslation();
  return (
    <div className="h-full flex flex-col items-center justify-center gap-2 text-slate-300">
      <ChartBarIcon className="h-10 w-10 opacity-40" />
      <p className="text-[10px] font-black uppercase tracking-widest">{t('common.no_data')}</p>
    </div>
  );
};

// ─── main component ───────────────────────────────────────────────────────────
const FormationDetailDashboard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, lang } = useTranslation();
  const [activeTab, setActiveTab] = useState('overview');
  const [formation, setFormation] = useState(null);
  const [candidats, setCandidats] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [fData, cRes] = await Promise.all([
        fetchFormationsDetaill(id),
        api.get(`/app/formations/${id}/candidats`),
      ]);
      setFormation(fData);
      const raw = Array.isArray(cRes.data) ? cRes.data : cRes.data?.data ?? [];
      setCandidats(raw);
    } catch {
      setError(t('common.error_load'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const kpis = useMemo(() => {
    const total     = candidats.length;
    const acceptes  = candidats.filter(c => c.statut === 'accepte').length;
    const enAttente = candidats.filter(c => c.statut === 'en_attente').length;
    const refuses   = candidats.filter(c => c.statut === 'refuse').length;
    const revenus   = parseFloat(formation?.prix ?? 0) * acceptes;
    const taux      = total > 0 ? Math.round((acceptes / total) * 100) : 0;
    return { total, acceptes, enAttente, refuses, revenus, taux };
  }, [formation, candidats]);

  // Inscriptions par jour de semaine (lundi=0)
  const chartData = useMemo(() => {
    const labels = lang === 'en'
      ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      : ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    const inscrits = Array(7).fill(0);
    const acceptes = Array(7).fill(0);
    candidats.forEach(c => {
      const d = new Date(c.created_at);
      if (!isNaN(d)) {
        const idx = (d.getDay() + 6) % 7;
        inscrits[idx]++;
        if (c.statut === 'accepte') acceptes[idx]++;
      }
    });
    return { labels, inscrits, acceptes };
  }, [candidats]);

  if (loading) return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0b0f19] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">{t('common.loading')}</p>
      </div>
    </div>
  );

  if (error || !formation) return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0b0f19] flex items-center justify-center">
      <div className="text-center space-y-4">
        <ExclamationCircleIcon className="h-16 w-16 text-rose-400 mx-auto" />
        <p className="text-xl font-black text-slate-700 dark:text-white">{error ?? t('common.formation_not_found')}</p>
        <button onClick={() => navigate(-1)} className="px-6 py-3 bg-teal-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest">{t('common.back')}</button>
      </div>
    </div>
  );

  const titre = formation.title || formation.titre || 'Formation';

  const tabs = [
    { key: 'overview',       label: t('common.tab_overview'),       icon: ChartBarIcon           },
    { key: 'trainees',       label: t('common.tab_trainees'),       icon: UserGroupIcon           },
    { key: 'content',        label: t('common.tab_content'),        icon: AcademicCapIcon         },
    { key: 'badges',         label: t('common.badges'),             icon: TrophyIcon              },
    { key: 'communication',  label: t('common.tab_communication'),  icon: ChatBubbleLeftRightIcon },
    { key: 'stats',          label: t('common.tab_stats'),          icon: AdjustmentsVerticalIcon },
    { key: 'settings',       label: t('common.tab_settings_label'), icon: PencilSquareIcon        },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0b0f19] transition-colors duration-700 font-['Inter'] pb-20">

      {/* ── HEADER ── */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate('/dashboard/formateur/formations')}
              className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl hover:bg-teal-600 hover:text-white transition-all shadow-sm"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black text-teal-600 dark:text-teal-400 uppercase tracking-widest leading-none">{t('common.formation_detail_label')}</span>
                <span className="h-1 w-1 bg-slate-300 rounded-full"></span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{formation.domaine ?? '—'}</span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">{titre}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
              formation.statut === 'En cours'
                ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-600 border-teal-100'
                : formation.statut === 'Complet'
                  ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 border-indigo-100'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200'
            }`}>
              {formation.statut ?? '—'}
            </span>
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 mx-1"></div>
            <button onClick={load} title={t('common.refresh')} className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 hover:text-teal-500 transition-all shadow-sm">
              <ArrowRightIcon className="h-5 w-5 -rotate-90" />
            </button>
            <button className="px-6 py-2.5 bg-slate-900 dark:bg-teal-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-teal-700 transition-all shadow-xl shadow-teal-600/10">
              {t('common.launch_live_session')}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 py-10">

        {/* ── KPI CARDS ── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-10">
          {[
            { label: t('common.total_enrolled'),      value: kpis.total,              icon: UserGroupIcon,    color: 'text-indigo-600', tab: 'trainees' },
            { label: t('common.accepted_count'),      value: kpis.acceptes,           icon: CheckCircleIcon,  color: 'text-teal-600',   tab: 'trainees' },
            { label: t('common.pending_count'),       value: kpis.enAttente,          icon: ClockIcon,        color: 'text-amber-500',  tab: 'trainees' },
            { label: t('common.kpi_revenue'),         value: fmtRevenu(kpis.revenus), icon: BanknotesIcon,    color: 'text-emerald-600',tab: 'stats'    },
            { label: t('common.kpi_acceptance_rate'), value: `${kpis.taux}%`,         icon: ChartBarIcon,     color: 'text-rose-500',   tab: 'stats'    },
          ].map((kpi, i) => (
            <div
              key={i}
              onClick={() => setActiveTab(kpi.tab)}
              className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:border-teal-500 hover:scale-[1.04] cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-3">
                <kpi.icon className={`h-5 w-5 ${kpi.color} group-hover:rotate-12 transition-transform`} />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">{kpi.label}</p>
              <p className="text-xl font-black text-slate-900 dark:text-white leading-none">{kpi.value}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row gap-8">

          {/* ── MAIN CONTENT ── */}
          <div className="flex-1">
            {/* Tabs bar */}
            <div className="bg-white dark:bg-slate-900 p-2 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm mb-8 flex overflow-x-auto no-scrollbar">
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                    activeTab === tab.key
                      ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/30'
                      : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 p-10 min-h-[600px] shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
              {activeTab === 'overview'      && <OverviewTab      formation={formation} candidats={candidats} chartData={chartData} kpis={kpis} />}
              {activeTab === 'trainees'      && <StagiairesTab    formation={formation} candidats={candidats} onRefresh={load} />}
              {activeTab === 'content'       && <ContenuTab formationId={id} />}
              {activeTab === 'badges'        && <BadgesTab />}
              {activeTab === 'communication' && <CommunicationTab candidats={candidats} />}
              {activeTab === 'stats'         && <StatsTab         candidats={candidats} formation={formation} kpis={kpis} />}
              {activeTab === 'settings'      && <SettingsTab      formation={formation} onRefresh={load} />}
            </div>
          </div>

          {/* ── SIDEBAR ── */}
          <aside className="w-full lg:w-80 flex flex-col gap-6">

            {/* Formation Info */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-5">
              <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest leading-none">{t('common.formation_details_label')}</p>
              {[
                { icon: TagIcon,         label: t('common.domain_label'),   val: formation.domaine ?? '—'                       },
                { icon: AcademicCapIcon, label: t('common.level'),          val: formation.niveau ?? '—'                        },
                { icon: ClockIcon,       label: t('common.duration_label'), val: formation.duree ? `${formation.duree}h` : '—'  },
                { icon: BanknotesIcon,   label: t('common.price_label'),    val: formation.prix ? `${formation.prix} DZD` : '—' },
                { icon: UserGroupIcon,   label: t('common.spots_label'),    val: formation.places_totales ?? '—'                },
              ].map(row => (
                <div key={row.label} className="flex items-center gap-3">
                  <div className="h-9 w-9 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center shrink-0">
                    <row.icon className="h-4 w-4 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">{row.label}</p>
                    <p className="text-sm font-black dark:text-white leading-none mt-0.5">{row.val}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Dates */}
            {(formation.date_debut || formation.date_fin) && (
              <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <CalendarIcon className="h-4 w-4 text-teal-600" />
                  <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest leading-none">{t('common.planning_label')}</p>
                </div>
                {formation.date_debut && (
                  <div className="relative pl-6 border-l-2 border-teal-500">
                    <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-teal-500 border-4 border-white dark:border-slate-900"></div>
                    <p className="text-[9px] font-black text-teal-600 uppercase tracking-widest">{t('common.start_label')}</p>
                    <p className="text-sm font-black dark:text-white">{new Date(formation.date_debut).toLocaleDateString(lang === 'en' ? 'en-US' : 'fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                )}
                {formation.date_fin && (
                  <div className="relative pl-6 border-l-2 border-slate-200 dark:border-slate-700">
                    <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-slate-300 border-4 border-white dark:border-slate-900"></div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('common.end_date_label')}</p>
                    <p className="text-sm font-black dark:text-white">{new Date(formation.date_fin).toLocaleDateString(lang === 'en' ? 'en-US' : 'fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                )}
              </div>
            )}

            {/* Répartition candidats */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 leading-none">{t('common.candidates_distribution')}</p>
              {kpis.total === 0 ? (
                <p className="text-sm text-slate-400 font-bold text-center py-6">{t('common.no_candidate_simple')}</p>
              ) : (
                <div className="space-y-3">
                  {[
                    { label: t('common.accepted_count'), count: kpis.acceptes,  color: 'bg-emerald-500' },
                    { label: t('common.pending'),        count: kpis.enAttente, color: 'bg-amber-500'   },
                    { label: t('common.refused_count'),  count: kpis.refuses,   color: 'bg-rose-500'    },
                  ].map(item => (
                    <div key={item.label}>
                      <div className="flex justify-between text-[10px] font-black mb-1 uppercase">
                        <span className="text-slate-500">{item.label}</span>
                        <span className="text-slate-900 dark:text-white">
                          {item.count} <span className="text-slate-400 font-medium">({Math.round((item.count / kpis.total) * 100)}%)</span>
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full ${item.color} transition-all duration-700`} style={{ width: `${(item.count / kpis.total) * 100}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </aside>
        </div>
      </div>
    </div>
  );
};

// ─── OVERVIEW TAB ─────────────────────────────────────────────────────────────
const OverviewTab = ({ formation, candidats, chartData, kpis }) => {
  const { t } = useTranslation();
  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0f172a',
        titleColor: '#94a3b8',
        bodyColor: '#fff',
        titleFont: { size: 10, weight: 'bold' },
        bodyFont: { size: 12, weight: 'bold' },
        padding: 12,
        cornerRadius: 12,
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 10, weight: 'bold' }, color: '#94a3b8' }, border: { display: false } },
      y: { grid: { color: 'rgba(148,163,184,0.1)' }, ticks: { font: { size: 10, weight: 'bold' }, color: '#94a3b8', stepSize: 1 }, border: { display: false }, beginAtZero: true },
    },
  };

  const lineData = {
    labels: chartData.labels,
    datasets: [
      {
        label: t('common.chart_inscriptions'),
        data: chartData.inscrits,
        borderColor: '#14b8a6',
        backgroundColor: 'rgba(20,184,166,0.08)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#14b8a6',
        pointRadius: 5,
        pointHoverRadius: 7,
        borderWidth: 3,
      },
      {
        label: t('common.accepted_count'),
        data: chartData.acceptes,
        borderColor: '#6366f1',
        borderDash: [6, 4],
        backgroundColor: 'transparent',
        fill: false,
        tension: 0.4,
        pointBackgroundColor: '#6366f1',
        pointRadius: 4,
        pointHoverRadius: 6,
        borderWidth: 2,
      },
    ],
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* Chart */}
      <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h4 className="text-[10px] font-black text-teal-600 dark:text-teal-400 uppercase tracking-[0.2em] mb-2 leading-none">{t('common.analytics_title')}</h4>
            <p className="text-xl font-black dark:text-white tracking-tight leading-none">{t('common.registrations_by_day')}</p>
          </div>
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.6)]"></div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('common.chart_inscriptions')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]"></div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('common.accepted_count')}</span>
            </div>
          </div>
        </div>

        <div className="bg-white/50 dark:bg-slate-900/50 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="h-64 w-full">
            {candidats.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center gap-3 text-slate-400">
                <ChartBarIcon className="h-12 w-12 opacity-30" />
                <p className="text-[11px] font-black uppercase tracking-widest">{t('common.no_data_enrolled')}</p>
              </div>
            ) : (
              <Line data={lineData} options={lineOptions} />
            )}
          </div>
        </div>
      </div>

      {/* Info formation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-8 bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] border border-slate-100 dark:border-slate-800">
          <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 leading-none">{t('common.description_label')}</h5>
          <p className="text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
            {formation.description || t('common.no_description')}
          </p>
        </div>
        <div className="p-8 bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 space-y-4">
          <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 leading-none">{t('common.quick_summary')}</h5>
          {[
            { label: t('common.trainer'),      val: formation.nom_formateur ?? '—' },
            { label: t('common.created_on'),   val: formation.created_at ? new Date(formation.created_at).toLocaleDateString('fr-FR') : '—' },
            { label: t('common.total_spots'),  val: formation.places_totales ?? '—' },
            { label: t('common.free_spots'),   val: Math.max(0, (formation.places_totales ?? 0) - kpis.acceptes) },
          ].map(r => (
            <div key={r.label} className="flex justify-between items-center text-[11px]">
              <span className="font-black text-slate-400 uppercase tracking-widest">{r.label}</span>
              <span className="font-black dark:text-white">{r.val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── STAGIAIRES TAB ───────────────────────────────────────────────────────────
const StagiairesTab = ({ formation, candidats, onRefresh }) => {
  const { t, lang } = useTranslation();
  const [viewMode, setViewMode]           = useState('list');
  const [activeStudent, setActiveStudent] = useState(null);
  const [searchQuery, setSearchQuery]     = useState('');
  const [statusFilter, setStatusFilter]   = useState('Tous');
  const [local, setLocal]                 = useState(candidats);

  useEffect(() => { setLocal(candidats); }, [candidats]);

  const kpis = useMemo(() => {
    const total     = local.length;
    const acceptes  = local.filter(c => c.statut === 'accepte').length;
    const enAttente = local.filter(c => c.statut === 'en_attente').length;
    const refuses   = local.filter(c => c.statut === 'refuse').length;
    return [
      { label: t('common.total_enrolled'),    value: total,     icon: UserGroupIcon,         color: 'text-indigo-600' },
      { label: t('common.accepted_trainees'), value: acceptes,  icon: CheckCircleIcon,       color: 'text-teal-600'   },
      { label: t('common.pending_admin_filter'), value: enAttente, icon: ClockIcon,          color: 'text-amber-500'  },
      { label: t('common.refused_count'),     value: refuses,   icon: ExclamationCircleIcon, color: 'text-rose-500'   },
    ];
  }, [local]);

  const filtered = useMemo(() => local.filter(c => {
    const q = searchQuery.toLowerCase();
    const matchName = (c.nom ?? c.name ?? '').toLowerCase().includes(q) || (c.prenom ?? '').toLowerCase().includes(q) || (c.email ?? '').toLowerCase().includes(q);
    const matchStatus = statusFilter === 'Tous' || c.statut === statusFilter;
    return matchName && matchStatus;
  }), [local, searchQuery, statusFilter]);

  const titre = formation?.title || formation?.titre || 'Formation';

  const profileRows = (s) => [
    [t('common.email'),       s.email],
    [t('common.phone'),       s.telephone],
    [t('common.address'),     s.adresse],
    [t('common.civil_status'),s['état_civil'] ?? s.etat_civil],
    [t('common.situation'),   s.situation],
    [t('common.format'),      s.format],
    [t('common.level'),       s.niveau],
    [t('common.rythm'),       s.rythme],
    [t('common.objective'),   s.objectif],
    [t('common.availability'),s.disponibilite_hebdo],
    [t('common.score_tech'),  s.score_technique  != null ? `${s.score_technique}/100`  : null],
    [t('common.score_soft'),  s.score_soft_skills!= null ? `${s.score_soft_skills}/100`: null],
    [t('common.experience'),  s.experience       != null ? `${s.experience} an(s)`     : null],
    [t('common.pref_format'), s.preference_format],
    [t('common.pref_horaire'),s.preference_horaire],
    [t('common.category'),    s.categorie_client],
    [t('common.registration_date'), s.created_at ? new Date(s.created_at).toLocaleDateString(lang === 'en' ? 'en-US' : 'fr-FR') : null],
  ].filter(([, v]) => v != null && v !== '');

  return (
    <div className="space-y-8 animate-in fade-in duration-700 relative">

      {/* Drawer détail candidat — lecture seule */}
      {activeStudent && (
        <div className="fixed inset-0 z-[100] flex justify-end animate-in fade-in duration-300">
          <div onClick={() => setActiveStudent(null)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-500 flex flex-col">
            {/* Header */}
            <div className="p-8 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`h-14 w-14 rounded-2xl flex items-center justify-center text-xl font-black ${
                  activeStudent.statut === 'accepte' ? 'bg-teal-600' :
                  activeStudent.statut === 'refuse'  ? 'bg-rose-500' : 'bg-amber-500'
                }`}>
                  {(activeStudent.nom ?? activeStudent.name ?? '?')[0]?.toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-tight leading-none mb-1">
                    {activeStudent.prenom ?? ''} {activeStudent.nom ?? activeStudent.name ?? '—'}
                  </h2>
                  <p className="text-[10px] font-bold text-teal-400 uppercase tracking-widest">{titre}</p>
                </div>
              </div>
              <button onClick={() => setActiveStudent(null)} className="p-2 hover:bg-white/10 rounded-xl transition-all">
                <ArrowLeftIcon className="h-6 w-6 rotate-180" />
              </button>
            </div>

            {/* Statut actuel */}
            <div className="px-8 pt-5">
              <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border ${
                activeStudent.statut === 'accepte'
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700'
                  : activeStudent.statut === 'refuse'
                  ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-700'
                  : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700'
              }`}>
                {activeStudent.statut === 'accepte'   && <CheckCircleIcon   className="h-5 w-5 text-emerald-500 shrink-0" />}
                {activeStudent.statut === 'refuse'    && <ExclamationCircleIcon className="h-5 w-5 text-rose-500 shrink-0" />}
                {activeStudent.statut === 'en_attente'&& <ClockIcon          className="h-5 w-5 text-amber-500 shrink-0" />}
                <div>
                  <p className={`text-xs font-black ${
                    activeStudent.statut === 'accepte' ? 'text-emerald-700 dark:text-emerald-400' :
                    activeStudent.statut === 'refuse'  ? 'text-rose-700 dark:text-rose-400'       : 'text-amber-700 dark:text-amber-400'
                  }`}>
                    {activeStudent.statut === 'accepte'   ? t('common.status_accepted_conf')
                     : activeStudent.statut === 'refuse'  ? t('common.status_refused_admin')
                     : t('common.status_pending_admin')}
                  </p>
                  {activeStudent.statut === 'en_attente' && (
                    <p className="text-[10px] text-amber-500 mt-0.5">{t('common.pending_notification_msg')}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Profil complet */}
            <div className="flex-1 overflow-y-auto px-8 py-5 space-y-2">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">{t('common.full_profile')}</p>
              {profileRows(activeStudent).map(([label, val]) => (
                <div key={label} className="flex items-center justify-between py-2.5 border-b border-slate-50 dark:border-slate-800">
                  <span className="text-[10px] font-black text-slate-400 shrink-0 w-36">{label}</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 text-right capitalize">{String(val)}</span>
                </div>
              ))}
              {/* CV */}
              {activeStudent.cv && (
                <a href={`http://localhost/api/app/telecharger-cv/${activeStudent.id}/candidat`}
                  target="_blank" rel="noreferrer"
                  className="mt-4 flex items-center justify-center gap-2 w-full px-4 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20">
                  <AcademicCapIcon className="h-5 w-5" />
                  {t('common.download_cv')}
                </a>
              )}
            </div>

            {/* Footer read-only */}
            <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">
                {t('common.admin_only_msg')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {kpis.map((kpi, i) => (
          <div key={i} className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800/50 hover:border-teal-500/30 transition-all">
            <div className="flex items-center gap-3 mb-3">
              <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">{kpi.label}</p>
            </div>
            <p className="text-xl font-black dark:text-white leading-none">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-56">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input type="text" placeholder={t('common.search')}
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl pl-11 pr-4 py-3 text-xs font-bold focus:ring-2 focus:ring-teal-500 outline-none border-none" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 rounded-2xl px-4 py-3 text-xs font-bold outline-none border-none dark:text-white">
            <option value="Tous">{t('common.all')}</option>
            <option value="accepte">{t('common.accepted_trainees')}</option>
            <option value="en_attente">{t('common.pending_admin_filter')}</option>
            <option value="refuse">{t('common.refused_count')}</option>
          </select>
        </div>
        <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl flex">
          <button onClick={() => setViewMode('list')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 text-teal-600 shadow-sm' : 'text-slate-400'}`}>{t('common.view_mode_list')}</button>
          <button onClick={() => setViewMode('analytics')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'analytics' ? 'bg-white dark:bg-slate-700 text-teal-600 shadow-sm' : 'text-slate-400'}`}>{t('common.view_mode_analytics')}</button>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-[3rem] shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <UserGroupIcon className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-sm font-black text-slate-400 uppercase tracking-widest">{t('common.no_result')}</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('common.candidate')}</th>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('common.email')}</th>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{t('common.status')}</th>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{t('common.registration_date')}</th>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{t('common.ai_profile_col')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {filtered.map(c => (
                  <tr key={c.id} onClick={() => setActiveStudent(c)}
                    className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all cursor-pointer group ${
                      c.statut === 'en_attente' ? 'bg-amber-50/20 dark:bg-amber-900/5' : ''
                    }`}>
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-white font-black text-sm ${
                          c.statut === 'accepte' ? 'bg-teal-600' : c.statut === 'refuse' ? 'bg-rose-400' : 'bg-amber-400'
                        }`}>
                          {(c.nom ?? c.name ?? '?')[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-black dark:text-white leading-none">{c.prenom ?? ''} {c.nom ?? c.name ?? '—'}</p>
                          <p className="text-[10px] text-slate-500 font-bold leading-none mt-0.5">{c.telephone ?? ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-6 text-[11px] font-bold text-slate-500 dark:text-slate-400">{c.email ?? '—'}</td>
                    <td className="p-6 text-center">
                      <span className={`text-[9px] font-black px-3 py-1.5 rounded-xl uppercase tracking-tighter border ${statutBadge(c.statut)}`}>
                        {t(`common.${STATUT_KEYS[c.statut] ?? 'status'}`)}
                      </span>
                    </td>
                    <td className="p-6 text-right text-[10px] font-bold text-slate-400">
                      {c.created_at ? new Date(c.created_at).toLocaleDateString(lang === 'en' ? 'en-US' : 'fr-FR') : '—'}
                    </td>
                    <td className="p-6 text-center">
                      {c.niveau ? (
                        <span className="text-[9px] font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded-lg">
                          {c.niveau}
                        </span>
                      ) : <span className="text-slate-300 text-[9px]">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <StagiairesAnalytics candidats={local} />
      )}
    </div>
  );
};

// ─── STAGIAIRES ANALYTICS ─────────────────────────────────────────────────────
const StagiairesAnalytics = ({ candidats }) => {
  const { t } = useTranslation();
  const doughnutData = useMemo(() => {
    const a = candidats.filter(c => c.statut === 'accepte').length;
    const w = candidats.filter(c => c.statut === 'en_attente').length;
    const r = candidats.filter(c => c.statut === 'refuse').length;
    return { labels: [t('common.accepted_count'), t('common.pending'), t('common.refused_count')], datasets: [{ data: [a, w, r], backgroundColor: ['#14b8a6', '#f59e0b', '#ef4444'], borderWidth: 0, hoverOffset: 6 }] };
  }, [candidats]);

  const barData = useMemo(() => {
    const counts = {};
    candidats.forEach(c => {
      if (!c.created_at) return;
      const d = new Date(c.created_at);
      if (!isNaN(d)) {
        const key = d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
        counts[key] = (counts[key] ?? 0) + 1;
      }
    });
    const sorted = Object.entries(counts).sort((a, b) => a[0].localeCompare(b[0]));
    return { labels: sorted.map(([k]) => k), datasets: [{ label: 'Inscriptions', data: sorted.map(([, v]) => v), backgroundColor: 'rgba(20,184,166,0.7)', borderRadius: 8, borderSkipped: false }] };
  }, [candidats]);

  const donutOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { font: { size: 10, weight: 'bold' }, color: '#94a3b8', boxWidth: 12, padding: 16 } }, tooltip: { backgroundColor: '#0f172a', bodyColor: '#fff', padding: 10, cornerRadius: 10 } }, cutout: '65%' };
  const barOpts   = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { backgroundColor: '#0f172a', bodyColor: '#fff', padding: 10, cornerRadius: 10 } }, scales: { x: { grid: { display: false }, ticks: { font: { size: 10, weight: 'bold' }, color: '#94a3b8' }, border: { display: false } }, y: { grid: { color: 'rgba(148,163,184,0.1)' }, ticks: { font: { size: 10, weight: 'bold' }, color: '#94a3b8', stepSize: 1 }, border: { display: false }, beginAtZero: true } } };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-500">
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm">
        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 leading-none">{t('common.status_distribution')}</h5>
        <div className="h-56">{candidats.length === 0 ? <EmptyChart /> : <Doughnut data={doughnutData} options={donutOpts} />}</div>
      </div>
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm">
        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 leading-none">{t('common.registrations_by_day')}</h5>
        <div className="h-56">{candidats.length === 0 ? <EmptyChart /> : <Bar data={barData} options={barOpts} />}</div>
      </div>
    </div>
  );
};

// ─── CONTENU TAB — dynamique via ResourceController ──────────────────────────
const ContenuTab = ({ formationId }) => {
  const { t } = useTranslation();
  const [resources, setResources]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [uploading, setUploading]   = useState(false);
  const [showForm, setShowForm]     = useState(false);
  const [title, setTitle]           = useState('');
  const [file, setFile]             = useState(null);
  const [error, setError]           = useState('');

  const typeIcon = (ext) => {
    if (['mp4','avi','mov','webm'].includes(ext)) return '🎬';
    if (['pdf'].includes(ext))                    return '📄';
    if (['jpg','jpeg','png','gif','webp'].includes(ext)) return '🖼️';
    return '📁';
  };
  const typeColor = (ext) => {
    if (['mp4','avi','mov','webm'].includes(ext)) return 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/20 dark:border-rose-800';
    if (['pdf'].includes(ext))                    return 'bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-900/20 dark:border-indigo-800';
    return 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:border-slate-700';
  };

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchResources(formationId);
      setResources(data);
    } catch { setResources([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (formationId) load(); }, [formationId]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!title.trim() || !file) { setError(t('common.file_title_req') + ' ' + t('common.file_upload_req')); return; }
    setUploading(true); setError('');
    try {
      const newRes = await uploadResource(formationId, title.trim(), file);
      setResources(prev => [newRes, ...prev]);
      setTitle(''); setFile(null); setShowForm(false);
    } catch { setError(t('common.error_load')); }
    finally { setUploading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('common.delete_file_confirm'))) return;
    try {
      await deleteResource(id);
      setResources(prev => prev.filter(r => r.id !== id));
    } catch { alert(t('common.error_load')); }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{t('common.formation_resources')}</h4>
        <button
          onClick={() => setShowForm(p => !p)}
          className="flex items-center px-5 py-2.5 bg-teal-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-teal-600/20 hover:bg-teal-500 transition-all"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          {showForm ? t('common.cancel') : t('common.add_resource')}
        </button>
      </div>

      {/* Formulaire upload */}
      {showForm && (
        <form onSubmit={handleUpload} className="bg-slate-50 dark:bg-slate-800/60 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 space-y-4 animate-in slide-in-from-top-4 duration-300">
          <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest">{t('common.new_file_label')}</p>
          {error && <p className="text-xs font-bold text-rose-500">{error}</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{t('common.file_title_req')} *</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Ex: Introduction - PDF"
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-teal-500 outline-none dark:text-white"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{t('common.file_upload_req')} *</label>
              <input
                type="file"
                onChange={e => setFile(e.target.files[0] || null)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-teal-500 outline-none dark:text-white file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-black file:bg-teal-50 file:text-teal-600"
              />
            </div>
          </div>
          <button type="submit" disabled={uploading} className="px-6 py-3 bg-teal-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-teal-500 disabled:opacity-60 transition-all">
            {uploading ? t('common.uploading') : t('common.upload_btn')}
          </button>
        </form>
      )}

      {/* Liste ressources */}
      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-slate-100 dark:bg-slate-800 rounded-[2rem] animate-pulse" />)}
        </div>
      ) : resources.length === 0 ? (
        <div className="py-20 text-center">
          <AcademicCapIcon className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{t('common.no_resource')}</p>
          <p className="text-xs text-slate-400 mt-2">{t('common.no_resource_hint')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {resources.map((r, i) => (
            <div key={r.id} className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] flex items-center justify-between group hover:border-teal-500 transition-all shadow-sm">
              <div className="flex items-center gap-5">
                <div className="h-14 w-14 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-2xl shadow-inner border border-slate-100 dark:border-slate-700 group-hover:border-teal-500 transition-all">
                  {typeIcon(r.type)}
                </div>
                <div>
                  <p className="text-sm font-black dark:text-white leading-none mb-1.5">{r.title}</p>
                  <div className="flex items-center gap-3">
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg border uppercase ${typeColor(r.type)}`}>{r.type || 'fichier'}</span>
                    <span className="text-[9px] font-bold text-slate-400">{r.created_at ? new Date(r.created_at).toLocaleDateString('fr-FR') : '—'}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                <a
                  href={r.download_url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-3 bg-teal-50 dark:bg-teal-900/20 text-teal-600 rounded-xl hover:bg-teal-100 transition-all text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5"
                >
                  <ArrowRightIcon className="h-4 w-4 -rotate-45" /> {t('common.download')}
                </a>
                <button
                  onClick={() => handleDelete(r.id)}
                  className="p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-xl hover:bg-rose-100 transition-all"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── BADGES TAB ───────────────────────────────────────────────────────────────
const BadgesTab = () => {
  const { t } = useTranslation();
  return (
  <div className="space-y-12">
    <div className="flex items-center justify-between">
      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{t('common.rewards_gamification')}</h4>
      <button className="flex items-center px-6 py-3 bg-teal-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl">{t('common.create_badge_btn')}</button>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[
        { title: 'First Module',  icon: TrophyIcon,     color: 'text-blue-500',   bg: 'bg-blue-50 dark:bg-blue-900/20'     },
        { title: 'Top Performer', icon: StarIconSolid,  color: 'text-amber-500',  bg: 'bg-amber-50 dark:bg-amber-900/20'   },
        { title: 'Fast Learner',  icon: BoltIcon,       color: 'text-teal-500',   bg: 'bg-teal-50 dark:bg-teal-900/20'     },
        { title: 'Certification', icon: AcademicCapIcon,color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
      ].map((badge, i) => (
        <div key={i} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm text-center group hover:border-teal-500 transition-all">
          <div className={`${badge.bg} h-20 w-20 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform`}>
            <badge.icon className={`h-10 w-10 ${badge.color}`} />
          </div>
          <h5 className="text-sm font-black dark:text-white uppercase tracking-tight mb-2 leading-none">{badge.title}</h5>
          <button className="w-full py-2.5 mt-4 bg-slate-100 dark:bg-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-teal-600 hover:text-white transition-all">{t('common.manage')}</button>
        </div>
      ))}
    </div>
  </div>
  );
};

// ─── COMMUNICATION TAB ────────────────────────────────────────────────────────
const CommunicationTab = ({ candidats }) => {
  const { t } = useTranslation();
  const [msg, setMsg] = useState('');
  return (
    <div className="space-y-10">
      <div className="bg-teal-600 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 h-40 w-40 bg-white/10 blur-[80px]"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="h-20 w-20 bg-white/20 rounded-3xl flex items-center justify-center backdrop-blur-xl border border-white/30 shrink-0">
            <MegaphoneIcon className="h-10 w-10" />
          </div>
          <div className="flex-1">
            <h4 className="text-2xl font-black tracking-tight mb-2 leading-none">{t('common.collective_announce')}</h4>
            <p className="text-teal-100 text-xs font-medium mb-6 max-w-sm">
              {t('common.broadcast_btn')} — {candidats.length} candidat{candidats.length !== 1 ? 's' : ''}
            </p>
            <div className="flex gap-4">
              <input
                type="text"
                value={msg}
                onChange={e => setMsg(e.target.value)}
                placeholder={t('common.search')}
                className="flex-1 bg-white/10 border-white/20 rounded-2xl px-6 py-4 text-sm placeholder:text-white/40 outline-none focus:ring-2 focus:ring-white/50"
              />
              <button onClick={() => { alert('Message diffusé !'); setMsg(''); }} className="px-8 py-4 bg-white text-teal-600 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:scale-105 transition-all">
                {t('common.broadcast_btn')}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="p-10 bg-slate-50 dark:bg-slate-800/50 rounded-[3rem] border border-slate-100 dark:border-slate-800 text-center">
        <ChatBubbleLeftRightIcon className="h-12 w-12 text-slate-300 mx-auto mb-4" />
        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{t('common.messaging_dev')}</p>
      </div>
    </div>
  );
};

// ─── STATS TAB ────────────────────────────────────────────────────────────────
const StatsTab = ({ candidats, formation, kpis }) => {
  const { t } = useTranslation();
  const doughnutData = useMemo(() => ({
    labels: [t('common.accepted_count'), t('common.pending'), t('common.refused_count')],
    datasets: [{ data: [kpis.acceptes, kpis.enAttente, kpis.refuses], backgroundColor: ['#14b8a6', '#f59e0b', '#ef4444'], borderWidth: 0, hoverOffset: 6 }],
  }), [kpis]);

  const donutOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { font: { size: 10, weight: 'bold' }, color: '#94a3b8', boxWidth: 12, padding: 12 } } }, cutout: '60%' };
  const placesLibres   = Math.max(0, (formation?.places_totales ?? 0) - kpis.acceptes);
  const occupation     = formation?.places_totales > 0 ? Math.round((kpis.acceptes / formation.places_totales) * 100) : 0;
  const circumference  = 2 * Math.PI * 52;

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">{t('common.performance_report')}</h4>
          <p className="text-xl font-black dark:text-white tracking-tight leading-none">{formation?.title || formation?.titre || 'Formation'}</p>
        </div>
        <button className="px-6 py-3 bg-teal-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-teal-600/20">{t('common.export_report')}</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

        {/* Donut statuts */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm">
          <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 leading-none">{t('common.status_distribution')}</h5>
          <div className="h-48">{kpis.total === 0 ? <EmptyChart /> : <Doughnut data={doughnutData} options={donutOpts} />}</div>
        </div>

        {/* Jauge places */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm">
          <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 leading-none">{t('common.spots_occupation')}</h5>
          <div className="flex flex-col items-center justify-center h-48 gap-4">
            <div className="relative h-32 w-32">
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-slate-100 dark:text-slate-800" />
                <circle cx="60" cy="60" r="52" stroke="#14b8a6" strokeWidth="10" fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference * (1 - occupation / 100)}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black dark:text-white">{occupation}%</span>
                <span className="text-[9px] font-black text-slate-400 uppercase">{t('common.occupied_label')}</span>
              </div>
            </div>
            <p className="text-xs font-bold text-slate-500">{kpis.acceptes} / {formation?.places_totales ?? '—'} places • {placesLibres} libres</p>
          </div>
        </div>

        {/* Métriques clés */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm">
          <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 leading-none">{t('common.key_metrics')}</h5>
          <div className="space-y-5">
            {[
              { label: t('common.acceptance_rate_metric'), val: `${kpis.taux}%`,         color: 'bg-teal-500'    },
              { label: t('common.real_revenue_metric'),    val: fmtRevenu(kpis.revenus), color: 'bg-emerald-500' },
              { label: t('common.total_candidates_metric'),val: kpis.total,              color: 'bg-indigo-500'  },
              { label: t('common.pending'),                val: kpis.enAttente,          color: 'bg-amber-500'   },
            ].map(m => (
              <div key={m.label} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-2 w-2 rounded-full ${m.color}`}></div>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{m.label}</span>
                </div>
                <span className="text-sm font-black dark:text-white">{m.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Entonnoir réel */}
      <div className="bg-slate-50 dark:bg-slate-800/50 p-10 rounded-[3.5rem] border border-slate-100 dark:border-slate-800/50">
        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8 leading-none">{t('common.conversion_funnel')}</h5>
        <div className="space-y-5">
          {[
            { label: t('common.total_enrolled'),  count: kpis.total,     color: 'bg-teal-600'   },
            { label: t('common.accepted_count'),  count: kpis.acceptes,  color: 'bg-indigo-500' },
            { label: t('common.pending'),         count: kpis.enAttente, color: 'bg-amber-500'  },
            { label: t('common.refused_count'),   count: kpis.refuses,   color: 'bg-rose-500'   },
          ].map(item => (
            <div key={item.label} className="relative group">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-tight">{item.label}</span>
                <span className="text-[10px] font-black text-slate-900 dark:text-white">{item.count} {t('common.persons_unit')}</span>
              </div>
              <div className="h-6 w-full bg-slate-200 dark:bg-white/5 rounded-2xl overflow-hidden relative shadow-inner">
                <div
                  className={`h-full ${item.color} transition-all duration-1000`}
                  style={{ width: `${kpis.total > 0 ? (item.count / kpis.total) * 100 : 0}%` }}
                ></div>
                <span className="absolute inset-y-0 left-4 flex items-center text-[8px] font-black text-white uppercase tracking-widest">
                  {kpis.total > 0 ? Math.round((item.count / kpis.total) * 100) : 0}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── SETTINGS TAB ─────────────────────────────────────────────────────────────
const SettingsTab = ({ formation, onRefresh }) => {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    title:         formation?.title        || formation?.titre || '',
    description:   formation?.description  || '',
    prix:          formation?.prix         || '',
    places_totales:formation?.places_totales|| '',
    statut:        formation?.statut       || 'Brouillon',
    date_debut:    formation?.date_debut   || '',
    date_fin:      formation?.date_fin     || '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  const handle = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await api.put(`/app/formations/${formation.id}`, form);
      setSaved(true);
      onRefresh?.();
      setTimeout(() => setSaved(false), 3000);
    } catch {
      alert(t('common.error_load'));
    } finally {
      setSaving(false);
    }
  };

  const inp = 'w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-teal-500 outline-none dark:text-white shadow-inner';

  return (
    <div className="max-w-4xl space-y-10">
      <div className="flex items-center justify-between">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{t('common.formation_settings')}</h4>
        {saved && (
          <span className="text-[10px] font-black text-teal-600 uppercase tracking-widest flex items-center gap-2">
            <CheckCircleIcon className="h-4 w-4" /> {t('common.saved_success')}
          </span>
        )}
      </div>
      <form onSubmit={save} className="grid grid-cols-2 gap-8">
        <div className="col-span-2">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{t('common.event_title_label')}</label>
          <input type="text" name="title" value={form.title} onChange={handle} className={inp} />
        </div>
        <div className="col-span-2">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{t('common.description_label')}</label>
          <textarea name="description" value={form.description} onChange={handle} rows={3} className={`${inp} resize-none`} />
        </div>
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{t('common.price_dzd_label')}</label>
          <input type="number" name="prix" value={form.prix} onChange={handle} className={inp} />
        </div>
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{t('common.total_spots')}</label>
          <input type="number" name="places_totales" value={form.places_totales} onChange={handle} className={inp} />
        </div>
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{t('common.start_date_field')}</label>
          <input type="date" name="date_debut" value={form.date_debut || ''} onChange={handle} className={inp} />
        </div>
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{t('common.end_date_field')}</label>
          <input type="date" name="date_fin" value={form.date_fin || ''} onChange={handle} min={form.date_debut || undefined} className={inp} />
        </div>
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{t('common.status')}</label>
          <select name="statut" value={form.statut} onChange={handle} className={inp}>
            <option value="Brouillon">{t('common.draft')}</option>
            <option value="En cours">{t('common.in_progress')}</option>
            <option value="Complet">{t('common.completed')}</option>
            <option value="Fermée">{t('common.closed')}</option>
          </select>
        </div>
        <div className="flex items-end">
          <button type="submit" disabled={saving} className="w-full py-4 bg-teal-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-teal-500 transition-all disabled:opacity-70">
            {saving ? t('common.saving') : t('common.save_changes_btn')}
          </button>
        </div>
        <div className="col-span-2 p-8 bg-rose-50 dark:bg-rose-900/10 rounded-[2.5rem] border border-rose-100 dark:border-rose-900/20">
          <h5 className="text-xs font-black text-rose-600 uppercase mb-2">{t('common.danger_zone')}</h5>
          <p className="text-[10px] text-rose-500 font-bold mb-6">{t('common.danger_zone_desc')}</p>
          <button
            type="button"
            onClick={() => {
              if (window.confirm(t('common.delete_formation_confirm'))) {
                api.delete(`/app/formations/${formation?.id}`).then(() => window.history.back());
              }
            }}
            className="px-6 py-3 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-600/20"
          >
            {t('common.delete_formation_btn')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FormationDetailDashboard;
