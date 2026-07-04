import React, { useState } from 'react';
import { useTranslation } from '../context/LanguageContext';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api/axios';
import './SignUpPage.css';

const SignUpPage = () => {
  const { t } = useTranslation();
  const [step,         setStep]         = useState(1);
  const [selectedRole, setSelectedRole] = useState(null);
  const [formData,     setFormData]     = useState({});
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');
  const [submitted,    setSubmitted]    = useState(false);

  const ROLES = [
    {
      id: 'stagiaire',
      label: t('signup_page.role_stagiaire_label'),
      icon: '🎓',
      color: '#0a8fa0',
      desc: t('signup_page.role_stagiaire_desc'),
      bgImage: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&q=80'
    },
    {
      id: 'formateur',
      label: t('signup_page.role_formateur_label'),
      iconImage: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80',
      color: '#1a5276',
      desc: t('signup_page.role_formateur_desc'),
      bgImage: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&q=80'
    },
  ];

  const handleRoleSelect = (roleId) => {
    setSelectedRole(roleId);
    setStep(2);
    setFormData({ role: roleId });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirm) {
      setError(t('signup_page.error_password'));
      return;
    }

    setLoading(true);
    try {
      const dataToSend = new FormData();
      dataToSend.append('name', formData.nom_complet);
      dataToSend.append('email', formData.email);
      dataToSend.append('password', formData.password);
      dataToSend.append('password_confirmation', formData.confirm);
      dataToSend.append('role', selectedRole);
      dataToSend.append('status', selectedRole === 'formateur' ? 'attente' : 'actif');
      if (formData.photo_profil) {
        dataToSend.append('photo_profil', formData.photo_profil);
      }

      await api.post('auth/register', dataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setLoading(false);
      setSubmitted(true);
    } catch (err) {
      console.error('Erreur complète:', err);

      if (err.response) {
        const data = err.response.data;
        // Laravel validation errors: pick the first field-level message
        const firstValidationMsg = data?.errors
          ? Object.values(data.errors).flat()[0]
          : null;
        const serverMsg = firstValidationMsg || data?.message || data?.error || `Erreur serveur (${err.response.status})`;
        setError(serverMsg);
      } else if (err.request) {
        setError(t('common.backend_unavailable'));
      } else {
        setError(t('common.error_load'));
      }
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="signup-page">
        <Navbar />
        <div className="signup-success">
          <div className="signup-success__icon">✅</div>
          <h2>{t('signup_page.success_title')}</h2>
          <p>{t('signup_page.success_msg')}</p>
          <Link to="/login" className="signup-success__btn">{t('signup_page.success_btn')}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="signup-page">
      <Navbar />
      <main className="signup-main">

        {/* PROGRESS INDICATOR */}
        <div className="signup-steps">
          <div className={`signup-step ${step >= 1 ? 'signup-step--active' : ''}`}>{t('signup_page.step1')}</div>
          <div className="signup-step__line"></div>
          <div className={`signup-step ${step >= 2 ? 'signup-step--active' : ''}`}>{t('signup_page.step2')}</div>
        </div>

        {/* STEP 1: ROLE SELECTION */}
        {step === 1 && (
          <div className="signup-step-container anim-fade-in">
            <div className="signup-header">
              <h1>{t('signup_page.step1_title')} <span>BRN SMART ?</span></h1>
              <p>{t('signup_page.step1_sub')}</p>
            </div>
            <div className="signup-roles-grid">
              {ROLES.map(role => (
                <div
                  key={role.id}
                  className="signup-role-card-large"
                  onClick={() => handleRoleSelect(role.id)}
                  style={{
                    '--role-color': role.color,
                    backgroundImage: `url(${role.bgImage})`
                  }}
                >
                  <div className="signup-role-card-large__icon-wrapper">
                    {role.iconImage ? (
                      <img src={role.iconImage} alt={role.label} className="signup-role-card-large__icon-img" />
                    ) : (
                      <div className="signup-role-card-large__icon">{role.icon}</div>
                    )}
                  </div>
                  <h3>{role.label}</h3>
                  <p>{role.desc}</p>
                  <button className="signup-role-card-large__btn">
                    {t('signup_page.choose_btn')}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: DYNAMIC SPLIT LAYOUT FORM */}
        {step === 2 && (
          <div className="trainer-signup-layout anim-fade-in">
            <button className="signup-back trainer-signup-back" onClick={() => setStep(1)}>{t('signup_page.back')}</button>

            <div className="trainer-signup-left">
              <div className="trainer-left-content">
                <span className="trainer-badge">
                  {selectedRole === 'formateur' ? t('signup_page.badge_trainer') : t('signup_page.badge_student')}
                </span>
                <h1 className="trainer-title">
                  {selectedRole === 'formateur' ? t('signup_page.title_trainer') : t('signup_page.title_student')}
                </h1>
                <p className="trainer-desc">
                  {selectedRole === 'formateur' ? t('signup_page.desc_trainer') : t('signup_page.desc_student')}
                </p>

                <div className="trainer-features">
                  <div className="trainer-feature">
                    <div className="trainer-feature-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>
                    </div>
                    <div>
                      <h3>{selectedRole === 'formateur' ? t('signup_page.why_trainer') : t('signup_page.why_student')}</h3>
                      <p>{selectedRole === 'formateur' ? t('signup_page.why_trainer_desc') : t('signup_page.why_student_desc')}</p>
                    </div>
                  </div>
                  <div className="trainer-feature">
                    <div className="trainer-feature-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="6" width="20" height="12" rx="2"></rect><circle cx="12" cy="12" r="2"></circle><path d="M6 12h.01M18 12h.01"></path></svg>
                    </div>
                    <div>
                      <h3>{selectedRole === 'formateur' ? t('signup_page.pay_title') : t('signup_page.flex_title')}</h3>
                      <p>{selectedRole === 'formateur' ? t('signup_page.pay_desc') : t('signup_page.flex_desc')}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="trainer-left-image">
                <img src="/sigup.png" alt="Sign up illustration" />
              </div>
            </div>

            <div className="trainer-signup-right">
              <div className="trainer-form-card">
                <h2 className="trainer-form-title">
                  {selectedRole === 'formateur' ? t('signup_page.form_trainer') : t('signup_page.form_student')}
                </h2>

                <form onSubmit={handleSubmit} className="trainer-form">
                  <h4 className="trainer-section-title">{t('signup_page.account_section')}</h4>

                  <div className="trainer-field">
                    <label>{t('signup_page.name_label')}</label>
                    <input
                      type="text"
                      placeholder={t('signup_page.name_placeholder')}
                      required
                      value={formData.nom_complet || ''}
                      onChange={e => setFormData({...formData, nom_complet: e.target.value})}
                    />
                  </div>

                  <div className="trainer-field">
                    <label>{t('signup_page.email_label')}</label>
                    <input
                      type="email"
                      placeholder="name@email.com"
                      required
                      value={formData.email || ''}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                  </div>

                  <div className="trainer-form-row">
                    <div className="trainer-field">
                      <label>{t('signup_page.password_label')}</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        required
                        value={formData.password || ''}
                        onChange={e => setFormData({...formData, password: e.target.value})}
                      />
                    </div>
                    <div className="trainer-field">
                      <label>{t('signup_page.confirm_label')}</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        required
                        value={formData.confirm || ''}
                        onChange={e => setFormData({...formData, confirm: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="trainer-field">
                    <label>{t('signup_page.photo_label')}</label>
                    <div className="trainer-file-upload">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '24px', height: '24px' }}>
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                        <circle cx="12" cy="13" r="4"></circle>
                      </svg>
                      <p><span>{t('signup_page.photo_upload_text')}</span></p>
                      <input
                        type="file"
                        className="trainer-file-input"
                        accept="image/*"
                        onChange={e => setFormData({...formData, photo_profil: e.target.files[0]})}
                      />
                    </div>
                    {formData.photo_profil && <p className="file-selected-name">{t('signup_page.photo_selected')}{formData.photo_profil.name}</p>}
                  </div>

                  <div className="trainer-terms">
                    <input type="checkbox" id="terms" required />
                    <label htmlFor="terms">{t('signup_page.terms_label')}</label>
                  </div>

                  {error && <div className="signup-error-msg" style={{marginTop:0}}>⚠️ {error}</div>}

                  <button type="submit" className="trainer-submit-btn" disabled={loading}>
                    {loading ? t('signup_page.creating_account') : t('signup_page.create_account_btn')}
                  </button>

                </form>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default SignUpPage;
