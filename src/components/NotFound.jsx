import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../contexts/LanguageContext';
import { motion } from 'framer-motion';
import { Home, Lightbulb } from 'lucide-react';

// Framer Motion varianty pre nástup stránky
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

// Jemná animácia levitovania pre maskota
const floatAnimation = {
  y: [0, -10, 0],
  transition: { duration: 3, repeat: Infinity, ease: "easeInOut" }
};

const NotFound = () => {
  const { t } = useTranslation();

  return (
    <motion.section 
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      className="py-12 md:py-20 container-custom max-w-2xl mx-auto px-4 sm:px-6 relative min-h-[70vh] flex flex-col justify-center"
    >
      {/* Hlavná karta */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-neutral-200 overflow-hidden p-8 sm:p-12 text-center relative z-10">
        
        {/* 404 Icon s jemnou animáciou */}
        <motion.animate animate={floatAnimation} className="mb-8 block">
          <img 
            src="/images/sad_nitracik.png" 
            alt="Sad Nitracik" 
            className="w-40 h-auto mx-auto drop-shadow-sm"
          />
        </motion.animate>
        
        {/* Main Title */}
        <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-4 tracking-tight">
          {t?.notFound?.title || '404 – stránka sa nenašla :('}
        </h1>
        
        {/* Description */}
        <p className="text-base sm:text-lg text-neutral-500 mb-8 font-medium max-w-md mx-auto leading-relaxed">
          {t?.notFound?.description || 'Vyzerá to tak, že hľadaný obsah ešte nebol vytvorený alebo sa stratil niekde vo virtuálnom priestore.'}
        </p>
        
        {/* Funny Message */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-10 text-left flex items-start gap-4">
          <div className="bg-amber-100 p-2.5 rounded-full text-amber-600 flex-shrink-0 mt-0.5 shadow-sm">
            <Lightbulb className="w-5 h-5" />
          </div>
          <div>
            <strong className="block text-amber-900 font-extrabold mb-1">
              {t?.notFound?.funnyTitle || 'Tip od Messy!'}
            </strong>
            <span className="text-amber-800 text-sm font-medium leading-relaxed">
              {t?.notFound?.funnyText || 'Možno sa stránka stratila rovnako ako ponožky v práčke, alebo sa zahrabala v senzorických guličkách niekde na hracom poli. Skúste ju nájsť na domovskej stránke! 🎨'}
            </span>
          </div>
        </div>
        
        {/* Back to Home Button */}
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Link 
            to="/" 
            className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-600 text-white font-extrabold text-base py-4 px-8 rounded-full transition-all shadow-md"
          >
            <Home className="w-5 h-5" />
            <span>{t?.notFound?.homeButton || 'Späť na domovskú stránku'}</span>
          </Link>
        </motion.div>
      </div>
      
      {/* Dekoratívne prvky na pozadí */}
      <div className="absolute top-1/2 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 -z-10 pointer-events-none"></div>
      <div className="absolute top-1/4 right-0 w-48 h-48 bg-amber-400/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>
    </motion.section>
  );
};

export default NotFound;