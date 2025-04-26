import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';

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

  return (
    <div>
      <div className="fixed top-0 right-0 m-4 z-50">
        <Link href="/mongodb">
          <a className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-lg hover:bg-blue-700 transition-colors">
            Try MongoDB Version
          </a>
        </Link>
      </div>
      <WeightTracker />
    </div>
  );
} 