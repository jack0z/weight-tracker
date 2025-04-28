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
      try {
        // First set user
        setUser(userData);
        
        // Wait for state update and DOM render
        await new Promise(resolve => setTimeout(resolve, 0));
        
        // Import and initialize Core
        const Core = await import('../core');
        
        // Double check elements exist
        const requiredElements = [
          'weight-form',
          'settings-form',
          'chart-container',
          'controls',
          'export-btn',
          'import-file'
        ];
        
        const missingElements = requiredElements.filter(id => !document.getElementById(id));
        if (missingElements.length > 0) {
          throw new Error(`Missing required elements: ${missingElements.join(', ')}`);
        }
        
        Core.initWeightTracker();
        toast.success('Application initialized successfully');
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
        <div id="app-container" className={`container mx-auto p-4 ${theme === 'dark' ? 'dark' : ''}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Weight Entry Form */}
            <div id="weight-form" className="space-y-4 p-4 rounded-lg border">
              <h2 className="text-xl font-bold">Add Weight Entry</h2>
              <div className="space-y-2">
                <input 
                  type="number" 
                  id="weight" 
                  placeholder="Weight (kg)" 
                  className="w-full p-2 rounded border"
                  step="0.1"
                />
                <input 
                  type="date" 
                  id="date" 
                  className="w-full p-2 rounded border"
                />
                <button id="add-entry" className="w-full p-2 bg-blue-600 text-white rounded">
                  Add Entry
                </button>
              </div>
            </div>

            {/* Settings Form */}
            <div id="settings-form" className="space-y-4 p-4 rounded-lg border">
              <h2 className="text-xl font-bold">Settings</h2>
              <div className="space-y-2">
                <input 
                  type="number" 
                  id="start-weight" 
                  placeholder="Start Weight (kg)" 
                  className="w-full p-2 rounded border"
                  step="0.1"
                />
                <input 
                  type="number" 
                  id="goal-weight" 
                  placeholder="Goal Weight (kg)" 
                  className="w-full p-2 rounded border"
                  step="0.1"
                />
                <input 
                  type="number" 
                  id="height" 
                  placeholder="Height (cm)" 
                  className="w-full p-2 rounded border"
                  step="0.1"
                />
              </div>
            </div>

            {/* Chart Container */}
            <div id="chart-container" className="col-span-1 md:col-span-2 h-64 border rounded-lg">
              {/* Chart will be rendered here by Core */}
            </div>

            {/* Controls */}
            <div id="controls" className="col-span-1 md:col-span-2 flex gap-4 p-4">
              <button id="export-btn" className="px-4 py-2 bg-green-600 text-white rounded">
                Export Data
              </button>
              <div className="relative">
                <input 
                  type="file" 
                  id="import-file" 
                  accept=".json" 
                  className="hidden"
                />
                <button 
                  onClick={() => document.getElementById('import-file').click()}
                  className="px-4 py-2 bg-blue-600 text-white rounded"
                >
                  Import Data
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

