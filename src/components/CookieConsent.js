import React, { useState, useEffect } from "react";

const CookieConsent = () => {
  const [showPolicy, setShowPolicy] = useState(false);
  const [showConsent, setShowConsent] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState({
    necessary: true,
    analytics: false,
    marketing: false,
  });

  // Load saved preferences
  useEffect(() => {
    const saved = localStorage.getItem("cookiePrefs");

    if (!saved) {
      setTimeout(() => setShowConsent(true), 400);
    } else {
      const parsed = JSON.parse(saved);
      setPreferences(parsed);

      if (!parsed.necessary && !parsed.analytics && !parsed.marketing) {
        setTimeout(() => setShowConsent(true), 400);
      }
    }
  }, []);

  const savePrefs = (prefs) => {
    localStorage.setItem("cookiePrefs", JSON.stringify(prefs));
    setPreferences(prefs);
  };

  const acceptAll = () => {
    savePrefs({ necessary: true, analytics: true, marketing: true });
    setShowConsent(false);
    setShowSettings(false);
  };

  const declineAll = () => {
    savePrefs({ necessary: false, analytics: false, marketing: false });
    setShowConsent(false);
    setShowSettings(false);
  };

  const saveSettings = () => {
    savePrefs(preferences);
    setShowConsent(false);
    setShowSettings(false);
  };

  useEffect(() => {
    window.openCookieSettings = () => setShowSettings(true);
  }, []);

  const overlayClasses =
    "fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-40 backdrop-blur-sm z-50 p-6";

  const cardClasses =
    "bg-white p-6 md:p-10 rounded-xl max-w-[90%] md:max-w-2xl w-full shadow-2xl relative";

  return (
    <>
      {/* ================= Consent Modal ================= */}
      {showConsent && (
        <div className={overlayClasses}>
          <div className={cardClasses}>
            {/* CLOSE BUTTON */}
            <button
              className="absolute top-4 right-5 text-2xl font-semibold text-gray-600 hover:text-gray-900"
              onClick={() => setShowConsent(false)}
            >
              ×
            </button>

            <h2 className="text-2xl font-semibold text-center mb-4 text-gray-900">
              Spravujte súhlas so súbormi cookie
            </h2>

            <p className="text-gray-700 leading-relaxed mb-4 text-justify">
              Aby sme vám poskytli čo najlepší zážitok, používame súbory cookie
              na ukladanie informácií o zariadení. Súhlas umožňuje spracúvanie
              údajov, ako sú preferencie používateľa. Nesúhlas môže obmedziť
              určité funkcie našej webstránky.
            </p>

            {/* BUTTONS */}
            <div className="flex flex-wrap gap-3 justify-center mb-4">
              <button
                className="bg-secondary-400 text-white py-2 px-4 md:py-3 md:px-6 rounded-lg min-w-[100px] md:min-w-[140px] hover:bg-gray-800 transition"
                onClick={acceptAll}
              >
                Prijať všetko
              </button>

              <button
                className="border-2 border-secondary-800 text-secondary-800 py-2 px-4 md:py-3 md:px-6 rounded-lg min-w-[100px] md:min-w-[140px] hover:border-secondary-900 hover:text-secondary-900 transition"
                onClick={() => setShowSettings(true)}
              >
                Nastaviť predvoľby
              </button>

              <button
                className="border-2 border-secondary-500 text-secondary-500 py-2 px-4 md:py-3 md:px-6 rounded-lg min-w-[100px] md:min-w-[140px] hover:border-secondary-600 hover:text-secondary-600 transition"
                onClick={declineAll}
              >
                Odmietnuť všetko
              </button>
            </div>

            <div
              className="text-center text-sm text-primary-600 underline cursor-pointer"
              onClick={() => setShowPolicy(true)}
            >
              Zásady používania cookies
            </div>
          </div>
        </div>
      )}

      {/* ================= Settings Modal ================= */}
      {showSettings && (
        <div className={overlayClasses}>
          <div className="bg-white p-8 rounded-xl max-w-lg w-full shadow-xl relative">
            <button
              className="absolute right-4 top-3 text-2xl font-semibold text-gray-600 hover:text-gray-900"
              onClick={() => setShowSettings(false)}
            >
              ×
            </button>

            <h3 className="text-xl mb-6 text-center font-semibold">
              Nastavenia cookies
            </h3>

            <label className="block py-3 border-b">
              <input
                type="checkbox"
                className="mr-3 scale-110"
                checked={preferences.necessary}
                onChange={(e) =>
                  setPreferences({ ...preferences, necessary: e.target.checked })
                }
              />
              Nevyhnutné cookies
            </label>

            <label className="block py-3 border-b">
              <input
                type="checkbox"
                className="mr-3 scale-110"
                checked={preferences.analytics}
                onChange={(e) =>
                  setPreferences({ ...preferences, analytics: e.target.checked })
                }
              />
              Analytické cookies
            </label>

            <label className="block py-3 border-b mb-6">
              <input
                type="checkbox"
                className="mr-3 scale-110"
                checked={preferences.marketing}
                onChange={(e) =>
                  setPreferences({ ...preferences, marketing: e.target.checked })
                }
              />
              Marketingové cookies
            </label>

            <div className="flex flex-wrap gap-3">
              <button
                className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition"
                onClick={declineAll}
              >
                Odmietnuť všetko
              </button>

              <button
                className="flex-1 bg-primary-500 text-white py-2 rounded-lg hover:bg-primary-600 transition"
                onClick={saveSettings}
              >
                Uložiť nastavenia
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= Policy Modal ================= */}
      {showPolicy && (
        <div className={overlayClasses}>
          <div className={cardClasses}>
            <button
              className="absolute top-4 right-5 text-2xl font-semibold text-gray-600 hover:text-gray-900"
              onClick={() => setShowPolicy(false)}
            >
              ×
            </button>

            <h2 className="text-2xl font-semibold text-center mb-4 text-gray-900">
              Zásady používania cookies
            </h2>

            <div className="text-gray-700 leading-relaxed text-justify max-h-[70vh] overflow-y-auto">
              <p>
                Naša webová stránka používa súbory cookie na zabezpečenie správneho fungovania a zlepšenie používateľského zážitku. Súbory cookie sú malé textové súbory uložené vo vašom zariadení.
              </p>

              <h2 className="text-xl font-semibold mt-4">Typy súborov cookie:</h2>
              <ul className="list-disc pl-6">
                <li><strong>Nevyhnutné cookies</strong> – pre základnú funkcionalitu stránky.</li>
                <li><strong>Analytické cookies</strong> – pomáhajú nám porozumieť, ako stránku používate.</li>
                <li><strong>Marketingové cookies</strong> – používajú sa na prispôsobenie reklám podľa vašich potrieb.</li>
              </ul>

              <p>
                Používaním tejto stránky súhlasíte so spracovaním údajov uvedenými technológiami. Kedykoľvek môžete upraviť svoje nastavenia súborov cookie kliknutím na „Nastavenia cookies“ v pätičke.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CookieConsent;
