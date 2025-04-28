"use client";

import { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { toast } from 'sonner';
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function WeightTracker({ username, theme }) {
  const [weight, setWeight] = useState('');
  const [weightHistory, setWeightHistory] = useState([]);
  const [profile, setProfile] = useState({
    startWeight: '',
    goalWeight: '',
    height: ''
  });

  // Fetch weight history and profile on mount
  useEffect(() => {
    fetchWeightHistory();
    fetchProfile();
  }, []);

  const fetchWeightHistory = async () => {
    try {
      const response = await fetch(`/.netlify/functions/weight?username=${username}`);
      const data = await response.json();
      setWeightHistory(data.weights);
    } catch (error) {
      toast.error('Failed to load weight history');
    }
  };

  const fetchProfile = async () => {
    try {
      const response = await fetch(`/.netlify/functions/profile?username=${username}`);
      const data = await response.json();
      setProfile(data);
    } catch (error) {
      toast.error('Failed to load profile');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/.netlify/functions/weight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, weight: parseFloat(weight) })
      });

      if (response.ok) {
        toast.success('Weight entry added');
        setWeight('');
        fetchWeightHistory();
      } else {
        toast.error('Failed to add weight entry');
      }
    } catch (error) {
      toast.error('Failed to add weight entry');
    }
  };

  const chartData = {
    labels: weightHistory.map(entry => new Date(entry.date).toLocaleDateString()),
    datasets: [{
      label: 'Weight Progress',
      data: weightHistory.map(entry => entry.weight),
      fill: false,
      borderColor: theme === 'dark' ? '#5865f2' : '#8DA101',
      tension: 0.1
    }]
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-opacity-20 rounded">
          <h3>Start Weight</h3>
          <p>{profile.startWeight || 'Not set'} kg</p>
        </div>
        <div className="p-4 bg-opacity-20 rounded">
          <h3>Current Weight</h3>
          <p>{weightHistory[0]?.weight || 'No data'} kg</p>
        </div>
        <div className="p-4 bg-opacity-20 rounded">
          <h3>Goal Weight</h3>
          <p>{profile.goalWeight || 'Not set'} kg</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-2">Enter Today's Weight (kg)</label>
          <input
            type="number"
            step="0.1"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="w-full p-2 rounded border"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Add Weight Entry
        </button>
      </form>

      {weightHistory.length > 0 && (
        <div className="h-64">
          <Line data={chartData} options={{ maintainAspectRatio: false }} />
        </div>
      )}
    </div>
  );
}