"use client";

import { useState, useEffect } from 'react';
import Login from '../components/Login';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'sonner';
import * as Core from '../core';

export const dynamic = 'force-static';

export default function Home() {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState('dark');
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  // Handle initial mount
  useEffect(() => {
    setIsMounted(true);
    setIsLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    if (isMounted && typeof window !== 'undefined') {
      requestAnimationFrame(() => {
        Core.initWeightTracker();
      });
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // Show nothing during SSR
  if (!isMounted) {
    return null;
  }

  // Show loading state after mount but before ready
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

