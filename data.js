// data.js - Handles data operations for the weight tracker

// Load entries from localStorage
function loadEntries(userId) {
  try {
    console.log("data.js: Loading entries for userId:", userId);
    if (typeof window === 'undefined') return [];
    
    const key = userId ? `entries_${userId}` : 'entries';
    const storedEntries = localStorage.getItem(key);
    
    if (!storedEntries) {
      console.log("data.js: No stored entries found");
      return [];
    }
    
    const entries = JSON.parse(storedEntries);
    console.log(`data.js: Loaded ${entries.length} entries`);
    return entries;
  } catch (error) {
    console.error("data.js: Error loading entries:", error);
    return [];
  }
}

// Save entries to localStorage
function saveEntries(entries, userId) {
  try {
    if (typeof window === 'undefined') return;
    
    const key = userId ? `entries_${userId}` : 'entries';
    
    if (entries && Array.isArray(entries)) {
      console.log(`data.js: Saving ${entries.length} entries for key ${key}`);
      localStorage.setItem(key, JSON.stringify(entries));
    } else {
      console.warn("data.js: Invalid entries to save:", entries);
    }
  } catch (error) {
    console.error("data.js: Error saving entries:", error);
  }
}

// Load settings (start weight, goal weight, height)
function loadSettings(key, defaultValue, userId) {
  try {
    if (typeof window === 'undefined') return defaultValue;
    
    const storageKey = userId ? `${key}_${userId}` : key;
    const storedValue = localStorage.getItem(storageKey);
    
    if (storedValue === null) return defaultValue;
    
    return JSON.parse(storedValue);
  } catch (error) {
    console.error(`data.js: Error loading setting ${key}:`, error);
    return defaultValue;
  }
}

// Save a setting to localStorage
function saveSetting(key, value, userId) {
  try {
    if (typeof window === 'undefined') return;
    
    const storageKey = userId ? `${key}_${userId}` : key;
    localStorage.setItem(storageKey, JSON.stringify(value));
  } catch (error) {
    console.error(`data.js: Error saving setting ${key}:`, error);
  }
}

// Add a new weight entry
function addEntryLocal(date, weight, entries) {
  try {
    console.log(`data.js: Adding entry - date: ${date}, weight: ${weight}`);
    const newEntry = {
      id: Date.now(),
      date: new Date(date).toISOString(),
      weight: parseFloat(weight)
    };
    
    const updatedEntries = [newEntry, ...entries];
    saveEntries(updatedEntries);
    return updatedEntries;
  } catch (error) {
    console.error("data.js: Error adding entry:", error);
    return entries;
  }
}

// Delete a weight entry
function deleteEntry(id, entries) {
  try {
    console.log(`data.js: Deleting entry with id: ${id}`);
    const updatedEntries = entries.filter(entry => entry.id !== id);
    saveEntries(updatedEntries);
    return updatedEntries;
  } catch (error) {
    console.error("data.js: Error deleting entry:", error);
    return entries;
  }
}

// Format entries with additional data for display
function formatEntries(entries, formatFn) {
  try {
    console.log("data.js: Formatting entries, count:", entries.length);
    
    if (!entries || entries.length === 0) return [];
    
    // Use provided format function or create a fallback
    const getFormattedDate = (date, formatStr) => {
      // Check if format function was provided
      if (formatFn) {
        return formatFn(new Date(date), formatStr);
      } else {
        // Fallback formatting
        const dateObj = new Date(date);
        if (formatStr === "MMM d, yyyy") {
          const month = dateObj.toLocaleString('default', { month: 'short' });
          const day = dateObj.getDate();
          const year = dateObj.getFullYear();
          return `${month} ${day}, ${year}`;
        } else if (formatStr === "EEEE") {
          return dateObj.toLocaleDateString('en-US', { weekday: 'long' });
        } else {
          return dateObj.toLocaleDateString();
        }
      }
    };
    
    const formattedEntries = entries.map(e => {
      const dateObj = new Date(e.date);
      return {
        ...e,
        dateFormatted: getFormattedDate(e.date, "MMM d, yyyy"),
        dayFormatted: getFormattedDate(e.date, "EEEE"),
        dateObj: dateObj
      };
    }).sort((a, b) => b.dateObj - a.dateObj);
    
    console.log("data.js: Formatted entries successfully");
    return formattedEntries;
  } catch (error) {
    console.error("data.js: Error formatting entries:", error);
    return [];
  }
}

// Export functions
export {
  loadEntries,
  saveEntries,
  loadSettings,
  saveSetting,
  addEntryLocal,
  deleteEntry,
  formatEntries
};

export async function syncEntries(userId) {
  try {
    const response = await fetch(`/.netlify/functions/database/entries/${userId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch entries');
    }
    
    const entries = await response.json();
    
    // Update localStorage as backup
    localStorage.setItem(`entries_${userId}`, JSON.stringify(entries));
    
    return entries;
  } catch (error) {
    console.error("Error syncing entries:", error);
    // Fall back to localStorage
    const localEntries = localStorage.getItem(`entries_${userId}`);
    return localEntries ? JSON.parse(localEntries) : [];
  }
}

export async function addEntry(date, weight, entries, userId) {
  // Create new entry
  const newEntry = {
    id: Date.now().toString(),
    date: new Date(date).toISOString(),
    weight: parseFloat(weight)
  };
  
  // Update local entries array
  const localUpdated = [
    newEntry,
    ...entries.filter(entry => entry.date !== date)
  ].sort((a, b) => new Date(b.date) - new Date(a.date));
  
  // Update localStorage as backup
  localStorage.setItem(`entries_${userId}`, JSON.stringify(localUpdated));
  
  // Save to MongoDB
  try {
    await fetch('/.netlify/functions/database/entries', {
      method: 'POST',
      body: JSON.stringify({
        userId,
        date,
        weight
      })
    });
  } catch (error) {
    console.error("Error saving to database:", error);
  }
  
  return localUpdated;
} 