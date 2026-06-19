import mongoose from "mongoose";
import dns from "node:dns";
import "dotenv/config";

// Resolve mongodb+srv SRV/TXT records via public DNS instead of the local
// network resolver, which refused the query (querySrv ECONNREFUSED).
dns.setServers(["1.1.1.1", "8.8.8.8"]);

const mongodb_uri = process.env.MONGODB_URI;

// Stable API: pin the server API version so server upgrades can't silently
// change behavior. The ping/CRUD this app uses are all within Stable API v1.
const clientOptions = {
  serverApi: { version: "1", strict: true, deprecationErrors: true },
};

/**
 * Connect Mongoose to MongoDB using the Stable API, routing SRV lookups through
 * public DNS to avoid the local resolver's querySrv ECONNREFUSED failure.
 * Exits the process on failure so the server never runs without a database.
 * @returns {Promise<void>}
 */
const connectDB = async () => {
  try {
    await mongoose.connect(mongodb_uri, clientOptions);
    console.log("MongoDB connection established successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1); // Exit the process with an error code
  }
};

export default connectDB;
