// GiftCard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, useSearchParams, Link } from 'react-router-dom';
import { Spinner } from 'react-bootstrap';
import { loadStripe } from '@stripe/stripe-js';
import {
  Gift,
  CreditCard,
  CheckCircle2,
  Copy,
  Check,
  ChevronDown,
  AlertCircle,
  ArrowLeft,
  Calendar,
  Eye,
  X,
  Download
} from 'lucide-react';
import api from '../api/api';
import GiftCertificate from '../components/GiftCertificate';
import mascotImage from '../assets/logo_bez.PNG';
import nitracikLogo from '../assets/nitracik_svg2.svg';

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

const AMOUNTS = [
  { value: 15, tagline: 'Skúšobná hodina', popular: false },
  { value: 30, tagline: 'Obľúbená voľba', popular: true },
  { value: 50, tagline: 'Rodinný zážitok', popular: false },
  { value: 100, tagline: 'Prémiový darček', popular: false },
];

const GiftCard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // ── Purchase form state ──
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [recipientName, setRecipientName] = useState('');
  const [message, setMessage] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [tocAccepted, setTocAccepted] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);

  // ── Success screen state ──
  const [successData, setSuccessData] = useState(null);
  const [successLoading, setSuccessLoading] = useState(true);
  const [successError, setSuccessError] = useState('');
  const [copied, setCopied] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState('');

  const isSuccessRoute = location.pathname === '/gift-card/success';

  // ── On mount: check auth ──
  useEffect(() => {
    const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const userId = localStorage.getItem('userId');
    setIsLoggedIn(loggedIn);

    if (loggedIn && userId) {
      const fetchUser = async () => {
        try {
          const response = await api.get(`/api/users/${userId}`);
          setUserData(response.data);
          setBuyerEmail(response.data.email || '');
          setBuyerName(`${response.data.first_name || ''} ${response.data.last_name || ''}`.trim());
        } catch (err) {
          console.error('Error fetching user data:', err);
        }
      };
      fetchUser();
    }
  }, []);

  // ── Success route: fetch gift card data ──
  useEffect(() => {
    if (!isSuccessRoute) return;

    const fetchSuccessData = async () => {
      setSuccessLoading(true);
      setSuccessError('');
      try {
        const sessionId = searchParams.get('session_id');
        if (!sessionId) {
          setSuccessError('Chýbajúci identifikátor platby.');
          setSuccessLoading(false);
          return;
        }
        const response = await api.get(`/api/gift-card-success?session_id=${sessionId}`);
        setSuccessData(response.data);
      } catch (err) {
        setSuccessError(err.response?.data?.error || 'Nepodarilo sa načítať údaje o poukaze.');
      } finally {
        setSuccessLoading(false);
      }
    };

    fetchSuccessData();
  }, [isSuccessRoute, searchParams]);

  // ── Format date as DD.MM.YYYY ──
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  };

  // ── Copy code handler ──
  const handleCopyCode = async () => {
    if (!successData?.code) return;
    try {
      await navigator.clipboard.writeText(successData.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const textArea = document.createElement('textarea');
      textArea.value = successData.code;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // ── Confirm modal: show recap then proceed ──
  const clearValidationError = (field) => {
    setValidationErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();

    const errors = {};
    if (!selectedAmount) errors.amount = true;
    if (!recipientName.trim()) errors.recipientName = true;
    if (!buyerName.trim()) errors.buyerName = true;
    if (!buyerEmail.trim()) errors.buyerEmail = true;
    if (!tocAccepted) errors.tocAccepted = true;

    setValidationErrors(errors);

    if (Object.keys(errors).length === 0) {
      setShowConfirmModal(true);
    }
  };

  // ── Submit handler ──
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/api/create-gift-card-session', {
        amount: selectedAmount,
        buyerEmail,
        buyerName: buyerName.trim(),
        recipientName: recipientName.trim(),
        recipientEmail: recipientEmail.trim() || undefined,
        message: message.trim() || undefined,
        honeypot,
      });

      const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);
      const { error: stripeError } = await stripe.redirectToCheckout({
        sessionId: response.data.sessionId,
      });

      if (stripeError) throw stripeError;
    } catch (err) {
      setError(err.response?.data?.error || 'Nastala chyba, skúste znova');
    } finally {
      setLoading(false);
    }
  };

  // ── Retry success fetch ──
  const handleRetry = () => {
    setSuccessError('');
    setSuccessLoading(true);
    const sessionId = searchParams.get('session_id');
    if (!sessionId) {
      setSuccessError('Chýbajúci identifikátor platby.');
      setSuccessLoading(false);
      return;
    }
    api.get(`/api/gift-card-success?session_id=${sessionId}`)
      .then((res) => setSuccessData(res.data))
      .catch((err) => setSuccessError(err.response?.data?.error || 'Nepodarilo sa načítať údaje o poukaze.'))
      .finally(() => setSuccessLoading(false));
  };

  // ── Download PDF handler ──
  const handleDownloadPdf = async () => {
    if (!successData?.code || pdfLoading) return;
    setPdfLoading(true);
    setPdfError('');
    try {
      // Use axios with responseType blob — baseURL is already correctly set in api.js
      const response = await api.get(
        `/api/gift-cards/${successData.code}/pdf`,
        {
          responseType: 'blob',
          // Override response interceptor for this request to not redirect on error
          validateStatus: (status) => status < 500,
        }
      );

      // Check if response is actually a PDF or an error JSON
      const contentType = response.headers['content-type'] || '';
      console.log('[PDF] Response status:', response.status, 'Content-Type:', contentType, 'Size:', response.data?.size);
      if (!contentType.includes('application/pdf')) {
        // Server returned an error as JSON blob — read it
        const text = await response.data.text();
        let errMsg = `HTTP ${response.status}`;
        try { errMsg = JSON.parse(text).error || errMsg; } catch {}
        throw new Error(errMsg);
      }

      if (!response.data || response.data.size === 0) {
        throw new Error('Prázdny PDF súbor');
      }

      const url = window.URL.createObjectURL(
        new Blob([response.data], { type: 'application/pdf' })
      );
      const link = document.createElement('a');
      link.href = url;
      link.download = 'darcekovy-poukaz-nitracik.pdf';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

    } catch (err) {
      console.error('PDF download failed:', err.message);
      setPdfError('Nepodarilo sa stiahnuť PDF: ' + err.message);
    } finally {
      setPdfLoading(false);
    }
  };

  // ── Render: Success screen ──
  if (isSuccessRoute) {
    return (
      <div className="relative w-full bg-white">
        <section className="py-12 md:py-20 container-custom max-w-4xl mx-auto px-4 sm:px-6 relative">
        {successLoading && (
          <div className="flex flex-col items-center justify-center min-h-[300px] gap-6">
            <img
              src={nitracikLogo}
              alt="Nitráčik"
              className="w-40 sm:w-48 h-auto opacity-90"
            />
            <p className="text-neutral-600 text-sm sm:text-base text-center max-w-md leading-relaxed">
              Váš darčekový poukaz je už na ceste. 😊<br />
              Ostaňte na stránke, chvíľku trpezlivosti…
            </p>
            <Spinner animation="border" variant="warning" />
          </div>
        )}

        {!successLoading && successError && (
          <div
            className="bg-white rounded-[2rem] border-2 border-neutral-300 shadow-md p-8 sm:p-12 text-center"
          >
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-foreground mb-4">Niečo sa pokazilo</h2>
            <p className="text-neutral-600 mb-6">{successError}</p>
            <button
              onClick={handleRetry}
              className="bg-amber-400 hover:bg-amber-500 text-white font-bold rounded-2xl px-8 py-3 transition-colors"
            >
              Skúsiť znova
            </button>
          </div>
        )}

        {!successLoading && !successError && successData && (
          <div
            className="bg-white rounded-[2rem] border-2 border-neutral-300 shadow-md p-6 sm:p-10 text-center">
            
            {/* Success header */}
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center
              justify-center mx-auto mb-4">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-black text-foreground mb-1">Poukaz bol vytvorený! 🎉</h2>
            <p className="text-neutral-500 text-sm mb-6">
              Potvrdenie sme odoslali na váš email spolu s PDF prílohou.
            </p>

            {/* Full certificate visual */}
            <div className="flex-shrink-0 w-full max-w-[760px] mx-auto mb-6">
              <GiftCertificate
                mode="preview"
                amount={successData.amount}
                recipientName={successData.recipientName}
                buyerEmail={successData.buyerName || successData.buyerEmail || ''}
                message={successData.message || ''}
                expiresAt={successData.expiresAt}
                code={successData.code}
                previewClassName="max-w-[760px]"
              />
            </div>

            {/* Copy code row */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <span className="font-mono font-black text-lg text-[#3D3D4E] tracking-widest bg-[#FFFBEB]
                border border-[#F59E0B] rounded-xl px-4 py-2">
                {successData.code}
              </span>
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 text-sm font-bold text-amber-600 hover:text-amber-700
                  bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 transition-colors"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Skopírované' : 'Kopírovať'}
              </button>
            </div>

            {/* Download PDF button */}
            <div className="flex justify-center mb-4">
              <button
                onClick={handleDownloadPdf}
                disabled={pdfLoading}
                className={`flex items-center gap-2 text-sm font-bold rounded-2xl px-5 py-2.5
                  border-2 border-[#F4A5A5] text-[#3D3D4E] hover:bg-[#FDECEA] transition-colors
                  ${pdfLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                {pdfLoading
                  ? <Spinner animation="border" size="sm" />
                  : <Download className="w-4 h-4 text-[#F4A5A5]" />
                }
                {pdfLoading ? 'Generujem PDF...' : 'Stiahnuť poukaz ako PDF'}
              </button>
            </div>

            {pdfError && (
              <p className="text-xs text-red-500 text-center mt-1 mb-3">{pdfError}</p>
            )}

            {/* Info box */}
            <div className="bg-amber-50 rounded-2xl p-4 text-sm text-left mb-6 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-neutral-500">Hodnota poukazu</span>
                <span className="font-bold text-foreground">{successData.amount}€</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Platný do</span>
                <span className="font-bold text-foreground">{formatDate(successData.expiresAt)}</span>
              </div>
              <div className="border-t border-amber-200/60 pt-2 mt-2 text-xs text-amber-800">
                💡 Kód zadajte pri rezervácii na <strong>nitracik.sk/booking</strong>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate('/')}
                className="flex-1 border-2 border-neutral-200 text-foreground font-bold rounded-2xl
                  px-6 py-3 hover:bg-neutral-50 transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Späť na hlavnú
              </button>
              <button
                onClick={() => navigate('/booking')}
                className="flex-1 bg-amber-400 hover:bg-amber-500 text-white font-bold rounded-2xl
                  px-6 py-3 transition-colors flex items-center justify-center gap-2"
              >
                <Calendar className="w-4 h-4" /> Rezervovať teraz
              </button>
            </div>
          </div>
        )}
        </section>
      </div>
    );
  }

  // ── Render: Purchase form ──
  return (
    <div className="relative w-full bg-white">
      <section className="py-12 md:py-20 container-custom max-w-2xl mx-auto px-4 sm:px-6 relative">
        <form onSubmit={handleFormSubmit} noValidate>
        {/* ── CARD 1: Gift card details ── */}
        <div className="relative">
          <img
            src={mascotImage}
            alt=""
            className="absolute -top-10 left-1/2 -translate-x-1/2 w-20 sm:w-24 z-20 pointer-events-none"
            style={{ filter: 'drop-shadow(2px 4px 12px rgba(0,0,0,0.12))' }}
          />
          <div
            className="bg-white card-glass border-2 border-neutral-300 rounded-[2rem] shadow-md p-6 sm:p-8 mb-6 relative overflow-hidden" style={{ isolation: 'isolate' }}
          >
            <FlakPink className="absolute pointer-events-none" style={{ width: 190, top: 10, right: -22, opacity: 0.30, zIndex: -1, transform: 'rotate(20deg)' }} />
            <FlakCream className="absolute pointer-events-none" style={{ width: 175, bottom: 10, left: -18, opacity: 0.28, zIndex: -1, transform: 'rotate(-25deg)' }} />
          {/* Header */}
          <div className="flex flex-col items-center text-center mb-2">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-3">
              <Gift className="w-6 h-6" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-foreground mb-3">
              Darčekový poukaz
            </h2>
          </div>
          <p className="text-neutral-600 text-sm sm:text-base text-center mb-6 font-medium">
            Darujte svojim blízkym nezabudnuteľný zážitok. Darčekový poukaz možno uplatniť na ľubovoľnú aktivitu z našej ponuky — pre deti aj dospelých.
          </p>

          {/* Amount selector - 2x2 grid */}
          <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 ${validationErrors.amount ? 'rounded-2xl border-2 border-red-300 bg-red-50/30 p-3' : ''}`}>
            {AMOUNTS.map((item) => {
              const isSelected = selectedAmount === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => {
                    setSelectedAmount(item.value);
                    clearValidationError('amount');
                  }}
                  className={`
                    relative rounded-2xl border-2 min-h-[100px] flex flex-col items-center justify-center
                    transition-all duration-200 p-3
                    ${isSelected
                      ? 'border-amber-400 bg-amber-50'
                      : 'border-neutral-200 hover:border-amber-200 hover:bg-amber-50/30'
                    }
                  `}
                >
                  {/* Popular badge */}
                  {item.popular && (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-amber-400 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full whitespace-nowrap">
                      Populárne
                    </span>
                  )}

                  {/* Checkmark */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-amber-400 text-white rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3" />
                    </div>
                  )}

                  <span className="text-3xl font-black text-foreground">
                    {item.value}€
                  </span>
                  <span className="text-xs text-neutral-400 mt-1 text-center leading-tight">
                    {item.tagline}
                  </span>
                </button>
              );
            })}
          </div>
          {validationErrors.amount && (
            <p className="text-red-500 text-xs font-semibold -mt-3 mb-4">
              Prosím vyberte sumu poukazu.
            </p>
          )}

          {/* Recipient name */}
          <div className="mb-4">
            <label className="block text-sm font-bold text-neutral-700 mb-1.5">
              Meno obdarovaného <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={recipientName}
              onChange={(e) => {
                setRecipientName(e.target.value);
                if (e.target.value.trim()) clearValidationError('recipientName');
              }}
              placeholder="Meno obdarovaného"
              required
              className={`w-full rounded-2xl border-2 px-4 py-3 text-sm font-medium text-foreground placeholder-neutral-400 focus:outline-none transition-all ${
                validationErrors.recipientName
                  ? 'border-red-400 focus:border-red-400 focus:ring-2 focus:ring-red-100 bg-red-50/40'
                  : 'border-neutral-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100'
              }`}
            />
            {validationErrors.recipientName && (
              <p className="text-red-500 text-xs font-semibold mt-1.5">
                Prosím vyplňte meno obdarovaného.
              </p>
            )}
          </div>

          {/* Message textarea */}
          <div className="mb-4">
            <label className="block text-sm font-bold text-neutral-700 mb-1.5">
              Správa (voliteľné)
            </label>
            <div className="relative">
              <textarea
                value={message}
                onChange={(e) => {
                  if (e.target.value.length <= 200) {
                    setMessage(e.target.value);
                  }
                }}
                placeholder="Napíš pár slov..."
                rows={3}
                maxLength={200}
                className="w-full rounded-2xl border-2 border-neutral-200 px-4 py-3 text-sm font-medium text-foreground placeholder-neutral-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all resize-none"
              />
              <span className="absolute bottom-2 right-3 text-xs text-neutral-400">
                {message.length}/200
              </span>
            </div>
          </div>

          {/* Recipient email */}
          <div>
            <label className="block text-sm font-bold text-neutral-700 mb-1.5">
              Email obdarovaného (voliteľné)
            </label>
            <input
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="email@priklad.sk"
              className="w-full rounded-2xl border-2 border-neutral-200 px-4 py-3 text-sm font-medium text-foreground placeholder-neutral-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
            />
            <p className="text-xs text-neutral-400 mt-1.5">
              Poukaz pošleme aj priamo obdarovanému
            </p>
          </div>

          {/* Honeypot - hidden from users */}
          <input
            type="text"
            name="website"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            style={{ display: 'none' }}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
          />
        </div>
        </div>

        {/* ── CARD 2: Buyer details & payment ── */}
        <div
          className="bg-white card-glass border-2 border-neutral-300 rounded-[2rem] shadow-md p-6 sm:p-8 mb-6 relative overflow-hidden" style={{ isolation: 'isolate' }}
        >
          <FlakCream className="absolute pointer-events-none" style={{ width: 185, top: 10, left: '30%', opacity: 0.30, zIndex: -1, transform: 'rotate(-15deg)' }} />
          <FlakPink className="absolute pointer-events-none" style={{ width: 170, bottom: 10, right: -15, opacity: 0.28, zIndex: -1, transform: 'rotate(35deg)' }} />
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-foreground">
              Vaše údaje a platba
            </h2>
          </div>

          {/* Buyer name */}
          <div className="mb-4">
            <label className="block text-sm font-bold text-neutral-700 mb-1.5">
              Vaše meno <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={buyerName}
              onChange={(e) => {
                setBuyerName(e.target.value);
                if (e.target.value.trim()) clearValidationError('buyerName');
              }}
              placeholder="Vaše meno a priezvisko"
              required
              className={`w-full rounded-2xl border-2 px-4 py-3 text-sm font-medium text-foreground placeholder-neutral-400 focus:outline-none transition-all ${
                validationErrors.buyerName
                  ? 'border-red-400 focus:border-red-400 focus:ring-2 focus:ring-red-100 bg-red-50/40'
                  : 'border-neutral-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100'
              }`}
            />
            {validationErrors.buyerName && (
              <p className="text-red-500 text-xs font-semibold mt-1.5">
                Prosím vyplňte vaše meno.
              </p>
            )}
          </div>

          {/* Logged in: readonly email */}
          {isLoggedIn && userData ? (
            <div className="mb-4">
              <label className="block text-sm font-bold text-neutral-700 mb-1.5">
                Objednávateľ
              </label>
              <div className="w-full rounded-2xl border-2 border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-medium text-neutral-600">
                {buyerEmail}
              </div>
              <p className="text-xs text-amber-600 font-medium mt-1.5">
                Ste prihlásený ako {buyerEmail}
              </p>
            </div>
          ) : (
            /* Guest: email input */
            <div className="mb-4">
              <label className="block text-sm font-bold text-neutral-700 mb-1.5">
                Váš email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={buyerEmail}
                onChange={(e) => {
                  setBuyerEmail(e.target.value);
                  if (e.target.value.trim()) clearValidationError('buyerEmail');
                }}
                placeholder="Váš email"
                required
                className={`w-full rounded-2xl border-2 px-4 py-3 text-sm font-medium text-foreground placeholder-neutral-400 focus:outline-none transition-all ${
                  validationErrors.buyerEmail
                    ? 'border-red-400 focus:border-red-400 focus:ring-2 focus:ring-red-100 bg-red-50/40'
                    : 'border-neutral-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100'
                }`}
              />
              {validationErrors.buyerEmail && (
                <p className="text-red-500 text-xs font-semibold mt-1.5">
                  Prosím zadajte váš email.
                </p>
              )}
            </div>
          )}

          {/* Preview button */}
          <div className="mb-4">
            <button
              type="button"
              onClick={() => setShowPreviewModal(true)}
              className="w-full flex items-center justify-center gap-2 border-2 border-amber-300 text-amber-700 font-bold rounded-2xl px-6 py-3 hover:bg-amber-50 transition-colors"
            >
              <Eye className="w-5 h-5" />
              Pozrieť náhľad
            </button>
          </div>

          {/* VOP checkbox */}
          <div className="mb-6">
            <label className={`flex items-start gap-3 cursor-pointer ${validationErrors.tocAccepted ? 'rounded-2xl border-2 border-red-300 bg-red-50/40 p-3' : ''}`}>
              <input
                type="checkbox"
                checked={tocAccepted}
                onChange={(e) => {
                  setTocAccepted(e.target.checked);
                  if (e.target.checked) clearValidationError('tocAccepted');
                }}
                className="mt-0.5 w-4 h-4 rounded border-neutral-300 text-amber-500 focus:ring-amber-400 focus:ring-2 accent-amber-500"
              />
              <span className="text-sm text-neutral-600 leading-relaxed">
                Súhlasím so{' '}
                <a
                  href="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-600 underline hover:text-amber-700"
                >
                  Všeobecnými obchodnými podmienkami
                </a>
              </span>
            </label>
            {validationErrors.tocAccepted && (
              <p className="text-red-500 text-xs font-semibold mt-1.5">
                Prosím odsúhlaste obchodné podmienky.
              </p>
            )}
          </div>

          {/* Summary box */}
          <div className="bg-amber-50 rounded-2xl p-5 mb-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-neutral-500">Suma poukazu</span>
              <span className="font-bold text-foreground">
                {selectedAmount ? `${selectedAmount}€` : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm mb-3">
              <span className="text-neutral-500">Obdarovaný</span>
              <span className="font-bold text-foreground">
                {recipientName.trim() || '—'}
              </span>
            </div>
            <div className="border-t border-amber-200/60 pt-3 flex items-center justify-between">
              <span className="font-bold text-foreground">Celková cena</span>
              <span className="font-black text-lg text-amber-800">
                {selectedAmount ? `${selectedAmount}€` : '—'}
              </span>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-2xl px-4 py-3 mb-4 text-sm font-medium">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-400 hover:bg-amber-500 text-white font-bold rounded-2xl px-8 py-4 transition-all duration-200 flex items-center justify-center gap-2"
          >
            {loading ? (
              <Spinner animation="border" size="sm" />
            ) : (
              <>
                Zaplatiť kartou
                <ChevronDown className="w-4 h-4 -rotate-90" />
              </>
            )}
          </button>
        </div>
        </form>

      {/* ── Confirmation Modal ── */}
      {showConfirmModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setShowConfirmModal(false)}
        >
          <div
            className="relative bg-white rounded-[2rem] shadow-2xl max-w-md w-full p-6 sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={() => setShowConfirmModal(false)}
              className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-neutral-100 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-black text-foreground mb-6 text-center">
              Skontrolujte údaje ešte raz
            </h3>

            {/* Summary fields */}
            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center py-2 border-b border-neutral-100">
                <span className="text-sm font-bold text-neutral-500 uppercase tracking-wider">OD:</span>
                <span className="text-sm font-bold text-foreground">{buyerName.trim() || '—'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-neutral-100">
                <span className="text-sm font-bold text-neutral-500 uppercase tracking-wider">PRE:</span>
                <span className="text-sm font-bold text-foreground">{recipientName.trim() || '—'}</span>
              </div>
              {message.trim() && (
                <div className="flex justify-between items-center py-2 border-b border-neutral-100">
                  <span className="text-sm font-bold text-neutral-500 uppercase tracking-wider">VENOVANIE:</span>
                  <span className="text-sm italic text-neutral-600 text-right max-w-[200px]">{message.trim()}</span>
                </div>
              )}
              <div className="flex justify-between items-center py-2 border-b border-neutral-100">
                <span className="text-sm font-bold text-neutral-500 uppercase tracking-wider">Mail na zaslanie:</span>
                <span className="text-sm font-bold text-foreground">{buyerEmail}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm font-bold text-neutral-500 uppercase tracking-wider">Suma:</span>
                <span className="text-lg font-black text-amber-600">{selectedAmount}€</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowConfirmModal(false);
                  handleSubmit({ preventDefault: () => {} });
                }}
                disabled={loading}
                className="w-full bg-amber-400 hover:bg-amber-500 text-white font-bold rounded-2xl px-8 py-4 transition-all duration-200 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Spinner animation="border" size="sm" />
                ) : (
                  'Potvrdiť a zaplatiť'
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="w-full border-2 border-neutral-200 text-foreground font-bold rounded-2xl px-8 py-3 hover:bg-neutral-50 transition-colors"
              >
                Späť
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Preview Modal ── */}
      {showPreviewModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-2"
          onClick={() => setShowPreviewModal(false)}
        >
          <div
            className="relative bg-white rounded-[2rem] shadow-2xl max-w-4xl w-full p-3 sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={() => setShowPreviewModal(false)}
              className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-neutral-100 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-foreground mb-6 text-center">
              Náhľad darčekového poukazu
            </h3>

            <GiftCertificate
              mode="preview"
              amount={selectedAmount}
              recipientName={recipientName}
              buyerEmail={buyerName}
              message={message}
              expiresAt={null}
              code={null}
              previewClassName="max-w-[760px]"
            />
          </div>
        </div>
      )}
      </section>
    </div>
  );
};

export default GiftCard;