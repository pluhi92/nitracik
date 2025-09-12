import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from '../contexts/LanguageContext';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const sessionId = urlParams.get('session_id');
    
    if (sessionId) {
      console.log('Payment successful, session:', sessionId);
      // Just redirect without showing an alert
      // The backend will send a confirmation email
      setTimeout(() => {
        navigate('/profile');
      }, 5000);
    } else {
      navigate('/profile');
    }
  }, [location.search, navigate]);

  return (
    <div className="container mt-5 text-center">
      <h2 className="text-success">
        {t?.booking?.paymentSuccessTitle || '🎉 Payment Successful! 🎉'}
      </h2>
      <p>
        {t?.booking?.confirmationMessage ||
          'Your booking has been confirmed. Thank you for choosing Nitracik!'}
      </p>
      <p>You will receive a confirmation email shortly.</p>
      <p>Redirecting to your profile...</p>
    </div>
  );
};

export default PaymentSuccess;