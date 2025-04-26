"use client";

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Database, Download, Upload, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import * as Export from "../../export.js";
import { format as dateFormat } from "date-fns";

function DataManagementCard({ colors, entries, setEntries, theme, showToast = true }) {
  const [isImporting, setIsImporting] = useState(false);
  
  // Helper function for safe toast calls
  const safeToast = (type, message) => {
    if (!showToast || !toast || !toast[type]) return;
    toast[type](message);
  };
  
  // Export function
  const exportToCsv = () => {
    try {
      if (!entries || entries.length === 0) {
        safeToast('info', 'No data to export');
        return;
      }

      const success = Export.exportToCsv(entries);
      
      if (success) {
        safeToast('success', `Exported ${entries.length} entries successfully`);
      } else {
        safeToast('error', 'Failed to export data');
      }
    } catch (error) {
      console.error('Export error:', error);
      safeToast('error', `Export failed: ${error.message || 'Unknown error'}`);
    }
  };

  // Import function
  const handleImport = async (event) => {
    try {
      if (!event || !event.target || !event.target.files || !event.target.files[0]) {
        return;
      }
      
      const file = event.target.files[0];
      
      if (!setEntries) {
        safeToast('error', 'Cannot import: setEntries function not available');
        return;
      }
      
      const importedEntries = await Export.importFromFile(file);
      
      if (!importedEntries || importedEntries.length === 0) {
        safeToast('info', 'No valid entries found in file');
        return;
      }
      
      // Merge with existing entries
      setEntries(prevEntries => {
        // Create a map of existing entries by date for quick lookup
        const existingEntriesMap = new Map();
        if (prevEntries && prevEntries.length > 0) {
          prevEntries.forEach(entry => {
            existingEntriesMap.set(entry.date, entry);
          });
        }
        
        // Filter out duplicates
        const newEntries = importedEntries.filter(entry => !existingEntriesMap.has(entry.date));
        
        // Combine and sort all entries
        const combinedEntries = [...(prevEntries || []), ...newEntries].sort((a, b) => 
          new Date(a.date) - new Date(b.date)
        );
        
        safeToast('success', `Imported ${newEntries.length} new entries (${importedEntries.length - newEntries.length} duplicates skipped)`);
        
        return combinedEntries;
      });
      
      // Reset file input
      event.target.value = "";
    } catch (error) {
      console.error('Import error:', error);
      safeToast('error', `Import failed: ${error.message || 'Unknown error'}`);
      
      // Reset file input on error
      if (event && event.target) {
        event.target.value = "";
      }
    }
  };

  // Clear all data
  const clearAllData = () => {
    if (!entries || entries.length === 0) {
      safeToast("error", "No data to clear");
      return;
    }
    
    if (window.confirm("Are you sure you want to delete all weight entries? This cannot be undone!")) {
      if (setEntries) setEntries([]);
      safeToast("success", "All data cleared successfully");
    }
  };

  // Generate data summary
  const getDataSummary = () => {
    if (!entries || entries.length === 0) {
      return { totalEntries: 0, dateRange: 'N/A', weightRange: 'N/A' };
    }

    try {
      // Sort entries by date
      const sortedEntries = [...entries].sort((a, b) => new Date(a.date) - new Date(b.date));
      
      // Get min and max dates
      const earliestDate = sortedEntries[0].date;
      const latestDate = sortedEntries[sortedEntries.length - 1].date;
      
      // Format dates
      const formattedEarliestDate = dateFormat(new Date(earliestDate), 'MMM d, yyyy');
      const formattedLatestDate = dateFormat(new Date(latestDate), 'MMM d, yyyy');
      
      // Get min and max weights
      const weights = sortedEntries.map(entry => parseFloat(entry.weight)).filter(w => !isNaN(w));
      const minWeight = Math.min(...weights);
      const maxWeight = Math.max(...weights);
      
      return {
        totalEntries: entries.length,
        dateRange: `${formattedEarliestDate} to ${formattedLatestDate}`,
        weightRange: `${minWeight.toFixed(1)} kg to ${maxWeight.toFixed(1)} kg`
      };
    } catch (error) {
      console.error('Error generating data summary:', error);
      return { totalEntries: entries.length, dateRange: 'Error', weightRange: 'Error' };
    }
  };

  const summary = entries && entries.length > 0 ? getDataSummary() : null;

  // Common button class to ensure consistent styling
  const buttonBaseClass = "w-full h-10 flex items-center justify-center space-x-2 py-2 px-3 rounded-md";

  return (
    <Card className={`${colors.cardBg} ${colors.border} shadow-xl rounded-lg overflow-hidden`}>
      <CardHeader className={`border-b ${colors.border} pb-3 pt-4 flex justify-center`}>
        <CardTitle className={`${colors.text} text-lg flex items-center`}>
          <Database className="mr-2 h-5 w-5" />
          Data Management
        </CardTitle>
      </CardHeader>
      <CardContent className={`py-4 px-6`}>
        <div className="space-y-4">
          {/* Data summary section */}
          {entries && entries.length > 0 && (
            <div className="mb-4">
              <p className={`mb-3 ${colors.text}`}>
                Your weight data is stored locally in your browser. You can export it as a CSV file for backup or analysis in other applications.
              </p>
              
              <div className={`p-3 rounded-md ${colors.blockBg}`}>
                <p className={`font-medium mb-2 ${colors.text}`}>Current data summary:</p>
                <ul className={`list-disc pl-5 space-y-1 ${colors.text}`}>
                  <li>Total entries: {summary.totalEntries}</li>
                  <li>Date range: {summary.dateRange}</li>
                  <li>Weight range: {summary.weightRange}</li>
                </ul>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Export Data */}
            <div className="flex flex-col h-full">
              <button
                onClick={exportToCsv}
                disabled={!entries || entries.length === 0}
                className={`${buttonBaseClass} ${
                  entries && entries.length > 0
                    ? `${colors.buttonBgPrimary} hover:opacity-90`
                    : `${colors.buttonBgDisabled} cursor-not-allowed`
                }`}
              >
                <Download className="h-4 w-4 text-white" />
                <span className="text-white">Export Data (CSV)</span>
              </button>
              <p className={`text-xs mt-1 ${colors.textMuted}`}>
                Export all your weight entries to a CSV file
              </p>
            </div>
            
            {/* Import Data */}
            <div className="flex flex-col h-full">
              <label
                htmlFor="file-upload"
                className={`${buttonBaseClass} ${colors.buttonBgSecondary} hover:opacity-90 cursor-pointer`}
              >
                <Upload className="h-4 w-4 text-white" />
                <span className="text-white">
                  {isImporting ? "Importing..." : "Import Data (CSV)"}
                </span>
                <input
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  accept=".csv"
                  className="sr-only"
                  onChange={handleImport}
                  disabled={isImporting}
                />
              </label>
              <p className={`text-xs mt-1 ${colors.textMuted}`}>
                Import weight entries from a CSV file
              </p>
            </div>
            
            {/* Clear Data */}
            <div className="flex flex-col h-full">
              <button
                onClick={clearAllData}
                disabled={!entries || entries.length === 0}
                className={`${buttonBaseClass} ${
                  entries && entries.length > 0
                    ? 'bg-red-600 hover:bg-red-700'
                    : `${colors.buttonBgDisabled} cursor-not-allowed`
                }`}
              >
                <Trash2 className="h-4 w-4 text-white" />
                <span className="text-white">Clear All Data</span>
              </button>
              <p className={`text-xs mt-1 ${colors.textMuted}`}>
                Delete all weight entries (cannot be undone)
              </p>
            </div>
          </div>
          
          <div className={`mt-4 p-3 rounded-md ${colors.blockBg} text-sm ${colors.textMuted}`}>
            <p className="mb-2"><strong>Data Format Notes:</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>CSV files should have "date" and "weight" columns</li>
              <li>Dates should be in YYYY-MM-DD format</li>
              <li>Weight can be in any numeric format (e.g., 70.5)</li>
              <li>Duplicate dates will be skipped during import</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default DataManagementCard; 