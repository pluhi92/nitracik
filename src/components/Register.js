import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from '../contexts/LanguageContext';

const Register = () => {
  const { t } = useTranslation();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [address, setAddress] = useState('');
  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    address: '',
  });
  const [repeatPasswordError, setRepeatPasswordError] = useState('');
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validateField = (name, value) => {
    const errorMessages = t.login.register.errors;
    switch (name) {
      case 'firstName':
        if (!value) return errorMessages.firstNameRequired;
        break;
      case 'lastName':
        if (!value) return errorMessages.lastNameRequired;
        break;
      case 'email':
        if (!value) return errorMessages.emailRequired;
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return errorMessages.invalidEmail;
        break;
      case 'password':
        if (!value) return errorMessages.passwordRequired;
        if (value.length < 6) return errorMessages.passwordLength;
        break;
      case 'address':
        if (!value) return errorMessages.addressRequired;
        break;
      default:
        break;
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setApiError('');

    const newErrors = {
      firstName: validateField('firstName', firstName),
      lastName: validateField('lastName', lastName),
      email: validateField('email', email),
      password: validateField('password', password),
      address: validateField('address', address),
    };
    setErrors(newErrors);

    if (password !== repeatPassword) {
      setRepeatPasswordError(t.login.register.errors.passwordMatch);
      setLoading(false);
      return;
    } else {
      setRepeatPasswordError('');
    }

    if (Object.values(newErrors).some((error) => error)) {
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/api/register', {
        firstName,
        lastName,
        email,
        password,
        address,
      });
      console.log('Registration successful:', response.data);

      setApiError(t.login.register.success);
      setTimeout(() => {
        navigate('/');
      }, 4000);
    } catch (error) {
      if (error.response?.status === 400) {
        setApiError(error.response.data.message);
        setErrors((prev) => ({ ...prev, email: t.login.register.errors.emailExists }));
      } else {
        console.error('Registration failed:', error.response?.data || error.message);
        setApiError(t.login.register.errors.generic);
      }
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = !loading && 
    firstName && 
    lastName && 
    email && 
    password && 
    repeatPassword && 
    address && 
    !Object.values(errors).some(error => error) && 
    !repeatPasswordError;

  return (
    <div className="min-h-screen bg-custom-flakes pt-0 pb-4 px-4 flex items-center justify-center">
      <div className="max-w-lg w-full">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-10 border border-gray-200">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
            {t.login.register.title}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* First Name */}
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                {t.login.register.firstName}
              </label>
              <input
                type="text"
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-500 transition-colors ${
                  errors.firstName ? 'border-red-500' : 'border-gray-300'
                }`}
                id="firstName"
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value);
                  setErrors({ ...errors, firstName: validateField('firstName', e.target.value) });
                }}
                required
              />
              {errors.firstName && (
                <div className="text-red-500 text-xs mt-1">{errors.firstName}</div>
              )}
            </div>

            {/* Last Name */}
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                {t.login.register.lastName}
              </label>
              <input
                type="text"
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-500 transition-colors ${
                  errors.lastName ? 'border-red-500' : 'border-gray-300'
                }`}
                id="lastName"
                value={lastName}
                onChange={(e) => {
                  setLastName(e.target.value);
                  setErrors({ ...errors, lastName: validateField('lastName', e.target.value) });
                }}
                required
              />
              {errors.lastName && (
                <div className="text-red-500 text-xs mt-1">{errors.lastName}</div>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                {t.login.register.email}
              </label>
              <input
                type="email"
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-500 transition-colors ${
                  errors.email || apiError ? 'border-red-500' : 'border-gray-300'
                }`}
                id="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrors({ ...errors, email: validateField('email', e.target.value) });
                  setApiError('');
                }}
                required
              />
              {errors.email && (
                <div className="text-red-500 text-xs mt-1">{errors.email}</div>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                {t.login.register.password}
              </label>
              <input
                type="password"
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-500 transition-colors ${
                  errors.password ? 'border-red-500' : 'border-gray-300'
                }`}
                id="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrors({ ...errors, password: validateField('password', e.target.value) });
                }}
                required
              />
              {errors.password && (
                <div className="text-red-500 text-xs mt-1">{errors.password}</div>
              )}
            </div>

            {/* Repeat Password */}
            <div>
              <label htmlFor="repeatPassword" className="block text-sm font-medium text-gray-700 mb-2">
                {t.login.register.repeatPassword}
              </label>
              <input
                type="password"
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-500 transition-colors ${
                  repeatPasswordError ? 'border-red-500' : 'border-gray-300'
                }`}
                id="repeatPassword"
                value={repeatPassword}
                onChange={(e) => {
                  setRepeatPassword(e.target.value);
                  setRepeatPasswordError('');
                }}
                required
              />
              {repeatPasswordError && (
                <div className="text-red-500 text-xs mt-1">{repeatPasswordError}</div>
              )}
            </div>

            {/* Address */}
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                {t.login.register.address}
              </label>
              <input
                type="text"
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-500 transition-colors ${
                  errors.address ? 'border-red-500' : 'border-gray-300'
                }`}
                id="address"
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  setErrors({ ...errors, address: validateField('address', e.target.value) });
                }}
                required
              />
              {errors.address && (
                <div className="text-red-500 text-xs mt-1">{errors.address}</div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className={`w-full py-4 px-4 rounded-lg font-semibold text-lg transition-all duration-300 ${
                isFormValid
                  ? 'bg-secondary-500 hover:bg-secondary-600 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              disabled={!isFormValid}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{t.login.register.loading}</span>
                </div>
              ) : (
                t.login.register.submit
              )}
            </button>

            {/* API Error/Success Message */}
            {apiError && (
              <div
                className={`text-center text-sm font-medium py-3 px-4 rounded-lg ${
                  apiError.includes('success')
                    ? 'bg-green-100 text-green-700 border border-green-200'
                    : 'bg-red-100 text-red-700 border border-red-200'
                }`}
              >
                {apiError}
              </div>
            )}
          </form>

          {/* Login Prompt */}
          <div className="mt-8 text-center">
            <p className="text-gray-600">
              {t.login.register.loginPrompt}{' '}
              <Link
                to="/login"
                className="text-secondary-500 hover:text-secondary-600 font-semibold transition-colors"
              >
                {t.login.register.loginLink}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;