import React from 'react';
import { Link, BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';
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
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

const Navbar = () => {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userId');
    navigate('/'); // Redirect to home page after logout
    window.location.reload(); // Refresh the page to update the UI
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm py-3">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/">
          <img src={logo} alt="Logo" className="logo-image" />
        </Link>
        <button
          className="navbar-toggler border-0"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto align-items-lg-center">
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
            <li className="nav-item mx-lg-3">
              {isLoggedIn ? (
                <button className="btn btn-danger" onClick={handleLogout}>
                  Logout
                </button>
              ) : (
                <Link className="nav-link nav-link-custom" to="/login">
                  <img src={loginIcon} alt="Login" style={{ width: '24px', height: '24px' }} />
                </Link>
              )}
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

const Footer = () => {
  return (
    <footer className="bg-dark text-white py-4 mt-auto">
      <div className="container text-center">
        <p className="mb-0 fs-5">&copy; 2025 Nitracik. All rights reserved.</p>
      </div>
    </footer>
  );
};

const App = () => {
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
            <Route path="/thank-you" element={<ThankYou />} /> {/* Thank-you page */}
            <Route path="/forgot-password" element={<ForgotPassword />} /> {/* Forgot Password page */}
            <Route path="/reset-password" element={<ResetPassword />} /> {/* Reset Password page */}
            <Route path="/account-deleted" element={<AccountDeleted />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
};

export default App;