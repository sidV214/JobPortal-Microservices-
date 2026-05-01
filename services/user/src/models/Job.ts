import mongoose from "mongoose";

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  salary: { type: Number },
  location: { type: String },
  job_type: { type: String, enum: ['Full-time', 'Part-time', 'Contract', 'Internship'], required: true },
  openings: { type: Number, required: true },
  role: { type: String, required: true },
  work_location: { type: String, enum: ['On-site', 'Remote', 'Hybrid'], required: true },
  company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  posted_by_recuriter_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  is_active: { type: Boolean, default: true }
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

export const Job = mongoose.model("Job", jobSchema);

/*
 * ===========================================================================================
 *                              NOTES — user/src/models/Job.ts
 * ===========================================================================================
 *
 * PURPOSE: READ-ONLY copy of the Job model used by the User Service.
 * The User Service needs to read job data (title, is_active, company_id) when processing
 * applications, but it does NOT create or modify jobs — that's the Job Service's job.
 *
 * SCHEMA FIELDS:
 * - title, description: Job listing text
 * - salary: Number (annual, in ₹)
 * - location: City name (Delhi, Mumbai, Remote, etc.)
 * - job_type: Enum [Full-time, Part-time, Contract, Internship]
 * - openings: Number of available positions
 * - role: Department/role category
 * - work_location: Enum [On-site, Remote, Hybrid]
 * - company_id: ObjectId ref to Company
 * - posted_by_recuriter_id: ObjectId ref to User (the recruiter who posted)
 * - is_active: Boolean (open/closed status)
 *
 * WHY DUPLICATE?
 * → Each microservice maintains its own model definition. They share the same MongoDB,
 *   but each service independently defines the schema it needs.
 */
