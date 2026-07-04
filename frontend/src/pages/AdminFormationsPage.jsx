import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useTranslation } from '../context/LanguageContext';
import DashboardLayout from '../components/DashboardLayout';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';
import './AdminFormationsPage.css';
import { fetchTouteFormations, createFormation, updateFormation, deleteFormation } from '../services/Formationservice';
import api from '../api/axios';

/** Convertit un objet backend → format interne de la vue */
const mapFormation = (f) => ({
  id:         f.id,
  title:      f.title         ?? '—',
  cat:        f.domaine       ?? '—',
  instructor: f.nom_formateur ?? '—',
  dates:      f.duree         ?? '—',
  status:     f.statut        ?? 'active',
  students:   f.places_totales ?? 0,
  revenue:    f.prix ? Number(f.prix) * (f.places_totales ?? 0) : 0,
  completion: 0,
  retention:  0,
  price:      f.prix          ?? '',
  duration:   f.duree         ?? '',
  level:      f.niveau        ?? 'Débutant',
  desc:       f.description   ?? '',
  program:    Array.isArray(f.program) ? f.program : [],
});



const INSCRIPTION_TREND = [
  { name: 'S1', value: 12 },
  { name: 'S2', value: 18 },
  { name: 'S3', value: 25 },
  { name: 'S4', value: 21 },
  { name: 'S5', value: 32 },
  { name: 'S6', value: 45 },
];

const PROGRESSION_CHAPTERS = [
  { name: 'Chap 1', value: 95 },
  { name: 'Chap 2', value: 88 },
  { name: 'Chap 3', value: 72 },
  { name: 'Chap 4', value: 65 },
  { name: 'Chap 5', value: 40 },
];

const PIE_DATA = [
  { name: 'Terminé', value: 65 },
  { name: 'En cours', value: 25 },
  { name: 'Abandon', value: 10 },
];
const COLORS = ['#10b981', '#3b82f6', '#ef4444'];

const AdminFormationsPage = () => {
  const { t } = useTranslation();

  const [formations, setFormations]           = useState([]);
  const [formateurs, setFormateurs]           = useState([]);
  const [loading, setLoading]                 = useState(false);
  const [error, setError]                     = useState(null);
  const [view, setView]                       = useState('list');
  const [selectedFormation, setSelectedFormation] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editFormation, setEditFormation]     = useState(null);
  const [filterCat, setFilterCat]             = useState('tous');
  const [filterStatus, setFilterStatus]       = useState('tous');

  /* ── Chargement depuis le backend ── */
  const loadFormations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTouteFormations();
      const list = Array.isArray(data) ? data : (data.data ?? []);
      setFormations(list.map(mapFormation));
    } catch (err) {
      console.error('Erreur chargement formations:', err);
      setError('Impossible de charger les formations. Vérifiez que le backend est bien démarré.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadFormations(); }, [loadFormations]);

  // Charger la liste des formateurs depuis service-1
  useEffect(() => {
    api.get('/auth/formateurs')
      .then(res => {
        const list = Array.isArray(res.data) ? res.data : (res.data.data ?? []);
        setFormateurs(list);
      })
      .catch(() => setFormateurs([]));
  }, []);

  /* ── Filtrage ── */
  const filteredFormations = useMemo(() => {
    return formations.filter(f => {
      const matchCat    = filterCat    === 'tous' || f.cat    === filterCat;
      const matchStatus = filterStatus === 'tous' || f.status === filterStatus;
      return matchCat && matchStatus;
    });
  }, [formations, filterCat, filterStatus]);

  /* ── Handlers ── */
  const handleViewStats   = (f) => { setSelectedFormation(f); setView('stats'); };
  const handleBackToList  = ()  => { setSelectedFormation(null); setView('list'); };

  const handleEditOpen = (f) => setEditFormation(f);

  const handleEditSave = async (formData) => {
    try {
      const payload = {
        title:          formData.title.trim(),
        description:    formData.desc.trim(),
        nom_formateur:  formData.instructor.trim(),
        ...(formData.instructorId && { id_formateur: formData.instructorId }),
        duree:          parseInt(formData.duration) || editFormation.dates,
        domaine:        formData.cat,
        niveau:         formData.level,
        prix:           formData.price ? parseFloat(formData.price) : null,
        places_totales: formData.places_totales ? parseInt(formData.places_totales) : null,
      };
      const updated = await updateFormation(editFormation.id, payload);
      setFormations(prev => prev.map(f => f.id === editFormation.id ? mapFormation({ ...f, ...updated }) : f));
      setEditFormation(null);
      setError(null);
    } catch (err) {
      setError(`Erreur modification: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleArchive = async (id) => {
    try {
      await updateFormation(id, { statut: 'archivée' });
      setFormations(prev => prev.map(f => f.id === id ? { ...f, status: 'archivée' } : f));
    } catch (err) {
      console.error('Erreur archivage:', err);
      setError('Erreur lors de l\'archivage.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer définitivement cette formation ?')) return;
    try {
      await deleteFormation(id);
      setFormations(prev => prev.filter(f => f.id !== id));
    } catch (err) {
      console.error('Erreur suppression:', err);
      setError('Erreur lors de la suppression.');
    }
  };

  const handleCreate = async (formData) => {
    try {
      // Valider les champs obligatoires
      if (!formData.title.trim()) {
        setError('Le titre est obligatoire.');
        return;
      }
      if (!formData.desc.trim()) {
        setError('La description est obligatoire.');
        return;
      }
      if (!formData.instructor.trim()) {
        setError('Le formateur est obligatoire.');
        return;
      }
      if (!formData.duration || parseInt(formData.duration) < 1) {
        setError('La durée doit être au minimum 1 heure.');
        return;
      }

      const payload = {
        title:         formData.title.trim(),
        description:   formData.desc.trim(),
        nom_formateur: formData.instructor.trim(),
        id_formateur:  formData.instructorId ?? null,
        duree:         parseInt(formData.duration),
        domaine:       formData.cat,
        niveau:        formData.level,
        prix:          formData.price ? parseFloat(formData.price) : null,
        places_totales: formData.places_totales ? parseInt(formData.places_totales) : null,
        statut:        'Brouillon',
      };
      const created = await createFormation(payload);
      setFormations(prev => [mapFormation(created), ...prev]);
      setShowCreateModal(false);
      setError(null);
    } catch (err) {
      console.error('Erreur création:', err);
      setError(`Erreur lors de la création de la formation: ${err.response?.data?.message || err.message}`);
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="af-page">

        {/* ── LIST VIEW ── */}
        {view === 'list' && (
          <div className="af-list-view animate-fade-in">
            <header className="af-header">
              <div className="af-header-left">
                <h1>{t('common.manage_formations')}</h1>
                <p>{t('common.manage_formations_desc')}</p>
              </div>
              <button className="af-btn-create" onClick={() => setShowCreateModal(true)}>
                <span>+</span> {t('common.create_formation')}
              </button>
            </header>

            {/* Filters */}
            <div className="af-filters">
              <div className="af-filter-group">
                <label>{t('common.category')}</label>
                <select value={filterCat} onChange={e => setFilterCat(e.target.value)}>
                  <option value="tous">{t('common.all_categories')}</option>
                  <option value="Informatique">Informatique</option>
                  <option value="Design">Design</option>
                  <option value="Marketing">Marketing</option>
                </select>
              </div>
              <div className="af-filter-group">
                <label>{t('common.status')}</label>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                  <option value="tous">{t('common.all_statuses')}</option>
                  <option value="Brouillon">{t('common.draft')}</option>
                  <option value="En cours">{t('common.status_in_progress')}</option>
                  <option value="Complet">{t('common.complete')}</option>
                  <option value="Fermée">{t('common.closed')}</option>
                  <option value="active">{t('common.active')}</option>
                  <option value="archivée">{t('common.archive')}</option>
                </select>
              </div>
            </div>

            {/* Catalog Table */}
            <div className="af-table-wrapper">
              <table className="af-table">
                <thead>
                  <tr>
                    <th>Formation</th>
                    <th>Formateur</th>
                    <th>Dates</th>
                    <th>Statut</th>
                    <th>Inscrits</th>
                    <th>CA (Dt)</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFormations.map(f => (
                    <tr key={f.id}>
                      <td>
                        <div className="af-formation-cell">
                          <strong>{f.title}</strong>
                          <span>{f.cat}</span>
                        </div>
                      </td>
                      <td>{f.instructor}</td>
                      <td>{f.dates}</td>
                      <td>
                        <span className={`af-badge af-badge--${f.status}`}>
                          {f.status}
                        </span>
                      </td>
                      <td>{f.students}</td>
                      <td>{f.revenue.toLocaleString()}</td>
                      <td>
                        <div className="af-actions-btns">
                          <button className="af-btn-text" title={t('common.edit')} onClick={() => handleEditOpen(f)}>{t('common.edit')}</button>
                          <button className="af-btn-text af-btn-text--stats" title={t('common.view_stats')} onClick={() => handleViewStats(f)}>{t('common.stats_short')}</button>
                          <button
                            className="af-btn-text af-btn-text--archive"
                            title={t('common.archive')}
                            onClick={() => handleArchive(f.id)}
                          >
                            {t('common.archive')}
                          </button>
                          <button
                            className="af-btn-text af-btn-text--delete"
                            title={t('common.delete')}
                            onClick={() => handleDelete(f.id)}
                          >
                            {t('common.delete')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── STATS VIEW ── */}
        {view === 'stats' && selectedFormation && (
          <div className="af-stats-view animate-fade-in">
            <header className="af-header">
              <div className="af-header-left">
                <button className="af-btn-back" onClick={handleBackToList}>{t('common.return_catalog')}</button>
                <h2>Statistiques : {selectedFormation.title}</h2>
              </div>
              <div className="af-header-actions">
                <button className="af-btn-export">{t('common.export_pdf_csv')}</button>
              </div>
            </header>

            {/* KPI Cards */}
            <div className="af-stats-cards">
              <div className="af-stat-card">
                <label>Total Inscrits</label>
                <div className="af-stat-val">{selectedFormation.students}</div>
                <span className="af-stat-trend up">+12% vs mois dernier</span>
              </div>
              <div className="af-stat-card">
                <label>Taux Complétion</label>
                <div className="af-stat-val">{selectedFormation.completion}%</div>
                <div className="af-mini-progress"><div className="af-mini-fill" style={{ width: `${selectedFormation.completion}%` }}></div></div>
              </div>
              <div className="af-stat-card">
                <label>Revenu Généré</label>
                <div className="af-stat-val">{selectedFormation.revenue.toLocaleString()} Dt</div>
                <span className="af-stat-trend up">+8.4%</span>
              </div>
              <div className="af-stat-card">
                <label>Taux Rétention</label>
                <div className="af-stat-val">{selectedFormation.retention}%</div>
                <span className="af-stat-trend">Excellent</span>
              </div>
            </div>

            {/* Charts Grid */}
            <div className="af-charts-grid">
              <div className="af-chart-container">
                <h3>Évolution des inscriptions</h3>
                <div className="af-chart-box">
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={INSCRIPTION_TREND}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} />
                      <Tooltip cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }} />
                      <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="af-chart-container">
                <h3>Progression par chapitre</h3>
                <div className="af-chart-box">
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={PROGRESSION_CHAPTERS}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} />
                      <Tooltip />
                      <Line type="monotone" dataKey="value" stroke="#2697b7ff" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="af-chart-container">
                <h3>Répartition des statuts</h3>
                <div className="af-chart-box">
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
                      <Legend verticalAlign="bottom" align="center" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Students List */}
            <div className="af-table-section">
              <h3>{t('common.enrolled_learners')}</h3>
              <table className="af-table">
                <thead>
                  <tr>
                    <th>{t('common.name_email')}</th>
                    <th>{t('common.progression_col')}</th>
                    <th>{t('common.status')}</th>
                    <th>{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <div className="af-student-cell">
                        <strong>Ahmed Ali</strong>
                        <span>ahmed@email.com</span>
                      </div>
                    </td>
                    <td>
                      <div className="af-row-progress">
                        <div className="af-progress-bar"><div className="af-progress-fill" style={{ width: '85%' }}></div></div>
                        <span>85%</span>
                      </div>
                    </td>
                    <td><span className="af-badge af-badge--active">En cours</span></td>
                    <td><button className="af-btn-action">Contacter</button></td>
                  </tr>
                  <tr>
                    <td>
                      <div className="af-student-cell">
                        <strong>Lydia Ben</strong>
                        <span>lydia@email.com</span>
                      </div>
                    </td>
                    <td>
                      <div className="af-row-progress">
                        <div className="af-progress-bar"><div className="af-progress-fill" style={{ width: '100%' }}></div></div>
                        <span>100%</span>
                      </div>
                    </td>
                    <td><span className="af-badge af-badge--archivée">Terminé</span></td>
                    <td><button className="af-btn-action">Contacter</button></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Feedbacks */}
            <div className="af-feedbacks">
              <h3>Dernières évaluations</h3>
              <div className="af-feedback-grid">
                <div className="af-feedback-card">
                  <div className="af-fb-header">
                    <span className="af-fb-stars">⭐⭐⭐⭐⭐</span>
                    <span className="af-fb-date">Il y a 2 jours</span>
                  </div>
                  <p>"Formation très complète, le formateur est très pédagogue. Je recommande vivement !"</p>
                </div>
                <div className="af-feedback-card">
                  <div className="af-fb-header">
                    <span className="af-fb-stars">⭐⭐⭐⭐</span>
                    <span className="af-fb-date">Il y a 5 jours</span>
                  </div>
                  <p>"Excellent contenu, quelques exercices pratiques supplémentaires auraient été un plus."</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── CREATE/EDIT MODAL ── */}
        {showCreateModal && (
          <CreateFormationModal
            onClose={() => setShowCreateModal(false)}
            formateurs={formateurs}
            onSubmit={(newData) => handleCreate(newData)}
          />
        )}

        {/* ── EDIT MODAL ── */}
        {editFormation && (
          <CreateFormationModal
            onClose={() => setEditFormation(null)}
            onSubmit={handleEditSave}
            formateurs={formateurs}
            editMode={true}
            initialData={{
              title:          editFormation.title,
              cat:            editFormation.cat,
              instructor:     editFormation.instructor,
              instructorId:   null,
              price:          editFormation.price ?? '',
              duration:       editFormation.duration ?? '',
              level:          editFormation.level ?? 'Débutant',
              desc:           editFormation.desc ?? '',
              places_totales: editFormation.students ?? '',
              program: '', benefits: '', imageUrl: '', color: '#0ea5e9', dates: '',
            }}
          />
        )}

      </div>
    </DashboardLayout>
  );
};

/* ── SUB-COMPONENT: CREATE FORMATION MODAL ── */
const CreateFormationModal = ({ onClose, onSubmit, editMode = false, initialData = null, formateurs = [] }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState(initialData ?? {
    title: '',
    cat: 'Informatique',
    instructor: '',
    instructorId: null,
    price: '',
    duration: '',
    level: 'Débutant',
    desc: '',
    program: '',
    benefits: 'Certificat de réussite\nAccès illimité aux ressources\nProjets pratiques réels\nSupport 24/7 de l\'instructeur',
    imageUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80',
    color: '#0ea5e9',
    dates: '',
    places_totales: ''
  });

  const [activeTab, setActiveTab] = useState('edit');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Quand l'admin sélectionne un formateur dans le dropdown
  const handleFormateurSelect = (e) => {
    const selectedId = parseInt(e.target.value);
    const found = formateurs.find(f => f.id === selectedId);
    if (found) {
      setFormData(prev => ({
        ...prev,
        instructor:   found.name,
        instructorId: found.id,
      }));
    } else {
      setFormData(prev => ({ ...prev, instructor: '', instructorId: null }));
    }
  };

  const programList = useMemo(() => formData.program.split('\n').filter(l => l.trim() !== ''), [formData.program]);
  const benefitsList = useMemo(() => formData.benefits.split('\n').filter(l => l.trim() !== ''), [formData.benefits]);

  return (
    <div className="af-modal-overlay">
      <div className={`af-modal-content ${activeTab === 'preview' ? 'af-modal--large' : ''}`}>
        <div className="af-modal-header">
          <div className="af-modal-tabs">
            <button className={`af-modal-tab ${activeTab === 'edit' ? 'active' : ''}`} onClick={() => setActiveTab('edit')}>{editMode ? t('common.edit_formation') : t('common.add_formation')}</button>
            <button className={`af-modal-tab ${activeTab === 'preview' ? 'active' : ''}`} onClick={() => setActiveTab('preview')}>Aperçu Standard</button>
          </div>
          <button className="af-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="af-modal-body">
          {activeTab === 'edit' ? (
            <form className="af-create-form" onSubmit={e => e.preventDefault()}>
              <div className="af-form-row">
                <div className="af-form-group">
                  <label>Titre de la formation</label>
                  <input name="title" value={formData.title} onChange={handleChange} type="text" placeholder="Votre titre de la formation" />
                </div>
                <div className="af-form-group">
                  <label>Catégorie</label>
                  <select name="cat" value={formData.cat} onChange={handleChange}>
                    <option>Informatique</option>
                    <option>Design</option>
                    <option>Marketing</option>
                    <option>Business</option>
                  </select>
                </div>
              </div>

              <div className="af-form-row">
                <div className="af-form-group">
                  <label>Formateur responsable</label>
                  {formateurs.length > 0 ? (
                    <select
                      value={formData.instructorId ?? ''}
                      onChange={handleFormateurSelect}
                      style={{ width: '100%' }}
                    >
                      <option value="">— Sélectionner un formateur —</option>
                      {formateurs.map(f => (
                        <option key={f.id} value={f.id}>
                          {f.name} ({f.email})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      name="instructor"
                      value={formData.instructor}
                      onChange={handleChange}
                      type="text"
                      placeholder="Nom du formateur"
                    />
                  )}
                  {formData.instructor && (
                    <small style={{ color: '#10b981', marginTop: 4, display: 'block' }}>
                      ✓ {formData.instructor}
                    </small>
                  )}
                </div>
                <div className="af-form-group">
                  <label>Période (Dates)</label>
                  <input name="dates" value={formData.dates} onChange={handleChange} type="text" placeholder="Période" />
                </div>
              </div>

              <div className="af-form-row">
                <div className="af-form-group">
                  <label>Prix (Dt)</label>
                  <input name="price" value={formData.price} onChange={handleChange} type="number" placeholder="Prix" step="0.01" />
                </div>
                <div className="af-form-group">
                  <label>Durée (heures)</label>
                  <input name="duration" value={formData.duration} onChange={handleChange} type="number" placeholder="Durée en heures" />
                </div>
                <div className="af-form-group">
                  <label>Places disponibles</label>
                  <input name="places_totales" value={formData.places_totales} onChange={handleChange} type="number" placeholder="Nombre de places" />
                </div>
              </div>

              <div className="af-form-row">
                <div className="af-form-group">
                  <label>Niveau</label>
                  <select name="level" value={formData.level} onChange={handleChange}>
                    <option>Débutant</option>
                    <option>Intermédiaire</option>
                    <option>Avancé</option>
                  </select>
                </div>
              </div>

              <div className="af-form-group">
                <label>Description courte</label>
                <textarea name="desc" value={formData.desc} onChange={handleChange} rows="3" placeholder="Présentez la formation en quelques lignes..."></textarea>
              </div>

              <div className="af-form-group">
                <label>Programme (un point par ligne)</label>
                <textarea name="program" value={formData.program} onChange={handleChange} rows="4" placeholder="Module 1: Fondamentaux..."></textarea>
              </div>

              <div className="af-form-row">
                <div className="af-form-group">
                  <label>Image URL (Unsplash)</label>
                  <input name="imageUrl" value={formData.imageUrl} onChange={handleChange} type="text" />
                </div>
                <div className="af-form-group">
                  <label>Couleur d'accent</label>
                  <input name="color" value={formData.color} onChange={handleChange} type="color" className="af-input-color" />
                </div>
              </div>
            </form>
          ) : (
            <div className="af-preview-container">
              {/* Simplified Standard Details View */}
              <div className="af-prev-hero" style={{ background: formData.color }}>
                <div className="af-prev-badge">{formData.cat}</div>
                <h2>{formData.title || 'Titre de la formation'}</h2>
                <p>{formData.desc || 'La description apparaîtra ici...'}</p>
                <div className="af-prev-meta">
                  <span> {formData.duration || 'N/A'}</span>
                  <span> {formData.level}</span>
                  <span> {formData.instructor || 'Nom du formateur'}</span>
                </div>
                <div className="af-prev-price">S'inscrire — {formData.price || '0 Dt'}</div>
              </div>

              <div className="af-prev-content">
                <div className="af-prev-main">
                  <h3> Programme</h3>
                  <ul>
                    {programList.length > 0 ? programList.map((p, i) => <li key={i}>{p}</li>) : <li>Aucun programme défini</li>}
                  </ul>
                </div>
                <div className="af-prev-side">
                  <div className="af-prev-card">
                    <h3>✅ Ce que vous obtenez</h3>
                    <ul>
                      {benefitsList.map((b, i) => <li key={i}>{b}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="af-modal-footer">
          <button type="button" className="af-btn-secondary" onClick={onClose}>{t('common.cancel')}</button>
          <button type="button" className="af-btn-primary" onClick={() => onSubmit(formData)}>{editMode ? t('common.save_changes') : t('common.save_formation')}</button>
        </div>
      </div>
    </div>
  );
};

export default AdminFormationsPage;
