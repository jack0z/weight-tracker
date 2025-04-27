const connectDB = require("../../database/db");
const User = require("../../database/schema/User");

exports.handler = async function(event, context) {
  // Only allow POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: "Method not allowed" })
    };
  }

  try {
    const { username, password } = JSON.parse(event.body);
    console.log('Registering', username);

    await connectDB();

    // Check if user exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "User already exists" })
      };
    }

    // Create new user
    const newUser = new User({ username, password });
    await newUser.save();

    return {
      statusCode: 201,
      body: JSON.stringify({ message: "Account created successfully" })
    };
  } catch (error) {
    console.error("Error during registration:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Failed to register. Please try again." })
    };
  }
};