import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AlertTriangle, Search, RefreshCcw, Trash2, Archive, ArchiveRestore,
         Download, Filter, CheckSquare, Square, X, TrendingUp, Clock, Activity } from 'lucide-react';
import api from '../api/axios';
import './AdminAIPage.css';

const SIMILARITY_COLOR = (score) => {
  if (score >= 0.6) return '#22c55e';
  if (score >= 0.4) return '#f59e0b';
  return '#ef4444';
};

export default function AdminIAPage() {
  const [alertes, setAlertes]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [lastUpdate, setLastUpdate]     = useState(new Date());
  const [selected, setSelected]         = useState(new Set());
  const [view, setView]                 = useState('active'); // 'active' | 'archived'
  const [searchTerm, setSearchTerm]     = useState('');
  const [filterSim, setFilterSim]       = useState('all'); // 'all' | 'high' | 'medium' | 'low'
  const [filterDate, setFilterDate]     = useState('all'); // 'all' | 'today' | 'week' | 'month' | 'custom'
  const [dateFrom, setDateFrom]         = useState('');
  const [dateTo, setDateTo]             = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null); // id | 'bulk' | null
  const [actionMsg, setActionMsg]       = useState(null);

  const showMsg = (text, type = 'success') => {
    setActionMsg({ text, type });
    setTimeout(() => setActionMsg(null), 3000);
  };

  // ── Fetch ──────────────────────────────────────────────────────────
  const fetchAlertes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/app/ia/alertes');
      setAlertes(Array.isArray(res.data) ? res.data : res.data?.data || []);
      setLastUpdate(new Date());
      setSelected(new Set());
    } catch {
      setAlertes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlertes();
    const iv = setInterval(fetchAlertes, 30000);
    return () => clearInterval(iv);
  }, [fetchAlertes]);

  // ── Statistiques ───────────────────────────────────────────────────
  const stats = useMemo(() => {
    const active   = alertes.filter(a => !a.archived);
    const archived = alertes.filter(a => a.archived);
    const today    = new Date().toDateString();
    const todayCount = active.filter(a => new Date(a.created_at).toDateString() === today).length;
    const avgSim   = active.length
      ? (active.reduce((s, a) => s + a.similarite, 0) / active.length * 100).toFixed(1)
      : 0;
    const topQuery = active.length
      ? Object.entries(active.reduce((acc, a) => {
          acc[a.recherche] = (acc[a.recherche] || 0) + 1; return acc;
        }, {})).sort((a, b) => b[1] - a[1])[0]?.[0]
      : '—';
    return { total: active.length, archived: archived.length, todayCount, avgSim, topQuery };
  }, [alertes]);

  // ── Filtrage ───────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const isArchived = view === 'archived';
    return alertes.filter(a => {
      if (!!a.archived !== isArchived) return false;

      if (searchTerm && !a.recherche.toLowerCase().includes(searchTerm.toLowerCase())
          && !(a.formation_proche || '').toLowerCase().includes(searchTerm.toLowerCase())) return false;

      if (filterSim === 'high'   && a.similarite < 0.6)  return false;
      if (filterSim === 'medium' && (a.similarite < 0.3 || a.similarite >= 0.6)) return false;
      if (filterSim === 'low'    && a.similarite >= 0.3) return false;

      const d = new Date(a.created_at);
      const now = new Date();
      if (filterDate === 'today' && d.toDateString() !== now.toDateString()) return false;
      if (filterDate === 'week') {
        const week = new Date(now); week.setDate(now.getDate() - 7);
        if (d < week) return false;
      }
      if (filterDate === 'month') {
        const month = new Date(now); month.setDate(now.getDate() - 30);
        if (d < month) return false;
      }
      if (filterDate === 'custom') {
        if (dateFrom && d < new Date(dateFrom)) return false;
        if (dateTo   && d > new Date(dateTo + 'T23:59:59')) return false;
      }
      return true;
    });
  }, [alertes, view, searchTerm, filterSim, filterDate, dateFrom, dateTo]);

  // ── Sélection ─────────────────────────────────────────────────────
  const toggleSelect = (id) => setSelected(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(a => a.id)));
  };

  // ── Actions ───────────────────────────────────────────────────────
  const deleteOne = async (id) => {
    try {
      await api.delete(`/app/ia/alertes/${id}`);
    } catch (e) {
      if (e?.response?.status !== 404) { showMsg('Erreur suppression', 'error'); return; }
    }
    setAlertes(prev => prev.filter(a => a.id !== id));
    setConfirmDelete(null);
    showMsg('Alerte supprimée');
  };

  const deleteBulk = async () => {
    try {
      await api.post('/app/ia/alertes/bulk-delete', { ids: [...selected] });
    } catch (e) {
      if (e?.response?.status !== 404) { showMsg('Erreur suppression', 'error'); return; }
    }
    setAlertes(prev => prev.filter(a => !selected.has(a.id)));
    setSelected(new Set());
    setConfirmDelete(null);
    showMsg(`${selected.size} alertes supprimées`);
  };

  const archiveOne = async (id) => {
    try {
      const res = await api.patch(`/app/ia/alertes/${id}/archive`);
      setAlertes(prev => prev.map(a => a.id === id ? res.data : a));
      showMsg(res.data.archived ? 'Alerte archivée' : 'Alerte restaurée');
    } catch (e) {
      if (e?.response?.status === 404) {
        setAlertes(prev => prev.filter(a => a.id !== id));
        showMsg('Alerte introuvable, supprimée de la liste');
      } else {
        showMsg('Erreur archivage', 'error');
      }
    }
  };

  const archiveBulk = async () => {
    try {
      await api.post('/app/ia/alertes/bulk-archive', { ids: [...selected] });
    } catch (e) {
      if (e?.response?.status !== 404) { showMsg('Erreur archivage', 'error'); return; }
    }
    setAlertes(prev => prev.map(a => selected.has(a.id) ? { ...a, archived: true } : a));
    setSelected(new Set());
    showMsg(`${selected.size} alertes archivées`);
  };

  const exportCSV = () => {
    const rows = [['ID', 'Date', 'Requête', 'Formation proche', 'Similarité']];
    filtered.forEach(a => rows.push([
      a.id,
      new Date(a.created_at).toLocaleString('fr-FR'),
      a.recherche,
      a.formation_proche ?? '',
      (a.similarite * 100).toFixed(1) + '%',
    ]));
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `alertes_${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="aia-page">

      {/* ── Toast ── */}
      {actionMsg && (
        <div className={`aia-toast aia-toast--${actionMsg.type}`}>
          {actionMsg.text}
        </div>
      )}

      {/* ── Confirm dialog ── */}
      {confirmDelete && (
        <div className="aia-overlay">
          <div className="aia-confirm">
            <Trash2 size={32} color="#ef4444" />
            <h3>Confirmer la suppression</h3>
            <p>{confirmDelete === 'bulk'
              ? `Supprimer ${selected.size} alerte(s) sélectionnée(s) ?`
              : 'Supprimer cette alerte définitivement ?'}
            </p>
            <div className="aia-confirm__actions">
              <button className="aia-btn aia-btn--ghost" onClick={() => setConfirmDelete(null)}>Annuler</button>
              <button className="aia-btn aia-btn--danger"
                onClick={() => confirmDelete === 'bulk' ? deleteBulk() : deleteOne(confirmDelete)}>
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <header className="aia-header">
        <div>
          <div className="aia-badge">INTELLIGENCE ARTIFICIELLE</div>
          <h1>Gestion des Alertes</h1>
          <p>Recherches sans résultat enregistrées par le système IA</p>
        </div>
        <div className="aia-header__actions">
          <span className="aia-timestamp">Mise à jour : {lastUpdate.toLocaleTimeString()}</span>
          <button className="aia-btn aia-btn--outline" onClick={exportCSV}>
            <Download size={16} /> Exporter CSV
          </button>
          <button className="aia-btn aia-btn--primary" onClick={fetchAlertes} disabled={loading}>
            <RefreshCcw size={16} className={loading ? 'spin' : ''} /> Actualiser
          </button>
        </div>
      </header>

      {/* ── Stats ── */}
      <div className="aia-stats">
        <div className="aia-stat-card aia-stat-card--orange">
          <AlertTriangle size={22} />
          <div>
            <span className="aia-stat-value">{stats.total}</span>
            <span className="aia-stat-label">Alertes actives</span>
          </div>
        </div>
        <div className="aia-stat-card aia-stat-card--blue">
          <Clock size={22} />
          <div>
            <span className="aia-stat-value">{stats.todayCount}</span>
            <span className="aia-stat-label">Aujourd'hui</span>
          </div>
        </div>
        <div className="aia-stat-card aia-stat-card--teal">
          <Activity size={22} />
          <div>
            <span className="aia-stat-value">{stats.avgSim}%</span>
            <span className="aia-stat-label">Similarité moyenne</span>
          </div>
        </div>
        <div className="aia-stat-card aia-stat-card--purple">
          <TrendingUp size={22} />
          <div>
            <span className="aia-stat-value aia-stat-value--sm">{stats.topQuery}</span>
            <span className="aia-stat-label">Recherche la + fréquente</span>
          </div>
        </div>
        <div className="aia-stat-card aia-stat-card--gray">
          <Archive size={22} />
          <div>
            <span className="aia-stat-value">{stats.archived}</span>
            <span className="aia-stat-label">Archivées</span>
          </div>
        </div>
      </div>

      {/* ── Onglets active / archived ── */}
      <div className="aia-tabs">
        <button className={`aia-tab ${view === 'active' ? 'aia-tab--active' : ''}`} onClick={() => { setView('active'); setSelected(new Set()); }}>
          Alertes actives <span className="aia-tab-count">{stats.total}</span>
        </button>
        <button className={`aia-tab ${view === 'archived' ? 'aia-tab--active' : ''}`} onClick={() => { setView('archived'); setSelected(new Set()); }}>
          Archivées <span className="aia-tab-count">{stats.archived}</span>
        </button>
      </div>

      {/* ── Filtres ── */}
      <div className="aia-filters">
        <div className="aia-search-box">
          <Search size={16} />
          <input placeholder="Rechercher une requête ou formation..."
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          {searchTerm && <button onClick={() => setSearchTerm('')}><X size={14} /></button>}
        </div>

        <div className="aia-filter-group">
          <Filter size={15} />
          <select value={filterDate} onChange={e => setFilterDate(e.target.value)}>
            <option value="all">Toutes les dates</option>
            <option value="today">Aujourd'hui</option>
            <option value="week">7 derniers jours</option>
            <option value="month">30 derniers jours</option>
            <option value="custom">Période personnalisée</option>
          </select>
        </div>

        {filterDate === 'custom' && (
          <div className="aia-date-range">
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            <span>→</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
        )}

        <select value={filterSim} onChange={e => setFilterSim(e.target.value)} className="aia-select-sim">
          <option value="all">Toutes similarités</option>
          <option value="high">Haute (≥ 60%)</option>
          <option value="medium">Moyenne (30–60%)</option>
          <option value="low">Faible ({"<"} 30%)</option>
        </select>

        <span className="aia-result-count">{filtered.length} résultat{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* ── Barre d'actions bulk ── */}
      {selected.size > 0 && (
        <div className="aia-bulk-bar">
          <span><strong>{selected.size}</strong> sélectionné{selected.size > 1 ? 's' : ''}</span>
          <div className="aia-bulk-actions">
            {view === 'active' && (
              <button className="aia-btn aia-btn--sm aia-btn--teal" onClick={archiveBulk}>
                <Archive size={14} /> Archiver la sélection
              </button>
            )}
            <button className="aia-btn aia-btn--sm aia-btn--danger" onClick={() => setConfirmDelete('bulk')}>
              <Trash2 size={14} /> Supprimer la sélection
            </button>
            <button className="aia-btn aia-btn--sm aia-btn--ghost" onClick={() => setSelected(new Set())}>
              <X size={14} /> Désélectionner
            </button>
          </div>
        </div>
      )}

      {/* ── Table ── */}
      <div className="aia-table-card">
        {loading ? (
          <div className="aia-empty">
            <RefreshCcw size={24} className="spin" />
            <p>Chargement des alertes...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="aia-empty">
            <AlertTriangle size={36} color="#cbd5e1" />
            <p>{view === 'archived' ? 'Aucune alerte archivée' : 'Aucune alerte enregistrée'}</p>
          </div>
        ) : (
          <div className="aia-table-wrap">
            <table className="aia-table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>
                    <button className="aia-checkbox" onClick={toggleAll}>
                      {selected.size === filtered.length && filtered.length > 0
                        ? <CheckSquare size={16} color="#0a8fa0" />
                        : <Square size={16} color="#94a3b8" />}
                    </button>
                  </th>
                  <th>Date & Heure</th>
                  <th>Requête tapée</th>
                  <th>Formation la plus proche</th>
                  <th>Similarité</th>
                  <th>Autres suggestions</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={a.id} className={selected.has(a.id) ? 'aia-row--selected' : ''}>
                    <td>
                      <button className="aia-checkbox" onClick={() => toggleSelect(a.id)}>
                        {selected.has(a.id)
                          ? <CheckSquare size={16} color="#0a8fa0" />
                          : <Square size={16} color="#94a3b8" />}
                      </button>
                    </td>
                    <td>
                      <div className="aia-date-cell">
                        <span className="aia-date">{new Date(a.created_at).toLocaleDateString('fr-FR')}</span>
                        <span className="aia-time">{new Date(a.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </td>
                    <td>
                      <div className="aia-query-cell">
                        <Search size={13} className="aia-icon-muted" />
                        <span className="aia-query-text">"{a.recherche}"</span>
                      </div>
                    </td>
                    <td>
                      <span className="aia-formation-name">{a.formation_proche ?? <span className="aia-muted">—</span>}</span>
                    </td>
                    <td>
                      <div className="aia-sim-cell">
                        <span className="aia-sim-pct" style={{ color: SIMILARITY_COLOR(a.similarite) }}>
                          {(a.similarite * 100).toFixed(1)}%
                        </span>
                        <div className="aia-sim-track">
                          <div className="aia-sim-fill" style={{
                            width: `${a.similarite * 100}%`,
                            background: SIMILARITY_COLOR(a.similarite)
                          }} />
                        </div>
                      </div>
                    </td>
                    <td>
                      {Array.isArray(a.formations_proches) && a.formations_proches.length > 1 ? (
                        <div className="aia-chips">
                          {a.formations_proches.slice(1, 4).map((s, j) => (
                            <span key={j} className="aia-chip">
                              {s.titre}
                              <span className="aia-chip-score">{(s.similarite * 100).toFixed(0)}%</span>
                            </span>
                          ))}
                        </div>
                      ) : <span className="aia-muted">—</span>}
                    </td>
                    <td>
                      <div className="aia-row-actions">
                        {a.archived ? (
                          <button className="aia-icon-btn aia-icon-btn--teal" title="Restaurer" onClick={() => archiveOne(a.id)}>
                            <ArchiveRestore size={15} />
                          </button>
                        ) : (
                          <button className="aia-icon-btn aia-icon-btn--gray" title="Archiver" onClick={() => archiveOne(a.id)}>
                            <Archive size={15} />
                          </button>
                        )}
                        <button className="aia-icon-btn aia-icon-btn--red" title="Supprimer" onClick={() => setConfirmDelete(a.id)}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
