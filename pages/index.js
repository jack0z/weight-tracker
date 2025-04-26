import dynamic from 'next/dynamic';

// Import the WeightTracker component with no SSR to prevent hydration issues
const WeightTracker = dynamic(() => import('@/app.js'), { ssr: false });

export default function Home() {
  return <WeightTracker />;
} 