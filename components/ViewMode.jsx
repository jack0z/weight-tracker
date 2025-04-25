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

  // Set isClient once component mounts
  useEffect(() => {
    setIsClient(true);
  }, []);

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

  // Format entries and prepare chart data
  useEffect(() => {
    if (entries && entries.length > 0) {
      // Format entries for display
      const formatted = entries.map(e => ({
        ...e,
        dateFormatted: format(new Date(e.date), "MMM d, yyyy"),
        dayFormatted: format(new Date(e.date), "EEEE"),
        dateObj: new Date(e.date)
      })).sort((a, b) => b.dateObj - a.dateObj);
      
      setFormattedEntries(formatted);
      
      // Prepare chart data
      const chartConfig = {
        options: {
          chart: {
            type: 'area',
            height: 350,
            toolbar: { show: false },
            background: 'transparent',
            fontFamily: 'Inter, sans-serif',
          },
          colors: theme === 'dark' ? ['#5865f2'] : ['#8DA101'],
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
            xaxis: {
              lines: {
                show: false
              }
            }
          },
          xaxis: {
            type: 'datetime',
            categories: [...formatted].reverse().map(e => e.dateObj),
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
            theme: theme === 'dark' ? 'dark' : 'light',
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
          data: [...formatted].reverse().map(e => ({
            x: e.dateObj.getTime(),
            y: parseFloat(e.weight)
          }))
        }]
      };
      
      setChartData(chartConfig);
    }
  }, [entries, theme]);

  // Add an effect to forcibly apply theme when it changes
  useEffect(() => {
    if (!isClient) return;
    
    // Apply theme to document directly in the component
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme, isClient]);

  // Get trend icon
  const getTrendIcon = (value) => {
    if (!value || value === 0) return <Minus className={`h-4 w-4 ${colors.textMuted}`} />;
    return value < 0 ? 
      <TrendingDown className={`h-4 w-4 ${theme === 'dark' ? 'text-[#57f287]' : 'text-[#126134]'}`} /> : 
      <TrendingUp className={`h-4 w-4 ${colors.negative}`} />;
  };

  // Calculate BMI if both weight and height are available
  const calculateBMI = () => {
    if (!height || !entries || entries.length === 0) return null;
    
    const latestWeight = entries[0].weight;
    const heightM = parseFloat(height) / 100;
    return (latestWeight / (heightM * heightM)).toFixed(1);
  };

  // Get BMI category
  const getBMICategory = (bmi) => {
    if (bmi < 18.5) return { category: "Underweight", color: "text-blue-500" };
    if (bmi < 25) return { category: "Normal weight", color: "text-green-500" };
    if (bmi < 30) return { category: "Overweight", color: "text-yellow-500" };
    return { category: "Obese", color: "text-red-500" };
  };

  // Calculate weight ranges and distribution
  const getWeightRanges = () => {
    if (!entries || entries.length < 5) return [];
    return Stats.getWeightRanges(entries);
  };
  
  const getWeightDistribution = () => {
    if (!entries || entries.length < 5) return [];
    return Stats.getWeightDistribution(entries);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center p-3 sm:p-4 md:p-6">
        <div className="card w-full max-w-md bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="loading loading-spinner loading-lg text-primary"></div>
              <h2 className="text-xl font-bold">Loading shared weight data...</h2>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center p-3 sm:p-4 md:p-6">
        <div className="card w-full max-w-md bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="text-error text-5xl">⚠️</div>
              <h2 className="text-xl font-bold text-error">Error Loading Data</h2>
              <p className="text-center">{error}</p>
              <button className="btn btn-primary" onClick={onExit}>Go back to app</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!entries || entries.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center p-3 sm:p-4 md:p-6">
        <div className="card w-full max-w-md bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="text-warning text-5xl">⚠️</div>
              <h2 className="text-xl font-bold">No data available</h2>
              <p className="text-center">There are no weight entries to display.</p>
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
        <Card className={`${colors.cardBg} ${colors.border} shadow-xl rounded-lg overflow-hidden`}>
          <CardHeader className={`border-b ${colors.border} pb-3 pt-4 flex justify-center`}>
            <CardTitle className={`${colors.text} text-base sm:text-lg`}>Weight Chart</CardTitle>
          </CardHeader>
          <CardContent className="py-4 px-2 sm:py-6 sm:px-6">
            <div className="h-[250px] sm:h-[300px]">
              {entries && entries.length > 0 ? (
                typeof window !== 'undefined' ? 
                  <Chart 
                    options={chartData.options} 
                    series={chartData.series} 
                    type="area" 
                    height={250}
                    width="100%"
                  />
                : <div>Loading chart...</div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-[#b5bac1]">
                  <p className="mb-2">No data available.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Summary Card - If data available */}
        {entries && entries.length > 0 && (
          <Card className={`${colors.cardBg} ${colors.border} shadow-xl rounded-lg overflow-hidden`}>
            <CardHeader className={`border-b ${colors.border} pb-3 pt-4 flex justify-center`}>
              <CardTitle className={`${colors.text} text-base sm:text-lg`}>Summary</CardTitle>
            </CardHeader>
            <CardContent className={`py-4 px-3 sm:py-6 sm:px-6`}>
              <div className="grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-4">
                <div className={`${theme === 'dark' ? 'bg-[#2b2d31]' : 'bg-[#E5DFC5]'} p-3 sm:p-4 rounded-md`}>
                  <div className="text-xs sm:text-sm text-[#b5bac1] mb-1">Current</div>
                  <div className={`text-lg sm:text-xl font-bold ${colors.text}`}>{entries[0].weight} kg</div>
                </div>
                
                {goalWeight && (
                  <div className={`${theme === 'dark' ? 'bg-[#2b2d31]' : 'bg-[#E5DFC5]'} p-3 sm:p-4 rounded-md`}>
                    <div className="text-xs sm:text-sm text-[#b5bac1] mb-1">Goal</div>
                    <div className={`text-lg sm:text-xl font-bold ${colors.text}`}>{goalWeight} kg</div>
                  </div>
                )}
                
                {startWeight && (
                  <div className={`${theme === 'dark' ? 'bg-[#2b2d31]' : 'bg-[#E5DFC5]'} p-3 sm:p-4 rounded-md`}>
                    <div className="text-xs sm:text-sm text-[#b5bac1] mb-1">Total Change</div>
                    <div className="flex items-center">
                      <span className={`text-lg sm:text-xl font-bold ${colors.text} mr-1`}>
                        {(entries[0].weight - startWeight).toFixed(1)} kg
                      </span>
                      {getTrendIcon(entries[0].weight - startWeight)}
                    </div>
                  </div>
                )}
                
                {/* BMI Card */}
                {height && calculateBMI() && (
                  <div className={`${theme === 'dark' ? 'bg-[#2b2d31]' : 'bg-[#E5DFC5]'} p-3 sm:p-4 rounded-md`}>
                    <div className="text-xs sm:text-sm text-[#b5bac1] mb-1">BMI</div>
                    <div className={`text-lg sm:text-xl font-bold ${colors.text}`}>{calculateBMI()}</div>
                    <div className={`text-xs sm:text-sm ${getBMICategory(calculateBMI()).color} mt-1`}>
                      {getBMICategory(calculateBMI()).category}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Weight History - View Only */}
        <Card className={`${colors.cardBg} ${colors.border} shadow-xl rounded-lg overflow-hidden`}>
          <CardHeader className={`border-b ${colors.border} pb-3 pt-4 flex justify-center`}>
            <CardTitle className={`${colors.text} text-base sm:text-lg`}>Weight History</CardTitle>
            <div className={`text-xs sm:text-sm ${colors.textMuted} ml-2`}>({formattedEntries.length} entries)</div>
          </CardHeader>
          <CardContent className="py-4 px-2 sm:py-6 sm:px-6">
            <div className="overflow-x-auto max-h-[250px] sm:max-h-[350px]">
              {formattedEntries.length > 0 ? (
                <Table className="w-full">
                  <TableHeader className={`sticky top-0 ${theme === 'dark' ? 'bg-[#313338]' : 'bg-[#EAE4CA]'} z-10`}>
                    <TableRow>
                      <TableHead className="w-[100px] sm:w-[150px] text-xs sm:text-sm">Date</TableHead>
                      <TableHead className="text-xs sm:text-sm">Day</TableHead>
                      <TableHead className="text-xs sm:text-sm">Weight (kg)</TableHead>
                      <TableHead className="text-xs sm:text-sm">Change</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formattedEntries.map((entry, index) => {
                      const prevEntry = formattedEntries[index + 1];
                      const change = prevEntry ? (entry.weight - prevEntry.weight).toFixed(1) : "--";
                      const changeColor = change !== "--" ? 
                        (parseFloat(change) < 0 ? 
                          theme === 'dark' ? "text-[#57f287]" : "text-[#126134]"
                          : parseFloat(change) > 0 ? "text-[#ed4245]" : "") 
                        : "";
                      
                      return (
                        <TableRow key={entry.id || entry.date}>
                          <TableCell className={`${colors.text} text-xs sm:text-sm`}>{entry.dateFormatted}</TableCell>
                          <TableCell className={`${colors.text} text-xs sm:text-sm`}>{entry.dayFormatted}</TableCell>
                          <TableCell className={`${colors.text} font-medium text-xs sm:text-sm`}>{entry.weight}</TableCell>
                          <TableCell className={`${changeColor} flex items-center text-xs sm:text-sm`}>
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
        
        {/* Weight Distribution Card */}
        {entries.length >= 5 && (
          <Card className={`${colors.cardBg} ${colors.border} shadow-xl rounded-lg overflow-hidden mt-2`}>
            <CardHeader className={`border-b ${colors.border} pb-3 pt-4 flex justify-center`}>
              <CardTitle className={`${colors.text} text-base sm:text-lg`}>Weight Distribution</CardTitle>
            </CardHeader>
            <CardContent className={`py-4 px-2 sm:py-6 sm:px-6`}>
              <div className="h-[180px] sm:h-[200px]">
                {typeof window !== 'undefined' && (
                  <Chart 
                    options={{
                      chart: {
                        type: 'bar',
                        height: 180,
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
                            fontSize: '10px',
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
                            color: '#b5bac1',
                            fontSize: '10px',
                          }
                        },
                        labels: {
                          style: {
                            colors: '#b5bac1',
                            fontSize: '10px',
                          },
                        },
                      },
                      tooltip: {
                        theme: theme === 'dark' ? 'dark' : 'light',
                        y: {
                          formatter: (value) => `${value} days`
                        }
                      },
                      responsive: [
                        {
                          breakpoint: 640,
                          options: {
                            chart: {
                              height: 180
                            },
                            xaxis: {
                              labels: {
                                style: {
                                  fontSize: '8px'
                                },
                                rotate: -45
                              }
                            },
                            yaxis: {
                              labels: {
                                style: {
                                  fontSize: '8px'
                                }
                              }
                            }
                          }
                        }
                      ]
                    }} 
                    series={[{
                      name: 'Days at Weight',
                      data: getWeightDistribution()
                    }]} 
                    type="bar" 
                    height={window.innerWidth < 640 ? 180 : 200}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 