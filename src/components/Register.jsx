import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from '../contexts/LanguageContext';
import api from '../api/api';
import { Turnstile } from '@marsidev/react-turnstile';
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

const FlakPink = ({ className, style }) => (
  <svg viewBox="0 0 170.079 170.658" xmlns="http://www.w3.org/2000/svg" className={className} style={style} aria-hidden="true">
    <path transform="matrix(1,0,0,-1,102.0004,33.3618)" fill="#F4A5A5" d="M0 0C-.049 .001-.084 .006-.122 .01-.182 .023-.241 .037-.301 .049-.28 .054-.187 .045 0 0M19.592-55.855C20.281-56.109 20.126-56.34 19.592-55.855M59.411-29.461C57.428-26.123 53.616-24.284 50.208-22.771 45.813-20.82 41.283-19.202 36.756-17.587 34.934-16.937 33.322-16.418 31.946-15.898 33.149-13.263 34.563-10.35 35.803-7.743 38.635-1.79 44.262 6.585 43.568 13.498L43.497 13.469C43.477 15.353 42.864 17.163 41.371 18.802 37.474 23.079 28.987 20.373 28.555 14.604 28.445 14.402 28.336 14.198 28.223 14.009 27.353 12.55 26.389 11.142 25.433 9.738 23.773 7.298 22.062 4.894 20.341 2.496 17.561 3.718 13.969 3.659 11.099 3.032 9.233 2.625 7.411 2.02 5.587 1.448 4.969 4.959 2.515 8.404-1.587 7.855-4.99 7.4-8.385 6.912-11.775 6.385-12.271 11.193-13.235 15.956-14.62 20.562-16.34 26.288-22.863 27.479-27.155 23.872-29.653 21.772-31.991 19.435-34.568 17.453-34.618 17.567-34.663 17.681-34.714 17.794-38.307 25.869-50.188 19.92-48.422 12.015-47.755 9.033-46.907 6.076-45.887 3.176-46.502 3.008-47.126 2.762-47.758 2.406-57.967-3.36-68.755-7.401-80.21-9.896-84.776-10.891-86.216-14.818-85.362-18.369-86.023-18.416-86.685-18.451-87.347-18.501-96.907-19.233-97.085-33.067-87.347-33.501-81.613-33.757-75.879-34.013-70.144-34.269-70.426-35.257-70.513-36.288-70.372-37.299-71.676-36.835-73.11-36.745-74.61-37.174-77.526-38.008-80.49-41.163-80.116-44.406-79.648-48.474-77.55-52.006-74.602-54.375-73.368-56.077-72.13-57.775-70.894-59.475-73.925-59.862-76.894-62.027-77.429-64.966-77.515-65.437-77.579-65.903-77.632-66.367-77.665-66.302-77.709-66.233-77.74-66.169-77.842-65.96-78.057-65.256-78.171-64.792-78.171-64.779-78.171-64.766-78.17-64.753-78.013-65.121-77.933-63.415-78.146-64.399-76.112-55.002-90.455-50.97-92.61-60.411-94.585-69.06-90.861-78.252-87.146-85.912-83.522-93.383-78.368-102.026-71.043-106.413-70.899-106.499-70.752-106.575-70.607-106.655-71.385-107.292-72.087-107.977-72.681-108.716-75.51-112.236-75.857-118.087-71.163-120.496-66.359-122.962-59.616-121.749-53.963-118.957-52.734-120.363-51.239-121.576-49.448-122.532-45.554-124.61-40.944-124.631-36.98-122.994-32.924-124.98-28.867-126.966-24.81-128.953-21.445-130.6-16.346-130.152-14.549-126.262-12.801-122.479-12.278-118.361-12.835-114.457-12.433-114.495-12.031-114.533-11.629-114.57-7.965-114.914-4.666-111.455-4.263-108.067-4.142-107.049-4.209-106.096-4.432-105.218-3.22-104.77-2.05-104.177-.94-103.467 1.423-105.279 3.805-107.066 6.221-108.806 12.385-113.244 19.072-118.602 26.383-121.019 31.118-122.584 36.677-121.152 38.264-115.886 39.425-112.034 37.477-108.294 35.327-105.21 31.237-99.345 26.243-94.192 21.555-88.821 21.454-88.705 21.354-88.587 21.253-88.471 25.425-87.677 28.671-85.208 31.348-81.712 33.784-78.532 31.874-73.606 28.881-71.604 29.147-71.392 29.404-71.181 29.645-70.975 34.107-67.15 37.25-61.703 36.609-55.69 35.893-48.969 30.618-45.112 25.644-41.229 34.669-43.988 45.652-46.496 54.535-42.159 59.491-39.739 62.499-34.66 59.411-29.461" />
  </svg>
);

const FlakCream = ({ className, style }) => (
  <svg viewBox="0 0 170.079 186.77" xmlns="http://www.w3.org/2000/svg" className={className} style={style} aria-hidden="true">
    <path transform="matrix(1,0,0,-1,48.2144,165.57071)" fill="#EFE4C8" d="M0 0C-.168-.194-.238-.269 0 0M-26.05 53.518C-26.131 53.517-26.214 53.524-26.295 53.521-26.528 53.513-26.826 53.628-27.052 53.58-26.742 53.646-26.402 53.614-26.05 53.518M-21.47 47.527C-21.498 47.541-21.521 47.552-21.534 47.559-21.638 47.617-21.705 47.635-21.758 47.641-21.758 47.645-21.757 47.646-21.757 47.65-21.734 48.081-21.613 47.898-21.47 47.527M110.15 62.303C107.116 63.184 104.727 64.781 102.823 66.842 103.529 68.373 103.864 69.987 103.89 71.627 107.735 73.614 110.494 77.248 110.025 82.154 109.638 86.21 106.903 89.629 102.525 89.654 100.286 89.667 98.047 89.68 95.808 89.693 95.791 89.776 95.772 89.859 95.755 89.942 96.096 90.51 96.433 91.081 96.746 91.661 102.128 101.644 101.602 115.764 91.484 122.235 87.426 127.948 80.504 130.605 73.631 130.344 71.238 131.943 68.231 132.319 65.794 131.33 65.44 132.156 65.044 132.975 64.57 133.777 62.624 137.073 59.423 137.949 56.571 137.17 53.53 142.418 50.094 147.541 46.219 152.177 44.129 154.678 41.587 157.301 38.336 158.187 33.582 159.483 29.055 156.611 27.626 152.049 25.506 145.277 27.868 136.599 29.08 129.88 29.306 128.625 29.59 127.328 29.898 126.01 29.882 125.982 29.865 125.955 29.849 125.928 28.135 124.055 26.418 122.185 24.71 120.308 23.918 119.437 22.939 118.469 21.906 117.431 21.381 117.615 20.844 117.777 20.293 117.908 16.407 124.779 12.204 132.099 11.117 139.561 10.307 145.122 2.057 146.775-1.419 142.871-7.775 135.73-6.737 125.805-4.314 117.219-4.223 116.895-4.111 116.574-4.015 116.251-7.819 115.72-11.541 114.236-14.5 111.961-21.762 114.214-29.373 114.816-36.422 113.282-43.959 111.641-43.148 100.885-36.422 98.818-29.578 96.714-23.759 92.901-18.416 88.34-20.759 88.357-23.047 87.64-24.772 85.878-28.055 82.525-27.219 78.105-25.606 74.209-22.098 65.735-14.95 59.381-7.67 54.053-10.925 53.889-14.181 53.732-17.439 53.612-19.622 53.532-21.81 53.451-23.995 53.466-24.472 53.469-24.953 53.493-25.433 53.509-29.306 54.641-34.412 52.786-35.444 48.477-37.939 38.061-28.156 33.128-19.643 31.287-12.564 29.757-5.314 29.111 1.923 28.51 .46 22.217-.966 15.912-2.183 9.568-3.345 3.505-4.649-2.693-3.781-8.86-3.037-14.148 3.398-15.053 7.236-13.342 12.229-11.117 15.582-4.028 18.151 .638 18.69-.342 19.373-1.294 20.226-2.201 25.939-8.272 35.783-8.166 42.419-3.696 46.618-.867 48.926 3.22 50.119 7.756 57.704 3.858 66.779 2.626 74.906 4.709 80.686 6.19 88.654 10.306 92.058 15.338 97.075 22.757 91.471 28.464 84.373 30.439 84.335 30.449 84.258 30.473 84.159 30.504 85.116 32.223 85.851 34.067 86.308 35.971 87.099 39.259 87.17 43.268 86.072 46.52 86.044 46.603 86.006 46.683 85.976 46.765 86.932 46.624 87.894 46.427 88.868 46.138 91.649 45.314 94.118 46.242 95.839 47.967 97.975 47.722 99.924 48.397 101.384 49.651 102.872 48.948 104.456 48.334 106.162 47.839 115.451 45.143 119.417 59.614 110.15 62.303" />
  </svg>
);

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
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="relative w-full bg-white">
      <div className="max-w-2xl w-full mx-auto">
        <div className="bg-white rounded-[2rem] shadow-md border-2 border-neutral-300 p-8 sm:p-12 relative overflow-hidden">
          <FlakCream className="absolute pointer-events-none z-0" style={{ width: 190, top: 10, right: -22, opacity: 0.32, transform: 'rotate(20deg)' }} />
          <FlakPink className="absolute pointer-events-none z-0" style={{ width: 175, bottom: 10, left: -18, opacity: 0.35, transform: 'rotate(-30deg)' }} />
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
                
                {showCityDropdown && citySuggestions.length > 0 && (
                    <ul className="absolute z-50 w-full bg-white border border-neutral-200 rounded-xl shadow-lg max-h-48 overflow-y-auto mt-2 py-1">
                      {citySuggestions.map((city, idx) => (
                        <li key={idx} onClick={() => handleSelectCity(city)} className="px-4 py-2.5 hover:bg-neutral-50 cursor-pointer text-sm font-medium text-neutral-700 transition-colors border-b border-neutral-50 last:border-0">
                          {city.display_name}
                        </li>
                      ))}
                    </ul>
                  )}

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
                
                {showStreetDropdown && streetSuggestions.length > 0 && !hasNoStreet && (
                    <ul className="absolute z-50 w-full bg-white border border-neutral-200 rounded-xl shadow-lg max-h-48 overflow-y-auto mt-2 py-1">
                      {streetSuggestions.map((street, idx) => (
                        <li key={idx} onClick={() => handleSelectStreet(street)} className="px-4 py-2.5 hover:bg-neutral-50 cursor-pointer text-sm font-medium text-neutral-700 transition-colors border-b border-neutral-50 last:border-0">
                          {street.display_name.split(',')[0]}
                        </li>
                      ))}
                    </ul>
                  )}

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
                
                {showPasswordRequirements && (
                    <div className="overflow-hidden">
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 p-3 bg-neutral-50 rounded-xl border border-neutral-100">
                        <PasswordRequirement met={passwordCriteria.length} text={t?.login?.register?.passwordRequirements?.length || "Min. 8 znakov"} />
                        <PasswordRequirement met={passwordCriteria.upper} text={t?.login?.register?.passwordRequirements?.upper || "1 veľké písmeno"} />
                        <PasswordRequirement met={passwordCriteria.lower} text={t?.login?.register?.passwordRequirements?.lower || "1 malé písmeno"} />
                        <PasswordRequirement met={passwordCriteria.number} text={t?.login?.register?.passwordRequirements?.number || "1 číslo (0-9)"} />
                      </ul>
                    </div>
                  )}

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

            {apiError && (
                <div className={`flex items-center justify-center gap-2 p-4 rounded-2xl text-sm font-bold border ${
                  apiError.includes('success') 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                    : 'bg-red-50 text-red-700 border-red-200'
                }`}>
                  {apiError.includes('success') ? <Check className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
                  <span>{apiError.replace('success: ', '')}</span>
                </div>
              )}

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
      </div>
      </div>
    </div>
  );
};

export default Register;