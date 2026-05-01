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
