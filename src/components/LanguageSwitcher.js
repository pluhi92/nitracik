import React from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import '../styles/components/LanguageSwitcher.css';

const LanguageSwitcher = () => {
  const { language, changeLanguage } = useTranslation();

  return (
    <div className="language-switcher btn-group btn-group-sm ms-2">
      <button 
        onClick={() => changeLanguage('en')}
        className={`btn ${language === 'en' ? 'btn-primary' : 'btn-outline-secondary'}`}
      >
        EN
      </button>
      <button 
        onClick={() => changeLanguage('sk')}
        className={`btn ${language === 'sk' ? 'btn-primary' : 'btn-outline-secondary'}`}
      >
        SK
      </button>
    </div>
  );
};

export default LanguageSwitcher;