import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/api';

// --- IKONY PRE VALIDÁCIU (Prevzaté z Register.js) ---
const CheckIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const XIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

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
    specialChar: false,
  });

  const navigate = useNavigate();
  const location = useLocation();

  // --- LOGIKA VALIDÁCIE (Prevzatá z Register.js) ---
  const validatePassword = (value) => {
    const constraints = {
      length: value.length >= 8,
      uppercase: /[A-Z]/.test(value),
      lowercase: /[a-z]/.test(value),
      number: /[0-9]/.test(value),
      specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(value),
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
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card shadow-sm border-0 rounded-xl overflow-hidden">
            <div className="card-body p-4 sm:p-5 bg-white">
              <h2 className="card-title text-center text-2xl font-bold mb-4">Reset Password</h2>
              
              <form onSubmit={handleSubmit}>
                {/* New Password Input */}
                <div className="mb-3">
                  <label htmlFor="newPassword" className="form-label font-semibold">New Password</label>
                  <input
                    type="password"
                    className={`form-control p-3 rounded-lg border-2 transition-colors ${
                       error && !isPasswordValid ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-blue-500'
                    }`}
                    id="newPassword"
                    value={newPassword}
                    onChange={handlePasswordChange}
                    onFocus={() => setPasswordFocus(true)}
                    required
                    placeholder="Zadajte nové heslo"
                  />
                  
                  {/* --- VIZUÁLNA VALIDÁCIA (Zobrazí sa keď user píše) --- */}
                  {passwordFocus && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm transition-all duration-300 ease-in-out">
                      <p className="font-semibold text-gray-700 mb-2">Požiadavky na heslo:</p>
                      <ul className="space-y-1">
                        <li className={`flex items-center gap-2 ${passwordConstraints.length ? 'text-green-600' : 'text-gray-500'}`}>
                          {passwordConstraints.length ? <CheckIcon className="w-4 h-4" /> : <XIcon className="w-4 h-4" />}
                          Minimálne 8 znakov
                        </li>
                        <li className={`flex items-center gap-2 ${passwordConstraints.uppercase ? 'text-green-600' : 'text-gray-500'}`}>
                          {passwordConstraints.uppercase ? <CheckIcon className="w-4 h-4" /> : <XIcon className="w-4 h-4" />}
                          Veľké písmeno
                        </li>
                        <li className={`flex items-center gap-2 ${passwordConstraints.lowercase ? 'text-green-600' : 'text-gray-500'}`}>
                          {passwordConstraints.lowercase ? <CheckIcon className="w-4 h-4" /> : <XIcon className="w-4 h-4" />}
                          Malé písmeno
                        </li>
                        <li className={`flex items-center gap-2 ${passwordConstraints.number ? 'text-green-600' : 'text-gray-500'}`}>
                          {passwordConstraints.number ? <CheckIcon className="w-4 h-4" /> : <XIcon className="w-4 h-4" />}
                          Číslo
                        </li>
                        <li className={`flex items-center gap-2 ${passwordConstraints.specialChar ? 'text-green-600' : 'text-gray-500'}`}>
                          {passwordConstraints.specialChar ? <CheckIcon className="w-4 h-4" /> : <XIcon className="w-4 h-4" />}
                          Špeciálny znak (!@#$%...)
                        </li>
                      </ul>
                    </div>
                  )}
                </div>

                {/* Repeat Password Input */}
                <div className="mb-4">
                  <label htmlFor="repeatPassword" className="form-label font-semibold">Repeat Password</label>
                  <input
                    type="password"
                    className={`form-control p-3 rounded-lg border-2 ${
                        repeatPassword && newPassword !== repeatPassword ? 'border-red-300' : 'border-gray-200'
                    }`}
                    id="repeatPassword"
                    value={repeatPassword}
                    onChange={(e) => setRepeatPassword(e.target.value)}
                    required
                    placeholder="Zopakujte nové heslo"
                  />
                  {repeatPassword && newPassword !== repeatPassword && (
                     <p className="text-red-500 text-xs mt-1">Heslá sa nezhodujú</p>
                  )}
                </div>

                {/* Messages */}
                {message && <div className="alert alert-success">{message}</div>}
                {error && <div className="alert alert-danger">{error}</div>}
                
                {/* Submit Button */}
                <button 
                    type="submit" 
                    className={`btn w-100 py-3 font-bold rounded-lg transition-all ${
                        isPasswordValid && (newPassword === repeatPassword) 
                        ? 'btn-primary' 
                        : 'btn-secondary opacity-50 cursor-not-allowed'
                    }`}
                    disabled={!isPasswordValid || (newPassword !== repeatPassword)}
                >
                  Reset Password
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;