import app from "./app.js";
import dotenv from "dotenv";
import { connectDB } from "./utils/db.js";
import { createClient } from "redis";

dotenv.config();

export const redisClient = createClient({
  url: process.env.Redis_url,
});

redisClient
  .connect()
  .then(() => console.log("connected to redis"))
  .catch(console.error);

connectDB().then(() => {
  app.listen(process.env.PORT, () => {
    console.log(
      `Auth service is running on http://localhost:${process.env.PORT}`
    );
  });
});

/*
 * ===========================================================================================
 *                              NOTES — auth/src/index.ts
 * ===========================================================================================
 *
 * PURPOSE: Entry point for the Auth Microservice. Bootstraps the server by:
 * 1. Loading environment variables (dotenv)
 * 2. Creating and connecting the Redis client
 * 3. Connecting to MongoDB
 * 4. Starting the Express HTTP server
 *
 * ROLE IN ARCHITECTURE: Backend → Auth Service → Entry Point / Bootstrap Layer
 * Port: 5000 (from .env)
 *
 * STARTUP SEQUENCE:
 * 1. dotenv.config() loads .env variables (PORT, DB_URL, JWT_SEC, Redis_url, etc.)
 * 2. Redis client is created with createClient({ url: Redis_url }) and connected
 * 3. connectDB() connects to MongoDB Atlas (awaited with .then())
 * 4. app.listen(PORT) starts the HTTP server ONLY after DB is connected
 *
 * EXPORTS:
 * - redisClient → Exported and used in controllers/auth.ts for forgot-password token storage
 *
 * REDIS USAGE:
 * - Stores forgot-password tokens with "forgot:{email}" key pattern
 * - Auto-expires with TTL (900 seconds = 15 minutes)
 * - Redis_url comes from .env (e.g., redis://localhost:6379 or Redis Cloud URL)
 *
 * WHY SEPARATE index.ts AND app.ts?
 * - app.ts creates the Express app (middleware, routes) — pure app config
 * - index.ts handles infrastructure (DB, Redis, server start) — side effects
 * - This separation makes app.ts testable without starting a server
 *
 * CONNECTIONS:
 * • app.ts → provides the Express app instance
 * • utils/db.ts → provides connectDB() for MongoDB connection
 * • controllers/auth.ts → imports redisClient for token storage/retrieval
 *
 * INTERVIEW QUESTIONS:
 * 1. Why export redisClient from index.ts instead of creating it in the controller?
 *    → Single connection shared across the app. Creating per-request would be wasteful.
 * 2. Why connect DB before starting the server?
 *    → Prevents serving requests before the database is ready.
 */
