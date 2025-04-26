// data.js - Handles data operations for the weight tracker

import api from './api';
import { v4 as uuidv4 } from 'uuid';
import { format, parse } from 'date-fns';

// Load entries from localStorage
function loadEntries() {
  try {
    console.log("data.js: Loading entries from localStorage");
    const savedEntries = localStorage.getItem("weight-entries");
    console.log("data.js: Raw saved entries:", savedEntries ? "Found (length: " + savedEntries.length + ")" : "Not found");
    
    if (!savedEntries) return [];
    
    const parsedEntries = JSON.parse(savedEntries);
    console.log("data.js: Parsed entries count:", parsedEntries.length);
    return parsedEntries;
  } catch (error) {
    console.error("data.js: Error loading entries:", error);
    return [];
  }
}

// Save entries to localStorage
function saveEntries(entries) {
  try {
    console.log("data.js: Saving entries to localStorage, count:", entries.length);
    localStorage.setItem("weight-entries", JSON.stringify(entries));
    return true;
  } catch (error) {
    console.error("data.js: Error saving entries:", error);
    return false;
  }
}

// Load settings (start weight, goal weight, height)
function loadSettings() {
  try {
    console.log("data.js: Loading settings from localStorage");
    const settings = {
      startWeight: parseFloat(localStorage.getItem("start-weight")) || "",
      goalWeight: parseFloat(localStorage.getItem("goal-weight")) || "",
      height: parseFloat(localStorage.getItem("height")) || ""
    };
    
    console.log("data.js: Loaded settings:", settings);
    return settings;
  } catch (error) {
    console.error("data.js: Error loading settings:", error);
    return {
      startWeight: "",
      goalWeight: "",
      height: ""
    };
  }
}

// Save a setting to localStorage
function saveSetting(key, value) {
  try {
    console.log(`data.js: Saving setting ${key}:`, value);
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.error(`data.js: Error saving setting ${key}:`, error);
    return false;
  }
}

// Format entries array for display
export function formatEntries(entries, dateFormat) {
  if (!entries || !Array.isArray(entries) || entries.length === 0) {
    return [];
  }
  
  // Sort entries by date, newest first
  const sortedEntries = [...entries].sort((a, b) => {
    return new Date(b.date) - new Date(a.date);
  });
  
  // Format entries for display
  return sortedEntries.map(entry => {
    // Create a date object from the entry date
    const dateObj = new Date(entry.date);
    
    return {
      id: entry._id || entry.id,
      date: entry.date,
      dateObj,
      dateFormatted: format(dateObj, 'yyyy-MM-dd'),
      dayFormatted: format(dateObj, 'EEEE'),
      weight: parseFloat(entry.weight)
    };
  });
}

// Add a new entry
export async function addEntry(date, weight, existingEntries = [], userId = null) {
  if (!date || !weight) {
    return existingEntries;
  }
  
  weight = parseFloat(weight);
  if (isNaN(weight)) {
    return existingEntries;
  }
  
  // Get userId from localStorage if not provided
  if (!userId) {
    userId = localStorage.getItem('weightTrackerUsername');
  }
  
  try {
    // First check if we have a token - indicating API mode
    const token = localStorage.getItem('weightTrackerToken');
    
    if (token && userId) {
      // Using API mode
      const response = await api.post('/api/addEntry', {
        userId,
        date,
        weight
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        // Get the new ID from the response
        const newId = response.data.id;
        
        // Create a new entry with the ID from the API
        const newEntry = {
          id: newId,
          _id: newId,
          date,
          weight
        };
        
        // Return updated entries array with the new entry
        return [...existingEntries, newEntry];
      } else {
        console.error('Error adding entry via API');
        return existingEntries;
      }
    } else {
      // Fallback to localStorage mode
      const newEntry = {
        id: uuidv4(),
        date,
        weight
      };
      
      // Check for duplicates and update if exists
      const existingEntryIndex = existingEntries.findIndex(entry => 
        entry.date === date
      );
      
      if (existingEntryIndex !== -1) {
        // Update existing entry
        return existingEntries.map((entry, index) => 
          index === existingEntryIndex ? {...entry, weight} : entry
        );
      } else {
        // Add new entry
        return [...existingEntries, newEntry];
      }
    }
  } catch (error) {
    console.error('Error in addEntry:', error);
    
    // Fallback to local only if API call fails
    const newEntry = {
      id: uuidv4(),
      date,
      weight
    };
    
    return [...existingEntries, newEntry];
  }
}

// Delete an entry by ID
export async function deleteEntry(id, existingEntries = [], userId = null) {
  if (!id || !existingEntries.length) {
    return existingEntries;
  }
  
  // Get userId from localStorage if not provided
  if (!userId) {
    userId = localStorage.getItem('weightTrackerUsername');
  }
  
  try {
    // First check if we have a token - indicating API mode
    const token = localStorage.getItem('weightTrackerToken');
    
    if (token && userId) {
      // Using API mode
      const response = await api.delete(`/api/deleteEntry?id=${id}&userId=${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        // Return entries with the deleted one removed
        return existingEntries.filter(entry => entry.id !== id && entry._id !== id);
      } else {
        console.error('Error deleting entry via API');
        return existingEntries;
      }
    } else {
      // Fallback to localStorage mode
      return existingEntries.filter(entry => entry.id !== id);
    }
  } catch (error) {
    console.error('Error in deleteEntry:', error);
    
    // Fallback to local only if API call fails
    return existingEntries.filter(entry => entry.id !== id);
  }
}

// Export functions
export {
  loadEntries,
  saveEntries,
  loadSettings,
  saveSetting,
  formatEntries,
  addEntry,
  deleteEntry
}; 