/**
 * SyncUI Component
 * Provides a UI for syncing weight data with MongoDB
 */

import { useEffect, useState } from 'react';
import { syncWithServer } from '../js/sync';

function SyncUI({ onSyncComplete }) {
  const [syncStatus, setSyncStatus] = useState({
    lastSync: null,
    isLoading: false,
    error: null,
    message: null
  });

  // Get last sync time on component mount
  useEffect(() => {
    const lastSyncTimestamp = localStorage.getItem('lastSyncTimestamp');
    if (lastSyncTimestamp) {
      setSyncStatus(prev => ({
        ...prev,
        lastSync: new Date(lastSyncTimestamp)
      }));
    }
  }, []);

  // Format date for display
  const formatDate = (date) => {
    if (!date) return 'Never';
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  };

  // Handle sync button click
  const handleSync = async () => {
    try {
      setSyncStatus(prev => ({
        ...prev,
        isLoading: true,
        error: null,
        message: 'Syncing...'
      }));

      const result = await syncWithServer();

      if (result.success) {
        const message = `Sync complete. Created: ${result.created}, Updated: ${result.updated}${
          result.errors.length ? `, Errors: ${result.errors.length}` : ''
        }`;
        
        setSyncStatus({
          lastSync: new Date(),
          isLoading: false,
          error: null,
          message
        });

        // Notify parent component that sync is complete
        if (onSyncComplete && typeof onSyncComplete === 'function') {
          onSyncComplete();
        }
      } else {
        setSyncStatus({
          ...syncStatus,
          isLoading: false,
          error: result.error || 'Unknown error during sync',
          message: null
        });
      }
    } catch (error) {
      setSyncStatus({
        ...syncStatus,
        isLoading: false,
        error: error.message || 'Error syncing with server',
        message: null
      });
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-4">
      <div className="flex flex-col">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-medium">Data Synchronization</h3>
          <span className="text-sm text-gray-500">
            Last sync: {formatDate(syncStatus.lastSync)}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleSync}
            disabled={syncStatus.isLoading}
            className={`px-4 py-2 text-white rounded-md ${
              syncStatus.isLoading 
                ? 'bg-gray-500' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {syncStatus.isLoading ? 'Syncing...' : 'Sync Now'}
          </button>
          
          {syncStatus.message && (
            <span className="text-sm text-green-600">{syncStatus.message}</span>
          )}
          
          {syncStatus.error && (
            <span className="text-sm text-red-600">{syncStatus.error}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default SyncUI; 