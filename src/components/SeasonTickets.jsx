import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { useTranslation } from '../contexts/LanguageContext';
import api from '../api/api';
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

const FlakPink = ({ className, style }) => (
  <svg viewBox="0 0 170.079 170.658" xmlns="http://www.w3.org/2000/svg" className={className} style={style} aria-hidden="true">
    <path transform="matrix(1,0,0,-1,102.0004,33.3618)" fill="#F4A5A5" d="M0 0C-.049 .001-.084 .006-.122 .01-.182 .023-.241 .037-.301 .049-.28 .054-.187 .045 0 0M19.592-55.855C20.281-56.109 20.126-56.34 19.592-55.855M59.411-29.461C57.428-26.123 53.616-24.284 50.208-22.771 45.813-20.82 41.283-19.202 36.756-17.587 34.934-16.937 33.322-16.418 31.946-15.898 33.149-13.263 34.563-10.35 35.803-7.743 38.635-1.79 44.262 6.585 43.568 13.498L43.497 13.469C43.477 15.353 42.864 17.163 41.371 18.802 37.474 23.079 28.987 20.373 28.555 14.604 28.445 14.402 28.336 14.198 28.223 14.009 27.353 12.55 26.389 11.142 25.433 9.738 23.773 7.298 22.062 4.894 20.341 2.496 17.561 3.718 13.969 3.659 11.099 3.032 9.233 2.625 7.411 2.02 5.587 1.448 4.969 4.959 2.515 8.404-1.587 7.855-4.99 7.4-8.385 6.912-11.775 6.385-12.271 11.193-13.235 15.956-14.62 20.562-16.34 26.288-22.863 27.479-27.155 23.872-29.653 21.772-31.991 19.435-34.568 17.453-34.618 17.567-34.663 17.681-34.714 17.794-38.307 25.869-50.188 19.92-48.422 12.015-47.755 9.033-46.907 6.076-45.887 3.176-46.502 3.008-47.126 2.762-47.758 2.406-57.967-3.36-68.755-7.401-80.21-9.896-84.776-10.891-86.216-14.818-85.362-18.369-86.023-18.416-86.685-18.451-87.347-18.501-96.907-19.233-97.085-33.067-87.347-33.501-81.613-33.757-75.879-34.013-70.144-34.269-70.426-35.257-70.513-36.288-70.372-37.299-71.676-36.835-73.11-36.745-74.61-37.174-77.526-38.008-80.49-41.163-80.116-44.406-79.648-48.474-77.55-52.006-74.602-54.375-73.368-56.077-72.13-57.775-70.894-59.475-73.925-59.862-76.894-62.027-77.429-64.966-77.515-65.437-77.579-65.903-77.632-66.367-77.665-66.302-77.709-66.233-77.74-66.169-77.842-65.96-78.057-65.256-78.171-64.792-78.171-64.779-78.171-64.766-78.17-64.753-78.013-65.121-77.933-63.415-78.146-64.399-76.112-55.002-90.455-50.97-92.61-60.411-94.585-69.06-90.861-78.252-87.146-85.912-83.522-93.383-78.368-102.026-71.043-106.413-70.899-106.499-70.752-106.575-70.607-106.655-71.385-107.292-72.087-107.977-72.681-108.716-75.51-112.236-75.857-118.087-71.163-120.496-66.359-122.962-59.616-121.749-53.963-118.957-52.734-120.363-51.239-121.576-49.448-122.532-45.554-124.61-40.944-124.631-36.98-122.994-32.924-124.98-28.867-126.966-24.81-128.953-21.445-130.6-16.346-130.152-14.549-126.262-12.801-122.479-12.278-118.361-12.835-114.457-12.433-114.495-12.031-114.533-11.629-114.57-7.965-114.914-4.666-111.455-4.263-108.067-4.142-107.049-4.209-106.096-4.432-105.218-3.22-104.77-2.05-104.177-.94-103.467 1.423-105.279 3.805-107.066 6.221-108.806 12.385-113.244 19.072-118.602 26.383-121.019 31.118-122.584 36.677-121.152 38.264-115.886 39.425-112.034 37.477-108.294 35.327-105.21 31.237-99.345 26.243-94.192 21.555-88.821 21.454-88.705 21.354-88.587 21.253-88.471 25.425-87.677 28.671-85.208 31.348-81.712 33.784-78.532 31.874-73.606 28.881-71.604 29.147-71.392 29.404-71.181 29.645-70.975 34.107-67.15 37.25-61.703 36.609-55.69 35.893-48.969 30.618-45.112 25.644-41.229 34.669-43.988 45.652-46.496 54.535-42.159 59.491-39.739 62.499-34.66 59.411-29.461" />
  </svg>
);

const FlakCream = ({ className, style }) => (
  <svg viewBox="0 0 170.079 186.77" xmlns="http://www.w3.org/2000/svg" className={className} style={style} aria-hidden="true">
    <path transform="matrix(1,0,0,-1,48.2144,165.57071)" fill="#EFE4C8" d="M0 0C-.168-.194-.238-.269 0 0M-26.05 53.518C-26.131 53.517-26.214 53.524-26.295 53.521-26.528 53.513-26.826 53.628-27.052 53.58-26.742 53.646-26.402 53.614-26.05 53.518M-21.47 47.527C-21.498 47.541-21.521 47.552-21.534 47.559-21.638 47.617-21.705 47.635-21.758 47.641-21.758 47.645-21.757 47.646-21.757 47.65-21.734 48.081-21.613 47.898-21.47 47.527M110.15 62.303C107.116 63.184 104.727 64.781 102.823 66.842 103.529 68.373 103.864 69.987 103.89 71.627 107.735 73.614 110.494 77.248 110.025 82.154 109.638 86.21 106.903 89.629 102.525 89.654 100.286 89.667 98.047 89.68 95.808 89.693 95.791 89.776 95.772 89.859 95.755 89.942 96.096 90.51 96.433 91.081 96.746 91.661 102.128 101.644 101.602 115.764 91.484 122.235 87.426 127.948 80.504 130.605 73.631 130.344 71.238 131.943 68.231 132.319 65.794 131.33 65.44 132.156 65.044 132.975 64.57 133.777 62.624 137.073 59.423 137.949 56.571 137.17 53.53 142.418 50.094 147.541 46.219 152.177 44.129 154.678 41.587 157.301 38.336 158.187 33.582 159.483 29.055 156.611 27.626 152.049 25.506 145.277 27.868 136.599 29.08 129.88 29.306 128.625 29.59 127.328 29.898 126.01 29.882 125.982 29.865 125.955 29.849 125.928 28.135 124.055 26.418 122.185 24.71 120.308 23.918 119.437 22.939 118.469 21.906 117.431 21.381 117.615 20.844 117.777 20.293 117.908 16.407 124.779 12.204 132.099 11.117 139.561 10.307 145.122 2.057 146.775-1.419 142.871-7.775 135.73-6.737 125.805-4.314 117.219-4.223 116.895-4.111 116.574-4.015 116.251-7.819 115.72-11.541 114.236-14.5 111.961-21.762 114.214-29.373 114.816-36.422 113.282-43.959 111.641-43.148 100.885-36.422 98.818-29.578 96.714-23.759 92.901-18.416 88.34-20.759 88.357-23.047 87.64-24.772 85.878-28.055 82.525-27.219 78.105-25.606 74.209-22.098 65.735-14.95 59.381-7.67 54.053-10.925 53.889-14.181 53.732-17.439 53.612-19.622 53.532-21.81 53.451-23.995 53.466-24.472 53.469-24.953 53.493-25.433 53.509-29.306 54.641-34.412 52.786-35.444 48.477-37.939 38.061-28.156 33.128-19.643 31.287-12.564 29.757-5.314 29.111 1.923 28.51 .46 22.217-.966 15.912-2.183 9.568-3.345 3.505-4.649-2.693-3.781-8.86-3.037-14.148 3.398-15.053 7.236-13.342 12.229-11.117 15.582-4.028 18.151 .638 18.69-.342 19.373-1.294 20.226-2.201 25.939-8.272 35.783-8.166 42.419-3.696 46.618-.867 48.926 3.22 50.119 7.756 57.704 3.858 66.779 2.626 74.906 4.709 80.686 6.19 88.654 10.306 92.058 15.338 97.075 22.757 91.471 28.464 84.373 30.439 84.335 30.449 84.258 30.473 84.159 30.504 85.116 32.223 85.851 34.067 86.308 35.971 87.099 39.259 87.17 43.268 86.072 46.52 86.044 46.603 86.006 46.683 85.976 46.765 86.932 46.624 87.894 46.427 88.868 46.138 91.649 45.314 94.118 46.242 95.839 47.967 97.975 47.722 99.924 48.397 101.384 49.651 102.872 48.948 104.456 48.334 106.162 47.839 115.451 45.143 119.417 59.614 110.15 62.303" />
  </svg>
);

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);
const ENTRY_OPTIONS = [3, 5, 10];

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
    <div className="relative w-full bg-white">
    <section className="py-12 md:py-16 container-custom max-w-6xl mx-auto px-4 sm:px-6 relative">
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

        {/* Age Group Toggle */}
        <div className="flex justify-center mb-10">
          <div className="relative bg-neutral-100 rounded-full p-1.5 flex shadow-2xs">
            <div
              className="absolute top-1.5 bottom-1.5 rounded-full bg-white shadow-sm"
              style={{
                width: 'calc(50% - 6px)',
                transition: 'transform 0.2s ease',
                transform: ageGroup === 'child' ? 'translateX(0)' : 'translateX(100%)',
              }}
            />
            <button
              type="button"
              className={`relative z-10 flex-1 flex items-center justify-center px-6 py-2.5 rounded-full font-bold text-sm transition-colors duration-200 ${
                ageGroup === 'child' ? 'text-primary' : 'text-neutral-500 hover:text-neutral-700'
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
              className={`relative z-10 flex-1 flex items-center justify-center px-6 py-2.5 rounded-full font-bold text-sm transition-colors duration-200 ${
                ageGroup === 'adult' ? 'text-primary' : 'text-neutral-500 hover:text-neutral-700'
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
          <div className="max-w-6xl mx-auto mb-12 bg-white card-glass border-2 border-neutral-300 rounded-[2rem] shadow-md overflow-hidden relative" style={{ isolation: 'isolate' }}>
            <FlakPink className="absolute pointer-events-none" style={{ width: 195, top: 10, right: -22, opacity: 0.32, zIndex: -1, transform: 'rotate(20deg)' }} />
            <FlakCream className="absolute pointer-events-none" style={{ width: 175, bottom: 10, left: -18, opacity: 0.30, zIndex: -1, transform: 'rotate(-25deg)' }} />
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
              <div>
                <ChevronDown className="w-6 h-6 text-emerald-600" />
              </div>
            </button>

            {isAdminOpen && (
                <div className="overflow-hidden">
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
                </div>
              )}
          </div>
        )}

        {/* Grid Kariet - Pricing Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {!selectedProductId ? (
             <div className="col-span-full text-center py-12">
               <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                 <Ticket className="w-8 h-8 text-neutral-400" />
               </div>
               <p className="text-lg font-bold text-neutral-500">
                 {t?.seasonTicketsPage?.productHint || 'Najprv vyberte produkt permanentky z menu vyššie.'}
               </p>
             </div>
          ) : offersLoading ? (
            <div className="col-span-full text-center py-12">
              <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-neutral-500 font-medium">
                {t?.seasonTicketsPage?.loadingOffers || 'Načítavam ponuky...'}
              </p>
            </div>
          ) : seasonTicketOffers.length === 0 ? (
            <div className="col-span-full text-center py-12">
               <p className="text-lg font-bold text-neutral-500">
                 {t?.seasonTicketsPage?.noOffers || 'Tento produkt momentálne nemá dostupné cenové ponuky.'}
               </p>
            </div>
          ) : (
            seasonTicketOffers.map((ticket) => {
              const isPopular = ticket.entries === 5;
              
                return (
                  <div
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
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* MODAL WINDOW - Potvrdenie nákupu */}
        {showConfirmModal && ticketToBuy && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-[1.5rem] sm:rounded-[2rem] shadow-2xl w-full max-w-md max-h-[95vh] sm:max-h-[90vh] overflow-hidden border border-neutral-200 flex flex-col">
              <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50 shrink-0">
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

              <div className="p-4 sm:p-8 pb-4 text-center overflow-y-auto">
                <div className="inline-flex flex-col items-center justify-center bg-neutral-50 px-4 sm:px-8 py-4 sm:py-6 rounded-2xl sm:rounded-3xl border border-neutral-100 mb-4 sm:mb-6 w-full">
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

              <div className="px-4 sm:px-8 pb-4 sm:pb-8">
                {error && (
                  <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 text-red-700 text-sm font-bold rounded-2xl border border-red-200 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-8 bg-neutral-50 p-3 sm:p-5 rounded-2xl border border-neutral-100">
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
                  className="w-full py-3 sm:py-4 px-4 sm:px-6 rounded-full font-extrabold text-white transition-all shadow-md flex justify-center items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-600 hover:to-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
            </div>
          </div>
        )}

      {/* SERVICE CONSENT MODAL */}
        {showServiceConsentModal && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-2 sm:p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-[1.5rem] sm:rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[95vh] sm:max-h-[85vh] flex flex-col overflow-hidden border border-neutral-200">
              <div className="px-4 sm:px-8 py-4 sm:py-5 border-b border-neutral-100 flex justify-between items-center bg-white shrink-0">
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

              <div className="px-4 sm:px-8 py-4 sm:py-6 text-neutral-600 leading-relaxed text-sm font-medium overflow-y-auto">
                <p>
                  Podľa zákona č. 108/2024 Z.z. o ochrane spotrebiteľa týmto žiadam a udeľujem prevádzkovateľovi Nitráčik, o.z., IČO: 56374453 výslovný súhlas so začatím poskytovania služby pred uplynutím lehoty na odstúpenie od zmluvy a súčasne vyhlasujem, že som bol riadne poučený, že udelením tohto súhlasu strácam ako spotrebiteľ právo na odstúpenie od zmluvy po úplnom poskytnutí služby podľa § 19 ods. 1 písm. a) zákona č. 108/2024 Z.z. o ochrane spotrebiteľa v platnom znení.
                </p>
              </div>

              <div className="border-t border-neutral-100 px-4 sm:px-8 py-4 sm:py-5 bg-neutral-50 flex justify-end shrink-0">
                <button
                  onClick={closeServiceConsentModal}
                  className="px-6 py-2.5 bg-primary text-white rounded-full font-bold text-sm shadow-sm hover:bg-primary-600 transition-all"
                >
                  Rozumiem
                </button>
              </div>
            </div>
          </div>
        )}
    </section>
    </div>
  );
};

export default SeasonTickets;