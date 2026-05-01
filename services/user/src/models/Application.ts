import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema({
  job_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  applicant_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  applicant_email: { type: String, required: true },
  status: { type: String, enum: ['Submitted', 'Rejected', 'Hired'], default: 'Submitted' },
  resume: { type: String, required: true },
  subscribed: { type: Boolean }
}, { timestamps: { createdAt: 'applied_at', updatedAt: false } });

applicationSchema.index({ job_id: 1, applicant_id: 1 }, { unique: true });

export const Application = mongoose.model("Application", applicationSchema);

/*
 * ===========================================================================================
 *                              NOTES — user/src/models/Application.ts
 * ===========================================================================================
 *
 * PURPOSE: Mongoose model for the "applications" collection. Tracks job applications.
 *
 * SCHEMA FIELDS:
 * - job_id: ObjectId ref to Job → which job was applied to
 * - applicant_id: ObjectId ref to User → who applied
 * - applicant_email: String → for quick email access without populating User
 * - status: Enum ["Submitted", "Rejected", "Hired"] default "Submitted"
 * - resume: String → Cloudinary URL of the resume at time of application
 * - subscribed: Boolean → whether applicant had active subscription when applying
 * - applied_at: Auto-generated timestamp (aliased from createdAt)
 *
 * COMPOUND UNIQUE INDEX: { job_id: 1, applicant_id: 1 }
 * → Prevents a user from applying to the same job twice
 * → MongoDB error code 11000 is caught in the controller for user-friendly messaging
 *
 * STATUS WORKFLOW: Submitted → Hired or Rejected (updated by recruiter via Job Service)
 *
 * WHY STORE resume AS A SNAPSHOT?
 * → User might update their resume later. The application keeps the version used when applying.
 *
 * CONNECTIONS:
 * • controllers/user.ts → creates applications (applyForJob)
 * • Job Service controllers → reads/updates applications (status changes, email notifications)
 */
