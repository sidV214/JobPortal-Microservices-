import express from "express";
import authRoutes from "./routes/auth.js";
import { connectKafka } from "./producer.js";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

connectKafka();

app.use("/api/auth", authRoutes);

export default app;

/*
 * ===========================================================================================
 *                              NOTES — auth/src/app.ts
 * ===========================================================================================
 *
 * PURPOSE: Creates and configures the Express application for the Auth Microservice.
 * This file is the application factory — it sets up middleware, routes, and exports the app.
 *
 * ROLE IN ARCHITECTURE: Backend → Auth Service → Application Setup Layer
 *
 * MIDDLEWARE CHAIN (order matters):
 * 1. cors() → Enables Cross-Origin Resource Sharing (allows frontend at :3000 to call :5000)
 * 2. express.json() → Parses JSON request bodies (req.body)
 * 3. connectKafka() → Initializes Kafka producer at app startup (fire-and-forget)
 * 4. authRoutes mounted at /api/auth → All auth endpoints
 *
 * WHY cors() IS FIRST: Must be processed before any route handler so the browser's
 * preflight OPTIONS request gets the correct CORS headers.
 *
 * WHY connectKafka() IN app.ts: Called during module import — producer is ready before
 * any request handler needs it. If Kafka is down, the app still starts.
 *
 * CONNECTIONS:
 * • index.ts → imports this app and calls app.listen()
 * • routes/auth.ts → provides the router with all auth endpoints
 * • producer.ts → connectKafka() initializes Kafka
 *
 * INTERVIEW QUESTIONS:
 * 1. Why separate app.ts from index.ts?
 *    → app.ts is pure config (testable), index.ts handles side effects (DB, server).
 * 2. Why use express.json() instead of body-parser?
 *    → express.json() IS body-parser built into Express 4.16+.
 */
