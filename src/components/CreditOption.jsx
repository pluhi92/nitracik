import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../api/api';

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
        // Preklad chybových hlášok
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
        return '🎫';
      case 'already':
        return '✅';
      case 'error':
        return '⚠️';
      default:
        return '⏳';
    }
  };

  // Názov farby pre nadpis podľa stavu (Tailwind triedy riešime nižšie, toto je len helper ak treba)
  const isError = status === 'error';

  return (
    <section className="min-h-screen bg-background py-12 flex items-center justify-center">
      <div className="max-w-container mx-auto px-4 sm:px-6 w-full flex justify-center">
        
        {/* Main Card Container - Dizajn zhodný s Contact.jsx */}
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
                Kredit máte pripísaný na profile. <br />
                Môžete ho ihneď použiť.
              </p>
              
              <div className="text-sm text-gray-500">
                Presmerovanie na rezervácie o <span className="font-bold text-gray-800">{countdown}</span> sekúnd...
              </div>

              <a
                href="/booking"
                className="inline-block w-full sm:w-auto px-8 py-3 bg-primary-500 text-white font-semibold rounded-lg shadow-md hover:bg-primary-600 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300"
              >
                Prejsť na rezervácie ihneď
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
              Prosím čakajte, overujem údaje...
            </p>
          )}

        </div>
      </div>
    </section>
  );
}