import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, PartyPopper } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
};

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  useEffect(() => {
    let timer;
    const urlParams = new URLSearchParams(location.search);
    const sessionId = urlParams.get('session_id');
    
    if (sessionId) {
      console.log('Payment successful, session:', sessionId);
      timer = setTimeout(() => {
        navigate('/profile');
      }, 5000);
    } else {
      navigate('/profile');
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [location.search, navigate]);

  return (
    <motion.section 
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      className="py-12 md:py-20 container-custom max-w-xl mx-auto px-4 sm:px-6 relative text-center"
    >
      <div className="bg-white rounded-[2rem] shadow-sm border border-neutral-200 p-8 sm:p-12">
        
        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-foreground uppercase tracking-tight mb-4 flex items-center justify-center gap-2">
          <PartyPopper className="w-7 h-7 text-primary" />
          <span>{t?.booking?.paymentSuccessTitle || '🎉 Payment Successful! 🎉'}</span>
        </h2>

        <div className="text-neutral-600 font-medium text-base sm:text-lg my-4 leading-relaxed">
          {t?.booking?.confirmationMessage ||
            'Your booking has been confirmed. Thank you for choosing Nitracik!'}
        </div>

        <p className="text-neutral-500 text-sm font-medium mb-6">
          You will receive a confirmation email shortly.
        </p>

        <p className="text-neutral-400 font-bold text-xs sm:text-sm uppercase tracking-wider">
          Redirecting to your profile...
        </p>
      </div>
    </motion.section>
  );
};

export default PaymentSuccess;