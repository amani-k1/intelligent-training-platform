import React from 'react';
import { useTranslation } from '../context/LanguageContext';

const LanguageSwitcher = () => {
  const { lang, changeLanguage } = useTranslation();

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        background: 'rgba(0,0,0,0.06)',
        borderRadius: '999px',
        padding: '3px',
        marginLeft: '12px',
        border: '1px solid rgba(0,0,0,0.08)',
      }}
    >
      <button
        onClick={() => changeLanguage('fr')}
        title="Français"
        style={{
          fontSize: '11px',
          fontWeight: '900',
          letterSpacing: '0.08em',
          padding: '4px 10px',
          borderRadius: '999px',
          border: 'none',
          cursor: 'pointer',
          transition: 'all 0.2s',
          background: lang === 'fr' ? '#3baebdff' : 'transparent',
          color: lang === 'fr' ? '#fff' : '#555',
        }}
      >
        FR
      </button>
      <button
        onClick={() => changeLanguage('en')}
        title="English"
        style={{
          fontSize: '11px',
          fontWeight: '900',
          letterSpacing: '0.08em',
          padding: '4px 10px',
          borderRadius: '999px',
          border: 'none',
          cursor: 'pointer',
          transition: 'all 0.2s',
          background: lang === 'en' ? '#41abadff' : 'transparent',
          color: lang === 'en' ? '#fff' : '#555',
        }}
      >
        EN
      </button>
    </div>
  );
};

export default LanguageSwitcher;
