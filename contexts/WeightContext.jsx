'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import weightService from '@/services/weight-service';

// Create context
const WeightContext = createContext();

// Hook for using the context
export function useWeight() {
  const context = useContext(WeightContext);
  if (!context) {
    throw new Error('useWeight must be used within a WeightProvider');
  }
  return context;
}

// Provider component
export function WeightProvider({ children }) {
  // State for entries
  const [entries, setEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for stats
  const [stats, setStats] = useState(null);
  const [statsIsLoading, setStatsIsLoading] = useState(true);
  const [statsError, setStatsError] = useState(null);
  
  // State for pagination
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 100,
    pages: 1
  });
  
  // State for filter options
  const [filterOptions, setFilterOptions] = useState({
    startDate: null,
    endDate: null,
    period: '30d'
  });

  // Function to load entries
  const loadEntries = useCallback(async (options = {}) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const mergedOptions = { ...filterOptions, ...options };
      
      // Update filter options with the new options
      if (options.startDate !== undefined || options.endDate !== undefined || options.period !== undefined) {
        setFilterOptions(prev => ({ ...prev, ...options }));
      }
      
      const response = await weightService.getEntries({
        startDate: mergedOptions.startDate,
        endDate: mergedOptions.endDate,
        limit: options.limit || pagination.limit,
        page: options.page || pagination.page
      });
      
      setEntries(response.entries || []);
      
      if (response.pagination) {
        setPagination(response.pagination);
      }
      
    } catch (err) {
      console.error('Error loading entries:', err);
      setError(err.message || 'Failed to load weight entries');
    } finally {
      setIsLoading(false);
    }
  }, [filterOptions, pagination.limit, pagination.page]);

  // Function to load stats
  const loadStats = useCallback(async (options = {}) => {
    try {
      setStatsIsLoading(true);
      setStatsError(null);
      
      const mergedOptions = { ...filterOptions, ...options };
      
      // Update filter options with the new options
      if (options.startDate !== undefined || options.endDate !== undefined || options.period !== undefined) {
        setFilterOptions(prev => ({ ...prev, ...options }));
      }
      
      const statsData = await weightService.getStats({
        startDate: mergedOptions.startDate,
        endDate: mergedOptions.endDate,
        period: mergedOptions.period,
        forecastDays: options.forecastDays || 30
      });
      
      setStats(statsData);
    } catch (err) {
      console.error('Error loading stats:', err);
      setStatsError(err.message || 'Failed to load weight statistics');
    } finally {
      setStatsIsLoading(false);
    }
  }, [filterOptions]);
  
  // Function to create a new entry
  const createEntry = async (data) => {
    try {
      const newEntry = await weightService.createEntry(data);
      
      // Refresh data after creating
      await Promise.all([
        loadEntries(),
        loadStats()
      ]);
      
      return newEntry;
    } catch (err) {
      console.error('Error creating entry:', err);
      throw err;
    }
  };
  
  // Function to update an entry
  const updateEntry = async (entryId, data) => {
    try {
      const updatedEntry = await weightService.updateEntry(entryId, data);
      
      // Refresh data after updating
      await Promise.all([
        loadEntries(),
        loadStats()
      ]);
      
      return updatedEntry;
    } catch (err) {
      console.error('Error updating entry:', err);
      throw err;
    }
  };
  
  // Function to delete an entry
  const deleteEntry = async (entryId) => {
    try {
      const result = await weightService.deleteEntry(entryId);
      
      // Refresh data after deleting
      await Promise.all([
        loadEntries(),
        loadStats()
      ]);
      
      return result;
    } catch (err) {
      console.error('Error deleting entry:', err);
      throw err;
    }
  };
  
  // Function to handle bulk operations for importing data
  const importEntries = async (entries) => {
    try {
      // For each entry, create it via the API
      let successCount = 0;
      let errorCount = 0;
      
      // Process in batches to avoid overwhelming the server
      const batchSize = 10;
      
      for (let i = 0; i < entries.length; i += batchSize) {
        const batch = entries.slice(i, i + batchSize);
        
        // Process batch in parallel
        const results = await Promise.allSettled(
          batch.map(entry => weightService.createEntry(entry))
        );
        
        // Count successes and failures
        results.forEach(result => {
          if (result.status === 'fulfilled') {
            successCount++;
          } else {
            errorCount++;
            console.error('Failed to import entry:', result.reason);
          }
        });
      }
      
      // Refresh data after importing
      await Promise.all([
        loadEntries(),
        loadStats()
      ]);
      
      return { successCount, errorCount };
    } catch (err) {
      console.error('Error importing entries:', err);
      throw err;
    }
  };
  
  // Function to clear all data
  const clearAllData = async () => {
    if (!entries || entries.length === 0) {
      return { deleted: 0 };
    }
    
    try {
      // Delete each entry via the API
      let deletedCount = 0;
      
      // Process in batches to avoid overwhelming the server
      const batchSize = 10;
      
      for (let i = 0; i < entries.length; i += batchSize) {
        const batch = entries.slice(i, i + batchSize);
        
        // Process batch in parallel
        const results = await Promise.allSettled(
          batch.map(entry => weightService.deleteEntry(entry._id))
        );
        
        // Count successes
        deletedCount += results.filter(result => result.status === 'fulfilled').length;
      }
      
      // Refresh data after clearing
      await Promise.all([
        loadEntries(),
        loadStats()
      ]);
      
      return { deleted: deletedCount };
    } catch (err) {
      console.error('Error clearing data:', err);
      throw err;
    }
  };
  
  // Initial data load
  useEffect(() => {
    Promise.all([
      loadEntries(),
      loadStats()
    ]);
  }, [loadEntries, loadStats]);

  // Prepare context value
  const value = {
    // Entries data and operations
    entries,
    isLoading,
    error,
    loadEntries,
    createEntry,
    updateEntry,
    deleteEntry,
    importEntries,
    clearAllData,
    
    // Stats data and operations
    stats,
    statsIsLoading,
    statsError,
    loadStats,
    
    // Pagination
    pagination,
    
    // Filtering
    filterOptions,
    setFilterOptions
  };

  return (
    <WeightContext.Provider value={value}>
      {children}
    </WeightContext.Provider>
  );
}

export default WeightContext; 