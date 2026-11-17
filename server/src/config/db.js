import mongoose from "mongoose";
import dns from "node:dns";
import config from "./env.js";

// Resolve mongodb+srv SRV/TXT records via public DNS instead of the local
// network resolver, which refused the query (querySrv ECONNREFUSED).
dns.setServers(config.dnsServers);

// Stable API: pin the server API version so server upgrades can't silently
// change behavior. The ping/CRUD this app uses are all within Stable API v1.
//
// dbName: name the database explicitly. Without it the driver takes the name
// from the URI path, and a URI with no path means MongoDB's default, "test".
const clientOptions = {
  serverApi: config.mongoServerApi,
  dbName: config.mongodbDbName,
};

/**
 * Connect Mongoose to MongoDB using the Stable API, routing SRV lookups through
 * public DNS to avoid the local resolver's querySrv ECONNREFUSED failure.
 * Exits the process on failure so the server never runs without a database.
 * @returns {Promise<void>}
 */
const connectDB = async () => {
  try {
    console.log("[db] connecting to MongoDB…");
    await mongoose.connect(config.mongodbUri, clientOptions);
    console.log(
      `[db] connection established successfully (database "${mongoose.connection.name}")`,
    );
  } catch (error) {
    console.error("[db] connection error:", error);
    process.exit(1); // Exit the process with an error code
  }
};

export default connectDB;
