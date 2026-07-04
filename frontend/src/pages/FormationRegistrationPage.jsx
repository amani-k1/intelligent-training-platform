import React, { useState, useEffect } from 'react';
import { useTranslation } from '../context/LanguageContext';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api/axios';
import './FormationRegistrationPage.css';

const FormationRegistrationPage = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // État du formulaire avec TOUS vos champs spécifiques
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    tel: '',
    etat_civil: 'Mr',
    format: 'distance',
    situation: 'particuliere',
    niveau: 'Intermédiaire',
    objectif: 'Certification',
    rythme: 'modéré',
    score_technique: 0,
    score_soft_skills: 0,
    nb_formations_anterieures: 0,
    preference_format: 'distanciel',
    preference_horaire: '',
    disponibilite_hebdo: 'moyenne',
    experience: 0,
    categorie_client: 'engagement_moyen'
  });

  // Récupération automatique de l'utilisateur connecté
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const response = await api.get('auth/profile');
        const user = response.data;
        const names = (user.name || '').split(' ');
        setFormData(prev => ({
          ...prev,
          nom: names[0] || '',
          prenom: names.slice(1).join(' ') || '',
          email: user.email || '',
          tel: user.tel || prev.tel || '',
        }));
      } catch {
        const user = JSON.parse(localStorage.getItem('brn_user') || '{}');
        if (user.name) {
          const names = user.name.split(' ');
          setFormData(prev => ({
            ...prev,
            nom: names[0] || '',
            prenom: names.slice(1).join(' ') || '',
            email: user.email || '',
            tel: user.tel || ''
          }));
        }
      }
    };
    loadUserProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const payload = {
      formation_id: parseInt(id, 10),
      nom: formData.nom,
      prenom: formData.prenom,
      email: formData.email,
      telephone: formData.tel,
      etat_civil: formData.etat_civil,
      adresse: formData.adresse || 'non renseignée',
      cv: formData.cv || 'non renseigné',
      situation: formData.situation,
      format: formData.format,
      niveau: formData.niveau,
      rythme: formData.rythme,
      objectif: formData.objectif,
      score_technique: parseInt(formData.score_technique, 10) || 0,
      score_soft_skills: parseInt(formData.score_soft_skills, 10) || 0,
      nb_formations_anterieures: parseInt(formData.nb_formations_anterieures, 10) || 0,
      experience: parseInt(formData.experience, 10) || 0,
      disponibilite_hebdo: formData.disponibilite_hebdo,
      preference_format: formData.preference_format,
      preference_horaire: formData.preference_horaire || 'non spécifiée',
      categorie_client: formData.categorie_client,
    };

    try {
      await api.post('app/inscriptions/candidats', payload);
      setSuccess(true);
      setLoading(false);
      setTimeout(() => navigate('/dashboard/stagiaire'), 2500);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || t('common.reg_error_submit'));
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="reg-page">
        <Navbar />
        <div className="reg-success-card anim-fade-in">
          <div className="reg-success-icon">✅</div>
          <h2>{t('common.reg_success_title')}</h2>
          <p>{t('common.reg_success_desc')}</p>
          <div className="reg-loader-bar"><div className="reg-loader-fill"></div></div>
        </div>
      </div>
    );
  }

  return (
    <div className="reg-page">
      <Navbar />
      <div className="reg-container">
        <div className="reg-header anim-slide-up">
          <h1>{t('common.reg_page_title')} <span>#{id}</span></h1>
          <p>{t('common.reg_page_subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="reg-form anim-slide-up">

          {/* SECTION 1: AUTO-REMPLI */}
          <div className="reg-section">
            <h3 className="reg-section-title">{t('common.reg_section_identification')}</h3>
            <div className="reg-grid">
              <div className="reg-group">
                <label>{t('common.reg_civil_status')}</label>
                <select name="etat_civil" value={formData.etat_civil} onChange={handleChange}>
                  <option value="Mr">Monsieur (Mr)</option>
                  <option value="Mme">Madame (Mme)</option>
                </select>
              </div>
              <div className="reg-group">
                <label>{t('common.reg_name_firstname')}</label>
                <input type="text" value={`${formData.nom} ${formData.prenom}`} readOnly className="input-readonly" />
              </div>
              <div className="reg-group">
                <label>{t('common.reg_pro_email')}</label>
                <input type="email" value={formData.email} readOnly className="input-readonly" />
              </div>
              <div className="reg-group">
                <label>{t('common.reg_phone')}</label>
                <input type="text" name="tel" value={formData.tel} onChange={handleChange} required />
              </div>
            </div>
          </div>

          {/* SECTION 2: MODALITÉS SPÉCIFIQUES */}
          <div className="reg-section">
            <h3 className="reg-section-title">{t('common.reg_section_modalities')}</h3>
            <div className="reg-grid">
              <div className="reg-group">
                <label>{t('common.reg_format_label')}</label>
                <select name="format" value={formData.format} onChange={handleChange}>
                  <option value="distance">{t('common.reg_format_distance')}</option>
                  <option value="presentiel_intra">{t('common.reg_format_intra')}</option>
                  <option value="presentiel_inter">{t('common.reg_format_inter')}</option>
                </select>
              </div>
              <div className="reg-group">
                <label>{t('common.reg_situation_label')}</label>
                <select name="situation" value={formData.situation} onChange={handleChange}>
                  <option value="particuliere">{t('common.reg_sit_private')}</option>
                  <option value="entreprise">{t('common.reg_sit_company')}</option>
                </select>
              </div>
              <div className="reg-group">
                <label>{t('common.reg_pref_format_label')}</label>
                <select name="preference_format" value={formData.preference_format} onChange={handleChange}>
                  <option value="distanciel">{t('common.reg_pref_distance')}</option>
                  <option value="presentiel">{t('common.reg_pref_inperson')}</option>
                  <option value="hybride">{t('common.reg_pref_hybrid')}</option>
                </select>
              </div>
              <div className="reg-group">
                <label>{t('common.reg_pref_schedule_label')}</label>
                <input type="text" name="preference_horaire" value={formData.preference_horaire} onChange={handleChange} placeholder={t('common.reg_schedule_placeholder')} />
              </div>
            </div>
          </div>

          {/* SECTION 3: PROFILAGE IA – aligné avec le dataset d'entraînement */}
          <div className="reg-section">
            <h3 className="reg-section-title">🤖 Profilage IA</h3>
            <div className="reg-grid">

              <div className="reg-group">
                <label>{t('common.level_label')}</label>
                <select name="niveau" value={formData.niveau} onChange={handleChange}>
                  <option value="Débutant">{t('common.opt_beginner')}</option>
                  <option value="Intermédiaire">{t('common.opt_intermediate')}</option>
                  <option value="Avancé">{t('common.opt_advanced')}</option>
                  <option value="Expert">{t('common.reg_expert')}</option>
                </select>
              </div>

              <div className="reg-group">
                <label>{t('common.reg_objective_label')}</label>
                <select name="objectif" value={formData.objectif} onChange={handleChange}>
                  <option value="Certification">{t('common.reg_get_certification')}</option>
                  <option value="Perfectionnement">{t('common.reg_upskill')}</option>
                  <option value="Apprentissage">{t('common.reg_retraining')}</option>
                  <option value="Révision">Révision / Mise à niveau</option>
                </select>
              </div>

              <div className="reg-group">
                <label>{t('common.reg_pace_label')}</label>
                <select name="rythme" value={formData.rythme} onChange={handleChange}>
                  <option value="lent">{t('common.reg_slow')}</option>
                  <option value="modéré">{t('common.reg_moderate')}</option>
                  <option value="rapide">{t('common.reg_fast')}</option>
                </select>
              </div>

              <div className="reg-group">
                <label>{t('common.reg_availability_label')}</label>
                <select name="disponibilite_hebdo" value={formData.disponibilite_hebdo} onChange={handleChange}>
                  <option value="faible">⚡ {t('common.reg_low_avail')}</option>
                  <option value="moyenne">⚖️ {t('common.reg_medium_avail')}</option>
                  <option value="élevée">🚀 {t('common.reg_high_avail')}</option>
                </select>
              </div>

              <div className="reg-group">
                <label>{t('common.reg_experience_years')}</label>
                <input type="number" name="experience" value={formData.experience} onChange={handleChange} min="0" />
              </div>

              <div className="reg-group">
                <label>{t('common.reg_prev_formations')}</label>
                <input type="number" name="nb_formations_anterieures" value={formData.nb_formations_anterieures} onChange={handleChange} min="0" />
              </div>

              <div className="reg-group">
                <label>{t('common.reg_tech_score')}</label>
                <input type="number" name="score_technique" value={formData.score_technique} onChange={handleChange} min="0" max="100" />
              </div>

              <div className="reg-group">
                <label>{t('common.reg_soft_score')}</label>
                <input type="number" name="score_soft_skills" value={formData.score_soft_skills} onChange={handleChange} min="0" max="100" />
              </div>

            </div>
          </div>

          {error && <div className="reg-error">⚠️ {error}</div>}

          <div className="reg-footer">
            <button type="submit" className="reg-submit-btn" disabled={loading}>
              {loading ? t('common.reg_sending') : t('common.reg_confirm_registration')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormationRegistrationPage;


