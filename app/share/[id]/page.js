"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import ViewMode from '../../../components/ViewMode';

export default function SharePage() {
  const params = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [viewData, setViewData] = useState(null);
  const [error, setError] = useState("");
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    // Load the report data based on the ID
    const fetchShareData = async () => {
      try {
        setIsLoading(true);
        // We'll load the data from localStorage in this client-side implementation
        // In production, this would fetch from an API or a generated static file
        if (typeof window !== 'undefined') {
          const shareId = params.id;
          const storedData = localStorage.getItem(`shared_${shareId}`);
          
          if (storedData) {
            const parsedData = JSON.parse(storedData);
            setViewData(parsedData);
            
            // Apply theme from shared data
            if (parsedData.theme) {
              setTheme(parsedData.theme);
            }
          } else {
            setError("Shared data not found or has expired");
          }
        }
      } catch (error) {
        console.error("Error loading shared data:", error);
        setError("Error loading shared data: " + error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchShareData();
  }, [params.id]);

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