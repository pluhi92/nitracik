import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const location = useLocation();

  const [preferences, setPreferences] = useState({
    necessary: true,
    analytics: false
  });

  const [isTechOpen, setIsTechOpen] = useState(false);
  const [isAnalyticOpen, setIsAnalyticOpen] = useState(false);

  // Zistenie, či sme na GDPR stránke
  const isOnGdprPage = location.pathname === '/gdpr';

  useEffect(() => {
    const savedCookiePrefs = localStorage.getItem('cookiePreferences');
    if (!savedCookiePrefs) {
      setTimeout(() => setIsVisible(true), 500);
    } else {
      setPreferences(JSON.parse(savedCookiePrefs));
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
    setIsVisible(false);
    setShowSettings(false);
  };

  const handleAcceptAll = () => savePreferences({ necessary: true, analytics: true });
  const handleRejectAll = () => savePreferences({ necessary: true, analytics: false });
  const handleSaveSelection = () => savePreferences(preferences);

  const technicalCookiesData = [
    { name: 'connect.sid', domain: 'nitracik.sk', purpose: 'Uchovanie prihlásenia', validity: '1 deň' },
    { name: '__stripe_mid', domain: 'nitracik.sk', purpose: 'Prevencia podvodov', validity: '1 rok' },
    { name: '__stripe_sid', domain: 'nitracik.sk', purpose: 'Prevencia podvodov', validity: '30 minút' },
    { name: '__cf_bm', domain: 'hcaptcha.com', purpose: 'Ochrana proti botom', validity: '30 minút' },
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
    <tr className="border-b border-gray-100 text-[10px] sm:text-[11px]">
      <td className="py-1.5 px-2 font-medium text-gray-700">{data.name}</td>
      <td className="py-1.5 px-2 text-gray-600">{data.domain}</td>
      <td className="py-1.5 px-2 text-gray-600">{data.purpose}</td>
      <td className="py-1.5 px-2 text-gray-600">{data.validity}</td>
    </tr>
  );

  const CustomSwitch = ({ checked, onChange, disabled }) => (
    <div
      className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors duration-200 ${checked ? 'bg-green-500' : 'bg-red-500'
        } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
      onClick={(e) => { e.stopPropagation(); if (!disabled) onChange(!checked); }}
    >
      {/* Ikony v pozadí */}
      <span className={`absolute left-1.5 text-[10px] font-bold text-white transition-opacity ${checked ? 'opacity-100' : 'opacity-0'}`}>✓</span>
      <span className={`absolute right-1.5 text-[10px] font-bold text-white transition-opacity ${checked ? 'opacity-0' : 'opacity-100'}`}>✕</span>

      {/* Gulička */}
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${checked ? 'translate-x-7' : 'translate-x-1'}`} />
    </div>
  );

  if (!isVisible) return null;

  return (
    <div className={`fixed inset-0 z-[9999] flex ${isOnGdprPage ? 'items-end' : 'items-end sm:items-center'} justify-center ${isOnGdprPage ? 'bg-transparent' : 'bg-black/40 backdrop-blur-sm'} p-4 animate-fadeIn`}>
      <div className={`w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-dropdownIn ${isOnGdprPage ? 'mb-0' : ''}`}>

        {!showSettings ? (
          <div className="p-5 sm:p-8 text-center">
            <h2 className="text-lg font-bold text-gray-800 mb-3">Vážime si vaše súkromie!</h2>
            <p className="text-gray-600 text-[13px] leading-relaxed mb-6">
              Súbory cookies používame najmä na analýzu návštevnosti a vylepšovanie našej webovej stránky.
              Žiadame vás preto o povolenie na ich využívanie. V prípade ak kliknete na <strong>„PRIJAŤ VŠETKY"</strong> budeme o vás spracúvať všetky druhy cookies,
              ak kliknete na <strong>„ODMIETNUŤ VŠETKY"</strong> budeme spracúvať iba nevyhnutné cookies,
              ak si chcete svoje preferencie nastaviť sami kliknite na <strong>„NASTAVIŤ COOKIES"</strong>.
              Podmienky spracovania osobných údajov nájdete <Link to="/gdpr" className="text-secondary-600 underline font-semibold hover:text-secondary-500">TU</Link>.
            </p>

            <div className="flex flex-row gap-2 justify-center">
              <button onClick={handleAcceptAll} className="flex-1 px-3 py-2 bg-secondary-600 hover:bg-secondary-800 text-white font-bold rounded-lg transition-colors text-[11px] uppercase tracking-wider">
                Prijať všetky
              </button>
              <button onClick={handleRejectAll} className="flex-1 px-3 py-2 bg-secondary-600 hover:bg-secondary-800 text-white font-bold rounded-lg transition-colors text-[11px] uppercase tracking-wider">
                Odmietnuť všetky
              </button>
              <button onClick={() => setShowSettings(true)} className="flex-1 px-3 py-2 bg-secondary-600 hover:bg-secondary-800 text-white font-bold rounded-lg transition-colors text-[11px] uppercase tracking-wider">
                Nastaviť cookies
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col max-h-[85vh]">
            <div className="p-3 px-5 border-b flex justify-between items-center bg-white sticky top-0 z-20">
              <h2 className="font-bold text-gray-700 text-sm tracking-tight">Nastavenie cookies</h2>
              <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 bg-gray-50/30">
              {/* Sekcia Technické */}
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setIsTechOpen(!isTechOpen)}>
                  <div className="flex items-center gap-2 text-[13px] font-bold text-gray-700">
                    <span className="text-secondary-600 w-4">{isTechOpen ? '↑' : '↓'}</span>
                    <span>Technické cookies (Nevyhnutné)</span>
                  </div>
                  <CustomSwitch checked={true} disabled={true} />
                </div>
                {isTechOpen && (
                  <div className="p-3 overflow-x-auto border-t border-gray-50 bg-white">
                    <table className="w-full text-left min-w-[450px]">
                      <thead>
                        <tr className="text-[9px] text-gray-400 uppercase border-b border-gray-50"><th className="pb-1 px-2">Názov</th><th className="pb-1 px-2">Doména</th><th className="pb-1 px-2">Účel</th><th className="pb-1 px-2">Platnosť</th></tr>
                      </thead>
                      <tbody>{technicalCookiesData.map((c, i) => <TableRow key={i} data={c} />)}</tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Sekcia Analytické */}
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setIsAnalyticOpen(!isAnalyticOpen)}>
                  <div className="flex items-center gap-2 text-[13px] font-bold text-gray-700">
                    <span className="text-secondary-600 w-4">{isAnalyticOpen ? '↑' : '↓'}</span>
                    <span>Analytické cookies</span>
                  </div>
                  <CustomSwitch checked={preferences.analytics} onChange={(v) => setPreferences({ ...preferences, analytics: v })} />
                </div>
                {isAnalyticOpen && (
                  <div className="p-3 overflow-x-auto border-t border-gray-50 bg-white">
                    <table className="w-full text-left min-w-[450px]">
                      <thead>
                        <tr className="text-[9px] text-gray-400 uppercase border-b border-gray-50"><th className="pb-1 px-2">Názov</th><th className="pb-1 px-2">Doména</th><th className="pb-1 px-2">Účel</th><th className="pb-1 px-2">Platnosť</th></tr>
                      </thead>
                      <tbody>{analyticalCookiesData.map((c, i) => <TableRow key={i} data={c} />)}</tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t flex justify-end gap-3 bg-white sticky bottom-0 z-20">
              <button onClick={() => setShowSettings(false)} className="px-3 py-1 text-[10px] font-bold text-gray-400 hover:text-gray-600 tracking-widest uppercase">Späť</button>
              <button onClick={handleSaveSelection} className="px-6 py-2 bg-secondary-600 hover:bg-secondary-500 text-white font-bold rounded-lg text-[10px] transition-colors shadow-sm uppercase tracking-wider">
                Uložiť výber
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CookieConsent;