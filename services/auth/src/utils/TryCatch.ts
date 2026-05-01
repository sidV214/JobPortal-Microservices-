import { Request, Response, NextFunction, RequestHandler } from "express";
import ErrorHandler from "./errorHandler.js";

export const TryCatch =
  (
    controller: (
      req: Request,
      res: Response,
      next: NextFunction
    ) => Promise<any>
  ): RequestHandler =>
  async (req, res, next) => {
    try {
      await controller(req, res, next);
    } catch (error: any) {
      if (error instanceof ErrorHandler) {
        return res.status(error.statusCode).json({
          message: error.message,
        });
      }

      res.status(500).json({
        message: error.message,
      });
    }
  };

/*
 * ===========================================================================================
 *                              NOTES — utils/TryCatch.ts (shared across services)
 * ===========================================================================================
 *
 * PURPOSE: Higher-Order Function (HOF) that wraps async Express route handlers in a
 * try/catch block. Eliminates the need to write try/catch in every single controller.
 *
 * HOW IT WORKS:
 * 1. TryCatch takes a controller function as argument (the actual handler logic)
 * 2. Returns a new RequestHandler that:
 *    a. Calls the controller inside a try block (with await)
 *    b. If an ErrorHandler is thrown → responds with error.statusCode and error.message
 *    c. If any other error is thrown → responds with 500 and the error message
 *
 * TYPE SIGNATURE:
 * TryCatch(controller: (req, res, next) => Promise<any>): RequestHandler
 *
 * USAGE PATTERN:
 * export const myHandler = TryCatch(async (req, res) => {
 *   // Business logic — any thrown error is automatically caught
 *   throw new ErrorHandler(400, "Bad request");
 * });
 *
 * ERROR HANDLING FLOW:
 * Controller throws error → TryCatch catches it → checks instanceof ErrorHandler
 * → If custom error: uses error.statusCode (e.g., 400, 404)
 * → If unexpected error: defaults to 500 (Internal Server Error)
 *
 * DESIGN PATTERN: Decorator/Wrapper pattern — adds error handling to any async function
 * without modifying the function itself.
 *
 * WHY NOT USE EXPRESS ERROR MIDDLEWARE (next(error))?
 * - This approach keeps error responses inline (no separate error middleware needed)
 * - Simpler to understand: each controller handles its own errors via TryCatch
 *
 * CONNECTIONS: Used by ALL controller functions in ALL services.
 *
 * INTERVIEW QUESTIONS:
 * 1. What is a Higher-Order Function?
 *    → A function that takes or returns another function. TryCatch takes a controller and
 *      returns a wrapped version of it.
 * 2. Why not just write try/catch in every handler?
 *    → DRY principle. 20+ handlers × try/catch = lots of boilerplate. TryCatch centralizes it.
 * 3. Why check instanceof ErrorHandler?
 *    → To differentiate between intentional errors (400, 404) and bugs (500).
 */
