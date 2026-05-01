import express from "express";
import {
  forgotPassword,
  loginUser,
  registerUser,
  resetPassword,
  googleLogin,
} from "../controllers/auth.js";
import uploadFile from "../middleware/multer.js";

const router = express.Router();

router.post("/register", uploadFile, registerUser);
router.post("/login", loginUser);
router.post("/google", googleLogin);
router.post("/forgot", forgotPassword);
router.post("/reset/:token", resetPassword);

export default router;

/*
 * ===========================================================================================
 *                              NOTES — auth/src/routes/auth.ts
 * ===========================================================================================
 *
 * PURPOSE: Defines all HTTP routes/endpoints for the Auth Microservice. Acts as the routing
 * layer that maps incoming HTTP requests to the correct controller function.
 *
 * ROLE IN ARCHITECTURE: Backend → Auth Service → Routing Layer (between Express app and controllers)
 * Port: 5000 | Base Path: /api/auth (mounted in app.ts)
 *
 * ENDPOINTS:
 * ┌──────────────────────────────────────────────────────────────────────────────────────┐
 * │ Method │ Endpoint             │ Middleware   │ Controller      │ Purpose              │
 * ├────────┼──────────────────────┼─────────────┼─────────────────┼──────────────────────┤
 * │ POST   │ /api/auth/register   │ uploadFile  │ registerUser    │ New user signup       │
 * │ POST   │ /api/auth/login      │ none        │ loginUser       │ Email/pass login      │
 * │ POST   │ /api/auth/google     │ none        │ googleLogin     │ Google OAuth login    │
 * │ POST   │ /api/auth/forgot     │ none        │ forgotPassword  │ Send reset email      │
 * │ POST   │ /api/auth/reset/:tkn │ none        │ resetPassword   │ Reset password        │
 * └──────────────────────────────────────────────────────────────────────────────────────┘
 *
 * MIDDLEWARE FLOW:
 * - /register has multer middleware (uploadFile) to handle multipart/form-data file uploads
 *   → This processes the resume PDF before the controller runs
 * - All other routes accept JSON body only (no file upload needed)
 *
 * DESIGN PATTERN: Express Router pattern — modular route definitions exported and mounted in app.ts
 *
 * CONNECTIONS:
 * • app.ts → mounts this router at /api/auth
 * • controllers/auth.ts → contains all the handler functions
 * • middleware/multer.ts → provides uploadFile middleware
 *
 * INTERVIEW QUESTIONS:
 * 1. Why use express.Router() instead of defining routes directly on app?
 *    → Modularity. Each microservice/feature has its own router file.
 * 2. Why does only /register have the multer middleware?
 *    → Only registration requires file upload (jobseeker's resume PDF).
 * 3. Why are all routes POST? Why not GET for forgot password?
 *    → POST is used because all routes send data in the request body (email, password, token).
 *      GET requests should not carry sensitive data in query params.
 * 4. What does the :token param in /reset/:token do?
 *    → It captures the JWT reset token from the URL (sent via email link).
 */
