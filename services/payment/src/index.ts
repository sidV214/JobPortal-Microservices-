import app from "./app.js";
import dotenv from "dotenv";
import { connectDB } from "./utils/db.js";
import Razorpay from "razorpay";

dotenv.config();

export const instance = new Razorpay({
  key_id: process.env.Razorpay_Key as string,
  key_secret: process.env.Razorpay_Secret as string,
});

connectDB().then(() => {
  app.listen(process.env.PORT, () => {
    console.log(
      `Payment service is running on http://localhost:${process.env.PORT}`
    );
  });
});

/*
 * ===========================================================================================
 *                              NOTES — payment/src/index.ts
 * ===========================================================================================
 *
 * PURPOSE: Entry point for the Payment Microservice. Initializes Razorpay SDK and starts server.
 *
 * ROLE IN ARCHITECTURE: Backend → Payment Service (Port 5004) → Entry Point
 *
 * RAZORPAY INSTANCE:
 * - Created with key_id and key_secret from .env
 * - Exported for use in controllers/payment.ts (instance.orders.create)
 * - key_id: Used for client-side checkout (public)
 * - key_secret: Used for server-side signature verification (private, never exposed)
 *
 * STARTUP SEQUENCE:
 * 1. dotenv.config() → loads env vars
 * 2. Razorpay instance created (synchronous, no API call)
 * 3. connectDB() → MongoDB connection
 * 4. app.listen(PORT) → starts HTTP server
 *
 * NOTE: No Kafka/Redis in this service. Payment is synchronous (Razorpay webhook-based).
 *
 * CONNECTIONS:
 * • controllers/payment.ts → imports `instance` for order creation
 * • app.ts → Express app
 * • Frontend subscribe page → triggers checkout flow
 */
