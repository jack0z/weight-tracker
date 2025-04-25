"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Button } from "./components/ui/button";
import { format as dateFormat, parseISO, subDays, addDays } from "date-fns";
import { Trash2, Save, TrendingDown, TrendingUp, Minus, Download, Calendar, ArrowRight, LogOut, Sun, Moon, Share2 } from "lucide-react";
import { toast, Toaster } from "sonner";
import dynamic from "next/dynamic";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./components/ui/table";

// Import our modules
import * as Data from './data.js';
import * as Stats from './stats.js';
import * as ChartUtils from './chart.js';
import * as Export from './export.js';
import * as UI from './ui.js';
import * as Auth from './auth.js';
import * as Share from './share.js';

// Import components
import Login from './components/Login.jsx';
import ShareModal from './components/ShareModal.jsx';
import ViewMode from './components/ViewMode.jsx';

// Dynamically import ApexCharts with no SSR to avoid hydration issues
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function WeightTracker() {
  const [isClient, setIsClient] = useState(false);
  const [weight, setWeight] = useState("");
  const [entries, setEntries] = useState([]);
  const [formattedEntries, setFormattedEntries] = useState([]);
  const [startWeight, setStartWeight] = useState("");
  const [goalWeight, setGoalWeight] = useState("");
  const [date, setDate] = useState("");
  const [height, setHeight] = useState("");
  const [forceRender, setForceRender] = useState(false);
  
  // User authentication state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState("");
  const [showLoginForm, setShowLoginForm] = useState(false);
  
  // Theme state
  const [theme, setTheme] = useState("light");
  
  // Chart zoom state
  const [chartZoom, setChartZoom] = useState({ enabled: false, timeframe: 'all' });
  
  // Share functionality state
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [viewMode, setViewMode] = useState(false);
  const [viewData, setViewData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [viewModeError, setViewModeError] = useState("");
  const [isSharingInProgress, setIsSharingInProgress] = useState(false);
  const [shareMessage, setShareMessage] = useState({ type: '', text: '' });
  
  // Add state to track dropdown menu visibility
  const [showShareDropdown, setShowShareDropdown] = useState(false);
  
  // Add state to track if the current share is a permalink
  const [isCurrentSharePermalink, setIsCurrentSharePermalink] = useState(false);
  
  // Toggle theme function
  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    
    // Always save theme preference to localStorage
    localStorage.setItem("theme", newTheme);
    
    // Apply theme directly to document
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    
    // If in view mode, update the viewData theme too
    if (viewMode && viewData) {
      const updatedViewData = {
        ...viewData,
        theme: newTheme
      };
      setViewData(updatedViewData);
      
      // Also update the shared data in localStorage if in a static environment
      if (typeof window !== 'undefined' && window.location.search) {
        const urlParams = new URLSearchParams(window.location.search);
        const viewParam = urlParams.get('view');
        
        if (viewParam) {
          try {
            const storedData = localStorage.getItem(`shared_${viewParam}`);
            if (storedData) {
              const parsedData = JSON.parse(storedData);
              const updatedData = {
                ...parsedData,
                theme: newTheme
              };
              localStorage.setItem(`shared_${viewParam}`, JSON.stringify(updatedData));
              console.log("Updated theme in shared data:", updatedData);
            }
          } catch (error) {
            console.error("Error updating theme in shared data:", error);
          }
        }
      }
    }
  };
  
  // Generate a unique ID for the share link
  function generateShareId(username, usePermalink = false) {
    if (usePermalink) {
      // Create a consistent ID for permalinks - make sure it has a valid format
      return `${username.replace(/[^a-zA-Z0-9_-]/g, '')}_permalink`;
    }
    // Otherwise use timestamp for unique IDs
    return `${username.replace(/[^a-zA-Z0-9_-]/g, '')}_${Date.now().toString(36)}`;
  }

  // This useEffect should run before any others to check for view mode
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // For Netlify deployments, create demo data first
      if (window.location.hostname.includes('netlify.app')) {
        // Always run createDemoShareData
        try {
          createDemoShareData();
          
          // Also create a demo permalink for README link
          createDemoPermalink();
        } catch (error) {
          console.error("Error creating demo data:", error);
        }
      }
      
      // First, check for view mode in URL before doing anything else
      const urlParams = new URLSearchParams(window.location.search);
      const viewParam = urlParams.get('view');
      
      if (viewParam) {
        console.log("View parameter detected:", viewParam);
        // Immediately set view mode to prevent other initializations
        setViewMode(true);
        setIsLoading(true);
        
        // Check if we're in a static export (Netlify) environment
        const isStaticExport = window.location.hostname.includes('netlify.app');
        console.log("Environment:", isStaticExport ? "Static export" : "Dynamic server");
        
        // For Netlify deployments, directly check localStorage
        if (isStaticExport) {
          try {
            let viewData = null;
            
            // Try to get existing data
            const localData = localStorage.getItem(`shared_${viewParam}`);
            if (localData) {
              viewData = JSON.parse(localData);
              console.log("Found view data in localStorage:", viewParam);
            } 
            // If specific data is not found but it's a permalink pattern, create it
            else if (viewParam.includes('permalink')) {
              // Create placeholder data for the permalink
              viewData = createPermalinkData(viewParam.split('_')[0]);
              console.log("Created placeholder data for permalink:", viewParam);
            }
            
            if (viewData) {
              console.log("Using view data:", viewData);
              // Set all related states at once to prevent partial renders
              setViewData(viewData);
              
              // Apply theme from shared data - safer approach
              if (viewData.theme) {
                setTheme(viewData.theme);
              }
              
              // Set loading state after states are updated
              setTimeout(() => {
                setIsLoading(false);
              }, 100);
            } else {
              console.error("No shared data found for:", viewParam);
              setViewModeError("Shared data not found");
              setIsLoading(false);
            }
          } catch (error) {
            console.error("Error loading shared data:", error);
            setViewModeError("Error loading shared data: " + error.message);
            setIsLoading(false);
          }
        } else {
          // For non-static deployments, use the Share module
          (async () => {
            try {
              const result = await Share.loadSharedView(viewParam);
              
              if (result.success) {
                console.log("Shared view loaded successfully");
                setViewData(result.data);
                
                // Apply theme from shared data
                if (result.data.theme) {
                  setTheme(result.data.theme);
                  if (result.data.theme === "dark") {
                    document.documentElement.classList.add("dark");
                  } else {
                    document.documentElement.classList.remove("dark");
                  }
                }
              } else {
                console.error("Failed to load shared view:", result.message);
                setViewModeError(result.message);
              }
            } catch (error) {
              console.error("Error loading shared view:", error);
              setViewModeError("An unexpected error occurred while loading the shared data");
            } finally {
              setIsLoading(false);
            }
          })();
        }
      } else {
        // If not in view mode, check if user is already logged in
        setIsClient(true);
        
        try {
          const existingUser = Auth.checkExistingLogin();
          if (existingUser) {
            setIsLoggedIn(true);
            setCurrentUser(existingUser.username);
            
            // Load user-specific data
            const userData = Auth.loadUserData(existingUser.username);
            if (userData) {
              setEntries(userData.entries);
              const formatted = Data.formatEntries(userData.entries, dateFormat);
              setFormattedEntries(formatted);
              
              if (userData.settings.startWeight) {
                setStartWeight(userData.settings.startWeight);
              }
              
              if (userData.settings.goalWeight) {
                setGoalWeight(userData.settings.goalWeight);
              }
              
              if (userData.settings.height) {
                setHeight(userData.settings.height);
              }
            }
          } else {
            // No user is logged in, show login form
            setShowLoginForm(true);
          }
          
          // Set the current date for new entries
          setDate(dateFormat(new Date(), "yyyy-MM-dd"));
          
          // Load theme preference
          const savedTheme = localStorage.getItem("theme");
          if (savedTheme) {
            setTheme(savedTheme);
          }
        } catch (error) {
          console.error("Error during initial data loading:", error);
        }
      }
    }
  }, []);
  
  // Theme effect should be separated for safety
  useEffect(() => {
    if (!isClient) return;
    
    // Safely apply theme to document
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme, isClient]);

  // Save entries to localStorage when they change
  useEffect(() => {
    if (isClient && isLoggedIn && entries.length > 0) {
      // Save entries to user-specific storage
      Auth.saveUserData(currentUser, entries, null);
      setFormattedEntries(Data.formatEntries(entries, dateFormat));
    }
  }, [entries, isClient, isLoggedIn, currentUser]);

  // Save settings to localStorage when they change
  useEffect(() => {
    if (isClient && isLoggedIn) {
      // Save settings to user-specific storage
      Auth.saveUserData(currentUser, null, {
        startWeight,
        goalWeight,
        height
      });
    }
  }, [startWeight, goalWeight, height, isClient, isLoggedIn, currentUser]);

  // Handle user login
  const handleUserLogin = (user) => {
    setIsLoggedIn(true);
    setCurrentUser(user.username);
    setShowLoginForm(false);
    
    // Load user data
    const userData = Auth.loadUserData(user.username);
    if (userData) {
      setEntries(userData.entries);
      const formatted = Data.formatEntries(userData.entries, dateFormat);
      setFormattedEntries(formatted);
      
      if (userData.settings.startWeight) {
        setStartWeight(userData.settings.startWeight);
      }
      
      if (userData.settings.goalWeight) {
        setGoalWeight(userData.settings.goalWeight);
      }
      
      if (userData.settings.height) {
        setHeight(userData.settings.height);
      }
    }
  };

  // Handle user logout
  const handleUserLogout = () => {
    const success = Auth.handleLogout();
    if (success) {
      setIsLoggedIn(false);
      setCurrentUser("");
      
      // Reset state to avoid data leakage
      setEntries([]);
      setFormattedEntries([]);
      setStartWeight("");
      setGoalWeight("");
      setHeight("");
      
      // Show login form
      setShowLoginForm(true);
      
      toast.success("Logged out successfully", {
        style: {
          background: theme === 'dark' ? "#313338" : "#ffffff",
          color: theme === 'dark' ? "#e3e5e8" : "#374151",
          border: `1px solid ${theme === 'dark' ? "#1e1f22" : "#e5e7eb"}`,
        }
      });
    } else {
      toast.error("Error logging out", {
        style: {
          background: theme === 'dark' ? "#313338" : "#ffffff",
          color: theme === 'dark' ? "#e3e5e8" : "#374151",
          border: `1px solid ${theme === 'dark' ? "#1e1f22" : "#e5e7eb"}`,
        }
      });
    }
  };

  const handleSetStart = () => {
    if (!startWeight || isNaN(parseFloat(startWeight))) {
      toast.error("Please enter a valid start weight");
      return;
    }
    
    toast.success("Start weight saved");
  };
  
  const handleSetGoal = () => {
    if (!goalWeight || isNaN(parseFloat(goalWeight))) {
      toast.error("Please enter a valid goal weight");
      return;
    }
    
    toast.success("Goal weight saved");
  };

  const handleSetHeight = () => {
    if (!height || isNaN(parseFloat(height))) {
      toast.error("Please enter a valid height");
      return;
    }
    
    toast.success("Height saved");
  };

  const handleAdd = () => {
    if (!weight || isNaN(parseFloat(weight))) {
      toast.error("Please enter a valid weight");
      return;
    }
    
    // Use our Data module to add an entry
    const updatedEntries = Data.addEntry(date, weight, entries);
    setEntries(updatedEntries);
    setWeight("");
    toast.success("Weight entry added");
  };
  
  const handleDelete = (id) => {
    // Use our Data module to delete an entry
    const updatedEntries = Data.deleteEntry(id, entries);
    setEntries(updatedEntries);
    toast.success("Entry deleted");
  };

  // Use the UI module's function to get trend icons
  const getTrendIcon = (value) => {
    if (!value || value === 0) return <Minus className={`h-4 w-4 ${colors.textMuted}`} />;
    return value < 0 ? 
      <TrendingDown className={`h-4 w-4 ${theme === 'dark' ? 'text-[#57f287]' : 'text-[#126134]'}`} /> : 
      <TrendingUp className={`h-4 w-4 ${colors.negative}`} />;
  };

  // Use Stats module for calculations
  const sevenDayAvg = Stats.calculatePeriodAverage(formattedEntries, 7);
  const fourteenDayAvg = Stats.calculatePeriodAverage(formattedEntries, 14);
  const thirtyDayAvg = Stats.calculatePeriodAverage(formattedEntries, 30);

  // Use BMI calculation from Stats module
  const calculateBMI = (weightKg, heightCm) => {
    return Stats.calculateBMI(weightKg, heightCm);
  };

  // Add BMI color function
  const getBmiColor = (bmi) => {
    if (!bmi) return '';
    if (bmi < 18.5) return 'text-blue-500';
    if (bmi < 25) return 'text-green-500';
    if (bmi < 30) return 'text-yellow-500';
    return 'text-red-500';
  };

  // Add simple BMI category function
  const getBmiCategory = (bmi) => {
    if (!bmi) return 'No data';
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal weight';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
  };

  // Calculate latest BMI if entries and height exist
  const latestBmi = entries.length > 0 && height ? 
    parseFloat(Stats.calculateBMI(entries[0].weight, height)) : null;

  // Calculate overall change and first entry data
  const firstEntry = entries.length > 0 ? 
    [...entries].sort((a, b) => new Date(a.date) - new Date(b.date))[0] : null;
  
  const overallChange = entries.length > 1 && firstEntry ? 
    parseFloat(entries[0].weight) - parseFloat(firstEntry.weight) : undefined;

  // Calculate progress as percentage towards goal weight
  const calculateProgress = (currentWeight, goalWeight) => {
    if (!currentWeight || !goalWeight || isNaN(goalWeight)) return '-';
    
    // Convert to numbers to ensure proper calculation
    currentWeight = parseFloat(currentWeight);
    goalWeight = parseFloat(goalWeight);
    
    // If goal and start weights are the same
    if (startWeight === goalWeight) return '100%';
    
    // If no start weight is defined, can't calculate progress
    if (!startWeight) return '-';
    
    const totalToLose = Math.abs(parseFloat(startWeight) - goalWeight);
    const currentLoss = Math.abs(parseFloat(startWeight) - currentWeight);
    const progress = (currentLoss / totalToLose) * 100;
    
    return `${Math.min(100, Math.max(0, progress.toFixed(1)))}%`;
  };

  // Calculate estimated completion date
  const calculateEstimateCompletion = (currentWeight, goalWeight) => {
    if (!currentWeight || !goalWeight || isNaN(goalWeight)) return '-';
    if (sevenDayAvg && !sevenDayAvg.hasData) return 'Need more data';
    
    const forecast = calculateForecast();
    if (!forecast || !forecast.isPossible) return 'Calculating...';
    
    return forecast.targetDateFormatted;
  };

  // Calculate days tracking (from first entry to now)
  const calculateDaysTracking = () => {
    if (!entries || entries.length === 0) return '-';
    
    // Get earliest date in entries
    const dates = entries.map(entry => new Date(entry.date));
    const earliestDate = new Date(Math.min(...dates));
    
    // Calculate days between earliest date and today
    const today = new Date();
    const diffTime = Math.abs(today - earliestDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays.toString();
  };

  // Use forecast calculation from Stats module
  const calculateForecast = () => {
    if (!formattedEntries.length || !goalWeight) return null;
    
    return Stats.calculateForecast(
      formattedEntries[0],
      parseFloat(goalWeight),
      thirtyDayAvg
    );
  };

  // Export function using Export module
  const exportToCsv = () => {
    if (entries.length === 0) {
      toast.error("No data to export");
      return;
    }
    
    const success = Export.exportToCsv(entries);
    
    if (success) {
      toast.success("Data exported successfully");
    } else {
      toast.error("Error exporting data");
    }
  };

  // Handle file import
  const handleImport = async (event) => {
    const file = event.target.files[0];
    
    if (!file) {
      return;
    }
    
    try {
      toast.info("Importing data...");
      
      const importedEntries = await Export.importFromFile(file);
      
      if (importedEntries.length === 0) {
        toast.error("No valid entries found in the file");
        return;
      }
      
      // Merge with existing entries, avoiding duplicates
      const existingDates = entries.map(e => new Date(e.date).toISOString().split('T')[0]);
      
      let newEntries = [];
      let duplicates = 0;
      
      importedEntries.forEach(entry => {
        const entryDate = new Date(entry.date).toISOString().split('T')[0];
        
        if (!existingDates.includes(entryDate)) {
          newEntries.push(entry);
        } else {
          duplicates++;
        }
      });
      
      if (newEntries.length === 0) {
        toast.info(`No new entries to import (${duplicates} duplicates found)`);
        return;
      }
      
      // Add new entries
      const updatedEntries = [...entries, ...newEntries];
      setEntries(updatedEntries);
      
      // Show success message
      toast.success(`Imported ${newEntries.length} entries (${duplicates} duplicates skipped)`);
      
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Error importing data: ' + error.message);
    }
    
    // Reset file input
    event.target.value = '';
  };

  // Use Stats module functions for weight ranges and distribution
  const getWeightRanges = () => {
    if (!entries || entries.length < 5) return [];
    return Stats.getWeightRanges(entries);
  };
  
  const getWeightDistribution = () => {
    if (!entries || entries.length < 5) return [];
    return Stats.getWeightDistribution(entries);
  };

  // Get chart configuration from Chart module
  const chartConfig = ChartUtils.generateChartConfig(
    entries,
    startWeight,
    goalWeight,
    theme
  );

  // Remove vertical lines from chart
  if (chartConfig && chartConfig.options && chartConfig.options.grid) {
    chartConfig.options.grid.xaxis = {
      lines: {
        show: false // This disables vertical grid lines
      }
    };
  }

  // Generate and share a link
  const handleShare = async (usePermalink = false) => {
    setIsSharingInProgress(true);
    
    try {
      const result = await Share.generateShareLink(
        currentUser, 
        entries, 
        startWeight, 
        goalWeight, 
        height, 
        theme,
        usePermalink
      );
      
      if (result.success) {
        setShareLink(result.shareLink);
        setIsCurrentSharePermalink(result.isPermalink || false);
        setShowShareModal(true);
        setShowShareDropdown(false); // Close dropdown after selection
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Share error:", error);
      toast.error('Failed to generate share link. Please try again.');
    } finally {
      setIsSharingInProgress(false);
    }
  };
  
  // Exit view mode
  const handleExitViewMode = () => {
    // Instead of just updating state, fully reload the page
    // This ensures a clean state with no lingering permissions
    window.location.href = window.location.origin;
  };

  // Add a debugging console log to explicitly check the state
  console.log("App rendering with state:", { viewMode, isLoading, viewData: !!viewData });

  // Show login screen if not in view mode and not logged in
  if (!viewMode && showLoginForm) {
    return <Login onLogin={handleUserLogin} theme={theme} toggleTheme={toggleTheme} />;
  }

  // If in view mode, render the ViewMode component, even if viewData is not fully loaded yet
  if (viewMode) {
    console.log("Rendering ViewMode component with data:", viewData);
    return (
      <ViewMode 
        entries={viewData?.entries || []}
        startWeight={viewData?.startWeight}
        goalWeight={viewData?.goalWeight}
        height={viewData?.height}
        theme={theme}
        sharedBy={viewData?.sharedBy}
        onThemeToggle={toggleTheme}
        onExit={handleExitViewMode}
        isLoading={isLoading}
        error={viewModeError}
      />
    );
  }

  // Color scheme based on theme
  const colors = {
    bg: theme === 'dark' ? 'bg-[#2b2d31]' : 'bg-[#F3EAD3]',
    cardBg: theme === 'dark' ? 'bg-[#313338]' : 'bg-[#EAE4CA]',
    border: theme === 'dark' ? 'border-[#1e1f22]' : 'border-[#DDD8BE]',
    text: theme === 'dark' ? 'text-[#e3e5e8]' : 'text-[#5C6A72]',
    textMuted: theme === 'dark' ? 'text-[#b5bac1]' : 'text-[#829181]',
    buttonBgPrimary: theme === 'dark' ? 'bg-[#5865f2] hover:bg-[#4752c4]' : 'bg-[#8DA101] hover:bg-[#798901]',
    buttonBgSecondary: theme === 'dark' ? 'bg-[#4f545c] hover:bg-[#5d6269]' : 'bg-[#939F91] hover:bg-[#8A948C]',
    buttonBgDanger: theme === 'dark' ? 'bg-[#ed4245] hover:bg-[#eb2c30]' : 'bg-[#F85552] hover:bg-[#e04b48]',
    inputBg: theme === 'dark' ? 'bg-[#1e1f22]' : 'bg-[#E5DFC5]',
    blockBg: theme === 'dark' ? 'bg-[#2b2d31]' : 'bg-[#E5DFC5]',
    positive: theme === 'dark' ? 'text-[#57f287]' : 'text-[#126134]',
    negative: theme === 'dark' ? 'text-[#ed4245]' : 'text-[#F85552]',
  };

  // Set isClient once component mounts
  useEffect(() => {
    setIsClient(true);
    
    // Load theme from localStorage
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      setTheme(savedTheme);
      
      // Apply theme to document
      if (savedTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
    
    // Initialize demo data for Netlify deployment
    if (typeof window !== 'undefined' && window.location.hostname.includes('netlify.app')) {
      createDemoShareData();
    }
  }, []);
  
  // Create demo share data for Netlify deployment
  const createDemoShareData = (forcePermalink = false) => {
    try {
      // For demo view links in Netlify, make sure the data exists
      if (typeof window !== 'undefined' && window.location.search && !forcePermalink) {
        const urlParams = new URLSearchParams(window.location.search);
        const viewParam = urlParams.get('view');
        
        if (viewParam) {
          console.log("Creating demo share data for view parameter:", viewParam);
          
          // Handle special permalink format
          if (viewParam.includes('permalink')) {
            const username = viewParam.split('_')[0];
            return createPermalinkData(username);
          }
          
          // Create demo entries - last 30 days with a weight loss trend
          const demoEntries = [];
          const today = new Date();
          
          for (let i = 0; i < 30; i++) {
            const entryDate = new Date();
            entryDate.setDate(today.getDate() - i);
            
            // Start at 80kg and go down by 0.1kg each day, with some random variation
            const baseWeight = 80 - (i * 0.1);
            const variation = Math.random() * 0.4 - 0.2; // -0.2 to +0.2 variation
            const weight = (baseWeight + variation).toFixed(1);
            
            demoEntries.push({
              date: entryDate.toISOString().split('T')[0],
              weight: weight
            });
          }
          
          // Create share package
          const demoShareData = {
            entries: demoEntries,
            startWeight: "80.0",
            goalWeight: "75.0",
            height: "175",
            theme: "light",
            sharedBy: "Demo User",
            sharedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // Expires in 1 year
          };
          
          // Save to localStorage with the actual view parameter ID
          localStorage.setItem(`shared_${viewParam}`, JSON.stringify(demoShareData));
          console.log("Demo share data created for:", viewParam);
          
          return demoShareData;
        }
      }
      
      // For general demo data or permalink
      const permalinkId = 'demo_permalink';
      const demoShareId = forcePermalink ? permalinkId : 'demo_share';
      
      // Check if demo data already exists (or override for permalink)
      if (forcePermalink || !localStorage.getItem(`shared_${demoShareId}`)) {
        console.log(forcePermalink ? "Creating permalink demo data" : "Creating general demo share data");
        
        // Create demo entries - last 30 days with a weight loss trend
        const demoEntries = [];
        const today = new Date();
        
        for (let i = 0; i < 30; i++) {
          const entryDate = new Date();
          entryDate.setDate(today.getDate() - i);
          
          // Start at 80kg and go down by 0.1kg each day, with some random variation
          const baseWeight = 80 - (i * 0.1);
          const variation = Math.random() * 0.4 - 0.2; // -0.2 to +0.2 variation
          const weight = (baseWeight + variation).toFixed(1);
          
          demoEntries.push({
            date: entryDate.toISOString().split('T')[0],
            weight: weight
          });
        }
        
        // Create share package
        const demoShareData = {
          entries: demoEntries,
          startWeight: "80.0",
          goalWeight: "75.0",
          height: "175",
          theme: "light",
          sharedBy: forcePermalink ? "Demo Permalink" : "Demo User",
          sharedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // Expires in 1 year
        };
        
        // Save to localStorage
        localStorage.setItem(`shared_${demoShareId}`, JSON.stringify(demoShareData));
        
        // Also save as standard permalinks for consistent URLs
        if (forcePermalink) {
          localStorage.setItem(`shared_demo_permalink`, JSON.stringify(demoShareData));
        }
        
        console.log(forcePermalink ? "Permalink demo data created" : "General demo share data created");
        return demoShareData;
      }
      
      return null;
    } catch (error) {
      console.error("Error in createDemoShareData:", error);
      // Return a simple placeholder as fallback
      return {
        entries: [{
          date: new Date().toISOString().split('T')[0],
          weight: "75.0"
        }],
        startWeight: "80.0",
        goalWeight: "70.0",
        height: "175",
        theme: "light",
        sharedBy: "Demo Fallback",
        sharedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      };
    }
  };

  // Create a demo permalink that's always available
  const createDemoPermalink = () => {
    console.log("Creating demo permalink for README link");
    
    // Create demo entries - last 30 days with a weight loss trend
    const demoEntries = [];
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const entryDate = new Date();
      entryDate.setDate(today.getDate() - i);
      
      // Make a nice trend pattern
      let weight;
      if (i < 10) {
        // First 10 days - good progress
        weight = (80 - (i * 0.2)).toFixed(1);
      } else if (i < 20) {
        // Middle 10 days - plateau
        weight = (78 - ((i-10) * 0.05)).toFixed(1);
      } else {
        // Last 10 days - progress again
        weight = (77.5 - ((i-20) * 0.15)).toFixed(1);
      }
      
      demoEntries.push({
        date: entryDate.toISOString().split('T')[0],
        weight: weight
      });
    }
    
    // Create share package with nice consistent data
    const demoShareData = {
      entries: demoEntries,
      startWeight: "80.0",
      goalWeight: "75.0",
      height: "180",
      theme: "light",
      sharedBy: "Demo User",
      sharedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // Expires in 1 year
    };
    
    // Save to localStorage with demo_permalink ID
    localStorage.setItem("shared_demo_permalink", JSON.stringify(demoShareData));
    console.log("Demo permalink created successfully");
  };

  // Create permalink data with user's name
  const createPermalinkData = (username = "luka") => {
    try {
      const permalinkId = `${username}_permalink`;
      console.log("Creating permalink data for:", permalinkId);
      
      // Create sample weight entries with extremely careful validation
      const entries = [];
      const today = new Date();
      const startWeight = 80.0;
      const goalWeight = 75.0;
      
      // Ensure we create valid date strings and weight values
      for (let i = 0; i < 10; i++) {
        const entryDate = new Date();
        entryDate.setDate(today.getDate() - i);
        
        // Format date to YYYY-MM-DD string format
        const dateStr = entryDate.toISOString().split('T')[0];
        
        // Calculate a gradual weight loss trend with slight variations
        const progress = i / 10; // 0 to 1 progress over the 10 days
        const targetWeight = startWeight - (progress * (startWeight - goalWeight));
        const variation = Math.random() * 0.4 - 0.2; // -0.2 to +0.2 variation
        const weight = (targetWeight + variation).toFixed(1);
        
        // Validate the entry before adding
        if (dateStr && !isNaN(parseFloat(weight))) {
          entries.push({
            date: dateStr,
            weight: weight
          });
        }
      }
      
      // Ensure we have entries
      if (entries.length === 0) {
        // Fallback entry with guaranteed valid data
        entries.push({
          date: today.toISOString().split('T')[0],
          weight: "80.0"
        });
      }
      
      // Sort entries by date (newest first)
      entries.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      // Log the created entries for debugging
      console.log("Created permalink entries:", JSON.stringify(entries.slice(0, 2)));

      // Create a sample user with the permalink data
      const permalinkData = {
        entries: entries,
        startWeight: startWeight.toString(),
        goalWeight: goalWeight.toString(),
        height: "175", // Ensure height is a string for consistent handling
        theme: "light",
        sharedBy: username || "Anonymous User",
        sharedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // Expires in 1 year
        isPermalink: true
      };
      
      // Save to localStorage with the permalink ID
      localStorage.setItem(`shared_${permalinkId}`, JSON.stringify(permalinkData));
      console.log("Permalink data created for:", permalinkId);
      
      // Validate the data we're returning
      try {
        // Test BMI calculation as a sanity check
        const testBmi = Stats.calculateBMI(entries[0].weight, permalinkData.height);
        console.log("BMI calculation test:", testBmi);
      } catch (e) {
        console.error("BMI calculation error:", e);
      }
      
      return permalinkData;
    } catch (error) {
      console.error("Error in createPermalinkData:", error);
      // Return a simple fallback permalink with guaranteed valid data
      const today = new Date();
      return {
        entries: [{
          date: today.toISOString().split('T')[0],
          weight: "78.5"
        }],
        startWeight: "80.0",
        goalWeight: "75.0",
        height: "175", // Ensure height is a string
        theme: "light",
        sharedBy: username || "Fallback User",
        sharedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        isPermalink: true
      };
    }
  };

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
          }
        }}
      />
      
      {/* Share Modal */}
      <ShareModal 
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        shareLink={shareLink}
        theme={theme}
        isPermalink={isCurrentSharePermalink}
      />
      
      <div className="max-w-6xl mx-auto">
        {/* Header with user info and controls */}
        <div className={`flex flex-col sm:flex-row justify-between items-center mb-6 gap-3 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
          <div className="flex items-center gap-1 w-full sm:w-auto justify-center sm:justify-start">
            <h2 className={`text-lg sm:text-xl md:text-2xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
              Weight Tracker
            </h2>
          </div>
          <div className="flex items-center space-x-2 w-full sm:w-auto justify-center sm:justify-end">
            <span className="text-sm mr-2">{currentUser}</span>
            {/* Add Share Button with Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowShareDropdown(!showShareDropdown)}
                className={`p-2 rounded-full ${theme === 'dark' ? colors.buttonBgSecondary : 'bg-[#8DA101] hover:bg-[#798901]'}`}
                title="Share your progress"
              >
                <Share2 size={16} className="text-white" />
              </button>
              
              {showShareDropdown && (
                <div className={`absolute right-0 top-full mt-1 w-48 rounded-md shadow-lg ${colors.cardBg} z-10 border ${colors.border}`}>
                  <div className="rounded-md">
                    <div className="py-1">
                      <button
                        onClick={() => handleShare(false)}
                        className={`block px-4 py-2 text-sm ${colors.text} w-full text-left hover:bg-opacity-20 hover:bg-gray-100`}
                      >
                        Create One-time Share
                      </button>
                      <button
                        onClick={() => handleShare(true)}
                        className={`block px-4 py-2 text-sm ${colors.text} w-full text-left hover:bg-opacity-20 hover:bg-gray-100`}
                      >
                        Create Permalink (overrides previous)
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
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
              onClick={handleUserLogout} 
              className={`p-2 rounded-full ${theme === 'dark' ? 'bg-[#ed4245] hover:bg-[#eb2c30]' : 'bg-[#F85552] hover:bg-[#e04b48]'}`}
              title="Log Out"
            >
              <LogOut size={16} className="text-white" />
            </button>
          </div>
        </div>
        
        {/* Main content area with cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Settings Card */}
          <div className={`p-4 rounded-lg ${theme === 'dark' ? colors.cardBg : 'bg-white shadow-md'}`}>
            <h3 className={`text-base sm:text-lg font-medium mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Settings</h3>
            <CardContent className={`py-6 px-6`}>
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
                      className={`${colors.inputBg} h-10 pl-3 rounded-md ${colors.text}`}
                    />
                    <button
                      onClick={handleSetStart}
                      className={`${colors.buttonBgPrimary} px-4 py-2 h-10 rounded-md flex items-center space-x-1`}
                    >
                      <Save className="h-4 w-4 mr-1 text-white" />
                      <span className="text-white">Set</span>
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
                      className={`${colors.inputBg} h-10 pl-3 rounded-md ${colors.text}`}
                    />
                    <button
                      onClick={handleSetGoal}
                      className={`${colors.buttonBgPrimary} px-4 py-2 h-10 rounded-md flex items-center space-x-1`}
                    >
                      <Save className="h-4 w-4 mr-1 text-white" />
                      <span className="text-white">Set</span>
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
                      className={`${colors.inputBg} h-10 pl-3 rounded-md ${colors.text}`}
                    />
                    <button
                      onClick={handleSetHeight}
                      className={`${colors.buttonBgPrimary} px-4 py-2 h-10 rounded-md flex items-center space-x-1`}
                    >
                      <Save className="h-4 w-4 mr-1 text-white" />
                      <span className="text-white">Set</span>
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </div>

          {/* Data Display Area - Main Chart */}
          <div className="grid grid-cols-1 gap-4 mb-6">
            {/* Weight Graph Card */}
            <div className={`p-3 sm:p-4 rounded-lg ${theme === 'dark' ? colors.cardBg : 'bg-white shadow-md'}`}>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3">
                <h3 className={`text-base sm:text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                  Weight Progress
                </h3>
                <div className="flex flex-wrap items-center gap-2 mt-2 sm:mt-0">
                  <div className="flex items-center">
                    <label className={`text-xs mr-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Zoom:</label>
                    <select
                      value={chartZoom.timeframe}
                      onChange={(e) => setChartZoom({...chartZoom, enabled: true, timeframe: e.target.value})}
                      className={`text-xs py-1 px-2 rounded ${theme === 'dark' ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-800 border-gray-300'} border`}
                    >
                      <option value="all">All time</option>
                      <option value="1m">1 month</option>
                      <option value="3m">3 months</option>
                      <option value="6m">6 months</option>
                      <option value="1y">1 year</option>
                    </select>
                  </div>
                  <button
                    onClick={() => setChartZoom({...chartZoom, enabled: false, timeframe: 'all'})}
                    className={`text-xs py-1 px-2 rounded ${chartZoom.enabled ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'bg-gray-400 text-gray-200 cursor-not-allowed'} disabled:opacity-50`}
                    disabled={!chartZoom.enabled}
                  >
                    Reset
                  </button>
                </div>
              </div>
              <div className="h-[300px] sm:h-[350px]">
                {entries.length > 0 ? (
                  typeof window !== 'undefined' ? 
                    <Chart 
                      options={chartConfig.options} 
                      series={chartConfig.series} 
                      type="area" 
                      height="100%"
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
                      className={`${colors.buttonBgPrimary} px-4 py-2 rounded-md border border-[#4752c4]`}
                    >
                      Add Your First Weight
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Additional Data Visualization */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* BMI Card */}
            <div className={`p-3 sm:p-4 rounded-lg ${theme === 'dark' ? colors.cardBg : 'bg-white shadow-md'}`}>
              <h3 className={`text-base sm:text-lg font-medium mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                BMI Tracker
              </h3>
              <div className="h-[250px] sm:h-[300px]">
                {entries.length > 0 && height ? (
                  <div className="h-full flex flex-col">
                    <div className="text-center pb-4">
                      <div className={`text-xl font-bold ${getBmiColor(latestBmi)}`}>
                        {latestBmi ? latestBmi.toFixed(1) : 'N/A'}
                      </div>
                      <div className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                        {getBmiCategory(latestBmi)}
                      </div>
                    </div>
                    <div className="flex-grow relative">
                      {/* BMI Scale Visualization */}
                      <div className="absolute inset-0 flex items-center">
                        <div className="h-8 w-full bg-gradient-to-r from-blue-500 via-green-500 via-yellow-500 to-red-500 rounded-md"></div>
                        <div 
                          className="absolute h-10 w-3 bg-white border-2 border-gray-800 rounded-full transform -translate-x-1/2"
                          style={{ 
                            left: `${Math.min(Math.max((latestBmi - 15) / 25 * 100, 0), 100)}%` 
                          }}
                        ></div>
                      </div>
                      
                      {/* BMI Categories */}
                      <div className="absolute bottom-0 w-full grid grid-cols-4 text-xs pt-12">
                        <div className="text-blue-500 text-center">Underweight<br/>&lt;18.5</div>
                        <div className="text-green-500 text-center">Normal<br/>18.5-24.9</div>
                        <div className="text-yellow-500 text-center">Overweight<br/>25-29.9</div>
                        <div className="text-red-500 text-center">Obese<br/>&gt;30</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-[#b5bac1]">
                    <p className="mb-2">
                      {height ? "Add weight to see BMI" : "Set your height in settings"}
                    </p>
                    <button
                      onClick={() => {
                        if (!height) {
                          // Focus height input in settings
                          const heightInput = document.querySelector('input[name="height"]');
                          if (heightInput) heightInput.focus();
                        } else {
                          // Focus weight input
                          const weightInput = document.querySelector('input[type="number"]');
                          if (weightInput) weightInput.focus();
                        }
                      }} 
                      className={`${colors.buttonBgPrimary} px-4 py-2 rounded-md border border-[#4752c4]`}
                    >
                      {height ? "Add Weight" : "Set Height"}
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Trends Card */}
            <div className={`p-3 sm:p-4 rounded-lg ${theme === 'dark' ? colors.cardBg : 'bg-white shadow-md'}`}>
              <h3 className={`text-base sm:text-lg font-medium mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                Weight Trends
              </h3>
              <div className="h-[250px] sm:h-[300px]">
                {entries.length > 1 ? (
                  <div className="h-full flex flex-col space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
                        <div className="text-xs text-gray-500 mb-1">7-day Change</div>
                        <div className={`text-lg font-semibold ${sevenDayAvg.change > 0 ? 'text-red-500' : sevenDayAvg.change < 0 ? 'text-green-500' : 'text-gray-500'}`}>
                          {sevenDayAvg.hasData ? (
                            sevenDayAvg.change > 0 ? 
                              `+${sevenDayAvg.change?.toFixed(1) || '0.0'} kg` : 
                              `${sevenDayAvg.change?.toFixed(1) || '0.0'} kg`
                          ) : 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {sevenDayAvg.hasData ? 
                            `${(sevenDayAvg.changePerWeek)?.toFixed(1) || '0.0'} kg/week` : 
                            'Need more data'}
                        </div>
                      </div>
                      
                      <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
                        <div className="text-xs text-gray-500 mb-1">30-day Change</div>
                        <div className={`text-lg font-semibold ${thirtyDayAvg.change > 0 ? 'text-red-500' : thirtyDayAvg.change < 0 ? 'text-green-500' : 'text-gray-500'}`}>
                          {thirtyDayAvg.hasData ? (
                            thirtyDayAvg.change > 0 ? 
                              `+${thirtyDayAvg.change?.toFixed(1) || '0.0'} kg` : 
                              `${thirtyDayAvg.change?.toFixed(1) || '0.0'} kg`
                          ) : 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {thirtyDayAvg.hasData ? 
                            `${(thirtyDayAvg.changePerWeek)?.toFixed(1) || '0.0'} kg/week` : 
                            'Need more data'}
                        </div>
                      </div>
                    </div>
                    
                    <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
                      <div className="text-xs text-gray-500 mb-1">Overall Trend</div>
                      <div className="flex items-center gap-2">
                        <div className={`text-lg font-semibold ${overallChange > 0 ? 'text-red-500' : overallChange < 0 ? 'text-green-500' : 'text-gray-500'}`}>
                          {overallChange !== undefined ? (
                            overallChange > 0 ? 
                              `+${overallChange.toFixed(1)} kg` : 
                              `${overallChange.toFixed(1)} kg`
                          ) : 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {firstEntry && firstEntry.date ? 
                            `since ${new Date(firstEntry.date).toLocaleDateString()}` : 
                            ''}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-[#b5bac1]">
                    <p className="mb-2">Need at least 2 entries to see trends</p>
                    <button
                      onClick={() => {
                        const input = document.querySelector('input[type="number"]');
                        if (input) input.focus();
                      }} 
                      className={`${colors.buttonBgPrimary} px-4 py-2 rounded-md border border-[#4752c4]`}
                    >
                      Add More Entries
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Weight Input and Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Weight Input Card */}
          <div className={`p-4 rounded-lg ${theme === 'dark' ? colors.cardBg : 'bg-white shadow-md'}`}>
            <h3 className={`text-base sm:text-lg font-medium mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Add Entry</h3>
            <CardContent className={`py-6 px-6`}>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-[#b5bac1] mb-2 pl-1">Date</label>
                  <Input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className={`${colors.inputBg} h-10 pl-3 pr-8 rounded-md ${colors.text}`}
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
                      className={`${colors.inputBg} h-10 pl-3 rounded-md ${colors.text}`}
                    />
                    <button 
                      onClick={handleAdd} 
                      className={`${colors.buttonBgPrimary} px-4 py-2 h-10 rounded-md border border-[#4752c4]`}
                    >
                      <span className="text-white">Add</span>
                    </button>
                  </div>
                </div>

                {/* Import from file section */}
                <div className="mt-4 pt-4 border-t border-[#1e1f22]">
                  <label className="block text-sm font-medium text-[#b5bac1] mb-2 pl-1">
                    Import from Excel/CSV
                  </label>
                  <input 
                    type="file" 
                    accept=".csv,.xls,.xlsx"
                    onChange={handleImport}
                    className={`${colors.inputBg} w-full text-sm ${colors.text} rounded-md
                      file:mr-4 file:py-2 file:px-4 
                      file:rounded-md file:border-0 
                      file:text-sm file:font-semibold 
                      ${theme === 'dark' 
                        ? 'file:bg-[#404249] hover:file:bg-[#2b2d31]' 
                        : 'file:bg-[#8DA101] hover:file:bg-[#798901]'} file:text-white`}
                  />
                </div>
              </div>
            </CardContent>
          </div>

          {/* Weight History Card */}
          <div className={`p-4 rounded-lg ${theme === 'dark' ? colors.cardBg : 'bg-white shadow-md'}`}>
            <h3 className={`text-base sm:text-lg font-medium mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Weight History</h3>
            <CardContent className={`py-6 px-6`}>
              <div style={{ maxHeight: '350px', overflow: 'auto' }} className="scrollbar-hide">
                {entries.length > 0 ? (
                  <div className="relative">
                    <table className="w-full">
                      <thead style={{ position: 'sticky', top: 0, zIndex: 10 }} className={`${theme === 'dark' ? 'bg-[#313338]' : 'bg-[#EAE4CA]'}`}>
                        <tr>
                          <th className={`text-left py-2 px-4 font-medium ${colors.text} border-b ${theme === 'dark' ? 'border-[#1e1f22]' : 'border-[#DDD8BE]'}`} style={{ width: '150px' }}>Date</th>
                          <th className={`text-left py-2 px-4 font-medium ${colors.text} border-b ${theme === 'dark' ? 'border-[#1e1f22]' : 'border-[#DDD8BE]'}`}>Day</th>
                          <th className={`text-left py-2 px-4 font-medium ${colors.text} border-b ${theme === 'dark' ? 'border-[#1e1f22]' : 'border-[#DDD8BE]'}`}>Weight (kg)</th>
                          <th className={`text-left py-2 px-4 font-medium ${colors.text} border-b ${theme === 'dark' ? 'border-[#1e1f22]' : 'border-[#DDD8BE]'}`}>Change</th>
                          <th className={`text-right py-2 px-4 font-medium ${colors.text} border-b ${theme === 'dark' ? 'border-[#1e1f22]' : 'border-[#DDD8BE]'}`}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formattedEntries.map((entry, index) => {
                          const prevEntry = formattedEntries[index + 1];
                          const change = prevEntry ? (entry.weight - prevEntry.weight).toFixed(1) : "--";
                          const changeColor = change !== "--" ? 
                            (parseFloat(change) < 0 ? 
                              theme === 'dark' ? "text-[#57f287]" : "text-[#126134]"
                              : parseFloat(change) > 0 ? "text-[#ed4245]" : "") 
                            : "";
                          
                          return (
                            <tr key={entry.id || entry.date} className={`border-b ${theme === 'dark' ? 'border-[#1e1f22]' : 'border-[#DDD8BE]'}`}>
                              <td className={`text-left py-2 px-4 ${colors.text}`}>{entry.dateFormatted}</td>
                              <td className={`text-left py-2 px-4 ${colors.text}`}>{entry.dayFormatted}</td>
                              <td className={`text-left py-2 px-4 ${colors.text} font-medium`}>{entry.weight}</td>
                              <td className={`text-left py-2 px-4 ${changeColor} flex items-center`}>
                                {change !== "--" ? (
                                  <>
                                    <span>{change > 0 ? "+" + change : change}</span>
                                    <span className="ml-1">{getTrendIcon(parseFloat(change))}</span>
                                  </>
                                ) : "--"}
                              </td>
                              <td className="text-right py-2 px-4">
                                <button 
                                  onClick={() => handleDelete(entry.id)}
                                  className={`${theme === 'dark' ? 'bg-[#ed4245] hover:bg-[#eb2c30]' : 'bg-[#8DA101] hover:bg-[#798901]'} inline-flex h-8 w-8 items-center justify-center rounded-md text-white`}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-6 text-[#b5bac1]">
                    <p>No entries yet. Add your first weight using the form.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </div>
        </div>
        
        {/* Summary Card */}
        {entries.length > 0 && (
          <div className={`p-4 rounded-lg ${theme === 'dark' ? colors.cardBg : 'bg-white shadow-md'}`}>
            <h3 className={`text-base sm:text-lg font-medium mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Summary</h3>
            <CardContent className={`py-6 px-6`}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className={`${colors.blockBg} p-4 rounded-md`}>
                  <div className="text-sm text-[#b5bac1] mb-1">Current</div>
                  <div className={`text-xl font-bold ${colors.text}`}>{entries[0].weight} kg</div>
                </div>
                
                {goalWeight && (
                  <div className={`${colors.blockBg} p-4 rounded-md`}>
                    <div className="text-sm text-[#b5bac1] mb-1">Goal</div>
                    <div className={`text-xl font-bold ${colors.text}`}>{goalWeight} kg</div>
                  </div>
                )}
                
                {startWeight && entries.length > 0 && (
                  <div className={`${colors.blockBg} p-4 rounded-md`}>
                    <div className="text-sm text-[#b5bac1] mb-1">Total Change</div>
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
                    <div className="text-sm text-[#b5bac1] mb-1">Last Change</div>
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
                    <div className="text-sm text-[#b5bac1] mb-1">BMI</div>
                    <div className={`text-xl font-bold ${colors.text}`}>{calculateBMI(entries[0].weight, height)}</div>
                    <div className={`text-sm ${getBmiColor(calculateBMI(entries[0].weight, height))} mt-1`}>
                      {getBmiCategory(calculateBMI(entries[0].weight, height))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </div>
        )}
        
        {/* Forecast Card */}
        {entries.length > 0 && goalWeight && sevenDayAvg.hasData && (
          <div className={`p-4 rounded-lg ${theme === 'dark' ? colors.cardBg : 'bg-white shadow-md'}`}>
            <h3 className={`text-base sm:text-lg font-medium mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Forecast</h3>
            <CardContent className={`py-6 px-6`}>
              {/* Forecast content */}
            </CardContent>
          </div>
        )}
      </div>
    </div>
  );
}