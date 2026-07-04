import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import './DashboardFormateur.css';
import { fetchFormationStats } from '../services/Formationservice';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Filler, Tooltip, Legend,
);

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444'];

// ── helpers ──────────────────────────────────────────────────────────────────
const fmtEarnings = (val) => {
  if (!val && val !== 0) return '—';
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M DA`;
  if (val >= 1_000)     return `${(val / 1_000).toFixed(1)}K DA`;
  return `${Math.round(val)} DA`;
};

const gradientGreen = (ctx) => {
  const { chart } = ctx;
  const { chartArea } = chart;
  if (!chartArea) return 'rgba(16,185,129,0)';
  const g = chart.ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
  g.addColorStop(0, 'rgba(16,185,129,0.18)');
  g.addColorStop(1, 'rgba(16,185,129,0)');
  return g;
};

// ── KPI components ───────────────────────────────────────────────────────────
const KPISkeleton = () => (
  <div className="df-kpi-card-new" style={{ backgroundColor: '#F1F5F9' }}>
    <div style={{ height: 14, width: 96, background: '#E2E8F0', borderRadius: 6, marginBottom: 12 }} />
    <div style={{ height: 32, width: 80, background: '#E2E8F0', borderRadius: 6, marginBottom: 8 }} />
    <div style={{ height: 11, width: 120, background: '#F1F5F9', borderRadius: 6 }} />
  </div>
);

const KPICard = ({ label, value, trend, trendType, bg }) => (
  <div className="df-kpi-card-new" style={{ backgroundColor: bg }}>
    <div className="df-kpi-top">
      <span className="df-kpi-label-new">{label}</span>
    </div>
    <div className="df-kpi-value-new" style={{ color: '#1E293B' }}>{value ?? '—'}</div>
    {trend && (
      <div className={`df-kpi-trend-new ${trendType ?? 'up'}`}>
        {trendType === 'down' ? '▼' : '▲'} {trend}
      </div>
    )}
  </div>
);

// ── Chart placeholder ─────────────────────────────────────────────────────────
const ChartEmpty = ({ height = 300, icon, text }) => (
  <div
    style={{ height, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#94A3B8', fontSize: 13 }}
  >
    <span style={{ fontSize: 28 }}>{icon}</span>
    <p>{text}</p>
  </div>
);

const ChartSpinner = ({ height = 300, color = '#10B981' }) => (
  <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ width: 32, height: 32, border: `3px solid ${color}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
  </div>
);

// ── Options Chart.js réutilisables ────────────────────────────────────────────
const tooltipDefaults = {
  backgroundColor: '#fff',
  titleColor: '#94A3B8',
  bodyColor: '#1E293B',
  borderColor: '#E2E8F0',
  borderWidth: 1,
  padding: 10,
  cornerRadius: 10,
};

const xAxisStyle  = { grid: { display: false }, border: { display: false }, ticks: { color: '#64748B' } };
const yAxisHidden = { display: false };

// ── Composant principal ───────────────────────────────────────────────────────
const DashboardFormateur = () => {
  const { t }     = useTranslation();
  const { user }  = useAuth();
  const navigate  = useNavigate();
  const { id: paramId } = useParams();

  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const userId = paramId ? parseInt(paramId) : (user?.id ?? user?.user_id);

  const loadStats = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      setError(null);
      setStats(await fetchFormationStats(userId));
    } catch {
      setError('Impossible de charger les statistiques.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { loadStats(); }, [loadStats]);

  // ── KPIs ─────────────────────────────────────────────────────────────────
  const kpiCards = stats ? [
    { label: t('df.kpi_total_students'), value: String(stats.total_stagiaires ?? 0),                    trend: `${stats.total_acceptes ?? 0} ${t('df.accepted')}`,           trendType: 'up',   bg: '#E0F2F1' },
    { label: t('df.kpi_avg_completion'), value: `${stats.taux_completion ?? 0}%`,                       trend: `${stats.formations_actives ?? 0} ${t('df.active_formations')}`, trendType: 'up', bg: '#E3F2FD' },
    { label: t('df.kpi_rating'),         value: stats.note_moyenne > 0 ? `${stats.note_moyenne}/5` : '—', trend: stats.note_moyenne >= 4 ? t('df.good_level') : t('df.in_progress_trend'), trendType: stats.note_moyenne >= 4 ? 'up' : 'down', bg: '#FFF8E1' },
    { label: t('df.kpi_hours'),          value: `${stats.total_heures ?? 0}h`,                         trend: `${stats.total_formations ?? 0} ${t('df.active_formations')}`, trendType: 'up', bg: '#F3E5F5' },
    { label: t('df.kpi_earnings'),       value: fmtEarnings(stats.revenus_reels),                       trend: `${t('df.potential')} : ${fmtEarnings(stats.revenus_potentiels)}`, trendType: 'up', bg: '#E8F5E9' },
  ] : null;

  // ── Données brutes ────────────────────────────────────────────────────────
  const perfData  = stats?.performance_trend   ?? [];
  const courses   = stats?.students_by_course  ?? [];
  const ratings   = stats?.rating_distribution ?? [];
  const engData   = stats?.weekly_engagement   ?? [];

  const hasPerf = perfData.some(d => d.score > 0);
  const hasEng  = engData.some(d => d.active > 0);
  const hasRatings = ratings.some(d => d.value > 0);

  // ── Chart.js datasets ─────────────────────────────────────────────────────
  const lineData = {
    labels: perfData.map(d => d.name),
    datasets: [{
      label: t('df.score_label'),
      data: perfData.map(d => d.score),
      borderColor: '#10B981',
      borderWidth: 3,
      fill: true,
      backgroundColor: gradientGreen,
      pointBackgroundColor: '#10B981',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 5,
      tension: 0.4,
    }],
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { ...tooltipDefaults, callbacks: { label: (c) => `${t('df.score_label')} : ${c.parsed.y}` } },
    },
    scales: {
      x: { ...xAxisStyle, ticks: { color: '#64748B', font: { size: 12 } } },
      y: {
        grid: { color: '#E2E8F0' }, border: { display: false },
        ticks: { color: '#64748B', font: { size: 12 } },
        min: 0, max: 100,
      },
    },
  };

  const courseData = {
    labels: courses.map(d => d.name),
    datasets: [{
      label: t('df.etudiants'),
      data: courses.map(d => d.students),
      backgroundColor: '#3B82F6',
      borderRadius: 4,
      borderSkipped: false,
    }],
  };

  const courseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { ...tooltipDefaults, callbacks: { label: (c) => `${c.parsed.y} ${t('df.etudiants')}` } },
    },
    scales: {
      x: { ...xAxisStyle, ticks: { color: '#64748B', font: { size: 10 } } },
      y: yAxisHidden,
    },
  };

  const doughnutData = {
    labels: ratings.map(d => d.name),
    datasets: [{
      data: ratings.map(d => d.value),
      backgroundColor: COLORS,
      borderWidth: 0,
      hoverOffset: 6,
    }],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: {
        display: true,
        position: 'right',
        labels: { usePointStyle: true, pointStyle: 'circle', color: '#64748B', font: { size: 12 }, padding: 14 },
      },
      tooltip: { ...tooltipDefaults, callbacks: { label: (c) => ` ${c.parsed} ${t('df.candidats')}` } },
    },
  };

  const engChartData = {
    labels: engData.map(d => d.name),
    datasets: [{
      label: t('df.inscriptions'),
      data: engData.map(d => d.active),
      backgroundColor: '#F59E0B',
      borderRadius: 4,
      borderSkipped: false,
    }],
  };

  const engOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { ...tooltipDefaults, callbacks: { label: (c) => `${c.parsed.y} ${t('df.inscriptions')}` } },
    },
    scales: {
      x: { ...xAxisStyle, ticks: { color: '#64748B', font: { size: 12 } } },
      y: yAxisHidden,
    },
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout role="formateur" userId={userId}>
      <div className="df-analytical-page">

        {/* HEADER */}
        <header className="df-analytical-header">
          <div className="df-header-left">
            <h1>{t('df.page_title')}</h1>
            <p>{t('df.page_sub')}</p>
          </div>
          <div className="df-header-right">
            <div className="df-period-selector">
              <span>{t('df.semester')}</span>
              <select><option>{t('df.spring_2026')}</option></select>
            </div>
          </div>
        </header>

        {error && (
          <div style={{ margin: '12px 24px', padding: '12px 16px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, color: '#DC2626', fontSize: 13, fontWeight: 600 }}>
            {t('df.error_stats')}
            <button onClick={loadStats} style={{ marginLeft: 12, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626' }}>{t('common.retry')}</button>
          </div>
        )}

        {/* KPI ROW */}
        <div className="df-kpi-row">
          {loading
            ? Array.from({ length: 5 }).map((_, i) => <KPISkeleton key={i} />)
            : kpiCards?.map((c, i) => <KPICard key={i} {...c} />)
          }
        </div>

        {/* MAIN CHARTS */}
        <div className="df-charts-grid-main">

          {/* Line Chart — Performance Trend */}
          <div className="df-chart-container df-span-2">
            <h3>{t('df.chart_perf_trend')}</h3>
            <div className="df-chart-box">
              {loading
                ? <ChartSpinner height={300} color="#10B981" />
                : !hasPerf
                  ? <ChartEmpty height={300} icon="📊" text={t('df.no_score_data')} />
                  : <div style={{ height: 300 }}><Line data={lineData} options={lineOptions} /></div>
              }
            </div>
          </div>

          {/* Bar Chart — Students by Course */}
          <div className="df-chart-container">
            <h3>{t('df.chart_students_course')}</h3>
            <div className="df-chart-box">
              {loading
                ? <ChartSpinner height={300} color="#3B82F6" />
                : courses.length === 0
                  ? <ChartEmpty height={300} icon="📚" text={t('df.no_formations')} />
                  : <div style={{ height: 300 }}><Bar data={courseData} options={courseOptions} /></div>
              }
            </div>
          </div>

        </div>

        {/* BOTTOM CHARTS */}
        <div className="df-charts-grid-bottom">

          {/* Doughnut — Rating Distribution */}
          <div className="df-chart-container">
            <h3>{t('df.chart_rating_dist')}</h3>
            <div className="df-chart-box">
              {loading
                ? <ChartSpinner height={250} color="#F59E0B" />
                : !hasRatings
                  ? <ChartEmpty height={250} icon="⭐" text={t('df.no_ratings')} />
                  : <div style={{ height: 250 }}><Doughnut data={doughnutData} options={doughnutOptions} /></div>
              }
            </div>
          </div>

          {/* Bar Chart — Weekly Engagement */}
          <div className="df-chart-container">
            <h3>{t('df.chart_weekly')}</h3>
            <div className="df-chart-box">
              {loading
                ? <ChartSpinner height={250} color="#F59E0B" />
                : !hasEng
                  ? <ChartEmpty height={250} icon="📅" text={t('df.no_engagement')} />
                  : <div style={{ height: 250 }}><Bar data={engChartData} options={engOptions} /></div>
              }
            </div>
          </div>

          {/* Quick Action Board */}
          <div className="df-chart-container">
            <h3>{t('df.quick_actions')}</h3>
            <div className="df-quick-actions">
              <button className="df-action-btn-new" onClick={() => navigate(`/dashboard/formateur/${userId}/formations`)}>{t('df.btn_formations')}</button>
              <button className="df-action-btn-new" onClick={() => navigate(`/dashboard/formateur/${userId}/demandes`)}>{t('df.btn_demandes')}</button>
              <button className="df-action-btn-new" onClick={() => navigate(`/dashboard/formateur/${userId}/stagiaires`)}>{t('df.btn_stagiaires')}</button>
              <button className="df-action-btn-new" onClick={() => navigate(`/dashboard/formateur/${userId}/profil`)}>{t('df.btn_profil')}</button>
            </div>
          </div>

        </div>

      </div>
    </DashboardLayout>
  );
};

export default DashboardFormateur;
