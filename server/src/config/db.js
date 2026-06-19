import mongoose from "mongoose";
import "dotenv/config";

const mongodb_uri = process.env.MONGODB_URI;

const connectDB = async () => {
  try {
    await mongoose.connect(mongodb_uri);
    console.log("MongoDB connection established successfully");
  }
  catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1); // Exit the process with an error code
  }
};

export default connectDB;