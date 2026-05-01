import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { User } from "../models/User.js";

interface UserType {
  _id: string;
  name: string;
  email: string;
  phone_number: string;
  role: "jobseeker" | "recruiter";
  bio?: string | null;
  resume?: string | null;
  resume_public_id?: string | null;
  profile_pic?: string | null;
  profile_pic_public_id?: string | null;
  skills?: string[];
  subscription?: string | null;
}

export interface AuthenticatedRequest extends Request {
  user?: UserType;
}

export const isAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        message: "Authorization header is missing or invalid",
      });
      return;
    }

    const token = authHeader.split(" ")[1];

    const decodedPayload = jwt.verify(
      token,
      process.env.JWT_SEC as string
    ) as JwtPayload;

    if (!decodedPayload || !decodedPayload.id) {
      res.status(401).json({
        message: "Invalid Token",
      });
      return;
    }

    const user = await User.findById(decodedPayload.id).select("-password");

    if (!user) {
      res.status(401).json({
        message: "User associated with this token no longer exists.",
      });
      return;
    }

    req.user = user.toObject() as unknown as UserType;

    next();
  } catch (error) {
    console.log(error);
    res.status(401).json({
      message: "Authentication Failed. Please login again",
    });
  }
};

/*
 * ===========================================================================================
 *                              NOTES — user/src/middlewares/auth.ts
 * ===========================================================================================
 *
 * PURPOSE: JWT authentication middleware that protects all User Service endpoints.
 * Verifies the token, looks up the user in MongoDB, and attaches them to req.user.
 *
 * ROLE IN ARCHITECTURE: Backend → User Service → Middleware Layer (runs BEFORE controllers)
 *
 * INTERFACE: UserType
 * - Defines the shape of the user object attached to req.user
 * - Includes all User fields except password
 * - TypeScript-only (stripped at compile time, no runtime cost)
 *
 * INTERFACE: AuthenticatedRequest extends Request
 * - Extends Express's Request type with an optional user property
 * - Controllers that need user data use this type instead of plain Request
 * - Exported for use in controllers/user.ts
 *
 * FUNCTION: isAuth(req, res, next)
 * STEP-BY-STEP DATA FLOW:
 * 1. Extract Authorization header from request
 * 2. Validate it exists and starts with "Bearer " → 401 if missing
 * 3. Split the header to get the JWT token (index [1])
 * 4. Verify token using jwt.verify() with JWT_SEC secret → catches expired/invalid
 * 5. Extract user ID from decoded payload (decodedPayload.id)
 * 6. Look up user in MongoDB by ID, excluding password field
 * 7. If user not found → 401 (user may have been deleted after token was issued)
 * 8. Convert Mongoose document to plain object and attach to req.user
 * 9. Call next() → passes control to the route handler
 *
 * ERROR HANDLING:
 * - Missing/malformed header → 401
 * - Invalid/expired JWT → caught by catch block → 401
 * - User deleted after token issued → 401
 *
 * SECURITY:
 * - Token is verified on EVERY request (stateless authentication)
 * - Password is never included in req.user (.select("-password"))
 * - JWT_SEC must match between Auth Service (signs) and User Service (verifies)
 *
 * CONNECTIONS:
 * • routes/user.ts → applied as middleware on all routes
 * • controllers/user.ts → accesses req.user populated by this middleware
 * • Auth Service → issues the JWT that this middleware verifies
 *
 * INTERVIEW QUESTIONS:
 * 1. Why verify the JWT on every request instead of using sessions?
 *    → Stateless auth. Each microservice can independently verify without shared session store.
 * 2. Why look up the user in DB if the JWT has the user ID?
 *    → To get fresh data (name, role, subscription) and ensure user still exists.
 * 3. Why use .select("-password") instead of deleting password after fetch?
 *    → MongoDB projection — password bytes never leave the database at all.
 * 4. What happens if JWT_SEC is different between Auth and User service?
 *    → jwt.verify() fails with "invalid signature" and all requests get 401.
 */
