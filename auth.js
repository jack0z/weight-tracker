// auth.js - Authentication functionality for the Weight Tracker app
import api from './api';
import { toast } from "sonner";
import * as Data from './data.js';

/**
 * Checks if user is already logged in based on localStorage
 * @returns {Object|null} User information if logged in, null otherwise
 */
export function checkExistingLogin() {
  try {
    // For backwards compatibility, check localStorage first
    const userData = localStorage.getItem('weightTrackerUser');
    if (userData) {
      const user = JSON.parse(userData);
      return user;
    }
    
    // Otherwise check for token in localStorage
    const token = localStorage.getItem('weightTrackerToken');
    const username = localStorage.getItem('weightTrackerUsername');
    
    if (token && username) {
      return { username, token };
    }
    
    return null;
  } catch (error) {
    console.error('Error checking login status:', error);
    return null;
  }
}

/**
 * Handles user login
 * @param {string} username - The username to log in with
 * @param {string} password - The password to authenticate with
 * @param {boolean} registering - Whether the user is in registration mode
 * @returns {Object} Results of the login attempt
 */
export async function handleLogin(username, password) {
  try {
    const response = await api.post('/api/auth', {
      action: 'login',
      username,
      password
    });
    
    if (response.data.token) {
      // Store auth data
      localStorage.setItem('weightTrackerToken', response.data.token);
      localStorage.setItem('weightTrackerUsername', username);
      
      return {
        success: true,
        username: username
      };
    } else {
      return {
        success: false,
        error: 'Login failed'
      };
    }
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Login failed'
    };
  }
}

/**
 * Handles user registration
 * @param {string} username - The username to register with
 * @param {string} password - The password to register with
 * @returns {Object} Results of the registration attempt
 */
export async function handleRegister(username, password) {
  try {
    const response = await api.post('/api/auth', {
      action: 'register',
      username,
      password
    });
    
    if (response.data.token) {
      // Store auth data
      localStorage.setItem('weightTrackerToken', response.data.token);
      localStorage.setItem('weightTrackerUsername', username);
      
      return {
        success: true,
        username: username
      };
    } else {
      return {
        success: false,
        error: 'Registration failed'
      };
    }
  } catch (error) {
    console.error('Registration error:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Registration failed'
    };
  }
}

/**
 * Handles user logout
 * @returns {boolean} Whether logout was successful
 */
export function handleLogout() {
  try {
    localStorage.removeItem('weightTrackerToken');
    localStorage.removeItem('weightTrackerUsername');
    localStorage.removeItem('weightTrackerUser'); // For backwards compatibility
    return true;
  } catch (error) {
    console.error('Logout error:', error);
    return false;
  }
}

/**
 * Loads user-specific data
 * @param {string} username - The username to load data for
 * @returns {Object} The loaded user data
 */
export async function loadUserData(username) {
  try {
    // For backwards compatibility, check localStorage first
    const storedData = localStorage.getItem(`weightTracker_${username}`);
    if (storedData) {
      return JSON.parse(storedData);
    }
    
    // Get user entries from API
    const entriesResponse = await api.get(`/api/getEntries?userId=${username}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('weightTrackerToken')}`
      }
    });
    
    // Get user settings from API
    const settingsResponse = await api.get(`/api/getSettings?userId=${username}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('weightTrackerToken')}`
      }
    });
    
    return {
      entries: entriesResponse.data.entries || [],
      settings: settingsResponse.data.settings || { startWeight: null, goalWeight: null, height: null }
    };
  } catch (error) {
    console.error('Error loading user data:', error);
    // Fallback to empty data
    return {
      entries: [],
      settings: { startWeight: null, goalWeight: null, height: null }
    };
  }
}

/**
 * Saves user-specific data
 * @param {string} username - The username to save data for
 * @param {Array} entries - The entries to save
 * @param {Object} settings - The settings to save
 */
export async function saveUserData(username, entries = null, settings = null) {
  try {
    // For backwards compatibility, save to localStorage
    let userData = {
      entries: [],
      settings: { startWeight: null, goalWeight: null, height: null }
    };
    
    // Try to load existing data first
    const existingDataStr = localStorage.getItem(`weightTracker_${username}`);
    if (existingDataStr) {
      userData = JSON.parse(existingDataStr);
    }
    
    // Update with new data
    if (entries !== null) {
      userData.entries = entries;
      
      // Save entries to API - disabled for now as we need to implement bulk save
      // entries.forEach(async (entry) => {
      //   await api.post('/api/addEntry', {
      //     userId: username,
      //     date: entry.date,
      //     weight: entry.weight
      //   }, {
      //     headers: {
      //       'Authorization': `Bearer ${localStorage.getItem('weightTrackerToken')}`
      //     }
      //   });
      // });
    }
    
    if (settings !== null) {
      userData.settings = { ...userData.settings, ...settings };
      
      // Save settings to API
      await api.post('/api/saveSettings', {
        userId: username,
        ...settings
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('weightTrackerToken')}`
        }
      });
    }
    
    // Save updated data to localStorage
    localStorage.setItem(`weightTracker_${username}`, JSON.stringify(userData));
    
    return true;
  } catch (error) {
    console.error('Error saving user data:', error);
    return false;
  }
}

/**
 * Clears all user data
 * @param {string} username - The username to clear data for
 */
export function clearUserData(username) {
  if (!username) return;
  
  const userPrefix = `user_${username}_`;
  
  try {
    // Clear all user-specific data
    localStorage.removeItem(`${userPrefix}entries`);
    localStorage.removeItem(`${userPrefix}start-weight`);
    localStorage.removeItem(`${userPrefix}goal-weight`);
    localStorage.removeItem(`${userPrefix}height`);
  } catch (error) {
    console.error("Error clearing user data:", error);
  }
}

// Helper function to get auth headers
export function getAuthHeaders() {
  const token = localStorage.getItem('weightTrackerToken');
  return {
    'Authorization': `Bearer ${token}`
  };
} 