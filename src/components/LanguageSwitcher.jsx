import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import FlagEN from '../assets/gb.png';
import FlagSK from '../assets/sk.png';

const LanguageSwitcher = () => {
  const { language, changeLanguage } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const languages = [
    { code: 'sk', flag: FlagSK, label: 'SK' },
    { code: 'en', flag: FlagEN, label: 'EN' },
  ];

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-full border border-[rgba(230,138,117,0.3)] bg-[rgba(230,138,117,0.15)] text-secondary-500 hover:bg-[rgba(230,138,117,0.25)] transition"
      >
        <img
          src={languages.find((l) => l.code === language)?.flag}
          alt={language}
          className="w-5 h-5 object-contain"
        />
        <span className="font-semibold">{language.toUpperCase()}</span>
      </button>

      <div
        className={`absolute right-0 mt-2 w-28 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 transition-all
          ${isOpen ? 'animate-dropdownIn opacity-100 visible' : 'animate-dropdownOut opacity-0 invisible'}`}
      >
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => { changeLanguage(lang.code); setIsOpen(false); }}
            className={`flex items-center gap-2 w-full px-4 py-2 text-left rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition
              ${language === lang.code ? 'bg-secondary-500 text-white' : 'text-gray-800 dark:text-gray-200'}`}
          >
            <img src={lang.flag} alt={lang.label} className="w-5 h-5 object-contain" />
            {lang.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default LanguageSwitcher;
