import DataUriParser from "datauri/parser.js";
import path from "path";

const getBuffer = (file: any) => {
  const parser = new DataUriParser();

  const extName = path.extname(file.originalname).toString();

  return parser.format(extName, file.buffer);
};

export default getBuffer;

/*
 * ===========================================================================================
 *                              NOTES — utils/buffer.ts (shared across services)
 * ===========================================================================================
 *
 * PURPOSE: Converts a multer uploaded file (in-memory buffer) into a data URI string
 * that can be sent to the Utils Service for Cloudinary upload.
 *
 * FUNCTION: getBuffer(file: any)
 * - Takes a multer file object (req.file) with .buffer and .originalname properties
 * - Extracts the file extension using path.extname() (e.g., ".pdf", ".jpg")
 * - Uses DataUriParser to convert the binary buffer into a base64 data URI string
 *   e.g., "data:application/pdf;base64,JVBERi0xLjQ..."
 * - Returns { content: string, mimetype: string } — used as payload for Cloudinary upload
 *
 * DATA FLOW:
 * multer (RAM buffer) → getBuffer() → data URI string → axios POST to Utils Service
 * → Utils Service → Cloudinary SDK upload → returns { url, public_id }
 *
 * WHY DATA URI?
 * - Cloudinary accepts base64 data URIs for upload (no file path needed)
 * - Avoids writing temp files to disk (keeps the service stateless)
 *
 * CONNECTIONS: Used by controllers in auth and user services during file uploads.
 */
