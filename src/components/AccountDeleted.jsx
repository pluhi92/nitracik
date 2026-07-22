import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
};

const AccountDeleted = () => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    // Časovač, ktorý sa spustí každú sekundu
    const timer = setInterval(() => {
      setCountdown((prevCount) => {
        if (prevCount <= 1) {
          clearInterval(timer);
          navigate('/'); // Presmerovanie na domovskú stránku
          return 0;
        }
        return prevCount - 1;
      });
    }, 2500);

    // Vyčistenie časovača, ak užívateľ odíde zo stránky skôr
    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <motion.section 
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      className="py-12 md:py-20 container-custom max-w-xl mx-auto px-4 sm:px-6 relative text-center"
    >
      <div className="bg-white rounded-[2rem] shadow-sm border border-neutral-200 p-8 sm:p-12">
        
        {/* Ikonka pre lepší vizuál */}
        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl">
          👋
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-foreground uppercase tracking-tight mb-4">
          Váš účet bol úspešne zrušený
        </h2>
        
        <p className="text-neutral-600 font-medium text-base sm:text-lg mb-8 leading-relaxed">
          Ďakujeme, že ste boli súčasťou našich tréningov. <br />
          Dúfame, že sa ešte niekedy uvidíme!
        </p>

        <hr className="my-6 border-neutral-100 max-w-[200px] mx-auto" />

        <p className="text-neutral-400 font-bold text-xs sm:text-sm uppercase tracking-wider">
          Budete presmerovaní na domovskú stránku za <strong className="text-red-600 font-black">{countdown}</strong> sekundy.
        </p>
      </div>
    </motion.section>
  );
};

export default AccountDeleted;