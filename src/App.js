import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { LanguageProvider } from './contexts/LanguageContext';
import { UserProvider } from './contexts/UserContext';
import dayjs from 'dayjs';
import 'dayjs/locale/sk';

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
const FAQ = lazy(() => import('./components/FAQ'));
const Gdpr = lazy(() => import('./components/Gdpr'));
const CreditOption = lazy(() => import('./components/CreditOption'));
const Checklist = lazy(() => import('./components/Checklist'));
const Archive = lazy(() => import('./components/Archive'));
const BlogPage = lazy(() => import('./components/BlogPage'));
const BlogArticle = lazy(() => import('./components/BlogArticle'));

// Inicializácia dayjs s lokálnym nastavením
const initializeDayJS = () => {
  dayjs.locale('sk');
};

// ------------------ Main App Content ------------------
const AppContent = () => {
  // Inicializácia pri načítaní komponentu
  useEffect(() => {
    initializeDayJS();
  }, []);

  return (
    <div className="min-h-screen flex flex-col overflow-x-clip bg-white bg-custom-flakes bg-cover">
      <Navbar />
      <GreetingBar />

      <main className="flex-grow">
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-lg text-gray-600">Načítavam...</div>
          </div>
        }>
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
            <Route path="/faq" element={<FAQ />} />
            <Route path="/gdpr" element={<Gdpr />} />
            <Route path="/credit-option" element={<CreditOption />} />
            <Route path="/admin/checklist/:trainingId" element={<Checklist />} />
            <Route path="/archive" element={<Archive />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/blog/:id" element={<BlogArticle />} />
          </Routes>
        </Suspense>
      </main>

      <Foot />
      <CookieConsent />
    </div>
  );
};

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