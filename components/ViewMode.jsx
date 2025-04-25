/**
 * View-only mode component for shared weight tracking data
 */
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { format } from 'date-fns';

// Dynamically import ApexCharts with no SSR to prevent hydration issues
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

export default function ViewMode({
  entries = [],
  startWeight,
  goalWeight,
  height,
  theme,
  sharedBy,
  onThemeToggle,
  onExit,
  isLoading,
  error
}) {
  const [formattedEntries, setFormattedEntries] = useState([]);
  const [chartOptions, setChartOptions] = useState({});
  const [chartSeries, setChartSeries] = useState([]);
  const [isClient, setIsClient] = useState(false);

  // Format entries and prepare chart data when entries or theme changes
  useEffect(() => {
    if (entries.length > 0) {
      // Create formatted entries
      const formatted = entries.map(e => ({
        ...e,
        dateFormatted: format(new Date(e.date), "MMM d, yyyy"),
        dayFormatted: format(new Date(e.date), "EEEE"),
        dateObj: new Date(e.date)
      })).sort((a, b) => b.dateObj - a.dateObj);
      
      setFormattedEntries(formatted);

      // Set up chart options
      const options = {
        chart: {
          type: 'area',
          height: 350,
          toolbar: {
            show: false,
          },
          background: 'transparent',
          fontFamily: 'Inter, sans-serif',
          animations: {
            enabled: true,
            easing: 'easeinout',
            speed: 800,
          },
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
        },
        xaxis: {
          type: 'datetime',
          categories: [...formatted].reverse().map(e => e.date),
          labels: {
            style: {
              colors: theme === 'dark' ? '#b5bac1' : '#6b7280',
              fontSize: '10px',
            },
            format: 'MMM dd',
            rotateAlways: false,
            hideOverlappingLabels: true,
          }
        },
        yaxis: {
          labels: {
            style: {
              colors: theme === 'dark' ? '#b5bac1' : '#6b7280',
              fontSize: '10px',
            },
            formatter: (value) => `${value} kg`,
          }
        },
        tooltip: {
          x: {
            format: 'dd MMM yyyy'
          },
          y: {
            formatter: (value) => `${value} kg`
          }
        },
        responsive: [
          {
            breakpoint: 640,
            options: {
              chart: {
                height: 300
              },
              legend: {
                position: 'bottom'
              }
            }
          }
        ]
      };
      
      setChartOptions(options);
      
      // Set up chart series
      const series = [{
        name: 'Weight',
        data: [...formatted].reverse().map(e => parseFloat(e.weight))
      }];
      
      setChartSeries(series);
    }
  }, [entries, theme]);

  // Apply theme to document
  useEffect(() => {
    setIsClient(true);
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

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
  };

  // Calculate BMI if height and recent weight are available
  const calculateBMI = (weight, height) => {
    if (!weight || !height) return null;
    const heightInMeters = height / 100;
    return (weight / (heightInMeters * heightInMeters)).toFixed(1);
  };

  // Get BMI category
  const getBMICategory = (bmi) => {
    if (!bmi) return null;
    if (bmi < 18.5) return "Underweight";
    if (bmi < 25) return "Normal";
    if (bmi < 30) return "Overweight";
    return "Obese";
  };

  // Calculate progress percentage
  const calculateProgress = () => {
    if (!startWeight || !goalWeight || formattedEntries.length === 0) return null;
    
    const start = parseFloat(startWeight);
    const goal = parseFloat(goalWeight);
    const current = parseFloat(formattedEntries[0].weight);
    
    // If goal is to lose weight
    if (start > goal) {
      const totalToLose = start - goal;
      const lost = start - current;
      return Math.min(100, Math.max(0, (lost / totalToLose) * 100)).toFixed(1);
    } 
    // If goal is to gain weight
    else if (start < goal) {
      const totalToGain = goal - start;
      const gained = current - start;
      return Math.min(100, Math.max(0, (gained / totalToGain) * 100)).toFixed(1);
    }
    
    return "100.0"; // If start and goal are the same
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={`min-h-screen ${colors.bg} ${colors.text} p-2 sm:p-4 md:p-6`}>
        <div className="max-w-6xl mx-auto">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4">Weight Tracker</h1>
          <div className={`${colors.cardBg} ${colors.border} border rounded-lg p-3 sm:p-4 shadow-sm`}>
            <div className="flex flex-col items-center justify-center py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-t-2 border-blue-500 mb-4"></div>
              <p className="text-sm sm:text-base">Loading shared data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className={`min-h-screen ${colors.bg} ${colors.text} p-2 sm:p-4 md:p-6`}>
        <div className="max-w-6xl mx-auto">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4">Weight Tracker</h1>
          <div className={`${colors.cardBg} ${colors.border} border rounded-lg p-3 sm:p-4 shadow-sm mb-4`}>
            <h2 className="text-sm sm:text-base md:text-lg font-semibold mb-2">Error Loading Data</h2>
            <div className="bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3 mb-3">
              <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              The shared data could not be loaded. This could be because the link has expired or the data is no longer available.
            </p>
          </div>
          <button 
            onClick={onExit} 
            className={`${colors.buttonBgPrimary} text-white py-1.5 sm:py-2 px-3 sm:px-4 rounded text-sm sm:text-base`}>
            Back to App
          </button>
        </div>
      </div>
    );
  }

  const currentWeight = formattedEntries.length > 0 ? formattedEntries[0].weight : null;
  const currentBMI = calculateBMI(currentWeight, height);
  const bmiCategory = getBMICategory(currentBMI);
  const progressPercentage = calculateProgress();

  return (
    <div className={`min-h-screen ${colors.bg} ${colors.text} p-2 sm:p-4 md:p-6`}>
      <div className="max-w-6xl mx-auto">
        {/* Header with theme toggle and exit button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3">
          <div>
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold">Weight Tracker</h1>
            {sharedBy && (
              <p className={`${colors.textMuted} text-xs sm:text-sm`}>Shared by: {sharedBy}</p>
            )}
          </div>
          <div className="flex gap-2 w-full sm:w-auto justify-between sm:justify-end mt-2 sm:mt-0">
            <button
              onClick={onThemeToggle}
              className={`${colors.buttonBgSecondary} text-white py-1.5 px-2.5 sm:px-3 rounded text-xs sm:text-sm flex-1 sm:flex-none max-w-[120px] sm:max-w-none`}
            >
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </button>
            <button
              onClick={onExit}
              className={`${colors.buttonBgPrimary} text-white py-1.5 px-2.5 sm:px-3 rounded text-xs sm:text-sm flex-1 sm:flex-none max-w-[120px] sm:max-w-none`}
            >
              Exit View Mode
            </button>
          </div>
        </div>

        {/* Main content - Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
          {/* Current Weight Card */}
          <div className={`${colors.cardBg} ${colors.border} border rounded-lg p-3 sm:p-4 shadow-sm`}>
            <h2 className="text-sm sm:text-base md:text-lg font-semibold mb-1 sm:mb-2">Current Weight</h2>
            {currentWeight ? (
              <p className="text-xl sm:text-2xl md:text-3xl font-bold">{currentWeight} kg</p>
            ) : (
              <p className={`${colors.textMuted}`}>No data</p>
            )}
          </div>

          {/* Goal Progress Card */}
          <div className={`${colors.cardBg} ${colors.border} border rounded-lg p-3 sm:p-4 shadow-sm`}>
            <h2 className="text-sm sm:text-base md:text-lg font-semibold mb-1 sm:mb-2">Goal Progress</h2>
            {progressPercentage ? (
              <>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold">{progressPercentage}%</p>
                <p className={`${colors.textMuted} text-xs sm:text-sm`}>
                  {startWeight} kg → {goalWeight} kg
                </p>
              </>
            ) : (
              <p className={`${colors.textMuted}`}>No goal data</p>
            )}
          </div>

          {/* BMI Card */}
          <div className={`${colors.cardBg} ${colors.border} border rounded-lg p-3 sm:p-4 shadow-sm`}>
            <h2 className="text-sm sm:text-base md:text-lg font-semibold mb-1 sm:mb-2">BMI</h2>
            {currentBMI ? (
              <>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold">{currentBMI}</p>
                <p className={`${colors.textMuted} text-xs sm:text-sm`}>{bmiCategory}</p>
              </>
            ) : (
              <p className={`${colors.textMuted}`}>No BMI data</p>
            )}
          </div>
        </div>

        {/* Weight Chart */}
        <div className={`${colors.cardBg} ${colors.border} border rounded-lg p-3 sm:p-4 shadow-sm mb-4 sm:mb-6`}>
          <h2 className="text-sm sm:text-base md:text-lg font-semibold mb-2 sm:mb-4">Weight Trend</h2>
          {isClient && formattedEntries.length > 0 ? (
            <div className="overflow-hidden">
              <Chart
                options={chartOptions}
                series={chartSeries}
                type="area"
                height={350}
              />
            </div>
          ) : (
            <p className={`${colors.textMuted}`}>No data to display</p>
          )}
        </div>

        {/* Entry Table */}
        <div className={`${colors.cardBg} ${colors.border} border rounded-lg p-3 sm:p-4 shadow-sm`}>
          <h2 className="text-sm sm:text-base md:text-lg font-semibold mb-2 sm:mb-4">Weight Entries</h2>
          {formattedEntries.length > 0 ? (
            <div className="overflow-x-auto -mx-3 sm:mx-0">
              <table className="w-full min-w-full">
                <thead>
                  <tr className={`${colors.textMuted} border-b ${colors.border}`}>
                    <th className="text-left py-1.5 sm:py-2 px-3 sm:px-2 text-xs sm:text-sm">Date</th>
                    <th className="text-left py-1.5 sm:py-2 px-3 sm:px-2 text-xs sm:text-sm hidden sm:table-cell">Day</th>
                    <th className="text-right py-1.5 sm:py-2 px-3 sm:px-2 text-xs sm:text-sm">Weight (kg)</th>
                  </tr>
                </thead>
                <tbody>
                  {formattedEntries.map((entry, index) => (
                    <tr key={index} className={`border-b ${colors.border}`}>
                      <td className="py-1.5 sm:py-2 px-3 sm:px-2 text-xs sm:text-sm">{entry.dateFormatted}</td>
                      <td className="py-1.5 sm:py-2 px-3 sm:px-2 text-xs sm:text-sm hidden sm:table-cell">{entry.dayFormatted}</td>
                      <td className="text-right py-1.5 sm:py-2 px-3 sm:px-2 text-xs sm:text-sm">{entry.weight}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className={`${colors.textMuted}`}>No entries to display</p>
          )}
        </div>
      </div>
    </div>
  );
} 