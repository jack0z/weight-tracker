import connectDB from "../../database/db";
import User from "../../database/schema/User";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }
  const { username, password } = req.body;
  console.log('Registering', username, password)

  try {
    await connectDB();

    // Check if the user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create a new user
    const newUser = new User({ username, password });
    await newUser.save();

    return res.status(201).json({ message: "Account created successfully" });
  } catch (error) {
    console.error("Error during registration:", error);
    return res.status(500).json({ message: "Failed to register. Please try again." });
  }
}