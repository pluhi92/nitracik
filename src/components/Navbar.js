import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import { FaSun, FaMoon } from 'react-icons/fa';
import { useTranslation } from '../contexts/LanguageContext';
import { useTheme } from '../App';
import { useUser } from '../App';
import LanguageSwitcher from './LanguageSwitcher';
import logo from '../assets/logo.png';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="w-10 h-10 flex items-center justify-center border-2 border-secondary-500 text-secondary-500 rounded-full hover:border-secondary-600 hover:text-secondary-600 hover:bg-[rgba(230,138,117,0.15)] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
      aria-label="Toggle theme"
    >
      {theme === 'light' ? <FaMoon size={20} /> : <FaSun size={20} />}
    </button>
  );
};

const Navbar = () => {
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useUser();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/');
    window.location.reload();
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-md sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between px-4 lg:px-8 h-[90px]">
        {/* Logo */}
        <Link to="/" className="flex items-center">
          <img src={logo} alt="Logo" className="h-14 w-auto object-contain transition-transform duration-300 hover:scale-105" />
        </Link>

        {/* Desktop Links */}
        <ul className="hidden lg:flex gap-8 mx-auto">
          {[
            { path: '/about', label: t?.navbar?.about || 'About Nitracik' },
            { path: '/photos', label: t?.navbar?.photos || 'Gallery' },
            { path: '/booking', label: t?.navbar?.booking || 'Book your session' },
            { path: '/contact', label: t?.navbar?.contact || 'Contact' },
          ].map(({ path, label }) => (
            <li key={path}>
              <Link
                to={path}
                className="text-secondary-500 font-semibold px-3 py-3 rounded-lg hover:text-secondary-600 hover:bg-[rgba(230,138,117,0.15)] transition text-lg"              >
                {label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Desktop Controls */}
        <div className="hidden lg:flex items-center gap-4">
          {/* LanguageSwitcher with hover/active highlight */}
          <div className="relative">
            <LanguageSwitcher />
            <div className="absolute inset-0 rounded hover:bg-[rgba(230,138,117,0.15)] pointer-events-none"></div>
          </div>

          <ThemeToggle />

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              aria-expanded={isDropdownOpen}
              className="w-10 h-10 flex items-center justify-center border-2 border-secondary-500 text-secondary-500 rounded-full hover:border-secondary-600 hover:text-secondary-600 hover:bg-[rgba(230,138,117,0.15)] transition"
            >
              <FontAwesomeIcon icon={faUser} />
            </button>
            <div className={`absolute right-0 mt-2 w-44 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 transition-all duration-200 ease-in-out ${isDropdownOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'}`}>
              {user.isLoggedIn ? (
                <>
                  <Link
                    to="/profile"
                    onClick={() => setIsDropdownOpen(false)}
                    className="block px-4 py-2 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    <FontAwesomeIcon icon={faUser} className="me-2" />
                    {t?.navbar?.profile || 'My Profile'}
                  </Link>
                  <button
                    onClick={() => { handleLogout(); setIsDropdownOpen(false); }}
                    className="w-full text-left px-4 py-2 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    {t?.navbar?.logout || 'Logout'}
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setIsDropdownOpen(false)}
                  className="block px-4 py-2 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  {t?.navbar?.login || 'Login'}
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Mobile toggle button */}
        <button
          className="lg:hidden p-2 rounded border-2 border-secondary-500 text-secondary-500 hover:border-secondary-600 hover:text-secondary-600 hover:bg-[rgba(230,138,117,0.15)] ml-auto"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle navigation"
        >
          {isMenuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="lg:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <ul className="flex flex-col gap-1 p-4 items-center">
            {/* Navigation Links */}
            {[
              { path: '/about', label: t?.navbar?.about || 'O Nitračikovi' },
              { path: '/photos', label: t?.navbar?.photos || 'Galéria' },
              { path: '/booking', label: t?.navbar?.booking || 'Rezervuj si termín' },
              { path: '/contact', label: t?.navbar?.contact || 'Kontakt' },
            ].map(({ path, label }, index) => (
              <li key={path} className="w-full">
                <Link
                  to={path}
                  onClick={() => setIsMenuOpen(false)}
                  className="block text-center px-3 py-2 text-secondary-500 font-semibold rounded hover:text-secondary-600 hover:bg-[rgba(230,138,117,0.15)] transition w-full"
                >
                  {label}
                </Link>

                {/* Separator iba po poslednom linku */}
                {index === 3 && <hr className="border-black-400 dark:border-gray-700 w-full my-2" />}
              </li>
            ))}

            {/* Controls: ThemeToggle | LanguageSwitcher | User Dropdown */}
            <div className="flex justify-center items-center gap-4 w-full mt-2">
              <ThemeToggle />
              <LanguageSwitcher />
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  aria-expanded={isDropdownOpen}
                  className="w-10 h-10 flex items-center justify-center border-2 border-secondary-500 text-secondary-500 rounded-full hover:border-secondary-600 hover:text-secondary-600 hover:bg-[rgba(230,138,117,0.15)] transition"
                >
                  <FontAwesomeIcon icon={faUser} />
                </button>
                <div className={`absolute right-0 mt-2 w-44 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 transition-all duration-200 ease-in-out ${isDropdownOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'}`}>
                  {user.isLoggedIn ? (
                    <>
                      <Link
                        to="/profile"
                        onClick={() => { setIsDropdownOpen(false); setIsMenuOpen(false); }}
                        className="block px-4 py-2 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-center"
                      >
                        <FontAwesomeIcon icon={faUser} className="me-2" />
                        {t?.navbar?.profile || 'My Profile'}
                      </Link>
                      <button
                        onClick={() => { handleLogout(); setIsDropdownOpen(false); setIsMenuOpen(false); }}
                        className="w-full text-left px-4 py-2 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-center"
                      >
                        {t?.navbar?.logout || 'Logout'}
                      </button>
                    </>
                  ) : (
                    <Link
                      to="/login"
                      onClick={() => { setIsDropdownOpen(false); setIsMenuOpen(false); }}
                      className="block px-4 py-2 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-center"
                    >
                      {t?.navbar?.login || 'Login'}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </ul>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
