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

/*
 * ===========================================================================================
 *                              NOTES — auth/src/models/User.ts
 * ===========================================================================================
 *
 * PURPOSE: Defines the Mongoose schema and model for the "users" collection in MongoDB.
 * This is the single source of truth for user data structure across the Auth Service.
 *
 * ROLE IN ARCHITECTURE: Backend → Auth Service → Data/Model Layer
 * This model is DUPLICATED across services (auth, user, job, payment) because each
 * microservice has its own copy of the model to read/write from the SAME MongoDB database.
 *
 * SCHEMA FIELDS:
 * ┌────────────────────────┬──────────┬──────────┬────────────────────────────────────────┐
 * │ Field                  │ Type     │ Required │ Purpose                                │
 * ├────────────────────────┼──────────┼──────────┼────────────────────────────────────────┤
 * │ name                   │ String   │ Yes      │ User's full name                       │
 * │ email                  │ String   │ Yes      │ Login identifier (unique index)         │
 * │ password               │ String   │ Yes      │ bcrypt hashed password                 │
 * │ phone_number           │ String   │ Yes      │ Contact number                         │
 * │ role                   │ String   │ Yes      │ "jobseeker" or "recruiter" (enum)       │
 * │ bio                    │ String   │ No       │ Jobseeker's profile bio                │
 * │ resume                 │ String   │ No       │ Cloudinary URL of resume PDF           │
 * │ resume_public_id       │ String   │ No       │ Cloudinary public_id for deletion      │
 * │ profile_pic            │ String   │ No       │ Cloudinary URL of profile image        │
 * │ profile_pic_public_id  │ String   │ No       │ Cloudinary public_id for deletion      │
 * │ subscription           │ Date     │ No       │ Subscription expiry date (Razorpay)    │
 * │ skills                 │ [String] │ No       │ Array of skill tags for jobseekers     │
 * │ created_at             │ Date     │ Auto     │ Mongoose timestamp (createdAt alias)   │
 * └────────────────────────┴──────────┴──────────┴────────────────────────────────────────┘
 *
 * TIMESTAMPS: { createdAt: 'created_at', updatedAt: false }
 * → Only tracks creation time, not updates. Field is aliased to created_at (snake_case).
 *
 * UNIQUE INDEX: email field has unique: true → MongoDB creates an index automatically.
 * This prevents duplicate registrations and speeds up email-based lookups.
 *
 * DESIGN DECISIONS:
 * - role is an enum ["jobseeker", "recruiter"] → enforced at DB level
 * - password is stored as bcrypt hash (never plaintext)
 * - resume & profile_pic store Cloudinary URLs (not file paths)
 * - public_id fields exist so files can be deleted from Cloudinary when updated
 * - subscription is a Date — if null or past, user is not subscribed
 *
 * CONNECTIONS: Used by controllers/auth.ts for CRUD operations on user data.
 *
 * INTERVIEW QUESTIONS:
 * 1. Why is the User model duplicated across services?
 *    → Each microservice operates independently. Sharing models would create coupling.
 * 2. Why store resume as a URL instead of the actual file?
 *    → Files are stored in Cloudinary (CDN). DB stores the URL for retrieval.
 * 3. Why use enum for role? → Prevents invalid roles at the database level.
 * 4. Why snake_case for created_at? → Consistent with the rest of the API response format.
 */
