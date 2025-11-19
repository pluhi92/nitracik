import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { LanguageProvider } from './contexts/LanguageContext';
import { UserProvider } from './contexts/UserContext';

import Navbar from './components/Navbar';
import GreetingBar from './components/GreetingBar';
import Foot from './components/Foot';
import CookieConsent from './components/CookieConsent';

// Lazy loaded components
const AboutUs = lazy(() => import('./components/AboutUs'));
const Booking = lazy(() => import('./components/Booking'));
const Photos = lazy(() => import('./components/Photos'));
const Contact = lazy(() => import('./components/Contact'));
const Login = lazy(() => import('./components/Login'));
const Register = lazy(() => import('./components/Register'));
const RegistrationSuccess = lazy(() => import('./components/RegistrationSuccess'));
const VerifyEmail = lazy(() => import('./components/VerifyEmail'));
const ThankYou = lazy(() => import('./components/ThankYou'));
const ForgotPassword = lazy(() => import('./components/ForgotPassword'));
const ResetPassword = lazy(() => import('./components/ResetPassword'));
const UserProfile = lazy(() => import('./components/UserProfile'));
const AccountDeleted = lazy(() => import('./components/AccountDeleted'));
const PaymentSuccess = lazy(() => import('./components/PaymentSuccess'));
const PaymentCancelled = lazy(() => import('./components/PaymentCancelled'));
const SeasonTickets = lazy(() => import('./components/SeasonTickets'));
const RefundOption = lazy(() => import('./components/RefundOption'));

// ------------------ Main App Content ------------------
const AppContent = () => (
  <Router>
    <div className="min-h-screen bg-white bg-custom-flakes bg-fixed bg-cover">
      <Navbar />
      <GreetingBar />
      <main className="main-content">
        <Suspense fallback={<div className="loading">Načítavam...</div>}>
          <Routes>
            <Route index element={<AboutUs />} />
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
        </Suspense>
      </main>
      <Foot />
      <CookieConsent />
    </div>
  </Router>
);

// ------------------ Final App Wrapper ------------------
const App = () => (
  <LanguageProvider>
    <UserProvider>
      <AppContent />
    </UserProvider>
  </LanguageProvider>
);

export default App;