// src/pages/Trainer/MesFormations/components/FormationCard.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../../../context/LanguageContext';
import { 
  EllipsisHorizontalIcon, 
  UserIcon, 
  StarIcon, 
  ClockIcon, 
  BookmarkIcon,
  PencilSquareIcon,
  DocumentDuplicateIcon,
  ArchiveBoxIcon,
  ShareIcon,
  EyeIcon,
  ChatBubbleBottomCenterIcon,
  MegaphoneIcon,
  ArrowTrendingUpIcon,
  ChartBarIcon,
  ArrowsPointingOutIcon
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkIconSolid, StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { useNavigate } from 'react-router-dom';
import { fetchCandidats } from '../../../../services/Formationservice';

export const FormationCard = ({ 
  formation, 
  onEdit, 
  onCandidats, 
  onDuplicate, 
  onArchive, 
  onShare,
  isSelected,
  onToggleSelect,
  onTogglePin,
  onFocus
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [studentsData, setStudentsData] = useState([]);
  const healthColor = formation.healthScore > 80 ? 'text-emerald-500' : formation.healthScore > 60 ? 'text-amber-500' : 'text-rose-500';
  useEffect(()=>{
   const getStudentsData = async () => {
      try {
         const Data = await fetchCandidats(formation.id);
         const mapped = Array.isArray(Data) ? Data : Data.data ?? [];
         setStudentsData(mapped);
      } catch (error) {
         console.error('Erreur lors de la récupération des données des étudiants :', error);
         
      }   
   }
   getStudentsData();
  },[]);

  return (
    <div 
      onClick={() => navigate(`/dashboard/formateur/formation/${formation.id}`)}
      className={`group relative bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 cursor-pointer transition-all duration-500 flex flex-col p-7 overflow-hidden ${
        isSelected 
          ? 'border-teal-500 shadow-2xl scale-[1.02]' 
          : 'border-transparent shadow-sm hover:shadow-2xl hover:border-slate-200 dark:hover:border-slate-700'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setShowMenu(false); }}
    >
      {/* Trending & Health Score Top */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-2">
           {formation.isTrending && (
              <span className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest animate-pulse border border-emerald-100 dark:border-emerald-800">
                <ArrowTrendingUpIcon className="h-3 w-3" /> {t('common.trending')}
              </span>
           )}
           <span className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
             formation.statut === 'En cours' ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-600 border-teal-100' : 'bg-slate-50 dark:bg-slate-800 text-slate-500'
           }`}>
             {formation.statut}
           </span>
        </div>
        <div className="flex items-center gap-2">
           <div className="text-right">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Health</p>
              <p className={`text-xs font-black ${healthColor}`}>{formation.healthScore}%</p>
           </div>
           <div className="relative h-8 w-8">
              <svg className="h-full w-full" viewBox="0 0 36 36">
                 <path className="text-slate-100 dark:text-slate-800" strokeWidth="3" fill="none" stroke="currentColor" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                 <path className={healthColor} strokeWidth="3" strokeDasharray={`${formation.healthScore}, 100`} strokeLinecap="round" fill="none" stroke="currentColor" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              </svg>
           </div>
        </div>
      </div>

      <div className="flex-1">
        <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight mb-1 group-hover:text-teal-600 transition-colors line-clamp-2">
          {formation.titre}
        </h3>
        <div className="flex items-center gap-3 mb-6">
           <p className="text-xs font-bold text-slate-400">{formation.domaine}</p>
           <div className="h-1 w-1 bg-slate-300 rounded-full"></div>
           <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest">vs BRN Avg: +0.2</p>
        </div>

        {/* Custom Goal Widget */}
        {formation.customGoal && (
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl mb-6 border border-slate-100 dark:border-slate-800">
             <div className="flex justify-between items-center mb-2">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{formation.customGoal.label}</span>
                <span className="text-[10px] font-black text-slate-900 dark:text-white">{Math.round((formation.customGoal.current / formation.customGoal.target) * 100)}%</span>
             </div>
             <div className="h-1 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-teal-500 transition-all duration-1000" style={{ width: `${(formation.customGoal.current / formation.customGoal.target) * 100}%` }}></div>
             </div>
          </div>
        )}

        {/* Stats Strip */}
        <div className="grid grid-cols-2 gap-6 mb-8">
           <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center text-indigo-600">
                 <UserIcon className="h-5 w-5" />
              </div>
              <div>
                 <p className="text-sm font-black dark:text-white leading-none">{studentsData.length}</p>
                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{t('common.enrolled')}</p>
              </div>
           </div>
           <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex items-center justify-center text-amber-500">
                 <StarIconSolid className="h-5 w-5" />
              </div>
              <div>
                 <p className="text-sm font-black dark:text-white leading-none">{formation.note || '-'}</p>
                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Score</p>
              </div>
           </div>
        </div>
      </div>

      {/* Action Icons Panel */}
      <div className="flex items-center justify-between border-t border-slate-50 dark:border-slate-800 pt-6 mb-6">
         <div className="flex gap-4">
            <button 
              onClick={(e) => { e.stopPropagation(); }}
              className="relative group/icon" title="Chat interne"
            >
               <ChatBubbleBottomCenterIcon className="h-5 w-5 text-slate-400 hover:text-teal-500 transition-colors" />
               <span className="absolute -top-1 -right-1 h-2 w-2 bg-teal-500 rounded-full border-2 border-white dark:border-slate-900"></span>
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); }}
              className="group/icon" title="Programmer annonce"
            >
               <MegaphoneIcon className="h-5 w-5 text-slate-400 hover:text-amber-500 transition-colors" />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onFocus(formation.id); }} 
              className="group/icon" title="Mode Focus"
            >
               <ArrowsPointingOutIcon className="h-5 w-5 text-slate-400 hover:text-indigo-500 transition-colors" />
            </button>
         </div>
         <div className="flex gap-2">
            <button 
              onClick={(e) => { e.stopPropagation(); onTogglePin(formation.id); }}
              className={`p-2 rounded-xl transition-all ${formation.isPinned ? 'text-amber-500' : 'text-slate-300 hover:text-slate-600 dark:hover:text-white'}`}
            >
              {formation.isPinned ? <BookmarkIconSolid className="h-5 w-5" /> : <BookmarkIcon className="h-5 w-5" />}
            </button>
            <div className="relative">
              <button 
                onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }} 
                className="p-2 text-slate-300 hover:text-slate-600 dark:hover:text-white transition-all"
              >
                <EllipsisHorizontalIcon className="h-6 w-6" />
              </button>
              {showMenu && (
                <div className="absolute right-0 bottom-10 w-48 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 py-2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <button onClick={(e) => { e.stopPropagation(); onEdit(formation.id); }} className="flex items-center w-full px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"><PencilSquareIcon className="h-4 w-4 mr-3" /> {t('common.edit')}</button>
                  <button onClick={(e) => { e.stopPropagation(); onDuplicate(formation.id); }} className="flex items-center w-full px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"><DocumentDuplicateIcon className="h-4 w-4 mr-3" /> {t('common.duplicate')}</button>
                  <button onClick={(e) => { e.stopPropagation(); onArchive(formation.id); }} className="flex items-center w-full px-4 py-2 text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20"><ArchiveBoxIcon className="h-4 w-4 mr-3" /> {t('common.archive')}</button>
                </div>
              )}
            </div>
         </div>
      </div>

      {/* Selection / Focus Toggle */}
      <button 
        onClick={(e) => { e.stopPropagation(); onToggleSelect(formation.id); }}
        className={`w-full py-4 rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all border ${
          isSelected 
          ? 'bg-teal-600 text-white border-teal-500 shadow-xl shadow-teal-600/20' 
          : 'bg-slate-900 text-white border-transparent hover:bg-teal-600 transition-all'
        }`}
      >
        {isSelected ? t('common.selected') : t('common.select').toUpperCase()}
      </button>

      {/* Mini Survey Mock */}
      {isHovered && !isSelected && (
        <div className="absolute inset-x-0 bottom-0 bg-teal-600 text-white p-4 flex items-center justify-between animate-in slide-in-from-bottom duration-500">
           <span className="text-[9px] font-black uppercase tracking-widest">Satisfait ?</span>
           <div className="flex gap-4">
              <button onClick={(e) => { e.stopPropagation(); alert('Merci !'); }} className="hover:scale-125 transition-transform">😊</button>
              <button onClick={(e) => { e.stopPropagation(); alert('Merci !'); }} className="hover:scale-125 transition-transform">😐</button>
              <button onClick={(e) => { e.stopPropagation(); alert('Merci !'); }} className="hover:scale-125 transition-transform">😞</button>
           </div>
        </div>
      )}
    </div>
  );
};


