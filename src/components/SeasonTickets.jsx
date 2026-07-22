import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { useTranslation } from '../contexts/LanguageContext';
import api from '../api/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, 
  Settings, 
  Plus, 
  X, 
  CheckCircle2, 
  Ticket, 
  AlertCircle, 
  CreditCard,
  Crown
} from 'lucide-react';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);
const ENTRY_OPTIONS = [3, 5, 10];

// Framer Motion Variants
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const cardVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
};

const modalVariant = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, ease: "easeOut" } },
  exit: { opacity: 0, y: 20, scale: 0.95, transition: { duration: 0.2, ease: "easeIn" } }
};

const SeasonTickets = () => {
  const { t, language } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
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

  const [seasonTicketProducts, setSeasonTicketProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [seasonTicketOffers, setSeasonTicketOffers] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [offersLoading, setOffersLoading] = useState(false);
  
  // Admin stavy
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false); // Pre Accordion menu
  const [adminTrainingTypes, setAdminTrainingTypes] = useState([]);
  const [adminProducts, setAdminProducts] = useState([]);
  const [adminSelectedProductId, setAdminSelectedProductId] = useState('');
  const [adminOffers, setAdminOffers] = useState([]);
  const [adminOffersForm, setAdminOffersForm] = useState([]);
  const [adminSaving, setAdminSaving] = useState(false);
  const [adminError, setAdminError] = useState('');
  const [adminSuccess, setAdminSuccess] = useState('');
  const [adminCreateForm, setAdminCreateForm] = useState({
    code: '',
    name: '',
    description: '',
    trainingTypeIds: [],
    offers: ENTRY_OPTIONS.map((entries) => ({ entries, price: '', active: true }))
  });

  // Age group filter
  const [ageGroup, setAgeGroup] = useState(() => {
    const urlAudience = searchParams.get('audience');
    return urlAudience === 'adult' ? 'adult' : 'child';
  });
  
  const [trainingTypes, setTrainingTypes] = useState([]);

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

    if (isLoggedIn) {
      checkAdmin();
    } else {
      setIsAdmin(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    const fetchProducts = async () => {
      setProductsLoading(true);
      try {
        const response = await api.get('/api/season-ticket-products');
        setSeasonTicketProducts(response.data || []);
      } catch (err) {
        console.error('Failed to fetch season ticket products:', err);
      } finally {
        setProductsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    const fetchTrainingTypes = async () => {
      try {
        const response = await api.get('/api/training-types');
        setTrainingTypes(response.data || []);
      } catch (err) {
        console.error('Failed to fetch training types:', err);
      }
    };
    fetchTrainingTypes();
  }, []);

  const filteredProducts = useMemo(() => {
    if (!trainingTypes.length) return seasonTicketProducts;
    
    return seasonTicketProducts.filter(product => {
      const productTrainingTypeIds = product.trainingTypeIds || [];
      if (productTrainingTypeIds.length === 0) return true;
      
      const productAudienceTypes = productTrainingTypeIds
        .map(id => trainingTypes.find(t => t.id === id)?.audience_type)
        .filter(Boolean);
      
      if (productAudienceTypes.length === 0) return true;
      
      const hasChildren = productAudienceTypes.some(at => at === 'children');
      const hasAdults = productAudienceTypes.some(at => at === 'adults');
      
      if (ageGroup === 'child') {
        return hasChildren || (!hasChildren && !hasAdults);
      } else {
        return hasAdults || (!hasChildren && !hasAdults);
      }
    });
  }, [seasonTicketProducts, trainingTypes, ageGroup]);

  useEffect(() => {
    const fetchOffers = async () => {
      if (!selectedProductId) {
        setSeasonTicketOffers([]);
        return;
      }

      setOffersLoading(true);
      try {
        const response = await api.get(`/api/season-ticket-products/${selectedProductId}/offers`);
        setSeasonTicketOffers(response.data || []);
      } catch (err) {
        console.error('Failed to fetch season ticket offers:', err);
        setSeasonTicketOffers([]);
      } finally {
        setOffersLoading(false);
      }
    };

    fetchOffers();
  }, [selectedProductId]);

  useEffect(() => {
    const fetchAdminData = async () => {
      if (!isAdmin) return;

      try {
        const [typesResponse, productsResponse, offersResponse] = await Promise.all([
          api.get('/api/training-types?admin=true'),
          api.get('/api/admin/season-ticket-products'),
          api.get('/api/admin/season-ticket-offers')
        ]);

        setAdminTrainingTypes(typesResponse.data || []);
        setAdminProducts(productsResponse.data || []);
        setAdminOffers(offersResponse.data || []);

        if (!adminSelectedProductId && productsResponse.data?.length > 0) {
          setAdminSelectedProductId(productsResponse.data[0].id.toString());
        }
      } catch (err) {
        console.error('Failed to fetch admin data:', err);
      }
    };

    fetchAdminData();
  }, [isAdmin, adminSelectedProductId]);

  useEffect(() => {
    if (!isAdmin || !adminSelectedProductId) return;

    const productId = parseInt(adminSelectedProductId, 10);
    const existing = adminOffers.filter((offer) => parseInt(offer.season_ticket_product_id, 10) === productId);

    const formData = ENTRY_OPTIONS.map((entries) => {
      const existingOffer = existing.find((offer) => offer.entries === entries);
      return {
        entries,
        price: existingOffer ? parseFloat(existingOffer.price).toFixed(2) : '',
        active: existingOffer ? existingOffer.active : true
      };
    });

    setAdminOffersForm(formData);
  }, [isAdmin, adminSelectedProductId, adminOffers]);

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
    if (!selectedProductId) {
      setError('Vyberte produkt permanentky.');
      return;
    }

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
        productId: parseInt(selectedProductId, 10)
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

  const handleAdminCreateChange = (field, value) => {
    setAdminCreateForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAdminCreateOfferChange = (entries, value) => {
    setAdminCreateForm((prev) => ({
      ...prev,
      offers: prev.offers.map((offer) =>
        offer.entries === entries ? { ...offer, price: value } : offer
      )
    }));
  };

  const handleAdminTrainingTypeToggle = (trainingTypeId) => {
    setAdminCreateForm((prev) => {
      const alreadySelected = prev.trainingTypeIds.includes(trainingTypeId);
      return {
        ...prev,
        trainingTypeIds: alreadySelected
          ? prev.trainingTypeIds.filter((id) => id !== trainingTypeId)
          : [...prev.trainingTypeIds, trainingTypeId]
      };
    });
  };

  const handleAdminCreateProduct = async () => {
    setAdminError('');
    setAdminSuccess('');

    if (!adminCreateForm.code.trim() || !adminCreateForm.name.trim()) {
      setAdminError('Code a názov sú povinné.');
      return;
    }
    if (adminCreateForm.trainingTypeIds.length === 0) {
      setAdminError('Vyberte aspoň jeden typ tréningu.');
      return;
    }

    const offersPayload = adminCreateForm.offers
      .map((offer) => ({
        entries: offer.entries,
        price: parseFloat(offer.price)
      }))
      .filter((offer) => !Number.isNaN(offer.price) && offer.price > 0);

    if (offersPayload.length === 0) {
      setAdminError('Zadajte aspoň jednu cenu pre ponuku.');
      return;
    }

    setAdminSaving(true);
    try {
      await api.post('/api/admin/season-ticket-products', {
        code: adminCreateForm.code.trim(),
        name: adminCreateForm.name.trim(),
        description: adminCreateForm.description?.trim() || null,
        trainingTypeIds: adminCreateForm.trainingTypeIds,
        offers: offersPayload
      });

      const [productsResponse, offersResponse, userProductsResponse] = await Promise.all([
        api.get('/api/admin/season-ticket-products'),
        api.get('/api/admin/season-ticket-offers'),
        api.get('/api/season-ticket-products')
      ]);

      setAdminProducts(productsResponse.data || []);
      setAdminOffers(offersResponse.data || []);
      setSeasonTicketProducts(userProductsResponse.data || []);
      setAdminSuccess('Produkt bol úspešne vytvorený.');

      setAdminCreateForm({
        code: '',
        name: '',
        description: '',
        trainingTypeIds: [],
        offers: ENTRY_OPTIONS.map((entries) => ({ entries, price: '', active: true }))
      });
    } catch (err) {
      console.error('Failed to create product:', err);
      setAdminError('Nepodarilo sa vytvoriť produkt.');
    } finally {
      setAdminSaving(false);
    }
  };

  const handleAdminSaveOffers = async () => {
    if (!adminSelectedProductId) return;

    setAdminSaving(true);
    setAdminError('');
    setAdminSuccess('');

    const payload = adminOffersForm
      .map((offer) => ({
        entries: offer.entries,
        price: parseFloat(offer.price),
        active: offer.active
      }))
      .filter((offer) => !Number.isNaN(offer.price) && offer.price > 0);

    if (payload.length === 0) {
      setAdminError('Zadajte aspoň jednu cenu pre ponuku.');
      setAdminSaving(false);
      return;
    }

    try {
      await api.post('/api/admin/season-ticket-offers', {
        productId: parseInt(adminSelectedProductId, 10),
        offers: payload
      });

      const updated = await api.get('/api/admin/season-ticket-offers');
      setAdminOffers(updated.data || []);
      setAdminSuccess('Ponuky boli úspešne uložené.');
    } catch (err) {
      console.error('Failed to save offers:', err);
      setAdminError('Nepodarilo sa uložiť ponuky.');
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

    return count === 1
      ? t.seasonTicketsPage.entriesLabel.one
      : t.seasonTicketsPage.entriesLabel.many;
  };

  const selectedProduct = seasonTicketProducts.find(
    (product) => product.id === parseInt(selectedProductId, 10)
  );
  const trainingTypesLabel = selectedProduct?.trainingTypes?.length
    ? selectedProduct.trainingTypes.join(', ')
    : '';

  return (
    <motion.section 
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      className="py-12 md:py-16 container-custom max-w-6xl mx-auto px-4 sm:px-6 relative"
    >
      <div className="w-full">

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-foreground mb-4 tracking-tight">
            {t?.seasonTicketsPage?.title || 'Permanentky'}
          </h1>
          <p className="text-base sm:text-lg text-neutral-500 max-w-2xl mx-auto font-medium">
            {t?.seasonTicketsPage?.subtitle || 'Ušetrite s našimi výhodnými balíčkami vstupov'}
          </p>
        </div>

        {/* Age Group Toggle (App-like Switch) */}
        <div className="flex justify-center mb-10">
          <div className="bg-neutral-100 rounded-full p-1.5 flex shadow-2xs relative">
            <motion.div
              className="absolute top-1.5 bottom-1.5 bg-white rounded-full shadow-sm"
              animate={{
                left: ageGroup === 'child' ? '6px' : '50%',
                right: ageGroup === 'child' ? '50%' : '6px',
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
            <button
              type="button"
              className={`relative z-10 px-6 py-2.5 rounded-full font-bold text-sm transition-colors duration-200 ${
                ageGroup === 'child'
                  ? 'text-primary'
                  : 'text-neutral-500 hover:text-neutral-700'
              }`}
              onClick={() => {
                setAgeGroup('child');
                setSelectedProductId('');
              }}
            >
              Pre deti
            </button>
            <button
              type="button"
              className={`relative z-10 px-6 py-2.5 rounded-full font-bold text-sm transition-colors duration-200 ${
                ageGroup === 'adult'
                  ? 'text-primary'
                  : 'text-neutral-500 hover:text-neutral-700'
              }`}
              onClick={() => {
                setAgeGroup('adult');
                setSelectedProductId('');
              }}
            >
              Pre dospelých
            </button>
          </div>
        </div>

        {/* Filter podľa produktu */}
        <div className="max-w-md mx-auto mb-10 flex flex-col items-center">
          <label className="font-bold text-sm text-neutral-700 mb-2">
            {t?.seasonTicketsPage?.productLabel || 'Vyberte produkt'}
          </label>
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="w-full text-base py-3 rounded-xl border-neutral-200 bg-white font-medium focus:ring-2 focus:ring-primary focus:border-primary shadow-sm"
            disabled={productsLoading}
          >
            <option value="">{t?.seasonTicketsPage?.productPlaceholder || 'Vyberte produkt...'}</option>
            {filteredProducts.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
        </div>

        {/* ADMIN PANEL - Accordion Design */}
        {isAdmin && (
          <div className="max-w-6xl mx-auto mb-12 bg-white rounded-[2rem] border border-emerald-200 shadow-sm overflow-hidden">
            <button 
              onClick={() => setIsAdminOpen(!isAdminOpen)}
              className="w-full flex items-center justify-between p-6 bg-emerald-50/50 hover:bg-emerald-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <Settings className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-extrabold text-emerald-900 m-0">Admin panel – Permanentky</h3>
              </div>
              <motion.div
                animate={{ rotate: isAdminOpen ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <ChevronDown className="w-6 h-6 text-emerald-600" />
              </motion.div>
            </button>

            <AnimatePresence>
              {isAdminOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="p-6 border-t border-emerald-100 grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Create Product */}
                    <div className="bg-neutral-50 p-6 rounded-2xl border border-neutral-200">
                      <h4 className="text-base font-extrabold text-foreground mb-5 flex items-center gap-2">
                        <Plus className="w-5 h-5 text-emerald-500" />
                        Vytvoriť produkt
                      </h4>

                      <div className="space-y-5">
                        <div>
                          <label className="block text-xs font-bold text-neutral-700 mb-1.5">Kód (Code)</label>
                          <input
                            type="text"
                            value={adminCreateForm.code}
                            onChange={(e) => handleAdminCreateChange('code', e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                            placeholder="Napr. COMBO_MINI"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-neutral-700 mb-1.5">Názov</label>
                          <input
                            type="text"
                            value={adminCreateForm.name}
                            onChange={(e) => handleAdminCreateChange('name', e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                            placeholder="Kombinácia MINI + MIDI"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-neutral-700 mb-1.5">Popis</label>
                          <textarea
                            value={adminCreateForm.description}
                            onChange={(e) => handleAdminCreateChange('description', e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                            rows={3}
                            placeholder="Popis permanentky..."
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-neutral-700 mb-3">Typy tréningov</label>
                          {(() => {
                            const childTypes = adminTrainingTypes.filter(t => t.audience_type === 'children');
                            const adultTypes = adminTrainingTypes.filter(t => t.audience_type === 'adults');
                            const bothTypes = adminTrainingTypes.filter(t => t.audience_type === 'both' || !t.audience_type);
                            
                            const hasChildSelected = adminCreateForm.trainingTypeIds.some(id => childTypes.some(t => t.id === id));
                            const hasAdultSelected = adminCreateForm.trainingTypeIds.some(id => adultTypes.some(t => t.id === id));
                            
                            return (
                              <div className="space-y-3">
                                {childTypes.length > 0 && (
                                  <div className="bg-sky-50 p-4 rounded-xl border border-sky-100">
                                    <h5 className="text-xs font-bold text-sky-800 mb-3 uppercase tracking-wider">Pre deti</h5>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      {childTypes.map((type) => (
                                        <label key={type.id} className={`flex items-center gap-2 text-sm font-medium ${hasAdultSelected ? 'text-neutral-400 opacity-50' : 'text-neutral-700 cursor-pointer'}`}>
                                          <input
                                            type="checkbox"
                                            checked={adminCreateForm.trainingTypeIds.includes(type.id)}
                                            onChange={() => handleAdminTrainingTypeToggle(type.id)}
                                            disabled={hasAdultSelected}
                                            className="rounded border-sky-300 text-sky-600 focus:ring-sky-500"
                                          />
                                          {type.name}
                                        </label>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                
                                {adultTypes.length > 0 && (
                                  <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                                    <h5 className="text-xs font-bold text-emerald-800 mb-3 uppercase tracking-wider">Pre dospelých</h5>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      {adultTypes.map((type) => (
                                        <label key={type.id} className={`flex items-center gap-2 text-sm font-medium ${hasChildSelected ? 'text-neutral-400 opacity-50' : 'text-neutral-700 cursor-pointer'}`}>
                                          <input
                                            type="checkbox"
                                            checked={adminCreateForm.trainingTypeIds.includes(type.id)}
                                            onChange={() => handleAdminTrainingTypeToggle(type.id)}
                                            disabled={hasChildSelected}
                                            className="rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                                          />
                                          {type.name}
                                        </label>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-neutral-700 mb-3">Ponuky (Cena pre daný počet vstupov)</label>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {adminCreateForm.offers.map((offer) => (
                              <div key={offer.entries} className="bg-white p-4 border border-neutral-200 rounded-xl text-center shadow-sm">
                                <div className="text-xs font-extrabold text-neutral-500 mb-2 uppercase">{offer.entries} vstupov</div>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm font-medium">€</span>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={offer.price}
                                    onChange={(e) => handleAdminCreateOfferChange(offer.entries, e.target.value)}
                                    className="w-full pl-7 pr-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                                    placeholder="0.00"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <button
                          onClick={handleAdminCreateProduct}
                          disabled={adminSaving}
                          className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-all shadow-sm disabled:opacity-50"
                        >
                          {adminSaving ? 'Ukladám...' : 'Vytvoriť produkt'}
                        </button>
                      </div>
                    </div>

                    {/* Manage Offers */}
                    <div className="bg-neutral-50 p-6 rounded-2xl border border-neutral-200 h-fit">
                      <h4 className="text-base font-extrabold text-foreground mb-5 flex items-center gap-2">
                        <Settings className="w-5 h-5 text-emerald-500" />
                        Upraviť ponuky
                      </h4>

                      <div className="mb-6">
                        <label className="block text-xs font-bold text-neutral-700 mb-1.5">Zvoľte produkt na úpravu</label>
                        <select
                          value={adminSelectedProductId}
                          onChange={(e) => setAdminSelectedProductId(e.target.value)}
                          className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                        >
                          <option value="">Vyberte produkt...</option>
                          {adminProducts.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {adminSelectedProductId ? (
                        <div className="space-y-3">
                          {adminOffersForm.map((offer) => (
                            <div key={offer.entries} className="flex items-center gap-4 bg-white p-4 border border-neutral-200 rounded-xl shadow-sm">
                              <div className="w-20 text-sm font-extrabold text-neutral-700">{offer.entries} vstupov</div>
                              
                              <div className="relative flex-1">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">€</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={offer.price}
                                  onChange={(e) => handleAdminOfferChange(offer.entries, 'price', e.target.value)}
                                  className="w-full pl-7 pr-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                                />
                              </div>

                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={offer.active}
                                  onChange={(e) => handleAdminOfferChange(offer.entries, 'active', e.target.checked)}
                                  className="w-4 h-4 rounded border-neutral-300 text-emerald-600 focus:ring-emerald-500"
                                />
                                <span className="text-xs font-bold text-neutral-500 uppercase">Aktívne</span>
                              </label>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-neutral-500 text-center py-8">Vyberte produkt z menu vyššie.</div>
                      )}

                      <button
                        onClick={handleAdminSaveOffers}
                        disabled={adminSaving || !adminSelectedProductId}
                        className="mt-6 w-full py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-all shadow-sm disabled:opacity-50"
                      >
                        {adminSaving ? 'Ukladám...' : 'Uložiť zmeny'}
                      </button>
                    </div>

                  </div>
                  
                  {/* Status Messages */}
                  {(adminError || adminSuccess) && (
                    <div className="px-6 pb-6">
                      {adminError && (
                        <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 text-sm font-bold flex items-center gap-2">
                          <AlertCircle className="w-5 h-5" /> {adminError}
                        </div>
                      )}
                      {adminSuccess && (
                        <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl border border-emerald-200 text-sm font-bold flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5" /> {adminSuccess}
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Grid Kariet - Pricing Options */}
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto"
        >
          {!selectedProductId ? (
             <motion.div variants={cardVariant} className="col-span-full text-center py-12">
               <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                 <Ticket className="w-8 h-8 text-neutral-400" />
               </div>
               <p className="text-lg font-bold text-neutral-500">
                 {t?.seasonTicketsPage?.productHint || 'Najprv vyberte produkt permanentky z menu vyššie.'}
               </p>
             </motion.div>
          ) : offersLoading ? (
            <motion.div variants={cardVariant} className="col-span-full text-center py-12">
              <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-neutral-500 font-medium">
                {t?.seasonTicketsPage?.loadingOffers || 'Načítavam ponuky...'}
              </p>
            </motion.div>
          ) : seasonTicketOffers.length === 0 ? (
            <motion.div variants={cardVariant} className="col-span-full text-center py-12">
               <p className="text-lg font-bold text-neutral-500">
                 {t?.seasonTicketsPage?.noOffers || 'Tento produkt momentálne nemá dostupné cenové ponuky.'}
               </p>
            </motion.div>
          ) : (
            seasonTicketOffers.map((ticket) => {
              const isPopular = ticket.entries === 5;
              
                return (
                  <motion.div
                    variants={cardVariant}
                    key={ticket.id}
                    className={
                      'relative flex flex-col p-6 bg-white rounded-[2rem] border border-neutral-200 shadow-sm hover:shadow-lg transition-all duration-300'
                  }>
                  {/* Odznak Najobľúbenejšie */}
                  {isPopular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-gradient-to-r from-emerald-500 to-emerald-400 text-white text-[10px] font-extrabold px-4 py-1.5 uppercase tracking-widest rounded-full shadow-md flex items-center gap-1.5">
                        <Crown className="w-3.5 h-3.5" />
                        {t?.seasonTicketsPage?.mostPopular || 'Najobľúbenejšie'}
                      </span>
                    </div>
                  )}

                  <div className="flex-1 flex flex-col items-center text-center">
                    <span className="inline-block px-4 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest mb-6 bg-neutral-100 text-neutral-500">
                      {t?.seasonTicketsPage?.tagLabel || 'Balíček'}
                    </span>

                    {/* Vstupy */}
                    <div className="mb-2">
                      <h3 className="text-5xl font-black text-foreground tracking-tighter mb-1">
                        {ticket.entries}
                      </h3>
                      <span className="text-sm font-bold text-neutral-400 uppercase tracking-widest">
                        {language === 'sk'
                          ? (ticket.entries === 1 ? 'vstup' : (ticket.entries >= 2 && ticket.entries <= 4 ? 'vstupy' : t?.seasonTicketsPage?.entries || 'vstupov'))
                          : (ticket.entries === 1 ? 'Entry' : t?.seasonTicketsPage?.entries || 'Entries')
                        }
                      </span>
                    </div>

                    {/* Cena */}
                      <div className="mb-6 w-full border-t border-b border-neutral-100 py-4 mt-6">
                      <div className="flex justify-center items-start">
                        <span className="text-xl font-bold text-neutral-400 mt-1 mr-1">€</span>
                        <span className="text-4xl font-black text-primary">
                          {parseFloat(ticket.price).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Vlastnosti */}
                    <ul className="text-sm space-y-4 mb-10 w-full text-left px-2">
                      <li className="flex items-start gap-3">
                        <div className="mt-0.5 p-1 rounded-full flex-shrink-0 bg-primary/10 text-primary">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-extrabold text-foreground block">
                            {t?.seasonTicketsPage?.validity || 'Platnosť: 6 mesiacov'}
                          </span>
                          <span className="text-xs font-medium text-neutral-500">
                            {t?.seasonTicketsPage?.validityNote || 'od dňa zakúpenia'}
                          </span>
                        </div>
                      </li>

                      <li className="flex items-start gap-3">
                        <div className="mt-0.5 p-1 rounded-full flex-shrink-0 bg-primary/10 text-primary">
                          <Ticket className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-extrabold text-foreground block mb-1">
                            {t?.seasonTicketsPage?.restrictionLabel || 'Platí pre:'}
                          </span>
                          <span className="text-xs font-bold text-neutral-600 leading-tight block">
                            {trainingTypesLabel || '—'}
                          </span>
                        </div>
                      </li>
                    </ul>

                    {/* Tlačidlo */}
                    <div className="mt-auto w-full">
                      <button
                        onClick={() => handleBuyClick(ticket)}
                        className="w-full py-3 px-6 rounded-full font-extrabold text-white transition-all duration-300 shadow-md flex items-center justify-center gap-2 bg-primary hover:bg-primary-600"
                      >
                        <CreditCard className="w-4 h-4" />
                        {t?.seasonTicketsPage?.buyButton || 'Kúpiť permanentku'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </motion.div>
      </div>

      {/* MODAL WINDOW - Potvrdenie nákupu */}
      <AnimatePresence>
        {showConfirmModal && ticketToBuy && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              variants={modalVariant}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden border border-neutral-200"
            >
              <div className="px-6 py-5 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
                <h3 className="font-extrabold text-lg text-foreground m-0 flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-primary" />
                  {t?.seasonTicketsPage?.buyButton || 'Kúpiť permanentku'}
                </h3>
                <button 
                  onClick={closeConfirmModal} 
                  className="w-8 h-8 rounded-full bg-neutral-200/50 flex items-center justify-center text-neutral-500 hover:bg-neutral-200 hover:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-8 pb-4 text-center">
                <div className="inline-flex flex-col items-center justify-center bg-neutral-50 px-8 py-6 rounded-3xl border border-neutral-100 mb-6 w-full">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-3xl font-black text-neutral-800">
                      {ticketToBuy.entries}
                    </span>
                    <span className="text-lg font-bold text-neutral-500 uppercase tracking-widest mt-1">
                      {getEntriesLabel(ticketToBuy.entries)}
                    </span>
                  </div>
                  <div className="text-5xl font-black text-primary mb-1">
                    {ticketToBuy.price} €
                  </div>
                </div>

                <div className="text-sm font-medium text-neutral-500 mb-2">
                  {t?.seasonTicketsPage?.validFor || 'Platí pre'}
                </div>
                <div className="font-bold text-foreground mb-6">
                  {trainingTypesLabel || '—'}
                </div>
              </div>

              <div className="px-8 pb-8">
                {error && (
                  <div className="mb-6 p-4 bg-red-50 text-red-700 text-sm font-bold rounded-2xl border border-red-200 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-4 mb-8 bg-neutral-50 p-5 rounded-2xl border border-neutral-100">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={serviceConsent}
                      onChange={(e) => setServiceConsent(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded border-neutral-300 text-primary focus:ring-primary flex-shrink-0 transition-all"
                    />
                    <span className="text-xs text-neutral-600 font-bold leading-relaxed group-hover:text-neutral-800 transition-colors">
                      Súhlasím so{' '}
                      <button
                        type="button"
                        onClick={() => setShowServiceConsentModal(true)}
                        className="text-primary hover:text-primary-600 underline"
                      >
                        začatím poskytovania služby
                      </button>
                      {' '}pred uplynutím lehoty na odstúpenie od zmluvy. <span className="text-red-500">(povinné)</span>
                    </span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={agreementChecked}
                      onChange={(e) => setAgreementChecked(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded border-neutral-300 text-primary focus:ring-primary flex-shrink-0 transition-all"
                    />
                    <span className="text-xs text-neutral-600 font-bold leading-relaxed group-hover:text-neutral-800 transition-colors">
                      Vyjadrujem súhlas so{' '}
                      <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary-600 underline">
                        Všeobecnými obchodnými podmienkami
                      </a>
                      {' '}a beriem na vedomie, že Informáciu o spracúvaní osobných údajov nájdem{' '}
                      <a href="/gdpr" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary-600 underline">
                        TU
                      </a>.
                      {' '}<span className="text-red-500">(povinné)</span>
                    </span>
                  </label>
                </div>

                <button
                  onClick={executePayment}
                  disabled={loading || !agreementChecked || !serviceConsent}
                  className="w-full py-4 px-6 rounded-full font-extrabold text-white transition-all shadow-md flex justify-center items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-600 hover:to-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {t?.seasonTicketsPage?.processing || 'Spracovávam...'}
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      {t?.seasonTicketsPage?.buyButton || 'Zaplatiť a získať permanentku'}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SERVICE CONSENT MODAL */}
      <AnimatePresence>
        {showServiceConsentModal && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              variants={modalVariant}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden border border-neutral-200"
            >
              <div className="px-6 sm:px-8 py-5 border-b border-neutral-100 flex justify-between items-center bg-white shrink-0">
                <h2 className="text-xl font-extrabold text-foreground m-0">
                  Súhlas so začatím poskytovania služby
                </h2>
                <button
                  onClick={closeServiceConsentModal}
                  className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 hover:bg-neutral-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-6 sm:px-8 py-6 text-neutral-600 leading-relaxed text-sm font-medium overflow-y-auto">
                <p>
                  Podľa zákona č. 108/2024 Z.z. o ochrane spotrebiteľa týmto žiadam a udeľujem prevádzkovateľovi Nitráčik, o.z., IČO: 56374453 výslovný súhlas so začatím poskytovania služby pred uplynutím lehoty na odstúpenie od zmluvy a súčasne vyhlasujem, že som bol riadne poučený, že udelením tohto súhlasu strácam ako spotrebiteľ právo na odstúpenie od zmluvy po úplnom poskytnutí služby podľa § 19 ods. 1 písm. a) zákona č. 108/2024 Z.z. o ochrane spotrebiteľa v platnom znení.
                </p>
              </div>

              <div className="border-t border-neutral-100 px-6 sm:px-8 py-5 bg-neutral-50 flex justify-end shrink-0">
                <button
                  onClick={closeServiceConsentModal}
                  className="px-6 py-2.5 bg-primary text-white rounded-full font-bold text-sm shadow-sm hover:bg-primary-600 transition-all"
                >
                  Rozumiem
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.section>
  );
};

export default SeasonTickets;