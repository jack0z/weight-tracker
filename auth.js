// auth.js - Authentication functionality for the Weight Tracker app
import { toast } from "sonner";
import * as Data from './data.js';
import { connectToDatabase } from './lib/mongodb';
import { ObjectId } from 'mongodb';

/**
 * Checks if user is already logged in based on sessionStorage
 * @returns {Object|null} User information if logged in, null otherwise
 */
export async function checkExistingLogin() {
  if (typeof window === 'undefined') return null;
  
  const savedUser = sessionStorage.getItem("current-user"); // Changed from localStorage
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
  console.log('Login attempt:', { username });
  
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

      sessionStorage.setItem("current-user", username);
      toast.success(`Account created! Welcome, ${username}!`);
      return { success: true, message: "Registration successful", user: { username } };
    }

    // Note the path starts with a forward slash
    const response = await fetch('/.netlify/functions/login', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });

    console.log('Response:', response.status);
    const data = await response.json();
    console.log('Response data:', data);

    if (!response.ok) {
      console.error('Login failed:', data);
      return { success: false, message: data.message };
    }

    sessionStorage.setItem("current-user", username);
    return { success: true, message: "Login successful", user: data.user };
  } catch (error) {
    console.error("Auth error:", error);
    return { success: false, message: "Authentication failed" };
  }
}

/**
 * Handles user logout
 * @returns {boolean} Whether logout was successful
 */
export function handleLogout() {
  try {
    sessionStorage.removeItem("current-user"); // Changed from localStorage
    toast.success("Logged out successfully");
    return true;
  } catch (error) {
    console.error("Error during logout:", error);
    toast.error("Error logging out");
    return false;
  }
}

/**
 * Loads user-specific data
 * @param {string} username - The username to load data for
 * @returns {Object} The loaded user data
 */
export async function loadUserData(username) {
  if (!username) return null;

  try {
    const db = await connectToDatabase();
    const users = db.collection('users');
    
    const userData = await users.findOne({ username });
    if (!userData) return null;

    return {
      entries: userData.entries || [],
      settings: userData.settings || {
        startWeight: "",
        goalWeight: "",
        height: ""
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
export async function saveUserData(username, entries, settings) {
  if (!username) return;

  try {
    const db = await connectToDatabase();
    const users = db.collection('users');

    const updateData = {};
    if (entries) updateData.entries = entries;
    if (settings) updateData.settings = settings;

    await users.updateOne(
      { username },
      { $set: updateData }
    );
  } catch (error) {
    console.error("Error saving user data:", error);
    toast.error("Error saving your data");
  }
}

/**
 * Clears all user data
 * @param {string} username - The username to clear data for
 */
export async function clearUserData(username) {
  if (!username) return;

  try {
    const db = await connectToDatabase();
    const users = db.collection('users');

    await users.updateOne(
      { username },
      { 
        $set: { 
          entries: [],
          settings: {
            startWeight: "",
            goalWeight: "",
            height: ""
          }
        }
      }
    );
  } catch (error) {
    console.error("Error clearing user data:", error);
    toast.error("Error clearing your data");
  }
}

/**
 * Handles user logout
 * @returns {boolean} Whether logout was successful
 */
export function handleLogout() {
  try {
    sessionStorage.removeItem("current-user");
    return true;
  } catch (error) {
    console.error("Error during logout:", error);
    return false;
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