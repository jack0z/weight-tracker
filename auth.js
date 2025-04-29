// auth.js - Authentication functionality for the Weight Tracker app
import { toast } from "sonner";

/**
 * Checks if user is already logged in based on sessionStorage
 * @returns {Object|null} User information if logged in, null otherwise
 */
export function checkExistingLogin() {
  if (typeof window === 'undefined') return null;
  
  try {
    const savedUser = sessionStorage.getItem("current-user");
    if (savedUser) {
      return JSON.parse(savedUser);
    }
  } catch (error) {
    console.error('Error parsing saved user data:', error);
    // Clear invalid data
    sessionStorage.removeItem("current-user");
  }
  
  return null;
}

/**
 * Loads user data from the server
 * @param {string} username - The username to load data for
 * @returns {Promise<Object>} User data
 */
export async function loadUserData(username) {
  try {
    const response = await fetch(`/.netlify/functions/profile?username=${username}`);
    if (!response.ok) {
      throw new Error('Failed to load user data');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error loading user data:', error);
    toast.error('Failed to load user data');
    return null;
  }
}

/**
 * Saves user data to the server
 * @param {string} username - The username to save data for
 * @param {Array} entries - Weight entries to save
 * @param {Object} settings - User settings to save
 * @returns {Promise<boolean>} Success status
 */
export async function saveUserData(username, entries, settings) {
  try {
    const response = await fetch(`/.netlify/functions/profile?username=${username}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        entries,
        settings
      })
    });

    if (!response.ok) {
      throw new Error('Failed to save user data');
    }

    return true;
  } catch (error) {
    console.error('Error saving user data:', error);
    toast.error('Failed to save user data');
    return false;
  }
}

/**
 * Handles user login
 * @param {string} username - The username
 * @param {string} password - The password
 * @returns {Promise<Object>} Login result
 */
export async function handleLogin(username, password) {
  try {
    const response = await fetch('/.netlify/functions/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    // Store user data in sessionStorage
    const userData = {
      username: data.user.username,
      id: data.user.id,
      startWeight: data.user.startWeight,
      goalWeight: data.user.goalWeight,
      height: data.user.height,
      entries: data.user.entries,
      settings: data.user.settings
    };
    
    sessionStorage.setItem("current-user", JSON.stringify(userData));
    return data;
  } catch (error) {
    console.error('Login error:', error);
    toast.error(error.message || 'Login failed');
    return null;
  }
}

/**
 * Handles user logout
 */
export function handleLogout() {
  sessionStorage.removeItem("current-user");
  window.location.reload();
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