import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET() {
  try {
    const db = await connectToDatabase();
    const collection = db.collection('weights');
    const data = await collection.find({}).toArray();

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data' }, 
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const db = await connectToDatabase();
    const collection = db.collection('weights');
    
    const result = await collection.insertOne(body);
    
    return NextResponse.json({ 
      success: true, 
      id: result.insertedId 
    }, { status: 201 });
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json(
      { error: 'Failed to add data' }, 
      { status: 500 }
    );
  }
}