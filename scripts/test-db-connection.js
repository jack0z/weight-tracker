// Script to test MongoDB connection
require('dotenv').config();
const { connectToDatabase, getWeightEntryModel } = require('../utils/database');

// Test user ID for verification
const TEST_USER_ID = 'test-connection-user';

async function testDatabaseConnection() {
  console.log('🔄 Testing MongoDB connection...');
  console.log(`MongoDB URI: ${process.env.MONGODB_URI?.slice(0, 25)}...`);
  
  try {
    // Connect to database
    await connectToDatabase();
    console.log('✅ Successfully connected to MongoDB!');
    
    // Get the model
    const WeightEntry = getWeightEntryModel();
    console.log('✅ Successfully retrieved Weight Entry model');
    
    // Test CRUD operations
    
    // 1. Create a test entry
    console.log('\n🔄 Testing create operation...');
    const testEntry = new WeightEntry({
      userId: TEST_USER_ID,
      date: new Date(),
      weight: 70.5,
      notes: 'Test entry'
    });
    
    const savedEntry = await testEntry.save();
    console.log('✅ Successfully created test entry:');
    console.log(savedEntry);
    
    // 2. Read entry
    console.log('\n🔄 Testing read operation...');
    const foundEntry = await WeightEntry.findOne({ userId: TEST_USER_ID }).lean();
    console.log('✅ Successfully retrieved test entry:');
    console.log(foundEntry);
    
    // 3. Update entry
    console.log('\n🔄 Testing update operation...');
    const updatedEntry = await WeightEntry.findOneAndUpdate(
      { userId: TEST_USER_ID },
      { weight: 71.0, notes: 'Updated test entry' },
      { new: true }
    );
    console.log('✅ Successfully updated test entry:');
    console.log(updatedEntry);
    
    // 4. Delete entry
    console.log('\n🔄 Testing delete operation...');
    const deleteResult = await WeightEntry.deleteMany({ userId: TEST_USER_ID });
    console.log(`✅ Successfully deleted ${deleteResult.deletedCount} test entries`);
    
    // Final result
    console.log('\n🎉 All database operations completed successfully!');
    console.log('Your MongoDB connection is working properly.');
    
  } catch (error) {
    console.error('\n❌ Database connection test failed:');
    console.error(error);
    process.exit(1);
  } finally {
    // Close the connection
    process.exit(0);
  }
}

// Run the test
testDatabaseConnection(); 