// src/pages/Trainer/MesFormations/FormateurMesFormations.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../../context/LanguageContext';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  SunIcon,
  MoonIcon,
  BellIcon,
  TableCellsIcon,
  Squares2X2Icon,
  ArrowDownTrayIcon,
  SparklesIcon,
  CpuChipIcon,
  ArrowRightIcon,
  CommandLineIcon,
  InboxIcon,
} from '@heroicons/react/24/outline';
import { StatsStrip, ObjectiveProgressBar } from './components/StatsStrip';
import { FormationCard } from './components/FormationCard';
import { LoadingSkeleton } from './components/LoadingSkeleton';
import {
  FormationFormModal,
  CandidatsDrawer,
  ConfirmModal,
} from './components/Modals';
import { mockIARecommendations } from './mockData';
import { AgendaWidget } from './components/AgendaWidget';
import { useAuth } from '../../../context/AuthContext';
import { fetchFormations, deleteFormation, createFormation, updateFormation, fetchFormationStats, exportFormationsCSV, fetchFormateuresDemandes } from '../../../services/Formationservice';

const FormateurMesFormations = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading]                   = useState(true);
  const [searchTerm, setSearchTerm]             = useState('');
  const [activeTab, setActiveTab]               = useState('Toutes');
  const [activeLevel, setActiveLevel]           = useState('Tous');
  const [sortBy, setSortBy]                     = useState('Plus récente');
  const [isDarkMode, setIsDarkMode]             = useState(false);
  const [viewMode, setViewMode]                 = useState('grid');
  const [selectedFormations, setSelectedFormations] = useState([]);
  const [pinnedFormations, setPinnedFormations] = useState([]);
  const [focusFormation, setFocusFormation]     = useState(null);

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen]       = useState(false);
  const [isDrawerOpen, setIsDrawerOpen]             = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [activeFormation, setActiveFormation]       = useState(undefined);

  // ── LIAISON BACKEND : state formations réelles ──
  const [formations, setFormations] = useState([]);
  const [drawerFormationId, setDrawerFormationId] = useState(null);   // id pour CandidatsDrawer
  const [deletingFormation, setDeletingFormation] = useState(null);   // formation à supprimer
  const [stats, setStats] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);

  // Transformation Laravel → format composant
  const mapFormation = (f) => ({
    id:          f.id,
    titre:       f.titre       || f.title        || 'Sans titre',
    description: f.description || '',
    formateur:   f.formateur?.name || f.nom_formateur || 'Non assigné',
    stagiaires:  f.stagiaires_count || f.stagiaires   || 0,
    statut:      f.statut      || f.status        || 'attente',
    color:       (f.statut || f.status) === 'publiée' ? '#27ae60' : '#f39c12',
    duree:       f.duree       || f.duration      || 'N/A',
    prix:        f.prix        || f.price         || 'N/A',
    domaine:     f.domaine     || f.domain        || 'Général',
    categorie:   f.categorie   || f.category      || 'Non catégorisé',
    image:       f.image       || null,
    date_debut:   f.date_debut  || null,
    date_fin:     f.date_fin    || null,
    dateCreation: f.date_debut  || f.created_at || new Date().toISOString(),
    note:        f.note        || 0,
    niveau:      f.niveau      || f.level         || 'Débutant',
    isPinned:    false,
  });
  // ── GET /app/formations ──
  const user_I = JSON.parse(localStorage.getItem('brn_user') || '{}');
  const loadFormations = async () => {
    setLoading(true);
    try {
      const data = await fetchFormations(user_I.id);
      const mapped = Array.isArray(data) ? data.map(mapFormation) : (data.data ?? []).map(mapFormation);
      setFormations(mapped);
    } catch (error) {
      console.error('Erreur chargement formations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await fetchFormationStats(user_I.id);
      setStats(data);
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    }
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 'f') { e.preventDefault(); document.getElementById('search-input')?.focus(); }
      if (e.ctrlKey && e.key === 'n') { e.preventDefault(); setIsFormModalOpen(true); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const loadPendingCount = async () => {
    try {
      const data = await fetchFormateuresDemandes(user_I.id);
      const count = (Array.isArray(data) ? data : []).filter(d => !d.vue_formateur && d.statut === 'en_attente').length;
      setPendingCount(count);
    } catch { /* silencieux */ }
  };

  // Chargement formations + stats + demandes en attente au montage
  useEffect(() => { loadFormations(); loadStats(); loadPendingCount(); }, []);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDarkMode ? 'light' : 'dark');
  };
  // ── CREATE / UPDATE → appelé par FormationFormModal via onSaved ──
  const handleSaved = (savedFormation) => {
    const mapped = mapFormation(savedFormation);
    setFormations(prev => {
      const exists = prev.find(f => f.id === mapped.id);
      if (exists) {
        return prev.map(f => f.id === mapped.id ? mapped : f);
      } else {
        return [mapped, ...prev];
      }
    });
    setActiveFormation(undefined);
    loadStats();
  };

  // ── DELETE → appelé par ConfirmModal via onDeleted ──
  const handleDeleted = (id) => {
    setFormations(prev => prev.filter(f => f.id !== id));
    setDeletingFormation(null);
    loadStats();
  };

  // ── Filtrage & tri sur les données réelles ──
  const filteredFormations = useMemo(() => {
    let result = [...formations];

    if (searchTerm) {
      result = result.filter(f =>
        f.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.domaine.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (activeTab !== 'Toutes') result = result.filter(f => f.statut === activeTab);
    if (activeLevel !== 'Tous') result = result.filter(f => f.niveau === activeLevel);

    result.sort((a, b) => {
      const aPinned = pinnedFormations.includes(a.id);
      const bPinned = pinnedFormations.includes(b.id);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      if (sortBy === 'Plus récente') return new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime();
      if (sortBy === 'Note') return b.note - a.note;
      return 0;
    });
    return result;
  }, [formations, searchTerm, activeTab, activeLevel, sortBy, pinnedFormations]);

  // ── Compteurs calculés depuis les données réelles ──
  const counts = useMemo(() => ({
    Toutes:     formations.length,
    'En cours': formations.filter(f => f.statut === 'En cours').length,
    Brouillon:  formations.filter(f => f.statut === 'Brouillon').length,
    Archivées:  formations.filter(f => f.statut === 'Fermée').length,
  }), [formations]);


  if (focusFormation) {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-10 animate-in fade-in zoom-in duration-500">
        <button onClick={() => setFocusFormation(null)} className="mb-10 text-teal-400 font-black uppercase text-xs tracking-widest flex items-center">
          <ArrowRightIcon className="h-4 w-4 mr-2 rotate-180" /> Quitter le mode Focus
        </button>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-black mb-4">{focusFormation.titre}</h1>
          <p className="text-xl text-slate-400 mb-10">{focusFormation.domaine} • {focusFormation.niveau}</p>
          <div className="grid grid-cols-3 gap-10">
            <div className="bg-slate-800 p-8 rounded-[3rem] border border-white/5">
              <p className="text-sm font-bold text-slate-500 mb-2 uppercase tracking-widest">Prix</p>
              <p className="text-4xl font-black text-teal-500">{focusFormation.prix} DZD</p>
            </div>
            <div className="bg-slate-800 p-8 rounded-[3rem] border border-white/5">
              <p className="text-sm font-bold text-slate-500 mb-2 uppercase tracking-widest">Inscrits</p>
              <p className="text-4xl font-black">{focusFormation.stagiaires}</p>
            </div>
            <div className="bg-slate-800 p-8 rounded-[3rem] border border-white/5">
              <p className="text-sm font-bold text-slate-500 mb-2 uppercase tracking-widest">Note</p>
              <p className="text-4xl font-black text-amber-400">{focusFormation.note > 0 ? `${focusFormation.note}/5` : '—'}</p>
            </div>
          </div>
          <div className="mt-10 bg-slate-800 p-10 rounded-[4rem] border border-white/5">
            <h2 className="text-2xl font-black mb-6">Détails Immersifs</h2>
            <p className="text-slate-400 leading-relaxed mb-8">
              Contenu complet, liste des candidats et planning détaillé chargés dynamiquement...
            </p>
            <button className="px-10 py-4 bg-teal-600 rounded-2xl font-black uppercase text-xs tracking-widest">{t('common.manage_content')}</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0b0f19] transition-colors duration-700 font-['Inter']">
      
      <div className="flex flex-col lg:flex-row min-h-screen">
        
        {/* --- SIDEBAR --- */}
        <aside className="w-full lg:w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-8 flex flex-col gap-8 sticky top-0 h-screen overflow-y-auto">
          <div className="flex items-center gap-3 px-2">
            <div className="h-10 w-10 bg-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-600/20">
              <CommandLineIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-[9px] font-black text-teal-600 dark:text-teal-400 uppercase tracking-widest leading-none mb-1">Maestro v4.0</p>
              <h2 className="text-sm font-black dark:text-white uppercase tracking-tighter">Trainer Command</h2>
            </div>
          </div>

          <nav className="space-y-8">

            {/* Lien Demandes avec badge */}
            <button
              onClick={() => navigate('/dashboard/formateur/demandes')}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-all group"
            >
              <div className="flex items-center gap-2">
                <InboxIcon className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-black text-amber-700 dark:text-amber-400">Demandes reçues</span>
              </div>
              {pendingCount > 0 && (
                <span className="text-[10px] font-black bg-amber-500 text-white px-2 py-0.5 rounded-full animate-pulse">
                  {pendingCount}
                </span>
              )}
            </button>

            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-2">Bibliothèque</p>
              <div className="flex flex-col gap-1">
                {['Toutes', 'En cours', 'Brouillon', 'Archivées'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`group flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                      activeTab === tab 
                        ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 border border-teal-100 dark:border-teal-800' 
                        : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>{tab}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-lg ${activeTab === tab ? 'bg-teal-600 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>
                      {counts[tab]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* AI Widget */}
            <div className="bg-gradient-to-br from-teal-600/10 to-indigo-600/10 p-5 rounded-3xl border border-teal-500/10">
              <div className="flex items-center gap-2 mb-3">
                <SparklesIcon className="h-4 w-4 text-teal-600" />
                <span className="text-[10px] font-black text-teal-600 uppercase tracking-widest">Recommandations IA</span>
              </div>
              <div className="space-y-3">
                {mockIARecommendations.map(rec => (
                  <div key={rec.id} className="group cursor-pointer">
                    <p className="text-[11px] font-bold dark:text-white line-clamp-1 group-hover:text-teal-500 transition-colors">{rec.titre}</p>
                    <p className="text-[9px] text-teal-600 font-black uppercase tracking-tighter">{rec.score}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Agenda dynamique */}
            <AgendaWidget formations={formations} />
          </nav>

          <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-slate-400">
              <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 text-[9px] font-black">Ctrl+F</kbd>
              <span className="text-[9px] font-bold uppercase tracking-tighter">Recherche Rapide</span>
            </div>
          </div>
        </aside>

        {/* --- MAIN DASHBOARD --- */}
        <main className="flex-1 flex flex-col min-h-screen">
          
          <header className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 p-6 flex items-center justify-between sticky top-0 z-40">
            <div className="flex items-center gap-6">
              <div className="relative group">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-teal-500" />
                <input 
                  id="search-input"
                  type="text" 
                  placeholder="Rechercher une formation..." 
                  className="bg-slate-100 dark:bg-slate-800 border-none rounded-2xl py-3 pl-12 pr-6 text-sm font-bold w-96 focus:ring-2 focus:ring-teal-500 outline-none dark:text-white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-700">
                <CpuChipIcon className="h-3.5 w-3.5 text-teal-500" />
                <span>vs Moyenne Plateforme: <span className="text-emerald-500">+0.3</span></span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button onClick={toggleTheme} className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:scale-110 transition-all border border-slate-200 dark:border-slate-700">
                {isDarkMode ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
              </button>
              <div className="relative group">
                <button className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700">
                  <BellIcon className="h-5 w-5" />
                  <span className="absolute top-2.5 right-2.5 h-2 w-2 bg-rose-500 rounded-full border-2 border-white dark:border-slate-800"></span>
                </button>
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[8px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Alt+N Notifications</span>
              </div>
              <button 
                onClick={() => { setActiveFormation(undefined); setIsFormModalOpen(true); }}
                className="group flex items-center px-6 py-3 bg-teal-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.1em] hover:bg-teal-500 transition-all shadow-xl shadow-teal-600/20"
              >
                <PlusIcon className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform" />
                Nouveau Module
              </button>
            </div>
          </header>

          <div className="p-10 flex-1 overflow-y-auto">
            
            <section className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-12">
              <div className="lg:col-span-3">
                <StatsStrip stats={stats} />
              </div>
              <div className="lg:col-span-1 h-full">
                <ObjectiveProgressBar progress={stats?.taux_actif ?? 0} />
              </div>
            </section>

            <div className="flex items-center justify-between mb-8 px-2">
              <div className="flex items-center gap-3">
                <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{activeTab}</h2>
                <div className="h-2 w-2 rounded-full bg-teal-500"></div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 shadow-sm text-teal-600' : 'text-slate-400'}`}><Squares2X2Icon className="h-4 w-4" /></button>
                  <button onClick={() => setViewMode('large')} className={`p-2 rounded-lg transition-all ${viewMode === 'large' ? 'bg-white dark:bg-slate-700 shadow-sm text-teal-600' : 'text-slate-400'}`}><TableCellsIcon className="h-4 w-4" /></button>
                </div>
                <button
                  onClick={() => exportFormationsCSV(user_I.id)}
                  className="flex items-center px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-teal-50 hover:text-teal-600 hover:border-teal-200 transition-all"
                  title="Télécharger un CSV complet de vos formations"
                >
                  <ArrowDownTrayIcon className="h-4 w-4 mr-2" /> {t('common.export_csv')}
                </button>
              </div>
            </div>

            <div className="relative">
              {loading ? (
                <LoadingSkeleton />
              ) : (
                <div className={`grid gap-8 ${viewMode === 'large' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
                  {filteredFormations.length === 0 && (
                    <div className="col-span-3 text-center py-20 text-slate-400 text-sm font-bold">
                      {t('common.no_formation')}
                    </div>
                  )}
                  {filteredFormations.map((formation) => (
                    <FormationCard 
                      key={formation.id} 
                      formation={{ ...formation, isPinned: pinnedFormations.includes(formation.id) }} 
                      isSelected={selectedFormations.includes(formation.id)}
                      onToggleSelect={(id) => setSelectedFormations(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
                      onTogglePin={(id) => setPinnedFormations(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
                      onEdit={(id) => {
                        // ── Ouvre le modal édition avec la formation réelle ──
                        setActiveFormation(formations.find(f => f.id === id));
                        setIsFormModalOpen(true);
                      }}
                      onCandidats={(id) => {
                        // ── Ouvre le drawer avec l'id réel pour GET /candidats ──
                        setDrawerFormationId(id);
                        setIsDrawerOpen(true);
                      }}
                      onArchive={(id) => {
                        // ── Ouvre le modal confirmation avec la formation réelle ──
                        setDeletingFormation(formations.find(f => f.id === id));
                        setIsConfirmModalOpen(true);
                      }}
                      onShare={() => alert("Lien copié !")}
                      onFocus={(id) => setFocusFormation(formations.find(f => f.id === id))}
                    />
                  ))}
                </div>
              )}
            </div>

          </div>
        </main>
      </div>

      {/* ── Modals — avec props backend branchées ── */}

      {/* CREATE / UPDATE → onSaved met à jour la liste */}
      <FormationFormModal
        isOpen={isFormModalOpen}
        onClose={() => { setIsFormModalOpen(false); setActiveFormation(undefined); }}
        formation={activeFormation}
        onSaved={handleSaved}
      />

      {/* CANDIDATS → formationId réel passé au drawer */}
      <CandidatsDrawer
        isOpen={isDrawerOpen}
        onClose={() => { setIsDrawerOpen(false); setDrawerFormationId(null); }}
        formationId={drawerFormationId}
      />

      {/* DELETE → formationId + onDeleted retire de la liste */}
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => { setIsConfirmModalOpen(false); setDeletingFormation(null); }}
        title="Supprimer la formation"
        message={`Voulez-vous supprimer "${deletingFormation?.titre}" ? Cette action est irréversible.`}
        formationId={deletingFormation?.id}
        onDeleted={handleDeleted}
      />

    </div>
  );
};

export default FormateurMesFormations;


