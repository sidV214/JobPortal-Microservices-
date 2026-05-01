import multer from "multer";

const storage = multer.memoryStorage();

const uploadFile = multer({ storage }).single("file");

export default uploadFile;

/*
 * ===========================================================================================
 *                              NOTES — auth/src/middleware/multer.ts
 * ===========================================================================================
 *
 * PURPOSE: Configures multer middleware for handling file uploads (resume PDFs, profile pics).
 * Multer processes multipart/form-data requests and attaches the file to req.file.
 *
 * ROLE IN ARCHITECTURE: Backend → Auth Service → Middleware Layer
 *
 * HOW IT WORKS:
 * 1. multer.memoryStorage() → Files are stored in RAM as Buffer objects (not written to disk)
 * 2. .single("file") → Expects exactly ONE file with form field name "file"
 * 3. The file is available as req.file in the controller with properties:
 *    - req.file.buffer → Raw binary data of the uploaded file
 *    - req.file.mimetype → e.g., "application/pdf" or "image/jpeg"
 *    - req.file.originalname → Original filename from the user's computer
 *    - req.file.size → File size in bytes
 *
 * WHY MEMORY STORAGE (not disk)?
 * - Files are immediately sent to Cloudinary via the Utils Service
 * - No need to persist files on the server (stateless microservice)
 * - Buffer is converted to base64 by utils/buffer.ts, then POSTed to Utils Service
 *
 * CONNECTIONS:
 * • routes/auth.ts → uses uploadFile middleware on POST /register
 * • controllers/auth.ts → accesses req.file to get the uploaded resume
 * • utils/buffer.ts → converts req.file to base64 data URI for Cloudinary upload
 *
 * INTERVIEW QUESTIONS:
 * 1. Why use memoryStorage instead of diskStorage?
 *    → Stateless design. File goes to Cloudinary, not saved locally.
 * 2. What does .single("file") mean?
 *    → Expects one file uploaded with the form field named "file".
 * 3. What happens if no file is uploaded?
 *    → req.file is undefined. Controller checks for this and throws 400.
 */
