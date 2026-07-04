// src/pages/Trainer/MesFormations/components/AgendaWidget.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '../../../../context/LanguageContext';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  XMarkIcon,
  ClockIcon,
  BellIcon,
  BellSlashIcon,
  CheckCircleIcon,
  AcademicCapIcon,
  TrashIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';

const STORAGE_KEY = 'brn_agenda_events';
const DAYS     = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const MONTHS   = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

const toDateKey = (d) => {
  const date = new Date(d);
  if (isNaN(date)) return null;
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
};

const todayKey = () => toDateKey(new Date());
const genId    = () => `evt_${Date.now()}_${Math.random().toString(36).substr(2,5)}`;

const TYPE_CFG = {
  formation: { dot: 'bg-teal-500',   border: 'border-l-teal-400',   badge: 'bg-teal-50 text-teal-600 border-teal-200 dark:bg-teal-900/20 dark:border-teal-800',   label: 'Formation'  },
  session:   { dot: 'bg-indigo-500', border: 'border-l-indigo-400', badge: 'bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800', label: 'Session'    },
  custom:    { dot: 'bg-amber-500',  border: 'border-l-amber-400',  badge: 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800',   label: 'Personnel'  },
};

const fmtShort = (dateKey) => {
  if (!dateKey) return '';
  const d = new Date(dateKey + 'T00:00:00');
  return `${d.getDate()} ${MONTHS[d.getMonth()].substring(0,3)}`;
};

export const AgendaWidget = ({ formations = [] }) => {
  const { t, lang } = useTranslation();

  const DAYS   = lang === 'en'
    ? ['M', 'T', 'W', 'T', 'F', 'S', 'S']
    : ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  const MONTHS = lang === 'en'
    ? ['January','February','March','April','May','June','July','August','September','October','November','December']
    : ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  const fmtShort = (dateKey) => {
    if (!dateKey) return '';
    const d = new Date(dateKey + 'T00:00:00');
    return `${d.getDate()} ${MONTHS[d.getMonth()].substring(0, 3)}`;
  };

  const [viewDate, setViewDate]         = useState(new Date());
  const [events, setEvents]             = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isOpen, setIsOpen]             = useState(false);
  const [editing, setEditing]           = useState(null);
  const [showHistory, setShowHistory]   = useState(false);
  const [form, setForm]                 = useState({ title: '', time: '09:00', type: 'session', note: '', reminder: false });

  // ── Load from localStorage once ──────────────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setEvents(JSON.parse(raw));
    } catch { setEvents([]); }
  }, []);

  // ── Persist helper ────────────────────────────────────────────────────
  const persist = useCallback((next) => {
    setEvents(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  // ── Auto-sync events from formations prop ─────────────────────────────
  useEffect(() => {
    setEvents(prev => {
      const custom = prev.filter(e => e.source !== 'formation');
      const fromBD = formations
        .filter(f => f.id)
        .map(f => {
          // Priorité : date_debut > dateCreation > created_at > aujourd'hui
          const dateRaw = f.date_debut || f.dateCreation || f.created_at;
          const dateKey = dateRaw ? toDateKey(dateRaw) : todayKey();
          const dateFin = f.date_fin ? toDateKey(f.date_fin) : null;
          return {
            id:          `formation_${f.id}`,
            title:       f.titre || f.title || 'Formation sans titre',
            date:        dateKey,
            dateFin,
            time:        '09:00',
            type:        'formation',
            source:      'formation',
            formationId: f.id,
            statut:      f.statut  || '',
            domaine:     f.domaine || '',
            note:        [
              f.domaine  ? `Domaine : ${f.domaine}`  : null,
              f.statut   ? `Statut : ${f.statut}`    : null,
              dateFin    ? `Fin : ${fmtShort(dateFin)}` : null,
            ].filter(Boolean).join(' · '),
            reminder:    false,
          };
        });
      const next = [...fromBD, ...custom];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, [formations]);

  // ── Calendar math ─────────────────────────────────────────────────────
  const year  = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7; // Mon = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const dk = (day) => day
    ? `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
    : null;

  const eventsOn  = (day) => events.filter(e => e.date === dk(day));
  const isToday   = (day) => dk(day) === todayKey();
  const isPast    = (day) => !!day && dk(day) < todayKey();

  const upcoming  = [...events]
    .filter(e => e.date >= todayKey())
    .sort((a,b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
    .slice(0, 5);

  const history   = [...events]
    .filter(e => e.date < todayKey())
    .sort((a,b) => b.date.localeCompare(a.date))
    .slice(0, 8);

  const tomorrowKey = toDateKey(new Date(Date.now() + 86_400_000));
  const reminders   = events.filter(e => e.reminder && (e.date === todayKey() || e.date === tomorrowKey));

  // ── Modal helpers ─────────────────────────────────────────────────────
  const openNew = (date) => {
    setSelectedDate(date);
    setEditing(null);
    setForm({ title: '', time: '09:00', type: 'session', note: '', reminder: false });
    setIsOpen(true);
  };

  const openEdit = (ev) => {
    setSelectedDate(ev.date);
    setEditing(ev);
    setForm({ title: ev.title, time: ev.time, type: ev.type, note: ev.note || '', reminder: !!ev.reminder });
    setIsOpen(true);
  };

  const handleSave = () => {
    if (!form.title.trim()) return;
    if (editing && editing.source !== 'formation') {
      persist(events.map(e => e.id === editing.id ? { ...e, ...form } : e));
    } else if (!editing) {
      persist([...events, { id: genId(), date: selectedDate, ...form, source: 'custom' }]);
    }
    setIsOpen(false);
  };

  const handleDelete = (id) => {
    persist(events.filter(e => e.id !== id));
    setIsOpen(false);
  };

  const toggleReminder = (id) => {
    persist(events.map(e => e.id === id ? { ...e, reminder: !e.reminder } : e));
    setIsOpen(false);
  };

  // ─────────────────────────────────────────────────────────────────────
  return (
    <div className="px-2 select-none">

      {/* ── Reminder banner ── */}
      {reminders.length > 0 && (
        <div className="mb-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl px-3 py-2.5">
          <p className="text-[8px] font-black text-amber-600 uppercase tracking-widest mb-1.5 flex items-center gap-1">
            <BellIcon className="h-3 w-3" /> {t('common.active_reminders')}
          </p>
          {reminders.map(r => (
            <p key={r.id} className="text-[10px] font-bold text-amber-700 dark:text-amber-300 truncate">
              {r.date === todayKey() ? `• ${t('common.today_label')}` : `• ${t('common.tomorrow_label')}`} — {r.title}
            </p>
          ))}
        </div>
      )}

      {/* ── Month header ── */}
      <div className="flex items-center justify-between mb-2.5">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('common.agenda')}</p>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => setViewDate(new Date(year, month - 1))}
            className="p-1 text-slate-400 hover:text-teal-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
          >
            <ChevronLeftIcon className="h-3 w-3" />
          </button>
          <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 w-[68px] text-center">
            {MONTHS[month].substring(0,4)} {year}
          </span>
          <button
            onClick={() => setViewDate(new Date(year, month + 1))}
            className="p-1 text-slate-400 hover:text-teal-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
          >
            <ChevronRightIcon className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* ── Day-of-week header ── */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map((d, i) => (
          <div key={i} className="text-center text-[8px] font-black text-slate-400 py-0.5">{d}</div>
        ))}
      </div>

      {/* ── Calendar grid ── */}
      <div className="grid grid-cols-7 gap-0.5 mb-3">
        {cells.map((day, i) => {
          const evs       = eventsOn(day);
          const hasRemind = evs.some(e => e.reminder);
          const past      = isPast(day);
          const today     = isToday(day);

          return (
            <button
              key={i}
              onClick={() => day && openNew(dk(day))}
              disabled={!day}
              className={`
                relative flex flex-col items-center justify-center h-7 w-full rounded-lg text-[10px] font-bold transition-all
                ${!day ? 'cursor-default' : 'cursor-pointer'}
                ${today  ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30 hover:bg-teal-500' : ''}
                ${!today && !past && day ? 'text-slate-700 dark:text-slate-300 hover:bg-teal-50 dark:hover:bg-teal-900/20' : ''}
                ${!today && past  && day ? 'text-slate-300 dark:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/50' : ''}
              `}
            >
              <span>{day}</span>
              {evs.length > 0 && (
                <div className="absolute bottom-0.5 flex gap-[2px]">
                  {evs.slice(0, 3).map((e, ei) => (
                    <span
                      key={ei}
                      className={`h-[3px] w-[3px] rounded-full ${TYPE_CFG[e.type]?.dot ?? 'bg-slate-400'} ${today ? 'bg-white/70' : ''}`}
                    />
                  ))}
                </div>
              )}
              {hasRemind && !today && (
                <span className="absolute top-0.5 right-0.5 h-1.5 w-1.5 bg-rose-500 rounded-full ring-1 ring-white dark:ring-slate-900" />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Add event button ── */}
      <button
        onClick={() => openNew(todayKey())}
        className="w-full flex items-center justify-center gap-1.5 py-2 bg-teal-600/10 hover:bg-teal-600/20 border border-dashed border-teal-500/30 rounded-xl text-teal-600 text-[9px] font-black uppercase tracking-widest transition-all mb-4 group"
      >
        <PlusIcon className="h-3 w-3 group-hover:rotate-90 transition-transform" />
        {t('common.add_event')}
      </button>

      {/* ── Upcoming events ── */}
      {upcoming.length > 0 ? (
        <div className="mb-4 space-y-1.5">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">{t('common.upcoming_events')}</p>
          {upcoming.map(ev => (
            <button
              key={ev.id}
              onClick={() => openEdit(ev)}
              className={`
                w-full flex gap-2.5 items-start text-left p-2 rounded-xl border-l-2
                hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group
                ${TYPE_CFG[ev.type]?.border ?? 'border-l-slate-300'}
              `}
            >
              <div className="flex flex-col items-center min-w-[22px]">
                <span className={`text-[8px] font-black uppercase leading-none ${ev.date === todayKey() ? 'text-teal-600' : 'text-slate-400'}`}>
                  {MONTHS[new Date(ev.date + 'T00:00:00').getMonth()].substring(0,3)}
                </span>
                <span className={`text-sm font-black leading-none ${ev.date === todayKey() ? 'text-teal-600' : 'dark:text-white text-slate-800'}`}>
                  {new Date(ev.date + 'T00:00:00').getDate()}
                </span>
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <p className="text-[11px] font-bold text-slate-800 dark:text-white line-clamp-1 group-hover:text-teal-600 transition-colors">
                  {ev.title}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <ClockIcon className="h-2.5 w-2.5 text-slate-400 flex-shrink-0" />
                  <span className="text-[9px] text-slate-400">{ev.time}</span>
                  {ev.reminder && <BellIcon className="h-2.5 w-2.5 text-amber-500" />}
                  <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md border ${TYPE_CFG[ev.type]?.badge ?? ''}`}>
                    {TYPE_CFG[ev.type]?.label}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <p className="text-[10px] italic text-slate-400 text-center py-3 mb-2">{t('common.no_upcoming')}</p>
      )}

      {/* ── History ── */}
      {history.length > 0 && (
        <div>
          <button
            onClick={() => setShowHistory(p => !p)}
            className="w-full flex items-center justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors py-1 mb-1"
          >
            <span>{t('common.history_label')} ({history.length})</span>
            {showHistory ? <ChevronUpIcon className="h-3 w-3" /> : <ChevronDownIcon className="h-3 w-3" />}
          </button>
          {showHistory && (
            <div className="space-y-1">
              {history.map(ev => (
                <button
                  key={ev.id}
                  onClick={() => openEdit(ev)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group opacity-50 hover:opacity-75 text-left"
                >
                  <CheckCircleIcon className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 line-clamp-1 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors">
                      {ev.title}
                    </p>
                    <p className="text-[8px] text-slate-400">{fmtShort(ev.date)}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          EVENT MODAL
      ══════════════════════════════════════════════════════════ */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setIsOpen(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className="relative bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-sm p-6 border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in duration-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="text-[9px] font-black text-teal-600 uppercase tracking-widest mb-0.5">
                  {selectedDate === todayKey() ? t('common.today_label') : fmtShort(selectedDate)}
                </p>
                <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                  {editing
                    ? editing.source === 'formation' ? t('common.formation_details_modal') : t('common.event_edit')
                    : t('common.event_new')}
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Formation pill (auto-generated) */}
            {editing?.source === 'formation' && (
              <div className="mb-4 bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-800 rounded-2xl px-4 py-3 space-y-1.5">
                <div className="flex items-center gap-2.5">
                  <AcademicCapIcon className="h-5 w-5 text-teal-600 flex-shrink-0" />
                  <div>
                    <p className="text-[8px] font-black text-teal-500 uppercase tracking-widest">{t('common.auto_generated')}</p>
                    <p className="text-xs font-bold text-slate-800 dark:text-white mt-0.5">{editing.domaine} — {editing.statut}</p>
                  </div>
                </div>
                {editing.dateFin && (
                  <p className="text-[10px] font-bold text-teal-600 pl-7">
                    {t('common.end_date_label')} : {fmtShort(editing.dateFin)}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-3">
              {/* Title */}
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">{t('common.event_title_label')}</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  disabled={editing?.source === 'formation'}
                  placeholder={t('common.event_title_placeholder')}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>

              {/* Time */}
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">{t('common.event_time_label')}</label>
                <input
                  type="time"
                  value={form.time}
                  onChange={e => setForm(p => ({ ...p, time: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              {/* Type selector (only custom) */}
              {(!editing || editing.source !== 'formation') && (
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">{t('common.event_type_label')}</label>
                  <div className="flex gap-2">
                    {['session', 'custom'].map(typ => (
                      <button
                        key={typ}
                        type="button"
                        onClick={() => setForm(p => ({ ...p, type: typ }))}
                        className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                          form.type === typ
                            ? typ === 'session'
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20'
                              : 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/20'
                            : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                      >
                        {typ === 'session' ? t('common.event_type_live') : t('common.event_type_personal')}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Note */}
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">{t('common.event_notes_label')}</label>
                <textarea
                  value={form.note}
                  onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
                  rows={2}
                  placeholder={t('common.event_notes_placeholder')}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none resize-none transition-all"
                />
              </div>

              {/* Reminder toggle */}
              <button
                type="button"
                onClick={() => editing?.source === 'formation'
                  ? toggleReminder(editing.id)
                  : setForm(p => ({ ...p, reminder: !p.reminder }))
                }
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                  (editing?.source === 'formation' ? editing.reminder : form.reminder)
                    ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700 text-amber-600'
                    : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-2">
                  {(editing?.source === 'formation' ? editing.reminder : form.reminder)
                    ? <BellIcon className="h-4 w-4" />
                    : <BellSlashIcon className="h-4 w-4" />
                  }
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    {(editing?.source === 'formation' ? editing.reminder : form.reminder)
                      ? t('common.reminder_active')
                      : t('common.reminder_enable')}
                  </span>
                </div>
                <div className={`relative h-5 w-9 rounded-full transition-colors ${
                  (editing?.source === 'formation' ? editing.reminder : form.reminder)
                    ? 'bg-amber-500'
                    : 'bg-slate-200 dark:bg-slate-700'
                }`}>
                  <div className={`absolute top-0.5 h-4 w-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                    (editing?.source === 'formation' ? editing.reminder : form.reminder)
                      ? 'translate-x-4'
                      : 'translate-x-0.5'
                  }`} />
                </div>
              </button>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-5">
              {editing && editing.source !== 'formation' && (
                <button
                  type="button"
                  onClick={() => handleDelete(editing.id)}
                  className="p-3 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl border border-rose-100 dark:border-rose-900 transition-all"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              >
                {editing?.source === 'formation' ? t('common.close') : t('common.cancel')}
              </button>
              {(!editing || editing.source !== 'formation') && (
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!form.title.trim()}
                  className="flex-1 py-2.5 bg-teal-600 rounded-xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-teal-500 transition-all shadow-lg shadow-teal-600/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  {editing ? t('common.edit') : t('common.add')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
