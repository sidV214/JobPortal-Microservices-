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
