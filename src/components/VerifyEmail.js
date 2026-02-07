import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api/api';

const VerifyEmail = () => {
  const [message, setMessage] = useState('Verifying your email...');
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
        setMessage(error.response?.data.message || 'Failed to verify email. Please try again.');
      }
    };

    // Extrakcia tokenu z URL
    const token = new URLSearchParams(location.search).get('token');

    if (token) {
      verifyToken(token);
    } else {
      setMessage('Invalid verification link. Please check your email for the correct link.');
    }
  }, [location.search, navigate]); // Pridané správne závislosti

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card shadow-sm">
            <div className="card-body">
              <h2 className="card-title text-center">Email Verification</h2>
              <p className="text-center">{message}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;