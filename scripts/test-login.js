const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const loginHandler = require('../netlify/functions/login').handler;

async function testLogin() {
    // Verify MongoDB URI is loaded
    console.log('MongoDB URI exists:', !!process.env.MONGODB_URI);

    const testEvent = {
        httpMethod: 'POST',
        path: '/.netlify/functions/login',
        body: JSON.stringify({
            username: 'luka1',
            password: 'test1'
        })
    };

    try {
        const response = await loginHandler(testEvent, { callbackWaitsForEmptyEventLoop: false });
        console.log('Response:', JSON.parse(response.body));
    } catch (error) {
        console.error('Test failed:', error);
    }
}

testLogin();