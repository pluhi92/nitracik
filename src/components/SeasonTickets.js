// SeasonTickets.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { useTranslation } from '../contexts/LanguageContext';
import api from '../api/api';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);

const SeasonTickets = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem('isLoggedIn') === 'true');
  const [userId, setUserId] = useState(localStorage.getItem('userId'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showValidityTooltip, setShowValidityTooltip] = useState(null);
  
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
    <div className="min-h-screen bg-custom-flakes py-6 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-black mb-2">
            {t?.seasonTickets?.title || 'Season Tickets'}
          </h1>
          <p className="text-gray-600 max-w-xl mx-auto">
            {t?.seasonTickets?.subtitle || 'Save money with our bundle packages'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto mb-8">
          {seasonTickets.map((ticket) => (
            <div 
              className={`
                relative bg-white/90 backdrop-blur-sm border border-gray-200 rounded-xl p-6 shadow-lg transition-all duration-300 ease-in-out flex flex-col h-full
                ${ticket.popular ? 'border-secondary-500' : 'border-gray-200'}
                ${selectedTicket === ticket.id ? 'border-secondary-500 shadow-xl ring-2 ring-secondary-500 ring-opacity-20' : ''}
                hover:transform hover:-translate-y-1 hover:shadow-xl
              `}
              key={ticket.id}
            >
              {ticket.popular && (
                <div className="absolute -top-2 -right-2 bg-secondary-500 text-white px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wide shadow-lg z-10">
                  {t?.seasonTickets?.mostPopular || 'Most Popular'}
                </div>
              )}
              
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-900 m-0">
                  {ticket.entries} {t?.seasonTickets?.entries || 'Entries'}
                </h3>
                {ticket.savings && (
                  <span className="bg-secondary-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                    Save {ticket.savings}
                  </span>
                )}
              </div>

              <div className="text-center mb-4 py-3 border-b border-dashed border-gray-200">
                <span className="text-xl font-semibold text-gray-500 align-top mr-1">€</span>
                <span className="text-4xl font-black text-secondary-600 leading-none">{ticket.price}</span>
              </div>

              <div className="flex-1 mb-6">
                <div className="flex justify-between items-center bg-white px-3 py-2 rounded-lg mb-3 border border-gray-100">
                  <span className="text-sm text-gray-600">
                    {t?.seasonTickets?.perEntry || 'Per entry'}:
                  </span>
                  <span className="text-base font-bold text-gray-900">€{ticket.perEntry}</span>
                </div>
                
                {/* Validity notice with tooltip */}
                <div 
                  className="relative mb-3"
                  onMouseEnter={() => setShowValidityTooltip(ticket.id)}
                  onMouseLeave={() => setShowValidityTooltip(null)}
                >
                  <div className="flex items-center justify-center bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                    <span className="text-blue-600 text-sm font-medium flex items-center gap-2">
                      <span className="text-blue-500">⏳</span>
                      Valid for 1 year
                      <span className="text-blue-400 cursor-help">ℹ️</span>
                    </span>
                  </div>
                  
                  {/* Tooltip */}
                  {showValidityTooltip === ticket.id && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-20">
                      <div className="bg-gray-900 text-white text-xs rounded py-2 px-3 whitespace-nowrap shadow-lg">
                        Valid for 365 days from purchase date
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                      </div>
                    </div>
                  )}
                </div>

                <ul className="space-y-1 text-sm">
                  <li className="flex items-center text-gray-900 font-medium">
                    <span className="text-secondary-500 font-bold mr-2">✓</span>
                    {t?.seasonTickets?.feature1 || 'Flexible booking'}
                  </li>
                  <li className="flex items-center text-gray-900 font-medium">
                    <span className="text-secondary-500 font-bold mr-2">✓</span>
                    {t?.seasonTickets?.feature2 || 'Transferable'}
                  </li>
                  <li className="flex items-center text-gray-900 font-medium">
                    <span className="text-secondary-500 font-bold mr-2">✓</span>
                    {t?.seasonTickets?.feature3 || 'Priority support'}
                  </li>
                </ul>
              </div>

              <button
                className={`
                  w-full bg-secondary-500 text-white border-none py-3 px-6 rounded-lg font-bold text-base transition-all duration-300 ease-in-out
                  flex items-center justify-center gap-2 relative overflow-hidden
                  ${selectedTicket === ticket.id && loading ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'hover:bg-secondary-600'}
                  hover:transform hover:-translate-y-0.5 hover:shadow-lg
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                `}
                onClick={() => handlePurchase(ticket)}
                disabled={loading}
              >
                {loading && selectedTicket === ticket.id ? (
                  <>
                    <div className="w-4 h-4 border-2 border-transparent border-t-current rounded-full animate-spin" />
                    <span>{t?.seasonTickets?.processing || 'Processing...'}</span>
                  </>
                ) : (
                  <>
                    {t?.seasonTickets?.buyNow || 'Buy Now'}
                    <span className="transition-transform duration-300 ease-in-out group-hover:translate-x-1">→</span>
                  </>
                )}
              </button>
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 px-6 py-4 rounded-xl flex items-center gap-3 mb-6 border border-red-200 max-w-2xl mx-auto">
            <span className="text-xl">⚠️</span>
            {error}
          </div>
        )}

        <div className="flex justify-between items-center flex-wrap gap-4 pt-6 border-t border-gray-300 max-w-2xl mx-auto">
          <button
            className="bg-transparent text-gray-600 border border-gray-400 px-5 py-2 rounded-lg transition-all duration-300 ease-in-out hover:bg-gray-50 hover:text-gray-800 hover:border-gray-500"
            onClick={() => navigate('/booking')}
          >
            ← {t?.seasonTickets?.backToBooking || 'Back to Booking'}
          </button>
          
          <div className="flex items-center gap-2 text-gray-600 text-sm">
            <span className="text-base">🔒</span>
            {t?.seasonTickets?.secureCheckout || 'Secure checkout guaranteed'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeasonTickets;