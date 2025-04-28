import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

export default function ViewMode({ sharedData, theme }) {
  const {
    entries,
    startWeight,
    goalWeight,
    sharedBy
  } = sharedData;

  // Calculate averages and summaries
  const calculateAverages = () => {
    if (!entries || entries.length === 0) return null;
    
    const weights = entries.map(e => e.weight);
    return {
      overall: (weights.reduce((a, b) => a + b, 0) / weights.length).toFixed(1),
      last7Days: weights.slice(0, 7).reduce((a, b) => a + b, 0) / Math.min(7, weights.length),
      last30Days: weights.slice(0, 30).reduce((a, b) => a + b, 0) / Math.min(30, weights.length)
    };
  };

  // Format weight history
  const formatHistory = () => {
    return entries
      .slice(0, 10) // Show only last 10 entries
      .map(entry => ({
        date: new Date(entry.date).toLocaleDateString(),
        weight: entry.weight.toFixed(1)
      }));
  };

  // Chart configuration
  const chartData = {
    labels: entries.map(e => new Date(e.date).toLocaleDateString()),
    datasets: [{
      label: 'Weight Progress',
      data: entries.map(e => e.weight),
      fill: false,
      borderColor: theme === 'dark' ? '#5865f2' : '#8DA101',
      tension: 0.1
    }]
  };

  return (
    <div className="space-y-6 p-4">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold">Weight Progress Report</h2>
        <p className="text-muted">Shared by {sharedBy}</p>
      </div>

      {/* Weight Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Weight Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <Line 
              data={chartData} 
              options={{ 
                maintainAspectRatio: false,
                responsive: true 
              }} 
            />
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p>Start Weight: {startWeight} kg</p>
              <p>Goal Weight: {goalWeight} kg</p>
            </div>
            <div>
              <p>Current Weight: {entries[0]?.weight} kg</p>
              <p>Total Change: {(entries[0]?.weight - startWeight).toFixed(1)} kg</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weight Averages */}
      <Card>
        <CardHeader>
          <CardTitle>Weight Averages</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(calculateAverages() || {}).map(([period, value]) => (
              <div key={period} className="text-center">
                <h3 className="font-semibold">{period.replace(/([A-Z])/g, ' $1')}</h3>
                <p>{value.toFixed(1)} kg</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Weight History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {formatHistory().map((entry, index) => (
              <div key={index} className="flex justify-between p-2 border-b">
                <span>{entry.date}</span>
                <span>{entry.weight} kg</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}