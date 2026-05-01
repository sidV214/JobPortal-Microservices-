import express, { json } from "express";
import cloudinary from "cloudinary";

const router = express.Router();

router.post("/upload", async (req, res) => {
  try {
    const { buffer, public_id, fileName, mimeType } = req.body;

    if (!buffer) {
      return res.status(400).json({
        message: "File buffer is required",
      });
    }

    const normalizedFileName =
      typeof fileName === "string" ? fileName.trim() : "";
    const normalizedMimeType =
      typeof mimeType === "string" ? mimeType.toLowerCase() : "";
    const isPdfUpload =
      normalizedMimeType === "application/pdf" ||
      /^data:application\/pdf;base64,/i.test(buffer) ||
      normalizedFileName.toLowerCase().endsWith(".pdf");

    if (public_id) {
      await cloudinary.v2.uploader.destroy(public_id);
    }

    const cloud = await cloudinary.v2.uploader.upload(buffer, {
      resource_type: isPdfUpload ? "image" : "auto",
    });

    const deliveryUrl = isPdfUpload
      ? cloudinary.v2.url(cloud.public_id, {
          secure: true,
          resource_type: "image",
          type: "upload",
          version: cloud.version,
          format: "pdf",
        })
      : cloud.secure_url;

    res.json({
      url: deliveryUrl,
      public_id: cloud.public_id,
      resource_type: cloud.resource_type,
      format: cloud.format,
    });
  } catch (error: any) {
    res.status(500).json({
      message: error.message,
    });
  }
});

import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY_GEMINI });

router.post("/career", async (req, res) => {
  try {
    const { skills } = req.body;

    if (!skills) {
      return res.status(400).json({
        message: "Skills Required",
      });
    }

    const prompt = ` 
Based on the following skills: ${skills}. 
 
Please act as a career advisor and generate a career path suggestion. 
Your entire response must be in a valid JSON format. Do not include any text or markdown 
formatting outside of the JSON structure. 
 
The JSON object should have the following structure: 
{ 
 "summary": "A brief, encouraging summary of the user's skill set and their general job 
title.", 
 "jobOptions": [ 
 { 
"title": "The name of the job role.", 
"responsibilities": "A description of what the user would do in this role.", 
"why": "An explanation of why this role is a good fit for their skills." 
 } 
 ], 
 "skillsToLearn": [ 
 { 
"category": "A general category for skill improvement (e.g., 'Deepen Your Existing Stack 
Mastery', 'DevOps & Cloud').", 
"skills": [ 
 { 
 "title": "The name of the skill to learn.", 
 "why": "Why learning this skill is important.", 
 "how": "Specific examples of how to learn or apply this skill." 
 } 
] 
 } 
 ], 
 "learningApproach": { 
"title": "How to Approach Learning", 
"points": ["A bullet point list of actionable advice for learning."] 
 } 
} 
 `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    let jsonResponse;

    try {
      const rawText = response.text
        ?.replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      if (!rawText) {
        throw new Error("Ai did not return a valid text response.");
      }

      jsonResponse = JSON.parse(rawText);
    } catch (error) {
      return res.status(500).json({
        message: "Ai returned response that was not valid JSON",
        rawResponse: response.text,
      });
    }

    res.json(jsonResponse);
  } catch (error: any) {
    res.status(500).json({
      message: error.message,
    });
  }
});

router.post("/resume-analyser", async (req, res) => {
  try {
    const { pdfBase64 } = req.body;

    if (!pdfBase64) {
      return res.status(400).json({ message: "PDF data is required" });
    }

    const prompt = ` 
You are an expert ATS (Applicant Tracking System) analyzer. Analyze the following resume 
and provide: 
1. An ATS compatibility score (0-100) 
2. Detailed suggestions to improve the resume for better ATS performance 
 
Your entire response must be in valid JSON format. Do not include any text or markdown 
formatting outside of the JSON structure. 
 
The JSON object should have the following structure: 
{ 
  "atsScore": 85, 
  "scoreBreakdown": { 
    "formatting": { 
      "score": 90, 
      "feedback": "Brief feedback on formatting" 
    }, 
    "keywords": { 
      "score": 80, 
      "feedback": "Brief feedback on keyword usage" 
    }, 
    "structure": { 
      "score": 85, 
      "feedback": "Brief feedback on resume structure" 
    }, 
    "readability": { 
      "score": 88, 
      "feedback": "Brief feedback on readability" 
    } 
  }, 
  "suggestions": [ 
    { 
      "category": "Category name (e.g., 'Formatting', 'Content', 'Keywords', 
'Structure')", 
      "issue": "Description of the issue found", 
      "recommendation": "Specific actionable recommendation to fix it", 
      "priority": "high/medium/low" 
    } 
  ], 
  "strengths": [ 
    "List of things the resume does well for ATS" 
  ], 
  "summary": "A brief 2-3 sentence summary of the overall ATS performance" 
} 
 
Focus on: - File format and structure compatibility - Proper use of standard section headings - Keyword optimization - Formatting issues (tables, columns, graphics, special characters) - Contact information placement - Date formatting - Use of action verbs and quantifiable achievements - Section organization and flow 
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: prompt,
            },
            {
              inlineData: {
                mimeType: "application/pdf",
                data: pdfBase64.replace(/^data:application\/pdf;base64,/, ""),
              },
            },
          ],
        },
      ],
    });

    let jsonResponse;

    try {
      const rawText = response.text
        ?.replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      if (!rawText) {
        throw new Error("Ai did not return a valid text response.");
      }

      jsonResponse = JSON.parse(rawText);
    } catch (error) {
      return res.status(500).json({
        message: "Ai returned response that was not valid JSON",
        rawResponse: response.text,
      });
    }

    res.json(jsonResponse);
  } catch (error: any) {
    res.status(500).json({
      message: error.message,
    });
  }
});

export default router;

/*
 * ===========================================================================================
 *                              NOTES — utils/src/routes.ts
 * ===========================================================================================
 *
 * PURPOSE: Contains 3 endpoints for the Utils Microservice:
 * 1. File upload to Cloudinary
 * 2. AI-powered Career Path Advisor (Gemini)
 * 3. AI-powered Resume/ATS Analyser (Gemini)
 *
 * ROLE IN ARCHITECTURE: Backend → Utils Service (Port 5001) → Routes + Controllers combined
 * (No separate controller file — routes handle logic directly due to simplicity)
 *
 * ┌─────────────────────────────────────────────────────────────────────────────────────┐
 * │ ENDPOINT 1: POST /api/utils/upload                                                  │
 * │ PURPOSE: Upload a file (base64) to Cloudinary, optionally replacing an old file.    │
 * │ DATA FLOW:                                                                          │
 * │ 1. Receive { buffer (base64 data URI), public_id (optional, for replacement) }      │
 * │ 2. If public_id exists → delete old file from Cloudinary (cloudinary.uploader.destroy)│
 * │ 3. Upload new buffer to Cloudinary (cloudinary.uploader.upload)                     │
 * │ 4. Return { url: secure_url, public_id: cloud.public_id }                           │
 * │                                                                                     │
 * │ CALLED BY: Auth Service (resume upload), User Service (pic/resume), Job (company logo)│
 * └─────────────────────────────────────────────────────────────────────────────────────┘
 *
 * ┌─────────────────────────────────────────────────────────────────────────────────────┐
 * │ ENDPOINT 2: POST /api/utils/career                                                  │
 * │ PURPOSE: AI career path advisor using Google Gemini (gemini-2.5-flash model).       │
 * │ DATA FLOW:                                                                          │
 * │ 1. Receive { skills } from frontend                                                 │
 * │ 2. Build a detailed prompt requesting JSON output with:                              │
 * │    - summary, jobOptions, skillsToLearn, learningApproach                            │
 * │ 3. Call Gemini AI API → get response text                                            │
 * │ 4. Strip markdown code fences (```json ... ```) from AI response                    │
 * │ 5. Parse as JSON → return to frontend                                                │
 * │                                                                                     │
 * │ AI MODEL: gemini-2.5-flash (fast, cost-effective)                                    │
 * │ ERROR HANDLING: If AI returns non-JSON, returns 500 with raw response for debugging  │
 * └─────────────────────────────────────────────────────────────────────────────────────┘
 *
 * ┌─────────────────────────────────────────────────────────────────────────────────────┐
 * │ ENDPOINT 3: POST /api/utils/resume-analyser                                         │
 * │ PURPOSE: AI ATS resume scorer using Google Gemini with multimodal input.             │
 * │ DATA FLOW:                                                                          │
 * │ 1. Receive { pdfBase64 } — the resume PDF as base64 string                          │
 * │ 2. Build prompt requesting ATS score, breakdown, suggestions, strengths, summary    │
 * │ 3. Send BOTH text prompt AND PDF binary as multimodal input to Gemini                │
 * │    → Uses inlineData with mimeType "application/pdf"                                 │
 * │ 4. Parse AI response JSON → return to frontend                                      │
 * │                                                                                     │
 * │ MULTIMODAL AI: This endpoint sends both text AND a PDF binary to the AI model.      │
 * │ The AI can "read" the PDF content and analyze it against ATS criteria.               │
 * │ Strips base64 prefix (data:application/pdf;base64,) before sending.                 │
 * └─────────────────────────────────────────────────────────────────────────────────────┘
 *
 * GLOBAL VARIABLE: ai = new GoogleGenAI({ apiKey })
 * - Singleton Gemini client, reused across requests
 * - API_KEY_GEMINI from .env (Google AI Studio API key)
 *
 * CONNECTIONS:
 * • index.ts → mounts at /api/utils
 * • Frontend career-guide.tsx → calls /career endpoint
 * • Frontend resume-analyser.tsx → calls /resume-analyser endpoint
 * • Auth/User/Job services → call /upload endpoint
 *
 * INTERVIEW QUESTIONS:
 * 1. Why strip ```json from AI responses?
 *    → LLMs often wrap JSON in markdown code fences. Must remove for JSON.parse().
 * 2. Why use inlineData for the resume analyser?
 *    → Gemini's multimodal API can process PDFs natively. No text extraction needed.
 * 3. Why use gemini-2.5-flash instead of gemini-2.5-pro?
 *    → Flash is faster and cheaper. Sufficient for structured JSON generation.
  * 4. Why did Cloudinary block PDF resume deliveries with "ACL failure" or "x-cld-error: deny"?
 *    ? Cloudinary accounts restrict PDF/ZIP delivery by default for security. The fix wasn't
 *       in the code (like forcing raw buffers), but checking the Cloudinary Dashboard Security
 *       Settings to "Allow delivery of PDF and ZIP files", and standardizing the upload contract
 *       to use resource_type: "image" with format: "pdf" for clean URLs.
 */
