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
      localStorage.setItem('userName', response.data.userName || 'Unknown User'); // Combine first_name and last_name
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
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card shadow-sm">
            <div className="card-body text-center">
              <h2 className="card-title">{t.login.alreadyLoggedIn.title}</h2>
              <p>{t.login.alreadyLoggedIn.message}</p>
              <button
                className="btn btn-danger"
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
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card shadow-sm">
            <div className="card-body">
              <h2 className="card-title text-center">{t.login.title}</h2>
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">{t.login.email}</label>
                  <input
                    type="email"
                    className={`form-control ${error ? 'is-invalid' : ''}`}
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="password" className="form-label">{t.login.password}</label>
                  <input
                    type="password"
                    className={`form-control ${error ? 'is-invalid' : ''}`}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                {error && <div className="text-danger mb-3 text-center">{error}</div>}
                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      <span className="ms-2">{t.login.loading}</span>
                    </>
                  ) : (
                    t.login.submit
                  )}
                </button>
              </form>
              <div className="mt-3 text-center">
                <p>{t.login.registerPrompt} <Link to="/register">{t.login.createAccount}</Link></p>
                {showForgotPassword && (
                  <p>
                    <Link to="/forgot-password">{t.login.forgotPassword}</Link>
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