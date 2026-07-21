import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
    }, 1000);

    // Vyčistenie časovača, ak užívateľ odíde zo stránky skôr
    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className="container mt-5 text-center" style={{ paddingTop: '50px' }}>
      {/* Ikonka pre lepší vizuál */}
      <div style={{ fontSize: '4rem', marginBottom: '20px' }}>
        👋
      </div>

      <h2 className="mb-4">Váš účet bol úspešne zrušený</h2>
      
      <p className="lead">
        Ďakujeme, že ste boli súčasťou našich tréningov. <br />
        Dúfame, že sa ešte niekedy uvidíme!
      </p>

      <hr className="my-4" style={{ maxWidth: '300px', margin: '0 auto' }} />

      <p className="text-muted">
        Budete presmerovaní na domovskú stránku za <strong style={{ color: '#dc3545' }}>{countdown}</strong> sekundy.
      </p>
    </div>
  );
};

export default AccountDeleted;