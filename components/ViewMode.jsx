"use client";

import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Card } from './ui/card';
import LoadingSpinner from './LoadingSpinner';

export default function ViewMode({ shareId, theme }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadSharedData = async () => {
      try {
        const response = await fetch(`/.netlify/functions/share-load?id=${shareId}`);
        const result = await response.json();

        if (result.success) {
          setData(result.data);
        } else {
          throw new Error(result.message);
        }
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    loadSharedData();
  }, [shareId]);

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!data) return <div>No data found</div>;

  const chartData = {
    labels: data.entries.map(e => new Date(e.date).toLocaleDateString()),
    datasets: [{
      label: 'Weight Progress',
      data: data.entries.map(e => e.weight),
      fill: false,
      borderColor: theme === 'dark' ? '#5865f2' : '#8DA101',
      tension: 0.1
    }]
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Weight Tracker Share</h1>
        <p className="text-gray-500">Shared by {data.sharedBy}</p>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <h3 className="font-bold">Start Weight</h3>
            <p>{data.settings.startWeight} kg</p>
          </div>
          <div>
            <h3 className="font-bold">Current Weight</h3>
            <p>{data.entries[0]?.weight} kg</p>
          </div>
          <div>
            <h3 className="font-bold">Goal Weight</h3>
            <p>{data.settings.goalWeight} kg</p>
          </div>
        </div>

        <div className="h-[300px]">
          <Line data={chartData} options={{ maintainAspectRatio: false }} />
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="text-xl font-bold mb-4">Weight History</h2>
        <div className="space-y-2">
          {data.entries.slice(0, 10).map((entry, index) => (
            <div key={index} className="flex justify-between">
              <span>{new Date(entry.date).toLocaleDateString()}</span>
              <span>{entry.weight} kg</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}