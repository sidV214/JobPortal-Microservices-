import mongoose from "mongoose";

const companySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  website: { type: String, required: true },
  logo: { type: String, required: true },
  logo_public_id: { type: String, required: true },
  recruiter_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

export const Company = mongoose.model("Company", companySchema);

/*
 * ===========================================================================================
 *                              NOTES — user/src/models/Company.ts
 * ===========================================================================================
 *
 * PURPOSE: READ-ONLY copy of the Company model used by the User Service.
 * Used to fetch company name when sending application confirmation emails.
 *
 * SCHEMA FIELDS:
 * - name: Company name (unique, e.g., "Google", "Microsoft")
 * - description: Company description text
 * - website: Company website URL
 * - logo: Cloudinary URL of company logo image
 * - logo_public_id: Cloudinary public_id for logo management
 * - recruiter_id: ObjectId ref to User (the recruiter who owns this company)
 *
 * USAGE IN USER SERVICE:
 * → applyForJob() fetches Company.findById(job.company_id) to get the company name
 *   for the confirmation email template.
 */
