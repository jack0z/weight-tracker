import { useState, useEffect } from 'react';
import Head from 'next/head';
import Header from '../components/Header';
import EntryFormCard from '../components/cards/EntryFormCard';
import EntriesCard from '../components/cards/EntriesCard';
import AveragesCard from '../components/cards/AveragesCard';
import ForecastCard from '../components/cards/ForecastCard';
import DistributionCard from '../components/cards/DistributionCard';
import DataManagementCard from '../components/cards/DataManagementCard';
import { useWeight } from '../contexts/WeightContext';

export default function MongoDBDashboard() {
  const { statsIsLoading, stats } = useWeight();
  const [isClient, setIsClient] = useState(false);

  // Set isClient to true on mount to avoid hydration errors
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null; // Return nothing during SSR to avoid hydration mismatch
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Head>
        <title>Weight Tracker - MongoDB Integration</title>
        <meta name="description" content="Track your weight with MongoDB integration" />
      </Head>

      <Header title="Weight Tracker - MongoDB" />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <EntryFormCard />
          
          {!statsIsLoading && stats?.averages && (
            <div className="grid grid-cols-1 gap-6">
              <AveragesCard 
                sevenDayAvg={stats.averages.sevenDay}
                fourteenDayAvg={stats.averages.fourteenDay}
                thirtyDayAvg={stats.averages.thirtyDay}
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 mb-6">
          <EntriesCard />
        </div>

        {!statsIsLoading && stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <ForecastCard forecast={stats.forecast} />
            <DistributionCard distribution={stats.distribution} />
          </div>
        )}

        <div className="grid grid-cols-1 gap-6">
          <DataManagementCard />
        </div>
      </main>

      <footer className="py-6 text-center text-gray-400 text-sm">
        <p>Weight Tracker with MongoDB Integration &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
} 