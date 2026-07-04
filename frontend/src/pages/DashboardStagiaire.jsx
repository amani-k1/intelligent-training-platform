import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import api from '../api/axios';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import './DashboardStagiaire.css';

const STATUS_COLORS = { accepte: '#10B981', en_attente: '#F59E0B', refuse: '#EF4444' };
const PIE_COLORS   = ['#10B981', '#F59E0B', '#EF4444', '#3B82F6'];

// ── Composants utilitaires ────────────────────────────────────────────────────
const KPICard = ({ label, value, trend, trendType, bg }) => (
  <div className="ds-kpi-card-new" style={{ backgroundColor: bg }}>
    <div className="ds-kpi-top">
      <span className="ds-kpi-label-new">{label}</span>
    </div>
    <div className="ds-kpi-value-new" style={{ color: '#1E293B' }}>{value ?? '—'}</div>
    {trend && (
      <div className={`ds-kpi-trend-new ${trendType ?? 'up'}`}>
        {trendType === 'down' ? '▼' : '▲'} {trend}
      </div>
    )}
  </div>
);

const Spinner = ({ height = 250 }) => (
  <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ width: 32, height: 32, border: '3px solid #3B82F6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
  </div>
);

const Empty = ({ height = 250, text }) => (
  <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: 13 }}>
    {text}
  </div>
);

// ── Composant principal ───────────────────────────────────────────────────────
const DashboardStagiaire = () => {
  const { t }  = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id: paramId } = useParams();

  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const userId = paramId ? parseInt(paramId) : (user?.id ?? user?.user_id);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    api.get(`/app/stagiaire/${userId}/stats`)
      .then(r => setStats(r.data))
      .catch(() => setError('Impossible de charger les données du stagiaire.'))
      .finally(() => setLoading(false));
  }, [userId]);

  const userName = stats?.user?.name ?? user?.name ?? 'Stagiaire';

  // ── KPIs ─────────────────────────────────────────────────────────────────
  const kpiCards = [
    { label: t('ds.kpi_inscribed'),   value: String(stats?.total_inscriptions ?? 0),      trend: t('ds.kpi_total_label'),    trendType: 'up',   bg: '#DBEAFE' },
    { label: t('ds.kpi_accepted'),    value: String(stats?.acceptees ?? 0),               trend: t('ds.kpi_confirmed'),      trendType: 'up',   bg: '#DCFCE7' },
    { label: t('ds.kpi_pending'),     value: String(stats?.en_attente ?? 0),              trend: t('ds.kpi_to_validate'),    trendType: 'up',   bg: '#FEF3C7' },
    { label: t('ds.kpi_score_tech'),  value: `${stats?.avg_score_technique ?? 0}/100`,   trend: (stats?.avg_score_technique ?? 0) >= 60 ? t('ds.kpi_good_level') : t('ds.kpi_in_progress'), trendType: (stats?.avg_score_technique ?? 0) >= 60 ? 'up' : 'down', bg: '#F3E8FF' },
    { label: t('ds.kpi_score_soft'),  value: `${stats?.avg_score_soft_skills ?? 0}/100`, trend: t('ds.kpi_skills'),         trendType: 'up',   bg: '#FFEDD5' },
  ];

  // ── Données charts ────────────────────────────────────────────────────────
  const formations = stats?.formations ?? [];

  const scoreChartData = formations.map(f => ({
    name: f.formation_title.length > 12 ? f.formation_title.slice(0, 12) + '…' : f.formation_title,
    technique:  f.score_technique,
    softskills: f.score_soft_skills,
  }));

  const statusPieData = [
    { name: t('ds.accepted_badge'), value: stats?.acceptees ?? 0 },
    { name: t('ds.pending_badge'),  value: stats?.en_attente ?? 0 },
    { name: t('ds.refused_badge'),  value: stats?.refuses   ?? 0 },
  ].filter(d => d.value > 0);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout role="stagiaire" userId={userId}>
      <div className="ds-analytical-page">

        {/* HEADER */}
        <header className="ds-analytical-header">
          <div className="ds-header-left">
            <h1>{t('ds.page_title')}</h1>
            <p>{userName} • {t('ds.page_sub')}</p>
          </div>
        </header>

        {error && (
          <div style={{ padding: '12px 16px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, color: '#DC2626', fontSize: 13, fontWeight: 600 }}>
            {t('ds.error_load')}
          </div>
        )}

        {/* KPI ROW */}
        <div className="ds-kpi-row">
          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="ds-kpi-card-new" style={{ backgroundColor: '#F1F5F9' }}>
                  <div style={{ height: 14, width: 96,  background: '#E2E8F0', borderRadius: 6, marginBottom: 12 }} />
                  <div style={{ height: 32, width: 64,  background: '#E2E8F0', borderRadius: 6, marginBottom: 8 }} />
                  <div style={{ height: 11, width: 120, background: '#F1F5F9', borderRadius: 6 }} />
                </div>
              ))
            : kpiCards.map((c, i) => <KPICard key={i} {...c} />)
          }
        </div>

        {/* MAIN CHARTS */}
        <div className="ds-charts-grid-main">

          {/* Scores par formation */}
          <div className="ds-chart-container ds-span-2">
            <h3>{t('ds.chart_scores')}</h3>
            <div className="ds-chart-box">
              {loading ? <Spinner height={300} />
                : scoreChartData.length === 0
                  ? <Empty height={300} text={t('ds.no_inscription')} />
                  : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={scoreChartData}>
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} domain={[0, 100]} />
                        <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #E2E8F0', fontSize: 12 }} />
                        <Legend iconType="circle" />
                        <Bar dataKey="technique"  name={t('ds.kpi_score_tech')}  fill="#3B82F6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="softskills" name={t('ds.kpi_score_soft')}  fill="#10B981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )
              }
            </div>
          </div>

          {/* Statut des inscriptions — Pie */}
          <div className="ds-chart-container">
            <h3>{t('ds.chart_status')}</h3>
            <div className="ds-chart-box">
              {loading ? <Spinner height={300} />
                : statusPieData.length === 0
                  ? <Empty height={300} text={t('common.no_registration')} />
                  : (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie data={statusPieData} innerRadius={60} outerRadius={85} paddingAngle={5} dataKey="value">
                          {statusPieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #E2E8F0', fontSize: 12 }} />
                        <Legend iconType="circle" layout="vertical" align="right" verticalAlign="middle" />
                      </PieChart>
                    </ResponsiveContainer>
                  )
              }
            </div>
          </div>

        </div>

        {/* BOTTOM SECTION */}
        <div className="ds-charts-grid-bottom">

          {/* Liste des formations */}
          <div className="ds-chart-container" style={{ gridColumn: 'span 2' }}>
            <h3>{t('ds.my_formations_title')}</h3>
            {loading ? <Spinner height={200} />
              : formations.length === 0
                ? <Empty height={200} text={t('ds.no_formation')} />
                : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {formations.map((f, i) => (
                      <div key={i} style={{ padding: '10px 14px', borderRadius: 10, background: '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13, color: '#1E293B' }}>{f.formation_title}</div>
                          <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
                            {t('ds.tech_label')} {f.score_technique}/100 · {t('ds.soft_label')} {f.score_soft_skills}/100
                          </div>
                        </div>
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99,
                          background: f.statut === 'accepte' ? '#DCFCE7' : f.statut === 'refuse' ? '#FEE2E2' : '#FEF3C7',
                          color: STATUS_COLORS[f.statut] ?? '#64748B',
                        }}>
                          {f.statut === 'accepte' ? t('ds.accepted_badge') : f.statut === 'refuse' ? t('ds.refused_badge') : t('ds.pending_badge')}
                        </span>
                      </div>
                    ))}
                  </div>
                )
            }
          </div>

          {/* Quick Actions */}
          <div className="ds-chart-container">
            <h3>{t('ds.learning_path')}</h3>
            <div className="ds-quick-actions">
              <button className="ds-action-btn-new" onClick={() => navigate(`/dashboard/stagiaire/${userId}`)}>{t('ds.btn_home')}</button>
              <button className="ds-action-btn-new" onClick={() => navigate('/formations')}>{t('ds.btn_catalog')}</button>
              <button className="ds-action-btn-new" onClick={() => navigate(`/dashboard/stagiaire/${userId}/profil`)}>{t('ds.btn_profile')}</button>
              <button className="ds-action-btn-new" onClick={() => navigate(`/dashboard/stagiaire/${userId}/notifications`)}>{t('ds.btn_notifs')}</button>
            </div>
          </div>

        </div>

      </div>
    </DashboardLayout>
  );
};

export default DashboardStagiaire;
