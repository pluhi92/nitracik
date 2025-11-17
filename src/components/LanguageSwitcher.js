import React from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import FlagEN from '../assets/gb.png';
import FlagSK from '../assets/sk.png';

const LanguageSwitcher = () => {
  const { language, changeLanguage } = useTranslation();

  const languages = [
    { code: 'sk', flag: FlagSK, label: 'SK' },
    { code: 'en', flag: FlagEN, label: 'EN' },
  ];

  return (
    <div className="flex gap-1.5 bg-[rgba(230,138,117,0.15)] border border-[rgba(230,138,117,0.3)] rounded-full p-1.5">
      {languages.map((lang) => {
        const isActive = language === lang.code;
        return (
          <button
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            className={`
              flex items-center justify-center rounded-full p-1.5 min-w-[35px] min-h-[35px] transition-all duration-200
              ${isActive ? 'bg-secondary-500 text-white' : 'bg-transparent'}
              hover:scale-105
            `}
            aria-label={lang.label}
            title={lang.label}
          >
            <img
              src={lang.flag}
              alt={lang.label}
              className="w-[22px] h-[22px] object-contain block transition-transform duration-200"
            />
          </button>
        );
      })}
    </div>
  );
};

export default LanguageSwitcher;
