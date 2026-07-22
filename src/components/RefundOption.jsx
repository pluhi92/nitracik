import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CreditCard, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import api from '../api/api';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
};

export default function RefundOption() {
  const [params] = useSearchParams();
  const bookingId = params.get('bookingId');
  const action = params.get('action');

  const [status, setStatus] = useState('processing'); // 'processing' | 'success' | 'already' | 'error'
  const [message, setMessage] = useState('Spracovávam požiadavku...');

  useEffect(() => {
    if (bookingId && action) {
      api
        .get(`/api/booking/${action}`, { params: { bookingId } })
        .then((res) => {
          const { status: resStatus, message: resMessage, refundId } = res.data;

          if (resStatus === 'processed') {
            setStatus('success');
            setMessage(`Vrátenie peňazí bolo úspešné! ID transakcie: ${refundId}`);
          } else if (resStatus === 'already') {
            setStatus('already');
            setMessage(`Peniaze za túto rezerváciu už boli vrátené. ID transakcie: ${refundId}`);
          } else {
            setStatus('error');
            setMessage(resMessage || 'Neočakávaná odpoveď zo servera.');
          }
        })
        .catch((err) => {
          setStatus('error');
          const errorText = err.response?.data?.message || err.message || 'Neočakávaná chyba';
          setMessage(`Chyba: ${errorText}`);
        });
    } else {
      setStatus('error');
      setMessage('Chýbajúce parametre (bookingId alebo action).');
    }
  }, [bookingId, action]);

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
              Peniaze by mali nabehnúť na váš účet v priebehu 5 až 10 pracovných dní.
            </p>
            
            <Link
              to="/booking"
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3.5 bg-primary hover:bg-primary-600 text-white font-bold rounded-xl shadow-lg hover:-translate-y-0.5 transition-all duration-300"
            >
              <span>Späť na rezervácie</span>
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
            Prosím čakajte, komunikujem s platobnou bránou...
          </p>
        )}

      </div>
    </motion.section>
  );
}