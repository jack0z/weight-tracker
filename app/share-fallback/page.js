"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

// Required for static generation
export function generateStaticParams() {
  return [{}];
}

// Simple static version with client-side logic
export default function ShareFallbackPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [viewData, setViewData] = useState(null);
  const [error, setError] = useState("");
  const [theme, setTheme] = useState("light");
  const searchParams = useSearchParams();

  useEffect(() => {
    // Function to extract ID from various sources
    function extractShareId() {
      // Check URL query params first
      if (searchParams) {
        const paramId = searchParams.get('id');
        if (paramId) return paramId;
      }
      
      // Check direct URL
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const queryId = urlParams.get('id');
        if (queryId) return queryId;
        
        // Path parameter
        const pathParts = window.location.pathname.split('/');
        if (pathParts.length > 2 && pathParts[1] === 'share') {
          return pathParts[2];
        }
        
        // Hash parameter
        if (window.location.hash) {
          const hashMatch = window.location.hash.match(/\/share\/([^\/]+)/);
          if (hashMatch && hashMatch[1]) {
            return hashMatch[1];
          }
        }
      }
      
      return null;
    }

    // Create demo data for static deployments
    function createDemoData(isPermalink = false) {
      console.log("Creating demo data:", isPermalink ? "permalink" : "regular");
      
      const demoEntries = [];
      const today = new Date();
      
      for (let i = 0; i < 30; i++) {
        const entryDate = new Date();
        entryDate.setDate(today.getDate() - i);
        
        // Generate weight value
        let weight;
        if (isPermalink) {
          if (i < 10) weight = (80 - (i * 0.2)).toFixed(1);
          else if (i < 20) weight = (78 - ((i-10) * 0.05)).toFixed(1);
          else weight = (77.5 - ((i-20) * 0.15)).toFixed(1);
        } else {
          const baseWeight = 80 - (i * 0.1);
          const variation = Math.random() * 0.4 - 0.2;
          weight = (baseWeight + variation).toFixed(1);
        }
        
        demoEntries.push({
          date: entryDate.toISOString().split('T')[0],
          weight: weight
        });
      }
      
      return {
        entries: demoEntries,
        startWeight: "80.0",
        goalWeight: "75.0",
        height: isPermalink ? "180" : "175",
        theme: "light",
        sharedBy: isPermalink ? "Demo Permalink User" : "Demo User",
        sharedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        isPermalink: isPermalink
      };
    }

    // Load share data
    async function loadData() {
      try {
        const shareId = extractShareId();
        console.log("Found share ID:", shareId);
        
        if (!shareId) {
          setError("No share ID found in URL");
          setIsLoading(false);
          return;
        }
        
        // For demo shares, always create new data
        if (shareId === 'demo_share' || shareId === 'demo_permalink') {
          console.log("Loading demo data for", shareId);
          const demoData = createDemoData(shareId === 'demo_permalink');
          setViewData(demoData);
          setTheme(demoData.theme || 'light');
          setIsLoading(false);
          return;
        }
        
        // For regular shares, try localStorage
        try {
          const storedData = localStorage.getItem(`shared_${shareId}`);
          if (storedData) {
            const parsedData = JSON.parse(storedData);
            setViewData(parsedData);
            setTheme(parsedData.theme || 'light');
          } else {
            setError("Shared data not found");
          }
        } catch (e) {
          console.error("Error parsing share data:", e);
          setError("Invalid share data format");
        }
      } catch (err) {
        console.error("Error in loadData:", err);
        setError("Error loading shared data");
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, [searchParams]);

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: theme === 'dark' ? '#2b2d31' : '#F3EAD3',
        color: theme === 'dark' ? '#e3e5e8' : '#5C6A72'
      }}>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>
            Loading Shared Weight Tracker...
          </h1>
          <p>Please wait while we load the shared data.</p>
          <div style={{ marginTop: '20px' }}>
            <div style={{ 
              width: '40px',
              height: '40px',
              margin: '0 auto',
              border: '4px solid #ddd',
              borderTopColor: theme === 'dark' ? '#5865f2' : '#8DA101',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
          </div>
          <style jsx>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: theme === 'dark' ? '#2b2d31' : '#F3EAD3',
        color: theme === 'dark' ? '#e3e5e8' : '#5C6A72',
        padding: '20px'
      }}>
        <div style={{ textAlign: 'center', maxWidth: '500px' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>
            Error Loading Shared Data
          </h1>
          <p style={{ marginBottom: '20px' }}>{error}</p>
          <button
            onClick={() => window.location.href = '/'}
            style={{
              padding: '10px 15px',
              backgroundColor: theme === 'dark' ? '#5865f2' : '#8DA101',
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

  // If we have viewData but haven't imported the ViewMode component yet,
  // show a temporary placeholder while we dynamically import it
  if (viewData) {
    return (
      <div style={{ 
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: theme === 'dark' ? '#2b2d31' : '#F3EAD3',
        color: theme === 'dark' ? '#e3e5e8' : '#5C6A72',
        padding: '20px'
      }}>
        <div style={{ textAlign: 'center', maxWidth: '700px' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>
            Weight Tracker Shared by {viewData.sharedBy}
          </h1>
          <div style={{ backgroundColor: theme === 'dark' ? '#313338' : '#EAE4CA', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
            <p style={{ marginBottom: '10px' }}>
              <strong>Progress Summary:</strong>
            </p>
            <p>Start Weight: {viewData.startWeight} kg</p>
            <p>Current Weight: {viewData.entries[0].weight} kg</p>
            <p>Goal Weight: {viewData.goalWeight} kg</p>
            <p>Entries: {viewData.entries.length}</p>
          </div>
          
          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between' }}>
            <button
              onClick={() => window.location.href = '/'}
              style={{
                padding: '10px 15px',
                backgroundColor: theme === 'dark' ? '#4f545c' : '#939F91',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Return to Home
            </button>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              style={{
                padding: '10px 15px',
                backgroundColor: theme === 'dark' ? '#5865f2' : '#8DA101',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Toggle Theme
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Fallback in case nothing else rendered
  return (
    <div style={{ 
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: theme === 'dark' ? '#2b2d31' : '#F3EAD3',
      color: theme === 'dark' ? '#e3e5e8' : '#5C6A72'
    }}>
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <h1>Weight Tracker Share</h1>
        <p>Loading shared data...</p>
      </div>
    </div>
  );
} 