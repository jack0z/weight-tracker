import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();
console.log("MONGODB_URI:", process.env.MONGODB_URI);
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

export default connectDB;