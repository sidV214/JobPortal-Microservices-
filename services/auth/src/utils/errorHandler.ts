export default class ErrorHandler extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);

    this.statusCode = statusCode;

    Error.captureStackTrace(this, this.constructor);
  }
}

/*
 * ===========================================================================================
 *                              NOTES — utils/errorHandler.ts (shared across services)
 * ===========================================================================================
 *
 * PURPOSE: Custom Error class that extends the native Error class to include an HTTP status code.
 * Used throughout controllers to throw structured, meaningful errors.
 *
 * CLASS: ErrorHandler extends Error
 * - Properties:
 *   - message (inherited from Error) → Human-readable error description
 *   - statusCode (custom) → HTTP status code (400, 401, 403, 404, 409, 500, etc.)
 * - Constructor: Takes (statusCode, message), calls super(message), assigns statusCode
 * - Error.captureStackTrace() → Cleans up the stack trace to exclude the ErrorHandler constructor
 *
 * USAGE PATTERN:
 *   throw new ErrorHandler(400, "Please fill all details");
 *   throw new ErrorHandler(404, "User not found");
 *
 * HOW IT'S CAUGHT: TryCatch wrapper checks if error instanceof ErrorHandler:
 * - If yes → responds with error.statusCode and error.message
 * - If no → responds with 500 and the raw error message
 *
 * DESIGN PATTERN: Custom Exception class — separates expected errors (client mistakes)
 * from unexpected errors (bugs, DB failures) for proper HTTP status codes.
 *
 * INTERVIEW QUESTIONS:
 * 1. Why extend Error instead of just using a plain object?
 *    → Inherits stack trace, instanceof checks, and error handling semantics.
 * 2. What does captureStackTrace do?
 *    → Removes the ErrorHandler constructor from the stack trace for cleaner debugging.
 */
