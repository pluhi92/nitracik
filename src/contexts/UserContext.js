import React, { createContext, useContext, useState } from 'react';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const savedName = localStorage.getItem('userFirstName') || localStorage.getItem('userName')?.split(' ')[0] || '';
  const [user, setUser] = useState({ 
    isLoggedIn: !!localStorage.getItem('isLoggedIn'), 
    firstName: savedName, 
    userId: localStorage.getItem('userId') 
  });

  const updateUser = data => setUser(data);
  
  const logout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userFirstName');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    setUser({ isLoggedIn: false, firstName: '', userId: null });
  };

  return (
    <UserContext.Provider value={{ user, updateUser, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);