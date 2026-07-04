import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from '../context/LanguageContext';
import DashboardLayout from '../components/DashboardLayout';
import api from '../api/axios';
import './RegistrationRequestsPage.css';

const RegistrationRequestsPage = () => {
  const { t } = useTranslation();
  const [requests, setRequests] = useState([]);
  const [formations, setFormations] = useState([]);
  const [filterStatus, setFilterStatus] = useState('tous');
  const [filterFormation, setFilterFormation] = useState('tous');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [predictionStatuses, setPredictionStatuses] = useState({});
  const [predictionErrors, setPredictionErrors] = useState({});

  useEffect(() => {
    fetchRequests();
    fetchFormations();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await api.get('/app/demandes/candidats');
      const data = response.data?.inscriptions ?? response.data?.data ?? response.data ?? [];
      setRequests(Array.isArray(data) ? data.map(mapBackendToFrontend) : []);
      setError('');
    } catch (err) {
      console.error('Erreur API:', err);
      setError("Erreur lors du chargement des demandes d'inscription.");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchFormations = async () => {
    try {
      const response = await api.get('/app/formations');
      const data = response.data?.data ?? response.data ?? [];
      setFormations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Erreur chargement des formations:', err);
      setFormations([]);
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      await api.put(`/app/inscriptions/candidats/${id}`, { statut: newStatus });
      setRequests(prev => prev.map(req => req.id === id ? { ...req, status: newStatus } : req));
      if (selectedRequest && selectedRequest.id === id) setSelectedRequest({ ...selectedRequest, status: newStatus });
    } catch (err) {
      console.error('Erreur lors de la mise à jour du statut:', err);
      alert('Erreur lors de la mise à jour du statut.');
    }
  };

  const handlePredict = async (req) => {
    setPredictionStatuses(prev => ({ ...prev, [req.id]: 'loading' }));
    setPredictionErrors(prev => ({ ...prev, [req.id]: '' }));
    try {
      const response = await api.post(`/app/admin/profilages/${req.id}/predict`);
      const groupe = response.data?.groupe_estime ?? response.data?.profilage?.groupe_estime ?? null;
      setRequests(prev => prev.map(item => item.id === req.id ? { ...item, groupe_estime: groupe } : item));
      if (selectedRequest && selectedRequest.id === req.id) setSelectedRequest(prev => ({ ...prev, groupe_estime: groupe }));
      setPredictionStatuses(prev => ({ ...prev, [req.id]: 'done' }));
    } catch (err) {
      const message = err.response?.data?.error || err.response?.data?.message || 'Erreur lors de la prédiction IA.';
      console.error('Erreur IA:', err);
      setPredictionStatuses(prev => ({ ...prev, [req.id]: 'error' }));
      setPredictionErrors(prev => ({ ...prev, [req.id]: message }));
    }
  };

  const handleDownloadCV = async (req) => {
    try {
      const response = await api.get(`/candidats/${req.id}/cv`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `cv_${req.id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error('Erreur téléchargement CV:', err);
      alert('Erreur lors du téléchargement du CV');
    }
  };

  const handleArchive = async (id) => {
    if (window.confirm('Voulez-vous archiver cette demande ?')) {
      await updateStatus(id, 'archive');
    }
  };

  const mapStatus = (status) => {
    const statusMap = { 'en_attente': 'en attente', 'accepte': 'acceptée', 'refuse': 'refusée', 'archive': 'archivée' };
    return statusMap[status] || status || 'en attente';
  };

  const mapBackendToFrontend = (item) => ({
    id: item.id,
    firstName: item.prenom || item.firstName || '',
    lastName: item.nom || item.lastName || '',
    email: item.email || '',
    phone: item.telephone || item.phone || '',
    level: item.niveau || item.level || '',
    rythme: item.rythme || '',
    format: item.format || '',
    goal: item.objectif || item.goal || '',
    availability: item.disponibilite_hebdo || item.disponibilite || item.availability || '',
    experience: item.experience || 0,
    score_technique: item.score_technique || 0,
    score_soft_skills: item.score_soft_skills || 0,
    nb_formations: item.nb_formations_anterieures || 0,
    formation: item.formation?.title || item.formation_name || '',
    formation_id: item.formation_id || null,
    date: item.created_at ? new Date(item.created_at).toLocaleDateString('fr-FR') : '',
    status: mapStatus(item.statut || item.status),
    cvUrl: item.cv || item.cvUrl || '',
    adresse: item.adresse || '',
    situation: item.situation || '',
    etat_civil: item['état_civil'] || item.etat_civil || '',
    groupe_estime: item.groupe_estime || null
  });

  const filteredRequests = useMemo(() => {
    return requests.filter(req => {
      const matchStatus = filterStatus === 'tous' || req.status === filterStatus || (filterStatus === 'archivée' && req.status === 'archivée');
      const matchFormation = filterFormation === 'tous' || req.formation === filterFormation || req.formation_id?.toString() === filterFormation;
      if (filterStatus !== 'archivée' && req.status === 'archivée') return false;
      if (filterStatus === 'archivée' && req.status !== 'archivée') return false;
      return matchStatus && matchFormation;
    });
  }, [requests, filterStatus, filterFormation]);

  const formationsList = useMemo(() => [...new Set(requests.map(r => r.formation).filter(Boolean))], [requests]);

  const handleConsult = (req) => { setSelectedRequest(req); setShowModal(true); };

  return (
    <DashboardLayout role="admin">
      <div className="rr-page">
        <header className="rr-header">
          <h1>{t('registration_page.title')}</h1>
          <p>{t('registration_page.subtitle')}</p>
        </header>

        {error && (
          <div className="rr-error-message" style={{ backgroundColor: '#fee', color: '#c33', padding: '15px', borderRadius: '4px', marginBottom: '20px', borderLeft: '4px solid #c33' }}>
            ⚠️ {error}
          </div>
        )}

        {loading && (
          <div style={{ textAlign: 'center', padding: '40px', fontSize: '18px', color: '#666' }}>⏳ {t('common.loading_requests')}</div>
        )}

        <div className="rr-filters">
          <div className="rr-filter-group">
            <label>{t('common.status')}</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="tous">{t('registration_page.all_active')}</option>
              <option value="en attente">{t('common.pending')}</option>
              <option value="acceptée">{t('registration_page.accepted_f')}</option>
              <option value="refusée">{t('registration_page.refused_f')}</option>
              <option value="archivée">{t('common.tab_archived')}</option>
            </select>
          </div>
          <div className="rr-filter-group">
            <label>{t('common.formation')}</label>
            <select value={filterFormation} onChange={(e) => setFilterFormation(e.target.value)}>
              <option value="tous">{t('registration_page.all_formations')}</option>
              {formations.map(f => (<option key={f.id} value={f.id}>{f.title || f.nom || `Formation ${f.id}`}</option>))}
            </select>
          </div>
        </div>

        <div className="rr-table-container">
          <table className="rr-table">
            <thead>
              <tr>
                <th>{t('registration_page.col_candidate')}</th>
                <th>{t('registration_page.col_target_formation')}</th>
                <th>{t('registration_page.col_date')}</th>
                <th>{t('common.status')}</th>
                <th>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.length > 0 ? filteredRequests.map(req => (
                <tr key={req.id}>
                  <td><div className="rr-candidat-info"><strong>{req.firstName} {req.lastName}</strong><span>{req.email}</span></div></td>
                  <td>{req.formation}</td>
                  <td>{req.date}</td>
                  <td><span className={`rr-status-badge rr-status--${req.status.replace(' ', '-')}`}>{req.status}</span></td>
                  <td>
                    <div className="rr-actions-cell">
                      <button className="rr-btn-text" title={t('common.view')} onClick={() => handleConsult(req)}>{t('common.view')}</button>
                      {req.status !== 'archivée' && (<button className="rr-btn-text" title={t('common.archive')} onClick={() => handleArchive(req.id)}>{t('common.archive')}</button>)}
                      <button
                        className="rr-btn-text rr-btn-ia"
                        title="Matching IA"
                        onClick={() => handlePredict(req)}
                        disabled={predictionStatuses[req.id] === 'loading'}
                      >
                        {predictionStatuses[req.id] === 'loading' ? 'Chargement...' : 'Group-IA'}
                      </button>
                    
                      {predictionStatuses[req.id] === 'error' && (
                        <span style={{ color: 'red', marginLeft: '6px' }}>{predictionErrors[req.id]}</span>
                      )}
                      {req.groupe_estime && (
                        <span className="rr-prediction-tag" title="Résultat Matching IA" style={{ marginLeft: '6px' }}>
                          Groupe IA: {req.groupe_estime}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="5" className="rr-empty">{loading ? t('common.loading') : t('registration_page.no_requests')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {showModal && selectedRequest && (
          <div className="rr-modal-overlay" role="dialog" aria-modal="true">
            <div className="rr-modal-content">
              <div className="rr-modal-header">
                <h2>{t('registration_page.request_details')}</h2>
                <button className="rr-modal-close" onClick={() => setShowModal(false)}>✖</button>
              </div>

              <div className="rr-modal-body">
                <div className="rr-detail-section">
                  <h3>{t('registration_page.candidate_info')}</h3>
                  <div className="rr-detail-grid">
                    <div className="rr-detail-item">
                      <label>{t('common.name')}</label>
                      <p>{selectedRequest.firstName} {selectedRequest.lastName}</p>
                    </div>
                    <div className="rr-detail-item">
                      <label>{t('common.email')}</label>
                      <p>{selectedRequest.email}</p>
                    </div>
                    <div className="rr-detail-item">
                      <label>{t('common.phone')}</label>
                      <p>{selectedRequest.phone}</p>
                    </div>
                    <div className="rr-detail-item">
                      <label>{t('common.formation')}</label>
                      <p>{selectedRequest.formation}</p>
                    </div>
                    <div className="rr-detail-item">
                      <label>{t('common.availability')}</label>
                      <p>
                        {!selectedRequest.availability
                          ? t('common.not_filled')
                          : isNaN(selectedRequest.availability)
                            ? selectedRequest.availability
                            : `${selectedRequest.availability}${t('common.hours_per_week')}`
                        }
                      </p>
                    </div>
                    <div className="rr-detail-item">
                      <label>{t('common.level')}</label>
                      <p>{selectedRequest.level || t('common.not_filled')}</p>
                    </div>
                    <div className="rr-detail-item">
                      <label>{t('common.rythm')}</label>
                      <p>{selectedRequest.rythme || t('common.not_filled')}</p>
                    </div>
                    <div className="rr-detail-item">
                      <label>{t('common.format')}</label>
                      <p>{selectedRequest.format || t('common.not_filled')}</p>
                    </div>
                    <div className="rr-detail-item">
                      <label>{t('common.objective')}</label>
                      <p>{selectedRequest.goal || t('common.not_filled')}</p>
                    </div>
                    <div className="rr-detail-item">
                      <label>{t('common.experience')}</label>
                      <p>{selectedRequest.experience} {t('common.day')}(s)</p>
                    </div>
                    <div className="rr-detail-item rr-span-2">
                      <label>{t('common.scores_tech_soft')}</label>
                      <p>{selectedRequest.score_technique} / {selectedRequest.score_soft_skills}</p>
                    </div>
                    <div className="rr-detail-item rr-span-2">
                      <label>{t('common.address')}</label>
                      <p>{selectedRequest.adresse}</p>
                    </div>
                    <div className="rr-detail-item">
                      <label>{t('common.situation')}</label>
                      <p>{selectedRequest.situation}</p>
                    </div>
                    <div className="rr-detail-item">
                      <label>{t('common.civil_status')}</label>
                      <p>{selectedRequest.etat_civil}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rr-modal-footer">
                <div className="rr-status-current">{t('registration_page.current_status')}: {selectedRequest.status}</div>
                <div className="rr-modal-actions">
                  <button className="rr-btn-accept" onClick={async () => { await updateStatus(selectedRequest.id, 'accepte'); setShowModal(false); }}>{t('common.accept')}</button>
                  <button className="rr-btn-refuse" onClick={async () => { await updateStatus(selectedRequest.id, 'refuse'); setShowModal(false); }}>{t('common.refuse')}</button>
                  <button className="rr-btn-ia" onClick={() => handlePredict(selectedRequest)} disabled={predictionStatuses[selectedRequest.id] === 'loading'}>
                    {predictionStatuses[selectedRequest.id] === 'loading' ? 'Chargement...' : 'Group-IA'}
                  </button>
                </div>
              </div>

              {predictionStatuses[selectedRequest.id] === 'error' && (
                <div style={{ color: 'red', padding: '0 2rem 1rem' }}>{predictionErrors[selectedRequest.id]}</div>
              )}

              {selectedRequest.groupe_estime && (
                <div style={{ padding: '0 2rem 1.2rem' }}>
                  <div className="rr-prediction-tag">Groupe IA: {selectedRequest.groupe_estime}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default RegistrationRequestsPage;
