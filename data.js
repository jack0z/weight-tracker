// data.js - Handles data operations for the weight tracker
import { connectToDatabase } from './lib/mongodb';

// Load entries from storage (localStorage or MongoDB)
async function loadEntries() {
  try {
    console.log("data.js: Loading entries");
    
    // Try MongoDB first
    if (typeof window !== 'undefined' && process.env.MONGODB_URI) {
      const db = await connectToDatabase();
      const collection = db.collection('entries');
      const entries = await collection.find({}).toArray();
      console.log("data.js: Loaded entries from MongoDB:", entries.length);
      return entries;
    }
    
    // Fallback to localStorage
    if (typeof window !== 'undefined') {
      const savedEntries = localStorage.getItem("weight-entries");
      if (!savedEntries) return [];
      const parsedEntries = JSON.parse(savedEntries);
      console.log("data.js: Loaded entries from localStorage:", parsedEntries.length);
      return parsedEntries;
    }

    return [];
  } catch (error) {
    console.error("data.js: Error loading entries:", error);
    return [];
  }
}

// Save entries to storage
async function saveEntries(entries) {
  if (!entries) return false;
  
  try {
    console.log("data.js: Saving entries, count:", entries.length);
    
    // Try MongoDB first
    if (typeof window !== 'undefined' && process.env.MONGODB_URI) {
      const db = await connectToDatabase();
      const collection = db.collection('entries');
      await collection.deleteMany({});
      if (entries.length > 0) {
        await collection.insertMany(entries);
      }
      return true;
    }
    
    // Fallback to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem("weight-entries", JSON.stringify(entries));
      return true;
    }

    return false;
  } catch (error) {
    console.error("data.js: Error saving entries:", error);
    return false;
  }
}

// Load settings with fallback values
async function loadSettings() {
  try {
    console.log("data.js: Loading settings");
    
    const defaultSettings = {
      startWeight: "",
      goalWeight: "",
      height: ""
    };

    // Try MongoDB first
    if (typeof window !== 'undefined' && process.env.MONGODB_URI) {
      const db = await connectToDatabase();
      const collection = db.collection('settings');
      const settings = await collection.findOne({});
      return settings || defaultSettings;
    }
    
    // Fallback to localStorage
    if (typeof window !== 'undefined') {
      return {
        startWeight: parseFloat(localStorage.getItem("start-weight")) || "",
        goalWeight: parseFloat(localStorage.getItem("goal-weight")) || "",
        height: parseFloat(localStorage.getItem("height")) || ""
      };
    }

    return defaultSettings;
  } catch (error) {
    console.error("data.js: Error loading settings:", error);
    return {
      startWeight: "",
      goalWeight: "",
      height: ""
    };
  }
}

// Save setting with error handling
async function saveSetting(key, value) {
  if (!key) return false;
  
  try {
    console.log(`data.js: Saving setting ${key}:`, value);
    
    // Try MongoDB first
    if (typeof window !== 'undefined' && process.env.MONGODB_URI) {
      const db = await connectToDatabase();
      const collection = db.collection('settings');
      await collection.updateOne(
        {},
        { $set: { [key]: value } },
        { upsert: true }
      );
      return true;
    }
    
    // Fallback to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, value);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`data.js: Error saving setting ${key}:`, error);
    return false;
  }
}

// Add a new weight entry
function addEntry(date, weight, entries) {
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
  addEntry,
  deleteEntry,
  formatEntries
};