import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { loadStripe } from '@stripe/stripe-js';
import { useTranslation } from '../contexts/LanguageContext';
import './SeasonTickets.css';

const api = axios.create({
  baseURL: 'http://localhost:5000',
  withCredentials: true,
});

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);

const SeasonTickets = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem('isLoggedIn') === 'true');
  const [userId, setUserId] = useState(localStorage.getItem('userId'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [seasonTickets, setSeasonTickets] = useState([
    { entries: 5, price: 60 },
    { entries: 10, price: 100 },
  ]);

  useEffect(() => {
    if (!isLoggedIn || !userId) {
      navigate('/login');
    }
  }, [isLoggedIn, userId, navigate]);

  const handlePurchase = async (ticket) => {
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/api/create-season-ticket-payment', {
        userId,
        entries: ticket.entries,
        totalPrice: ticket.price,
      });

      const stripe = await stripePromise;
      const { error: stripeError } = await stripe.redirectToCheckout({
        sessionId: response.data.sessionId,
      });

      if (stripeError) {
        throw new Error(stripeError.message);
      }
    } catch (err) {
      console.error('Purchase error:', err);
      setError(t?.seasonTickets?.error || 'Failed to initiate purchase. Please try again.');
      setLoading(false);
    }
  };

  if (!isLoggedIn) {
    return null; // Redirect handled by useEffect
  }

  return (
    <div className="container mt-5 season-tickets-container">
      <h2 className="text-center text-primary mb-4">
        {t?.seasonTickets?.title || 'Purchase Season Tickets'}
      </h2>
      <div className="row justify-content-center">
        {seasonTickets.map((ticket, index) => (
          <div className="col-md-6 col-lg-4 mb-4" key={index}>
            <div className="card ticket-card shadow-sm h-100">
              <div className="card-body text-center">
                <h3 className="card-title text-success">
                  {t?.seasonTickets?.ticket || 'Season Ticket'} ({ticket.entries} {t?.seasonTickets?.entries || 'Entries'})
                </h3>
                <p className="card-text price-text">
                  €{ticket.price}
                </p>
                <p className="card-text text-muted">
                  {t?.seasonTickets?.description || 'Valid for one year from purchase date.'}
                </p>
                <button
                  className="btn btn-primary w-100 buy-button"
                  onClick={() => handlePurchase(ticket)}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm" aria-hidden="true"></span>
                      <span className="ms-2">{t?.seasonTickets?.processing || 'Processing...'}</span>
                    </>
                  ) : (
                    t?.seasonTickets?.buyNow || 'Buy Now'
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {error && (
        <div className="alert alert-danger mt-3 text-center">
          {error}
        </div>
      )}
      <div className="text-center mt-4">
        <button
          className="btn btn-secondary"
          onClick={() => navigate('/booking')}
        >
          {t?.seasonTickets?.backToBooking || 'Back to Booking'}
        </button>
      </div>
    </div>
  );
};

export default SeasonTickets;