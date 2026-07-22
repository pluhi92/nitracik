import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import FlagEN from '../assets/gb.png';
import FlagSK from '../assets/sk.png';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const LanguageSwitcher = () => {
  const { language, changeLanguage } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const languages = [
    { code: 'sk', flag: FlagSK, label: 'SK' },
    { code: 'en', flag: FlagEN, label: 'EN' },
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentLang = languages.find((l) => l.code === language) || languages[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3.5 py-2 rounded-full border border-neutral-200 bg-neutral-50 text-foreground hover:bg-neutral-100 transition-all font-bold text-xs shadow-2xs cursor-pointer"
      >
        <img
          src={currentLang.flag}
          alt={language}
          className="w-4 h-4 object-contain rounded-xs"
        />
        <span>{language.toUpperCase()}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 mt-2 w-32 bg-white rounded-2xl shadow-lg border border-neutral-200 overflow-hidden z-50 p-1.5 space-y-1"
          >
            {languages.map((lang) => {
              const isSelected = language === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => { changeLanguage(lang.code); setIsOpen(false); }}
                  className={`flex items-center gap-2.5 w-full px-3 py-2 text-left rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-primary text-white shadow-2xs' 
                      : 'text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  <img src={lang.flag} alt={lang.label} className="w-4 h-4 object-contain rounded-xs" />
                  <span>{lang.label}</span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LanguageSwitcher;