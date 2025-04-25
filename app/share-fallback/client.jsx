"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ViewMode from '../../components/ViewMode';

// Use a separate component for the search params to properly handle Suspense
function ShareContent() {
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
        let storedData = localStorage.getItem(`shared_${shareId}`);
        
        // For Netlify deployments - create demo data if this is a demo share
        if (!storedData && (shareId === 'demo_share' || shareId === 'demo_permalink')) {
          console.log('Creating demo data for Netlify deployment');
          storedData = createDemoShareData(shareId === 'demo_permalink');
        }
        
        if (storedData) {
          try {
            const parsedData = typeof storedData === 'string' ? JSON.parse(storedData) : storedData;
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
  }, [searchParams]);

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

  // Display loading state or ViewMode component
  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h1>Loading Shared Weight Tracker...</h1>
          <p>Please wait while we load the shared data.</p>
        </div>
      </div>
    );
  }

  // Display error state
  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h1>Error Loading Shared Data</h1>
          <p>{error}</p>
          <button
            onClick={handleExit}
            style={{
              marginTop: '20px',
              padding: '10px 15px',
              backgroundColor: '#5865f2',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

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
      isLoading={false}
      error=""
    />
  );
}

// Wrapper component with Suspense
export default function ShareFallbackClient() {
  return (
    <Suspense fallback={
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h1>Loading Shared Weight Tracker...</h1>
          <p>Please wait while we load the shared data.</p>
        </div>
      </div>
    }>
      <ShareContent />
    </Suspense>
  );
}

// Create demo share data for static deployments
function createDemoShareData(isPermalink = false) {
  console.log(isPermalink ? "Creating permalink demo data" : "Creating general demo share data");
  
  // Create demo entries - last 30 days with a weight loss trend
  const demoEntries = [];
  const today = new Date();
  
  for (let i = 0; i < 30; i++) {
    const entryDate = new Date();
    entryDate.setDate(today.getDate() - i);
    
    // Pattern based on permalink status
    let weight;
    if (isPermalink) {
      // For permalink: more interesting pattern
      if (i < 10) {
        // First 10 days - good progress
        weight = (80 - (i * 0.2)).toFixed(1);
      } else if (i < 20) {
        // Middle 10 days - plateau
        weight = (78 - ((i-10) * 0.05)).toFixed(1);
      } else {
        // Last 10 days - progress again
        weight = (77.5 - ((i-20) * 0.15)).toFixed(1);
      }
    } else {
      // For regular share: simple progression
      const baseWeight = 80 - (i * 0.1);
      const variation = Math.random() * 0.4 - 0.2; // -0.2 to +0.2 variation
      weight = (baseWeight + variation).toFixed(1);
    }
    
    demoEntries.push({
      date: entryDate.toISOString().split('T')[0],
      weight: weight
    });
  }
  
  // Create share package
  return {
    entries: demoEntries,
    startWeight: "80.0",
    goalWeight: "75.0",
    height: isPermalink ? "180" : "175",
    theme: "light",
    sharedBy: isPermalink ? "Demo Permalink" : "Demo User",
    sharedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // Expires in 1 year
    isPermalink: isPermalink
  };
} 