import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/api';

export default function RefundOption() {
  const [params] = useSearchParams();
  const bookingId = params.get('bookingId');
  const action = params.get('action');

  // Používame 'status' pre riadenie dizajnu (rovnako ako v CreditOption)
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
            // Použijeme správu zo servera alebo fallback
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

  // Ikona podľa stavu
  const getIcon = () => {
    switch (status) {
      case 'success':
        return '💳'; // Ikonka karty pre refund
      case 'already':
        return '✅';
      case 'error':
        return '⚠️';
      default:
        return '⏳';
    }
  };

  const isError = status === 'error';

  return (
    <section className="min-h-screen bg-background py-12 flex items-center justify-center">
      <div className="max-w-container mx-auto px-4 sm:px-6 w-full flex justify-center">
        
        {/* Main Card Container - Dizajn zhodný s CreditOption/Contact */}
        <div className="bg-overlay-80 backdrop-blur-sm rounded-xl shadow-lg border-2 border-gray-200 p-8 sm:p-10 max-w-lg w-full text-center">
          
          {/* Ikona s animáciou */}
          <div className={`text-6xl sm:text-7xl mb-6 select-none ${status === 'success' ? 'animate-bounce' : ''}`}>
            {getIcon()}
          </div>

          {/* Hlavný nadpis / Správa */}
          <h2 className={`text-xl sm:text-2xl font-bold mb-4 ${isError ? 'text-red-600' : 'text-gray-800'}`}>
            {message}
          </h2>

          {/* Success / Already stav */}
          {(status === 'success' || status === 'already') && (
            <div className="mt-6 space-y-6">
              <p className="text-gray-600 text-base sm:text-lg leading-relaxed">
                Peniaze by mali nabehnúť na váš účet v priebehu 5 až 10 pracovných dní.
              </p>
              
              <a
                href="/booking"
                className="inline-block w-full sm:w-auto px-8 py-3 bg-primary-500 text-white font-semibold rounded-lg shadow-md hover:bg-primary-600 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300"
              >
                Späť na rezervácie
              </a>
            </div>
          )}

          {/* Error stav */}
          {status === 'error' && (
            <div className="mt-6 space-y-6">
              <p className="text-gray-600 leading-relaxed">
                Ak problém pretrváva, kontaktujte prosím podporu.
              </p>
              
              <a
                href="/booking"
                className="inline-block w-full sm:w-auto px-8 py-3 bg-gray-500 text-white font-semibold rounded-lg shadow-md hover:bg-gray-600 hover:-translate-y-0.5 transition-all duration-300"
              >
                Späť na rezervácie
              </a>
            </div>
          )}

          {/* Processing stav */}
          {status === 'processing' && (
            <p className="text-gray-500 mt-4 animate-pulse">
              Prosím čakajte, komunikujem s platobnou bránou...
            </p>
          )}

        </div>
      </div>
    </section>
  );
}