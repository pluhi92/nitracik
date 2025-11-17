import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { useTranslation } from './contexts/LanguageContext';
import { LanguageProvider } from './contexts/LanguageContext';
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
import RefundOption from './components/RefundOption';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/components/App.css';
import Foot from './components/Foot';
import CookieConsent from "./components/CookieConsent";
import GreetingBar from './components/GreetingBar';
import Navbar from './components/Navbar';

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
export { useTheme, useUser };