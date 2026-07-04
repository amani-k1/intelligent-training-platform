import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../context/LanguageContext';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import FormationOverviewPowerBI from '../components/FormationOverviewPowerBI';
import { fetchFormationsDetaill, updateFormation } from '../services/Formationservice';
import './FormationManagePage.css';

/* ── MOCK DATA POUR LA FORMATION ── */
/* ── LOGIQUE DE CHARGEMENT DE DONNÉES (SIMULATION) ── */
const getFormationData = (id) => {
  // Dans le futur, ceci sera un appel API : axios.get(`/api/formations/${id}`)
  const formations = {
    "1": { titre: "Développement Web Full-Stack", logo: "💻", color: "#0a8fa0", stagiaires: 18, rate: 68 },
    "2": { titre: "JavaScript Avancé (ES6+)", logo: "⚡", color: "#f97316", stagiaires: 12, rate: 45 },
    "3": { titre: "Node.js & APIs REST", logo: "🔗", color: "#064e3b", stagiaires: 9, rate: 30 }
  };
  return formations[id] || formations["1"];
};

const FormationManagePage = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  
  // On récupère les données selon l'ID de l'URL
  const data = getFormationData(id);

  const menuItems = [
    { id: 'overview',       label: t('common.menu_overview'),       icon: '📊' },
    { id: 'stagiaires',     label: t('common.menu_stagiaires'),     icon: '👥' },
    { id: 'progression',    label: t('common.menu_progression'),    icon: '📈' },
    { id: 'contenu',        label: t('common.menu_contenu'),        icon: '📖' },
    { id: 'planning',       label: t('common.menu_planning'),       icon: '📅' },
    { id: 'evaluations',    label: t('common.menu_evaluations'),    icon: '⭐' },
    { id: 'badges',         label: t('common.menu_badges_certifs'), icon: '🏆' },
    { id: 'communication',  label: t('common.menu_communication'),  icon: '💬' },
    { id: 'stats',          label: t('common.menu_stats'),          icon: '🔬' },
    { id: 'parametres',     label: t('common.menu_parametres'),     icon: '⚙️' },
  ];

  return (
    <DashboardLayout role="formateur">
      <div className="fm-container">
        
        {/* ── Header Dynamique ── */}
        <header className="fm-header">
          <button className="fm-back-btn" onClick={() => navigate('/dashboard/formateur')}>← {t('common.dashboard')}</button>
          <div className="fm-header__main">
            <span className="fm-header__logo" style={{ borderColor: data.color }}>{data.logo}</span>
            <div>
              <h1 className="fm-header__title">{data.titre}</h1>
              <p className="fm-header__sub">{t('common.control_center')} • Session #{id} • {t('common.mode_expert')}</p>
            </div>
          </div>
          <div className="fm-header__actions">
            <div className="fm-live-status">
              <span className="fm-dot"></span> LIVE: 14 {t('common.trainees')} {t('common.live_online')}
            </div>
          </div>
        </header>

        <div className="fm-content-wrapper">
          <aside className="fm-sidemenu">
            {menuItems.map(item => (
              <button
                key={item.id}
                className={`fm-menu-item ${activeTab === item.id ? 'fm-menu-item--active' : ''}`}
                onClick={() => setActiveTab(item.id)}
              >
                <span className="fm-menu-item__icon">{item.icon}</span>
                <span className="fm-menu-item__label">{item.label}</span>
              </button>
            ))}
          </aside>

          <main className="fm-main-content">
            {activeTab === 'overview' && <FormationOverviewPowerBI formationId={id} />}
            {activeTab === 'stagiaires' && <StagiairesTab />}
            {activeTab === 'contenu' && <ContenuTab formationId={id} />}
            {activeTab === 'planning' && <PlanningTab />}
            {activeTab === 'stats' && <StatsTab />}
            {activeTab === 'parametres' && <SettingsTab data={data} />}
            
            {!['overview', 'stagiaires', 'contenu', 'planning', 'stats', 'parametres'].includes(activeTab) && (
              <div className="fm-placeholder">
                <div className="fm-placeholder__icon">✨</div>
                <h3>Module {menuItems.find(m => m.id === activeTab)?.label}</h3>
                <p>{t('common.module_ready')}</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </DashboardLayout>
  );
};

/* ── NOUVEAUX ONGLETS IMPLÉMENTÉS ── */

const PlanningTab = () => {
  const { t } = useTranslation();
  return (
  <div className="fm-tab-planning">
    <div className="fm-card">
      <div className="fm-card__header">
        <h3>Calendrier des Sessions</h3>
        <button className="fm-btn fm-btn--primary">{t('common.add_session')}</button>
      </div>
      <div className="fm-calendar-mock">
        <div className="fm-session-row">
          <div className="fm-session-time">Demain 09:00</div>
          <div className="fm-session-desc">
            <strong>Module 3 : Hooks Avancés</strong>
            <span>Visio-conférence Zoom • 18 inscrits</span>
          </div>
          <button className="fm-btn fm-btn--sm fm-btn--outline">{t('common.edit')}</button>
        </div>
        <div className="fm-session-row">
          <div className="fm-session-time">Jeu. 14:00</div>
          <div className="fm-session-desc">
            <strong>Atelier Pratique : Redux ToolKit</strong>
            <span>Présentiel • Salle 402</span>
          </div>
          <button className="fm-btn fm-btn--sm fm-btn--outline">{t('common.edit')}</button>
        </div>
      </div>
    </div>
  </div>
  );
};

const StatsTab = () => (
  <div className="fm-tab-stats">
    <div className="fm-bento-grid">
      <div className="fm-bento-card">
        <h3>Taux de Réussite Quizz</h3>
        <div className="fm-chart-placeholder">
          {/* Simulation d'un graphique */}
          <div className="fm-chart-bar" style={{height: '60%'}}></div>
          <div className="fm-chart-bar" style={{height: '85%'}}></div>
          <div className="fm-chart-bar" style={{height: '40%'}}></div>
          <div className="fm-chart-bar" style={{height: '95%'}}></div>
        </div>
      </div>
      <div className="fm-bento-card">
        <h3>Temps Moyen / Module</h3>
        <ul className="fm-stats-list">
          <li>Module 1 : 4h 20m</li>
          <li>Module 2 : 6h 45m</li>
          <li>Module 3 : 3h 10m</li>
        </ul>
      </div>
    </div>
  </div>
);

const SettingsTab = ({ data }) => {
  const { t } = useTranslation();
  return (
  <div className="fm-tab-settings">
    <div className="fm-card">
      <h3>Paramètres Généraux</h3>
      <div className="fm-form-group">
        <label>{t('common.formation')}</label>
        <input type="text" defaultValue={data.titre} className="fm-input" />
      </div>
      <div className="fm-form-group">
        <label>{t('common.visibility')}</label>
        <select className="fm-input">
          <option>Publique (Ouverte aux inscriptions)</option>
          <option>Privée (Sur invitation)</option>
          <option>{t('common.archive')}</option>
        </select>
      </div>
      <button className="fm-btn fm-btn--primary">{t('common.save_changes')}</button>
    </div>
  </div>
  );
};

/* ── RE-DÉCLARATION DES ANCIENS ONGLETS POUR LA COHÉRENCE ── */

const StagiairesTab = () => {
  const { t } = useTranslation();
  return (
  <div className="fm-tab-stagiaires">
    <div className="fm-card">
      <div className="fm-card__header">
        <h3>Promotion Actuelle</h3>
        <button className="fm-btn fm-btn--outline">{t('common.export_pdf')}</button>
      </div>
      <table className="fm-table">
        <thead><tr><th>{t('common.trainee')}</th><th>{t('common.progress')}</th><th>{t('common.status')}</th></tr></thead>
        <tbody>
          <tr><td>Ahmed Benali</td><td>68%</td><td><span className="fm-badge fm-badge--active">{t('common.active')}</span></td></tr>
          <tr><td>Sara Kaci</td><td>92%</td><td><span className="fm-badge fm-badge--active">{t('common.active')}</span></td></tr>
        </tbody>
      </table>
    </div>
  </div>
  );
};

const ContenuTab = ({ formationId }) => {
  const { t } = useTranslation();
  const [modules, setModules]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [toast, setToast]         = useState(null);
  const [editIdx, setEditIdx]     = useState(null);
  const [editVal, setEditVal]     = useState('');
  const [newModule, setNewModule] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    fetchFormationsDetaill(formationId)
      .then(data => {
        const prog = data.programme ?? data.program ?? [];
        setModules(Array.isArray(prog) ? prog.map(m => typeof m === 'object' ? m.titre : m) : []);
      })
      .finally(() => setLoading(false));
  }, [formationId]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const save = async (updated) => {
    setSaving(true);
    try {
      await updateFormation(formationId, { programme: updated });
      setModules(updated);
      showToast('Programme sauvegardé !');
    } catch {
      showToast('Erreur lors de la sauvegarde.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const addModule = () => {
    if (!newModule.trim()) return;
    save([...modules, newModule.trim()]);
    setNewModule('');
  };

  const deleteModule = (i) => {
    save(modules.filter((_, idx) => idx !== i));
  };

  const startEdit = (i) => {
    setEditIdx(i);
    setEditVal(modules[i]);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const confirmEdit = () => {
    if (!editVal.trim()) return;
    const updated = [...modules];
    updated[editIdx] = editVal.trim();
    save(updated);
    setEditIdx(null);
  };

  const moveUp = (i) => {
    if (i === 0) return;
    const updated = [...modules];
    [updated[i - 1], updated[i]] = [updated[i], updated[i - 1]];
    save(updated);
  };

  const moveDown = (i) => {
    if (i === modules.length - 1) return;
    const updated = [...modules];
    [updated[i], updated[i + 1]] = [updated[i + 1], updated[i]];
    save(updated);
  };

  if (loading) return <div className="fm-loading">Chargement du programme...</div>;

  return (
    <div className="fm-tab-contenu">
      {toast && (
        <div className={`fm-toast fm-toast--${toast.type}`}>{toast.msg}</div>
      )}
      <div className="fm-card">
        <div className="fm-card__header">
          <div>
            <h3>Programme de la formation</h3>
            <p className="fm-card__sub">{modules.length} module{modules.length !== 1 ? 's' : ''}</p>
          </div>
          {saving && <span className="fm-saving">Sauvegarde...</span>}
        </div>

        {/* Liste des modules */}
        <div className="fm-modules-list">
          {modules.length === 0 && (
            <div className="fm-modules-empty">Aucun module — ajoutez-en ci-dessous.</div>
          )}
          {modules.map((mod, i) => (
            <div key={i} className="fm-module-item">
              <span className="fm-module-num">{i + 1}</span>
              {editIdx === i ? (
                <input
                  ref={inputRef}
                  className="fm-module-edit-input"
                  value={editVal}
                  onChange={e => setEditVal(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') confirmEdit(); if (e.key === 'Escape') setEditIdx(null); }}
                />
              ) : (
                <span className="fm-module-title">{mod}</span>
              )}
              <div className="fm-module-actions">
                {editIdx === i ? (
                  <>
                    <button className="fm-icon-btn fm-icon-btn--green" onClick={confirmEdit} title="Confirmer">✓</button>
                    <button className="fm-icon-btn fm-icon-btn--gray" onClick={() => setEditIdx(null)} title="Annuler">✕</button>
                  </>
                ) : (
                  <>
                    <button className="fm-icon-btn fm-icon-btn--gray" onClick={() => moveUp(i)} disabled={i === 0} title="Monter">↑</button>
                    <button className="fm-icon-btn fm-icon-btn--gray" onClick={() => moveDown(i)} disabled={i === modules.length - 1} title="Descendre">↓</button>
                    <button className="fm-icon-btn fm-icon-btn--blue" onClick={() => startEdit(i)} title="Modifier">✏️</button>
                    <button className="fm-icon-btn fm-icon-btn--red" onClick={() => deleteModule(i)} title="Supprimer">🗑</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Ajout nouveau module */}
        <div className="fm-module-add">
          <input
            className="fm-input"
            placeholder="Ex: Introduction aux concepts fondamentaux..."
            value={newModule}
            onChange={e => setNewModule(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addModule()}
          />
          <button className="fm-btn fm-btn--primary" onClick={addModule} disabled={!newModule.trim()}>
            + Ajouter module
          </button>
        </div>
      </div>
    </div>
  );
};

export default FormationManagePage;
