// src/pages/UserProfilePage.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import {
  UserCircleIcon,
  PencilSquareIcon,
  CheckIcon,
  XMarkIcon,
  CameraIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowLeftIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  CalendarIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  LinkIcon,
  ShieldCheckIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { getProfile, updateProfile, updatePassword, updateAvatar } from '../services/ProfileService';

// ── Toast notification ─────────────────────────────────────────────────────
const Toast = ({ toast, onClose }) => {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [toast, onClose]);

  if (!toast) return null;
  return (
    <div className={`fixed top-6 right-6 z-[200] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border text-sm font-bold animate-in slide-in-from-top-2 duration-300 ${
      toast.type === 'success'
        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
        : 'bg-red-50 border-red-200 text-red-600'
    }`}>
      {toast.type === 'success'
        ? <CheckCircleIcon className="h-5 w-5 text-emerald-500 shrink-0" />
        : <ExclamationCircleIcon className="h-5 w-5 text-red-400 shrink-0" />}
      {toast.message}
      <button onClick={onClose} className="ml-2 opacity-50 hover:opacity-100">
        <XMarkIcon className="h-4 w-4" />
      </button>
    </div>
  );
};

// ── Force du mot de passe ──────────────────────────────────────────────────
const PasswordStrength = ({ password }) => {
  const score = useCallback(() => {
    if (!password) return 0;
    let s = 0;
    if (password.length >= 8)  s++;
    if (password.length >= 12) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  }, [password])();

  const levels = [
    { label: 'Très faible', color: 'bg-red-500' },
    { label: 'Faible',      color: 'bg-orange-400' },
    { label: 'Moyen',       color: 'bg-amber-400' },
    { label: 'Fort',        color: 'bg-teal-500' },
    { label: 'Très fort',   color: 'bg-emerald-500' },
  ];
  const level = levels[Math.min(score - 1, 4)] ?? { label: '', color: 'bg-slate-200' };

  if (!password) return null;
  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${i <= score ? level.color : 'bg-slate-200'}`} />
        ))}
      </div>
      <p className={`text-[10px] font-black ${score >= 4 ? 'text-emerald-600' : score >= 3 ? 'text-amber-600' : 'text-red-500'}`}>
        {level.label}
      </p>
    </div>
  );
};

// ── Champ éditable inline ──────────────────────────────────────────────────
const Field = ({ label, value, icon: Icon, editing, name, onChange, type = 'text', options, multiline, placeholder }) => {
  const inp = 'w-full bg-white dark:bg-slate-800 border border-teal-300 dark:border-teal-600 rounded-xl px-3 py-2 text-sm font-medium dark:text-white outline-none focus:ring-2 focus:ring-teal-500 transition-all';

  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
        {Icon && <Icon className="h-3 w-3" />}{label}
      </label>
      {editing ? (
        options ? (
          <select name={name} value={value ?? ''} onChange={onChange} className={inp}>
            <option value="">— Sélectionner —</option>
            {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        ) : multiline ? (
          <textarea name={name} value={value ?? ''} onChange={onChange} rows={4}
            className={inp} placeholder={placeholder} />
        ) : (
          <input type={type} name={name} value={value ?? ''} onChange={onChange}
            className={inp} placeholder={placeholder} />
        )
      ) : (
        <p className={`text-sm font-bold dark:text-white ${!value ? 'text-slate-400 italic' : ''}`}>
          {value || 'Non renseigné'}
        </p>
      )}
    </div>
  );
};

// ── Page principale ────────────────────────────────────────────────────────
const UserProfilePage = () => {
  const { t } = useTranslation();
  const { user: authUser, updateUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [profile, setProfile]         = useState(null);
  const [loading, setLoading]         = useState(true);
  const [activeTab, setActiveTab]     = useState('info');
  const [editing, setEditing]         = useState(false);
  const [formData, setFormData]       = useState({});
  const [saving, setSaving]           = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [toast, setToast]             = useState(null);
  const [apiErrors, setApiErrors]     = useState({});

  // Sécurité
  const [pwForm, setPwForm]           = useState({ current_password: '', new_password: '', new_password_confirmation: '' });
  const [pwSaving, setPwSaving]       = useState(false);
  const [showPw, setShowPw]           = useState({ current: false, new: false, confirm: false });
  const [pwErrors, setPwErrors]       = useState({});

  const showToast = (message, type = 'success') => setToast({ message, type });

  // Charger le profil depuis l'API
  useEffect(() => {
    const load = async () => {
      try {
        const data = await getProfile();
        setProfile(data);
        setFormData(data);
      } catch {
        // fallback localStorage
        const u = JSON.parse(localStorage.getItem('brn_user') || '{}');
        setProfile(u);
        setFormData(u);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setApiErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleSave = async () => {
    setSaving(true);
    setApiErrors({});
    try {
      const res = await updateProfile(formData);
      const updated = res.user ?? res;
      setProfile(updated);
      setFormData(updated);
      updateUser(updated);
      setEditing(false);
      showToast('Profil mis à jour avec succès !');
    } catch (err) {
      const errors = err.response?.data?.errors ?? {};
      const msg = err.response?.data?.message ?? 'Erreur lors de la mise à jour.';
      setApiErrors(errors);
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(profile);
    setEditing(false);
    setApiErrors({});
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarLoading(true);
    try {
      const res = await updateAvatar(file);
      setProfile(prev => ({ ...prev, avatar_url: res.avatar_url, profile_picture: res.avatar_url }));
      updateUser({ profile_picture: res.avatar_url, avatar_url: res.avatar_url });
      showToast('Photo de profil mise à jour !');
    } catch {
      showToast('Erreur lors de l\'upload de la photo.', 'error');
    } finally {
      setAvatarLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwForm.new_password !== pwForm.new_password_confirmation) {
      setPwErrors({ new_password_confirmation: ['Les mots de passe ne correspondent pas.'] });
      return;
    }
    setPwSaving(true);
    setPwErrors({});
    try {
      await updatePassword(pwForm);
      setPwForm({ current_password: '', new_password: '', new_password_confirmation: '' });
      showToast('Mot de passe modifié avec succès !');
    } catch (err) {
      const errors = err.response?.data?.errors ?? {};
      const msg = err.response?.data?.message ?? 'Erreur lors du changement de mot de passe.';
      setPwErrors(errors);
      showToast(msg, 'error');
    } finally {
      setPwSaving(false);
    }
  };

  const avatarSrc = profile?.avatar_url || profile?.profile_picture;
  const displayName = [profile?.prenom, profile?.name].filter(Boolean).join(' ') || 'Formateur';
  const initials = displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const tabs = [
    { id: 'info',       label: t('common.information'),  icon: UserCircleIcon },
    { id: 'pro',        label: t('common.pro_tab'),       icon: BriefcaseIcon },
    { id: 'security',  label: t('common.security'),      icon: ShieldCheckIcon },
  ];

  const domaines = [
    'Informatique & Tech', 'Management', 'Finance', 'Marketing', 'Langues',
    'Ressources humaines', 'Design', 'Soft Skills', 'Juridique', 'Santé', 'Autre',
  ].map(d => ({ value: d, label: d }));

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0b0f19] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-4 border-teal-500 border-t-transparent animate-spin" />
          <p className="text-sm font-bold text-slate-400">{t('common.loading_profile')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0b0f19] font-['Inter']">
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
            <ArrowLeftIcon className="h-5 w-5 text-slate-500" />
          </button>
          <div>
            <h1 className="text-lg font-black text-slate-900 dark:text-white">{t('common.profile_page_title')}</h1>
            <p className="text-xs text-slate-400">{t('common.profile_page_sub')}</p>
          </div>
        </div>
        {activeTab !== 'security' && (
          editing ? (
            <div className="flex items-center gap-3">
              <button onClick={handleCancel}
                className="flex items-center gap-2 px-4 py-2.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-sm font-bold transition-colors">
                <XMarkIcon className="h-4 w-4" />{t('common.cancel')}
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-black hover:bg-teal-700 disabled:opacity-60 transition-colors shadow-lg shadow-teal-500/20">
                <CheckIcon className="h-4 w-4" />
                {saving ? t('common.saving') : t('common.save')}
              </button>
            </div>
          ) : (
            <button onClick={() => setEditing(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-black text-slate-600 dark:text-slate-300 hover:border-teal-300 hover:text-teal-600 transition-all">
              <PencilSquareIcon className="h-4 w-4" />{t('common.edit')}
            </button>
          )
        )}
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-4 gap-8">

        {/* ── Sidebar identité ────────────────────────────────────────────── */}
        <aside className="lg:col-span-1 flex flex-col gap-5">

          {/* Avatar */}
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 p-6 flex flex-col items-center gap-4 shadow-sm">
            <div className="relative group">
              {avatarSrc ? (
                <img src={avatarSrc} alt="avatar"
                  className="h-24 w-24 rounded-2xl object-cover border-2 border-slate-100 dark:border-slate-700" />
              ) : (
                <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-teal-500/20">
                  {initials}
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarLoading}
                className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                {avatarLoading
                  ? <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <CameraIcon className="h-6 w-6 text-white" />}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>
            <div className="text-center">
              <p className="text-base font-black dark:text-white leading-tight">{displayName}</p>
              <p className="text-xs text-slate-400 mt-0.5">{profile?.email}</p>
              <span className="inline-block mt-2 px-3 py-1 bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 text-[10px] font-black rounded-lg uppercase tracking-widest border border-teal-100 dark:border-teal-800">
                {profile?.role ?? 'Formateur'}
              </span>
            </div>
          </div>

          {/* Stats rapides */}
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 p-5 shadow-sm space-y-4">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Infos rapides</p>
            {[
              { label: 'Domaine',      value: profile?.domaine ?? '—',            icon: AcademicCapIcon },
              { label: 'Expérience',   value: profile?.annees_experience ? `${profile.annees_experience} ans` : '—', icon: StarIcon },
              { label: 'Ville',        value: profile?.ville ?? '—',              icon: MapPinIcon },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="h-8 w-8 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-slate-400" />
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-tight">{label}</p>
                  <p className="text-xs font-bold dark:text-white truncate max-w-[130px]">{value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation */}
          <nav className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 p-2 shadow-sm">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => { setActiveTab(tab.id); setEditing(false); setApiErrors({}); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                  activeTab === tab.id
                    ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400'
                    : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}>
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* ── Contenu principal ────────────────────────────────────────────── */}
        <main className="lg:col-span-3 space-y-6">

          {/* ── Onglet Informations personnelles ── */}
          {activeTab === 'info' && (
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 p-8 shadow-sm animate-in fade-in duration-300">
              <h2 className="text-base font-black dark:text-white mb-6 pb-4 border-b border-slate-50 dark:border-slate-800">
                {t('common.personal_info_section')}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field label="Prénom"         value={editing ? formData.prenom    : profile?.prenom}     name="prenom"         icon={UserCircleIcon} editing={editing} onChange={handleChange} placeholder="Votre prénom" />
                <Field label="Nom"            value={editing ? formData.name      : profile?.name}       name="name"           icon={UserCircleIcon} editing={editing} onChange={handleChange} placeholder="Votre nom" />
                <Field label="Email"          value={editing ? formData.email     : profile?.email}      name="email"          icon={EnvelopeIcon}   editing={editing} onChange={handleChange} type="email" placeholder="votre@email.com" />
                <Field label="Téléphone"      value={editing ? formData.phone     : profile?.phone}      name="phone"          icon={PhoneIcon}      editing={editing} onChange={handleChange} type="tel" placeholder="+213 6XX XXX XXX" />
                <Field label="Date de naissance" value={editing ? formData.date_naissance : profile?.date_naissance} name="date_naissance" icon={CalendarIcon} editing={editing} onChange={handleChange} type="date" />
                <Field label="Genre"          value={editing ? formData.genre     : profile?.genre}      name="genre"          icon={UserCircleIcon} editing={editing} onChange={handleChange}
                  options={[{ value: 'M', label: 'Masculin' }, { value: 'F', label: 'Féminin' }, { value: 'Autre', label: 'Autre' }]} />
                <Field label="Ville"          value={editing ? formData.ville     : profile?.ville}      name="ville"          icon={MapPinIcon}     editing={editing} onChange={handleChange} placeholder="Ex: Alger, Oran…" />
                <Field label="Adresse"        value={editing ? formData.adresse   : profile?.adresse}    name="adresse"        icon={MapPinIcon}     editing={editing} onChange={handleChange} placeholder="Votre adresse complète" />
              </div>

              {/* Erreurs API */}
              {Object.keys(apiErrors).length > 0 && (
                <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-2xl space-y-1">
                  {Object.entries(apiErrors).map(([field, msgs]) => (
                    <p key={field} className="text-xs text-red-600 font-bold">
                      <span className="capitalize">{field}</span> : {Array.isArray(msgs) ? msgs[0] : msgs}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Onglet Profil professionnel ── */}
          {activeTab === 'pro' && (
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 p-8 shadow-sm animate-in fade-in duration-300">
              <h2 className="text-base font-black dark:text-white mb-6 pb-4 border-b border-slate-50 dark:border-slate-800">
                {t('common.pro_info_section')}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field label="Domaine d'expertise" value={editing ? formData.domaine : profile?.domaine} name="domaine"
                  icon={AcademicCapIcon} editing={editing} onChange={handleChange} options={domaines} />
                <Field label="Spécialité"       value={editing ? formData.specialite       : profile?.specialite}       name="specialite"       icon={AcademicCapIcon}  editing={editing} onChange={handleChange} placeholder="Ex: React, Machine Learning…" />
                <Field label="Années d'expérience" value={editing ? formData.annees_experience : profile?.annees_experience} name="annees_experience" icon={StarIcon} editing={editing} onChange={handleChange} type="number" placeholder="0" />
                <Field label="LinkedIn"         value={editing ? formData.linkedin         : profile?.linkedin}         name="linkedin"         icon={LinkIcon}         editing={editing} onChange={handleChange} type="url" placeholder="https://linkedin.com/in/..." />
              </div>
              <div className="mt-6">
                <Field label="Bio / Présentation" value={editing ? formData.bio : profile?.bio} name="bio"
                  icon={BriefcaseIcon} editing={editing} onChange={handleChange} multiline
                  placeholder="Décrivez votre parcours, vos expertises et votre approche pédagogique…" />
              </div>

              {Object.keys(apiErrors).length > 0 && (
                <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-2xl space-y-1">
                  {Object.entries(apiErrors).map(([field, msgs]) => (
                    <p key={field} className="text-xs text-red-600 font-bold">
                      <span className="capitalize">{field}</span> : {Array.isArray(msgs) ? msgs[0] : msgs}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Onglet Sécurité ── */}
          {activeTab === 'security' && (
            <div className="space-y-6 animate-in fade-in duration-300">

              {/* Changer le mot de passe */}
              <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-50 dark:border-slate-800">
                  <div className="h-10 w-10 bg-teal-50 dark:bg-teal-900/30 rounded-xl flex items-center justify-center">
                    <LockClosedIcon className="h-5 w-5 text-teal-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-black dark:text-white">{t('common.security_section')}</h2>
                    <p className="text-xs text-slate-400">{t('common.security_section_hint')}</p>
                  </div>
                </div>

                <form onSubmit={handlePasswordChange} className="space-y-5 max-w-md">
                  {/* Mot de passe actuel */}
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
                      {t('common.current_password')}
                    </label>
                    <div className="relative">
                      <input
                        type={showPw.current ? 'text' : 'password'}
                        value={pwForm.current_password}
                        onChange={e => { setPwForm(p => ({ ...p, current_password: e.target.value })); setPwErrors({}); }}
                        className={`w-full pr-10 pl-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm font-medium outline-none focus:ring-2 border ${
                          pwErrors.current_password ? 'border-red-400 focus:ring-red-400' : 'border-slate-200 dark:border-slate-700 focus:ring-teal-500'
                        } dark:text-white`}
                        placeholder="••••••••"
                      />
                      <button type="button" onClick={() => setShowPw(p => ({ ...p, current: !p.current }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showPw.current ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                      </button>
                    </div>
                    {pwErrors.current_password && (
                      <p className="text-[11px] text-red-500 font-bold mt-1">{pwErrors.current_password[0]}</p>
                    )}
                  </div>

                  {/* Nouveau mot de passe */}
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
                      {t('common.new_password')}
                    </label>
                    <div className="relative">
                      <input
                        type={showPw.new ? 'text' : 'password'}
                        value={pwForm.new_password}
                        onChange={e => setPwForm(p => ({ ...p, new_password: e.target.value }))}
                        className="w-full pr-10 pl-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-teal-500 dark:text-white"
                        placeholder="••••••••"
                      />
                      <button type="button" onClick={() => setShowPw(p => ({ ...p, new: !p.new }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showPw.new ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                      </button>
                    </div>
                    <PasswordStrength password={pwForm.new_password} />
                    {pwErrors.new_password && (
                      <p className="text-[11px] text-red-500 font-bold mt-1">{pwErrors.new_password[0]}</p>
                    )}
                  </div>

                  {/* Confirmation */}
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
                      {t('common.confirm_password')}
                    </label>
                    <div className="relative">
                      <input
                        type={showPw.confirm ? 'text' : 'password'}
                        value={pwForm.new_password_confirmation}
                        onChange={e => setPwForm(p => ({ ...p, new_password_confirmation: e.target.value }))}
                        className={`w-full pr-10 pl-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm font-medium outline-none focus:ring-2 border ${
                          pwErrors.new_password_confirmation ? 'border-red-400 focus:ring-red-400' : 'border-slate-200 dark:border-slate-700 focus:ring-teal-500'
                        } dark:text-white`}
                        placeholder="••••••••"
                      />
                      <button type="button" onClick={() => setShowPw(p => ({ ...p, confirm: !p.confirm }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showPw.confirm ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                      </button>
                    </div>
                    {pwForm.new_password_confirmation && pwForm.new_password !== pwForm.new_password_confirmation && (
                      <p className="text-[11px] text-red-500 font-bold mt-1">{t('common.password_mismatch')}</p>
                    )}
                    {pwErrors.new_password_confirmation && (
                      <p className="text-[11px] text-red-500 font-bold mt-1">{pwErrors.new_password_confirmation[0]}</p>
                    )}
                  </div>

                  <button type="submit" disabled={pwSaving || !pwForm.current_password || !pwForm.new_password || !pwForm.new_password_confirmation}
                    className="w-full py-3.5 bg-teal-600 text-white rounded-2xl font-black text-sm hover:bg-teal-700 disabled:opacity-50 transition-colors shadow-lg shadow-teal-500/20">
                    {pwSaving ? t('common.pw_changing') : t('common.change_password')}
                  </button>
                </form>
              </div>

              {/* Informations de sécurité */}
              <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 p-8 shadow-sm">
                <h3 className="text-sm font-black dark:text-white mb-5">{t('common.security_info')}</h3>
                <div className="space-y-4">
                  {[
                    { label: t('common.login_email'),    value: profile?.email, icon: EnvelopeIcon, color: 'text-indigo-500' },
                    { label: t('common.role'),           value: profile?.role,  icon: ShieldCheckIcon, color: 'text-teal-500' },
                    { label: t('common.account_status'), value: profile?.status ?? t('common.active'), icon: CheckCircleIcon, color: 'text-emerald-500' },
                    { label: t('common.account_created'), value: profile?.created_at ? new Date(profile.created_at).toLocaleDateString(undefined, { day: '2-digit', month: 'long', year: 'numeric' }) : '—', icon: CalendarIcon, color: 'text-slate-400' },
                  ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="flex items-center justify-between py-3 border-b border-slate-50 dark:border-slate-800 last:border-0">
                      <div className="flex items-center gap-3">
                        <Icon className={`h-4 w-4 ${color}`} />
                        <span className="text-xs font-bold text-slate-500">{label}</span>
                      </div>
                      <span className="text-xs font-black dark:text-white">{value ?? '—'}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bonnes pratiques */}
              <div className="bg-gradient-to-br from-teal-600/10 to-indigo-600/10 rounded-[2.5rem] border border-teal-500/10 p-6">
                <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest mb-3">{t('common.best_practices')}</p>
                <ul className="space-y-2">
                  {[
                    'Utilisez un mot de passe unique, jamais réutilisé sur d\'autres sites',
                    'Minimum 8 caractères avec majuscules, minuscules et chiffres',
                    'Ne partagez jamais votre mot de passe avec quelqu\'un',
                    'Changez votre mot de passe tous les 3 mois',
                  ].map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                      <CheckCircleIcon className="h-4 w-4 text-teal-500 shrink-0 mt-0.5" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default UserProfilePage;
