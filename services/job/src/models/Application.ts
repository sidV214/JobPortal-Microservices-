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
