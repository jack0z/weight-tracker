"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Button } from "./components/ui/button";
import { format, parseISO, subDays, addDays } from "date-fns";
import { Trash2, Save, TrendingDown, TrendingUp, Minus, Download, Calendar, ArrowRight, Sun, Moon, ZoomIn, ZoomOut, Award, PartyPopper, LogIn, LogOut, Lock, User, Info, Copy, Share2, ExternalLink, Share } from "lucide-react";
import { toast, Toaster } from "sonner";
import dynamic from "next/dynamic";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./components/ui/table";
import { parse } from 'papaparse';

// Dynamically import ApexCharts with no SSR to avoid hydration issues
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function WeightTracker() {
  // States and hooks should all be at the top level
  const [isClient, setIsClient] = useState(false);
  const [weight, setWeight] = useState("");
  const [entries, setEntries] = useState([]);
  const [startWeight, setStartWeight] = useState("");
  const [goalWeight, setGoalWeight] = useState("");
  const [date, setDate] = useState("");
  const [height, setHeight] = useState("");
  const [theme, setTheme] = useState("dark");
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationMessage, setCelebrationMessage] = useState("");
  const [celebrationIcon, setCelebrationIcon] = useState(null);
  const [chartZoom, setChartZoom] = useState({ enabled: false, timeframe: 'all' });
  const [achievedMilestones, setAchievedMilestones] = useState([]);
  
  // Authentication state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [currentUser, setCurrentUser] = useState("");
  
  // New state for import tooltip
  const [showImportTooltip, setShowImportTooltip] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [showShareModal, setShowShareModal] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [viewId, setViewId] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Define colors function outside of any conditions
  const getThemeColors = () => {
    return theme === "dark" 
      ? {
          bg: "bg-[#2b2d31]",
          cardBg: "bg-[#313338]",
          inputBg: "bg-[#1e1f22]",
          border: "border-[#1e1f22]",
          text: "text-[#e3e5e8]",
          textMuted: "text-[#b5bac1]",
          chartColors: ['#5865f2'],
          positive: "text-[#57f287]",
          negative: "text-[#ed4245]",
          neutral: "text-[#fee75c]",
          divider: "bg-[#1e1f22]",
          blockBg: "bg-[#2b2d31]",
          buttonBg: "bg-[#5865f2] hover:bg-[#4752c4]",
          buttonBgSecondary: "bg-[#404249] hover:bg-[#4752c4]",
          buttonText: "text-white"
        }
      : {
          bg: "bg-[#F3EAD3]", // bg0
          cardBg: "bg-[#EAE4CA]", // bg1
          inputBg: "bg-[#939F91]", // input field color
          border: "border-[#DDD8BE]", // bg3
          text: "text-[#5C6A72]", // fg
          textMuted: "text-[#829181]", // gray
          chartColors: ['#8DA101'], // green
          positive: "text-[#126134]", // darker green for positive trends
          negative: "text-[#F85552]", // red
          neutral: "text-[#DFA000]", // yellow
          divider: "bg-[#D8D3BA]", // bg4
          blockBg: "bg-[#E5DFC5]", // bg2
          buttonBg: "bg-[#8DA101] hover:bg-[#798901]", // green buttons
          buttonBgSecondary: "bg-[#939F91] hover:bg-[#8A948C]", // secondary buttons
          buttonText: "text-white"
        };
  };
  
  const colors = getThemeColors();
  
  // Initialize state from localStorage only after component mounts
  useEffect(() => {
    setIsClient(true);
    
    // Check for login status OR view mode
    if (typeof window !== 'undefined') {
      try {
        // Check for view mode in URL
        const urlParams = new URLSearchParams(window.location.search);
        const viewParam = urlParams.get('view');
        
        if (viewParam) {
          console.log("View mode detected:", viewParam);
          // We're in view mode - load shared data
          setViewMode(true);
          setViewId(viewParam);
          
          // Load shared data
          const sharedData = localStorage.getItem(`shared_${viewParam}`);
          console.log("Shared data found:", Boolean(sharedData));
          
          if (sharedData) {
            try {
              const parsedData = JSON.parse(sharedData);
              console.log("Parsed shared data:", {
                hasEntries: Boolean(parsedData.entries),
                entriesCount: parsedData.entries?.length,
                hasStartWeight: Boolean(parsedData.startWeight),
                hasGoalWeight: Boolean(parsedData.goalWeight),
                hasHeight: Boolean(parsedData.height),
                theme: parsedData.theme
              });
              
              if (parsedData.entries) setEntries(parsedData.entries);
              if (parsedData.startWeight !== undefined) setStartWeight(parsedData.startWeight);
              if (parsedData.goalWeight !== undefined) setGoalWeight(parsedData.goalWeight);
              if (parsedData.height !== undefined) setHeight(parsedData.height);
              if (parsedData.theme) setTheme(parsedData.theme);
              
              // Don't load milestones in view mode
              setTimeout(() => {
                toast.success("Viewing shared weight data");
              }, 500);
            } catch (error) {
              console.error("Error parsing shared data:", error);
              setTimeout(() => {
                toast.error("Error loading shared data: " + error.message);
              }, 500);
            }
          } else {
            setTimeout(() => {
              toast.error("Shared data not found or expired");
            }, 500);
          }
        } else {
          // Regular login flow
          const loggedInUser = localStorage.getItem("current-user");
          if (loggedInUser) {
            setIsLoggedIn(true);
            setCurrentUser(loggedInUser);
            
            // Load user-specific data
            loadUserData(loggedInUser);
          } else {
            // If no user is logged in, show login form
            setShowLoginForm(true);
          }
        }
      } catch (err) {
        console.error("Error during initialization:", err);
      }
    }
    
    // Set default date to today
    setDate(format(new Date(), "yyyy-MM-dd"));
    
    // Always stop the loading spinner after initialization
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);
  
  // Load data for a specific user
  const loadUserData = (user) => {
    const userPrefix = `user_${user}_`;
    
    const savedEntries = localStorage.getItem(`${userPrefix}weight-entries`);
    if (savedEntries) {
      setEntries(JSON.parse(savedEntries));
    }
    
    const savedStartWeight = localStorage.getItem(`${userPrefix}start-weight`);
    if (savedStartWeight) {
      setStartWeight(parseFloat(savedStartWeight) || "");
    }
    
    const savedGoalWeight = localStorage.getItem(`${userPrefix}goal-weight`);
    if (savedGoalWeight) {
      setGoalWeight(parseFloat(savedGoalWeight) || "");
    }
    
    const savedHeight = localStorage.getItem(`${userPrefix}height`);
    if (savedHeight) {
      setHeight(parseFloat(savedHeight) || "");
    }
    
    const savedTheme = localStorage.getItem(`${userPrefix}theme`);
    if (savedTheme) {
      setTheme(savedTheme);
    }
    
    const savedMilestones = localStorage.getItem(`${userPrefix}achieved-milestones`);
    if (savedMilestones) {
      setAchievedMilestones(JSON.parse(savedMilestones));
    }
  };
  
  // Save user data with prefix
  useEffect(() => {
    if (isClient && isLoggedIn && entries.length > 0) {
      const userPrefix = `user_${currentUser}_`;
      localStorage.setItem(`${userPrefix}weight-entries`, JSON.stringify(entries));
    }
  }, [entries, isClient, isLoggedIn, currentUser]);

  useEffect(() => {
    if (isClient && isLoggedIn) {
      const userPrefix = `user_${currentUser}_`;
      localStorage.setItem(`${userPrefix}start-weight`, startWeight);
      localStorage.setItem(`${userPrefix}goal-weight`, goalWeight);
      localStorage.setItem(`${userPrefix}height`, height);
    }
  }, [startWeight, goalWeight, height, isClient, isLoggedIn, currentUser]);
  
  // Theme toggle effect
  useEffect(() => {
    if (isClient) {
      const userPrefix = isLoggedIn ? `user_${currentUser}_` : "";
      localStorage.setItem(`${userPrefix}theme`, theme);
      document.documentElement.classList.remove("light", "dark");
      document.documentElement.classList.add(theme);
    }
  }, [theme, isClient, isLoggedIn, currentUser]);
  
  // Save milestones to localStorage
  useEffect(() => {
    if (isClient && isLoggedIn) {
      const userPrefix = `user_${currentUser}_`;
      localStorage.setItem(`${userPrefix}achieved-milestones`, JSON.stringify(achievedMilestones));
    }
  }, [achievedMilestones, isClient, isLoggedIn, currentUser]);
  
  // Login function
  const handleLogin = () => {
    if (!username || !password) {
      toast.error("Please enter username and password");
      return;
    }
    
    // Check if user exists
    const userCredentials = localStorage.getItem(`credentials_${username}`);
    
    if (userCredentials) {
      // User exists, verify password
      const storedPassword = userCredentials;
      
      if (password === storedPassword) {
        // Successful login
        setIsLoggedIn(true);
        setCurrentUser(username);
        setShowLoginForm(false);
        localStorage.setItem("current-user", username);
        
        // Load user data
        loadUserData(username);
        
        toast.success(`Welcome back, ${username}!`);
      } else {
        // Wrong password
        toast.error("Incorrect password");
      }
    } else if (registering) {
      // New user registration
      localStorage.setItem(`credentials_${username}`, password);
      
      // Set as logged in
      setIsLoggedIn(true);
      setCurrentUser(username);
      setShowLoginForm(false);
      localStorage.setItem("current-user", username);
      
      toast.success(`Account created! Welcome, ${username}!`);
    } else {
      // User doesn't exist
      toast.error("User not found. Register a new account?");
      setRegistering(true);
    }
    
    // Clear password field
    setPassword("");
  };
  
  // Logout function
  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser("");
    localStorage.removeItem("current-user");
    
    // Reset state to avoid data leakage
    setEntries([]);
    setStartWeight("");
    setGoalWeight("");
    setHeight("");
    setAchievedMilestones([]);
    
    // Show login form
    setShowLoginForm(true);
    setRegistering(false);
    setUsername("");
    setPassword("");
    
    toast.success("Logged out successfully");
  };
  
  // Theme toggle function
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };
  
  // Generate and save share link
  const generateShareLink = () => {
    if (!isLoggedIn) {
      toast.error("You must be logged in to share your tracker");
      return;
    }
    
    // Generate a unique ID for sharing
    const shareId = `${currentUser}_${Date.now().toString(36)}`;
    
    // Package the data to share
    const dataToShare = {
      entries,
      startWeight,
      goalWeight,
      height,
      theme,
      sharedBy: currentUser,
      sharedAt: new Date().toISOString(),
      expiresAt: addDays(new Date(), 30).toISOString() // Expires in 30 days
    };
    
    try {
      // Save to localStorage
      localStorage.setItem(`shared_${shareId}`, JSON.stringify(dataToShare));
      
      // Generate the full URL
      const baseUrl = window.location.origin + window.location.pathname;
      const shareLink = `${baseUrl}?view=${shareId}`;
      
      setShareLink(shareLink);
      setShowShareModal(true);
    } catch (error) {
      console.error("Error generating share link:", error);
      toast.error("Failed to generate share link: " + error.message);
    }
  };
  
  // Copy share link to clipboard
  const copyShareLink = () => {
    navigator.clipboard.writeText(shareLink)
      .then(() => {
        toast.success("Link copied to clipboard");
      })
      .catch((error) => {
        toast.error("Failed to copy link");
        console.error("Error copying link:", error);
      });
  };
  
  // Excel/CSV import functionality
  const handleFileUpload = (event) => {
    if (viewMode) {
      toast.error("You are in view-only mode");
      return;
    }
    
    const file = event.target.files[0];
    if (!file) return;
    
    // Check file type
    const fileType = file.name.split('.').pop().toLowerCase();
    if (fileType !== 'csv' && fileType !== 'xlsx' && fileType !== 'xls') {
      toast.error("Please upload a CSV or Excel file");
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        // Parse CSV data
        parse(e.target.result, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            if (results.data && results.data.length > 0) {
              const newEntries = [];
              let hasErrors = false;
              
              // Process each row
              results.data.forEach((row, index) => {
                // Look for date and weight columns
                const dateKey = Object.keys(row).find(key => 
                  key.toLowerCase().includes('date') || 
                  key.toLowerCase() === 'day' || 
                  key.toLowerCase() === 'time'
                );
                
                const weightKey = Object.keys(row).find(key => 
                  key.toLowerCase().includes('weight') || 
                  key.toLowerCase() === 'kg' || 
                  key.toLowerCase() === 'lbs'
                );
                
                if (!dateKey || !weightKey) {
                  if (index === 0) { // Only show error for first row
                    toast.error("Couldn't identify date or weight columns in your file");
                  }
                  hasErrors = true;
                  return;
                }
                
                const dateValue = row[dateKey];
                const weightValue = parseFloat(row[weightKey]);
                
                if (!dateValue || isNaN(weightValue)) {
                  hasErrors = true;
                  return;
                }
                
                // Try to parse the date
                let parsedDate;
                try {
                  // Try different date formats
                  if (dateValue.includes('/')) {
                    const parts = dateValue.split('/');
                    if (parts.length === 3) {
                      // Assume MM/DD/YYYY or DD/MM/YYYY format
                      if (parts[0].length <= 2 && parts[1].length <= 2) {
                        parsedDate = new Date(
                          parseInt(parts[2]),
                          parseInt(parts[0]) - 1,
                          parseInt(parts[1])
                        );
                        
                        // If invalid, try DD/MM/YYYY
                        if (isNaN(parsedDate.getTime())) {
                          parsedDate = new Date(
                            parseInt(parts[2]),
                            parseInt(parts[1]) - 1,
                            parseInt(parts[0])
                          );
                        }
                      }
                    }
                  } else if (dateValue.includes('-')) {
                    // Assume YYYY-MM-DD format
                    parsedDate = new Date(dateValue);
                  } else {
                    // Try as a timestamp or other format
                    parsedDate = new Date(dateValue);
                  }
                } catch (err) {
                  hasErrors = true;
                  return;
                }
                
                if (isNaN(parsedDate.getTime())) {
                  hasErrors = true;
                  return;
                }
                
                newEntries.push({
                  id: Date.now() + index,
                  date: parsedDate.toISOString(),
                  weight: weightValue
                });
              });
              
              if (newEntries.length === 0) {
                toast.error("No valid entries found in the file");
                return;
              }
              
              // Sort entries by date (newest first)
              newEntries.sort((a, b) => new Date(b.date) - new Date(a.date));
              
              // Add entries to state
              setEntries([...newEntries, ...entries]);
              
              // Show success message
              toast.success(`Imported ${newEntries.length} weight entries` + 
                            (hasErrors ? " (some rows were skipped due to errors)" : ""));
              
              // Check for milestone achievements
              if (newEntries.length > 0) {
                checkMilestones(newEntries[0]);
              }
            } else {
              toast.error("No data found in the file");
            }
          },
          error: (error) => {
            toast.error("Error parsing file: " + error);
          }
        });
      } catch (error) {
        toast.error("Failed to process file: " + error.message);
      }
    };
    
    reader.readAsText(file);
    
    // Reset the input to allow the same file to be selected again
    event.target.value = null;
  };
  
  const handleSetStart = () => {
    if (viewMode) {
      toast.error("You are in view-only mode");
      return;
    }
    
    if (!startWeight || isNaN(parseFloat(startWeight))) {
      toast.error("Please enter a valid start weight");
      return;
    }
    
    toast.success("Start weight saved");
  };
  
  const handleSetGoal = () => {
    if (viewMode) {
      toast.error("You are in view-only mode");
      return;
    }
    
    if (!goalWeight || isNaN(parseFloat(goalWeight))) {
      toast.error("Please enter a valid goal weight");
      return;
    }
    
    toast.success("Goal weight saved");
  };
  
  // Handle setting height
  const handleSetHeight = () => {
    if (viewMode) {
      toast.error("You are in view-only mode");
      return;
    }
    
    if (!height || isNaN(parseFloat(height))) {
      toast.error("Please enter a valid height");
      return;
    }
    
    toast.success("Height saved");
  };
  
  // Improved milestone checking with more obvious celebrations
  const checkMilestones = (newEntry) => {
    if (!startWeight || !goalWeight || !newEntry) return;
    
    const milestones = [];
    const currentWeight = newEntry.weight;
    const totalWeightChange = Math.abs(startWeight - goalWeight);
    const currentChange = Math.abs(startWeight - currentWeight);
    const percentProgress = (currentChange / totalWeightChange) * 100;
    
    console.log("Checking milestones:", { 
      current: currentWeight, 
      start: startWeight, 
      goal: goalWeight,
      change: currentChange,
      percentProgress
    });
    
    // Weight change milestones
    const changeThresholds = [1, 5, 10, 15, 20];
    for (const kg of changeThresholds) {
      if (currentChange >= kg && !achievedMilestones.includes(`change-${kg}`)) {
        milestones.push({
          id: `change-${kg}`,
          message: `You've changed your weight by ${kg} kg!`,
          icon: <Award className="h-8 w-8 text-amber-400" />
        });
      }
    }
    
    // Progress percentage milestones
    const percentThresholds = [25, 50, 75, 90, 100];
    for (const percent of percentThresholds) {
      if (percentProgress >= percent && !achievedMilestones.includes(`percent-${percent}`)) {
        milestones.push({
          id: `percent-${percent}`,
          message: `You've reached ${percent}% of your goal!`,
          icon: <PartyPopper className="h-8 w-8 text-amber-400" />
        });
      }
    }
    
    // Entry count milestones
    const entryThresholds = [5, 10, 25, 50, 100];
    const entryCount = entries.length + 1;
    for (const count of entryThresholds) {
      if (entryCount === count && !achievedMilestones.includes(`entries-${count}`)) {
        milestones.push({
          id: `entries-${count}`,
          message: `You've logged ${count} weight entries!`,
          icon: <Award className="h-8 w-8 text-blue-400" />
        });
      }
    }
    
    // Show celebration for first milestone or save all for later
    if (milestones.length > 0) {
      console.log("Achievement unlocked!", milestones);
      const milestone = milestones[0];
      setCelebrationMessage(milestone.message);
      setCelebrationIcon(milestone.icon);
      setShowCelebration(true);
      
      // Update achieved milestones
      setAchievedMilestones([...achievedMilestones, ...milestones.map(m => m.id)]);
      
      // Auto-hide celebration after 8 seconds (longer so user can see it)
      setTimeout(() => {
        setShowCelebration(false);
      }, 8000);
    }
  };

  const handleAdd = () => {
    if (viewMode) {
      toast.error("You are in view-only mode");
      return;
    }
    
    if (!weight || isNaN(parseFloat(weight))) {
      toast.error("Please enter a valid weight");
      return;
    }
    
    const newEntry = {
      id: Date.now(),
      date: new Date(date).toISOString(),
      weight: parseFloat(weight)
    };
    
    // Check for milestones before updating state
    checkMilestones(newEntry);
    
    setEntries([newEntry, ...entries]);
    setWeight("");
    toast.success("Weight entry added");
  };
  
  const handleDelete = (id) => {
    if (viewMode) {
      toast.error("You are in view-only mode");
      return;
    }
    
    setEntries(entries.filter(entry => entry.id !== id));
    toast.success("Entry deleted");
  };

  // Format entries first to avoid reference errors in any render path
  const formattedEntries = entries.length > 0 ? entries.map(e => ({
    ...e,
    dateFormatted: format(new Date(e.date), "MMM d, yyyy"),
    dayFormatted: format(new Date(e.date), "EEEE"),
    dateObj: new Date(e.date)
  })).sort((a, b) => b.dateObj - a.dateObj) : [];

  // Calculate all the trend data even if we're in view mode
  const getTrendIcon = (value) => {
    if (!value || value === 0) return <Minus className={`h-4 w-4 ${colors.textMuted}`} />;
    return value < 0 ? 
      <TrendingDown className={`h-4 w-4 ${theme === 'dark' ? 'text-[#57f287]' : 'text-[#126134]'}`} /> : 
      <TrendingUp className={`h-4 w-4 ${colors.negative}`} />;
  };

  // Calculate period averages
  const calculatePeriodAverage = (days) => {
    if (formattedEntries.length < 2) {
      console.log(`${days}-day period: Not enough entries`, { total: formattedEntries.length });
      return { value: 0, hasData: false };
    }
    
    // Use the date of the most recent entry instead of current date
    const mostRecentDate = formattedEntries[0].dateObj;
    const cutoffDate = subDays(mostRecentDate, days);
    
    console.log(`${days}-day period calculation:`, { 
      recentEntryDate: mostRecentDate.toISOString(), 
      cutoffDate: cutoffDate.toISOString(),
      totalEntries: formattedEntries.length,
      firstEntryDate: formattedEntries[0]?.dateObj,
      lastEntryDate: formattedEntries[formattedEntries.length-1]?.dateObj
    });
    
    // Get entries from the specified period
    const recentEntries = formattedEntries.filter(entry => {
      const isIncluded = entry.dateObj >= cutoffDate;
      console.log(`Entry ${format(entry.dateObj, "yyyy-MM-dd")}: ${isIncluded ? "included" : "excluded"} in ${days}-day period`);
      return isIncluded;
    });
    
    console.log(`${days}-day period filtered entries:`, { 
      count: recentEntries.length,
      dates: recentEntries.map(e => format(e.dateObj, "yyyy-MM-dd"))
    });
    
    if (recentEntries.length < 2) {
      console.log(`${days}-day period: Not enough filtered entries`, { filtered: recentEntries.length });
      return { value: 0, hasData: false };
    }
    
    // Calculate the oldest and newest weights in the period
    const oldestEntry = recentEntries[recentEntries.length - 1];
    const newestEntry = recentEntries[0];
    
    // Calculate average daily change
    const daysDiff = Math.max(1, (newestEntry.dateObj - oldestEntry.dateObj) / (1000 * 60 * 60 * 24));
    const weightDiff = newestEntry.weight - oldestEntry.weight;
    const avgDailyChange = weightDiff / daysDiff;
    
    console.log(`${days}-day period result:`, {
      oldest: format(oldestEntry.dateObj, "yyyy-MM-dd"),
      newest: format(newestEntry.dateObj, "yyyy-MM-dd"),
      daysDiff,
      weightDiff,
      avgDailyChange
    });
    
    return { 
      value: avgDailyChange.toFixed(2), 
      hasData: true,
      totalChange: weightDiff.toFixed(1),
      startWeight: oldestEntry.weight,
      endWeight: newestEntry.weight,
      startDate: format(oldestEntry.dateObj, "MMM d"),
      endDate: format(newestEntry.dateObj, "MMM d")
    };
  };

  // Calculate all possible averages
  const sevenDayAvg = entries.length >= 2 ? calculatePeriodAverage(7) : { hasData: false };
  const fourteenDayAvg = entries.length >= 2 ? calculatePeriodAverage(14) : { hasData: false };
  const thirtyDayAvg = entries.length >= 2 ? calculatePeriodAverage(30) : { hasData: false };

  // Calculate BMI
  const calculateBMI = (weightKg, heightCm) => {
    if (!weightKg || !heightCm) return null;
    
    const heightM = heightCm / 100;
    const bmi = weightKg / (heightM * heightM);
    return bmi.toFixed(1);
  };
  
  // Update the BMI category function to use red for Overweight in light mode
  const getBMICategory = (bmi) => {
    if (!bmi) return { category: "", color: "" };
    
    if (bmi < 18.5) return { category: "Underweight", color: theme === 'dark' ? "text-[#fee75c]" : "text-[#DFA000]" };
    if (bmi < 25) return { category: "Healthy", color: theme === 'dark' ? "text-[#57f287]" : "text-[#126134]" };
    if (bmi < 30) return { category: "Overweight", color: theme === 'dark' ? "text-[#fee75c]" : "text-[#F85552]" };
    return { category: "Obese", color: theme === 'dark' ? "text-[#ed4245]" : "text-[#F85552]" };
  };
  
  const currentBMI = entries.length > 0 ? calculateBMI(entries[0].weight, height) : null;
  const bmiCategory = getBMICategory(currentBMI);

  // Calculate weight forecast and target date estimation
  const calculateForecast = () => {
    if (!sevenDayAvg.hasData || !goalWeight) return null;
    
    const avgDailyChange = parseFloat(sevenDayAvg.value);
    if (avgDailyChange === 0) return { isPossible: false, reason: "No change in weight trend" };
    
    const currentWeight = entries[0].weight;
    const weightDifference = goalWeight - currentWeight;
    
    // If weight trend doesn't align with goal (e.g., gaining when goal is to lose)
    if ((weightDifference < 0 && avgDailyChange > 0) || 
        (weightDifference > 0 && avgDailyChange < 0)) {
      return { 
        isPossible: false, 
        reason: weightDifference < 0 
          ? "Currently gaining weight while goal is to lose" 
          : "Currently losing weight while goal is to gain"
      };
    }
    
    // Calculate days needed
    const daysNeeded = Math.abs(Math.round(weightDifference / avgDailyChange));
    
    // Calculate target date
    const today = new Date(entries[0].date);
    const targetDate = addDays(today, daysNeeded);
    
    return {
      isPossible: true,
      daysNeeded,
      targetDate,
      targetDateFormatted: format(targetDate, "MMM d, yyyy"),
      weeklyRate: Math.abs(avgDailyChange * 7).toFixed(1)
    };
  };
  
  const forecast = goalWeight ? calculateForecast() : null;

  // Export data to CSV
  const exportToCsv = () => {
    if (entries.length === 0) {
      toast.error("No data to export");
      return;
    }
    
    // Prepare CSV content
    let csvContent = "Date,Weight (kg)\n";
    
    // Add all entries
    const sortedEntries = [...entries].sort((a, b) => new Date(a.date) - new Date(b.date));
    sortedEntries.forEach(entry => {
      csvContent += `${format(new Date(entry.date), "yyyy-MM-dd")},${entry.weight}\n`;
    });
    
    // Create a blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `weight-data-${format(new Date(), "yyyy-MM-dd")}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Data exported successfully");
  };

  // Helper functions for weight distribution chart
  const getWeightRanges = () => {
    if (formattedEntries.length === 0) return [];
    
    // Get min and max weights
    const weights = formattedEntries.map(entry => entry.weight);
    const minWeight = Math.floor(Math.min(...weights));
    const maxWeight = Math.ceil(Math.max(...weights));
    
    // Create ranges (0.5kg increments)
    const ranges = [];
    for (let i = minWeight; i <= maxWeight; i += 0.5) {
      ranges.push(`${i.toFixed(1)}-${(i + 0.5).toFixed(1)}`);
    }
    
    return ranges;
  };

  const getWeightDistribution = () => {
    if (formattedEntries.length === 0) return [];
    
    const ranges = getWeightRanges();
    const distribution = new Array(ranges.length).fill(0);
    
    // Count days in each weight range
    formattedEntries.forEach(entry => {
      const weight = entry.weight;
      const rangeIndex = Math.floor((weight - Math.floor(Math.min(...formattedEntries.map(e => e.weight)))) * 2);
      if (rangeIndex >= 0 && rangeIndex < distribution.length) {
        distribution[rangeIndex]++;
      }
    });
    
    return distribution;
  };

  // Prepare chart data with dynamic theme colors
  const chartData = entries.length > 0 ? {
    options: {
      chart: {
        type: 'area',
        height: 350,
        toolbar: {
          show: false,
        },
        background: 'transparent',
        fontFamily: 'Inter, sans-serif',
      },
      colors: colors.chartColors,
      dataLabels: {
        enabled: false
      },
      stroke: {
        curve: 'smooth',
        width: 3,
      },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.7,
          opacityTo: 0.2,
          stops: [0, 90, 100],
          colorStops: [
            {
              offset: 0,
              color: colors.chartColors[0],
              opacity: 0.2
            },
            {
              offset: 100,
              color: colors.chartColors[0],
              opacity: 0
            }
          ]
        }
      },
      grid: {
        borderColor: theme === 'dark' ? '#1e1f22' : '#e5e7eb',
        strokeDashArray: 3,
        row: {
          colors: ['transparent'],
          opacity: 0.5
        },
      },
      annotations: {
        yaxis: [
          ...(goalWeight ? [{
            y: goalWeight,
            borderColor: theme === 'dark' ? '#57f287' : '#10b981',
            borderWidth: 2,
            strokeDashArray: 5,
            label: {
              borderColor: theme === 'dark' ? '#57f287' : '#10b981',
              style: {
                color: theme === 'dark' ? '#fff' : '#fff',
                background: theme === 'dark' ? '#57f287' : '#10b981'
              },
              text: 'Goal'
            }
          }] : []),
          ...(startWeight ? [{
            y: startWeight,
            borderColor: theme === 'dark' ? '#fee75c' : '#f59e0b',
            borderWidth: 2,
            strokeDashArray: 5,
            label: {
              borderColor: theme === 'dark' ? '#fee75c' : '#f59e0b',
              style: {
                color: theme === 'dark' ? '#000' : '#000',
                background: theme === 'dark' ? '#fee75c' : '#f59e0b'
              },
              text: 'Start'
            }
          }] : [])
        ]
      },
      xaxis: {
        type: 'datetime',
        categories: [...formattedEntries].reverse().map(e => e.date),
        labels: {
          style: {
            colors: theme === 'dark' ? '#b5bac1' : '#6b7280',
          },
          format: 'MMM dd',
        },
        axisBorder: {
          show: false
        },
        axisTicks: {
          show: false
        }
      },
      yaxis: {
        labels: {
          style: {
            colors: theme === 'dark' ? '#b5bac1' : '#6b7280',
          },
          formatter: (value) => `${value} kg`
        },
      },
      tooltip: {
        theme: theme,
        x: {
          format: 'MMM dd, yyyy'
        },
        y: {
          formatter: (value) => `${value} kg`
        }
      }
    },
    series: [{
      name: 'Weight',
      data: [...formattedEntries].reverse().map(e => e.weight)
    }]
  } : {
    options: {
      chart: {
        type: 'area',
        height: 350,
        toolbar: { show: false },
        background: 'transparent',
      },
      xaxis: { type: 'datetime' }
    },
    series: [{ name: 'Weight', data: [] }]
  };
  
  // Before the viewMode rendering section, add the ViewModeHeader component
  const ViewModeHeader = () => (
    <div className={`flex justify-between items-center mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
      <div className="flex items-center gap-1">
        <h2 className={`text-xl sm:text-2xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
          Weight Tracker
        </h2>
        <button 
          onClick={() => setShowShareModal(true)}
          className={`ml-2 p-2 rounded-full ${theme === 'dark' ? colors.buttonBgSecondary : 'bg-[#8DA101] hover:bg-[#798901]'}`}
          title="Share Your Progress"
        >
          <Share size={16} className={theme === 'dark' ? 'text-white' : 'text-white'} />
        </button>
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={toggleTheme}
          className={`p-2 rounded-full ${theme === 'dark' ? colors.buttonBgSecondary : 'bg-[#8DA101] hover:bg-[#798901]'}`}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? (
            <Sun size={16} className="text-white" />
          ) : (
            <Moon size={16} className="text-white" />
          )}
        </button>
        <button 
          onClick={handleLogout} 
          className={`p-2 rounded-full ${theme === 'dark' ? 'bg-[#ed4245] hover:bg-[#eb2c30]' : 'bg-[#F85552] hover:bg-[#e04b48]'}`}
          title="Log Out"
        >
          <LogOut size={16} className="text-white" />
        </button>
      </div>
    </div>
  );

  if (viewMode) {
    // Create formatted entries specifically for view mode to prevent errors
    const viewFormattedEntries = entries.length > 0 ? entries.map(e => ({
      ...e,
      dateFormatted: format(new Date(e.date), "MMM d, yyyy"),
      dayFormatted: format(new Date(e.date), "EEEE"),
      dateObj: new Date(e.date)
    })).sort((a, b) => b.dateObj - a.dateObj) : [];
    
    console.log("Rendering view mode with", {
      entries: entries.length,
      formattedEntries: viewFormattedEntries.length,
      hasData: entries.length > 0
    });
    
    // Simplified chart data for view mode
    const viewChartData = {
      options: {
        chart: {
          type: 'area',
          height: 350,
          toolbar: {
            show: false,
          },
          background: 'transparent',
          fontFamily: 'Inter, sans-serif',
        },
        colors: colors.chartColors,
        dataLabels: {
          enabled: false
        },
        stroke: {
          curve: 'smooth',
          width: 3,
        },
        fill: {
          type: 'gradient',
          gradient: {
            shadeIntensity: 1,
            opacityFrom: 0.7,
            opacityTo: 0.2,
            stops: [0, 90, 100]
          }
        },
        grid: {
          borderColor: theme === 'dark' ? '#1e1f22' : '#e5e7eb',
          strokeDashArray: 3,
          row: {
            colors: ['transparent'],
            opacity: 0.5
          },
        },
        xaxis: {
          type: 'datetime',
          categories: viewFormattedEntries.length > 0 ? [...viewFormattedEntries].reverse().map(e => e.date) : [],
          labels: {
            style: {
              colors: theme === 'dark' ? '#b5bac1' : '#6b7280',
            },
            format: 'MMM dd',
          }
        },
        yaxis: {
          labels: {
            style: {
              colors: theme === 'dark' ? '#b5bac1' : '#6b7280',
            },
            formatter: (value) => `${value} kg`
          },
        },
        tooltip: {
          theme: theme,
          x: {
            format: 'MMM dd, yyyy'
          },
          y: {
            formatter: (value) => `${value} kg`
          }
        }
      },
      series: [{
        name: 'Weight',
        data: viewFormattedEntries.length > 0 ? [...viewFormattedEntries].reverse().map(e => e.weight) : []
      }]
    };
    
    return (
      <div className={`min-h-screen ${colors.bg} ${colors.text} p-4 md:p-6`}>
        <Toaster 
          position="top-right" 
          toastOptions={{
            style: {
              background: theme === 'dark' ? "#313338" : "#ffffff",
              color: theme === 'dark' ? "#e3e5e8" : "#374151",
              border: `1px solid ${theme === 'dark' ? "#1e1f22" : "#e5e7eb"}`,
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.2)"
            }
          }}
        />
        
        <div className="max-w-6xl mx-auto">
          <ViewModeHeader />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Weight Chart - View Only */}
            <Card className={`${colors.cardBg} ${colors.border} shadow-xl rounded-lg overflow-hidden md:col-span-2`}>
              <CardHeader className={`border-b ${colors.border} pb-3 pt-4 flex justify-center`}>
                <CardTitle className={`${theme === 'dark' ? 'text-[#f2f3f5]' : 'text-gray-800'} text-lg`}>Weight Chart</CardTitle>
              </CardHeader>
              <CardContent className="py-6 px-6">
                <div className="h-[300px]">
                  {entries.length > 0 ? (
                    typeof window !== 'undefined' ? 
                      <Chart 
                        options={viewChartData.options} 
                        series={viewChartData.series} 
                        type="area" 
                        height={300}
                      />
                    : <div>Loading chart...</div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-[#b5bac1]">
                      <p className="mb-2">No data available yet.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Weight History - View Only */}
            <Card className={`${colors.cardBg} ${colors.border} shadow-xl rounded-lg overflow-hidden md:col-span-2`}>
              <CardHeader className={`flex flex-row items-center justify-center border-b ${colors.border} pb-3 pt-4`}>
                <CardTitle className={`${theme === 'dark' ? 'text-[#f2f3f5]' : colors.text} text-lg`}>Weight History</CardTitle>
                <div className={`text-sm ${colors.textMuted} ml-2`}>({entries.length} entries)</div>
              </CardHeader>
              <CardContent className="py-6 px-6">
                <div className="overflow-x-auto max-h-[350px]">
                  {viewFormattedEntries.length > 0 ? (
                    <Table className="w-full">
                      <TableHeader className={`sticky top-0 ${theme === 'dark' ? 'bg-[#313338]' : colors.cardBg} z-10`}>
                        <TableRow className={`border-b ${colors.border}`}>
                          <TableHead className="w-[150px]">Date</TableHead>
                          <TableHead>Day</TableHead>
                          <TableHead>Weight (kg)</TableHead>
                          <TableHead>Change</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {viewFormattedEntries.map((entry, index) => {
                          const prevEntry = viewFormattedEntries[index + 1];
                          const change = prevEntry ? (entry.weight - prevEntry.weight).toFixed(1) : "--";
                          const changeColor = change !== "--" ? 
                            (parseFloat(change) < 0 ? 
                              theme === 'dark' ? 'text-[#57f287]' : 'text-[#126134]' : 
                              parseFloat(change) > 0 ? 
                                theme === 'dark' ? 'text-[#ed4245]' : 'text-[#F85552]' : 
                                '') 
                            : "";
                          
                          return (
                            <TableRow key={entry.id || entry.date}>
                              <TableCell className={`${theme === 'dark' ? 'text-[#e3e5e8]' : colors.text}`}>{entry.dateFormatted}</TableCell>
                              <TableCell className={`${theme === 'dark' ? 'text-[#b5bac1]' : colors.textMuted}`}>{entry.dayFormatted}</TableCell>
                              <TableCell className={`${theme === 'dark' ? 'text-[#e3e5e8] font-medium' : `${colors.text} font-medium`}`}>{entry.weight}</TableCell>
                              <TableCell className={`${changeColor} flex items-center`}>
                                {change !== "--" ? (
                                  <>
                                    <span>{change > 0 ? "+" + change : change}</span>
                                    <span className="ml-1">{getTrendIcon(parseFloat(change))}</span>
                                  </>
                                ) : "--"}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-6 text-[#b5bac1]">
                      <p>No entries available.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Summary Card */}
            {entries.length > 0 && (
              <Card className={`${colors.cardBg} ${colors.border} shadow-xl md:col-span-2 rounded-lg overflow-hidden`}>
                <CardHeader className={`border-b ${colors.border} pb-3 pt-4 flex justify-center`}>
                  <CardTitle className={`${theme === 'dark' ? 'text-[#f2f3f5]' : 'text-gray-800'} text-lg`}>Summary</CardTitle>
                </CardHeader>
                <CardContent className="py-6 px-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className={`${colors.blockBg} p-4 rounded-md`}>
                      <div className={`text-sm ${colors.textMuted} mb-1`}>Current</div>
                      <div className={`text-xl font-bold ${colors.text}`}>{viewFormattedEntries[0]?.weight} kg</div>
                    </div>
                    
                    {goalWeight && (
                      <div className={`${colors.blockBg} p-4 rounded-md`}>
                        <div className={`text-sm ${colors.textMuted} mb-1`}>Goal</div>
                        <div className={`text-xl font-bold ${colors.text}`}>{goalWeight} kg</div>
                      </div>
                    )}
                    
                    {startWeight && entries.length > 0 && (
                      <div className={`${colors.blockBg} p-4 rounded-md`}>
                        <div className={`text-sm ${colors.textMuted} mb-1`}>Total Change</div>
                        <div className="flex items-center">
                          <span className={`text-xl font-bold ${colors.text} mr-1`}>
                            {(viewFormattedEntries[0].weight - startWeight).toFixed(1)} kg
                          </span>
                          {getTrendIcon(viewFormattedEntries[0].weight - startWeight)}
                        </div>
                      </div>
                    )}
                    
                    {entries.length > 1 && (
                      <div className={`${colors.blockBg} p-4 rounded-md`}>
                        <div className={`text-sm ${colors.textMuted} mb-1`}>Last Change</div>
                        <div className="flex items-center">
                          <span className={`text-xl font-bold ${colors.text} mr-1`}>
                            {(viewFormattedEntries[0].weight - viewFormattedEntries[1].weight).toFixed(1)} kg
                          </span>
                          {getTrendIcon(viewFormattedEntries[0].weight - viewFormattedEntries[1].weight)}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Weight Averages Card */}
            {viewFormattedEntries.length > 1 && (
              <Card className={`${colors.cardBg} ${colors.border} shadow-xl md:col-span-2 rounded-lg overflow-hidden mt-2`}>
                <CardHeader className={`border-b ${colors.border} pb-3 pt-4 flex justify-center`}>
                  <CardTitle className={`${theme === 'dark' ? 'text-[#f2f3f5]' : 'text-gray-800'} text-lg`}>Weight Averages</CardTitle>
                </CardHeader>
                <CardContent className="py-6 px-6">
                  <div className="overflow-x-auto">
                    <Table className="w-full">
                      <TableHeader className={`sticky top-0 ${theme === 'dark' ? 'bg-[#313338]' : colors.cardBg} z-10`}>
                        <TableRow className={`border-b ${colors.border}`}>
                          <TableHead>Period</TableHead>
                          <TableHead>Range</TableHead>
                          <TableHead>Starting</TableHead>
                          <TableHead>Current</TableHead>
                          <TableHead>Change</TableHead>
                          <TableHead>Daily Avg</TableHead>
                          <TableHead>Trend</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sevenDayAvg.hasData && (
                          <TableRow>
                            <TableCell className={`${theme === 'dark' ? 'font-medium text-white' : 'font-medium text-gray-800'}`}>7 Days</TableCell>
                            <TableCell>{sevenDayAvg.startDate} - {sevenDayAvg.endDate}</TableCell>
                            <TableCell>{sevenDayAvg.startWeight} kg</TableCell>
                            <TableCell>{sevenDayAvg.endWeight} kg</TableCell>
                            <TableCell 
                              className={`${parseFloat(sevenDayAvg.totalChange) < 0 ? 
                                theme === 'dark' ? 'text-[#57f287]' : 'text-[#126134]' : 
                                parseFloat(sevenDayAvg.totalChange) > 0 ? colors.negative : ''}`}
                            >
                              {sevenDayAvg.totalChange > 0 ? "+" : ""}{sevenDayAvg.totalChange} kg
                            </TableCell>
                            <TableCell>
                              {sevenDayAvg.value > 0 ? "+" : ""}{sevenDayAvg.value} kg/day
                            </TableCell>
                            <TableCell className="flex items-center">
                              {getTrendIcon(parseFloat(sevenDayAvg.value))}
                            </TableCell>
                          </TableRow>
                        )}
                        
                        {fourteenDayAvg.hasData && (
                          <TableRow>
                            <TableCell className={`${theme === 'dark' ? 'font-medium text-white' : 'font-medium text-gray-800'}`}>14 Days</TableCell>
                            <TableCell>{fourteenDayAvg.startDate} - {fourteenDayAvg.endDate}</TableCell>
                            <TableCell>{fourteenDayAvg.startWeight} kg</TableCell>
                            <TableCell>{fourteenDayAvg.endWeight} kg</TableCell>
                            <TableCell 
                              className={`${parseFloat(fourteenDayAvg.totalChange) < 0 ? 
                                theme === 'dark' ? 'text-[#57f287]' : 'text-[#126134]' : 
                                parseFloat(fourteenDayAvg.totalChange) > 0 ? colors.negative : ''}`}
                            >
                              {fourteenDayAvg.totalChange > 0 ? "+" : ""}{fourteenDayAvg.totalChange} kg
                            </TableCell>
                            <TableCell>
                              {fourteenDayAvg.value > 0 ? "+" : ""}{fourteenDayAvg.value} kg/day
                            </TableCell>
                            <TableCell className="flex items-center">
                              {getTrendIcon(parseFloat(fourteenDayAvg.value))}
                            </TableCell>
                          </TableRow>
                        )}
                        
                        {thirtyDayAvg.hasData && (
                          <TableRow>
                            <TableCell className={`${theme === 'dark' ? 'font-medium text-white' : 'font-medium text-gray-800'}`}>30 Days</TableCell>
                            <TableCell>{thirtyDayAvg.startDate} - {thirtyDayAvg.endDate}</TableCell>
                            <TableCell>{thirtyDayAvg.startWeight} kg</TableCell>
                            <TableCell>{thirtyDayAvg.endWeight} kg</TableCell>
                            <TableCell 
                              className={`${parseFloat(thirtyDayAvg.totalChange) < 0 ? 
                                theme === 'dark' ? 'text-[#57f287]' : 'text-[#126134]' : 
                                parseFloat(thirtyDayAvg.totalChange) > 0 ? colors.negative : ''}`}
                            >
                              {thirtyDayAvg.totalChange > 0 ? "+" : ""}{thirtyDayAvg.totalChange} kg
                            </TableCell>
                            <TableCell>
                              {thirtyDayAvg.value > 0 ? "+" : ""}{thirtyDayAvg.value} kg/day
                            </TableCell>
                            <TableCell className="flex items-center">
                              {getTrendIcon(parseFloat(thirtyDayAvg.value))}
                            </TableCell>
                          </TableRow>
                        )}
                        
                        {!sevenDayAvg.hasData && !fourteenDayAvg.hasData && !thirtyDayAvg.hasData && (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-4 text-[#b5bac1]">
                              Need more data points for averages. Add entries over time to see trends.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Weight Distribution Card */}
            {viewFormattedEntries.length > 5 && (
              <Card className={`${colors.cardBg} ${colors.border} shadow-xl md:col-span-2 rounded-lg overflow-hidden mt-2`}>
                <CardHeader className={`border-b ${colors.border} pb-3 pt-4 flex justify-center`}>
                  <CardTitle className={`${theme === 'dark' ? 'text-[#f2f3f5]' : 'text-gray-800'} text-lg`}>Weight Distribution</CardTitle>
                </CardHeader>
                <CardContent className="py-6 px-6">
                  <div className="h-[200px]">
                    {typeof window !== 'undefined' && (
                      <Chart 
                        options={{
                          chart: {
                            type: 'bar',
                            height: 200,
                            toolbar: {
                              show: false,
                            },
                            background: 'transparent',
                            fontFamily: 'Inter, sans-serif',
                          },
                          colors: colors.chartColors,
                          plotOptions: {
                            bar: {
                              horizontal: false,
                              columnWidth: '70%',
                              borderRadius: 4,
                              distributed: true,
                            }
                          },
                          dataLabels: {
                            enabled: false
                          },
                          grid: {
                            borderColor: theme === 'dark' ? '#1e1f22' : '#e5e7eb',
                            strokeDashArray: 3,
                            row: {
                              colors: ['transparent'],
                              opacity: 0.5
                            },
                          },
                          xaxis: {
                            categories: getWeightRanges(),
                            labels: {
                              style: {
                                colors: theme === 'dark' ? '#b5bac1' : '#6b7280',
                              },
                            },
                            axisBorder: {
                              show: false
                            },
                            axisTicks: {
                              show: false
                            }
                          },
                          yaxis: {
                            title: {
                              text: 'Days',
                              style: {
                                color: theme === 'dark' ? '#b5bac1' : '#6b7280'
                              }
                            },
                            labels: {
                              style: {
                                colors: theme === 'dark' ? '#b5bac1' : '#6b7280',
                              },
                            },
                          },
                          tooltip: {
                            theme: theme,
                            y: {
                              formatter: (value) => `${value} days`
                            }
                          }
                        }} 
                        series={[{
                          name: 'Days at Weight',
                          data: getWeightDistribution()
                        }]} 
                        type="bar" 
                        height={200}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    );
  }
  
  // Show login screen if not logged in
  if (showLoginForm) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#2b2d31]' : 'bg-gray-100'} flex items-center justify-center p-4`}>
        <Toaster 
          position="top-right" 
          toastOptions={{
            style: {
              background: theme === 'dark' ? "#313338" : "#ffffff",
              color: theme === 'dark' ? "#e3e5e8" : "#374151",
              border: `1px solid ${theme === 'dark' ? "#1e1f22" : "#e5e7eb"}`,
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.2)"
            }
          }}
        />
        
        <Card className={`w-full max-w-md ${theme === 'dark' ? 'bg-[#313338] border-[#1e1f22]' : 'bg-white border-gray-200'} shadow-xl rounded-lg overflow-hidden`}>
          <CardHeader className={`border-b ${theme === 'dark' ? 'border-[#1e1f22]' : 'border-gray-200'} pb-3 pt-4 flex flex-col items-center`}>
            <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mb-2">
              <User className={`h-8 w-8 ${theme === 'dark' ? 'text-[#5865f2]' : 'text-blue-600'}`} />
            </div>
            <CardTitle className={`${theme === 'dark' ? 'text-[#f2f3f5]' : 'text-gray-800'} text-xl`}>
              {registering ? 'Create Account' : 'Welcome Back'}
            </CardTitle>
            <p className={`text-sm ${theme === 'dark' ? 'text-[#b5bac1]' : 'text-gray-500'} mt-1`}>
              {registering ? 'Register a new account' : 'Log in to access your weight tracker'}
            </p>
          </CardHeader>
          <CardContent className="py-6 px-6">
            <div className="space-y-4">
              <div className="flex flex-col items-center">
                <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-[#b5bac1]' : 'text-gray-700'} mb-2 self-start`}>Username</label>
                <Input
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  type="text"
                  placeholder="Enter your username"
                  className={`${theme === 'dark' ? 'bg-[#1e1f22] border-[#1e1f22] text-[#e3e5e8]' : 'bg-gray-50 border-gray-200 text-gray-900'} h-10 pl-3 w-full`}
                />
              </div>
              <div className="flex flex-col items-center">
                <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-[#b5bac1]' : 'text-gray-700'} mb-2 self-start`}>Password</label>
                <Input
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  type="password"
                  placeholder="Enter your password"
                  className={`${theme === 'dark' ? 'bg-[#1e1f22] border-[#1e1f22] text-[#e3e5e8]' : 'bg-gray-50 border-gray-200 text-gray-900'} h-10 pl-3 w-full`}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      handleLogin();
                    }
                  }}
                />
              </div>
              <button
                onClick={handleLogin}
                className={`w-full mt-2 py-2 ${theme === 'dark' ? 'bg-[#5865f2] hover:bg-[#4752c4]' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-md flex items-center justify-center`}
              >
                {registering ? (
                  <>
                    <LogIn className="h-4 w-4 mr-2" />
                    Create Account
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Sign In
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setRegistering(!registering);
                  setPassword("");
                }}
                className={`w-full mt-2 py-2 ${theme === 'dark' ? 'bg-[#404249] hover:bg-[#4752c4]' : 'bg-gray-200 hover:bg-gray-300'} text-white rounded-md`}
              >
                {registering ? 'Back to Login' : 'Create New Account'}
              </button>
              <div className="text-center mt-4">
                <button
                  onClick={toggleTheme}
                  className={`p-2 rounded-full ${theme === 'dark' ? 'bg-[#404249] hover:bg-[#4752c4]' : 'bg-gray-200 hover:bg-gray-300'}`}
                  title="Toggle theme"
                >
                  {theme === 'dark' ? (
                    <Sun className="h-4 w-4 text-white" />
                  ) : (
                    <Moon className="h-4 w-4 text-gray-700" />
                  )}
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Rest of the main UI
  // ... rest of the code ...
  
  // Show share modal
  const ShareModal = () => (
    <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className={`${colors.cardBg} ${colors.border} rounded-lg p-6 shadow-2xl max-w-md w-full mx-4`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Share Your Weight Tracker
          </h3>
          <button 
            onClick={() => setShowShareModal(false)}
            className={`p-1 rounded-full ${theme === 'dark' ? 'hover:bg-[#4b4b4b]' : 'hover:bg-gray-200'}`}
          >
            <Minus className={`h-5 w-5 ${colors.text}`} />
          </button>
        </div>
        
        <p className={`mb-4 ${colors.textMuted}`}>
          Share this link with others to let them view your weight tracking data in read-only mode:
        </p>
        
        <div className="flex items-center mb-6">
          <input 
            type="text" 
            value={shareLink} 
            readOnly 
            className={`flex-1 ${colors.inputBg} ${colors.border} ${colors.text} p-2 rounded-l-md`}
          />
          <button 
            onClick={copyShareLink}
            className={`p-2 ${theme === 'dark' ? 'bg-[#5865f2] hover:bg-[#4752c4]' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-r-md`}
          >
            <Copy className="h-5 w-5" />
          </button>
        </div>
        
        <div className={`p-3 rounded-md ${theme === 'dark' ? 'bg-[#2b2d31]' : 'bg-gray-100'} ${colors.textMuted} text-sm`}>
          <p className="mb-1">⚠️ Important notes:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>The link expires in 30 days</li>
            <li>Shared data is stored locally in your browser</li>
            <li>Anyone with this link can view your data but cannot edit it</li>
            <li>Updates to your tracker will be visible to anyone with the link</li>
          </ul>
        </div>
      </div>
    </div>
  );

  // Import format tooltip
  const ImportTooltip = () => (
    <div className="absolute z-10 w-80 p-4 rounded-md shadow-lg bg-gray-900 text-white text-sm right-0 top-full mt-1">
      <h4 className="font-bold mb-2">Expected Format:</h4>
      <p className="mb-2">Your Excel/CSV file should have:</p>
      <ul className="list-disc pl-5 mb-2 space-y-1">
        <li>A column for dates (labeled "Date", "Day", or similar)</li>
        <li>A column for weights (labeled "Weight", "kg", or similar)</li>
        <li>Optional header row</li>
      </ul>
      <div className="border border-gray-700 p-2 mb-2 bg-gray-800 rounded">
        <code>Date,Weight<br/>2023-01-01,80.5<br/>2023-01-02,80.2<br/>2023-01-03,79.8</code>
      </div>
      <p>Supported date formats: DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD</p>
    </div>
  );
  
  // Main UI return
  return (
    <div className={`min-h-screen ${colors.bg} ${colors.text} p-4 md:p-6`}>
      <Toaster 
        position="top-right" 
        toastOptions={{
          style: {
            background: theme === 'dark' ? "#313338" : "#ffffff",
            color: theme === 'dark' ? "#e3e5e8" : "#374151",
            border: `1px solid ${theme === 'dark' ? "#1e1f22" : "#e5e7eb"}`,
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.2)"
          },
          success: {
            icon: "✅",
          },
          error: {
            icon: "❌",
          }
        }}
      />

      {/* Milestone celebration - more prominent */}
      {showCelebration && (
        <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className={`${colors.cardBg} ${colors.border} rounded-lg p-8 shadow-2xl max-w-md mx-4 animate-pulse`}>
            <div className="flex flex-col items-center text-center gap-6">
              <div className="flex items-center justify-center w-24 h-24 rounded-full bg-amber-100 dark:bg-amber-900">
                {celebrationIcon || <Award className="h-12 w-12 text-amber-500" />}
              </div>
              <div>
                <h3 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>Achievement Unlocked!</h3>
                <p className={`text-lg ${theme === 'dark' ? 'text-[#e3e5e8]' : 'text-gray-600'}`}>{celebrationMessage}</p>
              </div>
              <button 
                onClick={() => setShowCelebration(false)}
                className={`mt-2 px-6 py-3 ${theme === 'dark' ? 'bg-[#5865f2] hover:bg-[#4752c4]' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-md text-lg font-medium`}
              >
                Awesome!
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        <header className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Weight Tracker</h1>
            <p className={colors.textMuted}>Track your weight over time with a simple spreadsheet-like interface</p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`px-3 py-1 rounded-full ${theme === 'dark' ? 'bg-[#404249]' : colors.blockBg} flex items-center`}>
              <User className="h-4 w-4 mr-1" />
              <span className="text-sm">{currentUser}</span>
            </div>
            <button 
              onClick={generateShareLink}
              className={`p-2 rounded-full ${theme === 'dark' ? colors.buttonBgSecondary : 'bg-[#8DA101] hover:bg-[#798901]'}`}
              aria-label="Share"
              title="Share your tracker (view-only)"
            >
              <Share2 className={`h-5 w-5 ${theme === 'dark' ? 'text-white' : 'text-white'}`} />
            </button>
            <button 
              onClick={toggleTheme} 
              className={`p-2 rounded-full ${theme === 'dark' ? colors.buttonBgSecondary : 'bg-[#8DA101] hover:bg-[#798901]'} self-start sm:self-auto`}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5 text-white" />
              ) : (
                <Moon className="h-5 w-5 text-white" />
              )}
            </button>
            <button 
              onClick={handleLogout}
              className={`p-2 rounded-full ${theme === 'dark' ? 'bg-[#ed4245] hover:bg-[#eb2c30]' : 'bg-[#F85552] hover:bg-[#e04b48]'}`}
              aria-label="Logout"
            >
              <LogOut className="h-5 w-5 text-white" />
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left column - Settings */}
          <Card className={`${colors.cardBg} ${colors.border} shadow-xl rounded-lg overflow-hidden`}>
            <CardHeader className={`border-b ${colors.border} pb-3 pt-4 flex justify-center`}>
              <CardTitle className={`${theme === 'dark' ? 'text-[#f2f3f5]' : 'text-gray-800'} text-lg`}>Settings</CardTitle>
            </CardHeader>
            <CardContent className="py-6 px-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-[#b5bac1] mb-2 pl-1">Start Weight (kg)</label>
                  <div className="flex space-x-2">
                    <Input
                      value={startWeight}
                      onChange={e => setStartWeight(e.target.value)}
                      type="number"
                      step="0.1"
                      placeholder="e.g. 80.5"
                      className={`${theme === 'dark' ? 'bg-[#1e1f22] border-[#1e1f22] text-[#e3e5e8]' : 'bg-[#EAE4CA] border-[#5C6A72] border-opacity-85 border-2 text-[#5C6A72] rounded-md'} h-10 pl-3`}
                    />
                    <button
                      onClick={handleSetStart}
                      className={`px-4 py-2 h-10 ${colors.buttonBg} ${colors.buttonText} rounded-md flex items-center space-x-1 border ${theme === 'dark' ? 'border-[#4752c4]' : 'border-[#798901]'}`}
                    >
                      <Save className="h-4 w-4 mr-1" />
                      <span>Set</span>
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#b5bac1] mb-2 pl-1">Goal Weight (kg)</label>
                  <div className="flex space-x-2">
                    <Input
                      value={goalWeight}
                      onChange={e => setGoalWeight(e.target.value)}
                      type="number"
                      step="0.1"
                      placeholder="e.g. 75.0"
                      className={`${theme === 'dark' ? 'bg-[#1e1f22] border-[#1e1f22] text-[#e3e5e8]' : 'bg-[#EAE4CA] border-[#5C6A72] border-opacity-85 border-2 text-[#5C6A72] rounded-md'} h-10 pl-3`}
                    />
                    <button
                      onClick={handleSetGoal}
                      className={`px-4 py-2 h-10 ${colors.buttonBg} ${colors.buttonText} rounded-md flex items-center space-x-1 border ${theme === 'dark' ? 'border-[#4752c4]' : 'border-[#798901]'}`}
                    >
                      <Save className="h-4 w-4 mr-1" />
                      <span>Set</span>
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#b5bac1] mb-2 pl-1">Height (cm)</label>
                  <div className="flex space-x-2">
                    <Input
                      value={height}
                      onChange={e => setHeight(e.target.value)}
                      type="number"
                      step="0.1"
                      placeholder="e.g. 175"
                      className={`${theme === 'dark' ? 'bg-[#1e1f22] border-[#1e1f22] text-[#e3e5e8]' : 'bg-[#EAE4CA] border-[#5C6A72] border-opacity-85 border-2 text-[#5C6A72] rounded-md'} h-10 pl-3`}
                    />
                    <button
                      onClick={handleSetHeight}
                      className={`px-4 py-2 h-10 ${colors.buttonBg} ${colors.buttonText} rounded-md flex items-center space-x-1 border ${theme === 'dark' ? 'border-[#4752c4]' : 'border-[#798901]'}`}
                    >
                      <Save className="h-4 w-4 mr-1" />
                      <span>Set</span>
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right column - Chart with zoom controls */}
          <Card className={`${colors.cardBg} ${colors.border} shadow-xl rounded-lg overflow-hidden`}>
            <CardHeader className={`border-b ${colors.border} pb-3 pt-4 flex justify-center`}>
              <CardTitle className={`${theme === 'dark' ? 'text-[#f2f3f5]' : 'text-gray-800'} text-lg`}>Weight Chart</CardTitle>
            </CardHeader>
            <CardContent className="py-6 px-6">
              <div className="h-[300px]">
                {entries.length > 0 ? (
                  typeof window !== 'undefined' ? 
                    <Chart 
                      options={chartData.options} 
                      series={chartData.series} 
                      type="area" 
                      height={300}
                    />
                  : <div>Loading chart...</div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-[#b5bac1]">
                    <p className="mb-2">No data available yet.</p>
                    <button 
                      onClick={() => {
                        const input = document.querySelector('input[type="number"]');
                        if (input) input.focus();
                      }} 
                      className="px-4 py-2 bg-[#5865f2] hover:bg-[#4752c4] text-white rounded-md border border-[#4752c4]"
                    >
                      Add Your First Weight
                    </button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Left column - Add New Entry */}
          <Card className={`${colors.cardBg} ${colors.border} shadow-xl rounded-lg overflow-hidden`}>
            <CardHeader className={`border-b ${colors.border} pb-3 pt-4 flex justify-center`}>
              <CardTitle className={`${theme === 'dark' ? 'text-[#f2f3f5]' : 'text-gray-800'} text-lg`}>Add New Entry</CardTitle>
            </CardHeader>
            <CardContent className="py-6 px-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-[#b5bac1] mb-2 pl-1">Date</label>
                  <Input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className={`${theme === 'dark' ? 'bg-[#1e1f22] border-[#1e1f22] text-[#e3e5e8]' : 'bg-[#EAE4CA] border-[#5C6A72] border-opacity-85 border-2 text-[#5C6A72] rounded-md'} h-10 pl-3 pr-8`}
                    style={{ 
                      backgroundPosition: "calc(100% - 8px) center",
                      backgroundSize: "20px"
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#b5bac1] mb-2 pl-1">Weight (kg)</label>
                  <div className="flex space-x-2">
                    <Input
                      value={weight}
                      onChange={e => setWeight(e.target.value)}
                      type="number"
                      step="0.1"
                      placeholder="Enter weight"
                      className={`${theme === 'dark' ? 'bg-[#1e1f22] border-[#1e1f22] text-[#e3e5e8]' : 'bg-[#EAE4CA] border-[#5C6A72] border-opacity-85 border-2 text-[#5C6A72] rounded-md'} h-10 pl-3`}
                    />
                    <button 
                      onClick={handleAdd} 
                      className={`px-4 py-2 h-10 ${colors.buttonBg} ${colors.buttonText} rounded-md border ${theme === 'dark' ? 'border-[#4752c4]' : 'border-[#798901]'}`}
                    >
                      Add
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#b5bac1] mb-2 pl-1">Import from Excel/CSV</label>
                  <div className="relative">
                    <button 
                      className="ml-1 text-[#b5bac1] hover:text-white focus:outline-none"
                      onMouseEnter={() => setShowImportTooltip(true)}
                      onMouseLeave={() => setShowImportTooltip(false)}
                    >
                      <Info className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex space-x-2">
                    <label 
                      className={`px-4 py-2 ${colors.buttonBg} ${colors.buttonText} rounded-md flex items-center space-x-1 cursor-pointer border ${theme === 'dark' ? 'border-[#4752c4]' : 'border-[#798901]'}`}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      <span>Select File</span>
                      <input 
                        type="file" 
                        accept=".csv,.xlsx,.xls" 
                        onChange={handleFileUpload} 
                        className="hidden" 
                      />
                    </label>
                    <div className={`${theme === 'dark' ? 'text-[#b5bac1]' : 'text-gray-500'} text-sm flex items-center`}>
                      .csv, .xlsx, .xls
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right column - Weight History */}
          <Card className={`${colors.cardBg} ${colors.border} shadow-xl rounded-lg overflow-hidden`}>
            <CardHeader className={`flex flex-row items-center justify-center border-b ${colors.border} pb-3 pt-4`}>
              <CardTitle className={`${theme === 'dark' ? 'text-[#f2f3f5]' : colors.text} text-lg`}>Weight History</CardTitle>
              <div className={`text-sm ${colors.textMuted} ml-2`}>({entries.length} entries)</div>
            </CardHeader>
            <CardContent className="py-6 px-6">
              <div className="overflow-x-auto max-h-[350px]">
                {entries.length > 0 ? (
                  <Table className="w-full">
                    <TableHeader className={`sticky top-0 ${theme === 'dark' ? 'bg-[#313338]' : colors.cardBg} z-10`}>
                      <TableRow className={`border-b ${colors.border}`}>
                        <TableHead className="w-[150px]">Date</TableHead>
                        <TableHead>Day</TableHead>
                        <TableHead>Weight (kg)</TableHead>
                        <TableHead>Change</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {formattedEntries.map((entry, index) => {
                        const prevEntry = formattedEntries[index + 1];
                        const change = prevEntry ? (entry.weight - prevEntry.weight).toFixed(1) : "--";
                        const changeColor = change !== "--" ? 
                          (parseFloat(change) < 0 ? 
                            theme === 'dark' ? 'text-[#57f287]' : 'text-[#126134]' : 
                            parseFloat(change) > 0 ? 
                              theme === 'dark' ? 'text-[#ed4245]' : 'text-[#F85552]' : 
                              '') 
                          : "";
                        
                        return (
                          <TableRow key={entry.id || entry.date}>
                            <TableCell className={`${theme === 'dark' ? 'text-[#e3e5e8]' : colors.text}`}>{entry.dateFormatted}</TableCell>
                            <TableCell className={`${theme === 'dark' ? 'text-[#b5bac1]' : colors.textMuted}`}>{entry.dayFormatted}</TableCell>
                            <TableCell className={`${theme === 'dark' ? 'text-[#e3e5e8] font-medium' : `${colors.text} font-medium`}`}>{entry.weight}</TableCell>
                            <TableCell className={`${changeColor} flex items-center`}>
                              {change !== "--" ? (
                                <>
                                  <span>{change > 0 ? "+" + change : change}</span>
                                  <span className="ml-1">{getTrendIcon(parseFloat(change))}</span>
                                </>
                              ) : "--"}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-6 text-[#b5bac1]">
                    <p>No entries yet. Add your first weight using the form.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Summary Card - Spans full width on larger screens */}
          {entries.length > 0 && (
            <Card className={`${colors.cardBg} ${colors.border} shadow-xl md:col-span-2 rounded-lg overflow-hidden`}>
              <CardHeader className={`border-b ${colors.border} pb-3 pt-4 flex justify-center`}>
                <CardTitle className={`${theme === 'dark' ? 'text-[#f2f3f5]' : 'text-gray-800'} text-lg`}>Summary</CardTitle>
              </CardHeader>
              <CardContent className="py-6 px-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className={`${colors.blockBg} p-4 rounded-md`}>
                    <div className={`text-sm ${colors.textMuted} mb-1`}>Current</div>
                    <div className={`text-xl font-bold ${colors.text}`}>{entries[0].weight} kg</div>
                  </div>
                  
                  {goalWeight && (
                    <div className={`${colors.blockBg} p-4 rounded-md`}>
                      <div className={`text-sm ${colors.textMuted} mb-1`}>Goal</div>
                      <div className={`text-xl font-bold ${colors.text}`}>{goalWeight} kg</div>
                    </div>
                  )}
                  
                  {startWeight && entries.length > 0 && (
                    <div className={`${colors.blockBg} p-4 rounded-md`}>
                      <div className={`text-sm ${colors.textMuted} mb-1`}>Total Change</div>
                      <div className="flex items-center">
                        <span className={`text-xl font-bold ${colors.text} mr-1`}>
                          {(entries[0].weight - startWeight).toFixed(1)} kg
                        </span>
                        {getTrendIcon(entries[0].weight - startWeight)}
                      </div>
                    </div>
                  )}
                  
                  {entries.length > 1 && (
                    <div className={`${colors.blockBg} p-4 rounded-md`}>
                      <div className={`text-sm ${colors.textMuted} mb-1`}>Last Change</div>
                      <div className="flex items-center">
                        <span className={`text-xl font-bold ${colors.text} mr-1`}>
                          {(entries[0].weight - entries[1].weight).toFixed(1)} kg
                        </span>
                        {getTrendIcon(entries[0].weight - entries[1].weight)}
                      </div>
                    </div>
                  )}

                  {/* BMI Card */}
                  {height && entries.length > 0 && (
                    <div className={`${colors.blockBg} p-4 rounded-md`}>
                      <div className={`text-sm ${colors.textMuted} mb-1`}>BMI</div>
                      <div className={`text-xl font-bold ${colors.text}`}>{currentBMI}</div>
                      <div className={`text-sm ${bmiCategory.color} mt-1`}>{bmiCategory.category}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Forecast Card */}
          {entries.length > 0 && goalWeight && sevenDayAvg.hasData && (
            <Card className={`${colors.cardBg} ${colors.border} shadow-xl md:col-span-2 rounded-lg overflow-hidden mt-2`}>
              <CardHeader className={`border-b ${colors.border} pb-3 pt-4 flex justify-center`}>
                <CardTitle className={`${theme === 'dark' ? 'text-[#f2f3f5]' : 'text-gray-800'} text-lg`}>Forecast</CardTitle>
              </CardHeader>
              <CardContent className="py-6 px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Weight Projection */}
                  <div className={`${colors.blockBg} p-4 rounded-md`}>
                    <div className="flex justify-between items-center mb-3">
                      <h3 className={`${theme === 'dark' ? 'text-white' : 'text-gray-800'} text-lg font-medium`}>Weight Projection</h3>
                    </div>
                    
                    {forecast?.isPossible ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className={`${theme === 'dark' ? 'text-[#b5bac1]' : 'text-gray-500'}`}>Current trend:</span>
                          <span className={`${theme === 'dark' ? 'font-medium text-white' : 'font-medium text-gray-800'}`}>
                            {sevenDayAvg.value > 0 ? "+" : ""}{sevenDayAvg.value} kg/day
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={`${theme === 'dark' ? 'text-[#b5bac1]' : 'text-gray-500'}`}>Weekly rate:</span>
                          <span className={`${theme === 'dark' ? 'font-medium text-white' : 'font-medium text-gray-800'}`}>{forecast.weeklyRate} kg/week</span>
                        </div>
                        <div className="h-[1px] w-full bg-[#1e1f22] my-3"></div>
                        <div className="flex items-center justify-between">
                          <span className={`${theme === 'dark' ? 'text-[#b5bac1]' : 'text-gray-500'}`}>Current:</span>
                          <span className={`${theme === 'dark' ? 'font-medium text-white' : 'font-medium text-gray-800'}`}>{entries[0].weight} kg</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={`${theme === 'dark' ? 'text-[#b5bac1]' : 'text-gray-500'}`}>Goal:</span>
                          <span className={`${theme === 'dark' ? 'font-medium text-white' : 'font-medium text-gray-800'}`}>{goalWeight} kg</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={`${theme === 'dark' ? 'text-[#b5bac1]' : 'text-gray-500'}`}>Remaining:</span>
                          <span className={`${theme === 'dark' ? 'font-medium text-white' : 'font-medium text-gray-800'}`}>
                            {Math.abs(goalWeight - entries[0].weight).toFixed(1)} kg
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="py-2 text-[#ed4245]">
                        {forecast ? forecast.reason : "Insufficient data for projection"}
                      </div>
                    )}
                  </div>
                  
                  {/* Target Date */}
                  <div className={`${colors.blockBg} p-4 rounded-md`}>
                    <div className="flex justify-between items-center mb-3">
                      <h3 className={`${theme === 'dark' ? 'text-white' : 'text-gray-800'} text-lg font-medium`}>Target Date Estimation</h3>
                      <Calendar size={20} className={`${theme === 'dark' ? 'text-white' : 'text-[#8DA101]'}`} />
                    </div>
                    
                    {forecast?.isPossible ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className={`${theme === 'dark' ? 'text-[#b5bac1]' : 'text-gray-500'}`}>Estimated time to goal:</span>
                          <span className={`${theme === 'dark' ? 'font-medium text-white' : 'font-medium text-gray-800'}`}>{forecast.daysNeeded} days</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={`${theme === 'dark' ? 'text-[#b5bac1]' : 'text-gray-500'}`}>Target date:</span>
                          <span className={`${theme === 'dark' ? 'font-medium text-white' : 'font-medium text-gray-800'}`}>{forecast.targetDateFormatted}</span>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-[#1e1f22]">
                          <div className="flex items-center space-x-2 text-sm text-[#b5bac1]">
                            <span>Today</span>
                            <div className="flex-1 h-[3px] bg-[#4752c4] rounded-full relative">
                              <div 
                                className="absolute -top-1 left-0 w-2 h-2 rounded-full bg-[#5865f2]"
                                style={{ left: "0%" }}
                              ></div>
                              <div 
                                className="absolute -top-1 right-0 w-2 h-2 rounded-full bg-[#57f287]"
                                style={{ right: "0%" }}
                              ></div>
                            </div>
                            <span>{forecast.targetDateFormatted}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="py-2 text-center flex flex-col items-center space-y-4">
                        <ArrowRight size={32} className={`${theme === 'dark' ? 'text-white' : 'text-gray-500'}`} />
                        <span className={`${theme === 'dark' ? 'text-white' : 'text-gray-500'}`}>
                          {forecast ? forecast.reason : "Set a goal weight and establish a trend"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Export Card */}
          {entries.length > 0 && (
            <Card className={`${colors.cardBg} ${colors.border} shadow-xl md:col-span-2 rounded-lg overflow-hidden mt-2`}>
              <CardHeader className={`border-b ${colors.border} pb-3 pt-4 flex justify-center relative`}>
                <CardTitle className={`${theme === 'dark' ? 'text-[#f2f3f5]' : colors.text} text-lg`}>Data Management</CardTitle>
                <button
                  onClick={exportToCsv}
                  className={`px-3 py-1 ${colors.buttonBg} ${colors.buttonText} rounded-md flex items-center space-x-1 border ${theme === 'dark' ? 'border-[#1e1f22]' : 'border-[#798901]'} absolute right-6`}
                >
                  <Download className="h-4 w-4 mr-1" />
                  <span>Export CSV</span>
                </button>
              </CardHeader>
              <CardContent className="py-6 px-6">
                <div className={`${colors.textMuted}`}>
                  <p>Your weight data is stored locally in your browser. You can export it as a CSV file for backup or analysis in other applications.</p>
                  <div className={`mt-4 ${colors.blockBg} p-4 rounded-md`}>
                    <div className="text-sm">
                      <span className={`${colors.text} font-medium`}>Current data summary:</span>
                      <ul className="mt-2 space-y-1">
                        <li>• Total entries: {entries.length}</li>
                        <li>• Date range: {format(formattedEntries[formattedEntries.length-1].dateObj, "MMM d, yyyy")} to {format(formattedEntries[0].dateObj, "MMM d, yyyy")}</li>
                        <li>• Weight range: {Math.min(...formattedEntries.map(e => e.weight))} kg to {Math.max(...formattedEntries.map(e => e.weight))} kg</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Statistics Card with Average Tables */}
          {entries.length > 1 && (
            <Card className={`${colors.cardBg} ${colors.border} shadow-xl md:col-span-2 rounded-lg overflow-hidden mt-2`}>
              <CardHeader className={`border-b ${colors.border} pb-3 pt-4 flex justify-center`}>
                <CardTitle className={`${theme === 'dark' ? 'text-[#f2f3f5]' : 'text-gray-800'} text-lg`}>Weight Averages</CardTitle>
              </CardHeader>
              <CardContent className="py-6 px-6">
                <div className="overflow-x-auto">
                  <Table className="w-full">
                    <TableHeader className={`sticky top-0 ${theme === 'dark' ? 'bg-[#313338]' : colors.cardBg} z-10`}>
                      <TableRow className={`border-b ${colors.border}`}>
                        <TableHead>Period</TableHead>
                        <TableHead>Range</TableHead>
                        <TableHead>Starting</TableHead>
                        <TableHead>Current</TableHead>
                        <TableHead>Change</TableHead>
                        <TableHead>Daily Avg</TableHead>
                        <TableHead>Trend</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sevenDayAvg.hasData && (
                        <TableRow>
                          <TableCell className={`${theme === 'dark' ? 'font-medium text-white' : 'font-medium text-gray-800'}`}>7 Days</TableCell>
                          <TableCell>{sevenDayAvg.startDate} - {sevenDayAvg.endDate}</TableCell>
                          <TableCell>{sevenDayAvg.startWeight} kg</TableCell>
                          <TableCell>{sevenDayAvg.endWeight} kg</TableCell>
                          <TableCell 
                            className={`${parseFloat(sevenDayAvg.totalChange) < 0 ? 
                              theme === 'dark' ? 'text-[#57f287]' : 'text-[#126134]' : 
                              parseFloat(sevenDayAvg.totalChange) > 0 ? colors.negative : ''}`}
                          >
                            {sevenDayAvg.totalChange > 0 ? "+" : ""}{sevenDayAvg.totalChange} kg
                          </TableCell>
                          <TableCell>
                            {sevenDayAvg.value > 0 ? "+" : ""}{sevenDayAvg.value} kg/day
                          </TableCell>
                          <TableCell className="flex items-center">
                            {getTrendIcon(parseFloat(sevenDayAvg.value))}
                          </TableCell>
                        </TableRow>
                      )}
                      
                      {fourteenDayAvg.hasData && (
                        <TableRow>
                          <TableCell className={`${theme === 'dark' ? 'font-medium text-white' : 'font-medium text-gray-800'}`}>14 Days</TableCell>
                          <TableCell>{fourteenDayAvg.startDate} - {fourteenDayAvg.endDate}</TableCell>
                          <TableCell>{fourteenDayAvg.startWeight} kg</TableCell>
                          <TableCell>{fourteenDayAvg.endWeight} kg</TableCell>
                          <TableCell 
                            className={`${parseFloat(fourteenDayAvg.totalChange) < 0 ? 
                              theme === 'dark' ? 'text-[#57f287]' : 'text-[#126134]' : 
                              parseFloat(fourteenDayAvg.totalChange) > 0 ? colors.negative : ''}`}
                          >
                            {fourteenDayAvg.totalChange > 0 ? "+" : ""}{fourteenDayAvg.totalChange} kg
                          </TableCell>
                          <TableCell>
                            {fourteenDayAvg.value > 0 ? "+" : ""}{fourteenDayAvg.value} kg/day
                          </TableCell>
                          <TableCell className="flex items-center">
                            {getTrendIcon(parseFloat(fourteenDayAvg.value))}
                          </TableCell>
                        </TableRow>
                      )}
                      
                      {thirtyDayAvg.hasData && (
                        <TableRow>
                          <TableCell className={`${theme === 'dark' ? 'font-medium text-white' : 'font-medium text-gray-800'}`}>30 Days</TableCell>
                          <TableCell>{thirtyDayAvg.startDate} - {thirtyDayAvg.endDate}</TableCell>
                          <TableCell>{thirtyDayAvg.startWeight} kg</TableCell>
                          <TableCell>{thirtyDayAvg.endWeight} kg</TableCell>
                          <TableCell 
                            className={`${parseFloat(thirtyDayAvg.totalChange) < 0 ? 
                              theme === 'dark' ? 'text-[#57f287]' : 'text-[#126134]' : 
                              parseFloat(thirtyDayAvg.totalChange) > 0 ? colors.negative : ''}`}
                          >
                            {thirtyDayAvg.totalChange > 0 ? "+" : ""}{thirtyDayAvg.totalChange} kg
                          </TableCell>
                          <TableCell>
                            {thirtyDayAvg.value > 0 ? "+" : ""}{thirtyDayAvg.value} kg/day
                          </TableCell>
                          <TableCell className="flex items-center">
                            {getTrendIcon(parseFloat(thirtyDayAvg.value))}
                          </TableCell>
                        </TableRow>
                      )}
                      
                      {!sevenDayAvg.hasData && !fourteenDayAvg.hasData && !thirtyDayAvg.hasData && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-4 text-[#b5bac1]">
                            Need more data points for averages. Add entries over time to see trends.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Weight Distribution Card */}
          {entries.length > 5 && (
            <Card className={`${colors.cardBg} ${colors.border} shadow-xl md:col-span-2 rounded-lg overflow-hidden mt-2`}>
              <CardHeader className={`border-b ${colors.border} pb-3 pt-4 flex justify-center`}>
                <CardTitle className={`${theme === 'dark' ? 'text-[#f2f3f5]' : 'text-gray-800'} text-lg`}>Weight Distribution</CardTitle>
              </CardHeader>
              <CardContent className="py-6 px-6">
                <div className="h-[200px]">
                  {typeof window !== 'undefined' && (
                    <Chart 
                      options={{
                        chart: {
                          type: 'bar',
                          height: 200,
                          toolbar: {
                            show: false,
                          },
                          background: 'transparent',
                          fontFamily: 'Inter, sans-serif',
                        },
                        colors: colors.chartColors,
                        plotOptions: {
                          bar: {
                            horizontal: false,
                            columnWidth: '70%',
                            borderRadius: 4,
                            distributed: true,
                          }
                        },
                        dataLabels: {
                          enabled: false
                        },
                        grid: {
                          borderColor: theme === 'dark' ? '#1e1f22' : '#e5e7eb',
                          strokeDashArray: 3,
                          row: {
                            colors: ['transparent'],
                            opacity: 0.5
                          },
                        },
                        xaxis: {
                          categories: getWeightRanges(),
                          labels: {
                            style: {
                              colors: theme === 'dark' ? '#b5bac1' : '#6b7280',
                            },
                          },
                          axisBorder: {
                            show: false
                          },
                          axisTicks: {
                            show: false
                          }
                        },
                        yaxis: {
                          title: {
                            text: 'Days',
                            style: {
                              color: theme === 'dark' ? '#b5bac1' : '#6b7280'
                            }
                          },
                          labels: {
                            style: {
                              colors: theme === 'dark' ? '#b5bac1' : '#6b7280',
                            },
                          },
                        },
                        tooltip: {
                          theme: theme,
                          y: {
                            formatter: (value) => `${value} days`
                          }
                        }
                      }} 
                      series={[{
                        name: 'Days at Weight',
                        data: getWeightDistribution()
                      }]} 
                      type="bar" 
                      height={200}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {showShareModal && <ShareModal />}
    </div>
  );
}
