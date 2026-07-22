import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Loader2, AlertTriangle } from 'lucide-react';
import api from '../api/api';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
};

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

  const isSuccess = message.includes('✅');
  const isError = message.includes('❌');

  return (
    <motion.section 
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      className="py-12 md:py-20 container-custom max-w-xl mx-auto px-4 sm:px-6 relative text-center"
    >
      <div className="bg-white rounded-[2rem] shadow-sm border border-neutral-200 p-8 sm:p-12">
        
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 ${
          isSuccess ? 'bg-emerald-50 text-emerald-600' :
          isError ? 'bg-red-50 text-red-600' :
          'bg-primary/10 text-primary'
        }`}>
          {isSuccess ? <CheckCircle2 className="w-8 h-8" /> :
           isError ? <XCircle className="w-8 h-8" /> :
           <Loader2 className="w-8 h-8 animate-spin" />}
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-foreground uppercase tracking-tight mb-4 flex items-center justify-center gap-2">
          <AlertTriangle className="w-7 h-7 text-amber-500" />
          <span>Payment Status</span>
        </h2>

        <div className="text-neutral-600 font-medium text-base sm:text-lg my-6 leading-relaxed">
          {message}
        </div>

        <p className="text-neutral-400 font-bold text-xs sm:text-sm uppercase tracking-wider">
          You will be redirected in 5 seconds...
        </p>
      </div>
    </motion.section>
  );
};

export default PaymentCancelled;