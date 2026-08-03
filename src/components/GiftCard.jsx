// GiftCard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
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

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut', delay: i * 0.08 }
  })
};

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
};

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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);

  // ── Success screen state ──
  const [successData, setSuccessData] = useState(null);
  const [successLoading, setSuccessLoading] = useState(true);
  const [successError, setSuccessError] = useState('');
  const [copied, setCopied] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
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

  // ── Submit disabled condition ──
  const isSubmitDisabled = !selectedAmount || !recipientName.trim() || !buyerEmail.trim() || !buyerName.trim() || !tocAccepted || loading;

  // ── Render: Success screen ──
  if (isSuccessRoute) {
    return (
      <section className="py-12 md:py-20 container-custom max-w-4xl mx-auto px-4 sm:px-6 relative">
        {successLoading && (
          <div className="flex items-center justify-center min-h-[300px]">
            <Spinner animation="border" variant="warning" />
          </div>
        )}

        {!successLoading && successError && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="bg-white rounded-[2rem] shadow-sm border border-neutral-200 p-8 sm:p-12 text-center"
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
          </motion.div>
        )}

        {!successLoading && !successError && successData && (
          <motion.div initial="hidden" animate="visible" variants={fadeInUp}
            className="bg-white rounded-[2rem] shadow-sm border border-neutral-200 p-6 sm:p-10 text-center">
            
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
          </motion.div>
        )}
      </section>
    );
  }

  // ── Render: Purchase form ──
  return (
    <section className="py-12 md:py-20 container-custom max-w-2xl mx-auto px-4 sm:px-6 relative">
      <form onSubmit={handleSubmit}>
        {/* ── CARD 1: Gift card details ── */}
        <div className="relative">
          <img
            src={mascotImage}
            alt=""
            className="absolute -top-10 left-1/2 -translate-x-1/2 w-20 sm:w-24 z-20 pointer-events-none"
            style={{ filter: 'drop-shadow(2px 4px 12px rgba(0,0,0,0.12))' }}
          />
          <motion.div
            custom={0}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className="bg-white rounded-[2rem] shadow-sm border border-neutral-200 p-6 sm:p-8 mb-6 relative"
          >
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {AMOUNTS.map((item) => {
              const isSelected = selectedAmount === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setSelectedAmount(item.value)}
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

          {/* Recipient name */}
          <div className="mb-4">
            <label className="block text-sm font-bold text-neutral-700 mb-1.5">
              Meno obdarovaného <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="Meno obdarovaného"
              required
              className="w-full rounded-2xl border-2 border-neutral-200 px-4 py-3 text-sm font-medium text-foreground placeholder-neutral-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
            />
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
        </motion.div>
        </div>

        {/* ── CARD 2: Buyer details & payment ── */}
        <motion.div
          custom={1}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          className="bg-white rounded-[2rem] shadow-sm border border-neutral-200 p-6 sm:p-8 mb-6"
        >
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
              onChange={(e) => setBuyerName(e.target.value)}
              placeholder="Vaše meno a priezvisko"
              required
              className="w-full rounded-2xl border-2 border-neutral-200 px-4 py-3 text-sm font-medium text-foreground placeholder-neutral-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
            />
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
                onChange={(e) => setBuyerEmail(e.target.value)}
                placeholder="Váš email"
                required
                className="w-full rounded-2xl border-2 border-neutral-200 px-4 py-3 text-sm font-medium text-foreground placeholder-neutral-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
              />
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
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={tocAccepted}
                onChange={(e) => setTocAccepted(e.target.checked)}
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
            disabled={isSubmitDisabled}
            className={`
              w-full bg-amber-400 hover:bg-amber-500 text-white font-bold rounded-2xl px-8 py-4
              transition-all duration-200 flex items-center justify-center gap-2
              ${isSubmitDisabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
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
        </motion.div>
      </form>

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
  );
};

export default GiftCard;