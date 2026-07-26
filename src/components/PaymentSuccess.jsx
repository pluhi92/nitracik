import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, PartyPopper, Gift } from 'lucide-react';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
};

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const isGiftCard = searchParams.get('gift_card') === 'true';

  useEffect(() => {
    let timer;

    if (isGiftCard) {
      timer = setTimeout(() => {
        navigate('/profile');
      }, 3000);
    } else {
      const urlParams = new URLSearchParams(location.search);
      const sessionId = urlParams.get('session_id');
      
      if (sessionId) {
        console.log('Payment successful, session:', sessionId);
        timer = setTimeout(() => {
          navigate('/profile');
        }, 5000);
      } else {
        navigate('/profile');
      }
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [location.search, navigate, isGiftCard]);

  return (
    <motion.section 
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      className="py-12 md:py-20 container-custom max-w-xl mx-auto px-4 sm:px-6 relative text-center"
    >
      <div className="bg-white rounded-[2rem] shadow-sm border border-neutral-200 p-8 sm:p-12">
        
        {isGiftCard ? (
          <>
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
              <Gift className="w-8 h-8 text-amber-500" />
            </div>
            <h2 className="text-2xl font-black text-foreground mb-2">
              Rezervácia úspešne uhradená! 🎁
            </h2>
            <p className="text-neutral-600 mb-2">
              Vaša rezervácia bola uhradená z darčekového poukazu.
            </p>
            <p className="text-sm text-neutral-400 mb-6">
              Potvrdenie sme zaslali na váš email.
            </p>
            <p className="text-sm text-neutral-500">
              Budete presmerovaný na váš profil o <strong>3 sekundy</strong>...
            </p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-foreground uppercase tracking-tight mb-4 flex items-center justify-center gap-2">
              <PartyPopper className="w-7 h-7 text-primary" />
              <span>Rezervácia potvrdená! 🎉</span>
            </h2>

            <div className="text-neutral-600 font-medium text-base sm:text-lg my-4 leading-relaxed">
              Vaša rezervácia bola úspešne zaplatená. Ďakujeme, že ste si vybrali Nitráčik!
            </div>

            <p className="text-neutral-500 text-sm font-medium mb-6">
              Potvrdenie sme zaslali na váš email.
            </p>

            <p className="text-neutral-400 font-bold text-xs sm:text-sm uppercase tracking-wider">
              Budete presmerovaný na váš profil...
            </p>
          </>
        )}
      </div>
    </motion.section>
  );
};

export default PaymentSuccess;