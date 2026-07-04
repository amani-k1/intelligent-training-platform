import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';
import './Navbar.css';

const DOMAINES_NAV = [
  { id: 'Informatique', label: 'Informatique & Tech' },
  { id: 'Finance',      label: 'Finance'             },
  { id: 'Management',   label: 'Management'          },
  { id: 'Marketing',    label: 'Marketing'           },
  { id: 'Data Science', label: 'Data Science'        },
  { id: 'Soft Skills',  label: 'Soft Skills'         },
  { id: 'Langues',      label: 'Langues'             },
];

const Navbar = () => {
  const { t } = useTranslation();
  const [scrolled,      setScrolled]      = useState(false);
  const [dropdownOpen,  setDropdownOpen]  = useState(false);
  const [mobileOpen,    setMobileOpen]    = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Ferme le menu mobile à chaque navigation
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const isFormateursActive = location.pathname === '/formateurs';

  return (
    <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>

      <Link to="/" className="navbar-logo">
        <img src="/logo.png" alt="Logo BRN" className="navbar__logo-img" style={{ width: '140px', height: 'auto' }} />
      </Link>

      {/* ── Desktop links ── */}
      <ul className="navbar__links">
        <li><Link to="/" className={location.pathname === '/' ? 'active' : ''}>{t('navbar.home')}</Link></li>
        <li><a href="/#about">{t('navbar.why')}</a></li>
        <li><a href="/#formations">{t('navbar.catalog')}</a></li>

        <li
          className="navbar__dropdown-wrapper"
          onMouseEnter={() => setDropdownOpen(true)}
          onMouseLeave={() => setDropdownOpen(false)}
        >
          <Link
            to="/formateurs"
            className={isFormateursActive ? 'active navbar__dropdown-trigger' : 'navbar__dropdown-trigger'}
          >
            {t('navbar.formateurs')} <span className="navbar__dropdown-arrow">▾</span>
          </Link>
          <div className={`navbar__dropdown ${dropdownOpen ? 'navbar__dropdown--open' : ''}`}>
            <div className="navbar__dropdown-inner">
              <Link to="/formateurs" className="navbar__dropdown-all">Tous les formateurs</Link>
              <div className="navbar__dropdown-divider" />
              {DOMAINES_NAV.map(d => (
                <Link
                  key={d.id}
                  to={`/formateurs?domaine=${encodeURIComponent(d.id)}`}
                  className="navbar__dropdown-item"
                  onClick={() => setDropdownOpen(false)}
                >{d.label}</Link>
              ))}
            </div>
          </div>
        </li>

        <li><Link to="/contact" className={location.pathname === '/contact' ? 'active' : ''}>{t('navbar.contact')}</Link></li>
      </ul>

      <div className="navbar__actions">
        <Link to="/login"  className="btn-outline navbar__login">{t('navbar.login')}</Link>
        <Link to="/signup" className="btn-primary navbar__signup">{t('navbar.signup')}</Link>
        <LanguageSwitcher />
      </div>

      {/* ── Hamburger button (mobile only) ── */}
      <button
        className={`navbar__hamburger ${mobileOpen ? 'navbar__hamburger--open' : ''}`}
        onClick={() => setMobileOpen(v => !v)}
        aria-label="Menu"
      >
        <span /><span /><span />
      </button>

      {/* ── Mobile drawer ── */}
      {mobileOpen && (
        <div className="navbar__mobile-menu">
          <Link to="/"          className="navbar__mobile-link" onClick={() => setMobileOpen(false)}>{t('navbar.home')}</Link>
          <a    href="/#about"  className="navbar__mobile-link" onClick={() => setMobileOpen(false)}>{t('navbar.why')}</a>
          <a    href="/#formations" className="navbar__mobile-link" onClick={() => setMobileOpen(false)}>{t('navbar.catalog')}</a>
          <Link to="/formateurs"    className="navbar__mobile-link" onClick={() => setMobileOpen(false)}>{t('navbar.formateurs')}</Link>
          <Link to="/contact"       className="navbar__mobile-link" onClick={() => setMobileOpen(false)}>{t('navbar.contact')}</Link>
          <div className="navbar__mobile-divider" />
          <Link to="/login"  className="navbar__mobile-link navbar__mobile-link--outline" onClick={() => setMobileOpen(false)}>{t('navbar.login')}</Link>
          <Link to="/signup" className="navbar__mobile-link navbar__mobile-link--primary" onClick={() => setMobileOpen(false)}>{t('navbar.signup')}</Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
