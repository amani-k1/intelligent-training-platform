import React, { useState } from 'react';
import { useTranslation } from '../../context/LanguageContext';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  AreaChart, Area, XAxis, Tooltip, ResponsiveContainer 
} from 'recharts';
import DashboardLayout from '../../components/DashboardLayout';
import './UserProfileAdmin.css';

// ── EXTENDED MOCK DATA ──
const USERS_MOCK = [
  { id: 1, name: 'Ahmed Benali', email: 'ahmed@brn.dz', role: 'stagiaire', status: 'actif', date: '12/01/2026', avatar: 'A', progress: 75, courses: 3, phone: '+213 555 12 34 56', city: 'Alger', bio: 'Passionné par le développement web et les nouvelles technologies.' },
  { id: 2, name: 'Sara Mansouri', email: 'sara@brn.dz', role: 'formateur', status: 'actif', date: '05/01/2026', avatar: 'S', sessions: 12, rating: 4.8, phone: '+213 666 98 76 54', city: 'Oran', bio: 'Experte en JavaScript et React avec plus de 5 ans d\'expérience.' },
];

const USER_FORMATIONS = [
  { id: 101, title: 'Développement Web Full-Stack', trainer: 'Sara Mansouri', progress: 85, grade: '16/20', status: 'En cours', start: '12 Jan 2026' },
  { id: 102, title: 'UI/UX Design Avancé', trainer: 'Lina Hadjadj', progress: 100, grade: '18/20', status: 'Terminé', start: '05 Fév 2026' },
];

const USER_BADGES = [
  { id: 1, name: 'Pionnier', icon: '🚀', date: '15 Jan 2026', type: 'Système' },
  { id: 2, name: 'Expert React', icon: '⚛️', date: '01 Mai 2026', type: 'Compétence' },
];

const USER_FINANCES = [
  { id: 'INV-001', label: 'Pack Full-Stack', amount: '18 000 DA', date: '10 Jan 2026', status: 'Payé' },
  { id: 'INV-002', label: 'Certificat UI/UX', amount: '5 000 DA', date: '12 Fév 2026', status: 'Payé' },
];

const USER_SECURITY_LOGS = [
  { id: 1, date: '07 Mai 2026 10:15', ip: '197.200.15.42', browser: 'Chrome / Windows', location: 'Alger' },
  { id: 2, date: '06 Mai 2026 14:20', ip: '105.101.8.99', browser: 'Safari / iPhone', location: 'Oran' },
];

const USER_TICKETS = [
  { id: 'T-882', subject: 'Problème accès plateforme', priority: 'Haute', status: 'Fermé', date: '20 Fév 2026' },
  { id: 'T-901', subject: 'Demande de certificat papier', priority: 'Moyenne', status: 'Ouvert', date: '02 Mai 2026' },
];

const UserProfileAdmin = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [searchFormation, setSearchFormation] = useState('');
  const [searchTicket, setSearchTicket] = useState('');
  const [auditFilter, setAuditFilter] = useState('all');

  const user = USERS_MOCK.find(u => u.id === parseInt(id)) || USERS_MOCK[0];

  const ROLE_COLORS = {
    stagiaire: { bg: '#0a8fa020', text: '#0a8fa0' },
    formateur: { bg: '#27ae6020', text: '#27ae60' },
    admin: { bg: '#6c3fa020', text: '#6c3fa0' }
  };
  const colors = ROLE_COLORS[user.role] || ROLE_COLORS.stagiaire;

  const STATUS_FORMATION = { 'En cours': t('common.status_in_progress'), 'Terminé': t('common.status_completed') };
  const STATUS_FINANCE = { 'Payé': t('common.status_paid') };
  const TICKET_PRIORITY = { 'Haute': t('common.priority_high'), 'Moyenne': t('common.priority_medium') };
  const TICKET_STATUS = { 'Fermé': t('common.status_closed'), 'Ouvert': t('common.status_open') };

  const handleExportFullPDF = () => {
    alert(`${t('common.export_folder_pdf')} — ${user.name}`);
  };

  const filteredFormations = USER_FORMATIONS.filter(f => 
    f.title.toLowerCase().includes(searchFormation.toLowerCase()) ||
    f.trainer.toLowerCase().includes(searchFormation.toLowerCase())
  );

  const filteredTickets = USER_TICKETS.filter(t => 
    t.subject.toLowerCase().includes(searchTicket.toLowerCase()) ||
    t.id.toLowerCase().includes(searchTicket.toLowerCase())
  );

  const ALL_AUDIT_LOGS = [
    { id: 1, date: `${t('common.today_at')} 09:00`, author: 'Admin', type: 'security', msg: t('common.audit_status_change'), highlight: 'ACTIF' },
    { id: 2, date: `${t('common.yesterday_at')} 14:00`, author: 'Système', type: 'badge', msg: t('common.audit_badge_awarded'), highlight: 'Expert React' },
    { id: 3, date: '04 Mai 10:30', author: 'Admin', type: 'formation', msg: t('common.audit_registration_approved'), highlight: 'UI/UX Design' },
    { id: 4, date: '01 Mai 18:45', author: 'Système', type: 'finance', msg: t('common.audit_invoice_generated'), highlight: 'INV-002' },
  ];

  const filteredAudit = ALL_AUDIT_LOGS.filter(a => auditFilter === 'all' || a.type === auditFilter);

  return (
    <DashboardLayout role="admin">
      <div className="upa-page">
        {/* Header / Back */}
        <div className="upa-header">
          <div style={{display:'flex', gap:'0.8rem'}}>
            <button className="upa-back" onClick={() => navigate('/dashboard/admin/utilisateurs')}>← {t('common.back_list')}</button>
            <button className="upa-btn-secondary" onClick={handleExportFullPDF}>📂 {t('common.export_folder_pdf')}</button>
          </div>
          <div className="upa-actions">
            <button className="upa-btn-secondary" onClick={() => alert('Interface email ouverte')}>📧 {t('common.email_direct')}</button>
            <button className="upa-btn-secondary" onClick={() => alert('Email de réinitialisation envoyé')}>🔐 {t('common.reset_pwd')}</button>
            <button className="upa-btn-danger">{t('common.suspend')}</button>
          </div>
        </div>

        <div className="upa-grid">
          {/* Left Column: Fixed Info Card */}
          <div className="upa-column upa-column--info">
            <div className="upa-card upa-card--profile">
              <div className="upa-avatar-large" style={{ background: colors.bg, color: colors.text }}>
                {user.avatar}
              </div>
              <h2 className="upa-name">{user.name}</h2>
              <p className="upa-email">{user.email}</p>
              <span className="upa-badge" style={{ background: colors.bg, color: colors.text }}>
                {user.role.toUpperCase()}
              </span>
              
              <div className="upa-stats-row">
                <div className="upa-stat-item">
                  <span className="val">{user.role === 'stagiaire' ? user.courses : user.sessions}</span>
                  <span className="lab">{user.role === 'stagiaire' ? t('common.courses_label') : t('common.sessions_label')}</span>
                </div>
                <div className="upa-stat-item">
                  <span className="val">15.5</span>
                  <span className="lab">{t('common.average_label')}</span>
                </div>
              </div>

              <div className="upa-info-list">
                <div className="upa-info-item"><span>📞 {t('common.phone')}:</span> <strong>{user.phone}</strong></div>
                <div className="upa-info-item"><span>📍 {t('common.city_label')}:</span> <strong>{user.city}</strong></div>
                <div className="upa-info-item"><span>📅 {t('common.joined_label')}:</span> <strong>{user.date}</strong></div>
                <div className="upa-info-item"><span>✅ {t('common.status')}:</span> <strong style={{color:'#27ae60'}}>{user.status}</strong></div>
              </div>

              <div className="upa-bio">
                <h4>Bio</h4>
                <p>{user.bio}</p>
              </div>
            </div>
          </div>

          {/* Right Column: Tabbed Detailed Content */}
          <div className="upa-column upa-column--content">
            <div className="upa-tabs-nav">
              {[
                { id: 'overview',   label: t('common.tab_overview_label'), icon: '🏠' },
                { id: 'formations', label: t('common.formations'),          icon: '📚' },
                { id: 'badges',     label: t('common.badges'),              icon: '🏅' },
                { id: 'finances',   label: t('common.tab_finances'),        icon: '💰' },
                { id: 'support',    label: t('common.tab_support'),         icon: '🎧' },
                { id: 'security',   label: t('common.security'),            icon: '🛡️' },
                { id: 'notes',      label: t('common.tab_notes_admin'),     icon: '📝' },
              ].map(tab => (
                <button
                  key={tab.id}
                  className={`upa-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span className="icon">{tab.icon}</span>
                  <span className="label">{tab.label}</span>
                </button>
              ))}
            </div>

            <div className="upa-tab-content">
              {/* 1. OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="upa-tab-pane fade-in">
                  <div className="upa-card">
                    <h3 className="upa-card-title">{t('common.progression_curve')}</h3>
                    <div style={{ height: '300px', marginTop: '1rem' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={[
                          { name: 'Module 1', score: 14, comp: 100 },
                          { name: 'Module 2', score: 12, comp: 80 },
                          { name: 'Module 3', score: 16, comp: 60 },
                          { name: 'Module 4', score: 15, comp: 40 },
                          { name: 'Module 5', score: 18, comp: 10 },
                        ]}>
                          <defs>
                            <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#0a8fa0" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#0a8fa0" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill:'#8aa8b0', fontSize:10}} />
                          <Tooltip contentStyle={{borderRadius:'12px', border:'none', boxShadow:'0 10px 20px rgba(0,0,0,0.1)'}} />
                          <Area type="monotone" dataKey="score" stroke="#0a8fa0" fillOpacity={1} fill="url(#colorVal)" strokeWidth={3} name={t('common.chart_grade_label')} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="upa-card" style={{marginTop:'1.5rem'}}>
                    <div className="upa-card-header-flex">
                      <h3 className="upa-card-title">{t('common.detailed_audit')}</h3>
                      <select
                        className="upa-select-mini"
                        value={auditFilter}
                        onChange={(e) => setAuditFilter(e.target.value)}
                      >
                        <option value="all">{t('common.all_actions')}</option>
                        <option value="security">{t('common.security')}</option>
                        <option value="formation">{t('common.formations')}</option>
                        <option value="finance">{t('common.tab_finances')}</option>
                        <option value="badge">{t('common.badges')}</option>
                      </select>
                    </div>
                    <div className="upa-audit-detailed">
                      {filteredAudit.map(log => (
                        <div className={`audit-log-item audit-log-item--${log.type}`} key={log.id}>
                          <div className="log-icon">
                            {log.type === 'security' ? '🔐' : log.type === 'formation' ? '📚' : log.type === 'finance' ? '💰' : '🏅'}
                          </div>
                          <div className="log-body">
                            <span className="log-date">{log.date} {t('common.by_label')} <strong>{log.author}</strong></span>
                            <p>{log.msg} <span className="log-hl">{log.highlight}</span></p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 2. FORMATIONS */}
              {activeTab === 'formations' && (
                <div className="upa-tab-pane fade-in">
                  <div className="upa-card">
                    <div className="upa-card-header-flex">
                      <h3 className="upa-card-title">{t('common.inscription_progression')}</h3>
                      <input
                        type="text"
                        placeholder={t('common.search')}
                        className="upa-search-mini"
                        value={searchFormation}
                        onChange={(e) => setSearchFormation(e.target.value)}
                      />
                    </div>
                    <table className="da-table">
                      <thead><tr><th>{t('common.formation')}</th><th>{t('common.trainer_col')}</th><th>{t('common.progression_col')}</th><th>{t('common.grade_col')}</th><th>{t('common.status')}</th></tr></thead>
                      <tbody>
                        {filteredFormations.map(f => (
                          <tr key={f.id}>
                            <td><strong>{f.title}</strong></td>
                            <td>{f.trainer}</td>
                            <td>
                              <div className="da-progress-bar" style={{width:'80px'}}><div className="fill" style={{width:`${f.progress}%`}}></div></div>
                              <span style={{fontSize:'0.7rem'}}>{f.progress}%</span>
                            </td>
                            <td><strong>{f.grade}</strong></td>
                            <td><span className={`da-badge ${f.status === 'Terminé' ? 'da-badge--actif' : 'da-badge--attente'}`}>{STATUS_FORMATION[f.status] || f.status}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 3. BADGES */}
              {activeTab === 'badges' && (
                <div className="upa-tab-pane fade-in">
                  <div className="upa-card">
                    <div className="upa-card-header-flex">
                      <h3 className="upa-card-title">{t('common.badge_management')}</h3>
                      <button className="upa-btn-small-add">{t('common.assign_badge_short')}</button>
                    </div>
                    <div className="upa-badge-grid">
                      {USER_BADGES.map(b => (
                        <div className="upa-badge-item-pro" key={b.id}>
                          <span className="icon">{b.icon}</span>
                          <div className="info"><strong>{b.name}</strong><span>{b.date}</span></div>
                          <button className="remove-badge">×</button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 4. FINANCES */}
              {activeTab === 'finances' && (
                <div className="upa-tab-pane fade-in">
                  <div className="upa-card">
                    <h3 className="upa-card-title">{t('common.financial_history')}</h3>
                    <table className="da-table">
                      <thead><tr><th>ID</th><th>{t('common.object_label')}</th><th>{t('common.amount_label')}</th><th>{t('common.status')}</th><th>{t('common.actions')}</th></tr></thead>
                      <tbody>
                        {USER_FINANCES.map(f => (
                          <tr key={f.id}>
                            <td>{f.id}</td>
                            <td>{f.label}</td>
                            <td><strong>{f.amount}</strong></td>
                            <td><span className="da-badge da-badge--actif">{STATUS_FINANCE[f.status] || f.status}</span></td>
                            <td><button className="da-btn da-btn--sm">{t('common.invoice_btn')}</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 5. SUPPORT */}
              {activeTab === 'support' && (
                <div className="upa-tab-pane fade-in">
                  <div className="upa-card">
                    <div className="upa-card-header-flex">
                      <h3 className="upa-card-title">{t('common.tickets_requests')}</h3>
                      <input
                        type="text"
                        placeholder={t('common.search')}
                        className="upa-search-mini"
                        value={searchTicket}
                        onChange={(e) => setSearchTicket(e.target.value)}
                      />
                    </div>
                    <div className="upa-ticket-list-pro">
                      {filteredTickets.map(tck => (
                        <div className={`upa-ticket-card ${tck.priority === 'Haute' ? 'upa-ticket--urgent' : ''}`} key={tck.id}>
                          <div className="meta">
                            <span className="id">{tck.id}</span>
                            <span className={`priority ${tck.priority.toLowerCase()}`}>{TICKET_PRIORITY[tck.priority] || tck.priority}</span>
                          </div>
                          <div className="body">
                            <strong>{tck.subject}</strong>
                            <p>{t('common.last_activity')}: {tck.date}</p>
                          </div>
                          <div style={{display:'flex', alignItems:'center', gap:'0.8rem'}}>
                            {tck.priority === 'Haute' && tck.status === 'Ouvert' && <span className="pulse-alert" title="Action requise"></span>}
                            <span className={`status ${tck.status.toLowerCase()}`}>{TICKET_STATUS[tck.status] || tck.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 6. SECURITY */}
              {activeTab === 'security' && (
                <div className="upa-tab-pane fade-in">
                  <div className="upa-card">
                    <h3 className="upa-card-title">{t('common.security_connections')}</h3>
                    <div className="upa-sec-info-grid">
                      <div className="sec-stat"><span>{t('common.two_fa')}</span><strong>{t('common.disabled_label')}</strong></div>
                      <div className="sec-stat"><span>{t('common.last_reset')}</span><strong>05 Mars 2026</strong></div>
                    </div>
                    <hr style={{margin:'1.5rem 0', opacity:0.05}}/>
                    <h4 style={{fontSize:'0.9rem', marginBottom:'1rem'}}>{t('common.ip_history')}</h4>
                    <table className="da-table">
                      <thead><tr><th>Date</th><th>IP</th><th>{t('common.browser_col')}</th></tr></thead>
                      <tbody>
                        {USER_SECURITY_LOGS.map(l => (
                          <tr key={l.id}><td>{l.date}</td><td>{l.ip}</td><td>{l.browser}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 7. NOTES */}
              {activeTab === 'notes' && (
                <div className="upa-tab-pane fade-in">
                  <div className="upa-card">
                    <h3 className="upa-card-title">{t('common.admin_notes_title')}</h3>
                    <textarea className="upa-notes-area-pro" placeholder={t('common.write_note_placeholder')}></textarea>
                    <button className="upa-btn-save-note">{t('common.save_note')}</button>
                    <div className="upa-prev-notes">
                      <div className="note-item">
                        <span className="author">Admin - 01 Mai</span>
                        <p>{t('common.sample_note_text')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default UserProfileAdmin;


