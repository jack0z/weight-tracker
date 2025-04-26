import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Import the WeightTracker component with no SSR to prevent hydration issues
const WeightTracker = dynamic(() => import('@/app.js'), { ssr: false });

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Only render the component on the client side
  if (!mounted) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <h1 style={{ color: '#e3e5e8' }}>Loading...</h1>
      </div>
    );
  }

  return <WeightTracker />;
} 