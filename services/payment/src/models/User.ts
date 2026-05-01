import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone_number: { type: String, required: true },
  role: { type: String, enum: ["jobseeker", "recruiter"], required: true },
  bio: { type: String },
  resume: { type: String },
  resume_public_id: { type: String },
  profile_pic: { type: String },
  profile_pic_public_id: { type: String },
  subscription: { type: Date },
  skills: [{ type: String }],
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

export const User = mongoose.model("User", userSchema);
