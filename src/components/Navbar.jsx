import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from '../contexts/LanguageContext';
import { useUser } from '../contexts/UserContext';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Menu, X, LogOut, Settings, ChevronDown } from 'lucide-react';

import LanguageSwitcher from './LanguageSwitcher';
import logo from '../assets/logo.png';

const Navbar = () => {
  const { t } = useTranslation();
  const { user, logout } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const dropdownRef = useRef(null);
  const lastScrollY = useRef(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024); // lg breakpoint

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) setIsMenuOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Zavrieme menu a dropdown pri zmene routy (kliknutí na link)
  useEffect(() => {
    setIsMenuOpen(false);
    setIsDropdownOpen(false);
  }, [location.pathname]);

  // Scroll detection pre automatické skrytie/objavenie navbaru
  useEffect(() => {
    if (!isMobile) return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current && currentScrollY > 60) {
        setIsHidden(true); // scroll dole → skry navbar
      } else {
        setIsHidden(false); // scroll hore → ukáž navbar
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobile]);

  // Klik mimo dropdownu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinks = [
    { path: '/about', label: t?.navbar?.about || 'O Nitračikovi' },
    { path: '/aktivity', label: t?.navbar?.activities || 'Aktivity' },
    { path: '/booking', label: t?.navbar?.booking || 'Rezervuj si termín' },
    { path: '/contact', label: t?.navbar?.contact || 'Kontakt' },
  ];

  return (
    <>
      <nav
        className={`fixed w-full top-0 z-[1000] transition-transform duration-300 ${
          isMobile && isHidden ? '-translate-y-full' : 'translate-y-0'
        }`}
      >
      {/* Hlavný panel s Glassmorphism efektom */}
      <div className="bg-white/90 backdrop-blur-md border-b border-neutral-200/60 shadow-sm">
        <div className="container-custom flex items-center justify-between h-[90px]">
          
          {/* Logo */}
          <Link to="/" className="flex items-center shrink-0">
            <img
              src={logo}
              alt="Nitráčik Logo"
              className="h-14 w-auto object-contain transition-transform duration-300 hover:scale-105"
            />
          </Link>

          {/* Desktop Links */}
          <ul className="hidden lg:flex items-center gap-1 mx-auto">
            {navLinks.map(({ path, label }) => {
              const isActive = location.pathname.startsWith(path);
              return (
                <li key={path}>
                  <Link
                    to={path}
                    className={`px-4 py-2.5 rounded-full font-bold text-[17px] transition-all duration-200 block ${
                      isActive
                        ? 'text-rose-700 bg-rose-50'
                        : 'text-foreground hover:text-primary hover:bg-neutral-100'
                    }`}
                  >
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Desktop Controls */}
          <div className="hidden lg:flex items-center gap-3 shrink-0">
            <div className="relative z-10">
              <LanguageSwitcher />
            </div>

            {/* User Dropdown */}
            <div className="relative ml-2" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                aria-expanded={isDropdownOpen}
                aria-label="User menu"
                className={`flex items-center justify-center w-11 h-11 rounded-full border transition-all duration-200 ${
                  isDropdownOpen
                    ? 'border-primary bg-primary/5 text-primary shadow-sm'
                    : 'border-neutral-200 bg-white text-neutral-600 hover:border-primary hover:text-primary hover:bg-neutral-50'
                }`}
              >
                <User className="w-5 h-5" />
              </button>

              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-elevated border border-neutral-100 overflow-hidden py-2"
                  >
                    {user.isLoggedIn ? (
                      <>
                        <div className="px-4 py-3 border-b border-neutral-100 mb-2 bg-neutral-50/50">
                          <p className="text-sm font-bold text-foreground truncate">Prihlásený užívateľ</p>
                        </div>
                        <Link
                          to="/profile"
                          className="flex items-center px-4 py-2.5 text-sm font-semibold text-neutral-600 hover:text-primary hover:bg-primary/5 transition-colors mx-2 rounded-xl"
                        >
                          <Settings className="w-4 h-4 mr-3" />
                          {t?.navbar?.profile || 'Môj profil'}
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="flex items-center w-full px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors mt-1 mx-2 rounded-xl"
                        >
                          <LogOut className="w-4 h-4 mr-3" />
                          {t?.navbar?.logout || 'Odhlásiť sa'}
                        </button>
                      </>
                    ) : (
                      <div className="px-2">
                        <Link
                          to="/login"
                          onClick={() => setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 80)}
                          className="flex justify-center items-center w-full px-4 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary-600 transition-colors shadow-sm"
                        >
                          {t?.navbar?.login || 'Prihlásiť sa'}
                        </Link>
                        <Link
                          to="/register"
                          className="flex justify-center items-center w-full px-4 py-2.5 mt-2 text-sm font-bold text-primary bg-primary/10 rounded-xl hover:bg-primary/20 transition-colors"
                        >
                          Registrácia
                        </Link>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Mobile toggle button (render only on mobile to avoid showing on desktop) */}
          {isMobile && (
            <button
              className="flex items-center justify-center w-11 h-11 rounded-full border border-neutral-200 bg-white text-foreground hover:bg-neutral-50 active:scale-95 transition-all ml-auto"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle navigation"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="lg:hidden bg-white/95 backdrop-blur-xl border-b border-neutral-200/60 shadow-lg overflow-hidden"
          >
            <div className="px-4 py-6 space-y-2">
              {navLinks.map(({ path, label }) => {
                const isActive = location.pathname.startsWith(path);
                return (
                  <Link
                    key={path}
                    to={path}
                    className={`block px-5 py-3.5 rounded-2xl font-bold text-[15px] transition-all ${
                        isActive 
                          ? 'text-rose-700 bg-rose-50' 
                          : 'text-foreground hover:bg-neutral-100'
                      }`}
                  >
                    {label}
                  </Link>
                );
              })}

              <div className="border-t border-neutral-100 my-4 pt-4 px-2">
                <div className="flex items-center justify-between mb-6">
                  <span className="font-bold text-neutral-500 text-sm">Jazyk aplikácie</span>
                  <LanguageSwitcher />
                </div>
                
                {user.isLoggedIn ? (
                  <div className="space-y-3">
                    <Link
                      to="/profile"
                      className="flex items-center justify-center w-full px-5 py-3.5 rounded-2xl font-bold text-foreground border border-neutral-200 bg-white hover:bg-neutral-50 transition-colors"
                    >
                      <Settings className="w-5 h-5 mr-2 text-neutral-500" />
                      {t?.navbar?.profile || 'Môj profil'}
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center justify-center w-full px-5 py-3.5 rounded-2xl font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                    >
                      <LogOut className="w-5 h-5 mr-2" />
                      {t?.navbar?.logout || 'Odhlásiť sa'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Link
                      to="/login"
                      onClick={() => setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 80)}
                      className="flex items-center justify-center w-full px-5 py-3.5 rounded-2xl font-bold text-white bg-primary shadow-sm hover:bg-primary-600 transition-colors"
                    >
                      {t?.navbar?.login || 'Prihlásiť sa'}
                    </Link>
                    <Link
                      to="/register"
                      className="flex items-center justify-center w-full px-5 py-3.5 rounded-2xl font-bold text-primary bg-primary/10 hover:bg-primary/20 transition-colors"
                    >
                      Nemáte účet? Zaregistrujte sa
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </nav>

      {/* Spacer to push page content below the fixed navbar (prevents carousel/content appearing under navbar) */}
      <div aria-hidden className="h-[90px] lg:h-[90px]" />
    </>
  );
};

export default Navbar;