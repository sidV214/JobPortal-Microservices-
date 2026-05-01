import app from "./app.js";
import dotenv from "dotenv";
import { connectDB } from "./utils/db.js";
import { connectKafka } from "./producer.js";

dotenv.config();

connectKafka();

connectDB().then(() => {
  app.listen(process.env.PORT, () => {
    console.log(
      `User service is running on http://localhost:${process.env.PORT}`
    );
  });
});

/*
 * ===========================================================================================
 *                              NOTES — user/src/index.ts
 * ===========================================================================================
 *
 * PURPOSE: Entry point for the User Microservice. Bootstraps the server by connecting to
 * Kafka (for email notifications) and MongoDB, then starting the Express HTTP server.
 *
 * ROLE IN ARCHITECTURE: Backend → User Service (Port 5002) → Entry Point
 *
 * STARTUP SEQUENCE:
 * 1. dotenv.config() → loads .env variables
 * 2. connectKafka() → initializes Kafka producer (fire-and-forget, non-blocking)
 * 3. connectDB() → connects to MongoDB Atlas (awaited)
 * 4. app.listen(PORT) → starts HTTP server after DB is ready
 *
 * DIFFERENCE FROM AUTH index.ts:
 * - No Redis client (User Service doesn't handle password resets)
 * - Has Kafka producer (for application confirmation emails)
 *
 * CONNECTIONS:
 * • app.ts → Express app instance
 * • utils/db.ts → MongoDB connection
 * • producer.ts → Kafka connection
 */
