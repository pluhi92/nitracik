import React from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import '../styles/components/LanguageSwitcher.css';

// Import vlajok
import FlagEN from '../assets/gb.png';
import FlagSK from '../assets/sk.png';

const LanguageSwitcher = () => {
  const { language, changeLanguage } = useTranslation();

  return (
    <div className="language-switcher-bs">
      <button 
        onClick={() => changeLanguage('en')}
        className={`language-btn-bs ${language === 'en' ? 'active' : ''}`}
        aria-label="English"
        title="English"
      >
        <img src={FlagEN} alt="English" className="flag-icon" />
      </button>

      <button 
        onClick={() => changeLanguage('sk')}
        className={`language-btn-bs ${language === 'sk' ? 'active' : ''}`}
        aria-label="Slovak"
        title="Slovensky"
      >
        <img src={FlagSK} alt="Slovensky" className="flag-icon" />
      </button>
    </div>
  );
};

export default LanguageSwitcher;
