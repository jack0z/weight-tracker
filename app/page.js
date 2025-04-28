"use client";

import { useState } from 'react';
import Login from '../components/Login';
import { toast } from 'sonner';
import * as Core from '../core';

export default function Home() {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState('dark');

  const handleLogin = (userData) => {
    setUser(userData);
    Core.initWeightTracker(); // Initialize core app after login
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

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

