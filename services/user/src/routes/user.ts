import express from "express";
import { isAuth } from "../middlewares/auth.js";
import {
  addSkillToUser,
  applyForJob,
  deleteSkillFromUser,
  getAllaplications,
  getUserProfile,
  myProfile,
  updateProfilePic,
  updateResume,
  updateUserProfile,
  withdrawApplication,
} from "../controllers/user.js";
import uploadFile from "../middlewares/multer.js";

const router = express.Router();

router.get("/me", isAuth, myProfile);
router.get("/:userId", isAuth, getUserProfile);
router.put("/update/profile", isAuth, updateUserProfile);
router.put("/update/pic", isAuth, uploadFile, updateProfilePic);
router.put("/update/resume", isAuth, uploadFile, updateResume);
router.post("/skill/add", isAuth, addSkillToUser);
router.put("/skill/delete", isAuth, deleteSkillFromUser);
router.post("/apply/job", isAuth, applyForJob);
router.get("/application/all", isAuth, getAllaplications);
router.delete("/application/withdraw/:applicationId", isAuth, withdrawApplication);

export default router;

/*
 * ===========================================================================================
 *                              NOTES — user/src/routes/user.ts
 * ===========================================================================================
 *
 * PURPOSE: Defines all HTTP routes for the User Microservice.
 *
 * ROLE IN ARCHITECTURE: Backend → User Service (Port 5002) → Routing Layer
 * Base Path: /api/user (mounted in app.ts)
 *
 * ENDPOINTS:
 * ┌──────────────────────────────────────────────────────────────────────────────────────────┐
 * │ Method │ Endpoint              │ Middleware        │ Controller         │ Purpose         │
 * ├────────┼───────────────────────┼──────────────────┼────────────────────┼─────────────────┤
 * │ GET    │ /api/user/me          │ isAuth           │ myProfile          │ Get own profile  │
 * │ GET    │ /api/user/:userId     │ isAuth           │ getUserProfile     │ View any user    │
 * │ PUT    │ /api/user/update/profile │ isAuth        │ updateUserProfile  │ Edit name/bio    │
 * │ PUT    │ /api/user/update/pic  │ isAuth,uploadFile│ updateProfilePic   │ Upload avatar    │
 * │ PUT    │ /api/user/update/resume│ isAuth,uploadFile│ updateResume      │ Upload resume    │
 * │ POST   │ /api/user/skill/add   │ isAuth           │ addSkillToUser     │ Add a skill      │
 * │ PUT    │ /api/user/skill/delete│ isAuth           │ deleteSkillFromUser│ Remove a skill   │
 * │ POST   │ /api/user/apply/job   │ isAuth           │ applyForJob        │ Apply to a job   │
 * │ GET    │ /api/user/application/all│ isAuth        │ getAllaplications   │ My applications  │
 * └──────────────────────────────────────────────────────────────────────────────────────────┘
 *
 * MIDDLEWARE CHAIN:
 * - ALL routes require isAuth → JWT verification + user lookup from DB
 * - /update/pic and /update/resume additionally require uploadFile (multer) for file uploads
 *
 * NOTE: Every endpoint is protected. There are no public user endpoints.
 *
 * CONNECTIONS:
 * • app.ts → mounts this router at /api/user
 * • controllers/user.ts → all handler functions
 * • middlewares/auth.ts → provides isAuth
 * • middlewares/multer.ts → provides uploadFile
 */
