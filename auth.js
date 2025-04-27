// auth.js - Authentication functionality for the Weight Tracker app
import { toast } from "sonner";
import * as Data from './data.js';

/**
 * Checks if user is already logged in based on localStorage
 * @returns {Object|null} User information if logged in, null otherwise
 */
export function checkExistingLogin() {
  if (typeof window === 'undefined') return null;
  
  const savedUser = localStorage.getItem("current-user");
  if (savedUser) {
    return { username: savedUser };
  }
  
  return null;
}

/**
 * Handles user login
 * @param {string} username - The username to log in with
 * @param {string} password - The password to authenticate with
 * @param {boolean} registering - Whether the user is in registration mode
 * @returns {Object} Results of the login attempt
 */
export function handleLogin(username, password, registering) {
  if (!username || !password) {
    toast.error("Please enter username and password");
    return { success: false, message: "Missing credentials" };
  }
  
  // Check if user exists
  const userCredentials = localStorage.getItem(`credentials_${username}`);
  
  if (userCredentials) {
    // User exists, verify password
    const storedPassword = userCredentials;
    
    if (password === storedPassword) {
      // Successful login
      localStorage.setItem("current-user", username);
      
      toast.success(`Welcome back, ${username}!`);
      return { 
        success: true, 
        message: "Login successful", 
        user: { username } 
      };
    } else {
      // Wrong password
      toast.error("Incorrect password");
      return { success: false, message: "Incorrect password" };
    }
  } else if (registering) {
    // New user registration
    localStorage.setItem(`credentials_${username}`, password);
    
    // Set as logged in
    localStorage.setItem("current-user", username);
    
    toast.success(`Account created! Welcome, ${username}!`);
    return { 
      success: true, 
      message: "Registration successful", 
      user: { username } 
    };
  } else {
    // User doesn't exist
    toast.error("User not found. Register a new account?");
    return { 
      success: false, 
      message: "User not found", 
      shouldRegister: true 
    };
  }
}

/**
 * Handles user logout
 * @returns {boolean} Whether logout was successful
 */
export function handleLogout() {
  try {
    localStorage.removeItem("current-user");
    return true;
  } catch (error) {
    console.error("Error during logout:", error);
    return false;
  }
}

/**
 * Loads user-specific data
 * @param {string} username - The username to load data for
 * @returns {Object} The loaded user data
 */
export function loadUserData(username) {
  if (!username) return null;
  
  const userPrefix = `user_${username}_`;
  
  try {
    // Load entries
    const userEntriesJson = localStorage.getItem(`${userPrefix}entries`);
    const userEntries = userEntriesJson ? JSON.parse(userEntriesJson) : [];
    
    // Load settings
    const startWeight = localStorage.getItem(`${userPrefix}start-weight`) || "";
    const goalWeight = localStorage.getItem(`${userPrefix}goal-weight`) || "";
    const height = localStorage.getItem(`${userPrefix}height`) || "";
    
    return {
      entries: userEntries,
      settings: {
        startWeight,
        goalWeight,
        height
      }
    };
  } catch (error) {
    console.error("Error loading user data:", error);
    toast.error("Error loading your data");
    return null;
  }
}

/**
 * Saves user-specific data
 * @param {string} username - The username to save data for
 * @param {Array} entries - The entries to save
 * @param {Object} settings - The settings to save
 */
export function saveUserData(username, entries, settings) {
  if (!username) return;
  
  const userPrefix = `user_${username}_`;
  
  try {
    // Save entries
    if (entries && entries.length > 0) {
      localStorage.setItem(`${userPrefix}entries`, JSON.stringify(entries));
    }
    
    // Save settings
    if (settings) {
      if (settings.startWeight) {
        localStorage.setItem(`${userPrefix}start-weight`, settings.startWeight);
      }
      
      if (settings.goalWeight) {
        localStorage.setItem(`${userPrefix}goal-weight`, settings.goalWeight);
      }
      
      if (settings.height) {
        localStorage.setItem(`${userPrefix}height`, settings.height);
      }
    }
  } catch (error) {
    console.error("Error saving user data:", error);
    toast.error("Error saving your data");
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

/**
 * Handles user registration
 * @param {string} username - The username to register
 * @param {string} password - The password to register
 * @returns {Promise<Object>} The result of the registration attempt
 */
export async function handleRegister(username, password) {
  try {
    const response = await fetch('/.netlify/functions/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message);
    }

    return data;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
}