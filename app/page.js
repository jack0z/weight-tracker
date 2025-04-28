"use client";

import { useState, useEffect } from 'react';
import Login from '../components/Login';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'sonner';
import * as Core from '../core';

export default function Home() {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState('dark');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    // Delay core initialization to ensure DOM is ready
    setTimeout(() => {
      Core.initWeightTracker();
    }, 0);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      {!user ? (
        <Login onLogin={handleLogin} theme={theme} toggleTheme={toggleTheme} />
      ) : (
        <div id="app-container" className="container mx-auto p-4">
          {/* Core app container */}
        </div>
      )}
    </div>
  );
}

