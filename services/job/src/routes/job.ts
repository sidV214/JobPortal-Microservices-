import express from "express";
import { isAuth } from "../middlewares/auth.js";
import uploadFile from "../middlewares/multer.js";
import {
  createCompany,
  createJob,
  deleteCompany,
  getAllActiveJobs,
  getAllApplicationForJob,
  getAllCompany,
  getCompanyDetails,
  getSingleJob,
  getRecruiterJobs,
  updateApplication,
  updateJob,
} from "../controllers/job.js";

const router = express.Router();

router.post("/company/new", isAuth, uploadFile, createCompany);
router.delete("/company/:companyId", isAuth, deleteCompany);
router.post("/new", isAuth, createJob);
router.put("/:jobId", isAuth, updateJob);
router.get("/company/all", isAuth, getAllCompany);
router.get("/company/:id", getCompanyDetails);
router.get("/recruiter/all", isAuth, getRecruiterJobs);
router.get("/all", getAllActiveJobs);
router.get("/:jobId", getSingleJob);
router.get("/application/:jobId", isAuth, getAllApplicationForJob);
router.put("/application/update/:id", isAuth, updateApplication);

export default router;

/*
 * ===========================================================================================
 *                              NOTES — job/src/routes/job.ts
 * ===========================================================================================
 *
 * PURPOSE: Defines all HTTP routes for the Job Microservice.
 *
 * ROLE IN ARCHITECTURE: Backend → Job Service (Port 5003) → Routing Layer
 * Base Path: /api/job (mounted in app.ts)
 *
 * ENDPOINTS:
 * ┌────────────────────────────────────────────────────────────────────────────────────────┐
 * │ Method │ Endpoint                      │ Auth  │ Controller             │ Purpose       │
 * ├────────┼───────────────────────────────┼───────┼────────────────────────┼───────────────┤
 * │ POST   │ /api/job/company/new          │ Yes+F │ createCompany          │ New company    │
 * │ DELETE │ /api/job/company/:companyId   │ Yes   │ deleteCompany          │ Delete company │
 * │ POST   │ /api/job/new                  │ Yes   │ createJob              │ Post a job     │
 * │ PUT    │ /api/job/:jobId               │ Yes   │ updateJob              │ Edit a job     │
 * │ GET    │ /api/job/company/all          │ Yes   │ getAllCompany           │ My companies   │
 * │ GET    │ /api/job/company/:id          │ No    │ getCompanyDetails      │ Company page   │
 * │ GET    │ /api/job/all                  │ No    │ getAllActiveJobs        │ Job search     │
 * │ GET    │ /api/job/:jobId               │ No    │ getSingleJob           │ Job detail     │
 * │ GET    │ /api/job/application/:jobId   │ Yes   │ getAllApplicationForJob │ View applicants│
 * │ PUT    │ /api/job/application/update/:id│ Yes  │ updateApplication      │ Update status  │
 * └────────────────────────────────────────────────────────────────────────────────────────┘
 *
 * PUBLIC ENDPOINTS (no auth): /company/:id, /all, /:jobId
 * → Job listings and company pages are publicly viewable (SEO, browsing without login)
 *
 * PROTECTED + FILE: /company/new uses isAuth + uploadFile (multer) for logo upload
 */
