import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, CheckCircle2, AlertTriangle, Loader2, ArrowRight } from 'lucide-react';
import api from '../api/api';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
};

export default function CreditOption() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const bookingId = params.get('bookingId');
  
  const [status, setStatus] = useState('processing'); // 'processing' | 'success' | 'already' | 'error'
  const [message, setMessage] = useState('Spracovávam požiadavku...');
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!bookingId) {
      setStatus('error');
      setMessage('Chýba ID rezervácie. Skontrolujte prosím odkaz.');
      return;
    }

    // Zavolaj API pre pridanie kreditu
    api
      .get('/api/booking/credit', { params: { bookingId } })
      .then((res) => {
        const { status: responseStatus, creditId } = res.data;

        if (responseStatus === 'processed') {
          setStatus('success');
          setMessage('Kredit bol úspešne pridaný! Teraz ho môžete využiť na ďalšiu rezerváciu.');
          console.log('[DEBUG] Credit created, ID:', creditId);
        } else if (responseStatus === 'already') {
          setStatus('already');
          setMessage('Váš kredit už bol pridaný predtým a je pripravený na použitie.');
          console.log('[DEBUG] Credit already existed, ID:', creditId);
        } else {
          setStatus('error');
          setMessage('Neočakávaná odpoveď zo servera.');
        }
      })
      .catch((err) => {
        console.error('[ERROR] Credit request failed:', err);
        setStatus('error');
        setMessage('Vyskytla sa neočakávaná chyba pri spracovaní.');
      });
  }, [bookingId]);

  // Countdown timer pre redirect
  useEffect(() => {
    if (status === 'success' || status === 'already') {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            navigate('/booking');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [status, navigate]);

  // Ikona podľa stavu
  const getIcon = () => {
    switch (status) {
      case 'success':
        return <CreditCard className="w-10 h-10 text-emerald-600" />;
      case 'already':
        return <CheckCircle2 className="w-10 h-10 text-emerald-600" />;
      case 'error':
        return <AlertTriangle className="w-10 h-10 text-red-600" />;
      default:
        return <Loader2 className="w-10 h-10 text-primary animate-spin" />;
    }
  };

  const isError = status === 'error';

  return (
    <motion.section 
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      className="py-12 md:py-20 container-custom max-w-xl mx-auto px-4 sm:px-6 relative text-center"
    >
      <div className="bg-white rounded-[2rem] shadow-sm border border-neutral-200 p-8 sm:p-12">
        
        {/* Ikona s animáciou */}
        <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 ${
          status === 'success' || status === 'already' ? 'bg-emerald-50' :
          isError ? 'bg-red-50' :
          'bg-primary/10'
        } ${status === 'success' ? 'animate-bounce' : ''}`}>
          {getIcon()}
        </div>

        {/* Hlavný nadpis / Správa */}
        <h2 className={`text-xl sm:text-2xl font-black mb-4 uppercase tracking-tight ${isError ? 'text-red-600' : 'text-foreground'}`}>
          {message}
        </h2>

        {/* Success / Already stav */}
        {(status === 'success' || status === 'already') && (
          <div className="mt-6 space-y-6">
            <p className="text-neutral-600 font-medium text-base sm:text-lg leading-relaxed">
              Kredit máte pripísaný na profile. <br />
              Môžete ho ihneď použiť.
            </p>
            
            <div className="text-sm font-bold text-neutral-400">
              Presmerovanie na rezervácie o <span className="text-foreground font-black">{countdown}</span> sekúnd...
            </div>

            <Link
              to="/booking"
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3.5 bg-primary hover:bg-primary-600 text-white font-bold rounded-xl shadow-lg hover:-translate-y-0.5 transition-all duration-300"
            >
              <span>Prejsť na rezervácie ihneď</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Error stav */}
        {status === 'error' && (
          <div className="mt-6 space-y-6">
            <p className="text-neutral-600 font-medium leading-relaxed">
              Ak problém pretrváva, kontaktujte prosím podporu.
            </p>
            
            <Link
              to="/booking"
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3.5 bg-neutral-800 hover:bg-neutral-900 text-white font-bold rounded-xl shadow-lg hover:-translate-y-0.5 transition-all duration-300"
            >
              <span>Späť na rezervácie</span>
            </Link>
          </div>
        )}

        {/* Processing stav */}
        {status === 'processing' && (
          <p className="text-neutral-400 font-bold text-sm mt-4 animate-pulse">
            Prosím čakajte, overujem údaje...
          </p>
        )}

      </div>
    </motion.section>
  );
}