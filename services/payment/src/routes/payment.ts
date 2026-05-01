import express from "express";
import { isAuth } from "../middlewares/auth.js";
import { checkOut, paymentVerification } from "../controllers/payment.js";

const router = express.Router();

router.post("/checkout", isAuth, checkOut);
router.post("/verify", isAuth, paymentVerification);

export default router;

/*
 * ===========================================================================================
 *                              NOTES — payment/src/routes/payment.ts
 * ===========================================================================================
 *
 * PURPOSE: Defines payment routes. Only 2 endpoints, both protected by isAuth.
 *
 * ENDPOINTS:
 * - POST /api/payment/checkout → Creates Razorpay order (checkOut controller)
 * - POST /api/payment/verify → Verifies payment signature and activates subscription
 *
 * BOTH endpoints require authentication (isAuth middleware). Only logged-in users can pay.
 */
