import axios from "axios";
import getBuffer from "../utils/buffer.js";
import { User } from "../models/User.js";
import ErrorHandler from "../utils/errorHandler.js";
import { TryCatch } from "../utils/TryCatch.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { forgotPasswordTemplate } from "../templete.js";
import { OAuth2Client } from "google-auth-library";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
import { publishToTopic } from "../producer.js";
import { redisClient } from "../index.js";

export const registerUser = TryCatch(async (req, res, next) => {
  const { name, email, password, phoneNumber, role, bio } = req.body;

  if (!name || !email || !password || !phoneNumber || !role) {
    throw new ErrorHandler(400, "Please fill all details");
  }

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new ErrorHandler(409, "User with this email already exists");
  }

  const hashPassword = await bcrypt.hash(password, 10);

  let registeredUser;

  if (role === "recruiter") {
    registeredUser = await User.create({
      name,
      email,
      password: hashPassword,
      phone_number: phoneNumber,
      role
    });
  } else if (role === "jobseeker") {
    const file = req.file;

    if (!file) {
      throw new ErrorHandler(400, "Resume file is required for jobseekers");
    }

    if (file.mimetype !== "application/pdf") {
      throw new ErrorHandler(400, "Resume must be a PDF file");
    }

    const fileBuffer = getBuffer(file);

    if (!fileBuffer || !fileBuffer.content) {
      throw new ErrorHandler(500, "Failed to generate buffer");
    }

    const { data } = await axios.post(
      `${process.env.UPLOAD_SERVICE}/api/utils/upload`,
      {
        buffer: fileBuffer.content,
        fileName: file.originalname,
        mimeType: file.mimetype,
      }
    );

    registeredUser = await User.create({
      name,
      email,
      password: hashPassword,
      phone_number: phoneNumber,
      role,
      bio,
      resume: data.url,
      resume_public_id: data.public_id
    });
  }

  const token = jwt.sign(
    { id: registeredUser?._id },
    process.env.JWT_SEC as string,
    {
      expiresIn: "15d",
    }
  );

  res.json({
    message: "user Registered",
    registeredUser: {
      _id: registeredUser?._id,
      name: registeredUser?.name,
      email: registeredUser?.email,
      phone_number: registeredUser?.phone_number,
      role: registeredUser?.role,
      bio: registeredUser?.bio,
      resume: registeredUser?.resume
    },
    token,
  });
});

export const loginUser = TryCatch(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ErrorHandler(400, "Please fill all details");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new ErrorHandler(400, "Invalid credentials");
  }

  const matchPassword = await bcrypt.compare(password as string, user.password as unknown as string);

  if (!matchPassword) {
    throw new ErrorHandler(400, "Invalid credentials");
  }

  const userObject = user.toObject();
  delete (userObject as any).password;

  const token = jwt.sign(
    { id: userObject._id },
    process.env.JWT_SEC as string,
    {
      expiresIn: "15d",
    }
  );

  res.json({
    message: "user Loggedin",
    userObject,
    token,
  });
});

export const forgotPassword = TryCatch(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    throw new ErrorHandler(400, "email is required");
  }

  const user = await User.findOne({ email });

  if (!user) {
    return res.json({
      message: "If that email exists, we have sent a reset link",
    });
  }

  const resetToken = jwt.sign(
    {
      email: user.email,
      type: "reset",
    },
    process.env.JWT_SEC as string,
    { expiresIn: "15m" }
  );

  const resetLink = `${process.env.Frontend_Url}/reset/${resetToken}`;

  await redisClient.set(`forgot:${email}`, resetToken, {
    EX: 900,
  });

  const message = {
    to: email,
    subject: "RESET Your Password - JobNexus",
    html: forgotPasswordTemplate(resetLink),
  };

  publishToTopic("send-mail", message).catch((error) => {
    console.error("failed to send message", error);
  });

  res.json({
    message: "If that email exists, we have sent a reset link",
  });
});

export const resetPassword = TryCatch(async (req, res, next) => {
  const { token } = req.params;
  const { password } = req.body;

  let decoded: any;

  try {
    decoded = jwt.verify(token as string, process.env.JWT_SEC as string);
  } catch (error) {
    throw new ErrorHandler(400, "Expired token");
  }

  if (decoded.type !== "reset") {
    throw new ErrorHandler(400, "Invalid token type");
  }

  const email = decoded.email;

  const stroredToken = await redisClient.get(`forgot:${email}`);

  if (!stroredToken || stroredToken !== token) {
    throw new ErrorHandler(400, "token has been expired");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new ErrorHandler(404, "User not found");
  }

  const hashPassword = await bcrypt.hash(password as string, 10);

  (user as any).password = hashPassword;
  await user.save();

  await redisClient.del(`forgot:${email}`);

  res.json({ message: "Password changed successfully" });
});

export const googleLogin = TryCatch(async (req, res, next) => {
  const { credential, role } = req.body;

  if (!credential) {
    throw new ErrorHandler(400, "Google credential is required");
  }

  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload || !payload.email) {
    throw new ErrorHandler(400, "Invalid Google token");
  }

  const { email, name, picture } = payload;

  let user = await User.findOne({ email });

  if (!user) {
    user = await User.create({
      name,
      email,
      role: role || "jobseeker",
      password: await bcrypt.hash(Math.random().toString(36).slice(-8), 10),
      phone_number: "Not provided",
      profile_pic: picture,
    });
  }

  const userObject = user.toObject();
  delete (userObject as any).password;

  const token = jwt.sign(
    { id: userObject._id },
    process.env.JWT_SEC as string,
    {
      expiresIn: "15d",
    }
  );

  res.json({
    message: "Google login successful",
    userObject,
    token,
  });
});

/*
 * ===========================================================================================
 *                              NOTES — auth/src/controllers/auth.ts
 * ===========================================================================================
 *
 * ┌─────────────────────────────────────────────────────────────────────────────────────────┐
 * │                              PURPOSE OF THIS FILE                                      │
 * ├─────────────────────────────────────────────────────────────────────────────────────────┤
 * │ This is the MAIN authentication controller for the JobNexus Auth Microservice.          │
 * │ It contains all the business logic for user registration, login, password recovery,     │
 * │ and Google OAuth. It is the brain of the Auth Service — routes call these functions,     │
 * │ and these functions interact with MongoDB (User model), Redis (reset tokens),           │
 * │ Kafka (sending emails), Cloudinary (resume uploads via Utils Service), and Google       │
 * │ Auth Library (OAuth 2.0 ID token verification).                                         │
 * └─────────────────────────────────────────────────────────────────────────────────────────┘
 *
 * ┌─────────────────────────────────────────────────────────────────────────────────────────┐
 * │                         ROLE IN OVERALL ARCHITECTURE                                    │
 * ├─────────────────────────────────────────────────────────────────────────────────────────┤
 * │ Layer: Backend → Auth Microservice → Controller Layer                                   │
 * │ Port: 5000                                                                              │
 * │ Base Route: /api/auth (defined in routes/auth.ts)                                       │
 * │                                                                                         │
 * │ Architecture Position:                                                                  │
 * │   Frontend (Next.js :3000)                                                              │
 * │       ↓ HTTP POST                                                                       │
 * │   Auth Routes (routes/auth.ts)                                                          │
 * │       ↓ calls controller                                                                │
 * │   THIS FILE (controllers/auth.ts)  ←── YOU ARE HERE                                     │
 * │       ↓ interacts with                                                                  │
 * │   MongoDB (User model), Redis, Kafka Producer, Utils Service (Cloudinary)               │
 * │                                                                                         │
 * │ This service is STATELESS — it does NOT store sessions. Authentication is token-based.   │
 * │ JWTs are issued here and verified by other services (User, Job, Payment) independently.  │
 * └─────────────────────────────────────────────────────────────────────────────────────────┘
 *
 * ┌─────────────────────────────────────────────────────────────────────────────────────────┐
 * │                              IMPORTS EXPLAINED                                          │
 * ├─────────────────────────────────────────────────────────────────────────────────────────┤
 * │ axios          → HTTP client to call the Utils Service for file uploads (Cloudinary)    │
 * │ getBuffer      → Utility to convert multer file buffer to a base64 data URI string      │
 * │ User           → Mongoose model for the users collection in MongoDB                     │
 * │ ErrorHandler   → Custom error class with statusCode + message for consistent errors     │
 * │ TryCatch       → HOF (Higher Order Function) that wraps async handlers with try/catch   │
 * │ bcrypt         → Library for hashing passwords (10 salt rounds) and comparing hashes    │
 * │ jwt            → JSON Web Token library for signing and verifying auth tokens           │
 * │ forgotPasswordTemplate → HTML email template function for password reset emails         │
 * │ OAuth2Client   → Google's official library to verify Google Sign-In ID tokens           │
 * │ publishToTopic → Kafka producer function that publishes messages to "send-mail" topic   │
 * │ redisClient    → Redis client instance for storing/retrieving forgot-password tokens    │
 * └─────────────────────────────────────────────────────────────────────────────────────────┘
 *
 * ┌─────────────────────────────────────────────────────────────────────────────────────────┐
 * │                     FUNCTION 1: registerUser                                            │
 * │                     Route: POST /api/auth/register                                      │
 * │                     Middleware: multer (file upload for resume)                          │
 * ├─────────────────────────────────────────────────────────────────────────────────────────┤
 * │ PURPOSE: Creates a new user account (jobseeker or recruiter) in MongoDB.                │
 * │                                                                                         │
 * │ STEP-BY-STEP DATA FLOW:                                                                 │
 * │ 1. Extract name, email, password, phoneNumber, role, bio from req.body                  │
 * │ 2. Validate all required fields exist → throw 400 if missing                            │
 * │ 3. Check if email already exists in DB → throw 409 (Conflict) if duplicate              │
 * │ 4. Hash password with bcrypt (10 salt rounds)                                           │
 * │ 5. If role === "recruiter":                                                             │
 * │    → Create user in MongoDB with basic fields (no resume needed)                        │
 * │ 6. If role === "jobseeker":                                                             │
 * │    → Validate that a file (resume PDF) was uploaded via multer                          │
 * │    → Convert the file to a base64 buffer using getBuffer()                              │
 * │    → POST the buffer to Utils Service (http://localhost:5001/api/utils/upload)           │
 * │    → Utils Service uploads it to Cloudinary and returns { url, public_id }              │
 * │    → Create user in MongoDB with all fields including resume URL                        │
 * │ 7. Sign a JWT with { id: user._id } and 15-day expiry                                  │
 * │ 8. Return the user object (without password), JWT token, and success message            │
 * │                                                                                         │
 * │ ASYNC OPERATIONS:                                                                       │
 * │ - bcrypt.hash() → CPU-intensive, returns Promise                                        │
 * │ - User.findOne() → MongoDB query                                                        │
 * │ - User.create() → MongoDB insert                                                        │
 * │ - axios.post() → HTTP call to Utils Service for Cloudinary upload                       │
 * │                                                                                         │
 * │ ERROR HANDLING:                                                                          │
 * │ - 400: Missing required fields or missing resume for jobseeker                          │
 * │ - 409: Email already exists (duplicate user)                                            │
 * │ - 500: Buffer generation failed                                                          │
 * │ - Any unhandled error is caught by TryCatch wrapper                                     │
 * │                                                                                         │
 * │ EDGE CASES:                                                                              │
 * │ - Recruiter does NOT need a resume, bio is optional for them                            │
 * │ - If Utils Service is down, the axios.post() will fail and throw                        │
 * │ - Password is NEVER returned to the client                                               │
 * └─────────────────────────────────────────────────────────────────────────────────────────┘
 *
 * ┌─────────────────────────────────────────────────────────────────────────────────────────┐
 * │                     FUNCTION 2: loginUser                                               │
 * │                     Route: POST /api/auth/login                                         │
 * │                     Middleware: none                                                     │
 * ├─────────────────────────────────────────────────────────────────────────────────────────┤
 * │ PURPOSE: Authenticates existing users with email + password and returns a JWT.           │
 * │                                                                                         │
 * │ STEP-BY-STEP DATA FLOW:                                                                 │
 * │ 1. Extract email and password from req.body                                             │
 * │ 2. Validate both fields exist → throw 400 if missing                                   │
 * │ 3. Find user by email in MongoDB                                                        │
 * │ 4. If no user found → throw 400 "Invalid credentials"                                  │
 * │    (Intentionally vague to prevent email enumeration attacks)                            │
 * │ 5. Compare provided password with stored hash using bcrypt.compare()                    │
 * │ 6. If mismatch → throw 400 "Invalid credentials"                                       │
 * │ 7. Convert Mongoose document to plain object, delete password field                     │
 * │ 8. Sign a JWT with { id: user._id } and 15-day expiry                                  │
 * │ 9. Return user object, JWT token, and success message                                   │
 * │                                                                                         │
 * │ SECURITY PATTERN: Same error message for "user not found" and "wrong password"          │
 * │ to prevent attackers from discovering which emails are registered.                       │
 * └─────────────────────────────────────────────────────────────────────────────────────────┘
 *
 * ┌─────────────────────────────────────────────────────────────────────────────────────────┐
 * │                     FUNCTION 3: forgotPassword                                          │
 * │                     Route: POST /api/auth/forgot                                        │
 * │                     Middleware: none                                                     │
 * ├─────────────────────────────────────────────────────────────────────────────────────────┤
 * │ PURPOSE: Sends a password reset email with a tokenized link.                            │
 * │                                                                                         │
 * │ STEP-BY-STEP DATA FLOW:                                                                 │
 * │ 1. Extract email from req.body → throw 400 if missing                                  │
 * │ 2. Find user by email                                                                    │
 * │ 3. If no user → STILL return success (prevents email enumeration)                       │
 * │ 4. Create a JWT "reset token" with { email, type: "reset" } and 15-minute expiry       │
 * │ 5. Build reset link: Frontend_Url/reset/{resetToken}                                   │
 * │ 6. Store the token in Redis with key "forgot:{email}" and 900s (15min) TTL             │
 * │ 7. Publish email message to Kafka "send-mail" topic                                     │
 * │    → Utils Service's Kafka consumer picks it up and sends via Gmail SMTP               │
 * │ 8. Return success message regardless of outcome                                         │
 * │                                                                                         │
 * │ INTER-SERVICE COMMUNICATION:                                                             │
 * │ Auth Service → (Kafka "send-mail") → Utils Service → Gmail SMTP → User's inbox          │
 * │                                                                                         │
 * │ WHY REDIS?                                                                               │
 * │ - Provides a server-side check that the token hasn't been used/invalidated              │
 * │ - Automatic expiry with TTL = 900 seconds (15 minutes)                                  │
 * │ - Even if the JWT itself is valid, the Redis check ensures single-use                   │
 * │                                                                                         │
 * │ WHY KAFKA (not direct SMTP)?                                                             │
 * │ - Decouples email sending from the auth flow (non-blocking)                             │
 * │ - If SMTP is slow/down, the auth response isn't delayed                                 │
 * │ - Utils Service handles all email logic centrally                                        │
 * └─────────────────────────────────────────────────────────────────────────────────────────┘
 *
 * ┌─────────────────────────────────────────────────────────────────────────────────────────┐
 * │                     FUNCTION 4: resetPassword                                           │
 * │                     Route: POST /api/auth/reset/:token                                  │
 * │                     Middleware: none                                                     │
 * ├─────────────────────────────────────────────────────────────────────────────────────────┤
 * │ PURPOSE: Resets user's password using the token from the reset email.                   │
 * │                                                                                         │
 * │ STEP-BY-STEP DATA FLOW:                                                                 │
 * │ 1. Extract token from URL params and password from req.body                             │
 * │ 2. Verify the JWT token using jwt.verify() → throw 400 if expired/invalid              │
 * │ 3. Check token type === "reset" → throw 400 if wrong type                              │
 * │ 4. Get the stored token from Redis using "forgot:{email}" key                           │
 * │ 5. Compare stored token with provided token → throw 400 if mismatch                    │
 * │    (This ensures the token hasn't been used before — single-use protection)             │
 * │ 6. Find user by email → throw 404 if not found                                         │
 * │ 7. Hash the new password with bcrypt (10 rounds)                                        │
 * │ 8. Update user's password in MongoDB                                                     │
 * │ 9. Delete the Redis key (invalidate the token — can't be reused)                        │
 * │ 10. Return success message                                                               │
 * │                                                                                         │
 * │ DOUBLE VALIDATION: JWT expiry check + Redis existence check = belt & suspenders          │
 * └─────────────────────────────────────────────────────────────────────────────────────────┘
 *
 * ┌─────────────────────────────────────────────────────────────────────────────────────────┐
 * │                     FUNCTION 5: googleLogin                                             │
 * │                     Route: POST /api/auth/google                                        │
 * │                     Middleware: none                                                     │
 * ├─────────────────────────────────────────────────────────────────────────────────────────┤
 * │ PURPOSE: Authenticates users via Google OAuth 2.0 (One Tap / Sign In With Google).      │
 * │                                                                                         │
 * │ STEP-BY-STEP DATA FLOW:                                                                 │
 * │ 1. Extract Google credential (ID token) from req.body                                   │
 * │ 2. Verify the ID token using google-auth-library's verifyIdToken()                      │
 * │    → This contacts Google's servers to validate the token                               │
 * │    → Checks the token was issued by Google for OUR client ID                            │
 * │ 3. Extract { email, name, picture } from the token payload                              │
 * │ 4. Check if a user with that email already exists in MongoDB                            │
 * │ 5. If NOT exists → auto-register with:                                                  │
 * │    - Random bcrypt-hashed password (user can't login with password)                     │
 * │    - phone_number = "Not provided"                                                       │
 * │    - role = "jobseeker" (default)                                                        │
 * │    - profile_pic = Google avatar URL                                                     │
 * │ 6. If EXISTS → just log them in (no password check needed)                              │
 * │ 7. Sign a JWT with { id: user._id } and 15-day expiry                                  │
 * │ 8. Return user object (without password), JWT, and success message                      │
 * │                                                                                         │
 * │ HOW IT CONNECTS TO FRONTEND:                                                             │
 * │ - Frontend uses @react-oauth/google's <GoogleLogin> component                           │
 * │ - Google shows a popup, user signs in, returns a credential (ID token)                  │
 * │ - Frontend POSTs that credential to this endpoint                                       │
 * │ - Backend verifies it, creates/finds user, returns JWT                                  │
 * │ - Frontend stores JWT in cookie, same as regular login                                  │
 * │                                                                                         │
 * │ SECURITY: The ID token is cryptographically signed by Google. verifyIdToken()            │
 * │ checks the signature, expiry, and audience (our client ID) to prevent forgery.          │
 * └─────────────────────────────────────────────────────────────────────────────────────────┘
 *
 * ┌─────────────────────────────────────────────────────────────────────────────────────────┐
 * │                     GLOBAL VARIABLE: googleClient                                       │
 * ├─────────────────────────────────────────────────────────────────────────────────────────┤
 * │ const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)                     │
 * │ - Created once at module load (singleton pattern)                                       │
 * │ - Reused for every Google login request (no need to recreate)                           │
 * │ - GOOGLE_CLIENT_ID is set in .env from Google Cloud Console OAuth credentials           │
 * └─────────────────────────────────────────────────────────────────────────────────────────┘
 *
 * ┌─────────────────────────────────────────────────────────────────────────────────────────┐
 * │                     CONNECTIONS TO OTHER FILES                                           │
 * ├─────────────────────────────────────────────────────────────────────────────────────────┤
 * │ • routes/auth.ts       → Maps HTTP endpoints to these controller functions              │
 * │ • models/User.ts       → Mongoose schema/model for reading/writing user data            │
 * │ • producer.ts          → Kafka producer for publishing "send-mail" messages             │
 * │ • index.ts             → Exports redisClient used for forgot-password token storage     │
 * │ • templete.ts          → HTML template for the forgot password email                    │
 * │ • utils/buffer.ts      → Converts multer File to base64 data URI                       │
 * │ • utils/errorHandler.ts → Custom error class used for throwing structured errors        │
 * │ • utils/TryCatch.ts    → Wraps async functions so errors flow to Express error handler  │
 * │ • middlewares/multer.ts → Processes file uploads before this controller runs             │
 * │ • Utils Service (:5001) → Called via axios for Cloudinary uploads                       │
 * │ • Frontend (:3000)      → Sends requests to these endpoints                             │
 * └─────────────────────────────────────────────────────────────────────────────────────────┘
 *
 * ┌─────────────────────────────────────────────────────────────────────────────────────────┐
 * │                     DESIGN PATTERNS USED                                                │
 * ├─────────────────────────────────────────────────────────────────────────────────────────┤
 * │ 1. Controller Pattern → Business logic separated from routing                          │
 * │ 2. TryCatch HOF → Eliminates repetitive try/catch blocks in every handler              │
 * │ 3. Custom ErrorHandler → Consistent error format across the entire API                  │
 * │ 4. Event-Driven (Kafka) → Decoupled email sending via message queue                    │
 * │ 5. Token-Based Auth → Stateless JWT authentication                                      │
 * │ 6. Microservice Communication → Auth → Utils Service for file uploads                   │
 * │ 7. Singleton → googleClient created once and reused                                     │
 * └─────────────────────────────────────────────────────────────────────────────────────────┘
 *
 * ┌─────────────────────────────────────────────────────────────────────────────────────────┐
 * │                     POTENTIAL IMPROVEMENTS                                              │
 * ├─────────────────────────────────────────────────────────────────────────────────────────┤
 * │ 1. Add input validation library (Zod/Joi) instead of manual checks                     │
 * │ 2. Add rate limiting to login/forgot endpoints (prevent brute force)                    │
 * │ 3. Use refresh tokens instead of long-lived JWTs (15d is generous)                      │
 * │ 4. Add email verification on registration                                               │
 * │ 5. Store password hash iterations count for future migration                            │
 * │ 6. Add Google role selection UI for first-time Google OAuth users                       │
 * │ 7. Log authentication events for security auditing                                      │
 * └─────────────────────────────────────────────────────────────────────────────────────────┘
 *
 * ┌─────────────────────────────────────────────────────────────────────────────────────────┐
 * │                     POTENTIAL INTERVIEW QUESTIONS                                       │
 * ├─────────────────────────────────────────────────────────────────────────────────────────┤
 * │ 1. Why do you return the same message for "user not found" and "wrong password"?        │
 * │    → Prevents email enumeration attacks                                                 │
 * │ 2. Why use bcrypt instead of SHA-256 for password hashing?                              │
 * │    → bcrypt is adaptive (salt rounds), designed for passwords, intentionally slow       │
 * │ 3. Why use Kafka for sending emails instead of calling SMTP directly?                   │
 * │    → Decoupling, reliability, non-blocking. If SMTP is slow, auth isn't affected.      │
 * │ 4. Why store the reset token in Redis if the JWT already has an expiry?                 │
 * │    → Single-use protection. After reset, the Redis key is deleted.                      │
 * │ 5. How does Google OAuth work in this flow?                                              │
 * │    → Frontend gets ID token from Google popup → sends to backend → backend verifies     │
 * │      with Google servers → creates/finds user → issues own JWT                          │
 * │ 6. What happens if a Google user tries to login with email/password?                    │
 * │    → They have a random password, so they can't. They must use Google.                  │
 * │ 7. Why is the JWT signed with the user's _id and not email?                             │
 * │    → _id is immutable, email could change. All other services look up by _id.           │
 * │ 8. Explain the TryCatch pattern.                                                        │
 * │    → It's a HOF that wraps async (req, res, next) => {} in try/catch and calls          │
 * │      next(error) on failure, which triggers Express's global error handler.             │
 * │ 9. What is the upload flow for a jobseeker's resume?                                    │
 * │    → Multer → buffer → axios POST to Utils Service → Cloudinary → URL stored in DB     │
 * │ 10. Why 10 salt rounds in bcrypt?                                                       │
 * │    → Balance between security and performance. ~100ms per hash. 12+ would be slower.   │
 * └─────────────────────────────────────────────────────────────────────────────────────────┘
 */
