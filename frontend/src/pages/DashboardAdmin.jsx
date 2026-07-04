import React from 'react';
import { useTranslation } from '../context/LanguageContext';
import DashboardLayout from '../components/DashboardLayout';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import './DashboardAdmin.css';

/* ── MOCK DATA ── */
const LINE_DATA = [
  { name: 'Jan', value: 240 },
  { name: 'Feb', value: 320 },
  { name: 'Mar', value: 290 },
  { name: 'Apr', value: 410 },
  { name: 'May', value: 380 },
  { name: 'Jun', value: 450 },
  { name: 'Jul', value: 520 },
  { name: 'Aug', value: 480 },
  { name: 'Sep', value: 610 },
  { name: 'Oct', value: 590 },
  { name: 'Nov', value: 720 },
  { name: 'Dec', value: 840 },
];

const TOP_5_DATA = [
  { name: 'Full-Stack JS', value: 102 },
  { name: 'UX Design', value: 84 },
  { name: 'Marketing', value: 84 },
  { name: 'Data Science', value: 83 },
  { name: 'Soft Skills', value: 76 },
];

const PIE_DATA = [
  { name: 'Informatique', value: 28.96 },
  { name: 'Design', value: 22.79 },
  { name: 'Marketing', value: 14.71 },
  { name: 'Business', value: 5.03 },
  { name: 'Langues', value: 28.51 },
];

const REGION_DATA = [
  { name: 'Centre', value: 121 },
  { name: 'Est', value: 116 },
  { name: 'Ouest', value: 109 },
  { name: 'Sud', value: 101 },
];

const PRODUCT_DATA = [
  { name: 'React Pro', value: 61 },
  { name: 'UI Patterns', value: 36 },
  { name: 'Figma Mastery', value: 34 },
  { name: 'Node Experts', value: 20 },
  { name: 'Agile Cert', value: 20 },
];

const COLORS = ['#0047AB', '#32b1d1ff', '#71afc5ff', '#159dc7ff', '#005f82ff'];

const KPICard = ({ label, value, trend, trendType, icon, color, bg }) => {
  const { t } = useTranslation();
  return (
    <div className="da-kpi-card-new" style={{ backgroundColor: bg }}>
      <div className="da-kpi-top">
        <span className="da-kpi-label-new">{label}</span>
        <span className="da-kpi-icon-new">{icon}</span>
      </div>
      <div className="da-kpi-value-new" style={{ color: color }}>{value}</div>
      <div className={`da-kpi-trend-new ${trendType}`}>
        {trendType === 'up' ? <i className="fas fa-caret-up"></i> : <i className="fas fa-caret-down"></i>} {trend} {t('da.vs_prev_month')}
      </div>
    </div>
  );
};

const DashboardAdmin = () => {
  const { t } = useTranslation();

  return (
    <DashboardLayout role="admin">
      <div className="da-analytical-page">

        {/* ── HEADER ── */}
        <header className="da-analytical-header">
          <div className="da-header-left">
            <h1>{t('da.page_title')}</h1>
            <p>{t('da.page_sub')}</p>
          </div>
          <div className="da-header-right">
            <div className="da-month-selector">
              <span>{t('da.month_label')}</span>
              <select><option>{t('da.month_december')}</option></select>
            </div>
          </div>
        </header>

        {/* ── KPI ROW ── */}
        <div className="da-kpi-row">
          <KPICard
            label={t('da.kpi_revenue')} value="$0.84M" trend="+16.9%" trendType="up"
            icon="" color="white" bg="#0047AB"
          />
          <KPICard
            label={t('da.kpi_enrollments')} value="1,256" trend="+12.1%" trendType="up"
            icon="" color="#1E293B" bg="#E0F7FA"
          />
          <KPICard
            label={t('da.kpi_students')} value="842" trend="-2.2%" trendType="down"
            icon="" color="#1E293B" bg="#E8F5E9"
          />
          <KPICard
            label={t('da.kpi_certifs')} value="512" trend="+16.8%" trendType="up"
            icon="" color="#1E293B" bg="#FFEBEE"
          />
          <KPICard
            label={t('da.kpi_conversion')} value="64.22%" trend="+14.6%" trendType="up"
            icon="" color="#1E293B" bg="#F3E5F5"
          />
        </div>

        {/* ── MAIN CHARTS ── */}
        <div className="da-charts-grid-main">

          <div className="da-chart-container da-span-2">
            <h3>{t('da.chart_revenue')}</h3>
            <div className="da-chart-box">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={LINE_DATA}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0047AB" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#0047AB" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="value" stroke="#0047AB" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="da-chart-container">
            <h3>{t('da.chart_top5')}</h3>
            <div className="da-chart-box">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={TOP_5_DATA}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 10 }} />
                  <YAxis hide />
                  <Tooltip cursor={{ fill: 'transparent' }} />
                  <Bar dataKey="value" fill='#32b1d1ff' radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* ── BOTTOM CHARTS ── */}
        <div className="da-charts-grid-bottom">

          <div className="da-chart-container">
            <h3>{t('da.chart_enrollments')}</h3>
            <div className="da-chart-box">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={PIE_DATA}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {PIE_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend iconType="circle" layout="vertical" align="right" verticalAlign="middle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="da-chart-container">
            <h3>{t('da.chart_regions')}</h3>
            <div className="da-chart-box">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={REGION_DATA} layout="vertical" margin={{ left: 20 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                  <Tooltip cursor={{ fill: 'transparent' }} />
                  <Bar dataKey="value" fill="#3486acff" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="da-chart-container">
            <h3>{t('da.chart_modules')}</h3>
            <div className="da-chart-box">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={PRODUCT_DATA} layout="vertical" margin={{ left: 20 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                  <Tooltip cursor={{ fill: 'transparent' }} />
                  <Bar dataKey="value" fill="#399ac7ff" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

      </div>
    </DashboardLayout>
  );
};

export default DashboardAdmin;
