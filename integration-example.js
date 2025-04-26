/**
 * MongoDB Integration Example
 * 
 * This file demonstrates how to integrate the SyncCard component
 * into your existing Weight Tracker application.
 */

// Import the SyncCard component 
import SyncCard from './components/cards/SyncCard';

// Example of how to integrate SyncCard into your main application
// You would add this code to your main application layout

// In the existing stats and cards section of your application:
{/* Add this card to your grid layout */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
  <ForecastCard forecast={stats.forecast} />
  <DistributionCard distribution={stats.distribution} />
</div>

{/* Add the MongoDB Sync Card */}
<div className="grid grid-cols-1 gap-6 mb-6">
  <SyncCard 
    onSyncComplete={() => {
      // This function will be called when sync completes successfully
      // You might want to refresh your data or show a notification
      toast.success("Data synchronized with MongoDB!");
      
      // Example: refresh your weight entries data
      loadWeightEntries();
    }} 
  />
</div>

{/* Data Management Card */}
<div className="grid grid-cols-1 gap-6">
  <DataManagementCard />
</div>

// Add this to your imports at the top of the file
// import { syncWithServer } from './js/sync';

// Example function to add to your application
// This function can be called when the app loads to auto-sync with the server
async function autoSyncWithServer() {
  try {
    const result = await syncWithServer();
    if (result.success) {
      console.log('Auto-sync completed:', result);
      if (result.created > 0 || result.updated > 0) {
        toast.success(`Sync completed: ${result.created} created, ${result.updated} updated`);
        // Refresh your data if needed
        loadWeightEntries();
      }
    } else {
      console.error('Auto-sync failed:', result.error);
    }
  } catch (error) {
    console.error('Error during auto-sync:', error);
  }
}

// Example of using this in a useEffect
useEffect(() => {
  // Auto-sync on app load (with a short delay)
  const timer = setTimeout(() => {
    autoSyncWithServer();
  }, 2000);
  
  return () => clearTimeout(timer);
}, []); 