import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowLeft, CheckCircle, AlertTriangle, KeyRound } from 'lucide-react';
import api from '../api/api';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
};

const ForgotPassword = () => {
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Scroll to top when component mounts or location changes
  useEffect(() => {
    setTimeout(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 0);
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      const response = await api.post('/api/forgot-password', { email });
      setMessage(response.data.message);
    } catch (error) {
      setError(error.response?.data.message || 'Failed to send reset email. Please try again.');
    }
  };

  return (
    <motion.section 
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      className="py-12 md:py-20 container-custom max-w-xl mx-auto px-4 sm:px-6 relative"
    >
      <div className="bg-white rounded-[2rem] shadow-sm border border-neutral-200 p-8 sm:p-12">
        
        <Link 
          to="/login" 
          className="inline-flex items-center gap-2 text-neutral-500 hover:text-primary font-bold mb-8 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Späť na prihlásenie</span>
        </Link>

        <div className="text-center pb-6 mb-8 border-b border-neutral-100">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-4">
            <KeyRound className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground uppercase tracking-tight">
            Zabudnuté heslo
          </h1>
          <p className="text-neutral-500 font-medium text-sm mt-2">
            Zadajte vašu emailovú adresu a pošleme vám odkaz na obnovenie hesla.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-bold text-foreground mb-2 flex items-center gap-2">
              <Mail className="w-4 h-4 text-neutral-400" />
              Emailová adresa
            </label>
            <input
              type="email"
              className="w-full px-4 py-3.5 bg-neutral-50 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors font-medium text-foreground"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vas@email.sk"
              required
            />
          </div>

          <AnimatePresence>
            {message && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="rounded-xl p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium text-sm flex items-start gap-3"
              >
                <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-600 mt-0.5" />
                <span>{message}</span>
              </motion.div>
            )}

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="rounded-xl p-4 bg-red-50 text-red-800 border border-red-200 font-medium text-sm flex items-start gap-3"
              >
                <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-600 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <button 
            type="submit" 
            className="w-full bg-primary hover:bg-primary-600 text-white font-bold py-3.5 px-6 rounded-xl transition-all hover:shadow-lg hover:-translate-y-0.5 cursor-pointer"
          >
            Odoslať odkaz na obnovenie
          </button>
        </form>
      </div>
    </motion.section>
  );
};

export default ForgotPassword;