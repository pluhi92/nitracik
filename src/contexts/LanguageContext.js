import React, { createContext, useState, useContext, useEffect } from 'react';
import enTranslations from '../locales/en.json';
import skTranslations from '../locales/sk.json';

const translations = {
  en: enTranslations,
  sk: skTranslations
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    // Get language from localStorage or default to 'en'
    return localStorage.getItem('language') || 'en';
  });
  const [t, setT] = useState(translations[language]);

  const changeLanguage = (lang) => {
    localStorage.setItem('language', lang);
    setLanguage(lang);
    setT(translations[lang]);
    document.documentElement.lang = lang; // Set HTML lang attribute
  };

  // Set document language attribute on initial load
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ t, language, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};