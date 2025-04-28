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
  
  // Share functionality state
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [viewMode, setViewMode] = useState(false);
  const [viewData, setViewData] = useState(null);
  
  // Toggle theme function
  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    
    // Always save theme preference to localStorage
    localStorage.setItem("theme", newTheme);
    
    // If in view mode, update the viewData theme too
    if (viewMode && viewData) {
      const updatedViewData = {
        ...viewData,
        theme: newTheme
      };
      setViewData(updatedViewData);
      
      // Directly apply theme to document
      if (newTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  };
  
  // Initialize state from localStorage only after component mounts
  useEffect(() => {
    console.log("Initial useEffect running...");
    setIsClient(true);
    
    try {
      // Check if user is already logged in
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
      
      console.log("Initial data loading complete!");
    } catch (error) {
      console.error("Error during initial data loading:", error);
    }
  }, []);
  
  // Apply theme to document
  useEffect(() => {
    if (!isClient) return;
    
    // Save theme preference
    localStorage.setItem("theme", theme);
    
    // Apply theme to document
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

  // Use BMI category function from Stats module
  const getBMICategory = (bmi) => {
    return Stats.getBMICategory(bmi, theme);
  };

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

  // Add this new useEffect to check for view mode in URL
  useEffect(() => {
    if (isClient && typeof window !== 'undefined') {
      // Check for view mode in URL
      const urlParams = new URLSearchParams(window.location.search);
      const viewParam = urlParams.get('view');
      
      if (viewParam) {
        console.log("View mode detected:", viewParam);
        
        // Load shared data
        (async () => {
          const result = await Share.loadSharedView(viewParam);
          
          if (result.success) {
            setViewMode(true);
            setViewData(result.data);
            
            // Set theme from shared data
            if (result.data.theme) {
              setTheme(result.data.theme);
              
              // Directly apply theme to document
              if (result.data.theme === "dark") {
                document.documentElement.classList.add("dark");
              } else {
                document.documentElement.classList.remove("dark");
              }
            }
            
            setTimeout(() => {
              toast.success("Viewing shared weight data", {
                style: {
                  background: theme === 'dark' ? "#313338" : "#ffffff",
                  color: theme === 'dark' ? "#e3e5e8" : "#374151",
                  border: `1px solid ${theme === 'dark' ? "#1e1f22" : "#e5e7eb"}`,
                }
              });
            }, 500);
          } else {
            setTimeout(() => {
              toast.error(result.message, {
                style: {
                  background: theme === 'dark' ? "#313338" : "#ffffff",
                  color: theme === 'dark' ? "#e3e5e8" : "#374151",
                  border: `1px solid ${theme === 'dark' ? "#1e1f22" : "#e5e7eb"}`,
                }
              });
            }, 500);
          }
        })();
      }
    }
  }, [isClient]); // Only run when isClient changes, not on theme changes

  // Generate and share a link
  const handleShareLink = () => {
    if (!isLoggedIn) {
      toast.error("You must be logged in to share your tracker", {
        style: {
          background: theme === 'dark' ? "#313338" : "#ffffff",
          color: theme === 'dark' ? "#e3e5e8" : "#374151",
          border: `1px solid ${theme === 'dark' ? "#1e1f22" : "#e5e7eb"}`,
        }
      });
      return;
    }
    
    const result = Share.generateShareLink(
      currentUser,
      entries,
      startWeight,
      goalWeight,
      height,
      theme
    );
    
    console.log('Share result:', result);
    if (result.success) {

    const shareId = result.shareLink.split('view=')[1];
    const stored = localStorage.getItem(`share_${shareId}`);
    console.log('Stored share data:', stored); // Add this line to check the stored data
      setShareLink(result.shareLink);
      setShowShareModal(true);
    } else {
      toast.error(result.message, {
        style: {
          background: theme === 'dark' ? "#313338" : "#ffffff",
          color: theme === 'dark' ? "#e3e5e8" : "#374151",
          border: `1px solid ${theme === 'dark' ? "#1e1f22" : "#e5e7eb"}`,
        }
      });
    }
  };
  
  // Exit view mode
  const handleExitViewMode = () => {
    // Instead of just updating state, fully reload the page
    // This ensures a clean state with no lingering permissions
    window.location.href = window.location.origin;
  };

  // Show login screen if not logged in
  if (showLoginForm) {
    return <Login onLogin={handleUserLogin} theme={theme} toggleTheme={toggleTheme} />;
  }

  // If in view mode, render the ViewMode component
  if (viewMode && viewData) {
    return (
      <ViewMode 
        entries={viewData.entries}
        startWeight={viewData.startWeight}
        goalWeight={viewData.goalWeight}
        height={viewData.height}
        theme={theme}
        sharedBy={viewData.sharedBy}
        onThemeToggle={toggleTheme}
        onExit={handleExitViewMode}
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
      />
      
      <div className="max-w-6xl mx-auto">
        {/* Header with user info and controls */}
        <div className={`flex justify-between items-center mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
          <div className="flex items-center gap-1">
            <h2 className={`text-xl sm:text-2xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
              Weight Tracker
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm mr-2">{currentUser}</span>
            {/* Add Share Button */}
            <button
              onClick={handleShareLink}
              className={`p-2 rounded-full ${theme === 'dark' ? colors.buttonBgSecondary : 'bg-[#8DA101] hover:bg-[#798901]'}`}
              title="Share your progress"
            >
              <Share2 size={16} className="text-white" />
            </button>
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Settings Card - Top Left */}
          <Card className={`${colors.cardBg} ${colors.border} shadow-xl rounded-lg overflow-hidden`}>
            <CardHeader className={`border-b ${colors.border} pb-3 pt-4 flex justify-center`}>
              <CardTitle className={`${colors.text} text-lg`}>Settings</CardTitle>
            </CardHeader>
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
          </Card>

          {/* Chart Card - Top Right */}
          <Card className={`${colors.cardBg} ${colors.border} shadow-xl rounded-lg overflow-hidden`}>
            <CardHeader className={`border-b ${colors.border} pb-3 pt-4 flex justify-center`}>
              <CardTitle className={`${colors.text} text-lg`}>Weight Chart</CardTitle>
            </CardHeader>
            <CardContent className={`py-6 px-6`}>
              <div className="h-[300px]">
                {entries.length > 0 ? (
                  typeof window !== 'undefined' ? 
                    <Chart 
                      options={chartConfig.options} 
                      series={chartConfig.series} 
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
                      className={`${colors.buttonBgPrimary} px-4 py-2 rounded-md border border-[#4752c4]`}
                    >
                      Add Your First Weight
                    </button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Add New Entry Card - Bottom Left */}
          <Card className={`${colors.cardBg} ${colors.border} shadow-xl rounded-lg overflow-hidden`}>
            <CardHeader className={`border-b ${colors.border} pb-3 pt-4 flex justify-center`}>
              <CardTitle className={`${colors.text} text-lg`}>Add New Entry</CardTitle>
            </CardHeader>
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
          </Card>

          {/* Weight History Card - Bottom Right */}
          <Card className={`${colors.cardBg} ${colors.border} shadow-xl rounded-lg overflow-hidden`}>
            <CardHeader className={`border-b ${colors.border} relative flex flex-row items-center justify-center pb-3 pt-4`}>
              <div className="flex items-center">
                <CardTitle className={`${colors.text} text-lg`}>Weight History</CardTitle>
                <div className="text-sm ${theme === 'dark' ? 'text-[#57f287]' : 'text-[#126134]'} ml-2">({entries.length} entries)</div>
              </div>
              <button
                onClick={exportToCsv}
                disabled={entries.length === 0}
                className={`${colors.buttonBgPrimary} px-3 py-1 text-xs rounded-md flex items-center absolute right-4
                  ${entries.length > 0 
                    ? 'bg-[#404249] hover:bg-[#4752c4] text-white cursor-pointer' 
                    : 'bg-[#36373d] text-[#72767d] cursor-not-allowed'}`}
                title="Export to CSV"
              >
                <Download size={14} className="mr-1 text-white" />
                <span className="text-white">Export</span>
              </button>
            </CardHeader>
            <CardContent className={`py-6 px-6 overflow-hidden`}>
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
          </Card>
          
          {/* Summary Card - Spans full width on larger screens */}
          {entries.length > 0 && (
            <Card className={`${colors.cardBg} ${colors.border} shadow-xl md:col-span-2 rounded-lg overflow-hidden`}>
              <CardHeader className={`border-b ${colors.border} pb-3 pt-4 flex justify-center`}>
                <CardTitle className={`${colors.text} text-lg`}>Summary</CardTitle>
              </CardHeader>
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
                      <div className={`text-sm ${getBMICategory(calculateBMI(entries[0].weight, height)).color} mt-1`}>{getBMICategory(calculateBMI(entries[0].weight, height)).category}</div>
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
                <CardTitle className={`${colors.text} text-lg`}>Forecast</CardTitle>
              </CardHeader>
              <CardContent className={`py-6 px-6`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Weight Projection */}
                  <div className={`${colors.blockBg} p-4 rounded-md`}>
                    <div className="flex justify-between items-center mb-3">
                      <h3 className={`${colors.text} text-lg font-medium`}>Weight Projection</h3>
                    </div>
                    
                    {calculateForecast()?.isPossible ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className={`${colors.textMuted}`}>Current trend:</span>
                          <span className={`${colors.text} font-medium`}>
                            {sevenDayAvg.value > 0 ? "+" : ""}{sevenDayAvg.value} kg/day
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={`${colors.textMuted}`}>Weekly rate:</span>
                          <span className={`${colors.text} font-medium`}>{calculateForecast().weeklyRate} kg/week</span>
                        </div>
                        <div className="h-[1px] w-full bg-[#1e1f22] my-3"></div>
                        <div className="flex items-center justify-between">
                          <span className={`${colors.textMuted}`}>Current:</span>
                          <span className={`${colors.text} font-medium`}>{entries[0].weight} kg</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={`${colors.textMuted}`}>Goal:</span>
                          <span className={`${colors.text} font-medium`}>{goalWeight} kg</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={`${colors.textMuted}`}>Remaining:</span>
                          <span className={`${colors.text} font-medium`}>
                            {Math.abs(goalWeight - entries[0].weight).toFixed(1)} kg
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="py-2 text-[#ed4245]">
                        {calculateForecast() ? calculateForecast().reason : "Insufficient data for projection"}
                      </div>
                    )}
                  </div>
                  
                  {/* Target Date */}
                  <div className={`${colors.blockBg} p-4 rounded-md`}>
                    <div className="flex justify-between items-center mb-3">
                      <h3 className={`${colors.text} text-lg font-medium`}>Target Date Estimation</h3>
                      <Calendar size={20} className={`${colors.textMuted}`} />
                    </div>
                    
                    {calculateForecast()?.isPossible ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className={`${colors.textMuted}`}>Estimated time to goal:</span>
                          <span className={`${colors.text} font-medium`}>{calculateForecast().daysNeeded} days</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={`${colors.textMuted}`}>Target date:</span>
                          <span className={`${colors.text} font-medium`}>{calculateForecast().targetDateFormatted}</span>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-[#1e1f22]">
                          <div className="flex items-center space-x-2 text-sm text-[#b5bac1]">
                            <span>Today</span>
                            <div className={`flex-1 h-[3px] ${theme === 'dark' ? 'bg-[#57f287]' : 'bg-[#8DA101]'} rounded-full relative`}>
                              <div 
                                className={`absolute -top-1 left-0 w-2 h-2 rounded-full ${theme === 'dark' ? 'bg-[#57f287]' : 'bg-[#8DA101]'}`}
                                style={{ left: "0%" }}
                              ></div>
                              <div 
                                className={`absolute -top-1 right-0 w-2 h-2 rounded-full ${theme === 'dark' ? 'bg-[#57f287]' : 'bg-[#8DA101]'}`}
                                style={{ right: "0%" }}
                              ></div>
                            </div>
                            <span>{calculateForecast().targetDateFormatted}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="py-2 text-center flex flex-col items-center space-y-4">
                        <ArrowRight size={32} className={`${colors.textMuted}`} />
                        <span className={`${colors.textMuted}`}>
                          {calculateForecast() ? calculateForecast().reason : "Set a goal weight and establish a trend"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Export Card */}
          {entries.length > 0 && formattedEntries.length > 0 && (
            <Card className={`${colors.cardBg} ${colors.border} shadow-xl md:col-span-2 rounded-lg overflow-hidden mt-2`}>
              <CardHeader className={`border-b ${colors.border} relative flex flex-row items-center justify-center pb-3 pt-4`}>
                <CardTitle className={`${colors.text} text-lg`}>Data Management</CardTitle>
                <button
                  onClick={exportToCsv}
                  className={`${colors.buttonBgPrimary} px-3 py-1 rounded-md flex items-center absolute right-8`}
                >
                  <Download className="h-4 w-4 mr-1 text-white" />
                  <span className="text-white">Export CSV</span>
                </button>
              </CardHeader>
              <CardContent className={`py-6 px-6`}>
                <div className={`${colors.text}`}>
                  <p>Your weight data is stored locally in your browser. You can export it as a CSV file for backup or analysis in other applications.</p>
                  {formattedEntries.length > 1 ? (
                    <div className={`mt-4 ${colors.blockBg} p-4 rounded-md`}>
                      <div className="text-sm">
                        <span className={`${colors.text} font-medium`}>Current data summary:</span>
                        <ul className="mt-2 space-y-1 text-sm ${colors.text}">
                          <li>• Total entries: {entries.length}</li>
                          <li>• Date range: {dateFormat(formattedEntries[formattedEntries.length-1].dateObj, "MMM d, yyyy")} to {dateFormat(formattedEntries[0].dateObj, "MMM d, yyyy")}</li>
                          <li>• Weight range: {Math.min(...formattedEntries.map(e => e.weight))} kg to {Math.max(...formattedEntries.map(e => e.weight))} kg</li>
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className={`mt-4 ${colors.blockBg} p-4 rounded-md`}>
                      <div className="text-sm">
                        <span className={`${colors.text} font-medium`}>Current data summary:</span>
                        <ul className="mt-2 space-y-1 text-sm ${colors.text}">
                          <li>• Total entries: {entries.length}</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Statistics Card with Average Tables */}
          {entries.length > 1 && (
            <Card className={`${colors.cardBg} ${colors.border} shadow-xl md:col-span-2 rounded-lg overflow-hidden mt-2`}>
              <CardHeader className={`border-b ${colors.border} pb-3 pt-4 flex justify-center`}>
                <CardTitle className={`${colors.text} text-lg`}>Weight Averages</CardTitle>
              </CardHeader>
              <CardContent className={`py-6 px-6`}>
                <div className="overflow-x-auto">
                  <Table className="w-full">
                    <TableHeader>
                      <TableRow>
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
                          <TableCell className={`${colors.text} font-medium`}>7 Days</TableCell>
                          <TableCell>{sevenDayAvg.startDate} - {sevenDayAvg.endDate}</TableCell>
                          <TableCell>{sevenDayAvg.startWeight} kg</TableCell>
                          <TableCell>{sevenDayAvg.endWeight} kg</TableCell>
                          <TableCell 
                            className={`${parseFloat(sevenDayAvg.totalChange) < 0 ? colors.positive : parseFloat(sevenDayAvg.totalChange) > 0 ? colors.negative : ""}`}
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
                          <TableCell className={`${colors.text} font-medium`}>14 Days</TableCell>
                          <TableCell>{fourteenDayAvg.startDate} - {fourteenDayAvg.endDate}</TableCell>
                          <TableCell>{fourteenDayAvg.startWeight} kg</TableCell>
                          <TableCell>{fourteenDayAvg.endWeight} kg</TableCell>
                          <TableCell 
                            className={`${parseFloat(fourteenDayAvg.totalChange) < 0 ? colors.positive : parseFloat(fourteenDayAvg.totalChange) > 0 ? colors.negative : ""}`}
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
                          <TableCell className={`${colors.text} font-medium`}>30 Days</TableCell>
                          <TableCell>{thirtyDayAvg.startDate} - {thirtyDayAvg.endDate}</TableCell>
                          <TableCell>{thirtyDayAvg.startWeight} kg</TableCell>
                          <TableCell>{thirtyDayAvg.endWeight} kg</TableCell>
                          <TableCell 
                            className={`${parseFloat(thirtyDayAvg.totalChange) < 0 ? colors.positive : parseFloat(thirtyDayAvg.totalChange) > 0 ? colors.negative : ""}`}
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
          {entries.length >= 5 && (
            <Card className={`${colors.cardBg} ${colors.border} shadow-xl md:col-span-2 rounded-lg overflow-hidden mt-2`}>
              <CardHeader className={`border-b ${colors.border} pb-3 pt-4 flex justify-center`}>
                <CardTitle className={`${colors.text} text-lg`}>Weight Distribution</CardTitle>
              </CardHeader>
              <CardContent className={`py-6 px-6`}>
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
                        colors: theme === 'dark' ? ['#5865f2'] : ['#8DA101'],
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
                          show: false,  // Hide all grid lines
                          borderColor: '#1e1f22',
                          strokeDashArray: 3,
                          padding: {
                            left: 0,
                            right: 0
                          },
                          xaxis: {
                            lines: {
                              show: false
                            }
                          },
                          yaxis: {
                            lines: {
                              show: false
                            }
                          }
                        },
                        xaxis: {
                          categories: getWeightRanges(),
                          labels: {
                            style: {
                              colors: '#b5bac1',
                            },
                            rotate: -45,
                            rotateAlways: false,
                            hideOverlappingLabels: true,
                            trim: true,
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
                              color: '#b5bac1'
                            }
                          },
                          labels: {
                            style: {
                              colors: '#b5bac1',
                            },
                          },
                        },
                        tooltip: {
                          theme: theme === 'dark' ? 'dark' : 'light',
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