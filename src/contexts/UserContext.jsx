import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import api from '../api/api';
import nitracikLogo from '../assets/nitracik_svg2.svg';

const UserContext = createContext();

// 5 minút nečinnosti = 300 000 ms
const INACTIVITY_TIMEOUT = 300000;
// Hodnota pre rýchle testovanie: 15 sekúnd (15000 ms)
// const INACTIVITY_TIMEOUT = 15000;

export const UserProvider = ({ children }) => {
  const savedName = localStorage.getItem('userFirstName') || localStorage.getItem('userName')?.split(' ')[0] || '';
  const [user, setUser] = useState({
    isLoggedIn: !!localStorage.getItem('isLoggedIn'),
    firstName: savedName,
    userId: localStorage.getItem('userId'),
    role: localStorage.getItem('userRole') || 'user'
  });

  // Stav pre inactivity modal
  const [showInactivityModal, setShowInactivityModal] = useState(false);

  // Použijeme useRef pre sledovanie timeru a aktuálneho stavu
  const inactivityTimerRef = useRef(null);
  const isLoggedInRef = useRef(user.isLoggedIn);

  // Aktualizujeme ref vždy, keď sa zmení isLoggedIn
  useEffect(() => {
    isLoggedInRef.current = user.isLoggedIn;
  }, [user.isLoggedIn]);

  const updateUser = data => setUser(data);

  const logout = async () => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }

    try {
      await api.post('/api/logout', {}, { withCredentials: true });
    } catch (err) {
      if (err.code !== 'ECONNABORTED') {
        console.error('Logout failed:', err);
      }
    } finally {
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('userFirstName');
      localStorage.removeItem('userId');
      localStorage.removeItem('userName');
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      localStorage.removeItem('userRole');

      setUser({ isLoggedIn: false, firstName: '', userId: null, role: 'user' });
    }
  };


  // Logika pre automatické odhlásenie a synchronizáciu stavu
  useEffect(() => {
    const resetTimer = () => {
      // Vyčistíme existujúci timer
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }

      // Nastavíme nový timer iba ak je používateľ prihlásený
      if (isLoggedInRef.current) {
        inactivityTimerRef.current = setTimeout(async () => {
          console.log('Inactivity timeout reached. Logging out...');

          // Dvojitá kontrola – ak by medzičasom došlo k odhláseniu
          if (!localStorage.getItem('isLoggedIn')) return;

          try {
            // Počkáme na backend, aby request nebol aborted
            await api.post('/api/logout', {}, { withCredentials: true });
          } catch (err) {
            if (err.code !== 'ECONNABORTED') {
              console.error('Auto-logout API failed:', err);
            }
          } finally {
            // Frontend cleanup MUSÍ prebehnúť vždy
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('userFirstName');
            localStorage.removeItem('userId');
            localStorage.removeItem('userName');
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            localStorage.removeItem('userRole');

            setUser({ isLoggedIn: false, firstName: '', userId: null, role: 'user' });

            // Zobrazíme modal namiesto alertu
            setShowInactivityModal(true);
          }
        }, INACTIVITY_TIMEOUT);
      }
    };

    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];

    // Funkcia, ktorá sa volá pri akejkoľvek aktivite
    const handleUserActivity = () => {
      // Používame ref na kontrolu, či je používateľ prihlásený
      if (isLoggedInRef.current) {
        resetTimer();
      }
    };

    // Pridanie event listenerov pre sledovanie aktivity
    activityEvents.forEach(event => window.addEventListener(event, handleUserActivity));

    // Inicializujeme timer hneď po prihlásení alebo pri načítaní komponentu
    resetTimer();

    // Čistiaca funkcia: odstráni listenery a časovač pri odmontovaní komponentu
    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      activityEvents.forEach(event => window.removeEventListener(event, handleUserActivity));
    };
  }, [user.isLoggedIn]); // Spustí sa pri zmene stavu prihlásenia (prihlásenie/odhlásenie)


  // DRUHÝ useEffect - Synchronizácia stavu pri zmenách v localStorage (z iného tabu)
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === 'isLoggedIn' || event.key === 'userId' || event.key === 'userName') {
        const newIsLoggedIn = !!localStorage.getItem('isLoggedIn');
        const newUserId = localStorage.getItem('userId');
        const newUserName = localStorage.getItem('userName');
        const newRole = localStorage.getItem('userRole') || 'user';

        const newSavedFirstName = localStorage.getItem('userFirstName') || newUserName?.split(' ')[0] || '';

        setUser({
          isLoggedIn: newIsLoggedIn,
          firstName: newSavedFirstName,
          userId: newUserId,
          role: newRole
        });

        console.log('User state synchronized across tabs due to storage change.');
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleCloseInactivityModal = () => {
    setShowInactivityModal(false);
    // React-friendly redirect (bez reloadu)
    window.history.pushState({}, '', '/login');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <UserContext.Provider value={{ user, updateUser, logout }}>
      {children}

      {/* Inactivity logout modal */}
      {showInactivityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]"
            onClick={handleCloseInactivityModal}
          />
          <div className="relative bg-white rounded-[2.5rem] p-8 sm:p-10 max-w-sm w-full shadow-2xl text-center z-10 animate-[scaleIn_0.3s_ease-out]">
            <button
              onClick={handleCloseInactivityModal}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
            <img
              src={nitracikLogo}
              alt="Nitracik Logo"
              className="w-28 h-28 mx-auto mb-6"
            />
            <h3 className="text-xl font-extrabold text-foreground mb-2">
              Boli ste odhlásený
            </h3>
            <p className="text-neutral-500 font-medium mb-8">
              Boli ste odhlásený z dôvodu nečinnosti.
            </p>
            <button
              onClick={handleCloseInactivityModal}
              className="w-full bg-primary hover:bg-primary-600 text-white px-6 py-3.5 rounded-full font-bold transition-all shadow-sm"
            >
              Rozumiem
            </button>
          </div>
        </div>
      )}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);