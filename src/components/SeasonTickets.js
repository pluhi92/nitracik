import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { useTranslation } from '../contexts/LanguageContext';
import api from '../api/api';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);

const SeasonTickets = () => {
  const { t, language } = useTranslation();
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem('isLoggedIn') === 'true');
  const [userId, setUserId] = useState(localStorage.getItem('userId'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Stavy pre modálne okno
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [ticketToBuy, setTicketToBuy] = useState(null);
  const [agreementChecked, setAgreementChecked] = useState(false);

  // Pomocná funkcia na výpočet úspory
  const calculateSavings = (price, entries) => {
    const standardPrice = 15; // štandardná cena za vstup
    const totalStandardPrice = entries * standardPrice;
    const savings = totalStandardPrice - price;
    const savingsPercent = Math.round((savings / totalStandardPrice) * 100);
    return savingsPercent;
  };

  // Dáta permanentiek
  const [seasonTickets] = useState([
    {
      id: 1,
      entries: 3,
      price: 40,
      popular: false,
      savingsKey: 'smallSaver',
      perEntry: 13.33,
      savingsPercent: calculateSavings(40, 3)
    },
    {
      id: 2,
      entries: 5,
      price: 65,
      popular: true,
      savingsKey: 'standard',
      perEntry: 13.00,
      savingsPercent: calculateSavings(65, 5)
    },
    {
      id: 3,
      entries: 10,
      price: 120,
      popular: false,
      savingsKey: 'bestValue',
      perEntry: 12.00,
      savingsPercent: calculateSavings(120, 10)
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

  const handleBuyClick = (ticket) => {
    if (!isLoggedIn) {
      navigate('/login', { state: { from: '/season-tickets' } });
      return;
    }
    setError('');
    setTicketToBuy(ticket);
    setAgreementChecked(false);
    setShowConfirmModal(true);
  };

  const executePayment = async () => {
    if (!ticketToBuy) return;

    if (!agreementChecked) {
      setError(t?.seasonTicketsPage?.termsError || 'Pre pokračovanie musíte súhlasiť s podmienkami.');
      return;
    }

    setLoading(true);

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
      setError(t?.booking?.paymentError || 'Payment initialization failed.');
      setLoading(false);
      setShowConfirmModal(false);
    }
  };

  const closeConfirmModal = () => {
    setShowConfirmModal(false);
    setTicketToBuy(null);
    setError('');
  };

  const getEntriesLabel = (count) => {
    if (!t?.seasonTicketsPage?.entriesLabel) return '';

    if (language === 'sk') {
      if (count === 1) return t.seasonTicketsPage.entriesLabel.one;
      if (count >= 2 && count <= 4) return t.seasonTicketsPage.entriesLabel.few;
      return t.seasonTicketsPage.entriesLabel.many;
    }

    // EN
    return count === 1
      ? t.seasonTicketsPage.entriesLabel.one
      : t.seasonTicketsPage.entriesLabel.many;
  };

  return (
    // Ponechávame pôvodný section nezmenený
    <section className="min-h-screen bg-background py-12 px-4 sm:px-6">
      <div className="max-w-container mx-auto">

        {/* Header - čierny text */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-black mb-4">
            {t?.seasonTicketsPage?.title || 'Permanentky'}
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-black max-w-2xl mx-auto leading-relaxed">
            {t?.seasonTicketsPage?.subtitle || 'Ušetrite s našimi výhodnými balíčkami vstupov'}
          </p>
        </div>

        {/* Grid Kariet - firemný dizajn */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {seasonTickets.map((ticket) => (
            <div
              key={ticket.id}
              className={`
                relative flex flex-col p-6 sm:p-8
                bg-overlay-80 backdrop-blur-sm rounded-xl shadow-lg border-2
                transition-all duration-300 hover:shadow-2xl hover:scale-105
                ${ticket.popular
                  ? 'border-secondary-900 ring-2 ring-secondary-200 shadow-secondary-500/20'
                  : 'border-gray-200 hover:border-secondary-400 hover:shadow-secondary-500/10'
                }
            `}>
              {/* Odznak Najobľúbenejšie */}
              {ticket.popular && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <span className="bg-secondary-900 text-white text-xs font-bold px-4 py-1 uppercase tracking-wider rounded-full shadow-lg">
                    {t?.seasonTicketsPage?.mostPopular || 'Najobľúbenejšie'}
                  </span>
                </div>
              )}

              {/* Obsah karty */}
              <div className="flex-1 flex flex-col items-center text-center">

                {/* Tag / Názov balíčka */}
                <span className={`
                  inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide mb-6 text-gray-500
                  ${ticket.popular ? 'bg-secondary-100' : 'bg-secondary-50'}
                `}>
                  {t?.seasonTicketsPage?.tags?.[ticket.savingsKey] || ticket.savingsKey}
                </span>

                {/* Počet vstupov - KARTA */}
                <div className="mb-2">
                  <h3 className="text-5xl sm:text-6xl font-bold text-gray-500 tracking-tight">
                    {ticket.entries}
                  </h3>
                  <span className="text-sm font-bold text-gray-500 uppercase tracking-widest mt-1 block">
                    {/* LOGIKA: Ak je SK, riešime skloňovanie. Ak je EN, riešime Entry/Entries */}
                    {language === 'sk'
                      ? (ticket.entries === 1 ? 'vstup' : (ticket.entries >= 2 && ticket.entries <= 4 ? 'vstupy' : t?.seasonTicketsPage?.entries))
                      : (ticket.entries === 1 ? 'Entry' : t?.seasonTicketsPage?.entries)
                    }
                  </span>
                </div>

                {/* Cena */}
                <div className="mb-6 w-full border-t border-b border-secondary-200 py-4 mt-4">
                  <div className="flex justify-center items-baseline">
                    <span className="text-3xl font-bold text-secondary-600">€{ticket.price}</span>
                  </div>
                  <p className="text-green-600 text-sm mt-1 font-medium">
                    {t?.seasonTicketsPage?.savings.replace(
                      '{percent}',
                      ticket.savingsPercent
                    )}
                  </p>
                </div>

                {/* Vlastnosti (Features) */}
                <ul className="text-sm space-y-4 mb-8 w-full text-left px-2">

                  {/* Platnosť: 6 mesiacov */}
                  <li className="flex items-start gap-3">
                    <div className="mt-0.5 p-1 bg-secondary-100 rounded-full text-secondary-600 flex-shrink-0">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-500 block">
                        {t?.seasonTicketsPage?.validity || 'Platnosť: 6 mesiacov'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {t?.seasonTicketsPage?.validityNote || 'od zakúpenia'}
                      </span>
                    </div>
                  </li>

                  {/* Obmedzenie: Len MIDI a MAXI */}
                  <li className="flex items-start gap-3">
                    <div className="mt-0.5 p-1 bg-secondary-500/20 rounded-full text-secondary-700 flex-shrink-0">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                    </div>
                    <div>
                      <span className="font-bold text-gray-500 block">
                        {t?.seasonTicketsPage?.restriction || 'Platí len pre MIDI a MAXI'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {t?.seasonTicketsPage?.restrictionDetail || 'Nevzťahuje sa na iné typy'}
                      </span>
                    </div>
                  </li>
                </ul>

                {/* Tlačidlo - secondary-900 pre všetky */}
                <div className="mt-auto w-full">
                  <button
                    onClick={() => handleBuyClick(ticket)}
                    className="
                      w-full py-3.5 px-6 rounded-lg font-semibold text-white transition-all duration-300
                      bg-secondary-900 hover:bg-secondary-500 shadow-lg hover:shadow-xl hover:-translate-y-0.5
                    "
                  >
                    {t?.seasonTicketsPage?.buyButton || 'Kúpiť permanentku'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL WINDOW - Finalizovaný dizajn */}
      {showConfirmModal && ticketToBuy && (
        <div className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border-2 border-gray-200">

            {/* Modal Header */}
            <div className="px-6 py-4 flex justify-between items-center">
              {/* ZMENA 2: Odstránené 'uppercase', text bude tak ako v preklade (Kúpiť permanentku) */}
              <h3 className="font-bold text-lg text-black">
                {t?.seasonTicketsPage?.buyButton || 'Kúpiť permanentku'}
              </h3>
              <button onClick={closeConfirmModal} className="text-gray-500 hover:text-black transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            {/* ZMENA 1: Čiara je sivá (border-gray-300), kratšia (w-2/3) a vycentrovaná (mx-auto) */}
            <div className="border-b border-gray-300 w-2/3 mx-auto"></div>

            <div className="p-6 pb-2">

              <div className="flex flex-col items-center justify-center mb-6">

                {/* 3 VSTUPY - ZMENA 3: Gramatika */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl font-bold text-gray-500">
                    {ticketToBuy.entries}
                  </span>
                  <span className="text-xl font-bold text-gray-500">
                    {getEntriesLabel(ticketToBuy.entries)}
                  </span>
                </div>

                {/* CENA */}
                <div className="text-5xl font-extrabold text-black mb-4">
                  {ticketToBuy.price} €
                </div>

                <div className="text-center text-gray-600 font-medium">
                  {t?.seasonTicketsPage?.validFor}{' '}
                  <span style={{ color: '#eabd64' }} className="font-bold">MIDI</span>{' '}
                  {t?.seasonTicketsPage?.and}{' '}
                  <span style={{ color: '#f8b2b2' }} className="font-bold">MAXI</span>
                </div>
              </div>


              {/* Platnosť */}
              <div className="text-center font-bold text-gray-800 mt-4 mb-2">
                {t?.seasonTicketsPage?.validity || 'Platnosť: 6 mesiacov od dňa zakúpenia'}
              </div>

            </div>

            {/* ZMENA 1: Spodná čiara taktiež kratšia a sivá */}
            <div className="border-b border-gray-300 w-2/3 mx-auto"></div>

            {/* SPODNÁ ČASŤ */}
            <div className="p-6 pt-8">

              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-center gap-2">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  {error}
                </div>
              )}

              {/* Checkbox */}
              <div className="mb-6">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="agreementChecked"
                    checked={agreementChecked}
                    onChange={(e) => setAgreementChecked(e.target.checked)}
                    required
                    className="mt-1 w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500 focus:ring-2 flex-shrink-0"
                  />
                  <label htmlFor="agreementChecked" className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                    {t?.contact?.form?.consentText?.split('{terms}').map((part, index) =>
                      index === 0 ? (
                        <>
                          {part}
                          <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:text-primary-600 underline font-medium">
                            {t?.contact?.form?.terms || 'Všeobecnými obchodnými podmienkami'}
                          </a>
                        </>
                      ) : (
                        <>
                          {part.split('{privacy}')[0]}
                          <a href="/gdpr" target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:text-primary-600 underline font-medium">
                            {t?.contact?.form?.privacy || 'Zásadami ochrany osobných údajov'}
                          </a>
                          {part.split('{privacy}')[1]}
                        </>
                      )
                    )}
                  </label>
                </div>
              </div>

              {/* Tlačidlo - ZMENA 2: Odstránené uppercase */}
              <button
                onClick={executePayment}
                disabled={loading || !agreementChecked}
                className="
                  w-full py-3.5 px-6 rounded-lg font-bold text-white shadow-lg transition-all tracking-wide
                  flex justify-center items-center gap-2
                  bg-secondary-900 hover:bg-secondary-500 hover:-translate-y-0.5 hover:shadow-xl
                  disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed disabled:transform-none
                "
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t?.seasonTicketsPage?.processing || 'Spracovávam...'}
                  </>
                ) : (
                  t?.seasonTicketsPage?.buyButton || 'Kúpiť permanentku'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default SeasonTickets;