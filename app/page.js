"use client";

import { useState, useEffect } from 'react';
import Login from '../components/Login';
import { toast } from 'sonner';
import * as Core from '../core';

export default function Home() {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState('dark');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    if (isClient) {
      Core.initWeightTracker();
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  if (!isClient) {
    return null; // or a loading state
  }

  return (
    <div>
      {!user ? (
        <Login onLogin={handleLogin} theme={theme} toggleTheme={toggleTheme} />
      ) : (
        <div id="app-container">
          {/* Core app will render here through Core.initWeightTracker() */}
        </div>
      )}
    </div>
  );
}

