import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  EnvelopeIcon,
  PhoneIcon,
  DocumentArrowDownIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../../context/AuthContext';
import { useTranslation } from '../../../context/LanguageContext';
import { fetchFormateuresDemandes, markDemandeVue } from '../../../services/Formationservice';
import notificationService from '../../../services/notificationService';

const StatutBadge = ({ statut }) => {
  const { t } = useTranslation();
  const cfg = {
    en_attente: {
      label: t('demandes.status_pending'),
      cls: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: <ClockIcon className="h-3.5 w-3.5 mr-1" />,
    },
    accepte: {
      label: t('demandes.status_accepted'),
      cls: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: <CheckCircleIcon className="h-3.5 w-3.5 mr-1" />,
    },
    refuse: {
      label: t('demandes.status_refused'),
      cls: 'bg-red-50 text-red-600 border-red-200',
      icon: <XCircleIcon className="h-3.5 w-3.5 mr-1" />,
    },
  };
  const c = cfg[statut] ?? cfg.en_attente;
  return (
    <span className={`inline-flex items-center text-[10px] font-black px-2.5 py-1 rounded-lg border ${c.cls}`}>
      {c.icon}{c.label}
    </span>
  );
};

const CandidatDrawer = ({ candidat, onClose }) => {
  const { t } = useTranslation();
  if (!candidat) return null;
  const cvUrl = candidat.cv
    ? `http://localhost/api/app/telecharger-cv/${candidat.id}/candidat`
    : null;

  const rows = [
    [t('demandes.label_email'),          candidat.email],
    [t('demandes.label_phone'),          candidat.telephone],
    [t('demandes.label_address'),        candidat.adresse],
    [t('demandes.label_etat_civil'),     candidat.état_civil],
    [t('demandes.label_situation'),      candidat.situation],
    [t('demandes.label_format'),         candidat.format],
    [t('demandes.label_niveau'),         candidat.niveau],
    [t('demandes.label_rythme'),         candidat.rythme],
    [t('demandes.label_objectif'),       candidat.objectif],
    [t('demandes.label_dispo'),          candidat.disponibilite_hebdo],
    [t('demandes.label_score_tech'),     candidat.score_technique != null ? `${candidat.score_technique}/100` : null],
    [t('demandes.label_score_soft'),     candidat.score_soft_skills != null ? `${candidat.score_soft_skills}/100` : null],
    [t('demandes.label_experience'),     candidat.experience != null ? `${candidat.experience} an(s)` : null],
    [t('demandes.label_formations_ant'), candidat.nb_formations_anterieures],
  ].filter(([, v]) => v != null && v !== '');

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 w-full max-w-xl bg-white dark:bg-slate-900 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black dark:text-white">
              {candidat.prenom} {candidat.nom}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {t('demandes.inscrit_le')} {new Date(candidat.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StatutBadge statut={candidat.statut} />
            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">
              <XCircleIcon className="h-5 w-5 text-slate-400" />
            </button>
          </div>
        </div>

        <div className="mx-6 mt-4 px-4 py-3 bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-800 rounded-2xl">
          <p className="text-[9px] font-black text-teal-600 uppercase tracking-widest mb-0.5">{t('demandes.label_formation')}</p>
          <p className="text-sm font-bold text-teal-800 dark:text-teal-300">{candidat.formation?.title ?? `Formation #${candidat.formation_id}`}</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="flex gap-3">
            <a href={`mailto:${candidat.email}`}
              className="flex-1 flex items-center gap-2 px-3 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm text-slate-600 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-600 transition-colors">
              <EnvelopeIcon className="h-4 w-4" />{candidat.email}
            </a>
            {candidat.telephone && (
              <a href={`tel:${candidat.telephone}`}
                className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm text-slate-600 dark:text-slate-300 hover:bg-green-50 hover:text-green-600 transition-colors">
                <PhoneIcon className="h-4 w-4" />{candidat.telephone}
              </a>
            )}
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl overflow-hidden">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-4 pt-3 pb-2">{t('demandes.profil_complet')}</p>
            {rows.map(([label, value]) => (
              <div key={label} className="flex items-center justify-between px-4 py-2.5 border-t border-slate-100 dark:border-slate-700">
                <span className="text-xs font-bold text-slate-500">{label}</span>
                <span className="text-xs font-bold text-slate-900 dark:text-white capitalize">{String(value)}</span>
              </div>
            ))}
          </div>

          {cvUrl && (
            <a href={cvUrl} target="_blank" rel="noreferrer"
              className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20">
              <DocumentArrowDownIcon className="h-5 w-5" />
              {t('demandes.cv_download')}
            </a>
          )}

          {candidat.statut === 'en_attente' && (
            <div className="px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl text-center">
              <ClockIcon className="h-6 w-6 text-amber-500 mx-auto mb-1.5" />
              <p className="text-xs font-bold text-amber-700 dark:text-amber-400">{t('demandes.admin_decision')}</p>
              <p className="text-[10px] text-amber-500 mt-0.5">{t('demandes.admin_decision_sub')}</p>
            </div>
          )}
          {candidat.statut === 'accepte' && (
            <div className="px-4 py-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-2xl text-center">
              <CheckCircleIcon className="h-6 w-6 text-emerald-500 mx-auto mb-1.5" />
              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">{t('demandes.accepted_visible')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const FormateurDemandesPage = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user_I = JSON.parse(localStorage.getItem('brn_user') || '{}');

  const [demandes, setDemandes]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [searchTerm, setSearchTerm]     = useState('');
  const [filterStatut, setFilterStatut] = useState('tous');
  const [selected, setSelected]         = useState(null);
  const [unreadNotifs, setUnreadNotifs] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchFormateuresDemandes(user_I.id);
      setDemandes(Array.isArray(data) ? data : []);
    } catch {
      setDemandes([]);
    } finally {
      setLoading(false);
    }
  };

  const loadNotifs = async () => {
    try {
      const notifs = await notificationService.getAllNotifications();
      setUnreadNotifs((notifs || []).filter(n => !n.is_read));
    } catch { /* silencieux */ }
  };

  useEffect(() => { load(); loadNotifs(); }, []);

  const openDetail = async (d) => {
    setSelected(d);
    if (!d.vue_formateur) {
      try {
        await markDemandeVue(d.id);
        setDemandes(prev => prev.map(x => x.id === d.id ? { ...x, vue_formateur: true } : x));
      } catch { /* silencieux */ }
    }
  };

  const markAllNotifsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setUnreadNotifs([]);
    } catch { /* silencieux */ }
  };

  const filtered = useMemo(() => {
    let r = [...demandes];
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      r = r.filter(d =>
        `${d.prenom} ${d.nom}`.toLowerCase().includes(q) ||
        d.email?.toLowerCase().includes(q) ||
        d.formation?.title?.toLowerCase().includes(q)
      );
    }
    if (filterStatut !== 'tous') r = r.filter(d => d.statut === filterStatut);
    return r;
  }, [demandes, searchTerm, filterStatut]);

  const counts = useMemo(() => ({
    tous:       demandes.length,
    en_attente: demandes.filter(d => d.statut === 'en_attente').length,
    accepte:    demandes.filter(d => d.statut === 'accepte').length,
    refuse:     demandes.filter(d => d.statut === 'refuse').length,
    non_vus:    demandes.filter(d => !d.vue_formateur && d.statut === 'en_attente').length,
  }), [demandes]);

  const tabs = [
    { key: 'tous',       label: t('demandes.tab_all'),      count: counts.tous },
    { key: 'en_attente', label: t('demandes.tab_pending'),  count: counts.en_attente },
    { key: 'accepte',    label: t('demandes.tab_accepted'), count: counts.accepte },
    { key: 'refuse',     label: t('demandes.tab_refused'),  count: counts.refuse },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0b0f19] font-['Inter']">

      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(`/dashboard/formateur/${user_I.id}`)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
            <ArrowLeftIcon className="h-5 w-5 text-slate-500" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{t('demandes.title')}</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {counts.non_vus > 0
                ? `${counts.non_vus} ${t('demandes.subtitle_new')}`
                : t('demandes.subtitle_all')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {unreadNotifs.length > 0 && (
            <button onClick={markAllNotifsRead}
              className="text-[10px] font-black text-teal-600 hover:underline uppercase tracking-widest">
              {t('demandes.btn_mark_read')} ({unreadNotifs.length})
            </button>
          )}
          <button onClick={load}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-teal-50 hover:text-teal-600 transition-colors">
            {t('demandes.btn_refresh')}
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-8 py-8">

        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input type="text" placeholder={t('demandes.search_placeholder')}
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-teal-500 dark:text-white" />
          </div>
          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-1">
            {tabs.map(tb => (
              <button key={tb.key} onClick={() => setFilterStatut(tb.key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                  filterStatut === tb.key
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}>
                {tb.label}
                <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-black ${
                  filterStatut === tb.key ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                }`}>{tb.count}</span>
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl h-20 animate-pulse border border-slate-100 dark:border-slate-800" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <AcademicCapIcon className="h-16 w-16 mb-4 opacity-30" />
            <p className="text-base font-bold">{t('demandes.empty')}</p>
            <p className="text-sm mt-1">
              {filterStatut !== 'tous' ? t('demandes.empty_filter') : t('demandes.empty_main')}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(d => (
              <div key={d.id}
                onClick={() => openDetail(d)}
                className={`group flex items-center justify-between p-5 bg-white dark:bg-slate-900 border rounded-2xl cursor-pointer transition-all hover:shadow-md hover:border-teal-200 dark:hover:border-teal-700 ${
                  !d.vue_formateur && d.statut === 'en_attente'
                    ? 'border-amber-200 dark:border-amber-700 bg-amber-50/30 dark:bg-amber-900/10'
                    : 'border-slate-100 dark:border-slate-800'
                }`}>
                <div className="flex items-center gap-4">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-white font-black text-sm ${
                    d.statut === 'accepte' ? 'bg-emerald-500' :
                    d.statut === 'refuse'  ? 'bg-red-400' : 'bg-amber-400'
                  }`}>
                    {(d.prenom?.[0] ?? '?').toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-black text-slate-900 dark:text-white">
                        {d.prenom} {d.nom}
                      </p>
                      {!d.vue_formateur && d.statut === 'en_attente' && (
                        <span className="h-2 w-2 bg-amber-400 rounded-full animate-pulse" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400">{d.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="hidden md:block text-right">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('demandes.label_formation')}</p>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300 max-w-[180px] truncate">
                      {d.formation?.title ?? `#${d.formation_id}`}
                    </p>
                  </div>
                  <div className="hidden md:block text-right">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('demandes.label_inscription')}</p>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {new Date(d.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <StatutBadge statut={d.statut} />
                  <EyeIcon className="h-4 w-4 text-slate-300 group-hover:text-teal-500 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selected && <CandidatDrawer candidat={selected} onClose={() => setSelected(null)} />}
    </div>
  );
};

export default FormateurDemandesPage;
