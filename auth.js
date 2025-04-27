// auth.js - Authentication functionality for the Weight Tracker app
import { toast } from "sonner";
import * as Data from './data.js';
import { connectToDatabase } from './lib/mongodb';
import { ObjectId } from 'mongodb';

/**
 * Checks if user is already logged in based on session
 * @returns {Object|null} User information if logged in, null otherwise
 */
export async function checkExistingLogin() {
  if (typeof window === 'undefined') return null;
  
  const savedUser = sessionStorage.getItem("current-user");
  if (savedUser) {
    return { username: savedUser };
  }
  
  return null;
}

/**
 * Handles user login/registration
 * @param {string} username - The username to log in with
 * @param {string} password - The password to authenticate with
 * @param {boolean} registering - Whether the user is in registration mode
 * @returns {Object} Results of the login attempt
 */
export async function handleLogin(username, password, registering) {
  if (!username || !password) {
    toast.error("Please enter username and password");
    return { success: false, message: "Missing credentials" };
  }

  try {
    const db = await connectToDatabase();
    const users = db.collection('users');

    // Check if user exists
    const existingUser = await users.findOne({ username });

    if (existingUser) {
      if (registering) {
        toast.error("Username already exists");
        return { success: false, message: "Username taken" };
      }

      // Verify password (in production, use proper password hashing)
      if (password === existingUser.password) {
        sessionStorage.setItem("current-user", username);
        toast.success(`Welcome back, ${username}!`);
        return { 
          success: true, 
          message: "Login successful", 
          user: { username } 
        };
      } else {
        toast.error("Incorrect password");
        return { success: false, message: "Incorrect password" };
      }
    } else if (registering) {
      // Create new user
      const result = await users.insertOne({
        username,
        password, // In production, hash the password
        created: new Date(),
        settings: {},
        entries: []
      });

      sessionStorage.setItem("current-user", username);
      toast.success(`Account created! Welcome, ${username}!`);
      return { 
        success: true, 
        message: "Registration successful", 
        user: { username } 
      };
    } else {
      toast.error("User not found. Register a new account?");
      return { 
        success: false, 
        message: "User not found", 
        shouldRegister: true 
      };
    }
  } catch (error) {
    console.error("Database error:", error);
    toast.error("Error connecting to database");
    return { success: false, message: "Database error" };
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