const { MongoClient } = require('mongodb');

exports.handler = async function(event, context) {
  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    const db = client.db('test');
    const collection = db.collection('weights');

    if (event.httpMethod === 'GET') {
      const data = await collection.find({}).toArray();
      return {
        statusCode: 200,
        body: JSON.stringify({ data })
      };
    }

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body);
      const result = await collection.insertOne(body);
      return {
        statusCode: 201,
        body: JSON.stringify({ 
          success: true, 
          id: result.insertedId 
        })
      };
    }

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  } finally {
    await client.close();
  }
};