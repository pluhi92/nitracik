import React, { useEffect, useState, useRef } from 'react';
import { Link, BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import { FaSun, FaMoon } from 'react-icons/fa';
import { useTranslation } from './contexts/LanguageContext'; // Import from context
import { LanguageProvider } from './contexts/LanguageContext'; // Import provider
import logo from './assets/logo.png';
import AboutUs from './components/AboutUs';
import Booking from './components/Booking';
import Photos from './components/Photos';
import Contact from './components/Contact';
import Login from './components/Login';
import Register from './components/Register';
import RegistrationSuccess from './components/RegistrationSuccess';
import VerifyEmail from './components/VerifyEmail';
import ThankYou from './components/ThankYou';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import UserProfile from './components/UserProfile';
import AccountDeleted from './components/AccountDeleted';
import PaymentSuccess from './components/PaymentSuccess';
import PaymentCancelled from './components/PaymentCancelled';
import SeasonTickets from './components/SeasonTickets';
import LanguageSwitcher from './components/LanguageSwitcher';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

// Theme context and provider
const ThemeContext = React.createContext();

const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = React.useState('light');

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  React.useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

const useTheme = () => React.useContext(ThemeContext);

// Theme toggle button
const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle btn btn-link"
      aria-label="Toggle theme"
    >
      {theme === 'light' ? <FaMoon size={24} /> : <FaSun size={24} />}
    </button>
  );
};

// Navbar component
const Navbar = () => {
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userId');
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
    <nav className={`navbar navbar-expand-lg navbar-light shadow-sm py-3 ${theme === 'dark' ? 'navbar-dark bg-dark' : 'bg-white'}`}>
      <div className="container">
        <div className="navbar-header">
          <Link className="navbar-brand" to="/">
            <img src={logo} alt="Logo" className="logo-image" />
          </Link>
          <button
            className="navbar-toggler"
            onClick={toggleMenu}
            aria-label="Toggle navigation"
          >
            {isMenuOpen ? <span>✕</span> : <span>☰</span>}
          </button>
        </div>
        <div className={`collapse navbar-collapse ${isMenuOpen ? 'show' : ''}`} id="navbarNav">
          <ul className="navbar-nav">
            <li className="nav-item">
              <Link className="nav-link nav-link-custom" to="/about">
                {t?.navbar?.about || 'About Nitracik'}
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link nav-link-custom" to="/photos">
                {t?.navbar?.photos || 'Gallery'}
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link nav-link-custom" to="/booking">
                {t?.navbar?.booking || 'Book your session'}
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link nav-link-custom" to="/contact">
                {t?.navbar?.contact || 'Contact'}
              </Link>
            </li>
          </ul>
          <div className="navbar-controls-wrapper">
            <div className="navbar-controls-group">
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
                  {isLoggedIn ? (
                    <>
                      <Link
                        to="/profile"
                        className="dropdown-item"
                        onClick={() => setIsDropdownOpen(false)}
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
                        }}
                      >
                        {t?.navbar?.logout || 'Logout'}
                      </button>
                    </>
                  ) : (
                    <Link
                      to="/login"
                      className="dropdown-item"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      {t?.navbar?.login || 'Login'}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

// Footer component
const Footer = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <footer className={`py-4 mt-auto ${theme === 'dark' ? 'bg-dark text-white' : 'bg-light text-dark'}`}>
      <div className="container text-center">
        <p className="mb-0 fs-5">
          {t?.footer?.copyright || '© 2025 Nitracik. All rights reserved.'}
        </p>
      </div>
    </footer>
  );
};

// Main App component
const AppContent = () => {
  const { theme } = useTheme();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <Router>
      <div className="d-flex flex-column min-vh-100">
        <Navbar />
        <main className="flex-grow-1">
          <Routes>
            <Route path="/" element={<AboutUs />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/booking" element={<Booking />} />
            <Route path="/profile" element={<UserProfile />} />
            <Route path="/photos" element={<Photos />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/registration-success" element={<RegistrationSuccess />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/thank-you" element={<ThankYou />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/account-deleted" element={<AccountDeleted />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/payment-cancelled" element={<PaymentCancelled />} />
            <Route path="/season-tickets" element={<SeasonTickets />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
};

// Wrap the app with both ThemeProvider and LanguageProvider
const App = () => (
  <LanguageProvider>
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  </LanguageProvider>
);

export default App;