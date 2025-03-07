import React, { useEffect, useState } from 'react';
import { Link, BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import { FaSun, FaMoon } from 'react-icons/fa'; // Import theme toggle icons
import logo from './assets/logo.png';
import loginIcon from './assets/login-icon.png';
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
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

// Theme context and provider
const ThemeContext = React.createContext();

const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = React.useState('light'); // Default theme is light

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme); // Save theme to localStorage
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
  const [isMenuOpen, setIsMenuOpen] = useState(false); // Declare state for menu visibility
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const navigate = useNavigate();
  const { theme } = useTheme();

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userId');
    navigate('/'); // Redirect to home page after logout
    window.location.reload(); // Refresh the page to update the UI
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen); // Toggle menu visibility
  };

  return (
    <nav className={`navbar navbar-expand-lg navbar-light shadow-sm py-3 ${theme === 'dark' ? 'navbar-dark bg-dark' : 'bg-white'}`}>
      <div className="container">
        <Link className="navbar-brand" to="/">
          <img src={logo} alt="Logo" className="logo-image" />
        </Link>
        <button
          className="navbar-toggler border-0"
          type="button"
          onClick={toggleMenu} // Use custom toggle function
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className={`collapse navbar-collapse ${isMenuOpen ? 'show' : ''}`} id="navbarNav">
          <ul className="navbar-nav mx-auto mb-2 mb-lg-0">
            <li className="nav-item mx-lg-3">
              <Link className="nav-link nav-link-custom" to="/about">
                About Us
              </Link>
            </li>
            <li className="nav-item mx-lg-3">
              <Link className="nav-link nav-link-custom" to="/photos">
                Photos
              </Link>
            </li>
            <li className="nav-item mx-lg-3">
              <Link className="nav-link nav-link-custom" to="/booking">
                Booking
              </Link>
            </li>
            <li className="nav-item mx-lg-3">
              <Link className="nav-link nav-link-custom" to="/contact">
                Contact
              </Link>
            </li>
            {isLoggedIn && (
              <li className="nav-item mx-lg-3">
                <Link className="nav-link nav-link-custom" to="/profile">
                  <FontAwesomeIcon icon={faUser} className="me-2" />
                  My Profile
                </Link>
              </li>
            )}
          </ul>
          <div className="d-flex align-items-center">
            {isLoggedIn ? (
              <button className="btn btn-danger me-3" onClick={handleLogout}>
                Logout
              </button>
            ) : (
              <Link className="nav-link nav-link-custom me-3" to="/login">
                <img src={loginIcon} alt="Login" style={{ width: '24px', height: '24px' }} />
              </Link>
            )}
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
};

// Footer component
const Footer = () => {
  const { theme } = useTheme();

  return (
    <footer className={`py-4 mt-auto ${theme === 'dark' ? 'bg-dark text-white' : 'bg-light text-dark'}`}>
      <div className="container text-center">
        <p className="mb-0 fs-5">&copy; 2025 Nitracik. All rights reserved.</p>
      </div>
    </footer>
  );
};

// Main App component
const AppContent = () => {
  const { theme } = useTheme();

  // Apply theme to the root element
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
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
};

// Wrap the app with ThemeProvider
const App = () => (
  <ThemeProvider>
    <AppContent />
  </ThemeProvider>
);

export default App;