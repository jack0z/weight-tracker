import { MongoClient } from 'mongodb';

const uri = process.env.MONGO_URI;
const options = {};

let client;
let clientPromise;

if (!process.env.MONGO_URI) {
  throw new Error('Please add your Mongo URI to .env');
}

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

if (!process.env.MONGO_URI) {
  console.log('MONGO_URI is undefined');
  throw new Error('Please add your Mongo URI to .env');
}

export async function connectToDatabase() {
  const client = await clientPromise;
  return client.db(); // you can specify .db('Cluster0') if needed
}