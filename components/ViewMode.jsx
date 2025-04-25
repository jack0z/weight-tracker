import { useState, useEffect } from 'react';
import { Sun, Moon } from "lucide-react";

/**
 * Simplified view-only mode component for shared weight tracker data
 */
export default function ViewMode({ 
  entries = [], 
  startWeight, 
  goalWeight, 
  height, 
  theme, 
  sharedBy,
  isLoading,
  error,
  onThemeToggle,
  onExit
}) {
  const [isClient, setIsClient] = useState(false);
  
  // Set isClient once component mounts
  useEffect(() => {
    setIsClient(true);
    
    // Apply theme to document
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 w-full max-w-md shadow-xl rounded-lg">
          <div className="p-6">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div>
              <h2 className="text-xl font-bold dark:text-white">Loading shared data...</h2>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="flex h-screen items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 w-full max-w-md shadow-xl rounded-lg">
          <div className="p-6">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="text-error text-5xl">⚠️</div>
              <h2 className="text-xl font-bold dark:text-white">Error loading data</h2>
              <p className="text-center dark:text-gray-300">{error}</p>
              <button 
                className="py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600" 
                onClick={onExit}
              >
                Go back to app
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // No data state
  if (!entries || entries.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 w-full max-w-md shadow-xl rounded-lg">
          <div className="p-6">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="text-warning text-5xl">⚠️</div>
              <h2 className="text-xl font-bold dark:text-white">No data available</h2>
              <p className="text-center dark:text-gray-300">There are no weight entries to display.</p>
              <button 
                className="py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600" 
                onClick={onExit}
              >
                Go back to app
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white p-4">
      <div className="max-w-4xl mx-auto">
        {/* Simple header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Weight Tracker</h1>
            {sharedBy && <p className="text-sm opacity-70">Shared by {sharedBy}</p>}
          </div>
          
          <button
            onClick={onThemeToggle}
            className="p-2 rounded-full bg-gray-300 dark:bg-gray-700"
          >
            {theme === 'dark' ? (
              <Sun size={20} />
            ) : (
              <Moon size={20} />
            )}
          </button>
        </div>
        
        {/* Basic stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="p-4 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow">
            <h2 className="text-lg font-semibold mb-2">Current Weight</h2>
            <p className="text-2xl font-bold">
              {entries[0]?.weight ? `${parseFloat(entries[0].weight).toFixed(1)} kg` : '-'}
            </p>
          </div>
          
          <div className="p-4 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow">
            <h2 className="text-lg font-semibold mb-2">Goal Weight</h2>
            <p className="text-2xl font-bold">{goalWeight ? `${goalWeight} kg` : '-'}</p>
          </div>
        </div>
        
        {/* Simple weight history list */}
        <div className="p-4 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow mb-6">
          <h2 className="text-lg font-semibold mb-4">Weight History</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2">Date</th>
                  <th className="text-left py-2">Weight (kg)</th>
                </tr>
              </thead>
              <tbody>
                {entries.map(entry => (
                  <tr key={entry.date} className="border-b border-gray-200 dark:border-gray-700">
                    <td className="py-2">{entry.date}</td>
                    <td className="py-2">{entry.weight}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Footer with back button */}
        <div className="flex justify-center mb-4">
          <button 
            onClick={onExit} 
            className="py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Back to App
          </button>
        </div>
      </div>
    </div>
  );
} 