import React, { useState } from 'react';
import { useTranslation } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import api from '../api/axios';
import './ContactPage.css';

const ContactPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    subject: '',
    message: ''
  });
  const [status, setStatus] = useState(null); // null | 'loading' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    try {
      await api.post('contact', {
        subject:    formData.subject,
        message:    formData.message,
        user_name:  user?.name  || '',
        user_email: user?.email || '',
      });
      setStatus('success');
      setFormData({ subject: '', message: '' });
    } catch (err) {
      setStatus('error');
      setErrorMsg(
        err?.response?.data?.message || 'Une erreur est survenue. Veuillez réessayer.'
      );
    }
  };

  return (
    <div className="contact-page">
      <Navbar />

      <main className="contact-main">
        {/* ── Hero Section ── */}
        <section className="contact-hero">
          <div className="contact-hero__inner">
            <h1 className="contact-hero__title">{t('contact.hero_title')}</h1>
            <p className="contact-hero__subtitle">{t('contact.hero_subtitle')}</p>
          </div>
        </section>

        {/* ── Main Content Grid ── */}
        <section className="contact-content">
          <div className="contact-content__inner">
            
            {/* ── Left Column: Form ── */}
            <div className="contact-form-wrapper">

              {/* Message succès */}
              {status === 'success' && (
                <div className="contact-feedback contact-feedback--success">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><polyline points="20 6 9 17 4 12"/></svg>
                  Votre message a été envoyé au directeur. Il vous répondra par email.
                </div>
              )}

              {/* Message erreur */}
              {status === 'error' && (
                <div className="contact-feedback contact-feedback--error">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="contact-form">

                {/* Nom & Email — auto-remplis depuis le profil connecté */}
                <div className="contact-form__row">
                  <div className="contact-field">
                    <label>{t('contact.name_label')}</label>
                    <input
                      type="text"
                      value={user?.name || ''}
                      readOnly
                      className="contact-input--readonly"
                    />
                  </div>
                  <div className="contact-field">
                    <label>{t('contact.email_label')}</label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      readOnly
                      className="contact-input--readonly"
                    />
                  </div>
                </div>

                <div className="contact-field">
                  <label>{t('contact.subject_label')}</label>
                  <div className="contact-select-wrapper">
                    <select
                      value={formData.subject}
                      onChange={e => setFormData({...formData, subject: e.target.value})}
                      required
                      disabled={status === 'loading'}
                    >
                      <option value="" disabled>{t('contact.subject_placeholder')}</option>
                      <option value="Demande commerciale">{t('contact.subject_sales')}</option>
                      <option value="Support technique">{t('contact.subject_support')}</option>
                      <option value="Demande de partenariat">{t('contact.subject_partner')}</option>
                    </select>
                    <svg className="contact-select-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                  </div>
                </div>

                <div className="contact-field">
                  <label>{t('contact.message_label')}</label>
                  <textarea
                    placeholder={t('contact.message_placeholder')}
                    rows="6"
                    value={formData.message}
                    onChange={e => setFormData({...formData, message: e.target.value})}
                    required
                    disabled={status === 'loading'}
                  />
                </div>

                <button
                  type="submit"
                  className="contact-submit-btn"
                  disabled={status === 'loading'}
                >
                  {status === 'loading' ? (
                    <>
                      <span className="contact-spinner" />
                      Envoi en cours...
                    </>
                  ) : t('contact.submit')}
                </button>
              </form>
            </div>

            {/* ── Right Column: Info & Map ── */}
            <div className="contact-info-wrapper">
              
              <div className="contact-info-cards">
                {/* Headquarters Card */}
                <div className="contact-info-card">
                  <div className="contact-info-card__icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                  </div>
                  <div className="contact-info-card__content">
                    <h3>{t('contact.hq_title')}</h3>
                    <p>b11,1éer étage, immeuble sci6,<br/>rue du lac toba les berges du lac1053 tunis</p>
                  </div>
                </div>

                {/* Phone Card */}
                <div className="contact-info-card">
                  <div className="contact-info-card__icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                  </div>
                  <div className="contact-info-card__content">
                    <h3>{t('contact.phone_title')}</h3>
                    <p>+216.24.223.121</p>
                    <span className="contact-hours">{t('contact.phone_hours')}</span>
                  </div>
                </div>

                {/* Email Card */}
                <div className="contact-info-card">
                  <div className="contact-info-card__icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                  </div>
                  <div className="contact-info-card__content">
                    <h3>{t('contact.email_title')}</h3>
                    <p>Ismail.sahli@brn-smart.tn<br/>Contact@brn-smart.tn</p>
                  </div>
                </div>
              </div>

              {/* Map Placeholder */}
              <div className="contact-map">
                {/* Decorative map background generated via CSS patterns or background image */}
                <div className="contact-map__bg"></div>
                <div className="contact-map__pin">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                  BRN SMART HQ
                </div>
              </div>

            </div>
          </div>
        </section>
      </main>

      {/* ── Page Footer (matching mockup style) ── */}
      <footer className="contact-page-footer">
        <div className="contact-page-footer__inner">
            <div className="contact-page-footer__col contact-page-footer__brand">
            <img src="/logo.png" alt="BRN SMART" className="contact-page-footer__logo" />
            <p>{t('contact.footer_tagline')}</p>
          </div>

          <div className="contact-page-footer__col">
            <h4>{t('contact.footer_resources')}</h4>
            <span className="contact-footer-link">{t('contact.footer_support')}</span>
            <span className="contact-footer-link">{t('contact.footer_faq')}</span>
          </div>

          <div className="contact-page-footer__col">
            <h4>{t('contact.footer_legal')}</h4>
            <span className="contact-footer-link">{t('contact.footer_privacy')}</span>
            <span className="contact-footer-link">{t('contact.footer_terms')}</span>
          </div>

          <div className="contact-page-footer__col">
            <h4>{t('contact.footer_contact')}</h4>
            <p>1200 Innovation Drive<br/>San Francisco, CA</p>
          </div>
        </div>
        <div className="contact-page-footer__bottom">
          {t('contact.footer_rights')}
        </div>
      </footer>

    </div>
  );
};

export default ContactPage;


