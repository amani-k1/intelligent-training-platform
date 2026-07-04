import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext';
import './DashboardLayout.css';

const DashboardLayout = ({ children, role = 'stagiaire', userId = null }) => {
  const { t } = useTranslation();
  const [sidebarOpen,   setSidebarOpen]   = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const location = useLocation();
  const navigate  = useNavigate();

  const storedUser = (() => {
    try { return JSON.parse(localStorage.getItem('brn_user')) || {}; } catch { return {}; }
  })();

  // Utilise l'id passé en prop, sinon l'id de l'utilisateur connecté
  const uid = userId ?? storedUser?.id ?? null;

  const ROLE_META = {
    stagiaire: { color: '#0a8fa0', label: t('layout.stagiaire.role_label'), icon: '' },
    formateur: { color: '#0a8fa0', label: t('layout.formateur.role_label'), icon: '' },
    admin:     { color: '#0a8fa0', label: t('layout.admin.role_label'),     icon: '' },
  };

  // Préfixes des routes avec l'id utilisateur
  const pf = uid ? `/dashboard/formateur/${uid}` : '/dashboard/formateur';
  const ps = uid ? `/dashboard/stagiaire/${uid}` : '/dashboard/stagiaire';

  const NAV_LINKS = {
    stagiaire: [
      { path: ps,                          icon: <i className="fas fa-th-large" />,       label: t('layout.stagiaire.sidebar_overview') },
      { path: `${ps}/formations`,          icon: <i className="fas fa-book" />,            label: t('layout.stagiaire.sidebar_formations') },
      { path: `${ps}/planning`,            icon: <i className="fas fa-calendar-alt" />,   label: t('layout.stagiaire.sidebar_planning') },
      { path: '/dashboard/notifications',  icon: <i className="fas fa-bell" />,            label: t('layout.stagiaire.sidebar_notifications') },
      { path: `${ps}/profil`,              icon: <i className="fas fa-user-circle" />,    label: t('layout.stagiaire.sidebar_profile') },
    ],
    formateur: [
      { path: pf,                          icon: <i className="fas fa-chart-line" />,          label: t('layout.formateur.sidebar_overview') },
      { path: `${pf}/formations`,          icon: <i className="fas fa-chalkboard-teacher" />,  label: t('layout.formateur.sidebar_formations') },
      { path: `${pf}/stagiaires`,          icon: <i className="fas fa-user-graduate" />,       label: t('layout.formateur.sidebar_students') },
      { path: `${pf}/demandes`,            icon: <i className="fas fa-inbox" />,               label: t('layout.formateur.sidebar_requests') },
      { path: `${pf}/notifications`,       icon: <i className="fas fa-bell" />,                label: t('layout.formateur.sidebar_notifications') },
      { path: `${pf}/profil`,              icon: <i className="fas fa-user-circle" />,         label: t('layout.formateur.sidebar_profile') },
    ],
    admin: [
      { path: '/dashboard/admin',                  icon: <i className="fas fa-laptop-code" />,   label: t('layout.admin.sidebar_overview') },
      { path: '/dashboard/admin/utilisateurs',     icon: <i className="fas fa-users" />,         label: t('layout.admin.sidebar_users') },
      { path: '/dashboard/admin/formations',       icon: <i className="fas fa-graduation-cap" />,label: t('layout.admin.sidebar_formations') },
      { path: '/dashboard/admin/badges',           icon: <i className="fas fa-award" />,         label: t('layout.admin.sidebar_badges') },
      { path: '/dashboard/admin/finance',          icon: <i className="fas fa-wallet" />,        label: t('layout.admin.sidebar_finance') },
      { path: '/dashboard/admin/ia',               icon: <i className="fas fa-robot" />,         label: t('layout.admin.sidebar_ia') },
      { path: '/dashboard/admin/demandes',         icon: <i className="fas fa-user-plus" />,     label: t('layout.admin.sidebar_requests') },
      { path: '/dashboard/admin/profil',           icon: <i className="fas fa-user-shield" />,   label: t('layout.admin.sidebar_profile') },
    ],
  };

  const meta  = ROLE_META[role];
  const links = NAV_LINKS[role];

  // Active : correspondance exacte OU le chemin commence par le lien (sauf l'accueil exact)
  const isActive = (linkPath) => {
    if (location.pathname === linkPath) return true;
    // Pour les sous-pages : `/dashboard/formateur/29/formations/abc` est actif pour `/dashboard/formateur/29/formations`
    if (linkPath !== pf && linkPath !== ps && location.pathname.startsWith(linkPath + '/')) return true;
    return false;
  };

  const handleLogout = () => {
    localStorage.removeItem('brn_user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="db-layout" style={{ '--role-color': meta.color }}>

      {/* ── OVERLAY mobile ── */}
      {mobileNavOpen && (
        <div className="db-sidebar-overlay" onClick={() => setMobileNavOpen(false)} />
      )}

      {/* ── SIDEBAR ── */}
      <aside className={`db-sidebar ${sidebarOpen ? '' : 'db-sidebar--collapsed'} ${mobileNavOpen ? 'db-sidebar--mobile-open' : ''}`}>
        {/* Brand */}
        <div className="db-sidebar__brand">
          <Link to="/" className="db-sidebar__logo">
            <img src="/logo.png" alt="Logo BRN" style={{ width: '120px', height: 'auto', display: 'block' }} />
          </Link>
          <button className="db-sidebar__toggle" onClick={() => setSidebarOpen(v => !v)} aria-label="Toggle sidebar">
            {sidebarOpen ? <i className="fas fa-chevron-left" /> : <i className="fas fa-chevron-right" />}
          </button>
        </div>

        {/* Role badge */}
        {sidebarOpen && (
          <div className="db-sidebar__role">
            <span className="db-sidebar__role-icon">{meta.icon}</span>
            <span className="db-sidebar__role-label">{meta.label}</span>
          </div>
        )}

        {/* Navigation */}
        <nav className="db-sidebar__nav">
          {links.map(link => {
            const active = isActive(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`db-nav-link ${active ? 'db-nav-link--active' : ''}`}
                title={!sidebarOpen ? link.label : ''}
              >
                <span className="db-nav-link__icon">{link.icon}</span>
                {sidebarOpen && <span className="db-nav-link__label">{link.label}</span>}
                {active && sidebarOpen && <span className="db-nav-link__dot" />}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <button className="db-sidebar__logout" onClick={handleLogout} title={t('common.logout')}>
          <span></span>
          {sidebarOpen && <span>{t('common.logout')}</span>}
        </button>
      </aside>

      {/* ── MAIN ── */}
      <div className="db-main">
        {/* Top header */}
        <header className="db-header">
          <div className="db-header__left">
            <button
              className="db-mobile-toggle"
              onClick={() => setMobileNavOpen(v => !v)}
              aria-label="Toggle menu"
            >
              <i className="fas fa-bars" />
            </button>
            <h2 className="db-header__page">
              {links.find(l => isActive(l.path))?.label || 'Dashboard'}
            </h2>
          </div>
          <div className="db-header__right">
            <button className="db-header__notif" title={t('layout.notifications')}>
              <i className="fas fa-bell" />
              <span className="db-header__notif-badge">3</span>
            </button>
            <div className="db-header__user">
              <div className="db-header__avatar" style={{ background: meta.color }}>
                {(storedUser.name || 'U')[0].toUpperCase()}
              </div>
              <span className="db-header__name">{storedUser.name || t('layout.user')}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="db-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
