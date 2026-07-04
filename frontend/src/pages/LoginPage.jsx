import React, { useState } from 'react';
import { useTranslation } from '../context/LanguageContext';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

const getDashboardUrl = (role, userId) => {
  const r = role ? role.toLowerCase().trim() : '';
  if (r === 'admin' || r === 'administrateur') return '/dashboard/admin';
  if (r === 'formateur') return `/dashboard/formateur/${userId}`;
  if (r === 'stagiaire' || r === 'candidat') return `/dashboard/stagiaire/${userId}`;
  return '/';
};

const getRoleMeta = (role) => {
  const r = role ? role.toLowerCase().trim() : '';
  if (r === 'admin' || r === 'administrateur') return { label: 'Administrateur', color: '#6c3fa0', icon: '👑' };
  if (r === 'formateur') return { label: 'Formateur', color: '#27ae60', icon: '👨‍🏫' };
  return { label: 'Stagiaire', color: '#0a8fa0', icon: '🎓' };
};

/* ═══════════════════════════════════════
   MAIN LoginPage
═══════════════════════════════════════ */
const LoginPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null); // { name, role }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // APPEL RÉEL AU BACKEND LARAVEL
      const response = await api.post('auth/login', {
        email: email,
        password: password
      });

      const { user, token } = response.data;

      // Mise à jour AuthContext + localStorage en une seule opération
      login({ ...user, token });
      localStorage.setItem('token', token);

      setSuccess(user);
      setLoading(false);

      // Redirection après 1s
      setTimeout(() => {
        navigate(getDashboardUrl(user.role, user.id));
      }, 1000);

    } catch (err) {
      console.error('Erreur Login BS:', err);
      setError(err.response?.data?.message || t('login.error_invalid'));
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    // URL à configurer dans .env : REACT_APP_GOOGLE_AUTH_URL
    const authUrl = process.env.REACT_APP_GOOGLE_AUTH_URL || '/auth/google';
    if (!authUrl) {
      alert('Google SSO URL non configurée. Configurez REACT_APP_GOOGLE_AUTH_URL.');
      return;
    }

    // Ouvrir la redirection dans la même fenêtre pour OAuth redirect flow
    window.location.href = authUrl;
  };

  return (
    <div className="login-page">
      <main className="login-main">
        {/* ── LEFT PANEL (Image & Branding) ── */}
        <div className="login-left">
          <div className="login-left__overlay"></div>
          <div className="login-left__content">
            <div className="login-brand">
              <h1 className="login-brand__title">BRN SMART</h1>
              <p className="login-brand__subtitle">{t('login.brand_subtitle')}</p>
            </div>

                <div className="login-testimonial">
              <p className="login-testimonial__text">{t('login.testimonial')}</p>
              <div className="login-testimonial__author">
                <img src="/ismail.jpeg" alt="Ismail Sahli" className="login-testimonial__avatar" />
                <div className="login-testimonial__info">
                  <span className="login-testimonial__name">{t('login.testimonial_author')}</span>
                  <span className="login-testimonial__role">{t('login.testimonial_role')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL (Form) ── */}
        <div className="login-right">
          <div className="login-card">
            {success ? (
              <div className="login-success">
                <div className="login-success__icon">{getRoleMeta(success.role).icon || '👤'}</div>
                <h2 className="login-success__title">{t('login.success_title')}</h2>
                <p className="login-success__name">{success.name}</p>
                <p className="login-success__redirect">{t('login.success_redirect')}</p>
              </div>
            ) : (
              <>
                <div className="login-card__header">
                  <img src="/logo.png" alt="Logo" className="login-card__logo" />
                  <p className="login-card__sub">{t('login.welcome_subtitle')}</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                  <div className="login-field">
                    <label className="login-field__label">{t('login.email_label')}</label>
                    <div className="login-field__input-wrapper">
                      <svg className="login-field__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder={t('login.email_placeholder')}
                        required
                        className="login-field__input"
                      />
                    </div>
                  </div>

                  <div className="login-field">
                    <div className="login-field__labelrow">
                      <label className="login-field__label">{t('login.password_label')}</label>
                      <a href="#" className="login-forgot">{t('login.forgot_password')}</a>
                    </div>
                    <div className="login-field__input-wrapper">
                      <svg className="login-field__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                      <input
                        type={showPass ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="login-field__input"
                      />
                      <button type="button" className="login-field__eye" onClick={() => setShowPass(!showPass)}>
                        {showPass ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="login-remember">
                    <input type="checkbox" id="remember" />
                    <label htmlFor="remember">{t('login.remember_me')}</label>
                  </div>

                  {error && <div className="login-error">⚠️ {error}</div>}

                  <button type="submit" className="login-submit" disabled={loading}>
                    {loading ? t('login.logging_in') : t('login.submit')}
                  </button>

                  <div className="login-divider">
                    <span>{t('login.or')}</span>
                  </div>

                  <button type="button" className="login-sso-btn" onClick={handleGoogleSignIn}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                      <path fill="#EA4335" d="M24 9.5c3.9 0 7.2 1.4 9.8 4l7.1-7.1C36.9 2.8 30.8 0 24 0 14.8 0 6.9 5.6 2.4 13.8l8.3 6.4C12.9 14.7 18 9.5 24 9.5z"/>
                      <path fill="#34A853" d="M46.4 24.5c0-1.6-.2-3.1-.6-4.5H24v9h12.3c-.5 2.8-2.2 5.2-4.8 6.8l7.4 5.8C43.5 37.6 46.4 31.5 46.4 24.5z"/>
                      <path fill="#4A90E2" d="M10.7 29.7A14.9 14.9 0 0 1 9.8 24c0-1.5.3-3 1-4.3L2.4 13.8C1 16.7 0 20.2 0 24c0 3.8 1 7.3 2.7 10.2l8-4.5z"/>
                      <path fill="#FBBC05" d="M24 48c6.6 0 12.2-2.2 16.3-6l-7.4-5.8c-2 1.4-4.6 2.2-8.9 2.2-6 0-11.1-4.2-12.7-9.9L2.7 34.2C6.9 42.4 14.8 48 24 48z"/>
                    </svg>
                    {t('login.sso')}
                  </button>

                  <p className="login-signup-link">
                    {t('login.no_account')} <Link to="/signup">{t('login.create_account')}</Link>
                  </p>
                </form>
              </>
            )}
          </div>

          {/* Footer Links */}
          <footer className="login-footer">
            <div className="login-footer__left">
              © 2026 BRN SMART Professional Training. All rights reserved.
            </div>
            <div className="login-footer__right">
              <Link to="/privacy">Privacy Policy</Link>
              <Link to="/terms">Terms of Service</Link>
              <Link to="/support">Support</Link>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;


