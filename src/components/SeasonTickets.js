// SeasonTickets.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { loadStripe } from '@stripe/stripe-js';
import { useTranslation } from '../contexts/LanguageContext';
import '../styles/components/SeasonTickets.css';

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
  const [selectedTicket, setSelectedTicket] = useState(null);
  
  const [seasonTickets, setSeasonTickets] = useState([
    { 
      id: 1, 
      entries: 5, 
      price: 60, 
      popular: false,
      savings: '0%',
      perEntry: 12
    },
    { 
      id: 2, 
      entries: 10, 
      price: 100, 
      popular: true,
      savings: '17%',
      perEntry: 10
    },
  ]);

  useEffect(() => {
    if (!isLoggedIn || !userId) {
      navigate('/login');
    }
  }, [isLoggedIn, userId, navigate]);

  const handlePurchase = async (ticket) => {
    setLoading(true);
    setSelectedTicket(ticket.id);
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
      setSelectedTicket(null);
    }
  };

  if (!isLoggedIn) {
    return null;
  }

  return (
    <div className="season-tickets-page">
      <div className="season-tickets-container">
        <div className="season-tickets-header">
          <h1 className="season-tickets-title">
            {t?.seasonTickets?.title || 'Season Tickets'}
          </h1>
          <p className="season-tickets-subtitle">
            {t?.seasonTickets?.subtitle || 'Save money with our bundle packages'}
          </p>
        </div>

        <div className="season-tickets-grid">
          {seasonTickets.map((ticket) => (
            <div 
              className={`ticket-card ${ticket.popular ? 'popular' : ''} ${selectedTicket === ticket.id ? 'selected' : ''}`}
              key={ticket.id}
            >
              {ticket.popular && (
                <div className="popular-badge">
                  {t?.seasonTickets?.mostPopular || 'Most Popular'}
                </div>
              )}
              
              <div className="ticket-header">
                <h3 className="ticket-entries">
                  {ticket.entries} {t?.seasonTickets?.entries || 'Entries'}
                </h3>
                {ticket.savings && (
                  <span className="savings-badge">
                    Save {ticket.savings}
                  </span>
                )}
              </div>

              <div className="ticket-price">
                <span className="price-currency">€</span>
                <span className="price-amount">{ticket.price}</span>
              </div>

              <div className="ticket-details">
                <div className="price-per-entry">
                  <span className="per-entry-label">
                    {t?.seasonTickets?.perEntry || 'Per entry'}: 
                  </span>
                  <span className="per-entry-price">€{ticket.perEntry}</span>
                </div>
                <p className="ticket-description">
                  {t?.seasonTickets?.description || 'Valid for one year from purchase date. No hidden fees.'}
                </p>
                <ul className="ticket-features">
                  <li>✓ {t?.seasonTickets?.feature1 || 'Flexible booking'}</li>
                  <li>✓ {t?.seasonTickets?.feature2 || 'Transferable'}</li>
                  <li>✓ {t?.seasonTickets?.feature3 || 'Priority support'}</li>
                </ul>
              </div>

              <button
                className={`btn btn-primary buy-button ${selectedTicket === ticket.id ? 'loading' : ''}`}
                onClick={() => handlePurchase(ticket)}
                disabled={loading}
              >
                {loading && selectedTicket === ticket.id ? (
                  <>
                    <span className="spinner" aria-hidden="true"></span>
                    <span>{t?.seasonTickets?.processing || 'Processing...'}</span>
                  </>
                ) : (
                  <>
                    {t?.seasonTickets?.buyNow || 'Buy Now'}
                    <span className="btn-arrow">→</span>
                  </>
                )}
              </button>
            </div>
          ))}
        </div>

        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        <div className="season-tickets-footer">
          <button
            className="btn btn-secondary back-button"
            onClick={() => navigate('/booking')}
          >
            ← {t?.seasonTickets?.backToBooking || 'Back to Booking'}
          </button>
          
          <div className="security-notice">
            <span className="security-icon">🔒</span>
            {t?.seasonTickets?.secureCheckout || 'Secure checkout guaranteed'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeasonTickets;