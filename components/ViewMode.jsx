"use client";

import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

// Dynamically import ApexCharts with no SSR to avoid hydration issues
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function ViewMode({ data = {}, theme = 'dark' }) {
  const { 
    entries = [], 
    settings = {}
  } = data || {};

  // Sort entries by date
  const sortedEntries = [...entries].sort((a, b) => 
    new Date(a.date) - new Date(b.date)
  );

  // Chart configuration
  const chartConfig = {
    options: {
      chart: {
        type: 'area',
        height: 300,
        toolbar: {
          show: false
        },
        animations: {
          enabled: true
        },
        background: 'transparent'
      },
      stroke: {
        curve: 'smooth',
        width: 2
      },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.45,
          opacityTo: 0.05,
          stops: [50, 100, 100]
        }
      },
      dataLabels: {
        enabled: false
      },
      grid: {
        borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        xaxis: {
          lines: {
            show: false
          }
        }
      },
      colors: ['#5865f2'],
      xaxis: {
        type: 'datetime',
        categories: sortedEntries.map(e => new Date(e.date).getTime()),
        labels: {
          style: {
            colors: theme === 'dark' ? '#fff' : '#000'
          }
        }
      },
      yaxis: {
        labels: {
          style: {
            colors: theme === 'dark' ? '#fff' : '#000'
          }
        }
      },
      tooltip: {
        theme: theme === 'dark' ? 'dark' : 'light',
        x: {
          format: 'dd MMM yyyy'
        }
      }
    },
    series: [{
      name: 'Weight',
      data: sortedEntries.map(e => e.weight)
    }]
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#313338] text-white' : 'bg-white text-black'}`}>
      <div className="container mx-auto p-4 space-y-4">
        <Card className={theme === 'dark' ? 'bg-[#2b2d31]' : ''}>
          <CardHeader>
            <CardTitle>Weight Chart</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {typeof window !== 'undefined' && (
              <Chart 
                options={chartConfig.options} 
                series={chartConfig.series} 
                type="area" 
                height={300}
              />
            )}
          </CardContent>
        </Card>

        <Card className={theme === 'dark' ? 'bg-[#2b2d31]' : ''}>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <h3 className="text-sm font-medium">Current</h3>
                <p className="text-2xl font-bold">{sortedEntries[sortedEntries.length - 1]?.weight || 0} kg</p>
              </div>
              <div>
                <h3 className="text-sm font-medium">Goal</h3>
                <p className="text-2xl font-bold">{settings.goalWeight || 0} kg</p>
              </div>
              <div>
                <h3 className="text-sm font-medium">Total Change</h3>
                <p className="text-2xl font-bold">
                  {(sortedEntries[sortedEntries.length - 1]?.weight - settings.startWeight).toFixed(1)} kg
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium">BMI</h3>
                <p className="text-2xl font-bold">
                  {((sortedEntries[sortedEntries.length - 1]?.weight || 0) / Math.pow(settings.height / 100, 2)).toFixed(1)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={theme === 'dark' ? 'bg-[#2b2d31]' : ''}>
          <CardHeader>
            <CardTitle>Weight History ({entries.length} entries)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sortedEntries.map((entry, i) => {
                const change = i > 0 ? (entry.weight - sortedEntries[i-1].weight).toFixed(1) : null;
                return (
                  <div key={entry.id} className="flex justify-between items-center py-2 border-b border-gray-700">
                    <div className="flex gap-4">
                      <span>{new Date(entry.date).toLocaleDateString()}</span>
                      <span>{entry.weight} kg</span>
                    </div>
                    {change && (
                      <span className={change > 0 ? 'text-red-500' : 'text-green-500'}>
                        {change > 0 ? `+${change}` : change}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}