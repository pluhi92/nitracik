import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const PaymentCancelled = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the booking page after 5 seconds
    const timer = setTimeout(() => {
      navigate('/booking');
    }, 5000);

    // Cleanup the timer if the component unmounts
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="container mt-5 text-center">
      <h2 className="text-danger">❌ Payment Cancelled ❌</h2>
      <p>Your payment was not completed. Please try again.</p>
      <p>You will be redirected to the booking page in 5 seconds...</p>
    </div>
  );
};

export default PaymentCancelled;