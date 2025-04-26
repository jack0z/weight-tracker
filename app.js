"use client";

import { useState, useEffect } from "react";
import { format as dateFormat } from "date-fns";
import { Trash2, Save, TrendingDown, TrendingUp, Minus, Download, Calendar, ArrowRight, LogOut, Sun, Moon, Share2 } from "lucide-react";
import { toast, Toaster } from "sonner";
import dynamic from "next/dynamic";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./components/ui/table";

// Import our modules
import * as Data from './data.js';
import * as Stats from './stats.js';
import * as ChartUtils from './chart.js';
import * as Export from './export.js';
import * as Auth from './auth.js';
import * as Share from './share.js';

// Import theme utils
import { getThemeColors, applyThemeToDocument, getSavedTheme } from './utils/theme-utils.js';

// Import components
import Login from './components/Login.jsx';
import ShareModal from './components/ShareModal.jsx';
import ViewMode from './components/ViewMode.jsx';
import Header from './components/Header.jsx';

// Import card components
import SettingsCard from './components/cards/SettingsCard.jsx';
import ChartCard from './components/cards/ChartCard.jsx';
import AddEntryCard from './components/cards/AddEntryCard.jsx';
import HistoryCard from './components/cards/HistoryCard.jsx';
import SummaryCard from './components/cards/SummaryCard.jsx';
import ForecastCard from './components/cards/ForecastCard.jsx';
import AveragesCard from './components/cards/AveragesCard.jsx';
import DistributionCard from './components/cards/DistributionCard.jsx';
import DataManagementCard from './components/cards/DataManagementCard.jsx';

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
  const [isCurrentSharePermalink, setIsCurrentSharePermalink] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [viewData, setViewData] = useState(null);
  const [showShareDropdown, setShowShareDropdown] = useState(false);
  const [isSharingInProgress, setIsSharingInProgress] = useState(false);
  
  // Toggle theme function
  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    
    // Apply theme changes using utility function
    applyThemeToDocument(newTheme);
    
    // If in view mode, update the viewData theme too
    if (viewMode && viewData) {
      const updatedViewData = {
        ...viewData,
        theme: newTheme
      };
      setViewData(updatedViewData);
    }
  };
  
  // Initialize state from localStorage only after component mounts
  useEffect(() => {
    console.log("Initial useEffect running...");
    setIsClient(true);
    
    try {
      // Check for view parameter in URL (for shared links)
      const urlParams = new URLSearchParams(window.location.search);
      const viewParam = urlParams.get('view');
      
      if (viewParam) {
        console.log("Shared view detected:", viewParam);
        setViewMode(true);
        
        // Try to load the shared data
        Share.loadSharedView(viewParam)
          .then(result => {
            if (result.success) {
              setViewData(result.data);
              // Set theme from shared data
              if (result.data.theme) {
                setTheme(result.data.theme);
              }
            } else {
              toast.error(result.message || "Error loading shared data");
              console.error("Error loading shared view:", result.message);
            }
          })
          .catch(error => {
            console.error("Error loading shared view:", error);
            toast.error("Error loading shared data");
          })
          .finally(() => {
            // Always set loading to false, even on error
            setForceRender(prev => !prev);
          });
        
        return; // Skip the rest of the initialization if in view mode
      }
      
      // Normal app initialization (only if not in view mode)
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
      const savedTheme = getSavedTheme();
      setTheme(savedTheme);
      
      console.log("Initial data loading complete!");
    } catch (error) {
      console.error("Error during initial data loading:", error);
    }
  }, []);
  
  // Apply theme to document
  useEffect(() => {
    if (!isClient) return;
    applyThemeToDocument(theme);
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

  // Get trend icons for displaying weight changes
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

  // Create demo share data for Netlify deployment
  const createDemoShareData = (forcePermalink = false) => {
    try {
      // For demo view links in Netlify, make sure the data exists
      if (typeof window !== 'undefined') {
        const demoShareId = forcePermalink ? 'demo_permalink' : 'demo_share';
        
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
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // Expires in 1 year
            isPermalink: forcePermalink
          };
          
          // Save to localStorage
          localStorage.setItem(`shared_${demoShareId}`, JSON.stringify(demoShareData));
          
          console.log(forcePermalink ? "Permalink demo data created" : "General demo share data created");
          return demoShareData;
        }
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
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // Expires in 1 year
      isPermalink: true
    };
    
    // Save to localStorage with demo_permalink ID
    localStorage.setItem("shared_demo_permalink", JSON.stringify(demoShareData));
    console.log("Demo permalink created successfully");
  };

  // Exit shared view mode
  const handleExitViewMode = () => {
    setViewMode(false);
    setViewData(null);
    window.history.pushState({}, '', '/');
  };
  
  // Get theme colors
  const colors = getThemeColors(theme);
  
  // If login form is showing, render that
  if (showLoginForm && !viewMode) {
    return (
      <div className={`min-h-screen ${colors.bg} flex items-center justify-center p-4`}>
        <Login onLogin={handleUserLogin} theme={theme} toggleTheme={toggleTheme} />
      </div>
    );
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
  
  // If in view mode but data is still loading
  if (viewMode && !viewData) {
    return (
      <div className={`min-h-screen ${colors.bg} ${colors.text} flex items-center justify-center p-4`}>
        <div className="text-center">
          <h1 className="text-xl font-semibold mb-4">Loading Shared Data...</h1>
          <p className="opacity-70 mb-4">Please wait while we load the shared weight tracker.</p>
          <button
            onClick={handleExitViewMode}
            className={`${colors.buttonBgPrimary} px-4 py-2 rounded-md text-white`}
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

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
        <Header 
          currentUser={currentUser}
          theme={theme}
          colors={colors}
          isSharingInProgress={isSharingInProgress}
          toggleTheme={toggleTheme}
          handleUserLogout={handleUserLogout}
          handleShare={handleShare}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Settings Card - Top Left */}
          <SettingsCard
            colors={colors}
            startWeight={startWeight}
            goalWeight={goalWeight}
            height={height}
            setStartWeight={setStartWeight}
            setGoalWeight={setGoalWeight}
            setHeight={setHeight}
          />

          {/* Chart Card - Top Right */}
          <ChartCard 
            colors={colors}
            entries={entries}
            chartConfig={chartConfig}
          />

          {/* Add New Entry Card - Bottom Left */}
          <AddEntryCard
            colors={colors}
            date={date}
            setDate={setDate}
            weight={weight}
            setWeight={setWeight}
            entries={entries}
            setEntries={setEntries}
            theme={theme}
          />

          {/* Weight History Card - Bottom Right */}
          <HistoryCard
            colors={colors}
            formattedEntries={formattedEntries}
            entries={entries}
            setEntries={setEntries}
            theme={theme}
          />
          
          {/* Summary Card - Spans full width on larger screens */}
          {entries.length > 0 && (
            <SummaryCard
              colors={colors}
              entries={entries}
              startWeight={startWeight}
              goalWeight={goalWeight}
              height={height}
              theme={theme}
            />
          )}
          
          {/* Additional Cards */}
          {entries.length > 0 && (
            <>
              {/* Forecast Card */}
              <ForecastCard
                colors={colors}
                formattedEntries={formattedEntries}
                goalWeight={goalWeight}
                theme={theme}
              />
              
              {/* Averages Card */}
              <AveragesCard
                colors={colors}
                formattedEntries={formattedEntries}
                theme={theme}
              />
              
              {/* Distribution Card */}
              <DistributionCard
                colors={colors}
                entries={entries}
                theme={theme}
              />
              
              {/* Data Management Card - Spans full width */}
              <div className="md:col-span-2">
                <DataManagementCard
                  colors={colors}
                  entries={entries}
                  setEntries={setEntries}
                  theme={theme}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}