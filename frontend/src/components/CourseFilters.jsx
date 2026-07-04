import React from 'react';
import { useTranslation } from '../context/LanguageContext';
import './CourseFilters.css';

const CourseFilters = ({ activeCat, setActiveCat, activeLevel, setActiveLevel, searchQuery, setSearchQuery }) => {
  const { t } = useTranslation();

  const categories = [
    { id: 'all', label: t('common.all_f'), icon: '✨' },
    { id: 'Informatique', label: t('common.cat_it'), icon: '💻' },
    { id: 'Management', label: t('common.cat_management'), icon: '📊' },
    { id: 'Design', label: t('common.cat_design'), icon: '🎨' },
  ];

  const levels = [
    { id: 'all', label: t('common.all_levels') },
    { id: 'Débutant', label: t('common.opt_beginner') },
    { id: 'Intermédiaire', label: t('common.opt_intermediate') },
    { id: 'Avancé', label: t('common.opt_advanced') },
  ];

  return (
    <div className="smart-filters">
      <div className="search-glass-wrapper">
        <div className="search-glass">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder={t('common.search_skill_placeholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="filter-row">
        <div className="cat-pills">
          {categories.map(cat => (
            <button
              key={cat.id}
              className={`cat-pill ${activeCat === cat.id ? 'active' : ''}`}
              onClick={() => setActiveCat(cat.id)}
            >
              <span className="cat-pill__icon">{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>

        <div className="level-select">
          <span className="level-label">{t('common.filter_level_label')}</span>
          {levels.map(lvl => (
            <button
              key={lvl.id}
              className={`level-btn ${activeLevel === lvl.id ? 'active' : ''}`}
              onClick={() => setActiveLevel(lvl.id)}
            >
              {lvl.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CourseFilters;
