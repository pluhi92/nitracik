import React, { useState, useEffect } from "react";
import "../styles/components/CookieConsent.css";

const CookieConsent = () => {
  const [showConsent, setShowConsent] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState({
    necessary: true,
    analytics: false,
    marketing: false,
  });

  // Load saved preferences
  useEffect(() => {
    const savedPrefs = localStorage.getItem("cookiePrefs");
    if (savedPrefs) {
      const parsedPrefs = JSON.parse(savedPrefs);
      setPreferences(parsedPrefs);
      
      // Show consent modal only if user hasn't accepted at least necessary cookies
      if (!parsedPrefs.necessary) {
        setTimeout(() => {
          setShowConsent(true);
        }, 500);
      }
    } else {
      // No preferences saved - show consent modal
      setTimeout(() => {
        setShowConsent(true);
      }, 500);
    }
  }, []);

  const handleAcceptAll = () => {
    const allPrefs = { necessary: true, analytics: true, marketing: true };
    localStorage.setItem("cookiePrefs", JSON.stringify(allPrefs));
    setPreferences(allPrefs);
    setShowConsent(false);
    setShowSettings(false);
  };

  const handleDecline = () => {
    // Reject ALL cookies including necessary ones
    const rejectAll = { necessary: false, analytics: false, marketing: false };
    localStorage.setItem("cookiePrefs", JSON.stringify(rejectAll));
    setPreferences(rejectAll);
    setShowConsent(false);
    setShowSettings(false);
  };

  const handleClose = () => {
    // Same behavior as decline - reject all cookies
    handleDecline();
  };

  const handleSaveSettings = () => {
    localStorage.setItem("cookiePrefs", JSON.stringify(preferences));
    setShowSettings(false);
    setShowConsent(false);
  };

  const handleShowPreferences = () => {
    setShowSettings(true);
  };

  const handleCloseSettings = () => {
    setShowSettings(false);
    // Don't show consent modal again if user closes settings
    // Let them continue with their current choice
  };

  // Function to open cookie settings from footer link
  const openCookieSettings = () => {
    setShowSettings(true);
  };

  // Make this function available globally for the footer link
  useEffect(() => {
    window.openCookieSettings = openCookieSettings;
    return () => {
      delete window.openCookieSettings;
    };
  }, []);

  return (
    <>
      {/* Main Consent Modal - appears when no necessary cookies accepted */}
      {showConsent && (
        <div className="cookie-consent-modal">
          <div className="cookie-consent-content">
            <button 
              className="cookie-consent-close" 
              onClick={handleClose}
              aria-label="Zatvoriť"
            >
              ×
            </button>
            
            <h2 className="cookie-consent-title">Spravujte súhlas so súbormi cookie</h2>
            
            <div className="cookie-consent-description">
              Na poskytovanie tých najlepších skúseností používame technológie, ako sú súbory cookie 
              na ukladanie a/alebo prístup k informáciám o zariadení. Súhlas s týmito technológiami 
              nám umožní spracovávať údaje, ako je správanie pri prehliadaní alebo jedinečné ID na 
              tejto stránke. Nesúhlas alebo odvolanie súhlasu môže nepriaznivo ovplyvniť určité 
              vlastnosti a funkcie.
            </div>

            <div className="cookie-consent-actions">
              <button 
                className="cookie-consent-btn accept" 
                onClick={handleAcceptAll}
              >
                Prijať všetko
              </button>
              <button 
                className="cookie-consent-btn decline" 
                onClick={handleDecline}
              >
                Odmietnuť
              </button>
              <button 
                className="cookie-consent-btn preferences" 
                onClick={handleShowPreferences}
              >
                Nastaviť predvoľby
              </button>
            </div>

            <div className="cookie-consent-links">
              <button className="cookie-consent-link">
                Zásady používania súborov cookie
              </button>
              <button className="cookie-consent-link">
                Zásady ochrany osobných údajov
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cookie Settings Modal */}
      {showSettings && (
        <div className="cookie-settings-overlay">
          <div className="cookie-settings">
            <button 
              className="cookie-close-btn" 
              onClick={handleCloseSettings}
              aria-label="Zatvoriť"
            >
              ×
            </button>
            <h3>Nastavenia cookies</h3>
            <label>
              <input 
                type="checkbox" 
                checked={preferences.necessary} 
                onChange={(e) =>
                  setPreferences({ ...preferences, necessary: e.target.checked })
                }
              /> Nevyhnutné
            </label>
            <label>
              <input
                type="checkbox"
                checked={preferences.analytics}
                onChange={(e) =>
                  setPreferences({ ...preferences, analytics: e.target.checked })
                }
              />
              Analytické cookies
            </label>
            <label>
              <input
                type="checkbox"
                checked={preferences.marketing}
                onChange={(e) =>
                  setPreferences({ ...preferences, marketing: e.target.checked })
                }
              />
              Marketingové cookies
            </label>

            <div className="settings-buttons">
              <button onClick={handleAcceptAll}>Prijať všetko</button>
              <button onClick={handleSaveSettings}>Uložiť nastavenia</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CookieConsent;