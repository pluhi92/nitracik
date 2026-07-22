import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from '../contexts/LanguageContext';
import { useUser } from '../contexts/UserContext';
import api from '../api/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, AlertCircle, LogOut, ArrowRight, Loader2 } from 'lucide-react';

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

const Login = ({ onLoginSuccess }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const navigate = useNavigate();
  const { updateUser, logout } = useUser();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setShowForgotPassword(false);

    // Basic validation
    if (!email || !password) {
      setError(t.login.errors.required);
      setLoading(false);
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError(t.login.errors.invalidEmail);
      setLoading(false);
      return;
    }

    try {
      // Send login request to the backend
      const response = await api.post(
        '/api/login',
        { email, password },
        { withCredentials: true }
      );

      console.log('Login successful:', response.data);

      // Uložíme si rolu z odpovede
      const { userId, userName, role } = response.data;
      const firstName = userName.split(' ')[0];

      // Store userId, userName, and isLoggedIn in localStorage
      localStorage.setItem('userId', userId);
      localStorage.setItem('userName', userName || 'Unknown User');
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('authToken', response.data.token || 'dummy');
      localStorage.setItem('userRole', role || 'user'); // Uloženie roly
      localStorage.setItem('user', JSON.stringify({
        userId: userId,
        userName: userName,
        role: role || 'user'
      }));

      // Update the global user context immediately
      updateUser({
        isLoggedIn: true,
        firstName: firstName,
        userId: userId,
        role: role || 'user' // Poslanie roly do contextu
      });

      // Show success alert
      alert('You are successfully logged in!');

      // Redirect to the booking page after successful login
      navigate('/booking');
    } catch (error) {
      // Handle login errors
      if (error.response?.status === 400) {
        setError(t.login.errors.invalidCredentials);
        setShowForgotPassword(true);
      } else {
        setError(t.login.errors.failed);
      }
      console.error('Login error:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  // If the user is already logged in, show a message
  if (localStorage.getItem('isLoggedIn') === 'true') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="w-full max-w-md bg-white border border-neutral-200 rounded-[2rem] shadow-sm p-8 text-center"
        >
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-extrabold text-foreground mb-3">
            {t.login.alreadyLoggedIn.title}
          </h2>
          <p className="text-neutral-600 font-medium mb-8">
            {t.login.alreadyLoggedIn.message}
          </p>
          <button
            className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 px-6 py-3.5 rounded-full font-bold transition-colors border border-red-100"
            onClick={() => {
              logout();
              navigate('/');
            }}
          >
            <LogOut className="w-5 h-5" />
            {t.login.alreadyLoggedIn.logout}
          </button>
        </motion.div>
      </div>
    );
  }

  // If the user is not logged in, show the login form
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        className="w-full max-w-md"
      >
        <div className="bg-white/95 backdrop-blur-xl border border-neutral-200 rounded-[2rem] shadow-sm p-8 sm:p-10 relative overflow-hidden">
          {/* Subtle decoration */}
          <div className="absolute top-0 right-0 -mr-12 -mt-12 w-32 h-32 rounded-full bg-primary/10 blur-2xl pointer-events-none"></div>

          <div className="relative z-10">
            <h2 className="text-3xl font-extrabold text-center text-foreground mb-8 tracking-tight">
              {t.login.title}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-bold text-neutral-700 mb-2 pl-1">
                  {t.login.email}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-400">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    className={`w-full pl-11 pr-4 py-3.5 bg-neutral-50 border rounded-2xl focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm font-medium ${
                      error ? 'border-red-300 bg-red-50/50' : 'border-neutral-200'
                    }`}
                    id="email"
                    placeholder="vas@email.sk"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-bold text-neutral-700 mb-2 pl-1">
                  {t.login.password}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className={`w-full pl-11 pr-12 py-3.5 bg-neutral-50 border rounded-2xl focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm font-medium ${
                      error ? 'border-red-300 bg-red-50/50' : 'border-neutral-200'
                    }`}
                    id="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    aria-label="Show password"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center justify-center text-neutral-400 hover:text-primary transition-colors focus:outline-none"
                    onMouseDown={(e) => { e.preventDefault(); setShowPassword(true); }}
                    onMouseUp={() => setShowPassword(false)}
                    onMouseLeave={() => setShowPassword(false)}
                    onTouchStart={() => setShowPassword(true)}
                    onTouchEnd={() => setShowPassword(false)}
                    onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') setShowPassword(true); }}
                    onKeyUp={() => setShowPassword(false)}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-center gap-2 text-red-700 text-sm font-bold bg-red-50 border border-red-200 rounded-xl p-3">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <p className="m-0 leading-none">{error}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-600 text-white px-6 py-3.5 rounded-full font-bold transition-all shadow-sm disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:bg-primary mt-4"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{t.login.loading}</span>
                  </>
                ) : (
                  <>
                    <span>{t.login.submit}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 text-center border-t border-neutral-100 pt-6">
              <p className="text-neutral-600 font-medium text-sm mb-3">
                {t.login.registerPrompt}{' '}
                <Link
                  to="/register"
                  className="text-primary hover:text-primary-600 font-extrabold hover:underline"
                >
                  {t.login.createAccount}
                </Link>
              </p>
              
              <AnimatePresence>
                {showForgotPassword && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2"
                  >
                    <Link
                      to="/forgot-password"
                      className="text-neutral-500 hover:text-foreground text-sm font-bold hover:underline inline-flex items-center gap-1"
                    >
                      {t.login.forgotPassword}
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;