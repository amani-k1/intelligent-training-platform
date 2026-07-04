import React, { useState, useEffect } from 'react';
import { useTranslation } from '../context/LanguageContext';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import CourseFilters from '../components/CourseFilters';
import './HomePage.css';
import { fetchTouteFormations } from '../services/Formationservice';

const HomePage = () => {
  const { t } = useTranslation();

  // Commence vide — uniquement des données réelles de la BD
  const [formationsList, setFormationsList] = useState([]);
  const [isLoadingFormations, setIsLoadingFormations] = useState(true);
  const [formationsError, setFormationsError] = useState(null);

  // 🔄 FETCH formations from API (NEW)
  useEffect(() => {
    const loadFormations = async () => {
      try {
        setIsLoadingFormations(true);
        const data = await fetchTouteFormations();
        
        // Transform BD data to match UI format
        const transformedFormations = (Array.isArray(data) ? data : data.data || [])
          .map((f, index) => {
            // Map domain to category
            const domainToCategory = {
              'Informatique':           'IT & Software',
              'Intelligence Artificielle': 'IT & Software',
              'Data Science':           'IT & Software',
              'Développement Web':      'IT & Software',
              'Cybersécurité':          'IT & Software',
              'Cloud et DevOps':        'IT & Software',
              'Technologie':            'IT & Software',
              'Bases de Données':       'IT & Software',
              'Management':             'Management',
              'Design':                 'Design',
              'Finance':                'Finance',
              'Bureautique':            'Soft Skills',
              'Soft Skills':            'Soft Skills',
            };

            const domainToImage = {
              'Informatique':              'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=500&q=80',
              'Intelligence Artificielle': 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=500&q=80',
              'Data Science':              'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500&q=80',
              'Développement Web':         'https://images.unsplash.com/photo-1547658719-da2b51169166?w=500&q=80',
              'Cybersécurité':             'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=500&q=80',
              'Cloud et DevOps':           'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=500&q=80',
              'Management':                'https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&q=80',
              'Design':                    'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=500&q=80',
              'Finance':                   'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=500&q=80',
              'Marketing':                 'https://images.unsplash.com/photo-1533750349088-cd871a92f312?w=500&q=80',
              'Bureautique':               'https://images.unsplash.com/photo-1588702547919-26089e690ecc?w=500&q=80',
              'Bases de Données':          'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=500&q=80',
              'Technologie':               'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&q=80',
              'Soft Skills':               'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=500&q=80',
            };

            return {
              id: f.id,
              cat: domainToCategory[f.domaine] || f.domaine || 'IT & Software',
              domain: f.domaine || 'IT & Software',
              nom_formateur: f.nom_formateur || '',
              title: f.title,
              duration: f.duree ? `${f.duree} Hours` : '20 Hours',
              students: `${(Math.random() * 3000 + 500).toFixed(0)} Students`,
              desc: f.description || 'Professional training course',
              image: domainToImage[f.domaine] || 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=500&q=80',
              color: ['#0a8fa0', '#27ae60', '#9b59b6', '#e67e22'][index % 4]
            };
          });
        
        if (transformedFormations.length > 0) {
          setFormationsList(transformedFormations);
          localStorage.setItem('brn_formations', JSON.stringify(transformedFormations));
        }
      } catch (err) {
        console.error('Erreur chargement formations:', err);
        setFormationsError('Impossible de charger les formations. Vérifiez que le backend est démarré.');
        setFormationsList([]);
      } finally {
        setIsLoadingFormations(false);
      }
    };
    
    loadFormations();
  }, []);

  const [activeCat, setActiveCat] = useState('All Courses');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState(null);
  const [aiSuggestions, setAiSuggestions] = useState([]);

  const handleAISearch = async (e) => {
    // Only trigger on Enter key or button click
    if (e.type === 'click' || (e.type === 'keydown' && e.key === 'Enter')) {
      if (!searchQuery.trim()) {
        setAiMessage(null);
        return;
      }
      setAiLoading(true);
      setAiMessage(null);
      setAiSuggestions([]);
      try {
        const res = await fetch('http://localhost/api/app/rechercher', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ recherche: searchQuery })
        });
        const data = await res.json();

        const originalQuery = searchQuery;
        const suggestions = (data.formations_proches || []).filter(f => f.similarite >= 0.50);
        if (data.existe) {
          setSearchQuery('');
          setAiMessage({ type: 'success', text: t('home.ai_found', { formation: data.formation_proche, pct: Math.round(data.similarite * 100) }) });
          setAiSuggestions(suggestions);
        } else {
          setSearchQuery('');
          setAiMessage({ type: 'info', text: t('home.ai_not_found', { query: originalQuery }) });
          setAiSuggestions(suggestions);
        }
      } catch (err) {
        console.error("Erreur IA:", err);
        setAiMessage({ type: 'error', text: t('home.ai_error') });
      } finally {
        setAiLoading(false);
      }
    }
  };

  // Logique de filtrage sécurisée
  const filteredFormations = formationsList.filter(f => {
    const cat = f.cat || '';
    const title = f.title || '';
    const desc = f.desc || '';
    
    const matchesCat = activeCat === 'All Courses' || cat.toLowerCase() === activeCat.toLowerCase();
    const formateur = (f.nom_formateur || '').toLowerCase();
    const matchesSearch = !searchQuery.trim() ||
                          title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          formateur.includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const totalPages = Math.ceil(filteredFormations.length / ITEMS_PER_PAGE);
  const paginatedFormations = filteredFormations.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const getPageNumbers = () => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (currentPage <= 3) return [1, 2, 3, '...', totalPages];
    if (currentPage >= totalPages - 2) return [1, '...', totalPages - 2, totalPages - 1, totalPages];
    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  };

  return (
    <div className="home">
      <Navbar logo="/logo.png" />

      {/* ── HERO ── */}
      <section className="hero">
        <div className="hero__content">
          <div className="hero__heading">
            <p className="hero__learning">LEARNING</p>
            <h1 className="hero__management">MANAGEMENT</h1>
            <h1 className="hero__system">SYSTEM</h1>
          </div>
          <p className="hero__tagline">
            "{t('home.hero_tagline')}"
          </p>
          <div className="hero__cta">
            <Link to="/signup" className="btn-primary hero__btn">{t('home.hero_signup')}</Link>
            <a href="#about" className="btn-outline hero__btn">{t('home.hero_learn_more')}</a>
          </div>
        </div>

        <div className="hero__visual">
          <div className="hero__circle">
            <img
              src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=500&q=80"
              alt="Professional"
              className="hero__photo"
            />
          </div>
          <div className="hero__badge hero__badge--1">
            <span className="hero__badge-icon">🎓</span>
            <div>
              <div className="hero__badge-num">200+</div>
              <div className="hero__badge-label">{t('home.badge_formations')}</div>
            </div>
          </div>
          <div className="hero__badge hero__badge--2">
            <span className="hero__badge-icon"></span>
            <div>
              <div className="hero__badge-num">50+</div>
              <div className="hero__badge-label">{t('home.badge_formateurs')}</div>
            </div>
          </div>
          <div className="hero__badge hero__badge--3">
            <span className="hero__badge-icon"></span>
            <div>
              <div className="hero__badge-num">98%</div>
              <div className="hero__badge-label">{t('home.badge_satisfaction')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="features" id="about">
        <div className="features__header">
          <h2 className="features__title">{t('home.why_title')} <span>BRN SMART</span> ?</h2>
          <p className="features__sub">{t('home.why_sub')}</p>
        </div>
        <div className="features__grid">
          {[
            { icon: '', title: t('home.feature1_title'), desc: t('home.feature1_desc') },
            { icon: '', title: t('home.feature2_title'), desc: t('home.feature2_desc') },
            { icon: '', title: t('home.feature3_title'), desc: t('home.feature3_desc') },
            { icon: '', title: t('home.feature4_title'), desc: t('home.feature4_desc') },
          ].map((f, i) => (
            <div className="feature-card" key={i}>
              <div className="feature-card__icon">{f.icon}</div>
              <h3 className="feature-card__title">{f.title}</h3>
              <p className="feature-card__desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>


      {/* ── FORMATIONS CATALOG ── */}
      <section className="catalog-section" id="formations">
        <div className="catalog-header">
          <h2 className="catalog-title">{t('home.catalog_title')}</h2>
          <p className="catalog-subtitle">{t('home.catalog_sub')}</p>
        </div>

        <div className="catalog-controls">
          <div className="catalog-search-wrapper">
            <label className="catalog-label">{t('home.search_label')}</label>
            <div className="catalog-search">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="search-icon"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input
                type="text"
                placeholder={t('home.search_placeholder')}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setAiMessage(null);
                }}
                onKeyDown={handleAISearch}
              />
              <button
                className="ai-search-btn"
                onClick={handleAISearch}
                disabled={aiLoading}
              >
                {aiLoading ? t('home.ai_searching') : t('home.ai_search_btn')}
              </button>
            </div>
            {aiMessage && (
              <div className={`ai-message ${aiMessage.type}`}>
                {aiMessage.text}
                {aiSuggestions.length > 0 && (
                  <div className="ai-suggestions">
                    {aiSuggestions.map((s, i) => (
                      <button
                        key={i}
                        className={`ai-suggestion-chip ${i === 0 ? 'ai-suggestion-best' : ''}`}
                        onClick={() => { setSearchQuery(s.titre); setAiSuggestions([]); setAiMessage(null); }}
                      >
                        {i === 0 && <span className="ai-best-star">★ </span>}
                        {s.titre} <span className="ai-suggestion-score">{Math.round(s.similarite * 100)}%</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="catalog-filters-wrapper">
            <label className="catalog-label">{t('home.filter_label')}</label>
            <div className="catalog-filters">
              {[
                { key: 'All Courses',  label: t('home.all_courses') },
                { key: 'IT & Software', label: 'IT & Software' },
                { key: 'Management',   label: 'Management' },
                { key: 'Finance',      label: 'Finance' },
                { key: 'Soft Skills',  label: 'Soft Skills' },
              ].map(cat => (
                <button
                  key={cat.key}
                  className={`catalog-filter-btn ${activeCat === cat.key ? 'active' : ''}`}
                  onClick={() => { setActiveCat(cat.key); setCurrentPage(1); }}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="catalog-showing">
          <span>{t('home.showing')}</span>
          <div className="catalog-tag">
            {activeCat === 'All Courses' ? t('home.all_categories') : activeCat}
            <span className="catalog-tag-close" onClick={() => { setActiveCat('All Courses'); setCurrentPage(1); }}>×</span>
          </div>
        </div>

        <div className="catalog-grid">
          {isLoadingFormations ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem' }}>
              <p>📚 {t('home.loading_catalog')}</p>
            </div>
          ) : paginatedFormations.length > 0 ? (
            paginatedFormations.map((f) => {
            const isLogged = !!localStorage.getItem('brn_user');
            const targetLink = isLogged ? `/formations/register/${f.id}` : "/signup";

            return (
              <div className="catalog-card" key={f.id}>
                <div className="catalog-card__image-container">
                  <img src={f.image} alt={f.title} className="catalog-card__image" />
                  <span className="catalog-card__badge">{f.domain}</span>
                </div>
                <div className="catalog-card__body">
                  <div className="catalog-card__meta">
                    <span className="meta-item">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                      {f.duration}
                    </span>
                    <span className="meta-item">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                      {f.students}
                    </span>
                  </div>
                  <h3 className="catalog-card__title">{f.title}</h3>
                  <p className="catalog-card__desc">{f.desc}</p>
                  <div className="catalog-card__actions">
                    <Link to={targetLink} className="catalog-btn catalog-btn--primary">{t('home.enroll_now')}</Link>
                    <Link to={`/formations/details/${f.id}`} className="catalog-btn catalog-btn--outline">{t('home.details_btn')}</Link>
                  </div>
                </div>
              </div>
            );
          })
          ) : (
            <div style={{ gridColumn: '1/-1' }}>
              <div className="no-results" style={{ textAlign: 'center', padding: '3rem' }}>
                <p style={{ fontSize: '1.5rem', color: 'var(--text-muted)' }}>{t('home.no_results')} 🔍</p>
              </div>
            </div>
          )}
        </div>

        {!isLoadingFormations && formationsError && formationsList.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', background: '#fff8f0', borderRadius: '12px', margin: '1rem 0', border: '1px solid #fde8cc' }}>
            <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔌</p>
            <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#c0392b' }}>{t('common.backend_unavailable')}</p>
            <p style={{ fontSize: '0.9rem', color: '#888', marginTop: '0.5rem' }}>{t('common.backend_hint')}</p>
          </div>
        )}

        {!isLoadingFormations && !formationsError && filteredFormations.length === 0 && (
          <div className="no-results" style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ fontSize: '1.5rem', color: 'var(--text-muted)' }}>{t('home.no_results')} 🔍</p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="catalog-pagination">
            <button className="page-btn page-arrow" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>&lt;</button>
            {getPageNumbers().map((p, i) =>
              p === '...'
                ? <span key={`dots-${i}`} className="page-dots">...</span>
                : <button key={p} className={`page-btn ${currentPage === p ? 'active' : ''}`} onClick={() => handlePageChange(p)}>{p}</button>
            )}
            <button className="page-btn page-arrow" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>&gt;</button>
          </div>
        )}
      </section>

      {/* ── FOOTER ── */}
      <footer className="footer" id="contact">
        <div className="footer__inner">
          <div className="footer__brand">
            <img src="/logo.png" alt="BRN SMART" className="footer__logo-img" />
            <p>{t('home.footer_tagline')}</p>
          </div>
          <div className="footer__links">
            <h4>{t('home.footer_nav')}</h4>
            <ul>
              <li><a href="#about">{t('home.footer_about')}</a></li>
              <li><a href="#formations">{t('home.footer_courses')}</a></li>
              <li><Link to="/signup">{t('home.footer_signup')}</Link></li>
              <li><Link to="/login">{t('home.footer_login')}</Link></li>
            </ul>
          </div>
          <div className="footer__contact">
            <h4>Contact</h4>
            <p>📧 contact@brn-smart.dz</p>
            <p>📞 +216.24.223.121</p>
            <p>b11,1éer étage, immeuble sci6,rue du lac toba les berges du lac1053 tunis</p>
          </div>
        </div>
        <div className="footer__bottom">
          <p>{t('home.footer_rights')}</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;


