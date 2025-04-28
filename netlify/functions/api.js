// const connectDB = require('../../database/db');
// const User = require('../../database/schema/User');

// exports.handler = async function(event, context) {
//   context.callbackWaitsForEmptyEventLoop = false;

//   // Parse path to determine action
//   const path = event.path.replace('/.netlify/functions/api/', '');
  
//   try {
//     await connectDB();
//     const { username, password } = JSON.parse(event.body);

//     switch (path) {
//       case 'login':
//         const user = await User.findOne({ username });
//         if (!user || user.password !== password) {
//           return {
//             statusCode: 401,
//             body: JSON.stringify({ message: 'Invalid credentials' })
//           };
//         }
//         return {
//           statusCode: 200,
//           body: JSON.stringify({
//             message: 'Login successful',
//             user: { username: user.username, id: user._id }
//           })
//         };

//       case 'register':
//         const existingUser = await User.findOne({ username });
//         if (existingUser) {
//           return {
//             statusCode: 400,
//             body: JSON.stringify({ message: 'Username already exists' })
//           };
//         }
//         const newUser = new User({ username, password });
//         await newUser.save();
//         return {
//           statusCode: 201,
//           body: JSON.stringify({
//             message: 'Registration successful',
//             user: { username: newUser.username, id: newUser._id }
//           })
//         };

//       default:
//         return {
//           statusCode: 404,
//           body: JSON.stringify({ message: 'Not Found' })
//         };
//     }
//   } catch (error) {
//     console.error('API Error:', error);
//     return {
//       statusCode: 500,
//       body: JSON.stringify({
//         message: 'Internal server error',
//         error: error.message
//       })
//     };
//   }
// };