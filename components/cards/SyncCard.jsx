/**
 * SyncCard Component
 * Displays synchronization UI in a card format
 */

import { useState } from 'react';
import { syncWithServer } from '../../js/sync';

function SyncCard({ onSyncComplete }) {
  const [syncStatus, setSyncStatus] = useState({
    lastSync: localStorage.getItem('lastSyncTimestamp') 
      ? new Date(localStorage.getItem('lastSyncTimestamp')) 
      : null,
    isLoading: false,
    error: null,
    message: null
  });

  // Format date for display
  const formatDate = (date) => {
    if (!date) return 'Never';
    try {
      return new Intl.DateTimeFormat('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short'
      }).format(date);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
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
          result.errors && result.errors.length ? `, Errors: ${result.errors.length}` : ''
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
        setSyncStatus(prev => ({
          ...prev,
          isLoading: false,
          error: result.error || 'Unknown error during sync',
          message: null
        }));
      }
    } catch (error) {
      setSyncStatus(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Error syncing with server',
        message: null
      }));
    }
  };

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title text-xl font-bold">Cloud Sync</h2>
        <p className="text-sm text-gray-500 mb-4">
          Keep your weight data synchronized across devices
        </p>
        
        <div className="flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm">
              <span className="font-medium">Last sync:</span> {formatDate(syncStatus.lastSync)}
            </div>
            
            <div className="badge badge-outline">
              {syncStatus.lastSync ? 'Synced' : 'Not synced'}
            </div>
          </div>
          
          <div className="flex flex-col gap-3">
            <button
              onClick={handleSync}
              disabled={syncStatus.isLoading}
              className={`btn ${
                syncStatus.isLoading 
                  ? 'btn-disabled'
                  : 'btn-primary'
              }`}
            >
              {syncStatus.isLoading ? 'Syncing...' : 'Sync Now'}
            </button>
            
            {syncStatus.message && (
              <div className="alert alert-success text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{syncStatus.message}</span>
              </div>
            )}
            
            {syncStatus.error && (
              <div className="alert alert-error text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{syncStatus.error}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="divider"></div>
        
        <div className="text-xs text-gray-500">
          <p>Syncing will:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Save your entries to MongoDB cloud storage</li>
            <li>Allow access from other devices</li>
            <li>Keep backups of your weight data</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default SyncCard; 