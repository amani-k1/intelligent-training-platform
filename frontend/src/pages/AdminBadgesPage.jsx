import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from '../context/LanguageContext';
import DashboardLayout from '../components/DashboardLayout';
import badgeService from '../services/badgeService';
import './AdminBadgesPage.css';

const AdminBadgesPage = () => {
  const { t } = useTranslation();
  const [badges, setBadges] = useState([]);
  const [learners, setLearners] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeBadge, setActiveBadge] = useState(null);
  const [showModal, setShowModal] = useState(null); // 'add', 'edit', 'delete'
  const [formData, setFormData] = useState({ 
    name: '', 
    description: '', 
    xp: '', 
    condition: '', 
    color: '#3498db' 
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [assignData, setAssignData] = useState({
    user_id: '', user_name: '', user_role: 'stagiaire', note: ''
  });
  const [assignSuccess, setAssignSuccess] = useState(null);

  // Charger les badges au montage du composant
  useEffect(() => {
    fetchBadges();
  }, []);

  // Charger les apprenants quand le badge actif change
  useEffect(() => {
    if (activeBadge?.id) {
      fetchLearners(activeBadge.id);
    }
  }, [activeBadge]);

  const fetchBadges = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await badgeService.getAllBadges();
      const badgesData = response.data || response;
      setBadges(badgesData);
      if (badgesData.length > 0 && !activeBadge) {
        setActiveBadge(badgesData[0]);
      }
    } catch (err) {
      setError('Erreur lors du chargement des badges');
      console.error('Fetch badges error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLearners = async (badgeId) => {
    try {
      const response = await badgeService.getBadgeLearners(badgeId);
      const learnersData = response.data || response;
      setLearners(learnersData);
    } catch (err) {
      console.error('Fetch learners error:', err);
      setLearners([]);
    }
  };

  const filteredBadges = useMemo(() => {
    return badges.filter(b => 
      b.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [badges, searchTerm]);

  const handleOpenModal = (type, badge = null) => {
    setShowModal(type);
    if (badge) {
      setFormData(badge);
    } else {
      setFormData({ 
        name: '', 
        description: '', 
        xp: '', 
        condition: '', 
        color: '#3498db' 
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const badgeData = {
        ...formData,
        xp: parseInt(formData.xp) || 0,
        assigned_count: formData.assignedCount || 0
      };

      if (showModal === 'add') {
        const response = await badgeService.createBadge(badgeData);
        const newBadge = response.data || response;
        setBadges([...badges, newBadge]);
        setActiveBadge(newBadge);
      } else {
        const response = await badgeService.updateBadge(activeBadge.id, badgeData);
        const updatedBadge = response.data || response;
        const updated = badges.map(b => 
          b.id === activeBadge.id ? { ...b, ...updatedBadge } : b
        );
        setBadges(updated);
        setActiveBadge({ ...activeBadge, ...updatedBadge });
      }
      setShowModal(null);
    } catch (err) {
      setError('Erreur lors de l\'enregistrement du badge');
      console.error('Submit error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setAssignSuccess(null);
    try {
      await badgeService.assignBadge(activeBadge.id, {
        user_id: parseInt(assignData.user_id),
        user_name: assignData.user_name,
        user_role: assignData.user_role,
        note: assignData.note || null
      });
      setAssignSuccess(`Badge attribué à ${assignData.user_name} avec succès !`);
      setAssignData({ user_id: '', user_name: '', user_role: 'stagiaire', note: '' });
      fetchLearners(activeBadge.id);
      fetchBadges();
      setTimeout(() => setShowModal(null), 1200);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Erreur lors de l\'attribution';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (assignmentId, userName) => {
    if (!window.confirm(`Révoquer le badge de ${userName} ?`)) return;
    setLoading(true);
    try {
      await badgeService.revokeBadge(activeBadge.id, assignmentId);
      fetchLearners(activeBadge.id);
      fetchBadges();
    } catch (err) {
      setError('Erreur lors de la révocation');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await badgeService.deleteBadge(activeBadge.id);
      const updated = badges.filter(b => b.id !== activeBadge.id);
      setBadges(updated);
      setActiveBadge(updated[0] || null);
      setShowModal(null);
    } catch (err) {
      setError('Erreur lors de la suppression du badge');
      console.error('Delete error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="ab-v3 animate-fade-in">
        
        {/* Affichage des erreurs */}
        {error && (
          <div className="error-banner" style={{
            background: '#fee2e2',
            border: '1px solid #ef4444',
            color: '#991b1b',
            padding: '1rem',
            borderRadius: '8px',
            margin: '1rem 0'
          }}>
            {error}
          </div>
        )}

        {/* Indicateur de chargement */}
        {loading && (
          <div className="loading-overlay" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(255, 255, 255, 0.8)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}>
            <div>{t('common.loading')}</div>
          </div>
        )}
        
        {/* SIDEBAR LIST */}
        <aside className="ab-v3-sidebar">
          <div className="sidebar-header">
            <h2>Badges</h2>
            <div className="search-mini">
              <i className="fas fa-search"></i>
              <input 
                type="text" 
                placeholder="Rechercher..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="badge-list">
            {filteredBadges.length > 0 ? (
              filteredBadges.map(b => (
                <div 
                  key={b.id} 
                  className={`badge-item-nav ${activeBadge?.id === b.id ? 'active' : ''}`}
                  onClick={() => setActiveBadge(b)}
                >
                  <div className="nav-accent" style={{backgroundColor: b.color}}></div>
                  <div className="nav-info">
                    <strong>{b.name}</strong>
                    <span>{b.xp} XP</span>
                  </div>
                </div>
              ))
            ) : (
              <p style={{padding: '1rem', textAlign: 'center', color: '#666'}}>
                {t('common.no_badge')}
              </p>
            )}
          </div>

          <div className="sidebar-footer">
            <button 
              className="btn-add-block" 
              onClick={() => handleOpenModal('add')}
              disabled={loading}
            >
              {t('common.new_badge')}
            </button>
          </div>
        </aside>

        {/* MAIN DETAIL VIEW */}
        <main className="ab-v3-main">
          {activeBadge ? (
            <div className="detail-view animate-fade-in" key={activeBadge.id}>
              <header className="detail-header-v5">
                <div className="detail-info-v5">
                  <div className="badge-category-tag" style={{color: activeBadge.color}}>
                    {t('common.certified_badge')}
                  </div>
                  <h1>{activeBadge.name}</h1>
                  <p>
                    {activeBadge.assignedCount || activeBadge.assigned_count || 0} {t('common.badge_holders')}
                  </p>
                </div>
                <div className="detail-actions">
                  <button
                    className="btn-detail-action assign"
                    onClick={() => { setAssignData({ user_id: '', user_name: '', user_role: 'stagiaire', note: '' }); setAssignSuccess(null); setError(null); setShowModal('assign'); }}
                    disabled={loading}
                  >
                    {t('common.assign')}
                  </button>
                  <button
                    className="btn-detail-action edit"
                    onClick={() => handleOpenModal('edit', activeBadge)}
                    disabled={loading}
                  >
                    {t('common.edit')}
                  </button>
                  <button
                    className="btn-detail-action delete"
                    onClick={() => handleOpenModal('delete')}
                    disabled={loading}
                  >
                    {t('common.delete')}
                  </button>
                </div>
              </header>

              <div className="detail-grid">
                <div className="detail-card-v5">
                  <label>Récompense</label>
                  <div className="val">{activeBadge.xp} XP</div>
                </div>
                <div className="detail-card-v5">
                  <label>Condition d'obtention</label>
                  <div className="val">{activeBadge.condition}</div>
                </div>
                <div className="detail-card-v5 full">
                  <label>Description du badge</label>
                  <div className="val">{activeBadge.description}</div>
                </div>
              </div>

              <section className="learners-section">
                <h3>Historique des attributions <span style={{color:'#64748b', fontWeight:400, fontSize:'0.9rem'}}>({learners.length} destinataire{learners.length !== 1 ? 's' : ''})</span></h3>
                {learners.length > 0 ? (
                  <table className="mini-table-v5">
                    <thead>
                      <tr>
                        <th>Destinataire</th>
                        <th>Rôle</th>
                        <th>Note</th>
                        <th>Date</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {learners.map(l => (
                        <tr key={l.id}>
                          <td><strong>{l.name}</strong><br/><span style={{color:'#94a3b8', fontSize:'0.8rem'}}>ID: {l.user_id}</span></td>
                          <td><span className={`role-chip role-${l.role}`}>{l.role}</span></td>
                          <td style={{color:'#64748b', fontSize:'0.85rem'}}>{l.note || '—'}</td>
                          <td>{l.date}</td>
                          <td>
                            <button
                              className="btn-revoke"
                              onClick={() => handleRevoke(l.id, l.name)}
                              disabled={loading}
                            >
                              {t('common.revoke')}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p style={{color:'#94a3b8', fontStyle:'italic'}}>{t('common.no_assignment')}</p>
                )}
              </section>
            </div>
          ) : (
            <div className="main-placeholder">
              <p>{t('common.select_badge')}</p>
            </div>
          )}
        </main>

        {/* MODALS */}
        {(showModal === 'add' || showModal === 'edit') && (
          <div className="ab-v3-overlay">
            <div className="ab-v3-modal">
              <h2>{showModal === 'add' ? t('common.create_badge_full') : t('common.edit_badge_full')}</h2>
              <form onSubmit={handleSubmit} className="modal-form" style={{marginTop: '1.5rem'}}>
                <label>Nom du badge</label>
                <input 
                  type="text" 
                  required 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                />
                <label>Description</label>
                <textarea 
                  rows="3" 
                  required 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                />
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                  <div>
                    <label>Valeur XP</label>
                    <input 
                      type="number" 
                      required 
                      value={formData.xp} 
                      onChange={e => setFormData({...formData, xp: e.target.value})} 
                    />
                  </div>
                  <div>
                    <label>Couleur Thème</label>
                    <input 
                      type="color" 
                      value={formData.color} 
                      onChange={e => setFormData({...formData, color: e.target.value})} 
                    />
                  </div>
                </div>
                <label>Condition</label>
                <input 
                  type="text" 
                  required 
                  value={formData.condition} 
                  onChange={e => setFormData({...formData, condition: e.target.value})} 
                />
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn-cancel" 
                    onClick={() => setShowModal(null)}
                  >
                    {t('common.cancel')}
                  </button>
                  <button 
                    type="submit" 
                    className="btn-add-block" 
                    style={{width: 'auto'}}
                    disabled={loading}
                  >
                    {loading ? t('common.saving') : t('common.save')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showModal === 'assign' && (
          <div className="ab-v3-overlay">
            <div className="ab-v3-modal">
              <h2 style={{color:'#0a8fa0'}}>{t('common.assign_badge_full')}</h2>
              <p style={{color:'#64748b', marginBottom:'1rem'}}>
                Badge : <strong>{activeBadge?.name}</strong> — {activeBadge?.xp} XP
              </p>
              {assignSuccess && (
                <div style={{background:'#ecfdf5', color:'#065f46', border:'1px solid #a7f3d0', padding:'0.75rem', borderRadius:'6px', marginBottom:'1rem'}}>
                  {assignSuccess}
                </div>
              )}
              {error && (
                <div style={{background:'#fef2f2', color:'#991b1b', border:'1px solid #fecaca', padding:'0.75rem', borderRadius:'6px', marginBottom:'1rem'}}>
                  {error}
                </div>
              )}
              <form onSubmit={handleAssign} className="modal-form">
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem'}}>
                  <div>
                    <label>Nom du destinataire *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Karim Ben Ali"
                      value={assignData.user_name}
                      onChange={e => setAssignData({...assignData, user_name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label>ID Utilisateur *</label>
                    <input
                      type="number"
                      required
                      placeholder="ID depuis service-1"
                      value={assignData.user_id}
                      onChange={e => setAssignData({...assignData, user_id: e.target.value})}
                    />
                  </div>
                </div>
                <label>Rôle du destinataire *</label>
                <select
                  required
                  value={assignData.user_role}
                  onChange={e => setAssignData({...assignData, user_role: e.target.value})}
                  style={{padding:'0.6rem', borderRadius:'6px', border:'1px solid #e2e8f0', fontSize:'0.9rem'}}
                >
                  <option value="stagiaire">Stagiaire (B2C)</option>
                  <option value="client_b2b">Client B2B</option>
                  <option value="formateur">Formateur</option>
                  <option value="client_b2c">Client B2C</option>
                </select>
                <label>Note / Raison (optionnel)</label>
                <textarea
                  rows="2"
                  placeholder="Ex: Félicitations pour l'obtention de la certification..."
                  value={assignData.note}
                  onChange={e => setAssignData({...assignData, note: e.target.value})}
                />
                <div className="modal-footer">
                  <button type="button" className="btn-cancel" onClick={() => setShowModal(null)}>
                    {t('common.cancel')}
                  </button>
                  <button type="submit" className="btn-add-block" style={{width:'auto', background:'#0a8fa0'}} disabled={loading}>
                    {loading ? t('common.saving') : t('common.assign_badge_full')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showModal === 'delete' && (
          <div className="ab-v3-overlay">
            <div className="ab-v3-modal" style={{textAlign: 'center'}}>
              <h2 style={{color: '#e11d48'}}>{t('common.delete')} ?</h2>
              <p style={{margin: '1rem 0'}}>
                {t('common.delete')} <strong>"{activeBadge?.name}"</strong> ?
              </p>
              <div className="modal-footer" style={{justifyContent: 'center'}}>
                <button className="btn-cancel" onClick={() => setShowModal(null)}>
                  {t('common.cancel')}
                </button>
                <button 
                  className="btn-add-block" 
                  style={{width: 'auto', background: '#e11d48'}} 
                  onClick={handleDelete}
                  disabled={loading}
                >
                  {loading ? t('common.saving') : t('common.delete')}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default AdminBadgesPage;