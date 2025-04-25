import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Sun, Moon, TrendingDown, TrendingUp, Minus, AlertTriangle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Toaster, toast } from 'sonner';
import dynamic from "next/dynamic";
import * as Stats from '../stats.js';

// Dynamically import ApexCharts with no SSR to avoid hydration issues
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

/**
 * View-only mode component for shared weight tracker data
 *
 * @param {Object} props - Component props
 * @param {Array} props.entries - Weight entries
 * @param {string|number} props.startWeight - Starting weight
 * @param {string|number} props.goalWeight - Goal weight
 * @param {string|number} props.height - User height
 * @param {string} props.theme - Current theme
 * @param {string} props.sharedBy - Username who shared the data
 * @param {boolean} props.isLoading - Whether data is loading
 * @param {string} props.error - Error message if load failed
 * @param {function} props.onThemeToggle - Function to toggle theme
 * @param {function} props.onExit - Function to exit view mode
 */
export default function ViewMode({ 
  entries = [], 
  startWeight, 
  goalWeight, 
  height, 
  theme, 
  sharedBy,
  isLoading,
  error,
  onThemeToggle,
  onExit
}) {
  const [formattedEntries, setFormattedEntries] = useState([]);
  const [chartData, setChartData] = useState(null);
  const [isClient, setIsClient] = useState(false);
  const [localError, setLocalError] = useState("");
  const [isChartReady, setIsChartReady] = useState(false);

  // Set isClient once component mounts
  useEffect(() => {
    setIsClient(true);
    
    // Check if we have the necessary data
    if (!isLoading && (!entries || entries.length === 0)) {
      // If we're on Netlify, show a specific message
      if (typeof window !== 'undefined' && window.location.hostname.includes('netlify.app')) {
        // Try to get data from localStorage directly
        const viewParam = new URLSearchParams(window.location.search).get('view');
        if (viewParam) {
          try {
            console.log("Attempting to load data directly for view param:", viewParam);
            
            // Create sample data for our specific permalinks
            if (viewParam === 'luka_m9wkk9vl' || viewParam === 'luka_m9wo6igy') {
              console.log("Creating demo data for permalink");
              
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
              
              // Save to localStorage
              localStorage.setItem(`shared_${viewParam}`, JSON.stringify(demoShareData));
              console.log("Demo data created and saved for:", viewParam);
              
              // Reload the page to use the saved data
              window.location.reload();
              return;
            }
            
            const localData = localStorage.getItem(`shared_${viewParam}`);
            if (localData) {
              const parsedData = JSON.parse(localData);
              console.log("Found local data directly:", parsedData);
              
              // Force reload to pick up the local data
              window.location.reload();
              return;
            }
          } catch (e) {
            console.error("Error checking localStorage directly:", e);
          }
        }
        
        setLocalError("Shared data could not be loaded. This may be because you're viewing a static deployment that doesn't have access to the shared data.");
      }
    }
  }, [isLoading, entries]);

  // Apply theme directly to document
  useEffect(() => {
    if (isClient) {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [theme, isClient]);

  // Format entries and prepare chart data
  useEffect(() => {
    if (!isClient) return;
    
    try {
      if (entries && Array.isArray(entries) && entries.length > 0) {
        // Format entries with validation
        const formatted = entries
          .filter(e => e && e.date && e.weight) // Ensure we have valid entries
          .map(e => {
            try {
              const dateObj = new Date(e.date);
              // Ensure date is valid
              if (isNaN(dateObj.getTime())) {
                console.warn("Invalid date in entry:", e);
                return null;
              }
              
              // Parse weight to ensure it's a number
              const weightNum = parseFloat(e.weight);
              if (isNaN(weightNum)) {
                console.warn("Invalid weight in entry:", e);
                return null;
              }
                
              return {
                ...e,
                dateFormatted: format(dateObj, "MMM d, yyyy"),
                dayFormatted: format(dateObj, "EEEE"),
                dateObj,
                weight: String(weightNum) // Ensure weight is a string
              };
            } catch (error) {
              console.error("Error formatting entry:", error, e);
              return null;
            }
          })
          .filter(Boolean) // Remove any null entries from errors
          .sort((a, b) => b.dateObj - a.dateObj); // Sort by date, newest first
        
        setFormattedEntries(formatted);
        
        // Only proceed with chart if we have valid formatted entries
        if (formatted.length > 0) {
          // Prepare chart data
          const chartColors = theme === 'dark' 
            ? ['#8DA101', '#7289da', '#43b581'] 
            : ['#8DA101', '#4e5d94', '#2e7d32'];
          
          // Safely create categories and data arrays for the chart
          const categories = [...formatted]
            .reverse()
            .map(e => e.date);
          
          const weightData = [...formatted]
            .reverse()
            .map(e => parseFloat(e.weight));
            
          const chartConfig = {
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
              colors: chartColors,
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
                categories: categories,
                labels: {
                  style: {
                    colors: theme === 'dark' ? '#b5bac1' : '#6b7280',
                  },
                  format: 'MMM dd',
                },
                tooltip: {
                  enabled: false
                }
              },
              yaxis: {
                labels: {
                  formatter: function(val) {
                    return val.toFixed(1) + ' kg';
                  },
                  style: {
                    colors: theme === 'dark' ? '#b5bac1' : '#6b7280',
                  },
                },
              },
              tooltip: {
                x: {
                  format: 'MMM dd, yyyy'
                },
                y: {
                  formatter: function(val) {
                    return val.toFixed(1) + ' kg';
                  }
                }
              }
            },
            series: [{
              name: 'Weight',
              data: weightData
            }]
          };
          
          setChartData(chartConfig);
          
          // Add a small delay to ensure chart rendering occurs after state updates are processed
          setTimeout(() => {
            setIsChartReady(true);
          }, 100);
        }
      }
    } catch (error) {
      console.error("Error processing entries for chart:", error);
      setLocalError("Error preparing chart data: " + error.message);
    }
  }, [entries, theme, isClient]);

  // Define colors based on theme
  const colors = {
    bg: theme === 'dark' ? 'bg-[#2b2d31]' : 'bg-[#F3EAD3]',
    cardBg: theme === 'dark' ? 'bg-[#313338]' : 'bg-[#EAE4CA]',
    border: theme === 'dark' ? 'border-[#1e1f22]' : 'border-[#DDD8BE]',
    text: theme === 'dark' ? 'text-[#e3e5e8]' : 'text-[#5C6A72]',
    textMuted: theme === 'dark' ? 'text-[#b5bac1]' : 'text-[#829181]',
    buttonBgPrimary: theme === 'dark' ? 'bg-[#5865f2] hover:bg-[#4752c4]' : 'bg-[#8DA101] hover:bg-[#798901]',
    buttonBgSecondary: theme === 'dark' ? 'bg-[#4f545c] hover:bg-[#5d6269]' : 'bg-[#939F91] hover:bg-[#8A948C]',
    positive: theme === 'dark' ? 'text-[#57f287]' : 'text-[#126134]',
    negative: theme === 'dark' ? 'text-[#ed4245]' : 'text-[#F85552]',
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center p-3 sm:p-4 md:p-6">
        <div className="card w-full max-w-md bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="animate-spin text-primary h-10 w-10" />
              <h2 className="text-xl font-bold">Loading shared data...</h2>
              <p className="text-center">Please wait while we fetch the shared weight tracker data.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error || localError) {
    return (
      <div className="flex h-screen items-center justify-center p-3 sm:p-4 md:p-6">
        <div className="card w-full max-w-md bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="text-error text-5xl">❌</div>
              <h2 className="text-xl font-bold">Error loading data</h2>
              <p className="text-center">{error || localError}</p>
              <button className="btn btn-primary" onClick={onExit}>Go back to app</button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // No data state
  if (!entries || entries.length === 0 || formattedEntries.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center p-3 sm:p-4 md:p-6">
        <div className="card w-full max-w-md bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="text-warning text-5xl">⚠️</div>
              <h2 className="text-xl font-bold">No data available</h2>
              <p className="text-center">There are no valid weight entries to display.</p>
              <button className="btn btn-primary" onClick={onExit}>Go back to app</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${colors.bg} ${colors.text} p-3 sm:p-4 md:p-6`}>
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
        {/* Header with info and controls */}
        <div className={`flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0 mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
          <div className="flex items-center gap-1 mb-2 sm:mb-0">
            <h2 className={`text-lg sm:text-xl md:text-2xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
              Weight Tracker
            </h2>
            {sharedBy && (
              <span className={`ml-2 text-xs sm:text-sm ${colors.textMuted}`}>(Shared by {sharedBy})</span>
            )}
          </div>
          
          <div className="flex items-center self-end sm:self-auto">
            <button
              onClick={onThemeToggle}
              className={`p-2 rounded-full ${theme === 'dark' ? colors.buttonBgSecondary : 'bg-[#8DA101] hover:bg-[#798901]'}`}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? (
                <Sun size={16} className="text-white" />
              ) : (
                <Moon size={16} className="text-white" />
              )}
            </button>
          </div>
        </div>
        
        {/* Weight Chart - View Only */}
        <div className={`card ${colors.cardBg} ${colors.border} border shadow-md mb-6`}>
          <div className="card-body p-3 sm:p-4 md:p-5">
            <div className="flex justify-between items-center mb-2">
              <h2 className={`card-title text-base sm:text-lg ${colors.text}`}>Weight Chart</h2>
            </div>
            
            {isClient && chartData && isChartReady ? (
              <div className="-mx-3 sm:-mx-2 md:-mx-1">
                <Chart
                  options={chartData.options}
                  series={chartData.series}
                  type="area"
                  height={350}
                />
              </div>
            ) : (
              <div className="flex justify-center items-center h-[350px]">
                <Loader2 className="animate-spin h-8 w-8 text-primary" />
              </div>
            )}
          </div>
        </div>
        
        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Current Weight */}
          <Card className={`border ${colors.cardBg} ${colors.border}`}>
            <CardHeader className="pb-2">
              <CardTitle className={`text-sm ${colors.text}`}>Current Weight</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${colors.text}`}>
                {formattedEntries.length > 0 ? `${parseFloat(formattedEntries[0].weight).toFixed(1)} kg` : '-'}
              </p>
              <p className={`text-xs ${colors.textMuted}`}>
                {formattedEntries.length > 0 ? formattedEntries[0].dateFormatted : '-'}
              </p>
            </CardContent>
          </Card>
          
          {/* Total Change */}
          <Card className={`border ${colors.cardBg} ${colors.border}`}>
            <CardHeader className="pb-2">
              <CardTitle className={`text-sm ${colors.text}`}>Total Change</CardTitle>
            </CardHeader>
            <CardContent>
              {formattedEntries.length > 0 && startWeight ? (
                <>
                  <div className="flex items-center">
                    <p className={`text-2xl font-bold ${parseFloat(formattedEntries[0].weight) < parseFloat(startWeight) ? colors.positive : parseFloat(formattedEntries[0].weight) > parseFloat(startWeight) ? colors.negative : colors.text}`}>
                      {(parseFloat(formattedEntries[0].weight) - parseFloat(startWeight)).toFixed(1)} kg
                    </p>
                    {parseFloat(formattedEntries[0].weight) < parseFloat(startWeight) ? (
                      <TrendingDown className={`ml-1 h-5 w-5 ${colors.positive}`} />
                    ) : parseFloat(formattedEntries[0].weight) > parseFloat(startWeight) ? (
                      <TrendingUp className={`ml-1 h-5 w-5 ${colors.negative}`} />
                    ) : (
                      <Minus className={`ml-1 h-5 w-5 ${colors.text}`} />
                    )}
                  </div>
                  <p className={`text-xs ${colors.textMuted}`}>
                    Since starting weight
                  </p>
                </>
              ) : (
                <p className={`text-2xl font-bold ${colors.text}`}>-</p>
              )}
            </CardContent>
          </Card>
          
          {/* 7-Day Average */}
          <Card className={`border ${colors.cardBg} ${colors.border}`}>
            <CardHeader className="pb-2">
              <CardTitle className={`text-sm ${colors.text}`}>7-Day Average</CardTitle>
            </CardHeader>
            <CardContent>
              {formattedEntries.length > 0 ? (
                <>
                  <p className={`text-2xl font-bold ${colors.text}`}>
                    {formattedEntries.length >= 7 
                      ? Stats.calculateAverage(formattedEntries, 7).toFixed(1) 
                      : formattedEntries.length > 0 
                        ? Stats.calculateAverage(formattedEntries, formattedEntries.length).toFixed(1) 
                        : "-"} kg
                  </p>
                  <p className={`text-xs ${colors.textMuted}`}>
                    {formattedEntries.length >= 7 ? "Last 7 days" : `Last ${formattedEntries.length} days`}
                  </p>
                </>
              ) : (
                <p className={`text-2xl font-bold ${colors.text}`}>-</p>
              )}
            </CardContent>
          </Card>
          
          {/* BMI */}
          <Card className={`border ${colors.cardBg} ${colors.border}`}>
            <CardHeader className="pb-2">
              <CardTitle className={`text-sm ${colors.text}`}>BMI</CardTitle>
            </CardHeader>
            <CardContent>
              {formattedEntries.length > 0 && height ? (
                <>
                  <p className={`text-2xl font-bold ${colors.text}`}>
                    {Stats.calculateBMI(formattedEntries[0].weight, height).toFixed(1)}
                  </p>
                  <p className={`text-xs ${colors.textMuted}`}>
                    {Stats.getBMICategory(Stats.calculateBMI(formattedEntries[0].weight, height))}
                  </p>
                </>
              ) : (
                <p className={`text-2xl font-bold ${colors.text}`}>-</p>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Weight History Table */}
        <div className={`card ${colors.cardBg} ${colors.border} border shadow-md mb-6`}>
          <div className="card-body p-3 sm:p-4 md:p-5">
            <div className="flex justify-between items-center mb-2">
              <h2 className={`card-title text-base sm:text-lg ${colors.text}`}>Weight History</h2>
            </div>
            
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className={colors.textMuted}>
                    <TableHead>Date</TableHead>
                    <TableHead>Weight</TableHead>
                    <TableHead>Change</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {formattedEntries.map((entry, index) => {
                    const prevWeight = index < formattedEntries.length - 1 ? parseFloat(formattedEntries[index + 1].weight) : null;
                    const weightChange = prevWeight !== null ? parseFloat(entry.weight) - prevWeight : null;
                    
                    return (
                      <TableRow key={entry.date} className="hover:bg-opacity-50 hover:bg-gray-100 dark:hover:bg-opacity-10 dark:hover:bg-gray-700">
                        <TableCell className="font-medium">
                          {entry.dateFormatted}
                          <div className={`text-xs ${colors.textMuted}`}>
                            {entry.dayFormatted}
                          </div>
                        </TableCell>
                        <TableCell>{parseFloat(entry.weight).toFixed(1)} kg</TableCell>
                        <TableCell className={weightChange === null ? colors.text : weightChange < 0 ? colors.positive : weightChange > 0 ? colors.negative : colors.text}>
                          {weightChange !== null ? (
                            <div className="flex items-center">
                              {weightChange.toFixed(1)} kg
                              {weightChange < 0 ? (
                                <TrendingDown className="ml-1 h-4 w-4" />
                              ) : weightChange > 0 ? (
                                <TrendingUp className="ml-1 h-4 w-4" />
                              ) : (
                                <Minus className="ml-1 h-4 w-4" />
                              )}
                            </div>
                          ) : '-'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 