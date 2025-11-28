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
const Schedule = lazy(() => import('./components/Schedule'));

// ------------------ Main App Content ------------------
const AppContent = () => (
  <div className="min-h-screen flex flex-col overflow-x-hidden bg-white bg-custom-flakes bg-cover">
    <Navbar />
    <GreetingBar />

    <main className="flex-grow">
      <Suspense fallback={<div className="loading">Načítavam...</div>}>
        <Routes>
          <Route index element={<AboutUs />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/booking" element={<Booking />} />
          <Route path="/profile" element={<UserProfile />} />
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
          <Route path="/schedule" element={<Schedule />} />
        </Routes>
      </Suspense>
    </main>

    <Foot />
    <CookieConsent />
  </div>
);

// ------------------ Final App Wrapper ------------------
const App = () => (
  <Router>
    <LanguageProvider>
      <UserProvider>
        <AppContent />
      </UserProvider>
    </LanguageProvider>
  </Router>
);

export default App;
