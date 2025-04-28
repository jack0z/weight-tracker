"use client";

import { useState, useEffect } from 'react';
import Login from '../components/Login';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'sonner';

export const dynamic = 'force-static';

export default function Home() {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState('dark');
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setIsLoading(false);
  }, []);

  const handleLogin = async (userData) => {
    setUser(userData);
    if (isMounted && typeof window !== 'undefined') {
      // Dynamic import of Core module
      const Core = await import('../core');
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

