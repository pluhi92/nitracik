import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, XCircle, Loader2 } from 'lucide-react';
import api from '../api/api';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
};

const VerifyEmail = () => {
  const [message, setMessage] = useState('Overuje sa vaša emailová adresa...');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Funkciu definujeme priamo vnútri efektu
    const verifyToken = async (token) => {
      try {
        // Poslanie tokenu na backend
        const response = await api.get(`/api/verify-email?token=${token}`);
        setMessage(response.data.message);

        // Presmerovanie po 3 sekundách
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } catch (error) {
        console.error('Error verifying email:', error);
        setMessage(error.response?.data.message || 'Nepodarilo sa overiť email. Skúste to prosím znova.');
      }
    };

    // Extrakcia tokenu z URL
    const token = new URLSearchParams(location.search).get('token');

    if (token) {
      verifyToken(token);
    } else {
      setMessage('Neplatný overovací odkaz. Skontrolujte prosím svoj email pre správny odkaz.');
    }
  }, [location.search, navigate]);

  const isVerifying = message.includes('Verifying') || message.includes('Overuje');
  const isError = message.includes('Failed') || message.includes('Invalid') || message.includes('Nepodarilo') || message.includes('Neplatný');

  return (
    <motion.section 
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      className="py-12 md:py-20 container-custom max-w-xl mx-auto px-4 sm:px-6 relative text-center"
    >
      <div className="bg-white rounded-[2rem] shadow-sm border border-neutral-200 p-8 sm:p-12">
        
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 ${
          isVerifying ? 'bg-primary/10 text-primary' :
          isError ? 'bg-red-50 text-red-600' :
          'bg-emerald-50 text-emerald-600'
        }`}>
          {isVerifying ? <Loader2 className="w-8 h-8 animate-spin" /> :
           isError ? <XCircle className="w-8 h-8" /> :
           <ShieldCheck className="w-8 h-8" />}
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-foreground uppercase tracking-tight mb-4">
          Overenie emailu
        </h2>
        
        <p className="text-neutral-600 font-medium text-base sm:text-lg mb-6 leading-relaxed">
          {message}
        </p>

        {!isVerifying && !isError && (
          <p className="text-neutral-400 font-bold text-xs sm:text-sm uppercase tracking-wider">
            O chvíľu budete presmerovaní na prihlásenie...
          </p>
        )}
      </div>
    </motion.section>
  );
};

export default VerifyEmail;