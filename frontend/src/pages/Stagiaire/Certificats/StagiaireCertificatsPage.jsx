import React, { useState } from 'react';
import { useTranslation } from '../../../context/LanguageContext';
import './StagiaireCertificatsPage.css';
import { MOCK_CERTIFICATS, MOCK_BADGES, MOCK_PROGRESSION } from './certificatsMockData';

const StagiaireCertificatsPage = () => {
  const { t } = useTranslation();
  // ─── ETATS ──────────────────────────────────────────────────────────
  const [filterType, setFilterType] = useState('all'); // 'all', 'certificat', 'badge'
  const [filterFormation, setFilterFormation] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState(null); // Pour la modale

  // ─── FILTRES ────────────────────────────────────────────────────────
  const allItems = [...MOCK_CERTIFICATS, ...MOCK_BADGES];

  const filteredItems = allItems.filter(item => {
    const matchType = filterType === 'all' || item.type === filterType;
    const matchForm = filterFormation === 'all' || item.formation === filterFormation;
    const matchSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        item.formation.toLowerCase().includes(searchTerm.toLowerCase());
    return matchType && matchForm && matchSearch;
  });

  const certificatsToDisplay = filteredItems.filter(i => i.type === 'certificat');
  const badgesToDisplay = filteredItems.filter(i => i.type === 'badge');

  // Formations uniques pour le select
  const uniqueFormations = [...new Set(allItems.map(i => i.formation))];

  // Statistiques globales
  const avgScore = MOCK_CERTIFICATS.reduce((acc, curr) => acc + parseInt(curr.score), 0) / (MOCK_CERTIFICATS.length || 1);

  // ─── ACTIONS ────────────────────────────────────────────────────────
  const handleDownloadCSV = () => {
    let csv = "ID,Type,Titre,Formation,Date,Score\n";
    filteredItems.forEach(i => {
      csv += `"${i.id}","${i.type}","${i.title}","${i.formation}","${i.date}","${i.score || 'N/A'}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'mes_certificats.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleActionClick = (e, actionMsg) => {
    e.stopPropagation();
    alert(actionMsg);
  };

  return (
    <div className="sc-page">
      {/* ── HEADER & STATS ── */}
      <div className="sc-header">
        <div className="sc-header-top">
          <div className="sc-header-left">
            <h1>{t('common.my_certs_badges')}</h1>
            <p>{t('common.valorize_skills')}</p>
          </div>
          <div className="sc-kpis">
            <div className="sc-kpi">
              <span className="sc-kpi-val">{MOCK_CERTIFICATS.length}</span>
              <span className="sc-kpi-lbl">Certificats</span>
            </div>
            <div className="sc-kpi">
              <span className="sc-kpi-val">{MOCK_BADGES.length}</span>
              <span className="sc-kpi-lbl">Badges</span>
            </div>
            <div className="sc-kpi">
              <span className="sc-kpi-val">{Math.round(avgScore)}%</span>
              <span className="sc-kpi-lbl">Score Moyen</span>
            </div>
            <div className="sc-kpi">
              <span className="sc-kpi-val">95%</span>
              <span className="sc-kpi-lbl">Taux de réussite</span>
            </div>
          </div>
        </div>

        {/* ── BARRE DE PROGRESSION ── */}
        <div className="sc-progress-widget">
          <div className="sc-pw-top">
            <div className="sc-pw-info">
              <h3>Prochain Certificat : {MOCK_PROGRESSION.formation}</h3>
              <p>Étape actuelle : {MOCK_PROGRESSION.nextMilestone} — Restant: {MOCK_PROGRESSION.timeLeft}</p>
            </div>
            <div className="sc-pw-percent">{MOCK_PROGRESSION.progress}%</div>
          </div>
          <div className="sc-pw-bar-bg">
            <div className="sc-pw-bar-fill" style={{ width: `${MOCK_PROGRESSION.progress}%` }}></div>
          </div>
        </div>
      </div>

      {/* ── TOOLBAR (FILTRES) ── */}
      <div className="sc-toolbar">
        <div className="sc-filters">
          <select className="sc-select" value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="all">{t('common.all_achievements')}</option>
            <option value="certificat">{t('common.certificates')} 🏆</option>
            <option value="badge">{t('common.badges')} 🌟</option>
          </select>

          <select className="sc-select" value={filterFormation} onChange={e => setFilterFormation(e.target.value)}>
            <option value="all">Toutes les formations</option>
            {uniqueFormations.map(f => <option key={f} value={f}>{f}</option>)}
          </select>

          <input 
            type="text" 
            className="sc-search" 
            placeholder="Rechercher (ex: React, SEO...)" 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="sc-btn" onClick={handleDownloadCSV}>
          ⬇️ {t('common.export_csv')}
        </button>
      </div>

      {/* ── GRILLES ── */}
      
      {/* SECTION CERTIFICATS */}
      {certificatsToDisplay.length > 0 && (
        <div className="sc-section">
          <h2 style={{ color: '#0f172a', marginBottom: '1.5rem' }}>{t('common.certificates')} ({certificatsToDisplay.length})</h2>
          <div className="sc-grid">
            {certificatsToDisplay.map(cert => (
              <div key={cert.id} className="sc-cert-card" onClick={() => setSelectedItem(cert)}>
                <div className="sc-cert-header">
                  <div className="sc-cert-icon">{cert.icon}</div>
                  <h3 className="sc-cert-title">{cert.title}</h3>
                  <span className="sc-cert-formation">{cert.formation}</span>
                </div>
                <div className="sc-cert-body">
                  <div className="sc-cert-meta">
                    <div className="sc-meta-item">
                      <span className="sc-meta-lbl">Obtenu le</span>
                      <span className="sc-meta-val">{new Date(cert.date).toLocaleDateString('fr-FR')}</span>
                    </div>
                    <div className="sc-meta-item" style={{ alignItems: 'flex-end' }}>
                      <span className="sc-meta-lbl">Score</span>
                      <span className="sc-meta-val" style={{ color: '#10b981' }}>{cert.score}</span>
                    </div>
                  </div>
                  <div className="sc-cert-skills">
                    {cert.skills?.map(skill => <span key={skill} className="sc-skill">{skill}</span>)}
                  </div>
                </div>
                <div className="sc-cert-footer">
                  <button className="sc-action-btn sc-btn-dl" onClick={(e) => handleActionClick(e, 'Téléchargement du PDF en cours...')}>
                    ⬇️ PDF
                  </button>
                  <button className="sc-action-btn sc-btn-share" onClick={(e) => handleActionClick(e, 'Lien copié dans le presse-papier !')}>
                    🔗 Partager
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION BADGES */}
      {badgesToDisplay.length > 0 && (
        <div className="sc-section" style={{ marginTop: '2rem' }}>
          <h2 style={{ color: '#0f172a', marginBottom: '1.5rem' }}>{t('common.skill_badges')} ({badgesToDisplay.length})</h2>
          <div className="sc-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))' }}>
            {badgesToDisplay.map(badge => (
              <div key={badge.id} className="sc-badge-card" style={{ '--badge-bg': `${badge.color}15` }} onClick={() => setSelectedItem(badge)}>
                <div className="sc-badge-icon" style={{ color: badge.color }}>{badge.icon}</div>
                <div className="sc-badge-info">
                  <h4 className="sc-badge-title">{badge.title}</h4>
                  <span className="sc-badge-date">{badge.formation} • {new Date(badge.date).toLocaleDateString('fr-FR')}</span>
                  <p className="sc-badge-desc">{badge.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {filteredItems.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>
          <h3>{t('common.no_achievement')}</h3>
          <p>{t('common.adjust_filters')}</p>
        </div>
      )}

      {/* ── MODALE PLEIN ECRAN (Certificat/Badge) ── */}
      {selectedItem && (
        <div className="sc-overlay" onClick={(e) => { if (e.target === e.currentTarget) setSelectedItem(null) }}>
          <div className="sc-modal">
            <div className="sc-modal-header">
              <h2>{selectedItem.type === 'certificat' ? t('common.cert_preview') : t('common.badge_detail')}</h2>
              <button className="sc-modal-close" onClick={() => setSelectedItem(null)}>✕</button>
            </div>
            
            <div className="sc-modal-body">
              {/* Fake Certificate / Badge Image */}
              <div className="sc-cert-preview">
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>{selectedItem.icon}</div>
                <div className="sc-cp-title">{selectedItem.title}</div>
                <div className="sc-cp-sub">{selectedItem.formation}</div>
                <div style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Décerné à</div>
                <div className="sc-cp-name">Utilisateur BRN SMART</div>
                <div className="sc-cp-date">Fait le {new Date(selectedItem.date).toLocaleDateString('fr-FR')}</div>
              </div>

              <div className="sc-modal-social">
                <button className="sc-social-btn linkedin" onClick={() => alert('Redirection vers LinkedIn...')}>
                  {t('common.share_linkedin')}
                </button>
                <button className="sc-social-btn twitter" onClick={() => alert('Redirection vers Twitter...')}>
                  {t('common.share_twitter')}
                </button>
                {selectedItem.verified && (
                  <button className="sc-social-btn verify" onClick={() => alert('Vérification blockchain: Valide ✅')}>
                    {t('common.verify_authenticity')}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default StagiaireCertificatsPage;


