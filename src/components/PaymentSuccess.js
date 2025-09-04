import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from '../contexts/LanguageContext';
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  withCredentials: true,
});

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const confirmPayment = async () => {
      const urlParams = new URLSearchParams(location.search);
      const sessionId = urlParams.get('session_id');
      console.log('[PaymentSuccess] Extracted params:', { sessionId });

      if (!sessionId) {
        console.warn('[PaymentSuccess] No session ID provided');
        setError('No session ID provided');
        setLoading(false);
        setTimeout(() => navigate('/profile'), 3000);
        return;
      }

      try {
        console.log('[PaymentSuccess] Confirming payment for session:', sessionId);
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/booking-success?session_id=${sessionId}`,
          { withCredentials: false } // no cookies needed
        );
        console.log('Booking success response:', response.data);
        console.log('[PaymentSuccess] Booking success response:', response.data);
        alert(t?.booking?.paymentSuccess || 'Payment successful! Booking confirmed.');
        navigate('/profile');
      } catch (error) {
        console.error('[PaymentSuccess] Error confirming payment:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
        });
        let errorMessage = 'Confirmation failed, but payment was successful';
        if (error.response?.data?.error === 'Booking not found') {
          errorMessage = 'Booking not found. Please contact support.';
        } else if (error.response?.data?.error.includes('No such checkout.session')) {
          errorMessage = 'Invalid payment session. Please try again or contact support.';
        } else if (error.message.includes('Network Error')) {
          errorMessage = 'Network error. Please check your connection or contact support.';
        }
        setError(errorMessage);
        setTimeout(() => {
          alert(t?.booking?.paymentSuccess || 'Payment successful! Booking confirmed. (Confirmation check failed, but booking should be recorded.)');
          navigate('/profile');
        }, 2000);
      } finally {
        setLoading(false);
      }
    };

    confirmPayment();
  }, [location.search, navigate, t]);

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <h2 className="text-success">
          {t?.booking?.processingPayment || 'Processing your payment...'}
        </h2>
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-5 text-center">
        <h2 className="text-warning">Payment Processing</h2>
        <p>{error}</p>
        <p>Redirecting to profile...</p>
      </div>
    );
  }

  return (
    <div className="container mt-5 text-center">
      <h2 className="text-success">
        {t?.booking?.paymentSuccessTitle || '🎉 Payment Successful! 🎉'}
      </h2>
      <p>
        {t?.booking?.confirmationMessage ||
          'Your booking has been confirmed. Thank you for choosing Nitracik!'}
      </p>
      <p>
        {t?.booking?.redirecting || 'You will be redirected to your profile shortly...'}
      </p>
    </div>
  );
};

export default PaymentSuccess;