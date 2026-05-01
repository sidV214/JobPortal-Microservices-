import axios from "axios";
import { AuthenticatedRequest } from "../middlewares/auth.js";
import getBuffer from "../utils/buffer.js";
import { User } from "../models/User.js";
import { Job } from "../models/Job.js";
import { Application } from "../models/Application.js";
import { Company } from "../models/Company.js";
import ErrorHandler from "../utils/errorHandler.js";
import { TryCatch } from "../utils/TryCatch.js";
import { publishToTopic } from "../producer.js";
import { applicationConfirmationTemplate } from "../templete.js";

export const myProfile = TryCatch(
  async (req: AuthenticatedRequest, res, next) => {
    const user = req.user;
    res.json(user);
  }
);

export const getUserProfile = TryCatch(async (req, res, next) => {
  const { userId } = req.params;

  const user = await User.findById(userId).select("-password").lean();

  if (!user) {
    throw new ErrorHandler(404, "User not found");
  }

  res.json(user);
});

export const updateUserProfile = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    const user = req.user;

    if (!user) {
      throw new ErrorHandler(401, "Authentication required");
    }

    const { name, phoneNumber, bio } = req.body;

    const newName = name || user.name;
    const newPhoneNumber = phoneNumber || user.phone_number;
    const newBio = bio || user.bio;

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        name: newName,
        phone_number: newPhoneNumber,
        bio: newBio,
      },
      { new: true }
    ).select("-password");

    res.json({
      message: "Profile Updated successfully",
      updatedUser,
    });
  }
);

export const updateProfilePic = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    const user = req.user;

    if (!user) {
      throw new ErrorHandler(401, "Authentication required");
    }

    const file = req.file;

    if (!file) {
      throw new ErrorHandler(400, "No image file provided");
    }

    const oldPublicId = user.profile_pic_public_id;

    const fileBuffer = getBuffer(file);

    if (!fileBuffer || !fileBuffer.content) {
      throw new ErrorHandler(500, "failed to generate buffer");
    }

    const { data: uploadResult } = await axios.post(
      `${process.env.UPLOAD_SERVICE}/api/utils/upload`,
      {
        buffer: fileBuffer.content,
        public_id: oldPublicId,
        fileName: file.originalname,
        mimeType: file.mimetype,
      }
    );

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        profile_pic: uploadResult.url,
        profile_pic_public_id: uploadResult.public_id,
      },
      { new: true }
    ).select("-password");

    res.json({
      message: "profile pic updated",
      updatedUser,
    });
  }
);

export const updateResume = TryCatch(async (req: AuthenticatedRequest, res) => {
  const user = req.user;

  if (!user) {
    throw new ErrorHandler(401, "Authentication required");
  }

  const file = req.file;

  if (!file) {
    throw new ErrorHandler(400, "No pdf file provided");
  }

  if (file.mimetype !== "application/pdf") {
    throw new ErrorHandler(400, "Resume must be uploaded as a PDF file");
  }

  const oldPublicId = user.resume_public_id;

  const fileBuffer = getBuffer(file);

  if (!fileBuffer || !fileBuffer.content) {
    throw new ErrorHandler(500, "failed to generate buffer");
  }

  const { data: uploadResult } = await axios.post(
    `${process.env.UPLOAD_SERVICE}/api/utils/upload`,
    {
      buffer: fileBuffer.content,
      public_id: oldPublicId,
      fileName: file.originalname,
      mimeType: file.mimetype,
    }
  );

  const updatedUser = await User.findByIdAndUpdate(
    user._id,
    {
      resume: uploadResult.url,
      resume_public_id: uploadResult.public_id,
    },
    { new: true }
  ).select("-password");

  res.json({
    message: "Resume updated",
    updatedUser,
  });
});

export const addSkillToUser = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    const userId = req.user?._id;
    const { skillName } = req.body;

    if (!skillName || skillName.trim() === "") {
      throw new ErrorHandler(400, "Please provide a skill name");
    }

    const user = await User.findById(userId);

    if (!user) {
      throw new ErrorHandler(404, "User not found.");
    }

    const hasSkill = (user.skills as unknown as string[])?.includes(skillName.trim());

    if (hasSkill) {
      return res.status(200).json({
        message: "User already possesses this skill",
      });
    }

    await User.findByIdAndUpdate(userId, {
      $addToSet: { skills: skillName.trim() }
    });

    res.json({
      message: `Skill ${skillName.trim()} is added successfully`,
    });
  }
);

export const deleteSkillFromUser = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    const user = req.user;

    if (!user) {
      throw new ErrorHandler(401, "Authentication Required");
    }

    const { skillName } = req.body;

    if (!skillName || skillName.trim() === "") {
      throw new ErrorHandler(400, "Please provide a skill name");
    }

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { $pull: { skills: skillName.trim() } },
      { new: true }
    );

    if (!updatedUser) {
      throw new ErrorHandler(404, `User not found`);
    }

    res.json({
      message: `Skill ${skillName.trim()} was deleted successfully`,
    });
  }
);

export const applyForJob = TryCatch(async (req: AuthenticatedRequest, res) => {
  const user = req.user;

  if (!user) {
    throw new ErrorHandler(401, "Authentication required");
  }

  if (user.role !== "jobseeker") {
    throw new ErrorHandler(403, "Forbidden you are not allowed for this api");
  }

  const applicant_id = user._id;
  const resume = user.resume;

  if (!resume) {
    throw new ErrorHandler(
      400,
      "You need to add resume in your profile to apply for this job"
    );
  }

  const { job_id } = req.body;

  if (!job_id) {
    throw new ErrorHandler(400, "job id is required");
  }

  const job = await Job.findById(job_id);

  if (!job) {
    throw new ErrorHandler(404, "No jobs with this id");
  }

  if (!job.is_active) {
    throw new ErrorHandler(400, "Job is not active");
  }

  const now = Date.now();

  const subTime = req.user?.subscription
    ? new Date(req.user.subscription).getTime()
    : 0;

  const isSubscribed = subTime > now;

  let newApplication;

  try {
    newApplication = await Application.create({
      job_id,
      applicant_id,
      applicant_email: user.email,
      resume,
      subscribed: isSubscribed
    } as any);
  } catch (error: any) {
    if (error.code === 11000) {
      throw new ErrorHandler(409, "you have already applied to this job.");
    }
    throw error;
  }

  // Send confirmation email to applicant
  const company = await Company.findById(job.company_id);
  const companyName = String(company?.name || "the company");

  const emailMessage = {
    to: user.email,
    subject: `Application Confirmed - ${job.title} at ${companyName}`,
    html: applicationConfirmationTemplate(String(job.title), companyName),
  };

  publishToTopic("send-mail", emailMessage).catch((error) => {
    console.error("Failed to send application confirmation email", error);
  });

  res.json({
    message: "Applied for job successfully",
    application: newApplication,
  });
});

export const getAllaplications = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    const applications = await Application.find({ applicant_id: req.user?._id })
      .populate("job_id", "title salary location")
      .lean();

    const formattedApplications = applications.map((app: any) => ({
      ...app,
      job_title: app.job_id?.title,
      job_salary: app.job_id?.salary,
      job_location: app.job_id?.location,
      job_id: app.job_id?._id, // Replace populated object with just ID
    }));

    res.json(formattedApplications);
  }
);

export const withdrawApplication = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    const user = req.user;

    if (!user) {
      throw new ErrorHandler(401, "Authentication required");
    }

    if (user.role !== "jobseeker") {
      throw new ErrorHandler(403, "Forbidden: only jobseekers can withdraw applications");
    }

    const { applicationId } = req.params;

    const application = await Application.findById(applicationId);

    if (!application) {
      throw new ErrorHandler(404, "Application not found");
    }

    // Ensure the application belongs to this user
    if (application.applicant_id.toString() !== user._id.toString()) {
      throw new ErrorHandler(403, "You are not authorized to withdraw this application");
    }

    // Only allow withdrawal if still pending
    if (String(application.status) !== "Submitted") {
      throw new ErrorHandler(400, "Cannot withdraw an application that has already been reviewed");
    }

    await Application.findByIdAndDelete(applicationId);

    res.json({ message: "Application withdrawn successfully" });
  }
);

/*
 * ===========================================================================================
 *                              NOTES — user/src/controllers/user.ts
 * ===========================================================================================
 *
 * PURPOSE: Contains ALL business logic for the User Microservice. Manages user profiles,
 * skills, resume/profile picture uploads, job applications, and application history.
 * This is the largest controller in the project.
 *
 * ROLE IN ARCHITECTURE: Backend → User Service (Port 5002) → Controller Layer
 * Handles requests forwarded from routes/user.ts after auth middleware validation.
 *
 * IMPORTS EXPLAINED:
 * - axios → HTTP calls to Utils Service for Cloudinary uploads
 * - AuthenticatedRequest → Extended Express Request with req.user (from auth middleware)
 * - getBuffer → Converts multer file to base64 data URI
 * - User, Job, Application, Company → Mongoose models (same MongoDB database)
 * - ErrorHandler, TryCatch → Shared error handling utilities
 * - publishToTopic → Kafka producer for sending confirmation emails
 * - applicationConfirmationTemplate → HTML email template for job application confirmation
 *
 * ┌─────────────────────────────────────────────────────────────────────────────────────────┐
 * │ FUNCTION 1: myProfile — GET /api/user/me                                                │
 * ├─────────────────────────────────────────────────────────────────────────────────────────┤
 * │ Simply returns req.user (populated by isAuth middleware from JWT).                       │
 * │ This is the endpoint the frontend's AppContext calls on every page load to               │
 * │ check if the user is logged in and fetch their current profile data.                     │
 * └─────────────────────────────────────────────────────────────────────────────────────────┘
 *
 * ┌─────────────────────────────────────────────────────────────────────────────────────────┐
 * │ FUNCTION 2: getUserProfile — GET /api/user/:userId                                      │
 * ├─────────────────────────────────────────────────────────────────────────────────────────┤
 * │ Fetches any user's profile by their MongoDB _id.                                        │
 * │ - Uses .select("-password") to exclude the password hash                                │
 * │ - Uses .lean() for performance (returns plain JS object, not Mongoose document)         │
 * │ - Used by recruiters to view a jobseeker's profile from an application                  │
 * └─────────────────────────────────────────────────────────────────────────────────────────┘
 *
 * ┌─────────────────────────────────────────────────────────────────────────────────────────┐
 * │ FUNCTION 3: updateUserProfile — PUT /api/user/update                                    │
 * ├─────────────────────────────────────────────────────────────────────────────────────────┤
 * │ Updates name, phone_number, and bio for the authenticated user.                         │
 * │ - Falls back to existing values if new values aren't provided (||)                      │
 * │ - Uses findByIdAndUpdate with { new: true } to return the updated document              │
 * │ - Excludes password from the response                                                    │
 * └─────────────────────────────────────────────────────────────────────────────────────────┘
 *
 * ┌─────────────────────────────────────────────────────────────────────────────────────────┐
 * │ FUNCTION 4: updateProfilePic — PUT /api/user/update/pic                                 │
 * ├─────────────────────────────────────────────────────────────────────────────────────────┤
 * │ Uploads a new profile picture to Cloudinary via the Utils Service.                      │
 * │ DATA FLOW:                                                                               │
 * │ 1. Get the old profile_pic_public_id (to replace/delete the old image)                  │
 * │ 2. Convert multer file to base64 via getBuffer()                                        │
 * │ 3. POST to Utils Service with { buffer, public_id }                                     │
 * │    → If public_id provided, Cloudinary replaces the old image                           │
 * │ 4. Update user in MongoDB with new URL and public_id                                    │
 * │ 5. Return updated user object                                                            │
 * └─────────────────────────────────────────────────────────────────────────────────────────┘
 *
 * ┌─────────────────────────────────────────────────────────────────────────────────────────┐
 * │ FUNCTION 5: updateResume — PUT /api/user/update/resume                                  │
 * ├─────────────────────────────────────────────────────────────────────────────────────────┤
 * │ Same pattern as updateProfilePic but for PDF resumes.                                   │
 * │ - Validates file exists → converts to buffer → uploads to Cloudinary                    │
 * │ - Stores the Cloudinary URL in user.resume field                                        │
 * └─────────────────────────────────────────────────────────────────────────────────────────┘
 *
 * ┌─────────────────────────────────────────────────────────────────────────────────────────┐
 * │ FUNCTION 6: addSkillToUser — POST /api/user/add/skill                                   │
 * ├─────────────────────────────────────────────────────────────────────────────────────────┤
 * │ Adds a skill tag to the user's skills array.                                            │
 * │ - Validates skillName is not empty                                                       │
 * │ - Checks for duplicates manually before MongoDB operation                               │
 * │ - Uses MongoDB $addToSet operator (prevents duplicates at DB level too)                  │
 * │ - Trims whitespace from skill name                                                       │
 * └─────────────────────────────────────────────────────────────────────────────────────────┘
 *
 * ┌─────────────────────────────────────────────────────────────────────────────────────────┐
 * │ FUNCTION 7: deleteSkillFromUser — DELETE /api/user/remove/skill                         │
 * ├─────────────────────────────────────────────────────────────────────────────────────────┤
 * │ Removes a skill from the user's skills array.                                           │
 * │ - Uses MongoDB $pull operator to remove the matching skill string                       │
 * │ - { new: true } returns the updated document to verify the change                      │
 * └─────────────────────────────────────────────────────────────────────────────────────────┘
 *
 * ┌─────────────────────────────────────────────────────────────────────────────────────────┐
 * │ FUNCTION 8: applyForJob — POST /api/user/apply                                         │
 * ├─────────────────────────────────────────────────────────────────────────────────────────┤
 * │ THE MOST COMPLEX FUNCTION in this controller. Handles job applications.                 │
 * │                                                                                         │
 * │ STEP-BY-STEP DATA FLOW:                                                                 │
 * │ 1. Validate user is authenticated and has role "jobseeker"                              │
 * │ 2. Validate user has a resume uploaded (required to apply)                              │
 * │ 3. Validate job_id exists in request body                                               │
 * │ 4. Find the job in MongoDB → check it exists and is active                              │
 * │ 5. Check if user has an active subscription (subscription date > now)                   │
 * │    → subscribed applicants get priority display to recruiters                           │
 * │ 6. Create new Application document with job_id, applicant_id, email, resume             │
 * │ 7. Handle duplicate application error (MongoDB unique index, error.code 11000)          │
 * │ 8. Fetch company name for the email template                                            │
 * │ 9. Publish confirmation email to Kafka "send-mail" topic                                │
 * │    → Non-blocking (.catch() handles errors silently)                                    │
 * │ 10. Return success with the created application                                         │
 * │                                                                                         │
 * │ SUBSCRIPTION LOGIC:                                                                      │
 * │ - user.subscription is a Date (set by payment service after Razorpay checkout)          │
 * │ - If subscription date is in the future → isSubscribed = true                           │
 * │ - Subscribed applications appear first when recruiters view applicants                  │
 * │                                                                                         │
 * │ DUPLICATE PROTECTION: Application model has a compound unique index on                   │
 * │ { job_id, applicant_id }, so the same user can't apply twice to the same job.           │
 * │ Caught via MongoDB error code 11000 (duplicate key error).                              │
 * │                                                                                         │
 * │ EMAIL FLOW:                                                                              │
 * │ applyForJob → publishToTopic("send-mail") → Kafka → Utils consumer → Gmail SMTP        │
 * └─────────────────────────────────────────────────────────────────────────────────────────┘
 *
 * ┌─────────────────────────────────────────────────────────────────────────────────────────┐
 * │ FUNCTION 9: getAllaplications — GET /api/user/applications                               │
 * ├─────────────────────────────────────────────────────────────────────────────────────────┤
 * │ Fetches all job applications for the currently logged-in jobseeker.                     │
 * │ - Filters by applicant_id = req.user._id                                               │
 * │ - Uses .populate("job_id", "title salary location") to JOIN job data                   │
 * │ - Formats the response: flattens job_title, job_salary, job_location from populated     │
 * │   job object and replaces the populated job_id back to just the ObjectId                │
 * │ - .lean() for performance (plain objects instead of Mongoose documents)                  │
 * └─────────────────────────────────────────────────────────────────────────────────────────┘
 *
 * CONNECTIONS:
 * • routes/user.ts → maps endpoints to these functions
 * • middlewares/auth.ts → provides isAuth middleware that populates req.user
 * • models/* → User, Job, Application, Company for database operations
 * • producer.ts → Kafka producer for email notifications
 * • templete.ts → HTML email template for application confirmation
 * • Utils Service (:5001) → Cloudinary uploads via axios (Now passing fileName and mimeType for robust PDF handling)
 * • Frontend AppContext.tsx → calls these endpoints for profile management
 *
 * DESIGN PATTERNS:
 * 1. TryCatch HOF for error handling
 * 2. Optimistic file replacement (upload new, old public_id passed for Cloudinary overwrite)
 * 3. Defensive API Contract (sending explicit mimeType/fileName to the upload service avoids
 *    Cloudinary guessing errors, especially crucial for PDF resumes encountering ACL blocks).
 * 3. Defensive API Contract (sending explicit mimeType/fileName to the upload service avoids
 *    Cloudinary guessing errors, especially crucial for PDF resumes encountering ACL blocks).
 * 3. Event-driven email via Kafka (non-blocking)
 * 4. Mongoose populate for cross-collection joins
 *
 * INTERVIEW QUESTIONS:
 * 1. Why use $addToSet instead of $push for skills?
 *    → $addToSet prevents duplicates at the MongoDB level.
 * 2. How do you prevent a user from applying to the same job twice?
 *    → Compound unique index on { job_id, applicant_id } + error code 11000 handling.
 * 3. Why is the email sent via Kafka instead of inline?
 *    → Non-blocking. If SMTP fails, the application still succeeds.
 * 4. What does .lean() do in Mongoose?
 *    → Returns plain JS objects instead of Mongoose Documents. Faster, less memory.
 * 5. Why send old public_id when uploading a new profile pic?
 *    → To replace/delete the old image on Cloudinary (avoids orphaned files).
 * 6. How does the subscription priority work?
 *    → isSubscribed flag is stored on the application. Recruiters see subscribed apps first.
 */
