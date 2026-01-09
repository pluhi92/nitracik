import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/api';

const UserContext = createContext();


const INACTIVITY_TIMEOUT = 600000; 
// Hodnota pre rýchle testovanie: 15 sekúnd (15000 ms)
// const INACTIVITY_TIMEOUT = 15000;

export const UserProvider = ({ children }) => {
  const savedName = localStorage.getItem('userFirstName') || localStorage.getItem('userName')?.split(' ')[0] || '';
  const [user, setUser] = useState({ 
    isLoggedIn: !!localStorage.getItem('isLoggedIn'), 
    firstName: savedName, 
    userId: localStorage.getItem('userId') 
  });

  // Uloží referenciu na časovač, aby sme ho mohli resetovať
  const [inactivityTimer, setInactivityTimer] = useState(null);

  const updateUser = data => setUser(data);
  
  const logout = async () => {
    // 1. Zrušíme všetky existujúce časovače
    if (inactivityTimer) {
        clearTimeout(inactivityTimer);
        setInactivityTimer(null);
    }

    try {
      await api.post('/api/logout'); // odstráni session na serveri
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      // 3. Vymazanie lokálneho stavu a kontextu
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('userFirstName');
      localStorage.removeItem('userId');
      localStorage.removeItem('userName');
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      
      setUser({ isLoggedIn: false, firstName: '', userId: null });
    }
  };


  // Logika pre automatické odhlásenie a synchronizáciu stavu
  useEffect(() => {
    let timer;

    const resetTimer = () => {
      // Zrušíme starý časovač
      clearTimeout(timer); 

      // Ak je používateľ prihlásený, nastavíme nový časovač
      if (user.isLoggedIn) {
        timer = setTimeout(() => {
          console.log('Inactivity timeout reached. Logging out...');
          // Použijeme priamy logout, aby sme sa vyhli závislosti od 'logout' funkcie definovanej vonku
          
          // Kód na manuálne vykonanie logiky odhlásenia v timeoutu:
          if (!!localStorage.getItem('isLoggedIn')) {
              // Notifikovať používateľa
              alert('Automaticky odhlásený z dôvodu 10 minút nečinnosti.');
              
              // Vyčistenie stavu a odoslanie požiadavky na backend
              api.post('/api/logout').catch(err => console.error('Auto-logout API failed:', err));
              
              localStorage.removeItem('isLoggedIn');
              localStorage.removeItem('userFirstName');
              localStorage.removeItem('userId');
              localStorage.removeItem('userName');
              localStorage.removeItem('authToken');
              localStorage.removeItem('user');
              
              setUser({ isLoggedIn: false, firstName: '', userId: null });

              window.location.href = '/login'; // Presmerovanie na login stránku
          }
        }, INACTIVITY_TIMEOUT);
      }
    };
    
    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];

    // Funkcia, ktorá sa volá pri akejkoľvek aktivite
    const handleUserActivity = () => {
      if (user.isLoggedIn) {
        resetTimer();
      }
    };

    // Pridanie event listenerov pre sledovanie aktivity
    activityEvents.forEach(event => window.addEventListener(event, handleUserActivity));
    
    // Inicializujeme timer hneď po prihlásení alebo pri načítaní komponentu
    resetTimer(); 

    // Čistiaca funkcia: odstráni listenery a časovač pri odmontovaní komponentu
    return () => {
      clearTimeout(timer);
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
        
        const newSavedFirstName = localStorage.getItem('userFirstName') || newUserName?.split(' ')[0] || '';

        setUser({
          isLoggedIn: newIsLoggedIn,
          firstName: newSavedFirstName,
          userId: newUserId,
        });
        
        console.log('User state synchronized across tabs due to storage change.');
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return (
    <UserContext.Provider value={{ user, updateUser, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);