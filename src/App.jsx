import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import { LanguageProvider } from './contexts/LanguageContext';
import { UserProvider } from './contexts/UserContext';
import dayjs from 'dayjs';
import 'dayjs/locale/sk';

import Navbar from './components/Navbar';
import GreetingBar from './components/GreetingBar';
import Foot from './components/Foot';
import CookieConsent from './components/CookieConsent';
import nitracikLogo from './assets/nitracik_svg2.svg';

// Lazy loaded components
const AboutUs = lazy(() => import('./components/AboutUs'));
const Booking = lazy(() => import('./components/Booking'));
const Contact = lazy(() => import('./components/Contact'));
const Login = lazy(() => import('./components/Login'));
const Register = lazy(() => import('./components/Register'));
const VerifyEmail = lazy(() => import('./components/VerifyEmail'));
const ForgotPassword = lazy(() => import('./components/ForgotPassword'));
const ResetPassword = lazy(() => import('./components/ResetPassword'));
const UserProfile = lazy(() => import('./components/UserProfile'));
const AccountDeleted = lazy(() => import('./components/AccountDeleted'));
const PaymentSuccess = lazy(() => import('./components/PaymentSuccess'));
const PaymentCancelled = lazy(() => import('./components/PaymentCancelled'));
const SeasonTickets = lazy(() => import('./components/SeasonTickets'));
const RefundOption = lazy(() => import('./components/RefundOption'));
const ActivityList = lazy(() => import('./components/ActivityList'));
const ActivityDetail = lazy(() => import('./components/ActivityDetail'));
const FAQ = lazy(() => import('./components/FAQ'));
const Gdpr = lazy(() => import('./components/Gdpr'));
const RegistrationInfo = lazy(() => import('./components/RegistrationInfo'));
const CookiesInfo = lazy(() => import('./components/CookiesInfo'));
const ContactFormInfo = lazy(() => import('./components/ContactFormInfo'));
const SocialNetworksInfo = lazy(() => import('./components/SocialNetworksInfo'));
const Terms = lazy(() => import('./components/Terms'));
const CreditOption = lazy(() => import('./components/CreditOption'));
const Checklist = lazy(() => import('./components/Checklist'));
const Archive = lazy(() => import('./components/Archive'));
const BlogPage = lazy(() => import('./components/BlogPage'));
const BlogArticle = lazy(() => import('./components/BlogArticle'));
const PhotoConsentInfo = lazy(() => import('./components/PhotoConsentInfo'));
const GiftCard = lazy(() => import('./components/GiftCard'));
const NotFound = lazy(() => import('./components/NotFound'));


// Inicializácia dayjs s lokálnym nastavením
const initializeDayJS = () => {
  dayjs.locale('sk');
};

const ScrollToTop = () => {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return null;
};

// ------------------ Main App Content ------------------
const AppContent = () => {
  // Inicializácia pri načítaní komponentu
  useEffect(() => {
    initializeDayJS();
  }, []);

  return (
    <div className="min-h-screen flex flex-col overflow-x-clip bg-white bg-custom-flakes bg-cover">
      <ScrollToTop />
      <Navbar />
      <GreetingBar />

      <main className="flex-grow">
        <Suspense fallback={
          <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-6">
            <img
              src={nitracikLogo}
              alt="Nitráčik"
              className="w-36 h-auto object-contain"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <div className="flex flex-col items-center gap-3">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F4A5A5] animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#eabd64] animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#EFE4C8] animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
              <p className="text-sm font-bold text-neutral-400 uppercase tracking-[0.15em]">
                Načítavam...
              </p>
            </div>
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
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/account-deleted" element={<AccountDeleted />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/payment-cancelled" element={<PaymentCancelled />} />
            <Route path="/season-tickets" element={<SeasonTickets />} />
            <Route path="/refund-option" element={<RefundOption />} />
            <Route path="/aktivity" element={<ActivityList />} />
            <Route path="/aktivity/:type" element={<ActivityDetail />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/gdpr" element={<Gdpr />} />
            <Route path="/gdpr/registration" element={<RegistrationInfo />} />
            <Route path="/gdpr/cookies" element={<CookiesInfo />} />
            <Route path="/gdpr/contact-form" element={<ContactFormInfo />} />
            <Route path="/gdpr/social-networks" element={<SocialNetworksInfo />} />
            <Route path="/photo-consent-info" element={<PhotoConsentInfo />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/credit-option" element={<CreditOption />} />
            <Route path="/admin/checklist/:trainingId" element={<Checklist />} />
            <Route path="/archive" element={<Archive />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/blog/:slug" element={<BlogArticle />} />
            <Route path="/gift-card" element={<GiftCard />} />
            <Route path="/gift-card/success" element={<GiftCard />} />
            <Route path="*" element={<NotFound />} />
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