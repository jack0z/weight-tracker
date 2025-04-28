"use client";

import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function ViewMode({ data = {}, theme = 'dark' }) {
  const { 
    entries = [], 
    settings = {}
  } = data || {};

  const { 
    startWeight = 0, 
    goalWeight = 0
  } = settings || {};

  // Sort entries by date in descending order
  const sortedEntries = [...entries].sort((a, b) => 
    new Date(b.date) - new Date(a.date)
  );

  // Create chart data with proper configuration
  const chartData = entries?.length ? {
    labels: sortedEntries.map(e => new Date(e.date).toLocaleDateString()),
    datasets: [{
      label: 'Weight Progress',
      data: sortedEntries.map(e => e.weight),
      fill: false,
      borderColor: theme === 'dark' ? '#5865f2' : '#8DA101',
      tension: 0.1
    }]
  } : null;

  // Chart options with proper scales
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'category',
        display: true,
        title: {
          display: true,
          text: 'Date'
        }
      },
      y: {
        type: 'linear',
        display: true,
        title: {
          display: true,
          text: 'Weight (kg)'
        },
        min: Math.min(...entries.map(e => e.weight), goalWeight) - 1,
        max: Math.max(...entries.map(e => e.weight), startWeight) + 1
      }
    }
  };

  // Show loading state if no data
  if (!data) {
    return (
      <div className="container mx-auto p-4 text-center">
        <p>Loading shared data...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold">Weight Progress Share</h1>
        <p className="text-gray-500">Shared by {data.user}</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="p-4 rounded-lg border">
          <h3 className="font-bold">Start Weight</h3>
          <p>{settings.startWeight || 'Not set'} kg</p>
        </div>
        <div className="p-4 rounded-lg border">
          <h3 className="font-bold">Current Weight</h3>
          <p>{sortedEntries[0]?.weight || 'No data'} kg</p>
        </div>
        <div className="p-4 rounded-lg border">
          <h3 className="font-bold">Goal Weight</h3>
          <p>{settings.goalWeight || 'Not set'} kg</p>
        </div>
      </div>

      {chartData && (
        <div className="h-[300px] mb-8">
          <Line 
            data={chartData} 
            options={chartOptions}
          />
        </div>
      )}

      {sortedEntries?.length > 0 ? (
        <div className="border rounded-lg p-4">
          <h2 className="text-xl font-bold mb-4">Weight History</h2>
          <div className="space-y-2">
            {sortedEntries.map((entry) => (
              <div key={entry.id} className="flex justify-between">
                <span>{new Date(entry.date).toLocaleDateString()}</span>
                <span>{entry.weight} kg</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center p-4">
          <p>No weight entries available</p>
        </div>
      )}
    </div>
  );
}