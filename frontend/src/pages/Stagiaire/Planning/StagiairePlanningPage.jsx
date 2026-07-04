import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useTranslation } from '../../../context/LanguageContext';
import DashboardLayout from '../../../components/DashboardLayout';
import api from '../../../api/axios';

const today = () => new Date();
const fmt = (d, opts) =>
  d ? new Date(d).toLocaleDateString('fr-FR', opts ?? { day: '2-digit', month: 'short', year: 'numeric' }) : null;

const daysDiff = (from, to) => {
  if (!from || !to) return null;
  return Math.ceil((new Date(to) - new Date(from)) / 86400000);
};

const categorize = (formations) => {
  const now = today();
  const en_cours = [], a_venir = [], terminees = [], en_attente = [];

  formations.forEach(f => {
    if (f.statut_inscription === 'refuse') return;
    if (f.statut_inscription === 'en_attente') { en_attente.push(f); return; }

    const debut = f.date_debut ? new Date(f.date_debut) : null;
    const fin   = f.date_fin   ? new Date(f.date_fin)   : null;

    if (debut && fin) {
      if (now >= debut && now <= fin) en_cours.push(f);
      else if (now < debut)           a_venir.push(f);
      else                            terminees.push(f);
    } else {
      en_cours.push(f);
    }
  });

  return { en_cours, a_venir, terminees, en_attente };
};

const ProgressBar = ({ debut, fin, t }) => {
  if (!debut || !fin) return null;
  const now = today();
  const start = new Date(debut);
  const end   = new Date(fin);
  const total = end - start;
  const elapsed = Math.max(0, Math.min(now - start, total));
  const pct = total > 0 ? Math.round((elapsed / total) * 100) : 0;
  return (
    <div className="mt-3">
      <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
        <span>{t('planning.progress_label')}</span><span>{pct}%</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full bg-teal-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

const CountdownBadge = ({ debut, fin, type, t }) => {
  if (type === 'a_venir' && debut) {
    const days = daysDiff(today(), debut);
    if (days == null) return null;
    return (
      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
        {t('planning.in_days').replace('{n}', days)}
      </span>
    );
  }
  if (type === 'en_cours' && fin) {
    const days = daysDiff(today(), fin);
    if (days == null) return null;
    return (
      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
        {t('planning.ends_in_days').replace('{n}', days)}
      </span>
    );
  }
  return null;
};

const PlanningCard = ({ f, type, t }) => {
  const STYLE = {
    en_cours:   { border: 'border-l-teal-500',  icon: '▶', title: 'text-teal-700' },
    a_venir:    { border: 'border-l-blue-500',  icon: '⏳', title: 'text-blue-700' },
    terminees:  { border: 'border-l-slate-400', icon: '✓',  title: 'text-slate-600' },
    en_attente: { border: 'border-l-amber-400', icon: '⌛', title: 'text-amber-700' },
  };
  const st = STYLE[type];

  return (
    <div className={`bg-white rounded-2xl border border-slate-100 border-l-4 ${st.border} p-5 hover:shadow-md transition-shadow`}>
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm shrink-0">
          <span className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black">
            {st.icon}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              {f.domaine && (
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{f.domaine}</p>
              )}
              <h3 className={`font-black text-sm leading-snug ${st.title}`}>{f.title}</h3>
              {f.nom_formateur && (
                <p className="text-xs text-slate-400 mt-0.5">👨‍🏫 {f.nom_formateur}</p>
              )}
            </div>
            <CountdownBadge debut={f.date_debut} fin={f.date_fin} type={type} t={t} />
          </div>

          {(f.date_debut || f.date_fin) && (
            <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
              <span>📅</span>
              <span className="font-medium">{fmt(f.date_debut)}</span>
              {f.date_fin && <><span className="text-slate-300">→</span><span className="font-medium">{fmt(f.date_fin)}</span></>}
              {f.duree && <span className="ml-auto text-slate-400 font-bold">{f.duree}h</span>}
            </div>
          )}

          {type === 'en_cours' && <ProgressBar debut={f.date_debut} fin={f.date_fin} t={t} />}

          {type === 'terminees' && (f.score_technique > 0 || f.score_soft_skills > 0) && (
            <div className="mt-3 flex gap-4">
              <div className="text-center">
                <p className="text-[9px] font-black text-slate-400 uppercase">{t('ds.kpi_score_tech')}</p>
                <p className="text-base font-black text-slate-800">{f.score_technique}<span className="text-xs text-slate-400">/100</span></p>
              </div>
              <div className="text-center">
                <p className="text-[9px] font-black text-slate-400 uppercase">{t('ds.kpi_score_soft')}</p>
                <p className="text-base font-black text-slate-800">{f.score_soft_skills}<span className="text-xs text-slate-400">/100</span></p>
              </div>
            </div>
          )}

          {type === 'en_attente' && (
            <p className="mt-2 text-[11px] text-amber-600 font-bold bg-amber-50 rounded-lg px-3 py-1.5">
              {t('planning.admin_waiting')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

const EmptySection = ({ icon, text, sub, onExplore, t }) => (
  <div className="flex flex-col items-center justify-center py-12 text-slate-400">
    <span className="text-4xl mb-3">{icon}</span>
    <p className="font-bold text-slate-600 text-sm">{text}</p>
    {sub && <p className="text-xs mt-1 text-center max-w-xs">{sub}</p>}
    {onExplore && (
      <button onClick={onExplore} className="mt-4 px-5 py-2 bg-teal-600 text-white rounded-xl text-xs font-bold hover:bg-teal-700 transition-colors">
        {t('planning.btn_explore')}
      </button>
    )}
  </div>
);

const WeekTimeline = ({ formations, t }) => {
  const { lang } = useTranslation();
  const now = today();
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() - now.getDay() + 1 + i);
    return d;
  });

  const hasEventOn = (day) => formations.some(f => {
    if (!f.date_debut || !f.date_fin) return false;
    return new Date(f.date_debut) <= day && new Date(f.date_fin) >= day;
  });

  const DAYS = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(2024, 0, 1 + i); // 2024-01-01 is Monday
    return d.toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'narrow' });
  });
  const todayStr = now.toDateString();

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 mb-6">
      <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">{t('planning.this_week')}</p>
      <div className="flex gap-2">
        {week.map((day, i) => {
          const isToday = day.toDateString() === todayStr;
          const hasEvent = hasEventOn(day);
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <p className="text-[10px] font-bold text-slate-400">{DAYS[i]}</p>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black transition-all
                ${isToday ? 'bg-teal-600 text-white shadow-md shadow-teal-200' : 'text-slate-600'}
                ${hasEvent && !isToday ? 'bg-teal-50 text-teal-700 ring-1 ring-teal-200' : ''}`}>
                {day.getDate()}
              </div>
              {hasEvent && <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const StagiairePlanningPage = () => {
  const { id: paramId } = useParams();
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const userId = paramId ? parseInt(paramId) : user?.id;

  const [formations, setFormations] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [tab, setTab]               = useState('en_cours');

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    api.get(`/app/stagiaire/${userId}/formations`)
      .then(r => setFormations(r.data.formations ?? []))
      .catch(() => setError(t('planning.error_load')))
      .finally(() => setLoading(false));
  }, [userId]);

  const { en_cours, a_venir, terminees, en_attente } = useMemo(
    () => categorize(formations),
    [formations]
  );

  const TABS = [
    { key: 'en_cours',   label: t('planning.tab_en_cours'),   count: en_cours.length,   color: 'teal' },
    { key: 'a_venir',    label: t('planning.tab_a_venir'),    count: a_venir.length,    color: 'blue' },
    { key: 'terminees',  label: t('planning.tab_historique'), count: terminees.length,  color: 'slate' },
    { key: 'en_attente', label: t('planning.tab_en_attente'), count: en_attente.length, color: 'amber' },
  ];

  const COLOR_MAP = {
    teal:  { active: 'bg-teal-600 text-white',  badge: 'bg-white/20' },
    blue:  { active: 'bg-blue-600 text-white',  badge: 'bg-white/20' },
    slate: { active: 'bg-slate-600 text-white', badge: 'bg-white/20' },
    amber: { active: 'bg-amber-500 text-white', badge: 'bg-white/20' },
  };

  const EMPTY_CFG = {
    en_cours:   { icon: '▶', text: t('planning.empty_en_cours'),   sub: t('planning.empty_sub_en_cours'),   explore: true },
    a_venir:    { icon: '⏳', text: t('planning.empty_a_venir'),    sub: t('planning.empty_sub_a_venir'),    explore: false },
    terminees:  { icon: '✓',  text: t('planning.empty_terminees'),  sub: t('planning.empty_sub_terminees'),  explore: false },
    en_attente: { icon: '⌛', text: t('planning.empty_en_attente'), sub: t('planning.empty_sub_en_attente'), explore: false },
  };

  const KPI_LIST = [
    { label: t('planning.kpi_en_cours'),  value: en_cours.length,   bg: 'bg-teal-50',  text: 'text-teal-700' },
    { label: t('planning.kpi_a_venir'),   value: a_venir.length,    bg: 'bg-blue-50',  text: 'text-blue-700' },
    { label: t('planning.kpi_terminees'), value: terminees.length,  bg: 'bg-slate-50', text: 'text-slate-600' },
    { label: t('planning.kpi_en_attente'),value: en_attente.length, bg: 'bg-amber-50', text: 'text-amber-700' },
  ];

  const currentList = { en_cours, a_venir, terminees, en_attente }[tab] ?? [];
  const empty = EMPTY_CFG[tab];

  return (
    <DashboardLayout role="stagiaire" userId={userId}>
      <div className="min-h-screen bg-slate-50 p-6 font-['Inter']">

        <div className="mb-6">
          <h1 className="text-2xl font-black text-slate-900">{t('planning.title')}</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {fmt(today(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {!loading && <WeekTimeline formations={[...en_cours, ...a_venir]} t={t} />}

        {!loading && (
          <div className="grid grid-cols-4 gap-3 mb-6">
            {KPI_LIST.map(k => (
              <div key={k.label} className={`${k.bg} rounded-2xl p-4 text-center`}>
                <p className={`text-2xl font-black ${k.text}`}>{k.value}</p>
                <p className="text-[10px] font-bold text-slate-500 mt-0.5">{k.label}</p>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 mb-5 w-fit">
          {TABS.map(tb => {
            const c = COLOR_MAP[tb.color];
            const isActive = tab === tb.key;
            return (
              <button
                key={tb.key}
                onClick={() => setTab(tb.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all
                  ${isActive ? c.active : 'text-slate-500 hover:bg-slate-50'}`}
              >
                {tb.label}
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-black
                  ${isActive ? c.badge : 'bg-slate-100 text-slate-400'}`}>
                  {tb.count}
                </span>
              </button>
            );
          })}
        </div>

        {error && (
          <div className="p-4 mb-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-600 font-bold">
            ⚠️ {error}
          </div>
        )}

        {loading && (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 border-l-4 border-l-slate-200 p-5 animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-2/3 mb-2" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        )}

        {!loading && !error && (
          <>
            {currentList.length === 0 ? (
              <EmptySection
                icon={empty.icon}
                text={empty.text}
                sub={empty.sub}
                onExplore={empty.explore ? () => navigate('/formations') : null}
                t={t}
              />
            ) : (
              <div className="space-y-3">
                {currentList.map(f => (
                  <PlanningCard key={f.inscription_id} f={f} type={tab} t={t} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StagiairePlanningPage;
