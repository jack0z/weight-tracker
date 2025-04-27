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
 * Handles user login or registration
 * @param {string} username - The username to log in with
 * @param {string} password - The password to authenticate with
 * @param {boolean} registering - Whether the user is in registration mode
 * @returns {Object} Results of the login or registration attempt
 */
export async function handleLogin(username, password, registering) {
  if (!username || !password) {
    toast.error("Please enter username and password");
    return { success: false, message: "Missing credentials" };
  }

  try {
    if (registering) {
      const registerResponse = await fetch('/.netlify/functions/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const registerData = await registerResponse.json();
      
      if (!registerResponse.ok) {
        toast.error(registerData.message);
        return { success: false, message: registerData.message };
      }

      // Auto-login after registration
      sessionStorage.setItem("current-user", username);
      toast.success(`Account created! Welcome, ${username}!`);
      return { success: true, message: "Registration successful", user: { username } };
    }

    // Login flow
    const loginResponse = await fetch('/.netlify/functions/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const loginData = await loginResponse.json();

    if (!loginResponse.ok) {
      toast.error(loginData.message);
      return { success: false, message: loginData.message };
    }

    sessionStorage.setItem("current-user", username);
    toast.success(`Welcome back, ${username}!`);
    return { success: true, message: "Login successful", user: loginData.user };

  } catch (error) {
    console.error("Auth error:", error);
    toast.error("Authentication failed. Please try again.");
    return { success: false, message: "Authentication failed" };
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