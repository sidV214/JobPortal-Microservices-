import express from "express";
import dotenv from "dotenv";
import routes from "./routes.js";
import cors from "cors";
import { v2 as cloudinary } from "cloudinary";
import { startSendMailConsumer } from "./consumer.js";

dotenv.config();

startSendMailConsumer();

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

const app = express();
app.use(cors());

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use("/api/utils", routes);

app.listen(process.env.PORT, () => {
  console.log(
    `Utils Service is running on http://localhost:${process.env.PORT}`
  );
});

/*
 * ===========================================================================================
 *                              NOTES — utils/src/index.ts
 * ===========================================================================================
 *
 * PURPOSE: Entry point for the Utils Microservice. This service has TWO responsibilities:
 * 1. HTTP API for Cloudinary file uploads (called by Auth, User, and Job services)
 * 2. Kafka consumer for sending emails via Gmail SMTP
 *
 * ROLE IN ARCHITECTURE: Backend → Utils Service (Port 5001) → Entry Point
 * This is the UTILITY service — it doesn't manage business data, only infrastructure.
 *
 * STARTUP SEQUENCE:
 * 1. dotenv.config() → loads env vars
 * 2. startSendMailConsumer() → starts Kafka consumer (non-blocking)
 * 3. cloudinary.config() → configures Cloudinary SDK with API credentials
 * 4. Express app setup with middleware
 * 5. app.listen(PORT) → starts HTTP server
 *
 * SPECIAL MIDDLEWARE:
 * - express.json({ limit: "50mb" }) → Increased from default 100kb
 *   → Because file buffers (resume PDFs, images) are sent as base64 JSON, which can be large
 * - express.urlencoded({ limit: "50mb" }) → Same reason for URL-encoded bodies
 *
 * WHY NO DATABASE?
 * → This service doesn't manage data. It's a utility layer for file uploads and email sending.
 *
 * CLOUDINARY CONFIG:
 * - CLOUD_NAME, API_KEY, API_SECRET → from .env (Cloudinary dashboard credentials)
 * - Configured globally via cloudinary.config() → all upload calls use these creds
 *
 * CONNECTIONS:
 * • routes.ts → provides /api/utils routes (upload, AI, etc.)
 * • consumer.ts → Kafka email consumer
 * • Auth/User/Job services → call POST /api/utils/upload to upload files
 */
