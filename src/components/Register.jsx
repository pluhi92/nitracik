import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from '../contexts/LanguageContext';
import api from '../api/api';
import { Turnstile } from '@marsidev/react-turnstile';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  MapPin, 
  Home, 
  Hash,
  Check,
  X,
  Loader2,
  AlertCircle,
  ArrowRight
} from 'lucide-react';

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

const Register = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setTimeout(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 0);
  }, [location]);

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
  const [agreementChecked, setAgreementChecked] = useState(false);
  const [noMarketingChecked, setNoMarketingChecked] = useState(false);

  // Anti-bot & Security
  const [honey, setHoney] = useState('');
  const [captchaToken, setCaptchaToken] = useState(null);
  const turnstileRef = useRef(null);

  // UX State
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  const cityInputRef = useRef(null);
  const streetInputRef = useRef(null);
  const numberInputRef = useRef(null);

  // --- LOGIC ---

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (cityInputRef.current && !cityInputRef.current.contains(event.target)) setShowCityDropdown(false);
      if (streetInputRef.current && !streetInputRef.current.contains(event.target)) setShowStreetDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 1. Vyhľadávanie MESTA
  useEffect(() => {
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
      if (addrCity && showCityDropdown) searchCity(addrCity);
    }, 500);

    return () => clearTimeout(timer);
  }, [addrCity, showCityDropdown]);

  // 2. Vyhľadávanie ULICE
  useEffect(() => {
    const searchStreet = async (query) => {
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
  }, [addrStreet, hasNoStreet, showStreetDropdown, addrCity]);

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
    length: false, upper: false, lower: false, number: false
  });

  useEffect(() => {
    setPasswordCriteria({
      length: password.length >= 8,
      upper: /[A-Z]/.test(password),
      lower: /[a-z]/.test(password),
      number: /\d/.test(password),
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

  const isFormValid =
    !Object.values(errors).some((error) => error) &&
    firstName && lastName && email &&
    isPasswordValid && doPasswordsMatch &&
    isAddressValid &&
    agreementChecked && captchaToken;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    if (!doPasswordsMatch) return;

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
        turnstileToken: captchaToken,
        noMarketingChecked
      });
      setApiError(`success: ${response.data.message}`);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setApiError(err.response?.data?.message || 'Registration failed');
      setCaptchaToken(null);
      if (turnstileRef.current) turnstileRef.current.reset();
    } finally {
      setLoading(false);
    }
  };

  const PasswordRequirement = ({ met, text }) => {
    let colorClass = met ? 'text-emerald-600 font-bold' : (!isPasswordFocused && passwordTouched ? 'text-red-500 font-bold' : 'text-neutral-500 font-medium');
    let Icon = met ? Check : (!isPasswordFocused && passwordTouched ? X : null);

    return (
      <li className={`flex items-center text-xs transition-colors duration-200 ${colorClass}`}>
        <div className="w-4 h-4 mr-1.5 flex items-center justify-center flex-shrink-0">
          {Icon ? <Icon className="w-3.5 h-3.5" /> : <div className={`w-1.5 h-1.5 rounded-full ${met ? 'bg-emerald-500' : 'bg-neutral-300'}`} />}
        </div>
        {text}
      </li>
    );
  };

  const showPasswordRequirements = isPasswordFocused || (passwordTouched && !isPasswordValid);

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        className="max-w-2xl w-full"
      >
        <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-sm border border-neutral-200 p-8 sm:p-12 relative overflow-hidden">
          {/* Subtle decoration */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
          
          <h2 className="text-3xl sm:text-4xl font-extrabold text-center text-foreground mb-10 relative z-10 tracking-tight">
            {t?.login?.register?.title || 'Vytvoriť účet'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            <div style={{ display: 'none', opacity: 0, position: 'absolute', left: '-9999px' }}>
              <input type="text" name="_honey" value={honey} onChange={(e) => setHoney(e.target.value)} tabIndex="-1" autoComplete="off" />
            </div>

            {/* MENO A PRIEZVISKO */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <div>
                <label className="block text-sm font-bold text-neutral-700 mb-1.5 pl-1">{t?.login?.register?.firstName || 'Meno'}</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-400">
                    <User className="w-5 h-5" />
                  </div>
                  <input 
                    name="firstName" 
                    type="text" 
                    value={firstName} 
                    onChange={(e) => setFirstName(e.target.value)} 
                    onBlur={handleBlur} 
                    className={`w-full pl-11 pr-4 py-3 bg-neutral-50 border rounded-2xl outline-none transition-all text-sm font-medium ${errors.firstName ? 'border-red-300 bg-red-50/50' : 'border-neutral-200 focus:border-primary focus:ring-2 focus:ring-primary'}`} 
                    placeholder="Janko" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-neutral-700 mb-1.5 pl-1">{t?.login?.register?.lastName || 'Priezvisko'}</label>
                <input 
                  name="lastName" 
                  type="text" 
                  value={lastName} 
                  onChange={(e) => setLastName(e.target.value)} 
                  onBlur={handleBlur} 
                  className={`w-full px-4 py-3 bg-neutral-50 border rounded-2xl outline-none transition-all text-sm font-medium ${errors.lastName ? 'border-red-300 bg-red-50/50' : 'border-neutral-200 focus:border-primary focus:ring-2 focus:ring-primary'}`} 
                  placeholder="Mrkvička" 
                />
              </div>
            </div>

            {/* EMAIL */}
            <div>
              <label className="block text-sm font-bold text-neutral-700 mb-1.5 pl-1">{t?.login?.register?.email || 'Email'}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-400">
                  <Mail className="w-5 h-5" />
                </div>
                <input 
                  name="email" 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  onBlur={handleBlur} 
                  className={`w-full pl-11 pr-4 py-3 bg-neutral-50 border rounded-2xl outline-none transition-all text-sm font-medium ${errors.email ? 'border-red-300 bg-red-50/50' : 'border-neutral-200 focus:border-primary focus:ring-2 focus:ring-primary'}`} 
                  placeholder="janko@example.com" 
                />
              </div>
            </div>

            {/* --- SMART ADRESA SEKCE --- */}
            <div className="space-y-4 bg-neutral-50/50 p-5 rounded-2xl border border-neutral-100">
              <label className="block text-sm font-extrabold text-foreground tracking-wide uppercase">{t?.login?.register?.address || 'Adresa'}</label>

              {/* 1. MESTO */}
              <div className="relative" ref={cityInputRef}>
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-400">
                  <MapPin className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  name="addrCity"
                  value={addrCity}
                  onChange={(e) => { setAddrCity(e.target.value); setShowCityDropdown(true); }}
                  onFocus={() => setShowCityDropdown(true)}
                  className={`w-full pl-11 pr-4 py-3 bg-white border rounded-xl outline-none transition-all text-sm font-medium ${errors.addrCity ? 'border-red-300' : 'border-neutral-200 focus:border-primary focus:ring-2 focus:ring-primary'}`}
                  placeholder="Mesto / Obec (napr. Nitra)"
                />
                {isSearchingCity && <div className="absolute right-4 top-3.5"><Loader2 className="w-5 h-5 text-primary animate-spin" /></div>}
                
                <AnimatePresence>
                  {showCityDropdown && citySuggestions.length > 0 && (
                    <motion.ul 
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="absolute z-50 w-full bg-white border border-neutral-200 rounded-xl shadow-lg max-h-48 overflow-y-auto mt-2 py-1"
                    >
                      {citySuggestions.map((city, idx) => (
                        <li key={idx} onClick={() => handleSelectCity(city)} className="px-4 py-2.5 hover:bg-neutral-50 cursor-pointer text-sm font-medium text-neutral-700 transition-colors border-b border-neutral-50 last:border-0">
                          {city.display_name}
                        </li>
                      ))}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </div>

              {/* 2. ULICA + CHECKBOX PRE DEDINY */}
              <div className="relative" ref={streetInputRef}>
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-400">
                  <Home className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  name="addrStreet"
                  value={addrStreet}
                  onChange={(e) => { setAddrStreet(e.target.value); setShowStreetDropdown(true); }}
                  onFocus={() => !hasNoStreet && setShowStreetDropdown(true)}
                  disabled={!addrCity || hasNoStreet}
                  className={`w-full pl-11 pr-4 py-3 bg-white border rounded-xl outline-none transition-all text-sm font-medium
                      ${hasNoStreet ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed border-neutral-100' : ''}
                      ${errors.addrStreet && !hasNoStreet ? 'border-red-300' : 'border-neutral-200 focus:border-primary focus:ring-2 focus:ring-primary'}`}
                  placeholder={hasNoStreet ? 'Obec nemá ulice' : (addrCity ? `Ulica v ${addrCity}` : "Najprv vyberte mesto")}
                />
                {isSearchingStreet && !hasNoStreet && <div className="absolute right-4 top-3.5"><Loader2 className="w-5 h-5 text-primary animate-spin" /></div>}
                
                <AnimatePresence>
                  {showStreetDropdown && streetSuggestions.length > 0 && !hasNoStreet && (
                    <motion.ul 
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="absolute z-50 w-full bg-white border border-neutral-200 rounded-xl shadow-lg max-h-48 overflow-y-auto mt-2 py-1"
                    >
                      {streetSuggestions.map((street, idx) => (
                        <li key={idx} onClick={() => handleSelectStreet(street)} className="px-4 py-2.5 hover:bg-neutral-50 cursor-pointer text-sm font-medium text-neutral-700 transition-colors border-b border-neutral-50 last:border-0">
                          {street.display_name.split(',')[0]}
                        </li>
                      ))}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex items-center gap-2.5 pt-1 mb-2">
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
                  className="w-4 h-4 text-primary border-neutral-300 rounded focus:ring-primary cursor-pointer"
                />
                <label htmlFor="noStreet" className="text-sm text-neutral-600 font-medium cursor-pointer select-none">
                  {t?.login?.register?.noStreetLabel || 'Obec nemá ulice (použiť len číslo domu)'}
                </label>
              </div>

              {/* 3. ČÍSLO a PSČ */}
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-400">
                    <Hash className="w-4 h-4" />
                  </div>
                  <input
                    ref={numberInputRef}
                    type="text"
                    name="addrNumber"
                    value={addrNumber}
                    onChange={(e) => setAddrNumber(e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 bg-white border rounded-xl outline-none transition-all text-sm font-medium ${errors.addrNumber ? 'border-red-300' : 'border-neutral-200 focus:border-primary focus:ring-2 focus:ring-primary'}`}
                    placeholder="Číslo domu"
                  />
                </div>
                <input
                  type="text"
                  name="addrZip"
                  value={addrZip}
                  onChange={(e) => setAddrZip(e.target.value)}
                  className={`w-full px-4 py-3 bg-white border rounded-xl outline-none transition-all text-sm font-medium ${errors.addrZip ? 'border-red-300' : 'border-neutral-200 focus:border-primary focus:ring-2 focus:ring-primary'}`}
                  placeholder="PSČ"
                />
              </div>
            </div>

            {/* HESLO */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-neutral-700 mb-1.5 pl-1">{t?.login?.register?.password || 'Heslo'}</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setIsPasswordFocused(true)}
                    onBlur={handleBlur}
                    className={`w-full pl-11 pr-12 py-3 bg-neutral-50 border rounded-2xl outline-none transition-all text-sm font-medium ${passwordTouched && !isPasswordValid ? 'border-red-300 bg-red-50/50' : 'border-neutral-200 focus:border-primary focus:ring-2 focus:ring-primary'}`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    aria-label="Show password"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center justify-center text-neutral-400 hover:text-primary transition-colors focus:outline-none"
                    onMouseDown={(e) => { e.preventDefault(); setShowPassword(true); }}
                    onMouseUp={() => setShowPassword(false)}
                    onMouseLeave={() => setShowPassword(false)}
                    onTouchStart={() => setShowPassword(true)}
                    onTouchEnd={() => setShowPassword(false)}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                
                <AnimatePresence>
                  {showPasswordRequirements && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 p-3 bg-neutral-50 rounded-xl border border-neutral-100">
                        <PasswordRequirement met={passwordCriteria.length} text={t?.login?.register?.passwordRequirements?.length || "Min. 8 znakov"} />
                        <PasswordRequirement met={passwordCriteria.upper} text={t?.login?.register?.passwordRequirements?.upper || "1 veľké písmeno"} />
                        <PasswordRequirement met={passwordCriteria.lower} text={t?.login?.register?.passwordRequirements?.lower || "1 malé písmeno"} />
                        <PasswordRequirement met={passwordCriteria.number} text={t?.login?.register?.passwordRequirements?.number || "1 číslo (0-9)"} />
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div>
                <label className="block text-sm font-bold text-neutral-700 mb-1.5 pl-1">{t?.login?.register?.repeatPassword || 'Potvrdiť heslo'}</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    name="repeatPassword"
                    type={showRepeatPassword ? 'text' : 'password'}
                    value={repeatPassword}
                    onChange={(e) => setRepeatPassword(e.target.value)}
                    className={`w-full pl-11 pr-12 py-3 bg-neutral-50 border rounded-2xl outline-none transition-all text-sm font-medium ${doPasswordsMatch && repeatPassword ? 'border-emerald-400 ring-2 ring-emerald-100' : 'border-neutral-200 focus:border-primary focus:ring-2 focus:ring-primary'}`}
                    placeholder="••••••••"
                    disabled={!password}
                  />
                  <button
                    type="button"
                    aria-label="Show password"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center justify-center text-neutral-400 hover:text-primary transition-colors focus:outline-none"
                    onMouseDown={(e) => { e.preventDefault(); setShowRepeatPassword(true); }}
                    onMouseUp={() => setShowRepeatPassword(false)}
                    onMouseLeave={() => setShowRepeatPassword(false)}
                    onTouchStart={() => setShowRepeatPassword(true)}
                    onTouchEnd={() => setShowRepeatPassword(false)}
                  >
                    {showRepeatPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                  {doPasswordsMatch && repeatPassword && (
                    <div className="absolute inset-y-0 right-12 pr-2 flex items-center pointer-events-none">
                      <Check className="h-5 w-5 text-emerald-500" />
                    </div>
                  )}
                </div>
                {!doPasswordsMatch && repeatPassword && (
                  <p className="text-xs text-red-500 mt-2 font-bold pl-1">Heslá sa nezhodujú</p>
                )}
              </div>
            </div>

            {/* CHECKBOX */}
            <div className="space-y-4 pt-4 border-t border-neutral-100">
              <div className="flex items-start gap-3 bg-neutral-50/50 p-4 rounded-xl border border-neutral-100">
                <input
                  type="checkbox"
                  id="agreementChecked"
                  name="agreementChecked"
                  checked={agreementChecked}
                  onChange={(e) => setAgreementChecked(e.target.checked)}
                  className="mt-1 w-4 h-4 text-primary border-neutral-300 rounded focus:ring-primary cursor-pointer shrink-0"
                />
                <label
                  htmlFor="agreementChecked"
                  className="text-sm text-neutral-600 leading-relaxed font-semibold cursor-pointer"
                >
                  Vyjadrujem súhlas so{' '}
                  <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-extrabold">
                    Všeobecnými obchodnými podmienkami
                  </a>{' '}
                  a beriem na vedomie, že Informáciu o spracúvaní osobných údajov nájdem{' '}
                  <a href="/gdpr" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-extrabold">
                    TU
                  </a>.
                  {' '}<span className="text-red-500 font-bold">*</span>
                </label>
              </div>

              <div className="flex items-start gap-3 p-4">
                <input
                  id="noMarketing"
                  name="noMarketing"
                  type="checkbox"
                  checked={noMarketingChecked}
                  onChange={(e) => setNoMarketingChecked(e.target.checked)}
                  className="mt-1 w-4 h-4 text-primary border-neutral-300 rounded focus:ring-primary cursor-pointer shrink-0"
                />
                <label htmlFor="noMarketing" className="text-sm text-neutral-500 cursor-pointer font-medium leading-relaxed">
                  Nemám záujem, aby mi boli zasielané marketingové informácie o vlastných podobných tovaroch a službách (novinky, súťaže, voľné termíny na tréningy).
                </label>
              </div>
            </div>

            {/* --- CLOUDFLARE TURNSTILE --- */}
            <div className="flex justify-center py-4 bg-neutral-50/50 rounded-xl border border-neutral-100">
              <Turnstile
                siteKey={import.meta.env.VITE_CLOUDFLARE_SITEKEY}
                onSuccess={(token) => setCaptchaToken(token)}
                ref={turnstileRef}
              />
            </div>

            <button 
              type="submit" 
              className={`w-full py-4 px-6 rounded-full text-white font-bold text-base transition-all flex items-center justify-center gap-2 ${
                isFormValid 
                  ? 'bg-primary hover:bg-primary-600 hover:-translate-y-0.5 shadow-sm' 
                  : 'bg-neutral-300 cursor-not-allowed text-neutral-500'
              }`} 
              disabled={!isFormValid || loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{t?.login?.register?.loading || 'Vytváram účet...'}</span>
                </>
              ) : (
                <>
                  <span>{t?.login?.register?.submit || 'Zaregistrovať sa'}</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            <AnimatePresence>
              {apiError && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex items-center justify-center gap-2 p-4 rounded-2xl text-sm font-bold border ${
                    apiError.includes('success') 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : 'bg-red-50 text-red-700 border-red-200'
                  }`}
                >
                  {apiError.includes('success') ? <Check className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
                  <span>{apiError.replace('success: ', '')}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          <div className="mt-8 text-center border-t border-neutral-100 pt-8 relative z-10">
            <p className="text-neutral-600 font-medium">
              {t?.login?.register?.loginPrompt || 'Už máte vytvorený účet?'} 
              <Link to="/login" className="text-primary hover:text-primary-600 font-extrabold transition-colors hover:underline ml-2">
                {t?.login?.register?.loginLink || 'Prihláste sa tu'}
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;