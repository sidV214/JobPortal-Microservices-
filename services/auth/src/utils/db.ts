import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DB_URL as string);
    console.log("✅ MongoDB Connected Successfully");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error);
    process.exit(1);
  }
};

/*
 * ===========================================================================================
 *                              NOTES — utils/db.ts (shared across all services)
 * ===========================================================================================
 *
 * PURPOSE: Establishes a connection to MongoDB Atlas using Mongoose.
 * This exact file is duplicated in auth, user, job, and payment services.
 *
 * FUNCTION: connectDB()
 * - Reads DB_URL from .env (MongoDB Atlas connection string)
 * - Calls mongoose.connect() which returns a Promise
 * - On success: logs a confirmation message
 * - On failure: logs the error and calls process.exit(1) to crash the service
 *
 * WHY process.exit(1) ON FAILURE?
 * - The service cannot function without a database. Crashing forces a restart
 *   (Docker/PM2 will restart the container), rather than serving broken responses.
 *
 * CONNECTIONS: Called by index.ts in each service during startup.
 */
