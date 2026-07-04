import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useTranslation } from '../../../context/LanguageContext';
import DashboardLayout from '../../../components/DashboardLayout';
import { FORMATIONS, DEFAULT_TEMPLATES, INITIAL_CONVERSATIONS } from './messagesData';
import './TrainerMessagesPage.css';

// ─── UTILS ────────────────────────────────────────────────────────────────────
const getLastMsg = (conv) => conv.messages.at(-1);
const getUnread  = (conv) => conv.messages.filter(m => !m.self && !m.seen).length;
const timeLabel  = (conv) => {
  const d = getLastMsg(conv)?.date;
  return d || '';
};

// ─── TOAST ────────────────────────────────────────────────────────────────────
const Toast = ({ msg, onClose }) => (
  <div className="ms-toast" onClick={onClose}><span>✅</span> {msg}</div>
);

// ─── ATTACHMENT ICON ──────────────────────────────────────────────────────────
const AttIcon = ({ type }) => type === 'pdf' ? '📄' : type === 'image' ? '🖼️' : '📎';

export default function TrainerMessagesPage() {
  const { t } = useTranslation();
  const [convs, setConvs]             = useState(INITIAL_CONVERSATIONS);
  const [activeId, setActiveId]       = useState(null);
  const [tab, setTab]                 = useState('inbox'); // inbox | annonces | analytique
  const [search, setSearch]           = useState('');
  const [filterForm, setFilterForm]   = useState('all');
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all'); // all | replied | unreplied
  const [filterUnread, setFilterUnread] = useState(false);
  const [inputText, setInputText]     = useState('');
  const [templates, setTemplates]     = useState(DEFAULT_TEMPLATES);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [newTplLabel, setNewTplLabel] = useState('');
  const [newTplText, setNewTplText]   = useState('');
  const [menuId, setMenuId]           = useState(null); // conv context menu
  const [showCompose, setShowCompose] = useState(false);
  const [composeRecipient, setComposeRecipient] = useState('');
  const [composeText, setComposeText] = useState('');
  const [toast, setToast]             = useState(null);
  const [newMsgNotif, setNewMsgNotif] = useState(false);
  const [announceTxt, setAnnounceTxt] = useState('');
  const [announceTitle, setAnnounceTitle] = useState('');
  const [announceForm, setAnnounceForm] = useState('f1');
  const [sentAnnounces, setSentAnnounces] = useState([
    { id: 1, title: 'Rappel session live jeudi', formation: 'f1', recipients: 15, readPct: 80, date: "Aujourd'hui" },
    { id: 2, title: 'Nouveau module dispo', formation: 'f2', recipients: 20, readPct: 55, date: 'Hier' },
  ]);
  const [attachFile, setAttachFile]   = useState(null);
  const bottomRef  = useRef(null);
  const fileRef    = useRef(null);

  const activeConv = convs.find(c => c.id === activeId);
  const totalUnread = convs.reduce((s, c) => s + getUnread(c), 0);

  // Auto-scroll to latest message
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [activeId, activeConv?.messages?.length]);

  // Simulate incoming message every 30s (demo)
  useEffect(() => {
    const timer = setTimeout(() => setNewMsgNotif(true), 30000);
    return () => clearTimeout(timer);
  }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3500); };

  // ── Open conversation ──────────────────────────────────────────────────────
  const openConv = (conv) => {
    setActiveId(conv.id);
    setNewMsgNotif(false);
    setConvs(prev => prev.map(c => c.id === conv.id
      ? { ...c, messages: c.messages.map(m => ({ ...m, seen: true })) }
      : c
    ));
    setMenuId(null);
  };

  // ── Send message ──────────────────────────────────────────────────────────
  const sendMsg = () => {
    if (!inputText.trim() && !attachFile) return;
    const att = attachFile ? [{ name: attachFile.name, type: attachFile.type.startsWith('image') ? 'image' : 'pdf' }] : [];
    const msg = { id: Date.now(), self: true, text: inputText.trim(), time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }), date: "Aujourd'hui", seen: false, attachments: att };
    setConvs(prev => prev.map(c => c.id === activeId ? { ...c, messages: [...c.messages, msg], replied: true } : c));
    setInputText('');
    setAttachFile(null);
  };

  // ── Context menu actions ───────────────────────────────────────────────────
  const markUnread = (id) => { setConvs(prev => prev.map(c => c.id === id ? { ...c, messages: c.messages.map((m, i) => i === c.messages.length - 1 ? { ...m, seen: false } : m) } : c)); setMenuId(null); };
  const archiveConv = (id) => { setConvs(prev => prev.map(c => c.id === id ? { ...c, archived: !c.archived } : c)); setMenuId(null); showToast('Conversation archivée.'); };
  const blockConv   = (id) => { setConvs(prev => prev.map(c => c.id === id ? { ...c, blocked: true } : c)); setMenuId(null); showToast('Stagiaire signalé.'); };

  // ── Template management ───────────────────────────────────────────────────
  const addTemplate = () => {
    if (!newTplLabel.trim() || !newTplText.trim()) return;
    setTemplates(prev => [...prev, { id: `t${Date.now()}`, label: newTplLabel, text: newTplText }]);
    setNewTplLabel(''); setNewTplText('');
    showToast('Modèle ajouté !');
  };

  // ── Filter conversations ───────────────────────────────────────────────────
  const visible = useMemo(() => {
    return convs.filter(c => {
      if (c.archived && filterStatus !== 'archived') return false;
      if (!c.archived && filterStatus === 'archived') return false;
      if (filterUnread && getUnread(c) === 0) return false;
      if (filterForm !== 'all' && c.formationId !== filterForm) return false;
      if (filterStatus === 'replied'   && !c.replied) return false;
      if (filterStatus === 'unreplied' && c.replied)  return false;
      if (search) {
        const nameMatch = c.name.toLowerCase().includes(search.toLowerCase());
        const msgMatch  = c.messages.some(m => m.text.toLowerCase().includes(search.toLowerCase()));
        if (!nameMatch && !msgMatch) return false;
      }
      return true;
    });
  }, [convs, search, filterForm, filterStatus, filterUnread]);

  // ── Announce send ─────────────────────────────────────────────────────────
  const sendAnnounce = () => {
    if (!announceTitle.trim()) return;
    const f = FORMATIONS.find(x => x.id === announceForm);
    setSentAnnounces(prev => [{ id: Date.now(), title: announceTitle, formation: announceForm, recipients: Math.floor(Math.random()*20)+5, readPct: 0, date: "À l'instant" }, ...prev]);
    setAnnounceTitle(''); setAnnounceTxt('');
    showToast(`Annonce envoyée à tous les stagiaires de "${f?.title}" !`);
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout role="formateur">
      <div className="ms-page">
        {toast && <Toast msg={toast} onClose={() => setToast(null)} />}

        {/* ── TOP BAR ── */}
        <div className="ms-topbar">
          <h1>
            💬 {t('ms.title')}
            {totalUnread > 0 && <span className="ms-badge">{totalUnread}</span>}
            {newMsgNotif && <span className="ms-notif-pulse" title="Nouveau message">🔴</span>}
          </h1>
          <div className="ms-topbar-right">
            <div className="ms-tabs">
              {[['inbox', t('ms.tab_inbox')],['annonces', t('ms.tab_announces')],['analytique', t('ms.tab_analytics')]].map(([key,label])=>(
                <button key={key} className={`ms-tab ${tab===key?'active':''}`} onClick={()=>setTab(key)}>{label}</button>
              ))}
            </div>
            <button className="ms-btn-primary" onClick={()=>setShowCompose(true)}>{t('ms.new_message')}</button>
          </div>
        </div>

        {/* ── INBOX TAB ── */}
        {tab === 'inbox' && (
          <div className="ms-layout">
            {/* LEFT PANEL */}
            <div className="ms-left">
              {/* Search */}
              <div className="ms-search-wrap">
                <input className="ms-search" type="text" placeholder={t('ms.search_placeholder')} value={search} onChange={e=>setSearch(e.target.value)} />
              </div>

              {/* Filters */}
              <div className="ms-filters">
                <select className="ms-select" value={filterForm} onChange={e=>setFilterForm(e.target.value)}>
                  <option value="all">{t('ms.all_formations')}</option>
                  {FORMATIONS.map(f=><option key={f.id} value={f.id}>{f.title}</option>)}
                </select>
                <select className="ms-select" value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
                  <option value="all">{t('ms.all_statuses')}</option>
                  <option value="replied">{t('ms.replied')}</option>
                  <option value="unreplied">{t('ms.unreplied')}</option>
                  <option value="archived">{t('ms.archived_filter')}</option>
                </select>
                <label className="ms-chip-toggle">
                  <input type="checkbox" checked={filterUnread} onChange={e=>setFilterUnread(e.target.checked)} />
                  {t('ms.unread_label')}
                </label>
              </div>

              {/* Conversation list */}
              <div className="ms-conv-list">
                {visible.length === 0 && <div className="ms-empty-list">{t('common.no_conversation')}</div>}
                {visible.map(conv => {
                  const f    = FORMATIONS.find(x => x.id === conv.formationId);
                  const unrd = getUnread(conv);
                  const last = getLastMsg(conv);
                  return (
                    <div key={conv.id} className={`ms-conv-item ${activeId===conv.id?'active':''} ${unrd>0?'unread':''} ${conv.blocked?'blocked':''}`} onClick={()=>openConv(conv)}>
                      <div className="ms-avatar" style={{background:conv.color}}>
                        {conv.initials}
                        {conv.online && <span className="ms-online-dot"/>}
                      </div>
                      <div className="ms-conv-body">
                        <div className="ms-conv-top">
                          <span className="ms-conv-name">{conv.name}</span>
                          <span className="ms-conv-time">{timeLabel(conv)}</span>
                        </div>
                        <div className="ms-conv-tags">
                          <span className="ms-tag" style={{background:f?.color}}>{f?.title}</span>
                          {!conv.replied && <span className="ms-tag unreplied">{t('ms.tag_unreplied')}</span>}
                          {conv.critical  && <span className="ms-tag critical">{t('ms.tag_critical')}</span>}
                          {conv.archived  && <span className="ms-tag archived">{t('ms.tag_archived')}</span>}
                        </div>
                        <p className="ms-conv-preview">{last?.attachments?.length>0 && '📎 '}{last?.text}</p>
                      </div>
                      {unrd > 0 && <div className="ms-unread-dot">{unrd}</div>}
                      {/* Context menu trigger */}
                      <button className="ms-ctx-btn" onClick={e=>{e.stopPropagation();setMenuId(menuId===conv.id?null:conv.id);}}>⋯</button>
                      {menuId === conv.id && (
                        <div className="ms-ctx-menu" onClick={e=>e.stopPropagation()}>
                          <button onClick={()=>markUnread(conv.id)}>{t('ms.mark_unread')}</button>
                          <button onClick={()=>archiveConv(conv.id)}>{conv.archived ? t('ms.unarchive_action') : t('ms.archive_action')}</button>
                          <button onClick={()=>{showToast('Transféré à un collègue (simulation)');setMenuId(null);}}>{t('ms.forward')}</button>
                          <button onClick={()=>blockConv(conv.id)} className="ms-ctx-danger">{t('ms.report')}</button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RIGHT PANEL */}
            {activeConv ? (
              <div className="ms-right">
                {/* Conv header */}
                <div className="ms-chat-header">
                  <div style={{display:'flex',alignItems:'center',gap:'0.75rem'}}>
                    <div className="ms-avatar" style={{background:activeConv.color,width:38,height:38,fontSize:'0.85rem'}}>{activeConv.initials}</div>
                    <div>
                      <strong>{activeConv.name}</strong>
                      <p style={{margin:0,fontSize:'0.8rem',color:'#5a7d86'}}>
                        {FORMATIONS.find(f=>f.id===activeConv.formationId)?.title} ·
                        {activeConv.online ? ` ${t('ms.online_status')}` : ` ${t('ms.offline_status')}`}
                      </p>
                    </div>
                  </div>
                  <div style={{display:'flex',gap:'0.5rem'}}>
                    <button className="ms-icon-btn" title="Profil stagiaire" onClick={()=>showToast('Lien vers le profil du stagiaire (intégration à venir)')}>👤</button>
                    <button className="ms-icon-btn" title="Archiver" onClick={()=>archiveConv(activeConv.id)}>📁</button>
                    <button className="ms-icon-btn" title="Marquer non lu" onClick={()=>markUnread(activeConv.id)}>🔵</button>
                  </div>
                </div>

                {/* Critical alert */}
                {activeConv.critical && (
                  <div className="ms-alert-banner">{t('ms.critical_alert')}</div>
                )}

                {/* Bubbles */}
                <div className="ms-bubbles">
                  {activeConv.messages.map((msg, idx) => {
                    const showDate = idx === 0 || msg.date !== activeConv.messages[idx-1].date;
                    return (
                      <React.Fragment key={msg.id}>
                        {showDate && <div className="ms-date-div">{msg.date}</div>}
                        <div className={`ms-bubble-row ${msg.self?'self':''}`}>
                          {!msg.self && <div className="ms-avatar" style={{background:activeConv.color,width:30,height:30,fontSize:'0.72rem'}}>{activeConv.initials}</div>}
                          <div className={`ms-bubble ${msg.self?'self':'other'}`}>
                            {msg.text && <span>{msg.text}</span>}
                            {msg.attachments?.map((a,i)=>(
                              <div key={i} className="ms-attachment">
                                <AttIcon type={a.type}/> {a.name}
                              </div>
                            ))}
                            <span className="ms-bubble-time">{msg.time}</span>
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })}
                  {activeConv.messages.at(-1)?.self && <div className="ms-seen">{t('ms.seen')}</div>}
                  <div ref={bottomRef}/>
                </div>

                {/* Input area */}
                <div className="ms-input-area">
                  {/* Templates */}
                  <div className="ms-templates">
                    {templates.map(tpl=>(
                      <button key={tpl.id} className="ms-tpl-chip" title={tpl.text} onClick={()=>setInputText(tpl.text)}>{tpl.label}</button>
                    ))}
                    <button className="ms-tpl-chip manage" onClick={()=>setShowTemplateEditor(true)}>{t('ms.manage_templates')}</button>
                  </div>
                  {attachFile && (
                    <div className="ms-attach-preview">📎 {attachFile.name} <button onClick={()=>setAttachFile(null)}>✕</button></div>
                  )}
                  <div className="ms-input-row">
                    <button className="ms-icon-btn" title="Joindre un fichier" onClick={()=>fileRef.current?.click()}>📎</button>
                    <input ref={fileRef} type="file" style={{display:'none'}} onChange={e=>setAttachFile(e.target.files[0])} accept=".pdf,.png,.jpg,.jpeg"/>
                    <textarea
                      className="ms-textarea"
                      rows={2}
                      placeholder={t('ms.write_message')}
                      value={inputText}
                      onChange={e=>setInputText(e.target.value)}
                      onKeyDown={e=>{ if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMsg();} }}
                    />
                    <button className="ms-send-btn" onClick={sendMsg}>➤</button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="ms-right ms-empty-state">
                <div style={{fontSize:'4rem',opacity:0.4}}>💬</div>
                <h3>{t('ms.empty_select')}</h3>
                <p>{t('ms.empty_click')}</p>
              </div>
            )}
          </div>
        )}

        {/* ── ANNONCES TAB ── */}
        {tab === 'annonces' && (
          <div className="ms-full-tab">
            <div className="ms-card">
              <h3>{t('ms.announce_new')}</h3>
              <div className="ms-form-row"><label>{t('ms.announce_target')}</label>
                <select value={announceForm} onChange={e=>setAnnounceForm(e.target.value)}>
                  {FORMATIONS.map(f=><option key={f.id} value={f.id}>{f.title}</option>)}
                </select>
              </div>
              <div className="ms-form-row"><label>{t('ms.announce_title_label')}</label><input type="text" placeholder="Ex: Session live demain à 10h" value={announceTitle} onChange={e=>setAnnounceTitle(e.target.value)}/></div>
              <div className="ms-form-row"><label>{t('ms.announce_msg_label')}</label><textarea rows={3} placeholder="Contenu de l'annonce…" value={announceTxt} onChange={e=>setAnnounceTxt(e.target.value)}/></div>
              <div className="ms-form-row"><label>{t('ms.announce_scheduled')}</label><input type="datetime-local"/></div>
              <button className="ms-btn-primary" style={{marginTop:'0.5rem'}} onClick={sendAnnounce}>{t('ms.announce_send')}</button>
            </div>
            <h3 style={{fontFamily:'Raleway,sans-serif',fontWeight:700,marginTop:'1.5rem'}}>{t('ms.announces_sent')}</h3>
            {sentAnnounces.map(a => {
              const f = FORMATIONS.find(x=>x.id===a.formation);
              return (
                <div key={a.id} className="ms-announce-card" style={{borderLeftColor:f?.color}}>
                  <h4>{a.title}</h4>
                  <p style={{color:'#5a7d86',fontSize:'0.85rem'}}>{f?.title} · {a.date}</p>
                  <div style={{display:'flex',gap:'1rem',marginTop:'0.5rem'}}>
                    <span className="ms-stat-chip">👥 {a.recipients} destinataires</span>
                    <span className="ms-stat-chip">👁️ Lu par {a.readPct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── ANALYTIQUE TAB ── */}
        {tab === 'analytique' && (
          <div className="ms-full-tab">
            <div className="ms-analytics-kpis">
              {[['2,4h','Temps moyen de réponse'],['92%','Satisfaction (feedback)'],[''+convs.length,'Conversations actives'],[''+totalUnread,'Non lus en attente']].map(([val,label])=>(
                <div key={label} className="ms-kpi-card"><div className="ms-kpi-num">{val}</div><p>{label}</p></div>
              ))}
            </div>
            <div className="ms-card" style={{marginTop:'1.5rem'}}>
              <h3>📨 Volume par formation</h3>
              {FORMATIONS.map(f => {
                const count = convs.filter(c=>c.formationId===f.id).length;
                const pct   = Math.round((count/convs.length)*100);
                return (
                  <div key={f.id} className="ms-bar-row">
                    <span style={{minWidth:180,fontWeight:700}}>{f.title}</span>
                    <div className="ms-bar-track"><div className="ms-bar-fill" style={{width:`${pct}%`,background:f.color}}/></div>
                    <span style={{color:'#5a7d86',fontSize:'0.85rem',fontWeight:700}}>{count} conv.</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── COMPOSE MODAL ── */}
        {showCompose && (
          <div className="ms-overlay" onClick={e=>{if(e.target.className==='ms-overlay')setShowCompose(false);}}>
            <div className="ms-modal">
              <div className="ms-modal-head"><h3>✏️ Nouveau message</h3><button className="ms-modal-close" onClick={()=>setShowCompose(false)}>✕</button></div>
              <div className="ms-modal-body">
                <div className="ms-form-row"><label>Destinataire</label><input type="text" placeholder="Nom du stagiaire…" value={composeRecipient} onChange={e=>setComposeRecipient(e.target.value)}/></div>
                <div className="ms-form-row"><label>Formation</label><select>{FORMATIONS.map(f=><option key={f.id}>{f.title}</option>)}</select></div>
                <div className="ms-form-row"><label>Message</label><textarea rows={4} placeholder="Votre message…" value={composeText} onChange={e=>setComposeText(e.target.value)}/></div>
              </div>
              <div className="ms-modal-foot">
                <button className="ms-btn-cancel" onClick={()=>setShowCompose(false)}>Annuler</button>
                <button className="ms-btn-primary" onClick={()=>{setShowCompose(false);showToast('Message envoyé ! (simulation)');}}>➤ Envoyer</button>
              </div>
            </div>
          </div>
        )}

        {/* ── TEMPLATE EDITOR MODAL ── */}
        {showTemplateEditor && (
          <div className="ms-overlay" onClick={e=>{if(e.target.className==='ms-overlay')setShowTemplateEditor(false);}}>
            <div className="ms-modal">
              <div className="ms-modal-head"><h3>{t('common.manage_templates')}</h3><button className="ms-modal-close" onClick={()=>setShowTemplateEditor(false)}>✕</button></div>
              <div className="ms-modal-body">
                <div style={{display:'flex',flexDirection:'column',gap:'0.5rem',marginBottom:'1rem'}}>
                  {templates.map(t=>(
                    <div key={t.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'0.5rem',background:'#f7fafc',borderRadius:8}}>
                      <div><strong style={{fontSize:'0.9rem'}}>{t.label}</strong><p style={{margin:0,fontSize:'0.8rem',color:'#5a7d86'}}>{t.text}</p></div>
                      <button style={{background:'none',border:'none',cursor:'pointer',color:'#e74c3c',fontSize:'1rem'}} onClick={()=>setTemplates(prev=>prev.filter(x=>x.id!==t.id))}>🗑️</button>
                    </div>
                  ))}
                </div>
                <hr/>
                <p style={{fontWeight:700,marginBottom:'0.5rem'}}>Ajouter un modèle</p>
                <div className="ms-form-row"><label>Étiquette</label><input type="text" placeholder="Ex: Lien replay" value={newTplLabel} onChange={e=>setNewTplLabel(e.target.value)}/></div>
                <div className="ms-form-row"><label>Texte</label><textarea rows={2} placeholder="Texte du modèle…" value={newTplText} onChange={e=>setNewTplText(e.target.value)}/></div>
              </div>
              <div className="ms-modal-foot">
                <button className="ms-btn-cancel" onClick={()=>setShowTemplateEditor(false)}>Fermer</button>
                <button className="ms-btn-primary" onClick={addTemplate}>{t('common.add_template')}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}


