"use client";

import { useState, useEffect } from "react";
import { Toaster } from "sonner";
import { format as dateFormat } from "date-fns";

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
import Header from './components/Header.jsx';
import Login from './components/Login.jsx';
import ShareModal from './components/ShareModal.jsx';
import ViewMode from './components/ViewMode.jsx';

// Import card components
import SettingsCard from './components/cards/SettingsCard.jsx';
import ChartCard from './components/cards/ChartCard.jsx';
import AddEntryCard from './components/cards/AddEntryCard.jsx';
import HistoryCard from './components/cards/HistoryCard.jsx';
import SummaryCard from './components/cards/SummaryCard.jsx';

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
    }
  };

  // Calculate period averages
  const sevenDayAvg = Stats.calculatePeriodAverage(formattedEntries, 7);
  const fourteenDayAvg = Stats.calculatePeriodAverage(formattedEntries, 14);
  const thirtyDayAvg = Stats.calculatePeriodAverage(formattedEntries, 30);

  // Get chart configuration
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
        </div>
      </div>
    </div>
  );
} 