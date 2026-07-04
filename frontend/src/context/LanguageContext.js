import React, { createContext, useContext, useState, useCallback } from 'react';
import fr from '../locales/fr/translation.json';
import en from '../locales/en/translation.json';

const translations = { fr, en };

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => localStorage.getItem('appLang') || 'fr');

  const changeLanguage = useCallback((newLang) => {
    setLang(newLang);
    localStorage.setItem('appLang', newLang);
  }, []);

  /**
   * t('section.key') → string from current language JSON
   * Falls back to fr if key is missing in current lang.
   */
  const t = useCallback((path, vars) => {
    const keys = path.split('.');
    let result = translations[lang];
    for (const key of keys) {
      result = result?.[key];
    }
    if (result === undefined) {
      // fallback to French
      let fallback = translations['fr'];
      for (const key of keys) fallback = fallback?.[key];
      result = fallback ?? path;
    }
    if (vars && typeof result === 'string') {
      return result.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? vars[k] : `{${k}}`));
    }
    return result;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, t, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => useContext(LanguageContext);
export default LanguageContext;
