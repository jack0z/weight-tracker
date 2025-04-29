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
  const [currentUser, setCurrentUser] = useState(null);
  const [showLoginForm, setShowLoginForm] = useState(false);
  
  // Theme state
  const [theme, setTheme] = useState("light");
  
  // Share functionality state
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [viewMode, setViewMode] = useState(false);
  const [sharedData, setSharedData] = useState(null);

  // Loading state
  const [isLoading, setIsLoading] = useState(true);

  // Route check state
  const [isRouteChecked, setIsRouteChecked] = useState(false);
  
  // Toggle theme function
  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    
    // Always save theme preference to localStorage
    localStorage.setItem("theme", newTheme);
    
    // If in view mode, update the sharedData theme too
    if (viewMode && sharedData) {
      const updatedSharedData = {
        ...sharedData,
        theme: newTheme
      };
      setSharedData(updatedSharedData);
      
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
        setCurrentUser(existingUser);
        
        // Set user data from session storage
        if (existingUser.entries) {
          setEntries(existingUser.entries);
          const formatted = Data.formatEntries(existingUser.entries, dateFormat);
          setFormattedEntries(formatted);
        }
        
        if (existingUser.startWeight) {
          setStartWeight(existingUser.startWeight);
        }
        
        if (existingUser.goalWeight) {
          setGoalWeight(existingUser.goalWeight);
        }
        
        if (existingUser.height) {
          setHeight(existingUser.height);
        }

        if (existingUser.settings?.theme) {
          setTheme(existingUser.settings.theme);
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

  // Save entries to server when they change
  useEffect(() => {
    if (isClient && isLoggedIn && currentUser && entries.length > 0) {
      // Save entries to server
      Auth.saveUserData(currentUser.username, entries, {
        ...currentUser.settings,
        theme
      });
      setFormattedEntries(Data.formatEntries(entries, dateFormat));
    }
  }, [entries, isClient, isLoggedIn, currentUser, theme]);

  // Save settings to server when they change
  useEffect(() => {
    if (isClient && isLoggedIn && currentUser) {
      // Save settings to server
      Auth.saveUserData(currentUser.username, entries, {
        ...currentUser.settings,
        theme,
        startWeight,
        goalWeight,
        height
      });
    }
  }, [startWeight, goalWeight, height, isClient, isLoggedIn, currentUser, entries, theme]);

  useEffect(() => {
    const checkRouteAndLoadData = async () => {
      const hash = window.location.hash;
      const shareMatch = hash.match(/#\/share\/([\w-]+)/);
      
      if (shareMatch) {
        const shareId = shareMatch[1];
        const result = await Share.loadSharedView(shareId);
        if (result.success) {
          setViewMode(true);
          setSharedData(result.data);
          setShowLoginForm(false);
        }
      }
      setIsRouteChecked(true);
      setIsLoading(false);
    };

    checkRouteAndLoadData();
  }, []);

  useEffect(() => {
    if (isClient && typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const viewParam = urlParams.get('view');
      
      if (viewParam) {
        (async () => {
          const result = await Share.loadSharedView(viewParam);
          if (result.success) {
            setViewMode(true);
            setSharedData(result.data);
          } else {
            toast.error(result.message);
            window.location.href = window.location.origin;
          }
        })();
      }
    }
  }, [isClient]);

  // Handle user login
  const handleUserLogin = async (userData) => {
    try {
      setIsLoggedIn(true);
      setCurrentUser(userData);
      setShowLoginForm(false);
      
      // Set user data
      if (userData.entries) {
        setEntries(userData.entries);
        const formatted = Data.formatEntries(userData.entries, dateFormat);
        setFormattedEntries(formatted);
      }
      
      if (userData.startWeight) {
        setStartWeight(userData.startWeight);
      }
      
      if (userData.goalWeight) {
        setGoalWeight(userData.goalWeight);
      }
      
      if (userData.height) {
        setHeight(userData.height);
      }

      if (userData.settings?.theme) {
        setTheme(userData.settings.theme);
      }
      
      toast.success(`Welcome back, ${userData.username}!`);
    } catch (error) {
      console.error("Error during login:", error);
      toast.error("Failed to load user data");
    }
  };

  // Handle user logout
  const handleUserLogout = () => {
    Auth.handleLogout();
    setIsLoggedIn(false);
    setCurrentUser(null);
    setEntries([]);
    setFormattedEntries([]);
    setStartWeight("");
    setGoalWeight("");
    setHeight("");
    setShowLoginForm(true);
  };

  // Handle setting start weight
  const handleSetStart = () => {
    if (!weight || isNaN(weight) || weight <= 0) {
      toast.error("Please enter a valid weight");
      return;
    }
    setStartWeight(weight);
    toast.success("Start weight set successfully");
  };

  // Handle setting goal weight
  const handleSetGoal = () => {
    if (!weight || isNaN(weight) || weight <= 0) {
      toast.error("Please enter a valid weight");
      return;
    }
    setGoalWeight(weight);
    toast.success("Goal weight set successfully");
  };

  // Handle setting height
  const handleSetHeight = () => {
    if (!weight || isNaN(weight) || weight <= 0) {
      toast.error("Please enter a valid height");
      return;
    }
    setHeight(weight);
    toast.success("Height set successfully");
  };

  // Handle adding a new weight entry
  const handleAdd = () => {
    if (!weight || isNaN(weight) || weight <= 0) {
      toast.error("Please enter a valid weight");
      return;
    }

    const newEntry = {
      date: new Date(date).toISOString(),
      weight: parseFloat(weight)
    };

    setEntries(prev => [newEntry, ...prev]);
    setWeight("");
    toast.success("Weight entry added successfully");
  };

  // Handle deleting a weight entry
  const handleDelete = (id) => {
    setEntries(prev => prev.filter(entry => entry.id !== id && entry._id !== id));
    toast.success("Weight entry deleted successfully");
  };

  // Get trend icon based on weight change
  const getTrendIcon = (value) => {
    if (value < 0) return <TrendingDown className="w-4 h-4 text-green-500" />;
    if (value > 0) return <TrendingUp className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-500" />;
  };

  // Calculate BMI
  const calculateBMI = (weightKg, heightCm) => {
    if (!weightKg || !heightCm) return null;
    const heightM = heightCm / 100;
    return weightKg / (heightM * heightM);
  };

  // Get BMI category
  const getBMICategory = (bmi) => {
    if (bmi < 18.5) return "Underweight";
    if (bmi < 25) return "Normal weight";
    if (bmi < 30) return "Overweight";
    return "Obese";
  };

  // Calculate progress percentage
  const calculateProgress = (currentWeight, goalWeight) => {
    if (!currentWeight || !goalWeight || !startWeight) return 0;
    
    const totalChange = startWeight - goalWeight;
    const currentChange = startWeight - currentWeight;
    
    if (totalChange === 0) return 0;
    
    const progress = (currentChange / totalChange) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };

  // Calculate estimated completion date
  const calculateEstimateCompletion = (currentWeight, goalWeight) => {
    if (!currentWeight || !goalWeight || !startWeight || entries.length < 2) return null;
    
    const sortedEntries = [...entries].sort((a, b) => new Date(a.date) - new Date(b.date));
    const firstEntry = sortedEntries[0];
    const lastEntry = sortedEntries[sortedEntries.length - 1];
    
    const daysElapsed = (new Date(lastEntry.date) - new Date(firstEntry.date)) / (1000 * 60 * 60 * 24);
    const weightLost = firstEntry.weight - lastEntry.weight;
    
    if (weightLost <= 0) return null;
    
    const ratePerDay = weightLost / daysElapsed;
    const remainingWeight = currentWeight - goalWeight;
    const daysRemaining = remainingWeight / ratePerDay;
    
    return new Date(Date.now() + daysRemaining * 24 * 60 * 60 * 1000);
  };

  // Calculate days tracking
  const calculateDaysTracking = () => {
    if (entries.length === 0) return 0;
    
    const sortedEntries = [...entries].sort((a, b) => new Date(a.date) - new Date(b.date));
    const firstEntry = sortedEntries[0];
    const lastEntry = sortedEntries[sortedEntries.length - 1];
    
    return Math.ceil((new Date(lastEntry.date) - new Date(firstEntry.date)) / (1000 * 60 * 60 * 24));
  };

  // Calculate forecast
  const calculateForecast = () => {
    if (entries.length < 2) return null;
    
    const sortedEntries = [...entries].sort((a, b) => new Date(a.date) - new Date(b.date));
    const firstEntry = sortedEntries[0];
    const lastEntry = sortedEntries[sortedEntries.length - 1];
    
    const daysElapsed = (new Date(lastEntry.date) - new Date(firstEntry.date)) / (1000 * 60 * 60 * 24);
    const weightLost = firstEntry.weight - lastEntry.weight;
    
    if (weightLost <= 0) return null;
    
    const ratePerDay = weightLost / daysElapsed;
    const forecast = [];
    
    for (let i = 1; i <= 30; i++) {
      const date = new Date(Date.now() + i * 24 * 60 * 60 * 1000);
      const weight = lastEntry.weight - (ratePerDay * i);
      forecast.push({ date, weight });
    }
    
    return forecast;
  };

  // Export data to CSV
  const exportToCsv = () => {
    if (entries.length === 0) {
      toast.error("No data to export");
      return;
    }
    
    const csv = Export.entriesToCsv(entries);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `weight-tracker-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Handle file import
  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
      const text = await file.text();
      const importedEntries = Export.csvToEntries(text);
      
      if (importedEntries.length === 0) {
        toast.error("No valid entries found in file");
        return;
      }
      
      setEntries(prev => [...importedEntries, ...prev]);
      toast.success(`Imported ${importedEntries.length} entries successfully`);
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Failed to import file");
    }
  };

  // Get weight ranges for distribution
  const getWeightRanges = () => {
    if (entries.length === 0) return [];
    
    const weights = entries.map(e => e.weight);
    const min = Math.min(...weights);
    const max = Math.max(...weights);
    const range = max - min;
    const step = range / 10;
    
    return Array.from({ length: 11 }, (_, i) => min + (step * i));
  };

  // Get weight distribution
  const getWeightDistribution = () => {
    if (entries.length === 0) return [];
    
    const ranges = getWeightRanges();
    const distribution = ranges.slice(0, -1).map((start, i) => {
      const end = ranges[i + 1];
      const count = entries.filter(e => e.weight >= start && e.weight < end).length;
      return {
        range: `${start.toFixed(1)}-${end.toFixed(1)}`,
        count
      };
    });
    
    return distribution;
  };

  // Handle share link generation
  const handleShareLink = async () => {
    try {
      const shareData = {
        entries,
        startWeight,
        goalWeight,
        height,
        theme
      };
      
      const response = await fetch('/.netlify/functions/share-create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(shareData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create share link');
      }
      
      setShareLink(data.shareLink);
      setShowShareModal(true);
    } catch (error) {
      console.error('Share error:', error);
      toast.error('Failed to create share link');
    }
  };

  // Handle exiting view mode
  const handleExitViewMode = () => {
    setViewMode(false);
    setSharedData(null);
    window.location.href = window.location.origin;
  };

  // Show loading spinner
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show login form
  if (showLoginForm) {
    return (
      <Login
        onLogin={handleUserLogin}
        theme={theme}
        toggleTheme={toggleTheme}
      />
    );
  }

  // Show view mode
  if (viewMode && sharedData) {
    return (
      <ViewMode
        data={sharedData}
        onExit={handleExitViewMode}
        theme={theme}
        toggleTheme={toggleTheme}
      />
    );
  }

  // Main app view
  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Weight Tracker</h1>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={handleShareLink}>
            <Share2 className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleUserLogout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add Weight Entry</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label htmlFor="weight" className="block text-sm font-medium mb-1">
                Weight (kg)
              </label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="Enter weight"
                className="w-full"
              />
            </div>
            <div className="flex-1">
              <label htmlFor="date" className="block text-sm font-medium mb-1">
                Date
              </label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full"
              />
            </div>
            <Button onClick={handleAdd} className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="start-weight" className="block text-sm font-medium mb-1">
                Start Weight (kg)
              </label>
              <div className="flex gap-2">
                <Input
                  id="start-weight"
                  type="number"
                  step="0.1"
                  value={startWeight}
                  onChange={(e) => setStartWeight(e.target.value)}
                  placeholder="Enter start weight"
                  className="w-full"
                />
                <Button onClick={handleSetStart} variant="outline">
                  Set
                </Button>
              </div>
            </div>
            <div>
              <label htmlFor="goal-weight" className="block text-sm font-medium mb-1">
                Goal Weight (kg)
              </label>
              <div className="flex gap-2">
                <Input
                  id="goal-weight"
                  type="number"
                  step="0.1"
                  value={goalWeight}
                  onChange={(e) => setGoalWeight(e.target.value)}
                  placeholder="Enter goal weight"
                  className="w-full"
                />
                <Button onClick={handleSetGoal} variant="outline">
                  Set
                </Button>
              </div>
            </div>
            <div>
              <label htmlFor="height" className="block text-sm font-medium mb-1">
                Height (cm)
              </label>
              <div className="flex gap-2">
                <Input
                  id="height"
                  type="number"
                  step="0.1"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="Enter height"
                  className="w-full"
                />
                <Button onClick={handleSetHeight} variant="outline">
                  Set
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Weight Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <Chart
              options={ChartUtils.getChartOptions(startWeight, goalWeight)}
              series={ChartUtils.getChartSeries(entries)}
              type="line"
              height="100%"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Weight History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Weight (kg)</TableHead>
                  <TableHead>Trend</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {formattedEntries.map((entry, index) => (
                  <TableRow key={entry.id || entry._id}>
                    <TableCell>{entry.dateFormatted}</TableCell>
                    <TableCell>{entry.weight.toFixed(1)}</TableCell>
                    <TableCell>
                      {getTrendIcon(
                        entry.weight - (index < formattedEntries.length - 1 ? formattedEntries[index + 1].weight : entry.weight)
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(entry.id || entry._id)}
                        className="h-8 w-8"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Export/Import</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button onClick={exportToCsv} className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export to CSV
            </Button>
            <div className="relative">
              <input
                type="file"
                accept=".csv"
                onChange={handleImport}
                className="hidden"
                id="import-file"
              />
              <Button
                onClick={() => document.getElementById('import-file').click()}
                className="flex items-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                Import from CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {showShareModal && (
        <ShareModal
          onClose={() => setShowShareModal(false)}
          shareLink={shareLink}
        />
      )}

      <Toaster />
    </div>
  );
}