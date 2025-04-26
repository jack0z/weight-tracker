import { MongoClient } from 'mongodb';

// Check if we have a cached connection
let cached = global.mongo;

if (!cached) {
  cached = global.mongo = { conn: null, promise: null };
}

export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const uri = process.env.MONGODB_URI;
    
    if (!uri) {
      throw new Error(
        'Please define the MONGODB_URI environment variable inside .env.local'
      );
    }

    const options = {
      useUnifiedTopology: true,
      useNewUrlParser: true,
    };

    cached.promise = MongoClient.connect(uri, options)
      .then((client) => {
        return {
          client,
          db: client.db(new URL(uri).pathname.substring(1) || 'weight-tracker'),
        };
      })
      .catch((error) => {
        console.error('Failed to connect to MongoDB', error);
        throw error;
      });
  }
  
  cached.conn = await cached.promise;
  return cached.conn;
} 