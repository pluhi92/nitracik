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
import '../styles/components/Navbar.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle"
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

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Left: Logo */}
        <div className="navbar-header">
          <Link className="navbar-brand" to="/">
            <img src={logo} alt="Logo" className="logo-image" />
          </Link>

          {/* Mobile toggle */}
          <button
            className="navbar-toggler"
            onClick={toggleMenu}
            aria-label="Toggle navigation"
          >
            {isMenuOpen ? <span>✕</span> : <span>☰</span>}
          </button>
        </div>

        {/* Center: Navigation Links - HORIZONTAL LAYOUT */}
        <ul className={`navbar-nav ${isMenuOpen ? 'show' : ''}`}>
          <li className="nav-item">
            <Link
              className="nav-link-custom"
              to="/about"
              onClick={() => setIsMenuOpen(false)}
            >
              {t?.navbar?.about || 'About Nitracik'}
            </Link>
          </li>
          <li className="nav-item">
            <Link
              className="nav-link-custom"
              to="/photos"
              onClick={() => setIsMenuOpen(false)}
            >
              {t?.navbar?.photos || 'Gallery'}
            </Link>
          </li>
          <li className="nav-item">
            <Link
              className="nav-link-custom"
              to="/booking"
              onClick={() => setIsMenuOpen(false)}
            >
              {t?.navbar?.booking || 'Book your session'}
            </Link>
          </li>
          <li className="nav-item">
            <Link
              className="nav-link-custom"
              to="/contact"
              onClick={() => setIsMenuOpen(false)}
            >
              {t?.navbar?.contact || 'Contact'}
            </Link>
          </li>
        </ul>

        {/* Right: Controls */}
        <div className={`navbar-controls-wrapper ${isMenuOpen ? 'show' : ''}`}>
          <LanguageSwitcher />
          <ThemeToggle />
          <div className={`user-dropdown ${isDropdownOpen ? 'open' : ''}`} ref={dropdownRef}>
            <button
              className="user-dropdown-toggle"
              onClick={toggleDropdown}
              aria-expanded={isDropdownOpen}
              aria-label="User menu"
            >
              <FontAwesomeIcon icon={faUser} className="user-icon" />
            </button>
            <div className="user-dropdown-menu">
              {user.isLoggedIn ? (
                <>
                  <Link
                    to="/profile"
                    className="dropdown-item"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      setIsMenuOpen(false);
                    }}
                  >
                    <FontAwesomeIcon icon={faUser} className="me-2" />
                    {t?.navbar?.profile || 'My Profile'}
                  </Link>
                  <div className="dropdown-divider"></div>
                  <button
                    className="dropdown-item"
                    onClick={() => {
                      handleLogout();
                      setIsDropdownOpen(false);
                      setIsMenuOpen(false);
                    }}
                  >
                    {t?.navbar?.logout || 'Logout'}
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="dropdown-item"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    setIsMenuOpen(false);
                  }}
                >
                  {t?.navbar?.login || 'Login'}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;