import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import './StagiaireProfilPage.css';

const MOCK_USER = {
  firstName: 'Jean',
  lastName: 'Dupont',
  email: 'jean.dupont@example.com',
  phone: '+33 6 12 34 56 78',
  dob: '1995-05-15',
  avatar: null,
  emailVerified: true,
  phoneVerified: false,
};

const MOCK_ACTIVITY = [
  { id: 1, date: 'Aujourd\'hui, 10:30', desc: 'Connexion depuis Paris, FR' },
  { id: 2, date: 'Hier, 15:45', desc: 'A complété le Quiz "Introduction au Machine Learning"' },
  { id: 3, date: '04 Mai 2026, 09:00', desc: 'A rejoint la session Live "React Hooks"' },
  { id: 4, date: '01 Mai 2026, 14:20', desc: 'A téléchargé le certificat "Fondamentaux du Web"' },
];

const MOCK_DEVICES = [
  { id: 'd1', os: 'Windows 11', browser: 'Chrome', location: 'Paris, FR', current: true },
  { id: 'd2', os: 'iPhone 13', browser: 'Safari', location: 'Lyon, FR', current: false },
];

const generateHeatmapData = () => {
  const data = [];
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - (365 - i));
    // Random activity level 0-4
    const level = Math.random() > 0.6 ? Math.floor(Math.random() * 4) + 1 : 0;
    data.push({ date: d.toISOString().split('T')[0], level });
  }
  return data;
};

const StagiaireProfilPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('infos'); // 'infos', 'securite', 'preferences', 'historique'
  const [focusMode, setFocusMode] = useState(false);
  const [profileProgress, setProfileProgress] = useState(85);
  
  // States - Infos
  const [userInfo, setUserInfo] = useState(MOCK_USER);
  const [showCropModal, setShowCropModal] = useState(false);
  
  // States - Sécurité
  const [passwords, setPasswords] = useState({ old: '', new: '', confirm: '' });
  const [twoFactor, setTwoFactor] = useState(false);
  const [devices, setDevices] = useState(MOCK_DEVICES);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // States - Préférences
  const [notifs, setNotifs] = useState({ email: true, push: false, promo: false });
  const [theme, setTheme] = useState('light');
  const [lang, setLang] = useState('fr');
  const [visibility, setVisibility] = useState('private');

  // States - Social & Objectifs
  const [social, setSocial] = useState({ linkedin: false, github: false });
  const [tags, setTags] = useState(['Certification Python', 'Devenir Expert IA']);
  const [newTag, setNewTag] = useState('');

  // States - Heatmap
  const [heatmapData, setHeatmapData] = useState([]);

  useEffect(() => {
    setHeatmapData(generateHeatmapData());
  }, []);

  // ─── HANDLERS ───
  const handleInfoChange = (e) => {
    const { name, value } = e.target;
    setUserInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveInfos = (e) => {
    e.preventDefault();
    alert("Vos informations ont été mises à jour avec succès !");
    if (focusMode) setFocusMode(false);
  };

  const handlePasswordChange = (e) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      alert("Le nouveau mot de passe et la confirmation ne correspondent pas.");
      return;
    }
    alert("Mot de passe mis à jour avec succès !");
    setPasswords({ old: '', new: '', confirm: '' });
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleLinkSocial = (network) => {
    setSocial({ ...social, [network]: true });
    setProfileProgress(100);
    alert(`Compte ${network} lié avec succès !`);
  };

  const handleRevokeDevice = (id) => {
    setDevices(devices.filter(d => d.id !== id));
  };

  const handlePushRequest = () => {
    alert("Demande d'autorisation système pour les notifications Push envoyée...");
    setNotifs({ ...notifs, push: true });
  };

  const handleCloudBackup = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ userInfo, notifs, tags, social }));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", "sauvegarde_profil_brn-smart.json");
    dlAnchorElem.click();
  };

  const handleDeleteAccount = () => {
    alert("Simulation : Votre compte a été supprimé. Redirection...");
    navigate('/');
  };

  // ─── RENDERS DES ONGLETS ───

  const renderInfos = () => (
    <div className="sprofil-card">
      <div className="sprofil-card-header">
        <div>
          <h2>Informations Personnelles</h2>
          <p>Gérez vos informations de base et votre photo de profil.</p>
        </div>
        <button className="sprofil-btn icon" title="Mode Focus" onClick={() => setFocusMode(!focusMode)}>
          {focusMode ? '↙️' : '↗️'}
        </button>
      </div>

      <div className="sprofil-avatar-section">
        <div className="sprofil-avatar-preview" onClick={() => setShowCropModal(true)}>
          {userInfo.firstName[0]}{userInfo.lastName[0]}
        </div>
        <div className="sprofil-avatar-actions">
          <button className="sprofil-btn" onClick={() => setShowCropModal(true)}>{t('common.change_photo')}</button>
          <span className="sprofil-avatar-hint">JPG, GIF ou PNG. Max 2Mo.</span>
        </div>
      </div>

      <form onSubmit={handleSaveInfos} className="sprofil-form-grid">
        <div className="sprofil-form-group">
          <label className="sprofil-label">Prénom</label>
          <input type="text" className="sprofil-input" name="firstName" value={userInfo.firstName} onChange={handleInfoChange} required />
        </div>
        <div className="sprofil-form-group">
          <label className="sprofil-label">Nom</label>
          <input type="text" className="sprofil-input" name="lastName" value={userInfo.lastName} onChange={handleInfoChange} required />
        </div>
        <div className="sprofil-form-group full">
          <label className="sprofil-label">
            Adresse Email
            {userInfo.emailVerified ? <span className="sprofil-verify-badge">✅ Vérifié</span> : <button type="button" className="sprofil-verify-btn">Vérifier maintenant</button>}
          </label>
          <input type="email" className="sprofil-input" name="email" value={userInfo.email} onChange={handleInfoChange} required />
        </div>
        <div className="sprofil-form-group">
          <label className="sprofil-label">
            Téléphone
            {userInfo.phoneVerified ? <span className="sprofil-verify-badge">✅ Vérifié</span> : <button type="button" className="sprofil-verify-btn" onClick={() => setUserInfo({...userInfo, phoneVerified: true})}>Vérifier</button>}
          </label>
          <input type="tel" className="sprofil-input" name="phone" value={userInfo.phone} onChange={handleInfoChange} />
        </div>
        <div className="sprofil-form-group">
          <label className="sprofil-label">Date de Naissance</label>
          <input type="date" className="sprofil-input" name="dob" value={userInfo.dob} onChange={handleInfoChange} />
        </div>
        
        <button type="submit" className="sprofil-btn primary action">{t('common.save_changes')}</button>
      </form>
    </div>
  );

  const renderSecurite = () => (
    <>
      <div className="sprofil-card">
        <div className="sprofil-card-header">
          <h2>Sécurité du Compte</h2>
          <p>Assurez-vous que votre compte utilise un mot de passe robuste.</p>
        </div>
        <form onSubmit={handlePasswordChange} className="sprofil-form-grid" style={{ marginBottom: '2rem' }}>
          <div className="sprofil-form-group full">
            <label className="sprofil-label">Mot de passe actuel</label>
            <input type="password" className="sprofil-input" value={passwords.old} onChange={e => setPasswords({...passwords, old: e.target.value})} required />
          </div>
          <div className="sprofil-form-group">
            <label className="sprofil-label">Nouveau mot de passe</label>
            <input type="password" className="sprofil-input" value={passwords.new} onChange={e => setPasswords({...passwords, new: e.target.value})} required minLength={8} />
          </div>
          <div className="sprofil-form-group">
            <label className="sprofil-label">Confirmer le mot de passe</label>
            <input type="password" className="sprofil-input" value={passwords.confirm} onChange={e => setPasswords({...passwords, confirm: e.target.value})} required />
          </div>
          <button type="submit" className="sprofil-btn primary action">{t('common.update_password')}</button>
        </form>

        <div className="sprofil-setting-row" style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1.5rem' }}>
          <div className="sprofil-setting-info">
            <h4>Authentification à Deux Facteurs (2FA)</h4>
            <p>Ajoute une couche de sécurité supplémentaire à votre compte.</p>
          </div>
          <div className={`sprofil-toggle ${twoFactor ? 'active' : ''}`} onClick={() => setTwoFactor(!twoFactor)}></div>
        </div>
      </div>

      <div className="sprofil-card">
        <div className="sprofil-card-header">
          <h2>Appareils Connectés</h2>
          <p>Gérez les sessions actives sur vos différents appareils.</p>
        </div>
        <div>
          {devices.map(dev => (
            <div key={dev.id} className="sprofil-device">
              <div className="sprofil-dev-info">
                <div className="sprofil-dev-icon">{dev.os.includes('Windows') ? '💻' : '📱'}</div>
                <div className="sprofil-dev-text">
                  <h5>{dev.os} — {dev.browser} {dev.current && <span style={{color:'#10b981', fontSize:'0.75rem'}}>(Actuel)</span>}</h5>
                  <p>{dev.location}</p>
                </div>
              </div>
              {!dev.current && (
                <button className="sprofil-dev-revoke" onClick={() => handleRevokeDevice(dev.id)}>{t('common.revoke')}</button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="sprofil-card" style={{ border: '1px solid #fca5a5' }}>
        <div className="sprofil-card-header">
          <h2 style={{ color: '#ef4444' }}>Zone de Danger</h2>
          <p>Actions irréversibles concernant vos données personnelles.</p>
        </div>
        <div className="sprofil-setting-row" style={{ border: 'none', padding: 0 }}>
          <div className="sprofil-setting-info">
            <h4>Exporter mes données</h4>
            <p>Téléchargez toutes les données associées à votre profil au format JSON.</p>
          </div>
          <button className="sprofil-btn" onClick={handleCloudBackup}>⬇️ Sauvegarde Cloud</button>
        </div>
        <div className="sprofil-setting-row" style={{ border: 'none', padding: '1.5rem 0 0 0', marginTop: '1.5rem', borderTop: '1px solid #fee2e2' }}>
          <div className="sprofil-setting-info">
            <h4>Supprimer mon compte</h4>
            <p>Cette action effacera définitivement votre compte et votre progression.</p>
          </div>
          <button className="sprofil-btn danger" onClick={() => setShowDeleteModal(true)}>{t('common.confirm_delete_account')}</button>
        </div>
      </div>
    </>
  );

  const renderPreferences = () => (
    <>
      <div className="sprofil-card">
        <div className="sprofil-card-header">
          <h2>Notifications & Confidentialité</h2>
          <p>Gérez comment et quand vous souhaitez être contacté, et qui peut voir votre profil.</p>
        </div>
        
        <div className="sprofil-form-group" style={{ marginBottom: '1.5rem' }}>
          <label className="sprofil-label">Visibilité du Profil</label>
          <select className="sprofil-input" value={visibility} onChange={e => setVisibility(e.target.value)}>
            <option value="private">Privé (Moi uniquement)</option>
            <option value="trainers">Formateurs uniquement</option>
            <option value="public">Public (Tous les stagiaires)</option>
          </select>
        </div>

        <div className="sprofil-setting-row">
          <div className="sprofil-setting-info">
            <h4>Emails Transactionnels</h4>
            <p>Rappels de sessions live, notifications de certificats obtenus.</p>
          </div>
          <div className={`sprofil-toggle ${notifs.email ? 'active' : ''}`} onClick={() => setNotifs({...notifs, email: !notifs.email})}></div>
        </div>
        <div className="sprofil-setting-row">
          <div className="sprofil-setting-info">
            <h4>Notifications Push (Navigateur)</h4>
            <p>Recevoir des alertes en temps réel quand vous êtes sur le site.</p>
          </div>
          <button className="sprofil-btn" onClick={handlePushRequest}>
            {notifs.push ? '✅ Autorisées' : '🔔 Autoriser les Push'}
          </button>
        </div>
        <div className="sprofil-setting-row">
          <div className="sprofil-setting-info">
            <h4>Offres et Promotions</h4>
            <p>Recevoir des emails sur les nouvelles formations.</p>
          </div>
          <div className={`sprofil-toggle ${notifs.promo ? 'active' : ''}`} onClick={() => setNotifs({...notifs, promo: !notifs.promo})}></div>
        </div>
      </div>

      <div className="sprofil-card">
        <div className="sprofil-card-header">
          <h2>Affichage & Langue</h2>
          <p>Personnalisez votre expérience sur la plateforme.</p>
        </div>
        <div className="sprofil-form-grid">
          <div className="sprofil-form-group">
            <label className="sprofil-label">Langue de l'interface</label>
            <select className="sprofil-input" value={lang} onChange={e => setLang(e.target.value)}>
              <option value="fr">Français (FR)</option>
              <option value="en">English (US)</option>
            </select>
          </div>
          <div className="sprofil-form-group">
            <label className="sprofil-label">Thème Visuel</label>
            <select className="sprofil-input" value={theme} onChange={e => setTheme(e.target.value)}>
              <option value="light">Clair (Par défaut)</option>
              <option value="dark">Sombre (Bêta)</option>
              <option value="system">Adapté au système</option>
            </select>
          </div>
        </div>
      </div>

      <div className="sprofil-card">
        <div className="sprofil-card-header">
          <h2>Réseaux Sociaux & Objectifs</h2>
          <p>Liez vos comptes pour importer vos compétences et définissez vos objectifs.</p>
        </div>
        
        <div style={{ marginBottom: '2rem' }}>
          <div className="sprofil-social-row">
            <div className="sprofil-social-info">
              <div className="sprofil-social-icon linkedin">in</div>
              <span style={{fontWeight: 600, color: '#0f172a'}}>LinkedIn</span>
            </div>
            {social.linkedin ? <span style={{color: '#10b981', fontWeight: 700}}>✅ Connecté</span> : <button className="sprofil-btn" onClick={() => handleLinkSocial('linkedin')}>Connecter</button>}
          </div>
          <div className="sprofil-social-row">
            <div className="sprofil-social-info">
              <div className="sprofil-social-icon github">GH</div>
              <span style={{fontWeight: 600, color: '#0f172a'}}>GitHub</span>
            </div>
            {social.github ? <span style={{color: '#10b981', fontWeight: 700}}>✅ Connecté</span> : <button className="sprofil-btn" onClick={() => handleLinkSocial('github')}>Connecter</button>}
          </div>
        </div>

        <h4 style={{marginBottom:'1rem', color:'#0f172a'}}>Mes Objectifs d'Apprentissage</h4>
        <div className="sprofil-tags-container">
          {tags.map(tag => (
            <div key={tag} className="sprofil-tag">
              {tag} <button className="sprofil-tag-remove" onClick={() => handleRemoveTag(tag)}>✕</button>
            </div>
          ))}
        </div>
        <div className="sprofil-tag-input-wrapper">
          <input 
            type="text" 
            className="sprofil-input" 
            placeholder="Ex: Maîtriser Node.js" 
            value={newTag}
            onChange={e => setNewTag(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddTag()}
            style={{ flex: 1 }}
          />
          <button className="sprofil-btn" onClick={handleAddTag}>Ajouter</button>
        </div>
      </div>
    </>
  );

  const renderHistorique = () => (
    <>
      <div className="sprofil-card">
        <div className="sprofil-card-header">
          <h2>Calendrier d'Activité (Heatmap)</h2>
          <p>Votre régularité sur la plateforme lors des 365 derniers jours.</p>
        </div>
        <div className="sprofil-heatmap-container">
          <div className="sprofil-heatmap-months">
            <span>Jan</span><span>Fév</span><span>Mar</span><span>Avr</span><span>Mai</span><span>Juin</span>
            <span>Juil</span><span>Aoû</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Déc</span>
          </div>
          <div className="sprofil-heatmap-grid">
            {heatmapData.map((d, i) => (
              <div key={i} className="sprofil-hm-cell" data-level={d.level} title={`${d.date} : Niveau d'activité ${d.level}`}></div>
            ))}
          </div>
        </div>
      </div>

      <div className="sprofil-card">
        <div className="sprofil-card-header">
          <h2>Historique Récent</h2>
          <p>Vos dernières interactions détaillées.</p>
        </div>
        <div className="sprofil-timeline">
          {MOCK_ACTIVITY.map(act => (
            <div key={act.id} className="sprofil-tl-item">
              <span className="sprofil-tl-date">{act.date}</span>
              <p className="sprofil-tl-desc">{act.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );

  return (
    <div className={`sprofil-page ${focusMode ? 'focus-mode' : ''}`}>
      
      {!focusMode && (
        <div className="sprofil-header">
          <div className="sprofil-header-left">
            <h1>{t('common.profile_page_title')}</h1>
            <p>{t('common.profile_page_sub')}</p>
          </div>
          <div className="sprofil-header-actions">
            <button className="sprofil-btn" onClick={() => navigate('/dashboard/stagiaire/certificats')}>
              {t('common.view_my_certs')}
            </button>
          </div>
        </div>
      )}

      {!focusMode && (
        <div className="sprofil-progress-widget">
          <div className="sprofil-pw-top">
            <div className="sprofil-pw-info">
              <h3>Profil Complété à {profileProgress}%</h3>
              <p>{profileProgress < 100 ? "Liez vos réseaux sociaux pour atteindre 100% et booster votre visibilité." : "Félicitations, votre profil est parfait !"}</p>
            </div>
            <div className="sprofil-pw-percent">{profileProgress}%</div>
          </div>
          <div className="sprofil-pw-bar-bg">
            <div className="sprofil-pw-bar-fill" style={{ width: `${profileProgress}%` }}></div>
          </div>
        </div>
      )}

      {/* ── LAYOUT PRINCIPAL ── */}
      <div className="sprofil-layout">
        
        {/* SIDEBAR TABS (Hidden in Focus Mode) */}
        {!focusMode && (
          <aside className="sprofil-sidebar">
            <button className={`sprofil-tab ${activeTab === 'infos' ? 'active' : ''}`} onClick={() => setActiveTab('infos')}>
              <span className="sprofil-tab-icon">👤</span> {t('common.personal_info')}
            </button>
            <button className={`sprofil-tab ${activeTab === 'securite' ? 'active' : ''}`} onClick={() => setActiveTab('securite')}>
              <span className="sprofil-tab-icon">🔒</span> {t('common.account_security')}
            </button>
            <button className={`sprofil-tab ${activeTab === 'preferences' ? 'active' : ''}`} onClick={() => setActiveTab('preferences')}>
              <span className="sprofil-tab-icon">⚙️</span> {t('common.preferences')}
            </button>
            <button className={`sprofil-tab ${activeTab === 'historique' ? 'active' : ''}`} onClick={() => setActiveTab('historique')}>
              <span className="sprofil-tab-icon">⏱️</span> {t('common.activity_heatmap')}
            </button>
          </aside>
        )}

        {/* CONTENT AREA */}
        <main className="sprofil-content">
          {activeTab === 'infos' && renderInfos()}
          {activeTab === 'securite' && renderSecurite()}
          {activeTab === 'preferences' && renderPreferences()}
          {activeTab === 'historique' && renderHistorique()}
        </main>

      </div>

      {/* ── MODAL CROP AVATAR ── */}
      {showCropModal && (
        <div className="sprofil-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowCropModal(false) }}>
          <div className="sprofil-modal">
            <h2>Modifier l'Avatar</h2>
            <p>Recadrez votre photo pour l'adapter à votre profil public.</p>
            <div className="sprofil-crop-area">
              <div className="sprofil-crop-circle">Aperçu</div>
            </div>
            <div className="sprofil-modal-actions">
              <button className="sprofil-btn" onClick={() => setShowCropModal(false)}>{t('common.cancel')}</button>
              <button className="sprofil-btn primary" onClick={() => { alert("Photo recadrée et sauvegardée !"); setShowCropModal(false); }}>{t('common.save')}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL DE SUPPRESSION ── */}
      {showDeleteModal && (
        <div className="sprofil-overlay">
          <div className="sprofil-modal">
            <div className="sprofil-modal-icon">⚠️</div>
            <h2>Êtes-vous absolument sûr ?</h2>
            <p>
              La suppression de votre compte effacera de manière permanente toutes vos données,
              l'historique de vos formations et vos certificats. <b>Cette action est irréversible.</b>
            </p>
            <div className="sprofil-modal-actions">
              <button className="sprofil-btn" onClick={() => setShowDeleteModal(false)}>{t('common.cancel')}</button>
              <button className="sprofil-btn danger" onClick={handleDeleteAccount}>{t('common.confirm_delete_account')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StagiaireProfilPage;


