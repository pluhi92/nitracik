import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const PaymentSuccess = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the main page after 5 seconds
    const timer = setTimeout(() => {
      navigate('/');
    }, 5000);

    // Cleanup the timer if the component unmounts
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="container mt-5 text-center">
      <h2 className="text-success">🎉 Payment Successful! 🎉</h2>
      <p>Your booking has been confirmed. Thank you for choosing Nitracik!</p>
      <p>You will be redirected to the main page in 5 seconds...</p>
    </div>
  );
};

export default PaymentSuccess;