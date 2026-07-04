import React, { useState, useMemo, useCallback, useRef } from 'react';
import { useTranslation } from '../../../context/LanguageContext';
import DashboardLayout from '../../../components/DashboardLayout';
import './TrainerPlanningPage.css';

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
const getFirstDayOfMonth = (y, m) => { const d = new Date(y, m, 1).getDay(); return d === 0 ? 7 : d; };
const formatMonthYear = (d, locale) => d.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
const toMinutes = (t) => { const [h, min] = t.split(':').map(Number); return h * 60 + min; };
const now = new Date();

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const FORMATIONS = [
  { id: 'f1', title: 'IA pour décideurs',  color: '#1B9B85' },
  { id: 'f2', title: 'Marketing digital',  color: '#e67e22' },
  { id: 'f3', title: 'Développement Web',  color: '#3498db' },
];

const d = (offset) => { const x = new Date(); x.setDate(x.getDate() + offset); return x; };

const INITIAL_EVENTS = [
  { id: 1,  formationId: 'f1', title: 'Session Live – Intro IA',        type: 'live',     date: d(1),  startTime: '10:00', endTime: '12:00', link: 'https://zoom.us/j/123',   attendees: 15, confirmed: 9,  status: 'upcoming' },
  { id: 2,  formationId: 'f2', title: 'Rendu Exercice SEO',              type: 'deadline', date: d(3),  startTime: '23:59', endTime: '23:59', link: '',                        attendees: 20, confirmed: 0,  status: 'upcoming' },
  { id: 3,  formationId: 'f1', title: 'Rappel : Relancer absents',       type: 'rappel',   date: d(0),  startTime: '09:00', endTime: '09:30', link: '',                        attendees: 0,  confirmed: 0,  status: 'upcoming' },
  { id: 4,  formationId: 'f3', title: 'Atelier Pratique React',          type: 'live',     date: d(-2), startTime: '14:00', endTime: '17:00', link: 'https://teams.microsoft.com', attendees: 12, confirmed: 12, status: 'past' },
  { id: 5,  formationId: 'f2', title: 'Session Live – Social Media',     type: 'live',     date: d(5),  startTime: '15:00', endTime: '16:30', link: 'https://zoom.us/j/456',   attendees: 18, confirmed: 7,  status: 'upcoming' },
  { id: 6,  formationId: 'f3', title: 'Quiz Module 2',                   type: 'deadline', date: d(1),  startTime: '10:30', endTime: '11:30', link: '',                        attendees: 14, confirmed: 0,  status: 'upcoming' },  // CONFLICT with id:1 on same day overlapping
  { id: 7,  formationId: 'f1', title: 'Webinaire IA Avancée',            type: 'live',     date: d(8),  startTime: '09:00', endTime: '11:00', link: 'https://zoom.us/j/789',   attendees: 22, confirmed: 14, status: 'upcoming' },
  { id: 8,  formationId: 'f2', title: 'Session annulée – Marketing',     type: 'live',     date: d(-1), startTime: '14:00', endTime: '16:00', link: '',                        attendees: 18, confirmed: 0,  status: 'cancelled' },
];

// ─── CONFLICT DETECTION ───────────────────────────────────────────────────────
const detectConflicts = (events) => {
  const conflictIds = new Set();
  for (let i = 0; i < events.length; i++) {
    for (let j = i + 1; j < events.length; j++) {
      const a = events[i], b = events[j];
      if (a.date.toDateString() !== b.date.toDateString()) continue;
      if (a.type !== 'live' || b.type !== 'live') continue;
      const aStart = toMinutes(a.startTime), aEnd = toMinutes(a.endTime);
      const bStart = toMinutes(b.startTime), bEnd = toMinutes(b.endTime);
      if (aStart < bEnd && bStart < aEnd) {
        conflictIds.add(a.id);
        conflictIds.add(b.id);
      }
    }
  }
  return conflictIds;
};

// ─── TOAST COMPONENT ─────────────────────────────────────────────────────────
const Toast = ({ msg, onClose }) => (
  <div className="pp-toast" onClick={onClose}>
    <span>✅</span> {msg}
  </div>
);

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function TrainerPlanningPage() {
  const { t, lang } = useTranslation();
  const locale = lang === 'en' ? 'en-US' : 'fr-FR';
  const [events, setEvents]             = useState(INITIAL_EVENTS);
  const [currentDate, setCurrentDate]   = useState(new Date());
  const [view, setView]                 = useState('month');
  const [formFilters, setFormFilters]   = useState(FORMATIONS.map(f => f.id));
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter]     = useState('all');
  const [search, setSearch]             = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [toast, setToast]               = useState(null);
  const [draggedId, setDraggedId]       = useState(null);
  const dragOver                        = useRef(null);

  // ── Toast helper ──────────────────────────────────────────────────────────
  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }, []);

  // ── Formation filter ──────────────────────────────────────────────────────
  const toggleForm = (id) =>
    setFormFilters(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);

  // ── Filtered + Conflict detection ─────────────────────────────────────────
  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      if (!formFilters.includes(e.formationId)) return false;
      if (statusFilter !== 'all' && e.status !== statusFilter) return false;
      if (typeFilter   !== 'all' && e.type   !== typeFilter)   return false;
      if (search && !e.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [events, formFilters, statusFilter, typeFilter, search]);

  const conflictIds = useMemo(() => detectConflicts(filteredEvents), [filteredEvents]);

  // ── Navigation ────────────────────────────────────────────────────────────
  const prevPeriod = () => {
    const nd = new Date(currentDate);
    view === 'month' ? nd.setMonth(nd.getMonth() - 1) : nd.setDate(nd.getDate() - 7);
    setCurrentDate(nd);
  };
  const nextPeriod = () => {
    const nd = new Date(currentDate);
    view === 'month' ? nd.setMonth(nd.getMonth() + 1) : nd.setDate(nd.getDate() + 7);
    setCurrentDate(nd);
  };

  // ── Drag & Drop ───────────────────────────────────────────────────────────
  const handleDragStart = (e, evId) => {
    setDraggedId(evId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, dateObj) => {
    e.preventDefault();
    dragOver.current = dateObj;
  };

  const handleDrop = (e, dateObj) => {
    e.preventDefault();
    if (!draggedId || !dateObj) return;
    setEvents(prev => prev.map(ev =>
      ev.id === draggedId
        ? { ...ev, date: new Date(dateObj), status: dateObj < now ? 'past' : 'upcoming' }
        : ev
    ));
    setDraggedId(null);
    dragOver.current = null;
    showToast('Session déplacée – Notification simulée aux stagiaires 📩');
  };

  // ── Actions ───────────────────────────────────────────────────────────────
  const sendReminder = (ev) => {
    showToast(`Rappel envoyé à ${ev.attendees} stagiaires pour "${ev.title}" 🔔`);
  };

  const cancelEvent = (ev) => {
    setEvents(prev => prev.map(e => e.id === ev.id ? { ...e, status: 'cancelled' } : e));
    setSelectedEvent(null);
    showToast(`Session "${ev.title}" annulée.`);
  };

  // ── Conflict banner for a given day's events ──────────────────────────────
  const ConflictBanner = ({ dayEvents }) => {
    const hasConflict = dayEvents.some(e => conflictIds.has(e.id));
    if (!hasConflict) return null;
    return (
      <div className="pp-conflict-banner">⚠️ {t('common.conflict_hour_detected')}</div>
    );
  };

  // ── Month View ────────────────────────────────────────────────────────────
  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const todayDate = new Date();
    const cells = [];

    for (let i = 1; i < firstDay; i++)
      cells.push(<div key={`e${i}`} className="month-cell empty" />);

    for (let d = 1; d <= daysInMonth; d++) {
      const cellDate = new Date(year, month, d);
      const isToday = d === todayDate.getDate() && month === todayDate.getMonth() && year === todayDate.getFullYear();
      const dayEvs = filteredEvents.filter(e =>
        e.date.getDate() === d && e.date.getMonth() === month && e.date.getFullYear() === year
      ).sort((a, b) => a.startTime.localeCompare(b.startTime));

      cells.push(
        <div
          key={`d${d}`}
          className={`month-cell ${isToday ? 'today' : ''}`}
          onDragOver={e => handleDragOver(e, cellDate)}
          onDrop={e => handleDrop(e, cellDate)}
        >
          <div className="month-cell-date">{d}</div>
          <ConflictBanner dayEvents={dayEvs} />
          {dayEvs.map(ev => {
            const f = FORMATIONS.find(f => f.id === ev.formationId);
            const icon = ev.type === 'live' ? '🎥' : ev.type === 'deadline' ? '⏰' : '🔔';
            const isConflict = conflictIds.has(ev.id);
            const isCancelled = ev.status === 'cancelled';
            return (
              <div
                key={ev.id}
                draggable={ev.type === 'live' && !isCancelled}
                className={`event-badge ${ev.type} ${isConflict ? 'conflict' : ''} ${isCancelled ? 'cancelled-ev' : ''}`}
                style={{ backgroundColor: isCancelled ? '#aaa' : f.color, color: '#fff', borderColor: f.color }}
                onClick={() => setSelectedEvent(ev)}
                onDragStart={e => handleDragStart(e, ev.id)}
                title={`${ev.title} (${ev.startTime}–${ev.endTime})`}
              >
                {icon} {ev.title}
              </div>
            );
          })}
        </div>
      );
    }

    const weekDays = lang === 'en'
      ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      : ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    return (
      <div className="month-view">
        <div className="month-header-row">
          {weekDays.map(w => <div key={w} className="month-header-cell">{w}</div>)}
        </div>
        <div className="month-grid">{cells}</div>
      </div>
    );
  };

  // ── Agenda View ───────────────────────────────────────────────────────────
  const renderAgendaView = () => {
    const sorted = [...filteredEvents].sort((a, b) => a.date - b.date || a.startTime.localeCompare(b.startTime));
    const grouped = sorted.reduce((acc, ev) => {
      const key = ev.date.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' });
      if (!acc[key]) acc[key] = [];
      acc[key].push(ev);
      return acc;
    }, {});

    if (!Object.keys(grouped).length)
      return <div style={{ padding: '2rem', textAlign: 'center', color: '#5a7d86' }}>{t('common.no_event')}</div>;

    return (
      <div className="agenda-view">
        {Object.entries(grouped).map(([dateStr, evs]) => {
          const hasConflict = evs.some(e => conflictIds.has(e.id));
          return (
            <div key={dateStr} className="agenda-day">
              <h3 className="agenda-date-header" style={{ textTransform: 'capitalize' }}>
                {dateStr} {hasConflict && <span className="pp-conflict-tag">⚠️ {t('common.conflict_label')}</span>}
              </h3>
              <div className="agenda-events">
                {evs.map(ev => {
                  const f = FORMATIONS.find(f => f.id === ev.formationId);
                  const icon = ev.type === 'live' ? '🎥' : ev.type === 'deadline' ? '⏰' : '🔔';
                  const isCancelled = ev.status === 'cancelled';
                  const isPast      = ev.status === 'past';
                  const confirmedPct = ev.attendees > 0 ? Math.round((ev.confirmed / ev.attendees) * 100) : 0;

                  return (
                    <div
                      key={ev.id}
                      className={`agenda-event-card ${isCancelled ? 'cancelled-ev' : ''}`}
                      style={{ borderLeftColor: isCancelled ? '#aaa' : f.color, opacity: isCancelled ? 0.6 : 1 }}
                      onClick={() => setSelectedEvent(ev)}
                    >
                      <div className="agenda-time">{ev.startTime}</div>
                      <div className="agenda-details">
                        <h4 className="agenda-title">
                          {icon} {ev.title}
                          {isCancelled && <span className="pp-status-tag cancelled">{t('common.cancelled')}</span>}
                          {isPast      && <span className="pp-status-tag past">{t('common.completed')}</span>}
                          {!isCancelled && !isPast && <span className="pp-status-tag upcoming">{t('common.upcoming')}</span>}
                          {conflictIds.has(ev.id) && <span className="pp-status-tag conflict">⚠️ {t('common.conflict_label')}</span>}
                        </h4>
                        <p className="agenda-meta">
                          <span>{f.title}</span>
                          {ev.type === 'live' && (
                            <>
                              <span>👥 {ev.attendees} {t('common.registered_short')}</span>
                              <span title={t('common.confirmed_presences')}>
                                ✅ {ev.confirmed}/{ev.attendees} {t('common.confirmed_short')}
                                <span className="pp-presence-bar">
                                  <span style={{ width: `${confirmedPct}%`, background: f.color }} />
                                </span>
                              </span>
                            </>
                          )}
                        </p>
                      </div>
                      {ev.type === 'live' && !isCancelled && (
                        <button
                          className="pp-remind-btn"
                          onClick={e => { e.stopPropagation(); sendReminder(ev); }}
                          title={t('common.reminder_btn')}
                        >
                          {t('common.send_reminder')}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ── Sidebar stats ─────────────────────────────────────────────────────────
  const nextEvent = [...filteredEvents]
    .filter(e => e.date >= now && e.type === 'live' && e.status === 'upcoming')
    .sort((a, b) => a.date - b.date)[0];

  const totalConflicts = conflictIds.size / 2;

  return (
    <DashboardLayout role="formateur">
      <div className="trainer-planning-page">
        {/* TOAST */}
        {toast && <Toast msg={toast} onClose={() => setToast(null)} />}

        {/* HEADER */}
        <header className="planning-header">
          <h1>📅 {t('common.planning_sessions_header')}</h1>
          <div className="planning-controls">
            <div className="view-toggles">
              <button className={`view-toggle-btn ${view === 'month' ? 'active' : ''}`} onClick={() => setView('month')}>{t('common.month_view')}</button>
              <button className={`view-toggle-btn ${view === 'agenda' ? 'active' : ''}`} onClick={() => setView('agenda')}>{t('common.agenda_label')}</button>
            </div>
            <div className="date-navigation">
              <button className="date-nav-btn" onClick={prevPeriod}>◀</button>
              <button className="date-nav-btn" onClick={() => setCurrentDate(new Date())}>{t('common.today_short')}</button>
              <button className="date-nav-btn" onClick={nextPeriod}>▶</button>
              <div className="current-date-display" style={{ textTransform: 'capitalize' }}>
                {view === 'month' ? formatMonthYear(currentDate, locale) : t('common.agenda_label')}
              </div>
            </div>
            <button className="btn-primary" onClick={() => showToast(t('common.new_session'))}>
              {t('common.new_session')}
            </button>
          </div>
        </header>

        {/* CONFLICT GLOBAL ALERT */}
        {conflictIds.size > 0 && (
          <div className="pp-global-conflict">
            ⚠️ <strong>{totalConflicts} {t('common.conflict_label')}{totalConflicts > 1 ? 's' : ''}</strong> — {t('common.conflict_sessions_overlap')}
          </div>
        )}

        {/* SEARCH + FILTER BAR */}
        <div className="pp-filter-bar">
          <input
            className="pp-search"
            type="text"
            placeholder={`🔍 ${t('common.search_by_title')}`}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div className="pp-filter-group">
            <label>{t('common.status')}</label>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="all">{t('common.all')}</option>
              <option value="upcoming">{t('common.upcoming_filter')}</option>
              <option value="past">{t('common.past_filter')}</option>
              <option value="cancelled">{t('common.cancelled_filter')}</option>
            </select>
          </div>
          <div className="pp-filter-group">
            <label>{t('common.type_label')}</label>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
              <option value="all">{t('common.all')}</option>
              <option value="live">🎥 Live</option>
              <option value="deadline">⏰ Deadline</option>
              <option value="rappel">🔔 {t('common.reminder_btn')}</option>
            </select>
          </div>
          <span className="pp-result-count">{filteredEvents.length} {filteredEvents.length !== 1 ? t('common.event_plural') : t('common.event_singular')}</span>
        </div>

        {/* MAIN LAYOUT */}
        <div className="planning-layout">
          {/* SIDEBAR */}
          <aside className="planning-sidebar">
            {/* Formations */}
            <div className="planning-widget">
              <h3>{t('common.formations')}</h3>
              <div className="filter-list">
                {FORMATIONS.map(f => (
                  <label key={f.id} className="filter-item">
                    <input type="checkbox" className="filter-checkbox" checked={formFilters.includes(f.id)} onChange={() => toggleForm(f.id)} />
                    <span className="formation-color-dot" style={{ backgroundColor: f.color }} />
                    {f.title}
                  </label>
                ))}
              </div>
            </div>

            {/* Next Live */}
            <div className="planning-widget">
              <h3>{t('common.next_live')}</h3>
              {nextEvent ? (
                <div className="upcoming-event">
                  <strong>{nextEvent.title}</strong>
                  <p>{nextEvent.date.toLocaleDateString(locale)} {t('common.at_time')} {nextEvent.startTime}</p>
                  <p>✅ {nextEvent.confirmed}/{nextEvent.attendees} {t('common.confirmed_abbr')}</p>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <a href={nextEvent.link} target="_blank" rel="noreferrer" className="join-btn">{t('common.join_btn')}</a>
                    <button className="join-btn" style={{ cursor: 'pointer', border: 'none' }} onClick={() => sendReminder(nextEvent)}>🔔 {t('common.reminder_btn')}</button>
                  </div>
                </div>
              ) : <p style={{ color: '#5a7d86', fontSize: '0.9rem' }}>{t('common.no_live')}</p>}
            </div>

            {/* Stats */}
            <div className="planning-widget">
              <h3>{t('common.summary_label')}</h3>
              <div className="pp-mini-stats">
                <div className="pp-mini-stat"><span>{events.filter(e => e.status === 'upcoming').length}</span><p>{t('common.upcoming_short')}</p></div>
                <div className="pp-mini-stat"><span>{events.filter(e => e.status === 'past').length}</span><p>{t('common.past_short')}</p></div>
                <div className="pp-mini-stat" style={{ color: '#e74c3c' }}><span>{events.filter(e => e.status === 'cancelled').length}</span><p>{t('common.cancelled_pl')}</p></div>
              </div>
            </div>

            {/* Drag & Drop tip */}
            <div className="planning-widget pp-tip">
              <p>{t('common.dnd_tip')}</p>
            </div>
          </aside>

          {/* CALENDAR */}
          <main className="planning-main">
            {view === 'month' && renderMonthView()}
            {view === 'agenda' && renderAgendaView()}
          </main>
        </div>

        {/* EVENT MODAL */}
        {selectedEvent && (() => {
          const f = FORMATIONS.find(f => f.id === selectedEvent.formationId);
          const isCancelled = selectedEvent.status === 'cancelled';
          const confirmedPct = selectedEvent.attendees > 0 ? Math.round((selectedEvent.confirmed / selectedEvent.attendees) * 100) : 0;
          return (
            <div className="modal-overlay" onClick={e => { if (e.target.className === 'modal-overlay') setSelectedEvent(null); }}>
              <div className="event-modal">
                <div className="modal-header" style={{ background: isCancelled ? '#888' : f.color }}>
                  <h2>
                    {selectedEvent.type === 'live' ? '🎥' : selectedEvent.type === 'deadline' ? '⏰' : '🔔'}
                    {' '}{selectedEvent.title}
                    {isCancelled && <span style={{ fontSize: '0.7rem', background: 'rgba(0,0,0,0.2)', padding: '0.2rem 0.5rem', borderRadius: 8, marginLeft: '0.5rem' }}>{t('common.cancelled')}</span>}
                    {conflictIds.has(selectedEvent.id) && <span style={{ fontSize: '0.7rem', background: '#e74c3c', padding: '0.2rem 0.5rem', borderRadius: 8, marginLeft: '0.5rem' }}>⚠️ {t('common.conflict_label')}</span>}
                  </h2>
                  <button className="modal-close" onClick={() => setSelectedEvent(null)}>✕</button>
                </div>

                <div className="modal-body">
                  <div className="modal-info-row">
                    <span className="modal-icon">📚</span>
                    <div className="modal-text"><p>{t('common.formation_label')}</p><strong>{f.title}</strong></div>
                  </div>
                  <div className="modal-info-row">
                    <span className="modal-icon">📅</span>
                    <div className="modal-text">
                      <p>{t('common.datetime_label')}</p>
                      <strong>{selectedEvent.date.toLocaleDateString(locale)} · {selectedEvent.startTime} → {selectedEvent.endTime}</strong>
                    </div>
                  </div>
                  <div className="modal-info-row">
                    <span className="modal-icon">📊</span>
                    <div className="modal-text"><p>{t('common.status')}</p>
                      <strong style={{ color: isCancelled ? '#e74c3c' : selectedEvent.status === 'past' ? '#888' : '#27ae60' }}>
                        {isCancelled ? t('common.cancelled') : selectedEvent.status === 'past' ? t('common.completed') : t('common.upcoming')}
                      </strong>
                    </div>
                  </div>

                  {selectedEvent.type === 'live' && (
                    <>
                      <div className="modal-info-row">
                        <span className="modal-icon">👥</span>
                        <div className="modal-text">
                          <p>{t('common.confirmed_presences')}</p>
                          <strong>{selectedEvent.confirmed} / {selectedEvent.attendees} {t('common.registered_label')} ({confirmedPct}%)</strong>
                          <div className="pp-presence-bar" style={{ marginTop: '0.4rem', height: 8 }}>
                            <span style={{ width: `${confirmedPct}%`, background: f.color }} />
                          </div>
                        </div>
                      </div>
                      <div className="modal-info-row">
                        <span className="modal-icon">🔗</span>
                        <div className="modal-text">
                          <p>{t('common.meeting_link_label')}</p>
                          <a href={selectedEvent.link} target="_blank" rel="noreferrer" style={{ color: '#0a8fa0', fontWeight: 700 }}>{selectedEvent.link}</a>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="modal-actions">
                  <button className="modal-btn primary">✏️ {t('common.edit')}</button>
                  {selectedEvent.type === 'live' && !isCancelled && (
                    <button className="modal-btn" style={{ background: '#e8f7fa', color: '#0a8fa0' }} onClick={() => { sendReminder(selectedEvent); setSelectedEvent(null); }}>
                      🔔 {t('common.reminder_btn')}
                    </button>
                  )}
                  {!isCancelled && (
                    <button className="modal-btn danger" onClick={() => cancelEvent(selectedEvent)}>🚫 {t('common.cancel')}</button>
                  )}
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </DashboardLayout>
  );
}


