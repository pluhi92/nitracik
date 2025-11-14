// src/components/GreetingBar.js
import React from 'react';
import { useUser } from '../App';
import '../styles/components/GreetingBar.css';

const GreetingBar = () => {
  const { user } = useUser();

  console.log('GreetingBar Debug - User state:', user);

  if (!user.isLoggedIn) {
    return null;
  }

  return (
    <div className="greeting-bar">
      <div className="greeting-container">
        <span className="greeting-text">
          Hello, <strong>{user.firstName || 'User'}</strong>!
        </span>
      </div>
    </div>
  );
};

export default GreetingBar;