import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';

const PaymentCancelled = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState('Processing your payment information...');

  useEffect(() => {
    let timer;
    
    const handlePaymentFailed = async () => {
      try {
        // Try to get booking ID and session ID from localStorage
        const bookingId = localStorage.getItem('pendingBookingId');
        const sessionId = localStorage.getItem('pendingSessionId');

        // Call backend to mark booking as inactive and send email
        if (bookingId && sessionId) {
          console.log('[PaymentCancelled] Calling backend for booking:', bookingId);
          await api.get(`/api/booking-success?session_id=${sessionId}&booking_id=${bookingId}`);
          setMessage('✅ We sent you an email with retry instructions. Redirecting...');
          
          // Clean up
          localStorage.removeItem('pendingBookingId');
          localStorage.removeItem('pendingSessionId');
        } else {
          setMessage('❌ Payment was cancelled. Redirecting to booking page...');
        }
      } catch (error) {
        console.error('Error handling payment failure:', error);
        setMessage('❌ There was an error processing your payment. Please contact support.');
      } finally {
        // Redirect to booking page after 5 seconds
        timer = setTimeout(() => {
          navigate('/booking');
        }, 5000);
      }
    };

    handlePaymentFailed();
    
    // Cleanup function - proper way to return from useEffect
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [navigate]);

  return (
    <div className="container mt-5 text-center">
      <h2 className="text-danger">⚠️ Payment Status</h2>
      <p style={{ fontSize: '18px', margin: '20px 0' }}>{message}</p>
      <p className="text-muted">You will be redirected in 5 seconds...</p>
    </div>
  );
};

export default PaymentCancelled;