import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { useTranslation } from '../contexts/LanguageContext';
import api from '../api/api';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);
const ENTRY_OPTIONS = [3, 5, 10];
const DISCOUNT_MAP = { 3: 0.89, 5: 0.87, 10: 0.8 };
const SAVINGS_KEY_MAP = { 3: 'smallSaver', 5: 'standard', 10: 'bestValue' };

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
  const [serviceConsent, setServiceConsent] = useState(false);
  const [showServiceConsentModal, setShowServiceConsentModal] = useState(false);

  const [trainingTypes, setTrainingTypes] = useState([]);
  const [seasonTicketOffers, setSeasonTicketOffers] = useState([]);
  const [selectedTrainingTypeId, setSelectedTrainingTypeId] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminOffers, setAdminOffers] = useState([]);
  const [adminSelectedTypeId, setAdminSelectedTypeId] = useState('');
  const [adminOffersForm, setAdminOffersForm] = useState([]);
  const [adminSaving, setAdminSaving] = useState(false);
  const [adminError, setAdminError] = useState('');
  const [adminSuccess, setAdminSuccess] = useState('');

  // Pomocná funkcia na výpočet úspory
  const getBasePriceForType = useCallback((trainingTypeId) => {
    const type = trainingTypes.find(t => t.id === trainingTypeId);
    if (!type || !Array.isArray(type.prices) || type.prices.length === 0) return 0;

    const priceForOne = type.prices.find(p => p.child_count === 1);
    const basePrice = priceForOne ? priceForOne.price : type.prices.reduce((min, p) => (
      parseFloat(p.price) < parseFloat(min.price) ? p : min
    ), type.prices[0]).price;

    return parseFloat(basePrice);
  }, [trainingTypes]);

  const calculateSavings = (price, entries, trainingTypeId) => {
    const standardPrice = getBasePriceForType(trainingTypeId);
    if (!standardPrice) return 0;

    const totalStandardPrice = entries * standardPrice;
    const savings = totalStandardPrice - price;
    const savingsPercent = Math.round((savings / totalStandardPrice) * 100);
    return savingsPercent;
  };

  const getSuggestedPrice = useCallback((entries, trainingTypeId) => {
    const basePrice = getBasePriceForType(trainingTypeId);
    if (!basePrice) return '';
    const discount = DISCOUNT_MAP[entries] || 1;
    return (basePrice * entries * discount).toFixed(2);
  }, [getBasePriceForType]);

  useEffect(() => {
    const handleAuthChange = () => {
      setIsLoggedIn(localStorage.getItem('isLoggedIn') === 'true');
      setUserId(localStorage.getItem('userId'));
    };
    window.addEventListener('storage', handleAuthChange);
    return () => window.removeEventListener('storage', handleAuthChange);
  }, []);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const response = await api.get(`/api/users/${localStorage.getItem('userId')}`);
        setIsAdmin(response.data.role === 'admin' || localStorage.getItem('userRole') === 'admin');
      } catch (error) {
        console.error('Admin check failed:', error);
      }
    };

    if (isLoggedIn) checkAdmin();
  }, [isLoggedIn]);

  useEffect(() => {
    const fetchTrainingTypes = async () => {
      try {
        const response = await api.get('/api/training-types?admin=false');
        setTrainingTypes(response.data);

        if (isAdmin && !adminSelectedTypeId && response.data.length > 0) {
          setAdminSelectedTypeId(response.data[0].id.toString());
        }
      } catch (err) {
        console.error('Failed to fetch training types:', err);
      }
    };

    const fetchOffers = async () => {
      try {
        const response = await api.get('/api/season-ticket-offers');
        setSeasonTicketOffers(response.data);
        if (!selectedTrainingTypeId) {
          setSelectedTrainingTypeId('');
        }
      } catch (err) {
        console.error('Failed to fetch season ticket offers:', err);
      }
    };

    fetchTrainingTypes();
    fetchOffers();
  }, [isAdmin, selectedTrainingTypeId, adminSelectedTypeId]);

  useEffect(() => {
    const fetchAdminOffers = async () => {
      if (!isAdmin) return;
      try {
        const response = await api.get('/api/admin/season-ticket-offers');
        setAdminOffers(response.data);
      } catch (err) {
        console.error('Failed to fetch admin offers:', err);
      }
    };

    fetchAdminOffers();
  }, [isAdmin]);

  useEffect(() => {
    if (!adminSelectedTypeId) return;

    const typeId = parseInt(adminSelectedTypeId, 10);
    const existing = adminOffers.filter(o => parseInt(o.training_type_id, 10) === typeId);

    const formData = ENTRY_OPTIONS.map(entries => {
      const existingOffer = existing.find(o => o.entries === entries);
      return {
        entries,
        price: existingOffer ? parseFloat(existingOffer.price).toFixed(2) : getSuggestedPrice(entries, typeId),
        active: existingOffer ? existingOffer.active : true,
      };
    });

    setAdminOffersForm(formData);
  }, [adminSelectedTypeId, adminOffers, getSuggestedPrice]);

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

    if (!serviceConsent) {
      setError('Musíte súhlasiť so začatím poskytovania služby.');
      return;
    }

    setLoading(true);

    try {
      const stripe = await stripePromise;
      const response = await api.post('api/create-season-ticket-payment', {
        userId,
        entries: ticketToBuy.entries,
        totalPrice: ticketToBuy.price,
        trainingTypeId: ticketToBuy.training_type_id
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

  const closeServiceConsentModal = () => {
    setShowServiceConsentModal(false);
  };

  const handleAdminOfferChange = (entries, field, value) => {
    setAdminOffersForm((prev) =>
      prev.map((offer) =>
        offer.entries === entries ? { ...offer, [field]: value } : offer
      )
    );
  };

  const handleAdminSave = async () => {
    if (!adminSelectedTypeId) return;
    setAdminSaving(true);
    setAdminError('');
    setAdminSuccess('');

    try {
      const typeName = trainingTypes.find(t => t.id === parseInt(adminSelectedTypeId, 10))?.name || '';
      const existingOffers = adminOffers.filter(o => parseInt(o.training_type_id, 10) === parseInt(adminSelectedTypeId, 10));
      const actionLabel = existingOffers.length > 0 ? 'upravená' : 'pridaná';

      const payload = adminOffersForm.map((offer) => ({
        entries: offer.entries,
        price: parseFloat(offer.price),
        active: offer.active,
      }));

      await api.post('/api/admin/season-ticket-offers', {
        trainingTypeId: parseInt(adminSelectedTypeId, 10),
        offers: payload,
      });

      const updated = await api.get('/api/admin/season-ticket-offers');
      setAdminOffers(updated.data);
      setAdminSuccess(`Permanentka - ${typeName} bola úspešne ${actionLabel}.`);
    } catch (err) {
      console.error('Failed to save offers:', err);
      setAdminError('Nepodarilo sa uložiť permanentky.');
    } finally {
      setAdminSaving(false);
    }
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

  const trainingTypeOptions = trainingTypes.filter(type =>
    seasonTicketOffers.some(offer => parseInt(offer.training_type_id, 10) === type.id)
  );
  const selectedTrainingType = trainingTypes.find(type => type.id === parseInt(selectedTrainingTypeId, 10));
  const filteredOffers = selectedTrainingTypeId
    ? seasonTicketOffers.filter(offer => parseInt(offer.training_type_id, 10) === parseInt(selectedTrainingTypeId, 10))
    : [];

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

        {/* Filter podľa tréningu */}
        <div className="max-w-3xl mx-auto mb-10 flex flex-col sm:flex-row gap-4 items-center justify-center">
          <label className="font-semibold text-gray-700">
            {t?.seasonTicketsPage?.filterLabel || 'Vyberte hodinu'}
          </label>
          <select
            value={selectedTrainingTypeId}
            onChange={(e) => setSelectedTrainingTypeId(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700"
          >
            <option value="">{t?.seasonTicketsPage?.filterPlaceholder || 'Vyberte hodinu...'}</option>
            {trainingTypeOptions.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
        </div>

        {isAdmin && (
          <div className="max-w-5xl mx-auto mb-12 p-6 bg-white rounded-xl shadow-md border border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Admin panel – permanentky</h2>
                <div className="text-sm text-gray-600 mt-1">
                  Cena za vstup: {getBasePriceForType(parseInt(adminSelectedTypeId || '0', 10)) || '—'} €
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label className="font-semibold text-gray-700">Tréning</label>
                <select
                  value={adminSelectedTypeId}
                  onChange={(e) => setAdminSelectedTypeId(e.target.value)}
                  className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700"
                >
                  {trainingTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {adminOffersForm.map((offer) => (
                <div key={offer.entries} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-gray-700">{offer.entries} vstupov</span>
                    <label className="flex items-center gap-2 text-sm text-gray-600">
                      <input
                        type="checkbox"
                        checked={offer.active}
                        onChange={(e) => handleAdminOfferChange(offer.entries, 'active', e.target.checked)}
                      />
                      Aktívne
                    </label>
                  </div>
                  <label className="block text-sm text-gray-600 mb-1">Cena (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={offer.price}
                    onChange={(e) => handleAdminOfferChange(offer.entries, 'price', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <div className="text-xs text-gray-500 mt-2">
                    Navrhovaná cena: {getSuggestedPrice(offer.entries, parseInt(adminSelectedTypeId || '0', 10)) || '—'} €
                  </div>
                </div>
              ))}
            </div>

            {adminError && (
              <div className="mt-4 text-sm text-red-600">{adminError}</div>
            )}
            {adminSuccess && (
              <div className="mt-4 text-sm text-green-600">{adminSuccess}</div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleAdminSave}
                disabled={adminSaving}
                className="px-6 py-2 rounded-lg bg-secondary-900 text-white font-semibold hover:bg-secondary-500 disabled:opacity-60"
              >
                {adminSaving ? 'Ukladám...' : 'Pridať permanentky'}
              </button>
            </div>
          </div>
        )}

        {/* Grid Kariet - firemný dizajn */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {selectedTrainingTypeId && filteredOffers.length === 0 ? (
            <div className="col-span-full text-center text-gray-600">
              {t?.seasonTicketsPage?.noOffers || 'Pre vybraný tréning zatiaľ nie sú dostupné permanentky.'}
            </div>
          ) : (
            filteredOffers.map((ticket) => {
              const savingsKey = SAVINGS_KEY_MAP[ticket.entries] || 'standard';
              const savingsPercent = calculateSavings(parseFloat(ticket.price), ticket.entries, ticket.training_type_id);
              const isPopular = ticket.entries === 5;
              return (
                <div
                  key={ticket.id}
                  className={`
                    relative flex flex-col p-6 sm:p-8
                    bg-overlay-80 backdrop-blur-sm rounded-xl shadow-lg border-2
                    transition-all duration-300 hover:shadow-2xl hover:scale-105
                    ${isPopular
                      ? 'border-secondary-900 ring-2 ring-secondary-200 shadow-secondary-500/20'
                      : 'border-gray-200 hover:border-secondary-400 hover:shadow-secondary-500/10'
                    }
                `}>
                  {/* Odznak Najobľúbenejšie */}
                  {isPopular && (
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
                      ${isPopular ? 'bg-secondary-100' : 'bg-secondary-50'}
                    `}>
                      {t?.seasonTicketsPage?.tags?.[savingsKey] || savingsKey}
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
                        <span className="text-3xl font-bold text-secondary-600">€{parseFloat(ticket.price).toFixed(2)}</span>
                      </div>
                      <p className="text-green-600 text-sm mt-1 font-medium">
                        {t?.seasonTicketsPage?.savings.replace('{percent}', savingsPercent)}
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

                      {/* Obmedzenie: podľa tréningu */}
                      <li className="flex items-start gap-3">
                        <div className="mt-0.5 p-1 bg-secondary-500/20 rounded-full text-secondary-700 flex-shrink-0">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                        </div>
                        <div>
                          <span className="font-bold text-gray-500 block">
                            {t?.seasonTicketsPage?.restrictionLabel || 'Platí len:'} {ticket.training_type_name}
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
              );
            })
          )}
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
                  {t?.seasonTicketsPage?.validFor || 'Platí pre'}{' '}
                  <span style={{ color: '#eabd64' }} className="font-bold">
                    {ticketToBuy.training_type_name || selectedTrainingType?.name}
                  </span>
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

              {/* Checkbox - Service Consent */}
              <div className="mb-6">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="serviceConsent"
                    checked={serviceConsent}
                    onChange={(e) => setServiceConsent(e.target.checked)}
                    required
                    className="mt-1 w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500 focus:ring-2 flex-shrink-0"
                  />
                  <label htmlFor="serviceConsent" className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                    <button
                      type="button"
                      onClick={() => setShowServiceConsentModal(true)}
                      className="text-primary-500 hover:text-primary-600 underline font-medium"
                    >
                      Súhlas so začatím poskytovania služby
                    </button>
                  </label>
                </div>
              </div>

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
                    {t?.booking?.consentText?.split('{terms}').map((part, index) =>
                      index === 0 ? (
                        <React.Fragment key={index}>
                          {part}
                          <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:text-primary-600 underline font-medium">
                            {t?.booking?.terms || 'Všeobecnými obchodnými podmienkami'}
                          </a>
                        </React.Fragment>
                      ) : (
                        <React.Fragment key={index}>
                          {part.split('{privacy}')[0]}
                          <a href="/gdpr" target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:text-primary-600 underline font-medium">
                            {t?.booking?.privacy || 'Zásadami ochrany osobných údajov'}
                          </a>
                          {part.split('{privacy}')[1]}
                        </React.Fragment>
                      )
                    )}
                  </label>
                </div>
              </div>

              {/* Tlačidlo - ZMENA 2: Odstránené uppercase */}
              <button
                onClick={executePayment}
                disabled={loading || !agreementChecked || !serviceConsent}
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

      {/* SERVICE CONSENT MODAL */}
      {showServiceConsentModal && (
        <div className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden border-2 border-gray-200 max-h-[80vh] overflow-y-auto">
            <div className="px-6 py-4 flex justify-between items-center">
              <h3 className="font-bold text-lg text-black">
                Súhlas so začatím poskytovania služby
              </h3>
              <button onClick={closeServiceConsentModal} className="text-gray-500 hover:text-gray-700 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <div className="border-b border-gray-300"></div>
            <div className="p-6 text-gray-700 text-sm leading-relaxed whitespace-pre-line">
              Podľa zákona č. 108/2024 Z.z. o ochrane spotrebiteľa týmto žiadam a udeľujem prevádzkovateľovi Nitráčik, o.z., IČO: 56374453 výslovný súhlas so začatím poskytovania služby pred uplynutím lehoty na odstúpenie od zmluvy a súčasne vyhlasujem, že som bol riadne poučený, že udelením tohto súhlasu strácam ako spotrebiteľ právo na odstúpenie od zmluvy po úplnom poskytnutí služby podľa § 19 ods. 1 písm. a) zákona č. 108/2024 Z.z. o ochrane spotrebiteľa v platnom znení.
            </div>
            <div className="border-t border-gray-300 px-6 py-4 flex justify-end">
              <button
                onClick={closeServiceConsentModal}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
              >
                Rozumiem
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default SeasonTickets;