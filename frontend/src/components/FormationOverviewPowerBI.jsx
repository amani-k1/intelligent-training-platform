import React, { useState, useMemo } from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import {
  UsersIcon,
  CheckBadgeIcon,
  StarIcon,
  NoSymbolIcon,
  BookOpenIcon,
  BellIcon,
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';
import './FormationOverviewPowerBI.css';

/* ── MOCK DATA SIMULÉ ── */
const MOCK_DATA = {
  "7d": {
    inscriptions: [
      { date: 'Mon', count: 2 }, { date: 'Tue', count: 5 }, { date: 'Wed', count: 3 },
      { date: 'Thu', count: 8 }, { date: 'Fri', count: 12 }, { date: 'Sat', count: 4 }, { date: 'Sun', count: 6 }
    ],
    repartition: [
      { name: 'Débutant', value: 45 }, { name: 'Intermédiaire', value: 35 }, { name: 'Avancé', value: 20 }
    ],
    notes: [
      { session: 'S1', note: 4.2 }, { session: 'S2', note: 4.5 }, { session: 'S3', note: 4.8 }
    ],
    kpis: {
      stagiaires: { val: 18, var: "+5%", positive: true },
      completion: { val: "68%", var: "+2%", positive: true },
      note: { val: "4.8", var: "0.0", positive: true },
      abandon: { val: "2%", var: "-1%", positive: true },
      modules: { val: 12 }
    }
  },
  "30d": {
    inscriptions: [
      { date: 'Sem 1', count: 15 }, { date: 'Sem 2', count: 28 }, { date: 'Sem 3', count: 42 }, { date: 'Sem 4', count: 35 }
    ],
    repartition: [
      { name: 'Débutant', value: 40 }, { name: 'Intermédiaire', value: 40 }, { name: 'Avancé', value: 20 }
    ],
    notes: [
      { session: 'S1', note: 4.0 }, { session: 'S2', note: 4.2 }, { session: 'S3', note: 4.5 }, { session: 'S4', note: 4.8 }
    ],
    kpis: {
      stagiaires: { val: 124, var: "+18%", positive: true },
      completion: { val: "64%", var: "-3%", positive: false },
      note: { val: "4.7", var: "+0.2", positive: true },
      abandon: { val: "5%", var: "+2%", positive: false },
      modules: { val: 12 }
    }
  }
};

const COLORS = ['#0a8fa0', '#f97316', '#064e3b', '#ef4444'];

const FormationOverviewPowerBI = ({ formationId }) => {
  const [period, setPeriod] = useState('7d');
  const activeData = useMemo(() => MOCK_DATA[period], [period]);

  const handleExport = () => {
    alert("Exportation CSV en cours...");
  };

  const handleAnnounce = () => {
    const msg = prompt("Entrez votre annonce pour tous les stagiaires :");
  };

  return (
    <div className="pbi-container">

      {/* ── 0. Slicers (Filtres) ── */}
      <div className="pbi-slicers">
        <div className="pbi-slicer">
          <label>Période d'analyse</label>
          <div className="pbi-slicer__options">
            <button
              className={period === '7d' ? 'active' : ''}
              onClick={() => setPeriod('7d')}
            >7 Jours</button>
            <button
              className={period === '30d' ? 'active' : ''}
              onClick={() => setPeriod('30d')}
            >30 Jours</button>
          </div>
        </div>
        <div className="pbi-actions">
          <button className="pbi-btn pbi-btn--primary" onClick={handleAnnounce}>Envoyer une annonce</button>
          <button className="pbi-btn pbi-btn--outline" onClick={handleExport}>Exporter CSV</button>
        </div>
      </div>

      {/* ── 1. KPI Cards ── */}
      <div className="pbi-kpis">
        <KPICard
          title="Stagiaires inscrits"
          value={activeData.kpis.stagiaires.val}
          variation={activeData.kpis.stagiaires.var}
          positive={activeData.kpis.stagiaires.positive}
          icon={<UsersIcon className="h-6 w-6" />}
          color="#0a8fa0"
          tooltip="Nombre total d'élèves ayant rejoint la formation sur la période."
        />
        <KPICard
          title="Taux de complétion"
          value={activeData.kpis.completion.val}
          variation={activeData.kpis.completion.var}
          positive={activeData.kpis.completion.positive}
          icon={<CheckBadgeIcon className="h-6 w-6" />}
          color="#22c55e"
          tooltip="Pourcentage moyen de progression dans les modules."
        />
        <KPICard
          title="Note moyenne"
          value={activeData.kpis.note.val}
          variation={activeData.kpis.note.var}
          positive={activeData.kpis.note.positive}
          icon={<StarIcon className="h-6 w-6" />}
          color="#f59e0b"
          tooltip="Moyenne des évaluations laissées par les stagiaires."
        />
        <KPICard
          title="Taux d'abandon"
          value={activeData.kpis.abandon.val}
          variation={activeData.kpis.abandon.var}
          positive={!activeData.kpis.abandon.positive} // Rouge si abandon augmente
          icon={<NoSymbolIcon className="h-6 w-6" />}
          color="#ef4444"
          tooltip="Élèves inactifs depuis plus de 15 jours."
        />
        <KPICard
          title="Modules"
          value={activeData.kpis.modules.val}
          icon={<BookOpenIcon className="h-6 w-6" />}
          color="#6366f1"
          tooltip="Nombre total de modules pédagogiques publiés."
        />
      </div>

      {/* ── 2. Charts Grid ── */}
      <div className="pbi-charts-grid">

        {/* Courbe Inscriptions */}
        <div className="pbi-chart-card">
          <h3>Tendance des inscriptions</h3>
          <div className="pbi-chart-box">
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={activeData.inscriptions}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0a8fa0" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0a8fa0" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#0a8fa0" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Répartition Avancement */}
        <div className="pbi-chart-card">
          <h3>Répartition par niveau</h3>
          <div className="pbi-chart-box">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={activeData.repartition} layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eee" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={100} />
                <Tooltip />
                <Bar dataKey="value" fill="#0a8fa0" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      <div className="pbi-bottom-grid">
        {/* Activité récente */}
        <div className="pbi-card pbi-activity">
          <h3>Activité récente & Alertes</h3>
          <div className="pbi-list">
            <ActivityItem
              name="Mohamed Larbi"
              time="Il y a 2h"
              status="danger"
              label="Progression faible (15%)"
              icon={<ExclamationTriangleIcon className="h-5 w-5 text-red-500" />}
            />
            <ActivityItem
              name="Lina Hamidou"
              time="Il y a 5h"
              status="info"
              label="A déposé son TP"
              icon={<CheckBadgeIcon className="h-5 w-5 text-blue-500" />}
            />
            <ActivityItem
              name="Support Technique"
              time="12 messages"
              status="warning"
              label="Non lus"
              icon={<ChatBubbleLeftRightIcon className="h-5 w-5 text-orange-500" />}
            />
          </div>
        </div>

        {/* Événements */}
        <div className="pbi-card pbi-events">
          <h3>Événements à venir</h3>
          <div className="pbi-event-item">
            <div className="pbi-event-date">
              <span className="day">08</span>
              <span className="month">MAI</span>
            </div>
            <div className="pbi-event-info">
              <h4>Session Live : Q&A FullStack</h4>
              <p>09:00 - 11:00 • <a href="#">Rejoindre Zoom</a></p>
            </div>
          </div>
          <div className="pbi-event-item">
            <div className="pbi-event-date">
              <span className="day">12</span>
              <span className="month">MAI</span>
            </div>
            <div className="pbi-event-info">
              <h4>Date limite : Projet React</h4>
              <p>Rendu final des dossiers</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

/* ── COMPOSANTS INTERNES ── */

const KPICard = ({ title, value, variation, positive, icon, color, tooltip }) => (
  <div className="pbi-kpi-card" title={tooltip}>
    <div className="pbi-kpi-card__header">
      <div className="pbi-kpi-card__icon" style={{ backgroundColor: `${color}15`, color: color }}>
        {icon}
      </div>
      {variation && (
        <span className={`pbi-kpi-card__var ${positive ? 'up' : 'down'}`}>
          {positive ? <ArrowUpIcon className="h-3 w-3" /> : <ArrowDownIcon className="h-3 w-3" />}
          {variation}
        </span>
      )}
    </div>
    <div className="pbi-kpi-card__body">
      <div className="pbi-kpi-card__value">{value}</div>
      <div className="pbi-kpi-card__title">{title}</div>
    </div>
  </div>
);

const ActivityItem = ({ name, time, status, label, icon }) => (
  <div className={`pbi-activity-item pbi-activity-item--${status}`}>
    <div className="pbi-activity-item__icon">{icon}</div>
    <div className="pbi-activity-item__text">
      <div className="pbi-activity-item__name">{name} <small>• {time}</small></div>
      <div className="pbi-activity-item__label">{label}</div>
    </div>
  </div>
);

export default FormationOverviewPowerBI;
