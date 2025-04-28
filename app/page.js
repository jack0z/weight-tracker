"use client";

import { useState } from 'react';
import Login from '../components/Login';
import WeightTracker from '../components/WeightTracker';

export default function Home() {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState('dark');

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div>
      {!user ? (
        <Login onLogin={handleLogin} theme={theme} toggleTheme={toggleTheme} />
      ) : (
        <WeightTracker username={user.username} theme={theme} />
      )}
    </div>
  );
}

