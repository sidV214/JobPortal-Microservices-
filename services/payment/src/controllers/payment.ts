import { TryCatch } from "../utils/TryCatch.js";
import { AuthenticatedRequest } from "../middlewares/auth.js";
import ErrorHandler from "../utils/errorHandler.js";
import { User } from "../models/User.js";
import { instance } from "../index.js";
import crypto from "crypto";

export const checkOut = TryCatch(async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    throw new ErrorHandler(401, "No valid User");
  }

  const user_id = req.user._id;

  const user = await User.findById(user_id);

  if (!user) {
    throw new ErrorHandler(404, "User not found");
  }

  const subTime = user.subscription
    ? new Date(user.subscription).getTime()
    : 0;

  const now = Date.now();

  const isSubscribed = subTime > now;

  if (isSubscribed) {
    throw new ErrorHandler(400, "You already have a subscription");
  }

  const options = {
    amount: Number(119 * 100),
    currency: "INR",
    notes: {
      user_id: user_id.toString(),
    },
  };

  const order = await instance.orders.create(options);

  res.status(201).json({
    order,
  });
});

export const paymentVerification = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    const user = req.user;

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.Razorpay_Secret as string)
      .update(body)
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      const now = new Date();

      const thirtyDays = 30 * 24 * 60 * 60 * 1000;

      const expiryDate = new Date(now.getTime() + thirtyDays);

      const updatedUser = await User.findByIdAndUpdate(
        user?._id,
        { subscription: expiryDate },
        { new: true }
      ).select("-password");

      res.json({
        message: "Subscription Purchased Successfully",
        updatedUser,
      });
    } else {
      return res.status(400).json({
        message: "Payment Failed",
      });
    }
  }
);

/*
 * ===========================================================================================
 *                              NOTES — payment/src/controllers/payment.ts
 * ===========================================================================================
 *
 * PURPOSE: Handles Razorpay payment flow for the JobNexus premium subscription feature.
 * Two functions: create a payment order, and verify the payment after completion.
 *
 * ROLE IN ARCHITECTURE: Backend → Payment Service (Port 5004) → Controller Layer
 *
 * ┌─────────────────────────────────────────────────────────────────────────────────────┐
 * │ FUNCTION 1: checkOut — POST /api/payment/checkout                                   │
 * ├─────────────────────────────────────────────────────────────────────────────────────┤
 * │ Creates a Razorpay order for ₹119 premium subscription.                             │
 * │                                                                                     │
 * │ STEP-BY-STEP DATA FLOW:                                                             │
 * │ 1. Validate user is authenticated                                                   │
 * │ 2. Check if user already has an active subscription → throw 400 if yes              │
 * │ 3. Create Razorpay order with:                                                      │
 * │    - amount: 119 * 100 = 11900 paise (Razorpay uses paise, not rupees)              │
 * │    - currency: "INR"                                                                 │
 * │    - notes: { user_id } for tracking                                                 │
 * │ 4. Return the Razorpay order object (contains order_id for frontend)                │
 * │                                                                                     │
 * │ RAZORPAY AMOUNT: Razorpay requires amount in smallest currency unit (paise).        │
 * │ ₹119 = 11,900 paise. Hence: 119 * 100                                              │
 * └─────────────────────────────────────────────────────────────────────────────────────┘
 *
 * ┌─────────────────────────────────────────────────────────────────────────────────────┐
 * │ FUNCTION 2: paymentVerification — POST /api/payment/verification                    │
 * ├─────────────────────────────────────────────────────────────────────────────────────┤
 * │ Verifies the payment was legitimate and activates the subscription.                 │
 * │                                                                                     │
 * │ STEP-BY-STEP DATA FLOW:                                                             │
 * │ 1. Receive { razorpay_order_id, razorpay_payment_id, razorpay_signature } from body│
 * │ 2. Compute expected signature:                                                      │
 * │    HMAC-SHA256(razorpay_order_id + "|" + razorpay_payment_id, Razorpay_Secret)      │
 * │ 3. Compare expected signature with the received razorpay_signature                  │
 * │    → If they match (isAuthentic), the payment is verified                           │
 * │ 4. Calculate subscription expiry: now + 30 days                                     │
 * │ 5. Update user.subscription in MongoDB with the expiry date                         │
 * │ 6. Return success message with updated user                                         │
 * │                                                                                     │
 * │ SECURITY — SIGNATURE VERIFICATION:                                                   │
 * │ Razorpay signs the payment with a secret. We recompute the signature server-side    │
 * │ and compare. This prevents attackers from faking successful payments.                │
 * │ Without this check, anyone could POST fake payment data and get a free subscription.│
 * │                                                                                     │
 * │ WHY 30 DAYS?                                                                         │
 * │ const thirtyDays = 30 * 24 * 60 * 60 * 1000 → 2,592,000,000 milliseconds           │
 * │ → Monthly subscription model                                                        │
 * └─────────────────────────────────────────────────────────────────────────────────────┘
 *
 * CONNECTIONS:
 * • routes/payment.ts → maps /checkout and /verification endpoints
 * • index.ts → exports Razorpay `instance` (initialized with key_id and key_secret)
 * • User model → updates subscription field
 * • Frontend subscribe page → opens Razorpay checkout modal, sends verification data
 *
 * INTERVIEW QUESTIONS:
 * 1. Why verify the signature instead of trusting the frontend?
 *    → Frontend can be manipulated. Server-side verification with HMAC ensures authenticity.
 * 2. Why use HMAC-SHA256?
 *    → Razorpay's official verification method. Cryptographically secure.
 * 3. How does the subscription expire?
 *    → subscription is a Date. If it's in the past, user is not subscribed (checked at apply time).
 * 4. What happens if the user refreshes during payment?
 *    → Razorpay webhook (not implemented here) would handle it. Currently relies on client callback.
 */
