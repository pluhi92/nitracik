import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Pridal som Link pre VOP/GDPR
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

  // === NOVÉ STAVY PRE MODÁLNE OKNO ===
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [ticketToBuy, setTicketToBuy] = useState(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToGdpr, setAgreedToGdpr] = useState(false);

  const [seasonTickets, setSeasonTickets] = useState([
    {
      id: 1,
      entries: 3,
      price: 40,
      popular: false,
      savings: 'Small Saver',
      perEntry: 13.33
    },
    {
      id: 2,
      entries: 5,
      price: 65,
      popular: true,
      savings: 'Standard',
      perEntry: 13
    },
    {
      id: 3,
      entries: 10,
      price: 120,
      popular: false,
      savings: 'Best Value',
      perEntry: 12
    },
  ]);

  useEffect(() => {
    const handleAuthChange = () => {
      setIsLoggedIn(localStorage.getItem('isLoggedIn') === 'true');
      setUserId(localStorage.getItem('userId'));
    };
    window.addEventListener('storage', handleAuthChange);
    return () => window.removeEventListener('storage', handleAuthChange);
  }, []);

  // 1. KROK: Užívateľ klikne na tlačidlo na karte (len otvorí okno)
  const handleBuyClick = (ticket) => {
    if (!isLoggedIn) {
      navigate('/login', { state: { from: '/season-tickets' } });
      return;
    }
    setError('');
    setTicketToBuy(ticket);
    setAgreedToTerms(false);
    setAgreedToGdpr(false);
    setShowConfirmModal(true);
  };

  // 2. KROK: Užívateľ klikne "Zaplatiť" v modálnom okne (skutočná platba)
  const executePayment = async () => {
    if (!ticketToBuy) return;

    // Validácia checkboxov (pre istotu, hoci button bude disabled)
    if (!agreedToTerms || !agreedToGdpr) {
      setError('Pre pokračovanie musíte súhlasiť s podmienkami.');
      return;
    }

    setLoading(true);
    setSelectedTicket(ticketToBuy.id);

    try {
      const stripe = await stripePromise;

      const response = await api.post('api/create-season-ticket-payment', {
        userId,
        entries: ticketToBuy.entries,
        totalPrice: ticketToBuy.price
      });

      const { sessionId } = response.data;
      const result = await stripe.redirectToCheckout({ sessionId });

      if (result.error) {
        setError(result.error.message);
        setLoading(false);
        setShowConfirmModal(false);
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(t?.seasonTickets?.paymentError || 'Payment initialization failed. Please try again.');
      setLoading(false);
      setShowConfirmModal(false);
    }
  };

  // Zatvorenie modálneho okna
  const closeConfirmModal = () => {
    setShowConfirmModal(false);
    setTicketToBuy(null);
    setError('');
  };

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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto mb-8">
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
                    {ticket.savings}
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

                {/* Validity info block */}
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-4 text-center">
                  <p className="text-sm text-blue-800 font-medium">📅 Platnosť: 6 mesiacov</p>
                </div>

                <ul className="space-y-1 text-sm">
                  <li className="flex items-center text-gray-900 font-medium">
                    <span className="text-secondary-500 font-bold mr-2">✓</span>
                    Platí na MIDI a MAXI
                  </li>
                  <li className="flex items-center text-gray-900 font-medium">
                    <span className="text-secondary-500 font-bold mr-2">✓</span>
                    {t?.seasonTickets?.feature2 || 'Prenosná na súrodencov'}
                  </li>
                </ul>
              </div>

              <button
                className={`
                  w-full bg-secondary-500 text-white border-none py-3 px-6 rounded-lg font-bold text-base transition-all duration-300 ease-in-out
                  flex items-center justify-center gap-2 relative overflow-hidden
                  hover:bg-secondary-600 hover:transform hover:-translate-y-0.5 hover:shadow-lg
                `}
                // ZMENA: Voláme handleBuyClick namiesto priamej platby
                onClick={() => handleBuyClick(ticket)}
              >
                {t?.seasonTickets?.buyNow || 'Kúpiť'}
                <span className="transition-transform duration-300 ease-in-out group-hover:translate-x-1">→</span>
              </button>
            </div>
          ))}
        </div>

        {error && !showConfirmModal && (
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
            ← {t?.seasonTickets?.backToBooking || 'Späť na rezervácie'}
          </button>
        </div>
      </div>

      {/* ================= MODÁLNE OKNO (CONFIRMATION MODAL) ================= */}
      {showConfirmModal && ticketToBuy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-fadeIn transform transition-all">

            {/* Header okna */}
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">Súhrn objednávky</h3>
              <button onClick={closeConfirmModal} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>

            {/* Obsah okna */}
            <div className="p-6 space-y-4">

              {/* Info o lístku */}
              <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-gray-800 text-lg">{ticketToBuy.entries} vstupov</span>
                  <span className="font-bold text-secondary-600 text-xl">{ticketToBuy.price} €</span>
                </div>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li className="flex items-center gap-2">
                    <span>📅</span> Expirácia: <strong>6 mesiacov</strong> od zakúpenia
                  </li>
                  <li className="flex items-center gap-2">
                    <span>🧘‍♀️</span> Platí na: <strong>MIDI a MAXI</strong> hodiny
                  </li>
                </ul>
              </div>

              {/* Checkbox */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="agreedToTerms"
                    className="mt-1 w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500 focus:ring-2 flex-shrink-0"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                  />
                  <label htmlFor="agreedToTerms" className="text-sm text-gray-700 leading-relaxed cursor-pointer">
                    Oboznámil som sa so{' '}
                    <Link to="/terms" target="_blank" className="text-secondary-600 underline hover:text-secondary-700 font-medium">
                      Všeobecnými obchodnými podmienkami
                    </Link>
                    {' '}a{' '}
                    <Link to="/gdpr" target="_blank" className="text-secondary-600 underline hover:text-secondary-700 font-medium">
                      Ochranou osobných údajov
                    </Link>
                    , porozumel som ich obsahu a v celom rozsahu s nimi súhlasím.
                  </label>
                </div>
              </div>
            </div>

            {/* Footer s tlačidlom */}
            <div className="p-6 pt-0">
              <button
                onClick={executePayment}
                disabled={loading || !agreedToTerms}
                className={`
                  w-full py-3.5 rounded-xl font-bold text-white text-base shadow-lg transition-all transform
                  flex justify-center items-center gap-2
                  ${(loading || !agreedToTerms)
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 hover:-translate-y-1 hover:shadow-green-200'
                  }
                `}
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Spracovávam...
                  </>
                ) : (
                  <>
                    Kúpiť permanentku <span className="text-xs font-normal opacity-90">(s povinnosťou platby)</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default SeasonTickets;