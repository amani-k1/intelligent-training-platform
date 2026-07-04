import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../context/LanguageContext';
import {
  BarChart, Bar,
  LineChart, Line,
  PieChart, Pie, Cell,
  XAxis, YAxis,
  CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, LabelList,
} from 'recharts';
import './Chatbot.css';

const CHATBOT_URL = 'http://127.0.0.1:8007';
const ACCENT_COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
const GRADIENT_IDS  = ['g0','g1','g2','g3','g4','g5','g6'];

const SIM_COLOR = (pct) => {
  if (pct >= 60) return '#10b981';
  if (pct >= 40) return '#f59e0b';
  return '#94a3b8';
};

/* ── helpers ──────────────────────────────────── */
const normalizeChartData = (data) => {
  if (!Array.isArray(data) || data.length === 0) return [];
  return data.map(row => {
    const keys = Object.keys(row);
    const nameKey = keys[0];
    const valueKey = keys.find(k => k !== nameKey && typeof row[k] === 'number') || keys[1];
    return { name: String(row[nameKey] ?? ''), value: Number(row[valueKey] ?? 0), ...row };
  });
};

const CustomTooltipStyle = {
  background: 'rgba(8,12,28,0.97)',
  border: '1px solid rgba(79,142,247,0.35)',
  borderRadius: '10px',
  color: '#e2e8f0',
  fontSize: '12px',
};

/* ── Cockpit Component ────────────────────────── */
const Chatbot = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [showTeaser, setShowTeaser] = useState(true);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const messagesEndRef = useRef(null);

  /* analytics */
  const [sql, setSql] = useState('');
  const [chartData, setChartData] = useState([]);
  const [chartType, setChartType] = useState('bar');
  const [insight, setInsight] = useState('');
  const [ragScores, setRagScores] = useState([]);
  const [kpis, setKpis] = useState({ formations: 0, candidats: 0, precision: 94.8, points: 0 });
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [techOpen, setTechOpen] = useState(true);
  const [agentSteps, setAgentSteps] = useState([]);

  /* ── init session ── */
  useEffect(() => {
    let sid = localStorage.getItem('cockpit_session_id');
    if (!sid) {
      sid = 'cockpit_' + Math.random().toString(36).substring(2, 12);
      localStorage.setItem('cockpit_session_id', sid);
    }
    setSessionId(sid);
  }, []);

  /* ── load history + KPIs on open ── */
  useEffect(() => {
    if (!isOpen || !sessionId) return;
    fetch(`${CHATBOT_URL}/chat/history/${sessionId}`)
      .then(r => r.json())
      .then(d => { if (d?.history) setMessages(d.history); })
      .catch(() => { });
    fetch(`${CHATBOT_URL}/formations`)
      .then(r => r.json())
      .then(d => { if (d?.formations) setKpis(p => ({ ...p, formations: d.formations.length })); })
      .catch(() => { });
  }, [isOpen, sessionId]);

  /* ── auto-scroll ── */
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  /* ── agent steps helper ── */
  const pushStep = (label, status = 'done') =>
    setAgentSteps(p => [...p, { label, status, id: Date.now() + Math.random() }]);

  /* ── stream chat ── */
  const streamChat = async (userMessage) => {
    try {
      const res = await fetch(`${CHATBOT_URL}/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, session_id: sessionId }),
      });
      if (!res.ok) throw new Error('network');
      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let done = false;
      while (!done) {
        const { value, done: d } = await reader.read();
        done = d;
        if (!value) continue;
        const lines = decoder.decode(value, { stream: true }).split('\n').filter(l => l.trim());
        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);
            if (parsed.rag_scores) {
              setRagScores(parsed.rag_scores);
              pushStep(`${t('ck.step_search_pre')} ${parsed.rag_scores.length} ${t('ck.step_search_suf')}`);
            } else if (parsed.content) {
              setMessages(prev => {
                const msgs = [...prev];
                const last = msgs[msgs.length - 1];
                msgs[msgs.length - 1] = { ...last, content: last.content + parsed.content };
                return msgs;
              });
            } else if (parsed.error) {
              setMessages(prev => {
                const msgs = [...prev];
                msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content: '⚠️ ' + parsed.error };
                return msgs;
              });
            }
          } catch { /* skip bad JSON */ }
        }
      }
      pushStep(t('ck.step_response_ok'));
    } catch {
      setMessages(prev => {
        const msgs = [...prev];
        msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content: t('ck.error_backend_msg') };
        return msgs;
      });
      pushStep(t('ck.step_error_chat'), 'error');
    }
  };

  /* ── fetch analytics ── */
  const fetchAnalytics = async (question) => {
    setAnalyticsLoading(true);
    pushStep(t('ck.step_sql_gen'), 'active');
    try {
      const res = await fetch(`${CHATBOT_URL}/analytics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      if (data.success) {
        setSql(data.sql || '');
        const normalized = normalizeChartData(data.data);
        setChartData(normalized);
        setChartType(data.chart_type || 'bar');
        setInsight(data.insight || '');
        setKpis(p => ({ ...p, points: normalized.length }));
        const total = normalized.reduce((s, r) => s + (r.value || 0), 0);
        if (total > 0) setKpis(p => ({ ...p, candidats: total }));
        pushStep(`${t('ck.step_sql_pre')} ${normalized.length} ${t('ck.step_sql_suf')}`);
      } else {
        pushStep(t('ck.step_error_analytics_pre') + ' ' + (data.error || t('ck.step_error_unknown')), 'error');
      }
    } catch {
      pushStep(t('ck.step_error_backend'), 'error');
    } finally {
      setAnalyticsLoading(false);
    }
  };

  /* ── send ── */
  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || isStreaming) return;
    const msg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
    setIsStreaming(true);
    setSql(''); setInsight(''); setRagScores([]); setAgentSteps([]);
    pushStep(t('ck.step_analyzing'), 'active');
    await Promise.allSettled([streamChat(msg), fetchAnalytics(msg)]);
    setIsStreaming(false);
  };

  /* ── quick prompt ── */
  const quickAsk = (q) => { setInput(q); };

  /* ── chart renderer ── */
  const renderChart = () => {
    if (analyticsLoading) return (
      <div className="ck-chart-empty">
        <div className="ck-spinner" /><span>{t('ck.chart_loading')}</span>
      </div>
    );
    if (!chartData.length) return (
      <div className="ck-chart-empty">
        <span>{t('ck.chart_empty')}</span>
      </div>
    );

    /* ── Single data point: use RAG scores as bar chart if available ── */
    if (chartData.length === 1 && ragScores.length > 0) {
      const ragBar = ragScores.map(r => ({
        name: r.title.length > 20 ? r.title.substring(0, 18) + '…' : r.title,
        fullName: r.title,
        value: Math.round(r.similarity || 0),
      }));
      return (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={ragBar} margin={{ top: 14, right: 10, left: -15, bottom: 30 }}>
            <defs>
              {ACCENT_COLORS.map((c, i) => (
                <linearGradient key={i} id={`vs${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={c} stopOpacity={0.95} />
                  <stop offset="100%" stopColor={c} stopOpacity={0.4} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="name" stroke="#4a5568" fontSize={9} tickLine={false}
              angle={-25} textAnchor="end" interval={0} tick={{ fill: '#94a3b8' }} />
            <YAxis stroke="#4a5568" fontSize={9} tickLine={false} axisLine={false}
              domain={[0, 100]} tickFormatter={v => `${v}%`} />
            <Tooltip contentStyle={CustomTooltipStyle}
              formatter={(v, _, p) => [`${v}%`, p.payload.fullName]} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={44}>
              {ragBar.map((_, i) => (
                <Cell key={i} fill={`url(#vs${i % ACCENT_COLORS.length})`} />
              ))}
              <LabelList dataKey="value" position="top"
                formatter={v => `${v}%`}
                style={{ fill: '#e2e8f0', fontSize: 11, fontWeight: 700 }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      );
    }

    /* ── Pie chart ── */
    if (chartType === 'pie') return (
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <defs>
            {ACCENT_COLORS.map((c, i) => (
              <linearGradient key={i} id={GRADIENT_IDS[i]} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={c} stopOpacity={0.9} />
                <stop offset="100%" stopColor={c} stopOpacity={0.6} />
              </linearGradient>
            ))}
          </defs>
          <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%"
            outerRadius={72} innerRadius={30}
            paddingAngle={3}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            labelLine={{ stroke: '#4a5568', strokeWidth: 1 }}>
            {chartData.map((_, i) => (
              <Cell key={i} fill={`url(#${GRADIENT_IDS[i % GRADIENT_IDS.length]})`} />
            ))}
          </Pie>
          <Tooltip contentStyle={CustomTooltipStyle} formatter={(v, n) => [v, n]} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', color: '#94a3b8' }} />
        </PieChart>
      </ResponsiveContainer>
    );

    /* ── Line chart ── */
    if (chartType === 'line') return (
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 5 }}>
          <defs>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#6366f1" /><stop offset="100%" stopColor="#0ea5e9" />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis dataKey="name" stroke="#4a5568" fontSize={9} tickLine={false} />
          <YAxis stroke="#4a5568" fontSize={9} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={CustomTooltipStyle} />
          <Line type="monotone" dataKey="value" stroke="url(#lineGrad)" strokeWidth={2.5}
            dot={{ fill: '#6366f1', r: 4, strokeWidth: 2, stroke: '#1e1b4b' }}
            activeDot={{ r: 6, fill: '#0ea5e9' }}>
            <LabelList dataKey="value" position="top" style={{ fill: '#cbd5e1', fontSize: 10 }} />
          </Line>
        </LineChart>
      </ResponsiveContainer>
    );

    /* ── Bar chart: horizontal when peu d'items avec noms longs ── */
    const useHorizontal = chartData.length <= 6;
    if (useHorizontal) return (
      <ResponsiveContainer width="100%" height={Math.max(160, chartData.length * 42)}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 50, left: 8, bottom: 5 }}>
          <defs>
            {ACCENT_COLORS.map((c, i) => (
              <linearGradient key={i} id={`hg${i}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={c} stopOpacity={0.9} />
                <stop offset="100%" stopColor={c} stopOpacity={0.5} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
          <XAxis type="number" stroke="#4a5568" fontSize={9} tickLine={false} axisLine={false} />
          <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false}
            width={110} tick={{ fill: '#cbd5e1' }}
            tickFormatter={v => v.length > 18 ? v.substring(0, 17) + '…' : v} />
          <Tooltip contentStyle={CustomTooltipStyle}
            formatter={(v, n, p) => [v, p.payload.name]} />
          <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={22}>
            {chartData.map((_, i) => (
              <Cell key={i} fill={`url(#hg${i % ACCENT_COLORS.length})`} />
            ))}
            <LabelList dataKey="value" position="right"
              style={{ fill: '#e2e8f0', fontSize: 11, fontWeight: 700 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );

    /* ── Bar chart vertical (beaucoup d'items) ── */
    return (
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData} margin={{ top: 10, right: 5, left: -15, bottom: 5 }}>
          <defs>
            {ACCENT_COLORS.map((c, i) => (
              <linearGradient key={i} id={`vg${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={c} stopOpacity={0.9} />
                <stop offset="100%" stopColor={c} stopOpacity={0.4} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis dataKey="name" stroke="#4a5568" fontSize={9} tickLine={false}
            tickFormatter={v => v.length > 10 ? v.substring(0, 9) + '…' : v} />
          <YAxis stroke="#4a5568" fontSize={9} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={CustomTooltipStyle} />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={36}>
            {chartData.map((_, i) => (
              <Cell key={i} fill={`url(#vg${i % ACCENT_COLORS.length})`} />
            ))}
            <LabelList dataKey="value" position="top"
              style={{ fill: '#cbd5e1', fontSize: 10, fontWeight: 600 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  };

  /* ── RAG formations cards ── */
  const renderRagCards = () => {
    if (!ragScores.length) return null;
    return (
      <div className="ck-rag-cards">
        <div className="ck-section-hd" style={{ marginBottom: '0.5rem' }}>
          <span>Formations pertinentes</span>
          <span className="ck-type-badge">{ragScores.length} RAG</span>
        </div>
        {ragScores.map((item, i) => (
          <div key={i} className="ck-rag-card">
            <div className="ck-rag-card__rank" style={{ background: ACCENT_COLORS[i % ACCENT_COLORS.length] }}>
              #{i + 1}
            </div>
            <div className="ck-rag-card__info">
              <div className="ck-rag-card__title">{item.title}</div>
              <div className="ck-rag-card__track">
                <div className="ck-rag-card__fill"
                  style={{ width: `${Math.min(100, item.similarity || 0)}%`, background: SIM_COLOR(item.similarity) }} />
              </div>
            </div>
            <div className="ck-rag-card__pct" style={{ color: SIM_COLOR(item.similarity) }}>
              {item.similarity?.toFixed(0)}%
            </div>
          </div>
        ))}
      </div>
    );
  };

  /* ── render ── */
  return (
    <div className="ck-root">
      {/* Teaser bubbles */}
      {!isOpen && showTeaser && (
        <div className="ck-teaser-container">
          <div className="ck-teaser-bubble ck-teaser-1">💬 Posez-moi une question !</div>
          <div className="ck-teaser-bubble ck-teaser-2">🎓 Je recommande des formations</div>
          <div className="ck-teaser-bubble ck-teaser-3">✨ Besoin d'aide ?</div>
        </div>
      )}

      {/* Floating toggle */}
      <div className="ck-toggle-wrapper">
        {!isOpen && <span className="ck-pulse-ring" />}
        <button
          className={`ck-toggle ${isOpen ? 'open' : ''}`}
          onClick={() => { setIsOpen(v => !v); setShowTeaser(false); }}
          aria-label="Ouvrir le Cockpit IA"
          id="ck-toggle-btn"
        >
          {isOpen ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span className="ck-toggle-label">AI Cockpit</span>
            </>
          )}
        </button>
      </div>

      {/* Cockpit overlay */}
      {isOpen && (
        <div className="ck-overlay">
          <div className="ck-cockpit">

            {/* ── HEADER ── */}
            <header className="ck-header">
              <div className="ck-header-left">
                <div className="ck-logo-pulse" />
                <div>
                  <h1 className="ck-title">BRN AI Cockpit</h1>
                  <p className="ck-subtitle">{t('ck.subtitle')}</p>
                </div>
              </div>
              <div className="ck-header-right">
                <span className={`ck-status-badge ${isStreaming ? 'streaming' : 'idle'}`}>
                  <span className="ck-status-dot" />
                  {isStreaming ? t('ck.streaming') : t('ck.ready')}
                </span>
                <button className="ck-close-btn" onClick={() => setIsOpen(false)} id="ck-close-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </header>

            {/* ── BODY : chat | dashboard ── */}
            <div className="ck-body">

              {/* LEFT — Chat */}
              <section className="ck-chat-panel">
                <div className="ck-chat-messages" id="ck-chat-messages">
                  {messages.length === 0 && (
                    <div className="ck-welcome">

                      <h3>{t('ck.welcome_title')}</h3>
                      <p>{t('ck.welcome_sub')}</p>
                      <div className="ck-chips">
                        {[
                          t('ck.quick_prompt_1'),
                          t('ck.quick_prompt_2'),
                          t('ck.quick_prompt_3'),
                          t('ck.quick_prompt_4'),
                        ].map(q => (
                          <button key={q} className="ck-chip" onClick={() => quickAsk(q)}>{q}</button>
                        ))}
                      </div>
                    </div>
                  )}

                  {messages.map((msg, idx) => (
                    <div key={idx} className={`ck-msg-row ${msg.role}`}>
                      {msg.role === 'assistant' && <div className="ck-avatar">AI</div>}
                      <div className={`ck-bubble ${msg.role}`}>
                        {msg.content
                          ? msg.content
                          : isStreaming && idx === messages.length - 1
                            ? <span className="ck-typing"><span /><span /><span /></span>
                            : null
                        }
                        {msg.role === 'assistant' && isStreaming && idx === messages.length - 1 && msg.content && (
                          <span className="ck-cursor" />
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                <form className="ck-input-row" onSubmit={handleSend}>
                  <input
                    id="ck-user-input"
                    type="text"
                    className="ck-input"
                    placeholder={t('ck.input_placeholder')}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    disabled={isStreaming}
                    autoComplete="off"
                  />
                  <button type="submit" className="ck-send-btn" disabled={!input.trim() || isStreaming} id="ck-send-btn">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  </button>
                </form>
              </section>

              {/* RIGHT — Dashboard */}
              <section className="ck-dashboard-panel">

                {/* KPIs */}
                <div className="ck-kpis">
                  {[
                    { value: kpis.formations, label: t('ck.kpi_formations') },
                    { value: kpis.candidats, label: t('ck.kpi_results') },
                    { value: `${kpis.precision}%`, label: t('ck.kpi_ai_accuracy') },
                    { value: kpis.points, label: t('ck.kpi_data_points') },
                  ].map((k, i) => (
                    <div key={i} className="ck-kpi-card">
                      <span className="ck-kpi-icon">{k.icon}</span>
                      <span className="ck-kpi-value">{k.value}</span>
                      <span className="ck-kpi-label">{k.label}</span>
                    </div>
                  ))}
                </div>

                {/* Chart */}
                <div className="ck-chart-box">
                  <div className="ck-section-hd">
                    <span>{t('ck.chart_title')}</span>
                    {chartData.length > 0 && (
                      <span className="ck-type-badge">{chartType.toUpperCase()}</span>
                    )}
                  </div>
                  {renderChart()}
                </div>

                {/* RAG Formations Cards */}
                {renderRagCards()}

                {/* Insight */}
                {insight && (
                  <div className="ck-insight-card">
                    <div className="ck-insight-hd">{t('ck.insight_title')}</div>
                    <p className="ck-insight-text">{insight}</p>
                  </div>
                )}
              </section>
            </div>

            {/* ── TECHNICAL PANEL ── */}
            <div className="ck-tech-wrap">
              <button className="ck-tech-toggle-btn" onClick={() => setTechOpen(v => !v)} id="ck-tech-toggle">
                <span>{t('ck.tech_panel')}</span>
                <span className={`ck-arrow ${techOpen ? 'up' : ''}`}>▼</span>
              </button>

              {techOpen && (
                <div className="ck-tech-body">

                  {/* SQL */}
                  <div className="ck-tech-col">
                    <div className="ck-tech-col-title">{t('ck.sql_title')}</div>
                    {sql
                      ? <pre className="ck-sql">{sql}</pre>
                      : <span className="ck-tech-empty">{t('ck.sql_waiting')}</span>
                    }
                  </div>

                  {/* RAG Scores */}
                  <div className="ck-tech-col">
                    <div className="ck-tech-col-title">{t('ck.rag_title')}</div>
                    {ragScores.length > 0
                      ? ragScores.map((item, idx) => (
                        <div key={idx} className="ck-rag-item">
                          <div className="ck-rag-row">
                            <span className="ck-rag-title">{item.title}</span>
                            <span className="ck-rag-pct">{item.similarity?.toFixed(1)}%</span>
                          </div>
                          <div className="ck-rag-track">
                            <div className="ck-rag-fill" style={{ width: `${Math.min(100, item.similarity || 0)}%` }} />
                          </div>
                          <p className="ck-rag-doc">{item.document?.substring(0, 80)}…</p>
                        </div>
                      ))
                      : <span className="ck-tech-empty">{t('ck.rag_waiting')}</span>
                    }
                  </div>

                  {/* Agent Steps */}
                  <div className="ck-tech-col">
                    <div className="ck-tech-col-title">{t('ck.agent_title')}</div>
                    {agentSteps.length > 0
                      ? agentSteps.map((s, i) => (
                        <div key={s.id} className={`ck-step ${s.status}`}>
                          <span className="ck-step-num">{i + 1}</span>
                          <span className="ck-step-label">{s.label}</span>
                          <span className="ck-step-icon">
                            {s.status === 'active' ? '⏳' : s.status === 'error' ? '❌' : '✅'}
                          </span>
                        </div>
                      ))
                      : <span className="ck-tech-empty">{t('ck.agent_waiting')}</span>
                    }
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;
