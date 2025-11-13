import React, { useEffect, useState, useRef } from 'react';
import { Link, BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import { FaSun, FaMoon } from 'react-icons/fa';
import { useTranslation } from './contexts/LanguageContext';
import { LanguageProvider } from './contexts/LanguageContext';
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
import RefundOption from './components/RefundOption';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/components/App.css';
import Foot from './components/Foot';
import CookieConsent from "./components/CookieConsent";

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
      className="theme-toggle"
      aria-label="Toggle theme"
    >
      {theme === 'light' ? <FaMoon size={20} /> : <FaSun size={20} />}
    </button>
  );
};

// User context to manage user state globally
const UserContext = React.createContext();

const UserProvider = ({ children }) => {
  const [user, setUser] = useState({
    isLoggedIn: false,
    firstName: '',
    userId: null
  });

  // Initialize user state from localStorage on app start
  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const firstName = localStorage.getItem('userFirstName') || 
                     localStorage.getItem('userName')?.split(' ')[0] || 
                     '';
    const userId = localStorage.getItem('userId');

    if (isLoggedIn) {
      setUser({
        isLoggedIn: true,
        firstName,
        userId
      });
    }
  }, []);

  const updateUser = (userData) => {
    setUser(userData);
  };

  const logout = () => {
    setUser({
      isLoggedIn: false,
      firstName: '',
      userId: null
    });
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('userFirstName');
  };

  return (
    <UserContext.Provider value={{ user, updateUser, logout }}>
      {children}
    </UserContext.Provider>
  );
};

const useUser = () => React.useContext(UserContext);

// GreetingBar component - UPDATED
const GreetingBar = () => {
  const { user } = useUser();

  console.log('GreetingBar Debug - User state:', user);

  if (!user.isLoggedIn) {
    return null;
  }

  return (
    <div className="greeting-bar">
      <div className="greeting-container">
        <span className="greeting-text">
          Hello, <strong>{user.firstName || 'User'}</strong>! Welcome back.
        </span>
      </div>
    </div>
  );
};

// Navbar component - UPDATED
const Navbar = () => {
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useUser();
  const navigate = useNavigate();
  const { theme } = useTheme();
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
        <GreetingBar />
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
            <Route path="/refund-option" element={<RefundOption />} />
          </Routes>
        </main>
        <Foot />
        <CookieConsent />
      </div>
    </Router>
  );
};
 
// Wrap the app with all providers
const App = () => (
  <LanguageProvider>
    <ThemeProvider>
      <UserProvider>
        <AppContent />
      </UserProvider>
    </ThemeProvider>
  </LanguageProvider>
);

export default App;
export { useUser };