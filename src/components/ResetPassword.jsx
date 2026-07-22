import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { KeyRound, Check, X, CheckCircle2, AlertTriangle } from 'lucide-react';
import api from '../api/api';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
};

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  // --- STAVY PRE VALIDÁCIU HESLA ---
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const [passwordFocus, setPasswordFocus] = useState(false);
  const [passwordConstraints, setPasswordConstraints] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
  });

  const navigate = useNavigate();
  const location = useLocation();

  // --- LOGIKA VALIDÁCIE ---
  const validatePassword = (value) => {
    const constraints = {
      length: value.length >= 8,
      uppercase: /[A-Z]/.test(value),
      lowercase: /[a-z]/.test(value),
      number: /[0-9]/.test(value),
    };

    setPasswordConstraints(constraints);
    
    // Heslo je validné len ak sú všetky podmienky splnené
    const isValid = Object.values(constraints).every(Boolean);
    setIsPasswordValid(isValid);
  };

  const handlePasswordChange = (e) => {
    const val = e.target.value;
    setNewPassword(val);
    validatePassword(val);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Finálna kontrola pred odoslaním
    if (!isPasswordValid) {
      setError('Heslo nespĺňa bezpečnostné požiadavky.');
      return;
    }

    if (newPassword !== repeatPassword) {
      setError('Heslá sa nezhodujú.');
      return;
    }

    const token = new URLSearchParams(location.search).get('token');
    if (!token) {
      setError('Neplatný resetovací odkaz.');
      return;
    }

    try {
      const response = await api.post('/api/reset-password', {
        token,
        newPassword,
      });
      setMessage(response.data.message);
      setError('');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      setError(error.response?.data.message || 'Nepodarilo sa obnoviť heslo. Skúste to znova.');
      setMessage('');
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
        
        <div className="text-center pb-6 mb-8 border-b border-neutral-100">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-4">
            <KeyRound className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground uppercase tracking-tight">
            Obnovenie hesla
          </h1>
          <p className="text-neutral-500 font-medium text-sm mt-2">
            Zadajte vaše nové heslo pre zabezpečenie účtu.
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* New Password Input */}
          <div>
            <label htmlFor="newPassword" className="block text-sm font-bold text-foreground mb-2">
              Nové heslo
            </label>
            <input
              type="password"
              className={`w-full px-4 py-3.5 bg-neutral-50 border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors font-medium text-foreground ${
                 error && !isPasswordValid ? 'border-red-300 bg-red-50' : 'border-neutral-300'
              }`}
              id="newPassword"
              value={newPassword}
              onChange={handlePasswordChange}
              onFocus={() => setPasswordFocus(true)}
              required
              placeholder="Zadajte nové heslo"
            />
            
            {/* --- VIZUÁLNA VALIDÁCIA --- */}
            <AnimatePresence>
              {passwordFocus && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 p-4 bg-neutral-50 border border-neutral-200 rounded-xl text-sm overflow-hidden"
                >
                  <p className="font-bold text-neutral-700 mb-2">Požiadavky na heslo:</p>
                  <ul className="space-y-1.5 font-medium text-xs">
                    <li className={`flex items-center gap-2 ${passwordConstraints.length ? 'text-emerald-600 font-bold' : 'text-neutral-500'}`}>
                      {passwordConstraints.length ? <Check className="w-4 h-4" /> : <X className="w-4 h-4 text-neutral-400" />}
                      Minimálne 8 znakov
                    </li>
                    <li className={`flex items-center gap-2 ${passwordConstraints.uppercase ? 'text-emerald-600 font-bold' : 'text-neutral-500'}`}>
                      {passwordConstraints.uppercase ? <Check className="w-4 h-4" /> : <X className="w-4 h-4 text-neutral-400" />}
                      Veľké písmeno
                    </li>
                    <li className={`flex items-center gap-2 ${passwordConstraints.lowercase ? 'text-emerald-600 font-bold' : 'text-neutral-500'}`}>
                      {passwordConstraints.lowercase ? <Check className="w-4 h-4" /> : <X className="w-4 h-4 text-neutral-400" />}
                      Malé písmeno
                    </li>
                    <li className={`flex items-center gap-2 ${passwordConstraints.number ? 'text-emerald-600 font-bold' : 'text-neutral-500'}`}>
                      {passwordConstraints.number ? <Check className="w-4 h-4" /> : <X className="w-4 h-4 text-neutral-400" />}
                      Číslo
                    </li>
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Repeat Password Input */}
          <div>
            <label htmlFor="repeatPassword" className="block text-sm font-bold text-foreground mb-2">
              Zopakujte nové heslo
            </label>
            <input
              type="password"
              className={`w-full px-4 py-3.5 bg-neutral-50 border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors font-medium text-foreground ${
                  repeatPassword && newPassword !== repeatPassword ? 'border-red-300 bg-red-50' : 'border-neutral-300'
              }`}
              id="repeatPassword"
              value={repeatPassword}
              onChange={(e) => setRepeatPassword(e.target.value)}
              required
              placeholder="Zopakujte nové heslo"
            />
            {repeatPassword && newPassword !== repeatPassword && (
               <p className="text-red-500 text-xs font-bold mt-1.5 flex items-center gap-1">
                 <AlertTriangle className="w-3.5 h-3.5" /> Heslá sa nezhodujú
               </p>
            )}
          </div>

          {/* Messages */}
          <AnimatePresence>
            {message && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="rounded-xl p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium text-sm flex items-start gap-3"
              >
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600 mt-0.5" />
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
          
          {/* Submit Button */}
          <button 
              type="submit" 
              className={`w-full py-3.5 px-6 font-bold rounded-xl transition-all ${
                  isPasswordValid && (newPassword === repeatPassword) 
                  ? 'bg-primary hover:bg-primary-600 text-white hover:shadow-lg hover:-translate-y-0.5 cursor-pointer' 
                  : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
              }`}
              disabled={!isPasswordValid || (newPassword !== repeatPassword)}
          >
            Obnoviť heslo
          </button>
        </form>
      </div>
    </motion.section>
  );
};

export default ResetPassword;