"use client";

import { Line } from 'react-chartjs-2';

export default function ViewMode({ data = {}, theme = 'dark' }) {
  // Add default values for destructuring
  const { 
    entries = [], 
    startWeight = 0, 
    goalWeight = 0, 
    username = 'Unknown'
  } = data || {};

  // Only create chart data if we have entries
  const chartData = entries?.length ? {
    labels: entries.map(e => new Date(e.date).toLocaleDateString()),
    datasets: [{
      label: 'Weight Progress',
      data: entries.map(e => e.weight),
      fill: false,
      borderColor: theme === 'dark' ? '#5865f2' : '#8DA101',
      tension: 0.1
    }]
  } : null;

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
        <p className="text-gray-500">Shared by {username}</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="p-4 rounded-lg border">
          <h3 className="font-bold">Start Weight</h3>
          <p>{startWeight || 'Not set'} kg</p>
        </div>
        <div className="p-4 rounded-lg border">
          <h3 className="font-bold">Current Weight</h3>
          <p>{entries[0]?.weight || 'No data'} kg</p>
        </div>
        <div className="p-4 rounded-lg border">
          <h3 className="font-bold">Goal Weight</h3>
          <p>{goalWeight || 'Not set'} kg</p>
        </div>
      </div>

      {chartData && (
        <div className="h-[300px] mb-8">
          <Line 
            data={chartData} 
            options={{ 
              maintainAspectRatio: false,
              responsive: true 
            }} 
          />
        </div>
      )}

      {entries?.length > 0 ? (
        <div className="border rounded-lg p-4">
          <h2 className="text-xl font-bold mb-4">Weight History</h2>
          <div className="space-y-2">
            {entries.map((entry, index) => (
              <div key={index} className="flex justify-between">
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