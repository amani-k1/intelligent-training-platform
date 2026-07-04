import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useTranslation } from '../../../context/LanguageContext';
import DashboardLayout from '../../../components/DashboardLayout';
import api from '../../../api/axios';

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const STATUS_STYLES = {
  accepte:    { bar: 'bg-emerald-400', badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  en_attente: { bar: 'bg-amber-400',   badge: 'bg-amber-100   text-amber-700',   dot: 'bg-amber-400' },
  refuse:     { bar: 'bg-red-400',     badge: 'bg-red-100     text-red-600',     dot: 'bg-red-400' },
};

const NIVEAU_BADGE = {
  'Débutant':      'bg-green-100 text-green-700',
  'Intermédiaire': 'bg-blue-100  text-blue-700',
  'Avancé':        'bg-purple-100 text-purple-700',
};

const ScoreBar = ({ label, value }) => (
  <div>
    <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
      <span>{label}</span><span>{value}/100</span>
    </div>
    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
      <div className="h-full bg-teal-500 rounded-full transition-all" style={{ width: `${value}%` }} />
    </div>
  </div>
);

const DetailModal = ({ item, onClose, onCancel, cancelling, t }) => {
  const s = STATUS_STYLES[item.statut_inscription] ?? STATUS_STYLES.en_attente;
  const statusLabel = item.statut_inscription === 'accepte'
    ? t('mes_formations.status_accepted')
    : item.statut_inscription === 'refuse'
      ? t('mes_formations.status_refused')
      : t('mes_formations.status_pending');

  const rows = [
    [t('mes_formations.label_formateur'),  item.nom_formateur ?? '—'],
    [t('mes_formations.label_niveau'),     item.niveau ?? '—'],
    [t('mes_formations.label_duree'),      item.duree ? `${item.duree}h` : '—'],
    [t('mes_formations.label_prix'),       item.prix != null ? `${item.prix} DA` : '—'],
    [t('mes_formations.label_date_debut'), fmt(item.date_debut)],
    [t('mes_formations.label_date_fin'),   fmt(item.date_fin)],
    [t('mes_formations.label_inscrit_le'), fmt(item.inscrit_le)],
  ].filter(([, v]) => v && v !== '—');

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-gradient-to-br from-teal-600 to-teal-500 px-6 py-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              {item.domaine && (
                <p className="text-teal-200 text-[10px] font-black uppercase tracking-widest mb-1">{item.domaine}</p>
              )}
              <h2 className="text-white font-black text-lg leading-snug">{item.title}</h2>
            </div>
            <button onClick={onClose} className="text-white/60 hover:text-white text-xl leading-none mt-0.5 shrink-0">✕</button>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black ${s.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
              {statusLabel}
            </span>
            {item.niveau && (
              <span className={`px-2.5 py-1 rounded-full text-xs font-black ${NIVEAU_BADGE[item.niveau] ?? 'bg-white/20 text-white'}`}>
                {item.niveau}
              </span>
            )}
          </div>
        </div>

        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {item.description && (
            <p className="text-sm text-slate-600 leading-relaxed border-l-4 border-teal-200 pl-3">{item.description}</p>
          )}

          <div className="grid grid-cols-2 gap-2">
            {rows.map(([label, value]) => (
              <div key={label} className="bg-slate-50 rounded-xl px-3 py-2.5">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
                <p className="text-sm font-bold text-slate-800 mt-0.5">{value}</p>
              </div>
            ))}
          </div>

          {(item.score_technique > 0 || item.score_soft_skills > 0) && (
            <div className="space-y-2 pt-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('mes_formations.label_scores')}</p>
              <ScoreBar label={t('mes_formations.label_score_tech')} value={item.score_technique} />
              <ScoreBar label={t('mes_formations.label_score_soft')} value={item.score_soft_skills} />
            </div>
          )}
        </div>

        <div className="px-6 pb-6 flex gap-3 border-t border-slate-100 pt-4">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-bold text-slate-600 transition-colors"
          >
            {t('mes_formations.modal_close')}
          </button>
          {item.statut_inscription === 'en_attente' && (
            <button
              onClick={() => onCancel(item.inscription_id)}
              disabled={cancelling}
              className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 rounded-xl text-sm font-bold text-white transition-colors"
            >
              {cancelling ? t('mes_formations.modal_cancelling') : t('mes_formations.modal_cancel_btn')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const FormationCard = ({ f, onClick, t }) => {
  const s = STATUS_STYLES[f.statut_inscription] ?? STATUS_STYLES.en_attente;
  const statusLabel = f.statut_inscription === 'accepte'
    ? t('mes_formations.status_accepted')
    : f.statut_inscription === 'refuse'
      ? t('mes_formations.status_refused')
      : t('mes_formations.status_pending');

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl border border-slate-100 hover:border-teal-200 hover:shadow-lg cursor-pointer transition-all group overflow-hidden"
    >
      <div className={`h-1 ${s.bar}`} />
      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            {f.domaine && (
              <p className="text-[9px] font-black text-teal-600 uppercase tracking-widest mb-1">{f.domaine}</p>
            )}
            <h3 className="font-black text-slate-900 text-sm leading-snug line-clamp-2 group-hover:text-teal-700 transition-colors">
              {f.title}
            </h3>
          </div>
          <span className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black ${s.badge}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
            {statusLabel}
          </span>
        </div>

        <div className="space-y-1.5 text-xs text-slate-500">
          {f.nom_formateur && (
            <div className="flex items-center gap-2">
              <span>👨‍🏫</span>
              <span className="font-medium truncate">{f.nom_formateur}</span>
            </div>
          )}
          {f.niveau && (
            <div className="flex items-center gap-2">
              <span>📊</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${NIVEAU_BADGE[f.niveau] ?? 'bg-slate-100 text-slate-500'}`}>
                {f.niveau}
              </span>
              {f.duree && <span className="text-slate-400">· {f.duree}h</span>}
            </div>
          )}
          {(f.date_debut || f.date_fin) && (
            <div className="flex items-center gap-2">
              <span>📅</span>
              <span>{fmt(f.date_debut)} → {fmt(f.date_fin)}</span>
            </div>
          )}
        </div>

        {(f.score_technique > 0 || f.score_soft_skills > 0) && (
          <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
            <ScoreBar label={t('mes_formations.label_score_tech')} value={f.score_technique} />
            <ScoreBar label={t('mes_formations.label_score_soft')} value={f.score_soft_skills} />
          </div>
        )}

        <p className="mt-3 text-[10px] text-slate-400">
          {t('mes_formations.label_inscrit_le')} {fmt(f.inscrit_le)}
        </p>
      </div>
    </div>
  );
};

const StagiaireMesFormations = () => {
  const { id: paramId } = useParams();
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const userId = paramId ? parseInt(paramId) : user?.id;

  const [formations, setFormations] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [search, setSearch]         = useState('');
  const [tab, setTab]               = useState('tous');
  const [selected, setSelected]     = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [toast, setToast]           = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    api.get(`/app/stagiaire/${userId}/formations`)
      .then(r => setFormations(r.data.formations ?? []))
      .catch(() => setError(t('mes_formations.error_load')))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [userId]);

  const cancelInscription = async (inscriptionId) => {
    if (!window.confirm(t('mes_formations.modal_confirm_msg'))) return;
    setCancelling(true);
    try {
      await api.delete(`/app/inscriptions/candidats/${inscriptionId}`);
      setFormations(prev => prev.filter(f => f.inscription_id !== inscriptionId));
      setSelected(null);
      showToast(t('mes_formations.toast_cancelled'));
    } catch {
      showToast(t('mes_formations.error_cancel'), 'error');
    } finally {
      setCancelling(false);
    }
  };

  const counts = useMemo(() => ({
    tous:       formations.length,
    accepte:    formations.filter(f => f.statut_inscription === 'accepte').length,
    en_attente: formations.filter(f => f.statut_inscription === 'en_attente').length,
    refuse:     formations.filter(f => f.statut_inscription === 'refuse').length,
  }), [formations]);

  const filtered = useMemo(() => {
    let r = formations;
    if (tab !== 'tous') r = r.filter(f => f.statut_inscription === tab);
    if (search) {
      const q = search.toLowerCase();
      r = r.filter(f =>
        f.title?.toLowerCase().includes(q) ||
        f.domaine?.toLowerCase().includes(q) ||
        f.nom_formateur?.toLowerCase().includes(q)
      );
    }
    return r;
  }, [formations, tab, search]);

  const TABS = [
    { key: 'tous',       label: t('mes_formations.tab_all'),      count: counts.tous },
    { key: 'accepte',    label: t('mes_formations.tab_accepted'),  count: counts.accepte },
    { key: 'en_attente', label: t('mes_formations.tab_pending'),   count: counts.en_attente },
    { key: 'refuse',     label: t('mes_formations.tab_refused'),   count: counts.refuse },
  ];

  return (
    <DashboardLayout role="stagiaire" userId={userId}>
      <div className="min-h-screen bg-slate-50 p-6 font-['Inter']">

        {toast && (
          <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-2xl text-sm font-bold shadow-xl transition-all
            ${toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'}`}>
            {toast.msg}
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900">{t('mes_formations.title')}</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {formations.length > 0
                ? `${formations.length} ${t('mes_formations.subtitle_plural')}`
                : t('mes_formations.subtitle_none')}
            </p>
          </div>
          <button
            onClick={() => navigate('/formations')}
            className="px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-bold hover:bg-teal-700 transition-colors shadow-sm"
          >
            {t('mes_formations.btn_new')}
          </button>
        </div>

        <div className="flex flex-col gap-3 mb-6">
          <input
            type="text"
            placeholder={t('mes_formations.search_placeholder')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
          />
          <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 w-fit">
            {TABS.map(tb => (
              <button
                key={tb.key}
                onClick={() => setTab(tb.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all
                  ${tab === tb.key ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                {tb.label}
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-black
                  ${tab === tb.key ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-400'}`}>
                  {tb.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="p-4 mb-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-600 font-bold flex items-center gap-2">
            <span>⚠️</span> {error}
            <button onClick={load} className="ml-auto underline">{t('mes_formations.btn_retry')}</button>
          </div>
        )}

        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 overflow-hidden animate-pulse">
                <div className="h-1 bg-slate-200" />
                <div className="p-5 space-y-3">
                  <div className="h-3 bg-slate-200 rounded w-1/3" />
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <span className="text-6xl mb-4">📚</span>
            <p className="text-base font-black text-slate-600">{t('mes_formations.empty_title')}</p>
            <p className="text-sm mt-1 text-center max-w-sm">
              {tab !== 'tous'
                ? t('mes_formations.empty_other_filter')
                : t('mes_formations.empty_main')}
            </p>
            <button
              onClick={() => navigate('/formations')}
              className="mt-5 px-6 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-bold hover:bg-teal-700 transition-colors"
            >
              {t('mes_formations.btn_explore')}
            </button>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(f => (
              <FormationCard key={f.inscription_id} f={f} onClick={() => setSelected(f)} t={t} />
            ))}
          </div>
        )}
      </div>

      {selected && (
        <DetailModal
          item={selected}
          onClose={() => setSelected(null)}
          onCancel={cancelInscription}
          cancelling={cancelling}
          t={t}
        />
      )}
    </DashboardLayout>
  );
};

export default StagiaireMesFormations;
