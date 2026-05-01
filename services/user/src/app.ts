import express from "express";
import userRoutes from "./routes/user.js";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/user", userRoutes);

export default app;

/*
 * ===========================================================================================
 *                              NOTES — user/src/app.ts
 * ===========================================================================================
 *
 * PURPOSE: Creates and configures the Express app for the User Microservice.
 *
 * ROLE IN ARCHITECTURE: Backend → User Service (Port 5002) → Application Setup
 *
 * MIDDLEWARE CHAIN:
 * 1. cors() → allows cross-origin requests from frontend (:3000)
 * 2. express.json() → parses JSON request bodies
 * 3. userRoutes → mounted at /api/user
 *
 * NOTE: Unlike auth/app.ts, this does NOT call connectKafka() here.
 * Kafka is connected in index.ts instead, keeping app.ts purely about Express config.
 *
 * CONNECTIONS:
 * • index.ts → imports and starts this app
 * • routes/user.ts → provides the router
 */
