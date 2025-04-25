"use client";

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import ViewMode from '../../components/ViewMode';

export default function ShareFallback() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [viewData, setViewData] = useState(null);
  const [error, setError] = useState("");
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    function extractShareId() {
      // First, check if ID is in query params (primary approach now)
      if (searchParams) {
        const paramId = searchParams.get('id');
        if (paramId) return paramId;
      }
      
      // For client-side, also check URL directly
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const queryId = urlParams.get('id');
        if (queryId) return queryId;
      
        // Check hash format for backward compatibility
        if (window.location.hash) {
          // Try to extract from hash format like #/share/abc123
          const hashMatch = window.location.hash.match(/\/share\/([^\/]+)/);
          if (hashMatch && hashMatch[1]) {
            return hashMatch[1];
          }
          
          // If not, maybe it's just #abc123
          const simpleHash = window.location.hash.substring(1);
          if (simpleHash && !simpleHash.includes('/')) {
            return simpleHash;
          }
        }
        
        // Finally, check if it's directly in the path
        const pathParts = window.location.pathname.split('/');
        if (pathParts.length > 2 && pathParts[1] === 'share') {
          return pathParts[2];
        }
      }
      
      return null;
    }

    async function loadShareData() {
      try {
        setIsLoading(true);
        
        const shareId = extractShareId();
        console.log('Found share ID:', shareId);
        
        if (!shareId) {
          setError("Invalid share link. No share ID found.");
          setIsLoading(false);
          return;
        }
        
        // Load from localStorage
        const storedData = localStorage.getItem(`shared_${shareId}`);
        
        if (storedData) {
          try {
            const parsedData = JSON.parse(storedData);
            setViewData(parsedData);
            
            // Apply theme from shared data
            if (parsedData.theme) {
              setTheme(parsedData.theme);
            }
          } catch (e) {
            console.error('Error parsing share data:', e);
            setError("Error loading shared data: Invalid data format");
          }
        } else {
          setError("Shared data not found or has expired");
        }
      } catch (error) {
        console.error("Error loading shared data:", error);
        setError("Error loading shared data: " + error.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadShareData();
    
    // Add hash change listener to handle navigation
    const handleHashChange = () => {
      loadShareData();
    };
    
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Toggle theme function
  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    
    // Update the theme in viewData
    if (viewData) {
      setViewData({
        ...viewData,
        theme: newTheme
      });
    }
  };

  // Exit function - return to home
  const handleExit = () => {
    window.location.href = '/';
  };

  return (
    <ViewMode 
      entries={viewData?.entries || []}
      startWeight={viewData?.startWeight}
      goalWeight={viewData?.goalWeight}
      height={viewData?.height}
      theme={theme}
      sharedBy={viewData?.sharedBy}
      onThemeToggle={toggleTheme}
      onExit={handleExit}
      isLoading={isLoading}
      error={error}
    />
  );
} 