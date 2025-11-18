import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from '../contexts/LanguageContext';
import { useUser } from '../App';

const Login = ({ onLoginSuccess }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      const response = await axios.post(
        'http://localhost:5000/api/login',
        { email, password },
        { withCredentials: true }
      );

      console.log('Login successful:', response.data);

      // Store userId, userName, and isLoggedIn in localStorage
      localStorage.setItem('userId', response.data.userId);
      localStorage.setItem('userName', response.data.userName || 'Unknown User');
      localStorage.setItem('isLoggedIn', 'true');

      // Update the global user context immediately
      updateUser({
        isLoggedIn: true,
        firstName: response.data.userName?.split(' ')[0] || 'User',
        userId: response.data.userId
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
      <div className="max-w-2xl mx-auto mt-24 px-4 mb-12">
        <div className="flex justify-center">
          <div className="w-full md:w-96">
            <div className="bg-overlay-80 backdrop-blur-sm rounded-xl shadow-lg border-2 border-gray-200">
              <div className="p-6 text-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  {t.login.alreadyLoggedIn.title}
                </h2>
                <p className="text-gray-600 mb-6">
                  {t.login.alreadyLoggedIn.message}
                </p>
                <button
                  className="w-full bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                  onClick={() => {
                    logout();
                    navigate('/');
                  }}
                >
                  {t.login.alreadyLoggedIn.logout}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If the user is not logged in, show the login form
  return (
    <div className="max-w-2xl mx-auto mt-24 px-4 mb-12">
      <div className="flex justify-center">
        <div className="w-full md:w-96">
          <div className="bg-overlay-80 backdrop-blur-sm rounded-xl shadow-lg border-2 border-gray-200">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
                {t.login.title}
              </h2>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    {t.login.email}
                  </label>
                  <input
                    type="email"
                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${error ? 'border-red-500' : ''
                      }`}
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-6">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    {t.login.password}
                  </label>
                  <input
                    type="password"
                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${error ? 'border-red-500' : ''
                      }`}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                {error && (
                  <div className="text-red-600 text-center mb-4 bg-red-50 border border-red-200 rounded-lg py-2">
                    {error}
                  </div>
                )}
                <button
                  type="submit"
                  className="w-full bg-secondary-500 hover:bg-secondary-600 text-white px-4 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      <span>{t.login.loading}</span>
                    </div>
                  ) : (
                    t.login.submit
                  )}
                </button>
              </form>
              <div className="mt-6 text-center">
                <p className="text-gray-600 mb-3">
                  {t.login.registerPrompt}{' '}
                  <Link
                    to="/register"
                    className="text-secondary-500 hover:text-secondary-600 font-medium no-underline"
                  >
                    {t.login.createAccount}
                  </Link>
                </p>
                {showForgotPassword && (
                  <p>
                    <Link
                      to="/forgot-password"
                      className="text-primary-600 hover:text-primary-700 font-medium no-underline"
                    >
                      {t.login.forgotPassword}
                    </Link>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;