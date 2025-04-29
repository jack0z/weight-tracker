// data.js - Handles data operations for the weight tracker

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

// Format entries with additional data for display
function formatEntries(entries = [], formatFn) {
  try {
    console.log("data.js: Formatting entries, count:", entries?.length || 0);
    
    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      console.log("data.js: No entries to format");
      return [];
    }
    
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
        id: e._id || e.id || Date.now(), // Handle both MongoDB and local IDs
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

// Add a new weight entry
function addEntry(date, weight, entries = []) {
  try {
    console.log(`data.js: Adding entry - date: ${date}, weight: ${weight}`);
    const newEntry = {
      id: Date.now(),
      date: new Date(date).toISOString(),
      weight: parseFloat(weight)
    };
    
    return [newEntry, ...entries];
  } catch (error) {
    console.error("data.js: Error adding entry:", error);
    return entries;
  }
}

// Delete a weight entry
function deleteEntry(id, entries = []) {
  try {
    console.log(`data.js: Deleting entry with id: ${id}`);
    return entries.filter(entry => entry.id !== id && entry._id !== id);
  } catch (error) {
    console.error("data.js: Error deleting entry:", error);
    return entries;
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