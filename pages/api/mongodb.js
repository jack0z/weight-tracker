// pages/api/mongodb.js
import { MongoClient } from 'mongodb';

export default async function handler(req, res) {
  const client = new MongoClient(process.env.MONGO_URI);
  const dbName = "Cluster0"; // Replace with your actual database name
  const collectionName = "test";

  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    const data = await collection.find().toArray();

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: "Something went wrong with MongoDB" });
  } finally {
    await client.close();
  }
}
