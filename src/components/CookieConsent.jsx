import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, ChevronDown, ChevronUp, Check, X, Sliders, Cookie } from 'lucide-react';

const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [hasSavedPrefs, setHasSavedPrefs] = useState(false);
  const location = useLocation();

  const [preferences, setPreferences] = useState({
    necessary: true,
    analytics: false
  });

  const [isTechOpen, setIsTechOpen] = useState(false);
  const [isAnalyticOpen, setIsAnalyticOpen] = useState(false);

  // Zistenie, či sme na GDPR stránke alebo jej podstránkach
  const isOnGdprPage = location.pathname.startsWith('/gdpr');

  useEffect(() => {
    const savedCookiePrefs = localStorage.getItem('cookiePreferences');
    if (!savedCookiePrefs) {
      setTimeout(() => setIsVisible(true), 500);
    } else {
      setPreferences(JSON.parse(savedCookiePrefs));
      setHasSavedPrefs(true);
    }

    const handleOpenSettings = () => {
      setIsVisible(true);
      setShowSettings(true);
    };

    window.addEventListener('openCookieSettings', handleOpenSettings);
    return () => window.removeEventListener('openCookieSettings', handleOpenSettings);
  }, []);

  const savePreferences = (newPreferences) => {
    localStorage.setItem('cookiePreferences', JSON.stringify(newPreferences));
    setPreferences(newPreferences);
    setHasSavedPrefs(true);
    setIsVisible(false);
    setShowSettings(false);
  };

  const handleCloseSettings = () => {
    if (hasSavedPrefs) {
      setIsVisible(false);
      setShowSettings(false);
      return;
    }
    setShowSettings(false);
  };

  const handleAcceptAll = () => savePreferences({ necessary: true, analytics: true });
  const handleRejectAll = () => savePreferences({ necessary: true, analytics: false });
  const handleSaveSelection = () => savePreferences(preferences);

  const technicalCookiesData = [
    { name: 'connect.sid', domain: 'nitracik.sk', purpose: 'Uchovanie prihlásenia', validity: '1 deň' },
    { name: '__stripe_mid', domain: 'nitracik.sk', purpose: 'Prevencia podvodov', validity: '1 rok' },
    { name: '__stripe_sid', domain: 'nitracik.sk', purpose: 'Prevencia podvodov', validity: '30 minút' },
    { name: '_cfuvid', domain: 'challenges.cloudflare.com', purpose: 'Ochrana proti botom', validity: 'počas doby spojenia' },
    { name: 'merchant', domain: 'stripe.com', purpose: 'Funkčnosť brány', validity: 'počas doby spojenia' },
    { name: 'site-auth', domain: 'stripe.com', purpose: 'Autentifikácia', validity: 'počas doby spojenia' },
    { name: 'stripe.csrf', domain: 'stripe.com', purpose: 'Ochrana formulárov', validity: 'počas doby spojenia' },
    { name: '__Secure-has_logged_in', domain: 'stripe.com', purpose: 'Bezpečnosť', validity: '6 mesiacov' },
    { name: '__Secure-sid', domain: 'stripe.com', purpose: 'Zabezpečenie relácie', validity: '30 minút' },
    { name: 'cid', domain: 'stripe.com', purpose: 'Identifikácia klienta', validity: '1,5 mesiaca' },
    { name: 'cookie-perms', domain: 'stripe.com', purpose: 'Preferencie cookies', validity: '5 mesiacov' },
    { name: 'machine_identifier', domain: 'stripe.com', purpose: 'Identifikácia (bezpečnosť)', validity: '10 mesiacov' },
    { name: 'private_machine_identifier', domain: 'stripe.com', purpose: 'Unikátna identifikácia', validity: '1 rok' },
    { name: 'handoff', domain: 'stripe.com', purpose: 'Prenos stavu', validity: 'počas doby spojenia' },
  ];

  const analyticalCookiesData = [
    { name: '_ga', domain: 'stripe.com', purpose: 'Štatistika (Google Analytics)', validity: '11 mesiacov' },
    { name: '__stripe_orig_props', domain: 'stripe.com', purpose: 'Analýza tokov', validity: '10 mesiacov' },
  ];

  const TableRow = ({ data }) => (
    <tr className="border-b border-neutral-100 text-xs font-medium">
      <td className="py-2 px-3 font-bold text-foreground">{data.name}</td>
      <td className="py-2 px-3 text-neutral-600">{data.domain}</td>
      <td className="py-2 px-3 text-neutral-600">{data.purpose}</td>
      <td className="py-2 px-3 text-neutral-600">{data.validity}</td>
    </tr>
  );

  const CustomSwitch = ({ checked, onChange, disabled }) => (
    <div
      className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors duration-200 ${
        checked ? 'bg-emerald-500' : 'bg-red-400'
      } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
      onClick={(e) => { e.stopPropagation(); if (!disabled) onChange(!checked); }}
    >
      <span className={`absolute left-1.5 text-[10px] font-bold text-white transition-opacity ${checked ? 'opacity-100' : 'opacity-0'}`}>✓</span>
      <span className={`absolute right-1.5 text-[10px] font-bold text-white transition-opacity ${checked ? 'opacity-0' : 'opacity-100'}`}>✕</span>
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${checked ? 'translate-x-7' : 'translate-x-1'}`} />
    </div>
  );

  if (!isVisible) return null;

  return (
    <div className={`fixed inset-0 z-[9999] flex ${isOnGdprPage ? 'items-end' : 'items-end sm:items-center'} justify-center ${isOnGdprPage ? 'bg-transparent' : 'bg-black/40 backdrop-blur-xs'} p-4`}>
      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className={`w-full max-w-2xl bg-white rounded-[2rem] shadow-xl border border-neutral-200 overflow-hidden flex flex-col ${isOnGdprPage ? 'mb-0' : ''}`}
      >
        {!showSettings ? (
          <div className="p-6 sm:p-10 text-center">
            <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Cookie className="w-7 h-7" />
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-foreground mb-3">Vážime si vaše súkromie!</h2>
            <p className="text-neutral-600 text-sm leading-relaxed mb-8 font-medium">
              Súbory cookies používame najmä na analýzu návštevnosti a vylepšovanie našej webovej stránky.
              Žiadame vás preto o povolenie na ich využívanie. V prípade ak kliknete na <strong className="text-foreground">„PRIJAŤ VŠETKY"</strong> budeme o vás spracúvať všetky druhy cookies,
              ak kliknete na <strong className="text-foreground">„ODMIETNUŤ VŠETKY"</strong> budeme spracúvať iba nevyhnutné cookies,
              ak si chcete svoje preferencie nastaviť sami kliknite na <strong className="text-foreground">„NASTAVIŤ COOKIES"</strong>.
              Podmienky spracovania osobných údajov nájdete <Link to="/gdpr/cookies" className="text-primary underline font-bold hover:text-primary-600">TU</Link>.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={handleAcceptAll} className="flex-1 px-5 py-3.5 bg-primary hover:bg-primary-600 text-white font-bold rounded-full transition-all text-xs uppercase tracking-wider shadow-sm">
                Prijať všetky
              </button>
              <button onClick={handleRejectAll} className="flex-1 px-5 py-3.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold rounded-full transition-all text-xs uppercase tracking-wider">
                Odmietnuť všetky
              </button>
              <button onClick={() => setShowSettings(true)} className="flex-1 px-5 py-3.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold rounded-full transition-all text-xs uppercase tracking-wider">
                Nastaviť cookies
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col max-h-[85vh]">
            <div className="p-5 px-6 border-b border-neutral-100 flex justify-between items-center bg-white sticky top-0 z-20">
              <h2 className="font-extrabold text-foreground text-base tracking-tight flex items-center gap-2">
                <Sliders className="w-5 h-5 text-primary" />
                <span>Nastavenie cookies</span>
              </h2>
              <button onClick={handleCloseSettings} className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 hover:bg-neutral-200 transition-colors font-bold">&times;</button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 bg-neutral-50/50">
              {/* Sekcia Technické */}
              <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-2xs">
                <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-neutral-50 transition-colors" onClick={() => setIsTechOpen(!isTechOpen)}>
                  <div className="flex items-center gap-3 text-sm font-bold text-foreground">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">
                      {isTechOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </span>
                    <span>Technické cookies (Nevyhnutné)</span>
                  </div>
                  <CustomSwitch checked={true} disabled={true} />
                </div>
                {isTechOpen && (
                  <div className="p-4 overflow-x-auto border-t border-neutral-100 bg-white">
                    <table className="w-full text-left min-w-[450px]">
                      <thead>
                        <tr className="text-[10px] text-neutral-400 uppercase tracking-wider border-b border-neutral-100"><th className="pb-2 px-3">Názov</th><th className="pb-2 px-3">Doména</th><th className="pb-2 px-3">Účel</th><th className="pb-2 px-3">Platnosť</th></tr>
                      </thead>
                      <tbody>{technicalCookiesData.map((c, i) => <TableRow key={i} data={c} />)}</tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Sekcia Analytické */}
              <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-2xs">
                <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-neutral-50 transition-colors" onClick={() => setIsAnalyticOpen(!isAnalyticOpen)}>
                  <div className="flex items-center gap-3 text-sm font-bold text-foreground">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">
                      {isAnalyticOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </span>
                    <span>Analytické cookies</span>
                  </div>
                  <CustomSwitch checked={preferences.analytics} onChange={(v) => setPreferences({ ...preferences, analytics: v })} />
                </div>
                {isAnalyticOpen && (
                  <div className="p-4 overflow-x-auto border-t border-neutral-100 bg-white">
                    <table className="w-full text-left min-w-[450px]">
                      <thead>
                        <tr className="text-[10px] text-neutral-400 uppercase tracking-wider border-b border-neutral-100"><th className="pb-2 px-3">Názov</th><th className="pb-2 px-3">Doména</th><th className="pb-2 px-3">Účel</th><th className="pb-2 px-3">Platnosť</th></tr>
                      </thead>
                      <tbody>{analyticalCookiesData.map((c, i) => <TableRow key={i} data={c} />)}</tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="p-5 border-t border-neutral-100 bg-white sticky bottom-0 z-20 flex flex-col sm:flex-row sm:justify-end gap-3">
              <button onClick={handleAcceptAll} className="w-full sm:w-auto px-5 py-3 bg-primary hover:bg-primary-600 text-white font-bold rounded-full text-xs transition-all shadow-sm uppercase tracking-wider">
                Prijať všetky
              </button>
              <button onClick={handleRejectAll} className="w-full sm:w-auto px-5 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold rounded-full text-xs transition-all uppercase tracking-wider">
                Odmietnuť všetky
              </button>
              <button onClick={handleSaveSelection} className="w-full sm:w-auto px-6 py-3 bg-foreground hover:bg-neutral-800 text-white font-bold rounded-full text-xs transition-all shadow-sm uppercase tracking-wider">
                Uložiť výber
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default CookieConsent;