import { connectToDatabase } from '@/lib/mongodb';

export default async function Home() {
  const db = await connectToDatabase();
  const collection = db.collection('test');
  const data = await collection.find({}).toArray();

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-6">Weight Tracker</h1>
      <ul className="space-y-4">
        {data.map((item) => (
          <li key={item._id} className="p-4 bg-gray-100 rounded shadow">
            {item.weight} kg — {new Date(item.date).toLocaleDateString()}
          </li>
        ))}
      </ul>
    </main>
  );
}