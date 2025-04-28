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
      // Wait for next frame to ensure DOM is ready
      await new Promise(resolve => requestAnimationFrame(resolve));
      
      // Import and initialize Core
      try {
        const Core = await import('../core');
        Core.initWeightTracker();
      } catch (error) {
        console.error('Failed to initialize core:', error);
        toast.error('Failed to initialize application');
      }
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
          {/* Add the necessary UI elements that Core.js expects */}
          <div id="weight-form" className="space-y-4">
            <input type="number" id="weight" placeholder="Weight" />
            <input type="date" id="date" />
          </div>
          <div id="chart-container"></div>
          <div id="controls">
            <button id="export-btn">Export</button>
            <input type="file" id="import-file" accept=".json" />
          </div>
        </div>
      )}
    </div>
  );
}

