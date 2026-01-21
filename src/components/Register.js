import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from '../contexts/LanguageContext';
import api from '../api/api';
import HCaptcha from '@hcaptcha/react-hcaptcha'; // IMPORT HCAPTCHA

// --- IKONY ---
const CheckIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const XIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const SpinnerIcon = ({ className }) => (
  <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const Register = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // --- STATE ---
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');

  // --- SMART ADRESA STATE ---
  const [addrCity, setAddrCity] = useState('');
  const [addrStreet, setAddrStreet] = useState('');
  const [addrNumber, setAddrNumber] = useState('');
  const [addrZip, setAddrZip] = useState('');
  const [hasNoStreet, setHasNoStreet] = useState(false);

  const [citySuggestions, setCitySuggestions] = useState([]);
  const [streetSuggestions, setStreetSuggestions] = useState([]);
  const [isSearchingCity, setIsSearchingCity] = useState(false);
  const [isSearchingStreet, setIsSearchingStreet] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showStreetDropdown, setShowStreetDropdown] = useState(false);

  // Checkboxy
  const [gdprConsent, setGdprConsent] = useState(false);
  const [vopConsent, setVopConsent] = useState(false);

  // Anti-bot & Security
  const [honey, setHoney] = useState('');
  const [captchaToken, setCaptchaToken] = useState(null); // NOVÝ STATE PRE TOKEN
  const hCaptchaRef = useRef(null); // REF PRE RESETOVANIE CAPTCHY

  // UX State
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  const cityInputRef = useRef(null);
  const streetInputRef = useRef(null);
  const numberInputRef = useRef(null);

//   console.log(
//   'HCAPTCHA KEY (CRA):',
//   process.env.REACT_APP_HCAPTCHA_SITEKEY
// );

  // --- LOGIC ---

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (cityInputRef.current && !cityInputRef.current.contains(event.target)) setShowCityDropdown(false);
      if (streetInputRef.current && !streetInputRef.current.contains(event.target)) setShowStreetDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- ADRESS SEARCH LOGIC ---

  // 1. Vyhľadávanie MESTA
  useEffect(() => {
    // Funkciu definujeme priamo tu, aby bola "čerstvá" pri každom spustení efektu
    const searchCity = async (query) => {
      if (query.length < 2) return;
      setIsSearchingCity(true);
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?city=${query}&country=Slovakia&format=json&addressdetails=1&limit=5&accept-language=sk`);
        const data = await res.json();
        setCitySuggestions(data);
        setShowCityDropdown(true);
      } catch (err) {
        console.error("City search failed", err);
      } finally {
        setIsSearchingCity(false);
      }
    };

    const timer = setTimeout(() => {
      // Pridali sme showCityDropdown do podmienky aj do závislostí
      if (addrCity && showCityDropdown) searchCity(addrCity);
    }, 500);

    return () => clearTimeout(timer);
  }, [addrCity, showCityDropdown]); // Teraz je to kompletné

  // 2. Vyhľadávanie ULICE
  useEffect(() => {
    const searchStreet = async (query) => {
      // Tu používame addrCity, takže ho musíme dať do závislostí dole
      if (query.length < 2 || !addrCity || hasNoStreet) return;
      setIsSearchingStreet(true);
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?street=${query}&city=${addrCity}&country=Slovakia&format=json&addressdetails=1&limit=5&accept-language=sk`);
        const data = await res.json();
        setStreetSuggestions(data);
        setShowStreetDropdown(true);
      } catch (err) {
        console.error("Street search failed", err);
      } finally {
        setIsSearchingStreet(false);
      }
    };

    const timer = setTimeout(() => {
      if (addrStreet && showStreetDropdown && !hasNoStreet) searchStreet(addrStreet);
    }, 500);

    return () => clearTimeout(timer);
  }, [addrStreet, hasNoStreet, showStreetDropdown, addrCity]); // Pridané všetky potrebné závislosti

  const handleSelectCity = (city) => {
    const cityName = city.address.city || city.address.town || city.address.village || city.display_name.split(',')[0];
    setAddrCity(cityName);
    setAddrZip('');
    setShowCityDropdown(false);
    if (city.address.postcode) setAddrZip(city.address.postcode);

    if (hasNoStreet && numberInputRef.current) {
      numberInputRef.current.focus();
    } else if (streetInputRef.current) {
      streetInputRef.current.focus();
    }
  };

  const handleSelectStreet = (street) => {
    const streetName = street.address.road || street.display_name.split(',')[0];
    setAddrStreet(streetName);
    setShowStreetDropdown(false);
    if (street.address.postcode) setAddrZip(street.address.postcode);
    if (numberInputRef.current) numberInputRef.current.focus();
  };

  // --- VALIDATION ---
  const [passwordCriteria, setPasswordCriteria] = useState({
    length: false, upper: false, lower: false, number: false, special: false
  });

  useEffect(() => {
    setPasswordCriteria({
      length: password.length >= 8,
      upper: /[A-Z]/.test(password),
      lower: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[@$!%*?&.,]/.test(password)
    });
  }, [password]);

  const validateField = (name, value) => {
    const errorMessages = t?.login?.register?.errors || {};
    switch (name) {
      case 'firstName': if (!value) return errorMessages.firstNameRequired || 'Required'; break;
      case 'lastName': if (!value) return errorMessages.lastNameRequired || 'Required'; break;
      case 'email':
        if (!value) return errorMessages.emailRequired || 'Required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return errorMessages.emailInvalid || 'Invalid email';
        break;
      case 'addrCity': if (!value) return 'City is required'; break;
      case 'addrStreet': if (!value && !hasNoStreet) return 'Street is required'; break;
      case 'addrNumber': if (!value) return 'Number is required'; break;
      case 'addrZip': if (!value) return 'ZIP is required'; break;
      default: break;
    }
    return '';
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    if (name === 'password') {
      setIsPasswordFocused(false);
      setPasswordTouched(true);
    } else {
      const error = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const isPasswordValid = Object.values(passwordCriteria).every(Boolean);
  const doPasswordsMatch = password && repeatPassword && password === repeatPassword;
  const isAddressValid = addrCity && (hasNoStreet || addrStreet) && addrNumber && addrZip;

  // VALIDACIA FORMULARA TERAZ KONTROLUJE captchaToken
  const isFormValid =
    !Object.values(errors).some((error) => error) &&
    firstName && lastName && email &&
    isPasswordValid && doPasswordsMatch &&
    isAddressValid &&
    gdprConsent && vopConsent && captchaToken;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    if (!doPasswordsMatch) return;

    // Adresa logika
    let fullAddress = '';
    if (hasNoStreet) {
      fullAddress = `${addrCity} ${addrNumber}, ${addrZip} ${addrCity}`;
    } else {
      fullAddress = `${addrStreet} ${addrNumber}, ${addrZip} ${addrCity}`;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/register', {
        firstName, lastName, email, password,
        address: fullAddress,
        _honey: honey,
        hCaptchaToken: captchaToken // POSIELAME TOKEN NA BACKEND
      });
      setApiError(`success: ${response.data.message}`);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setApiError(err.response?.data?.message || 'Registration failed');
      // Pri chybe resetujeme captchu, aby ju musel užívateľ vyplniť znova (prevencia proti replay útokom)
      setCaptchaToken(null);
      if (hCaptchaRef.current) hCaptchaRef.current.resetCaptcha();
    } finally {
      setLoading(false);
    }
  };

  const PasswordRequirement = ({ met, text }) => {
    let colorClass = met ? 'text-green-600 font-medium' : (!isPasswordFocused && passwordTouched ? 'text-red-500 font-medium' : 'text-gray-500');
    let Icon = met ? CheckIcon : (!isPasswordFocused && passwordTouched ? XIcon : null);

    return (
      <li className={`flex items-center text-xs transition-colors duration-200 ${colorClass}`}>
        <div className="w-5 h-5 mr-1.5 flex items-center justify-center flex-shrink-0">
          {Icon ? <Icon className="w-4 h-4" /> : <div className={`w-1.5 h-1.5 rounded-full ${met ? 'bg-green-500' : 'bg-gray-300'}`} />}
        </div>
        {text}
      </li>
    );
  };

  const showPasswordRequirements = isPasswordFocused || (passwordTouched && !isPasswordValid);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-xl w-full bg-white rounded-2xl shadow-xl p-8 sm:p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-secondary-100 rounded-bl-full opacity-50 -mr-16 -mt-16 pointer-events-none"></div>
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-8 relative z-10">{t?.login?.register?.title || 'Create Account'}</h2>

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          <div style={{ display: 'none', opacity: 0, position: 'absolute', left: '-9999px' }}>
            <input type="text" name="_honey" value={honey} onChange={(e) => setHoney(e.target.value)} tabIndex="-1" autoComplete="off" />
          </div>

          {/* MENO A PRIEZVISKO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t?.login?.register?.firstName || 'First Name'}</label>
              <input name="firstName" type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} onBlur={handleBlur} className={`w-full px-4 py-3 bg-gray-50 border rounded-lg outline-none transition-all ${errors.firstName ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-primary-500'}`} placeholder="Janko" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t?.login?.register?.lastName || 'Last Name'}</label>
              <input name="lastName" type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} onBlur={handleBlur} className={`w-full px-4 py-3 bg-gray-50 border rounded-lg outline-none transition-all ${errors.lastName ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-primary-500'}`} placeholder="Mrkvička" />
            </div>
          </div>

          {/* EMAIL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t?.login?.register?.email || 'Email Address'}</label>
            <input name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} onBlur={handleBlur} className={`w-full px-4 py-3 bg-gray-50 border rounded-lg outline-none transition-all ${errors.email ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-primary-500'}`} placeholder="janko@example.com" />
          </div>

          {/* --- SMART ADRESA SEKCE --- */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">{t?.login?.register?.address || 'Address'}</label>

            {/* 1. MESTO */}
            <div className="relative" ref={cityInputRef}>
              <input
                type="text"
                name="addrCity"
                value={addrCity}
                onChange={(e) => { setAddrCity(e.target.value); setShowCityDropdown(true); }}
                onFocus={() => setShowCityDropdown(true)}
                className={`w-full px-4 py-3 bg-gray-50 border rounded-lg outline-none transition-all ${errors.addrCity ? 'border-red-500' : 'border-gray-200 focus:border-primary-500'}`}
                placeholder="Mesto / Obec (napr. Nitra)"
              />
              {isSearchingCity && <div className="absolute right-3 top-3.5"><SpinnerIcon className="w-5 h-5 text-gray-400" /></div>}
              {showCityDropdown && citySuggestions.length > 0 && (
                <ul className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto mt-1">
                  {citySuggestions.map((city, idx) => (
                    <li key={idx} onClick={() => handleSelectCity(city)} className="px-4 py-2 hover:bg-primary-50 cursor-pointer text-sm text-gray-700">{city.display_name}</li>
                  ))}
                </ul>
              )}
            </div>

            {/* 2. ULICA + CHECKBOX PRE DEDINY */}
            <div className="relative" ref={streetInputRef}>
              <input
                type="text"
                name="addrStreet"
                value={addrStreet}
                onChange={(e) => { setAddrStreet(e.target.value); setShowStreetDropdown(true); }}
                onFocus={() => !hasNoStreet && setShowStreetDropdown(true)}
                disabled={!addrCity || hasNoStreet}
                className={`w-full px-4 py-3 bg-gray-50 border rounded-lg outline-none transition-all 
                    ${hasNoStreet ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''}
                    ${errors.addrStreet && !hasNoStreet ? 'border-red-500' : 'border-gray-200 focus:border-primary-500'}`}
                placeholder={hasNoStreet ? 'Obec nemá ulice' : (addrCity ? `Ulica v ${addrCity}` : "Najprv vyberte mesto")}
              />
              {isSearchingStreet && !hasNoStreet && <div className="absolute right-3 top-3.5"><SpinnerIcon className="w-5 h-5 text-gray-400" /></div>}
              {showStreetDropdown && streetSuggestions.length > 0 && !hasNoStreet && (
                <ul className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto mt-1">
                  {streetSuggestions.map((street, idx) => (
                    <li key={idx} onClick={() => handleSelectStreet(street)} className="px-4 py-2 hover:bg-primary-50 cursor-pointer text-sm text-gray-700">{street.display_name.split(',')[0]}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex items-center gap-2 mt-1 mb-2">
              <input
                type="checkbox"
                id="noStreet"
                checked={hasNoStreet}
                onChange={(e) => {
                  setHasNoStreet(e.target.checked);
                  if (e.target.checked) {
                    setAddrStreet('');
                    setErrors(prev => ({ ...prev, addrStreet: '' }));
                  }
                }}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 cursor-pointer"
              />
              <label htmlFor="noStreet" className="text-xs text-gray-600 cursor-pointer select-none">
                Obec nemá ulice (použiť len číslo domu)
              </label>
            </div>

            {/* 3. ČÍSLO a PSČ */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1">
                <input
                  ref={numberInputRef}
                  type="text"
                  name="addrNumber"
                  value={addrNumber}
                  onChange={(e) => setAddrNumber(e.target.value)}
                  className={`w-full px-4 py-3 bg-gray-50 border rounded-lg outline-none transition-all ${errors.addrNumber ? 'border-red-500' : 'border-gray-200 focus:border-primary-500'}`}
                  placeholder="Číslo"
                />
              </div>
              <div className="col-span-2">
                <input
                  type="text"
                  name="addrZip"
                  value={addrZip}
                  onChange={(e) => setAddrZip(e.target.value)}
                  className={`w-full px-4 py-3 bg-gray-50 border rounded-lg outline-none transition-all ${errors.addrZip ? 'border-red-500' : 'border-gray-200 focus:border-primary-500'}`}
                  placeholder="PSČ"
                />
              </div>
            </div>
          </div>

          {/* HESLO */}
          <div className="p-5 bg-gray-50 rounded-xl border border-gray-200 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t?.login?.register?.password || 'Password'}</label>
              <input name="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} onFocus={() => setIsPasswordFocused(true)} onBlur={handleBlur} className={`w-full px-4 py-3 bg-white border rounded-lg outline-none transition-all ${passwordTouched && !isPasswordValid ? 'border-red-300' : 'border-gray-300 focus:border-primary-500'}`} placeholder="••••••••" />
              <div className={`overflow-hidden transition-all duration-500 ease-in-out ${showPasswordRequirements ? 'max-h-48 opacity-100 mt-3' : 'max-h-0 opacity-0'}`}>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-1">
                  <PasswordRequirement met={passwordCriteria.length} text={t?.login?.register?.passwordRequirements?.length || "Min. 8 characters"} />
                  <PasswordRequirement met={passwordCriteria.upper} text={t?.login?.register?.passwordRequirements?.upper || "1 uppercase letter (A-Z)"} />
                  <PasswordRequirement met={passwordCriteria.lower} text={t?.login?.register?.passwordRequirements?.lower || "1 lowercase letter (a-z)"} />
                  <PasswordRequirement met={passwordCriteria.number} text={t?.login?.register?.passwordRequirements?.number || "1 number (0-9)"} />
                  <PasswordRequirement met={passwordCriteria.special} text={t?.login?.register?.passwordRequirements?.special || "1 special char (@$!%*?&)"} />
                </ul>
              </div>
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">{t?.login?.register?.repeatPassword || 'Confirm Password'}</label>
              <div className="relative">
                <input name="repeatPassword" type="password" value={repeatPassword} onChange={(e) => setRepeatPassword(e.target.value)} className={`w-full px-4 py-3 bg-white border rounded-lg outline-none transition-all pr-10 ${doPasswordsMatch ? 'border-green-500 ring-1 ring-green-500' : 'border-gray-300 focus:border-primary-500'}`} placeholder="••••••••" disabled={!password} />
                {doPasswordsMatch && <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"><CheckIcon className="h-6 w-6 text-green-500" /></div>}
              </div>
              {!doPasswordsMatch && repeatPassword && <p className="text-xs text-red-500 mt-1">Passwords do not match</p>}
            </div>
          </div>

          {/* CHECKBOXY */}
          <div className="space-y-3 pt-2">
            <div className="flex items-start gap-3">
              <input type="checkbox" id="gdpr" checked={gdprConsent} onChange={(e) => setGdprConsent(e.target.checked)} className="mt-1 w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500 cursor-pointer" />
              <label htmlFor="gdpr" className="text-sm text-gray-600 select-none cursor-pointer">{t?.login?.register?.gdprConsentText || 'Súhlasím s pravidlami o spracovaní osobných údajov'} (<Link to="/gdpr" target="_blank" className="text-primary-600 hover:underline font-semibold">GDPR</Link>).</label>
            </div>
            <div className="flex items-start gap-3">
              <input type="checkbox" id="vop" checked={vopConsent} onChange={(e) => setVopConsent(e.target.checked)} className="mt-1 w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500 cursor-pointer" />
              <label htmlFor="vop" className="text-sm text-gray-600 select-none cursor-pointer">{t?.login?.register?.termsConsentText || 'Súhlasím s obchodnými podmienkami'} (<Link to="/terms" target="_blank" className="text-primary-600 hover:underline font-semibold">VOP</Link>).</label>
            </div>
          </div>

          {/* --- HCAPTCHA IMPLEMENTÁCIA --- */}
          <div className="flex justify-center py-2">
            <HCaptcha
              sitekey={process.env.REACT_APP_HCAPTCHA_SITEKEY}
              onVerify={(token) => setCaptchaToken(token)}
              ref={hCaptchaRef}
            />
          </div>


          <button type="submit" className={`w-full py-4 px-6 rounded-xl text-white font-bold text-lg shadow-lg transition-all duration-300 transform hover:-translate-y-1 ${isFormValid ? 'bg-primary-500 hover:bg-primary-600 hover:shadow-primary-500/30' : 'bg-gray-300 cursor-not-allowed shadow-none'}`} disabled={!isFormValid || loading}>
            {loading ? <div className="flex items-center justify-center gap-3"><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>{t?.login?.register?.loading || 'Registering...'}</span></div> : t?.login?.register?.submit || 'Create Account'}
          </button>

          {apiError && <div className={`text-center text-sm font-medium py-3 px-4 rounded-lg border animate-fadeIn ${apiError.includes('success') ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>{apiError}</div>}
        </form>

        <div className="mt-8 text-center border-t border-gray-100 pt-6">
          <p className="text-gray-600">{t?.login?.register?.loginPrompt || 'Already have an account?'} <Link to="/login" className="text-primary-600 hover:text-primary-700 font-bold transition-colors hover:underline">{t?.login?.register?.loginLink || 'Login here'}</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Register;