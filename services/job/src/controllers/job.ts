import axios from "axios";
import { AuthenticatedRequest } from "../middlewares/auth.js";
import getBuffer from "../utils/buffer.js";
import { Company } from "../models/Company.js";
import { Job } from "../models/Job.js";
import { Application } from "../models/Application.js";
import ErrorHandler from "../utils/errorHandler.js";
import { TryCatch } from "../utils/TryCatch.js";
import { applicationStatusUpdateTemplate } from "../tempelete.js";
import { publishToTopic } from "../producer.js";

export const createCompany = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    const user = req.user;

    if (!user) {
      throw new ErrorHandler(401, "Authentication required");
    }

    if (user.role !== "recruiter") {
      throw new ErrorHandler(
        403,
        "Forbidden: Only recruiter can create a company"
      );
    }

    const { name, description, website } = req.body;

    if (!name || !description || !website) {
      throw new ErrorHandler(400, "All the fields required");
    }

    const existingCompany = await Company.findOne({ name });

    if (existingCompany) {
      throw new ErrorHandler(
        409,
        `A company with the name ${name} already exists`
      );
    }

    const file = req.file;

    if (!file) {
      throw new ErrorHandler(400, "Company Logo file is required");
    }

    const fileBuffer = getBuffer(file);

    if (!fileBuffer || !fileBuffer.content) {
      throw new ErrorHandler(500, "Failed to create file buffer");
    }

    const { data } = await axios.post(
      `${process.env.UPLOAD_SERVICE}/api/utils/upload`,
      {
        buffer: fileBuffer.content,
        fileName: file.originalname,
        mimeType: file.mimetype,
      }
    );

    const newCompany = await Company.create({
      name,
      description,
      website,
      logo: data.url,
      logo_public_id: data.public_id,
      recruiter_id: user._id,
    });

    res.json({
      message: "Company created successfully",
      company: newCompany,
    });
  }
);

export const deleteCompany = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    const user = req.user;
    const { companyId } = req.params;

    const company = await Company.findOne({
      _id: companyId,
      recruiter_id: user?._id,
    });

    if (!company) {
      throw new ErrorHandler(
        404,
        "Company not found or you're not authorized to delete it."
      );
    }

    await Company.deleteOne({ _id: companyId });
    // Note: To match CASCADE behavior, we should delete jobs too
    await Job.deleteMany({ company_id: companyId });

    res.json({
      message: "Company and all associated jobs have been deleted",
    });
  }
);

export const createJob = TryCatch(async (req: AuthenticatedRequest, res) => {
  const user = req.user;

  if (!user) {
    throw new ErrorHandler(401, "Authentication required");
  }

  if (user.role !== "recruiter") {
    throw new ErrorHandler(
      403,
      "Forbidden: Only recruiter can create a job"
    );
  }

  const {
    title,
    description,
    salary,
    location,
    role,
    job_type,
    work_location,
    company_id,
    openings,
  } = req.body;

  if (!title || !description || !salary || !location || !role || !openings) {
    throw new ErrorHandler(400, "All the fields required");
  }

  const company = await Company.findOne({
    _id: company_id,
    recruiter_id: user._id,
  });

  if (!company) {
    throw new ErrorHandler(404, "Company not found");
  }

  const newJob = await Job.create({
    title,
    description,
    salary,
    location,
    role,
    job_type,
    work_location,
    company_id,
    posted_by_recuriter_id: user._id,
    openings,
  });

  res.json({
    message: "Job posted successfully",
    job: newJob,
  });
});

export const updateJob = TryCatch(async (req: AuthenticatedRequest, res) => {
  const user = req.user;

  if (!user) {
    throw new ErrorHandler(401, "Authentication required");
  }

  if (user.role !== "recruiter") {
    throw new ErrorHandler(
      403,
      "Forbidden: Only recruiter can update a job"
    );
  }

  const {
    title,
    description,
    salary,
    location,
    role,
    job_type,
    work_location,
    openings,
    is_active,
  } = req.body;

  const existingJob = await Job.findById(req.params.jobId);

  if (!existingJob) {
    throw new ErrorHandler(404, "Job not found");
  }

  if (existingJob.posted_by_recuriter_id.toString() !== user._id.toString()) {
    throw new ErrorHandler(403, "Forbidden: You are not allowed");
  }

  const updatedJob = await Job.findByIdAndUpdate(
    req.params.jobId,
    {
      title,
      description,
      salary,
      location,
      role,
      job_type,
      work_location,
      openings,
      is_active,
    },
    { new: true }
  );

  res.json({
    message: "Job updated successfully",
    job: updatedJob,
  });
});

export const getAllCompany = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    const companies = await Company.find({ recruiter_id: req.user?._id });
    res.json(companies);
  }
);

export const getCompanyDetails = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;

    if (!id) {
      throw new ErrorHandler(400, "Company id is required");
    }

    const company = await Company.findById(id).lean();

    if (!company) {
      throw new ErrorHandler(404, "Company not found");
    }

    const jobs = await Job.find({ company_id: id }).lean();

    res.json({
      ...company,
      jobs: jobs || [],
    });
  }
);

export const getAllActiveJobs = TryCatch(async (req, res) => {
  const { title, location } = req.query as {
    title?: string;
    location?: string;
  };

  const query: any = { is_active: true };

  if (title) {
    query.title = { $regex: title, $options: "i" };
  }

  if (location) {
    query.location = { $regex: location, $options: "i" };
  }

  const jobs = await Job.find(query)
    .populate("company_id", "name logo _id")
    .sort("-created_at")
    .lean();

// Map to match the previous postgres output format (flattened)
  const formattedJobs = jobs.map((job: any) => ({
    job_id: job._id,
    title: job.title,
    description: job.description,
    salary: job.salary,
    location: job.location,
    job_type: job.job_type,
    role: job.role,
    work_location: job.work_location,
    created_at: job.created_at,
    company_name: job.company_id?.name,
    company_logo: job.company_id?.logo || job.company_id?.logo_url,
    company_id: job.company_id?._id,
    is_active: job.is_active,
  }));

  res.json(formattedJobs);
});

export const getRecruiterJobs = TryCatch(async (req: AuthenticatedRequest, res) => {
  const user = req.user;

  if (!user) {
    throw new ErrorHandler(401, "Authentication required");
  }

  if (user.role !== "recruiter") {
    throw new ErrorHandler(403, "Forbidden: Only recruiter can access this");
  }

  const jobs = await Job.find({ posted_by_recuriter_id: user._id })
    .populate("company_id", "name logo _id")
    .sort("-created_at")
    .lean();

  const formattedJobs = jobs.map((job: any) => ({
    job_id: job._id,
    title: job.title,
    description: job.description,
    salary: job.salary,
    location: job.location,
    job_type: job.job_type,
    role: job.role,
    work_location: job.work_location,
    created_at: job.created_at,
    company_name: job.company_id?.name,
    company_logo: job.company_id?.logo || job.company_id?.logo_url,
    company_id: job.company_id?._id,
    is_active: job.is_active,
  }));

  res.json(formattedJobs);
});


export const getSingleJob = TryCatch(async (req, res) => {
  const job = await Job.findById(req.params.jobId);
  res.json(job);
});

export const getAllApplicationForJob = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    const user = req.user;

    if (!user) {
      throw new ErrorHandler(401, "Authentication required");
    }

    if (user.role !== "recruiter") {
      throw new ErrorHandler(403, "Forbidden: Only recruiter can access this");
    }

    const { jobId } = req.params;

    const job = await Job.findById(jobId);

    if (!job) {
      throw new ErrorHandler(404, "job not found");
    }

    if (job.posted_by_recuriter_id.toString() !== user._id.toString()) {
      throw new ErrorHandler(403, "Forbidden you are not allowed");
    }

    const applications = await Application.find({ job_id: jobId }).sort({
      subscribed: -1,
      applied_at: 1,
    });

    res.json(applications);
  }
);

export const updateApplication = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    const user = req.user;

    if (!user) {
      throw new ErrorHandler(401, "Authentication required");
    }

    if (user.role !== "recruiter") {
      throw new ErrorHandler(403, "Forbidden: Only recruiter can access this");
    }

    const { id } = req.params;

    const application = await Application.findById(id);

    if (!application) {
      throw new ErrorHandler(404, "Application not found");
    }

    const job = await Job.findById(application.job_id);

    if (!job) {
      throw new ErrorHandler(404, "no job with this id");
    }

    if (job.posted_by_recuriter_id.toString() !== user._id.toString()) {
      throw new ErrorHandler(403, "Forbidden you are not allowed");
    }

    application.status = req.body.status;
    const updatedApplication = await application.save();

    const message = {
      to: application.applicant_email,
      subject: "Application Update - Job portal",
      html: applicationStatusUpdateTemplate(job.title as unknown as string),
    };

    publishToTopic("send-mail", message).catch((error) => {
      console.error("Failed to publish message to kafka", error);
    });

    res.json({
      message: "Application updated",
      job,
      updatedApplication,
    });
  }
);

/*
 * ===========================================================================================
 *                              NOTES — job/src/controllers/job.ts
 * ===========================================================================================
 *
 * PURPOSE: Contains ALL business logic for the Job Microservice. Manages companies, job postings,
 * job search, applications view (for recruiters), and application status updates with email alerts.
 *
 * ROLE IN ARCHITECTURE: Backend → Job Service (Port 5003) → Controller Layer
 *
 * ┌─────────────────────────────────────────────────────────────────────────────────────┐
 * │ FUNCTION 1: createCompany — POST /api/job/company/new                               │
 * │ Creates a new company profile with logo upload to Cloudinary.                       │
 * │ Only recruiters allowed. Validates unique company name.                              │
 * │ Data flow: multer → getBuffer → Utils Service (Cloudinary) → MongoDB create         │
 * └─────────────────────────────────────────────────────────────────────────────────────┘
 *
 * ┌─────────────────────────────────────────────────────────────────────────────────────┐
 * │ FUNCTION 2: deleteCompany — DELETE /api/job/company/:companyId                      │
 * │ Deletes a company AND all associated jobs (cascade delete).                         │
 * │ Validates ownership: recruiter_id must match the logged-in user.                    │
 * └─────────────────────────────────────────────────────────────────────────────────────┘
 *
 * ┌─────────────────────────────────────────────────────────────────────────────────────┐
 * │ FUNCTION 3: createJob — POST /api/job/new                                           │
 * │ Creates a new job posting under a company. Only recruiters who OWN the company.     │
 * │ Validates company ownership before creating the job.                                 │
 * └─────────────────────────────────────────────────────────────────────────────────────┘
 *
 * ┌─────────────────────────────────────────────────────────────────────────────────────┐
 * │ FUNCTION 4: updateJob — PUT /api/job/:jobId                                         │
 * │ Updates job details (title, salary, status, etc). Only the posting recruiter.       │
 * │ Double ownership check: finds job → verifies posted_by_recuriter_id matches user.   │
 * └─────────────────────────────────────────────────────────────────────────────────────┘
 *
 * ┌─────────────────────────────────────────────────────────────────────────────────────┐
 * │ FUNCTION 5: getAllCompany — GET /api/job/company/all                                 │
 * │ Returns all companies owned by the logged-in recruiter.                             │
 * └─────────────────────────────────────────────────────────────────────────────────────┘
 *
 * ┌─────────────────────────────────────────────────────────────────────────────────────┐
 * │ FUNCTION 6: getCompanyDetails — GET /api/job/company/:id                            │
 * │ Returns company details WITH all its job listings (manual join).                    │
 * │ Spreads company fields and appends jobs array. PUBLIC endpoint.                     │
 * └─────────────────────────────────────────────────────────────────────────────────────┘
 *
 * ┌─────────────────────────────────────────────────────────────────────────────────────┐
 * │ FUNCTION 7: getAllActiveJobs — GET /api/job/all                                      │
 * │ SEARCH ENDPOINT. Returns all active jobs with optional title/location filters.      │
 * │ Uses MongoDB $regex with "i" flag for case-insensitive search.                      │
 * │ Populates company_id to get company name and logo.                                  │
 * │ Sorts by newest first (-created_at).                                                │
 * │ Flattens output to match frontend's expected format.                                │
 * └─────────────────────────────────────────────────────────────────────────────────────┘
 *
 * ┌─────────────────────────────────────────────────────────────────────────────────────┐
 * │ FUNCTION 8: getAllApplicationForJob — GET /api/job/application/:jobId                │
 * │ Returns all applications for a specific job. Only the posting recruiter can access. │
 * │ SORT: subscribed: -1 (subscribed first), applied_at: 1 (earliest first).           │
 * │ → This gives premium (subscribed) applicants top visibility.                        │
 * └─────────────────────────────────────────────────────────────────────────────────────┘
 *
 * ┌─────────────────────────────────────────────────────────────────────────────────────┐
 * │ FUNCTION 9: updateApplication — PUT /api/job/application/update/:id                 │
 * │ Updates application status (Submitted → Hired/Rejected). Sends email notification. │
 * │ DATA FLOW:                                                                          │
 * │ 1. Find application → verify ownership via job's recruiter                         │
 * │ 2. Update status field → save to MongoDB                                           │
 * │ 3. Build status update email with applicationStatusUpdateTemplate()                │
 * │ 4. Publish to Kafka "send-mail" → Utils Service sends email via SMTP               │
 * └─────────────────────────────────────────────────────────────────────────────────────┘
 *
 * AUTHORIZATION PATTERN:
 * Every recruiter-only endpoint follows this pattern:
 * 1. Check user exists (auth middleware) → 401
 * 2. Check user.role === "recruiter" → 403
 * 3. Check ownership (recruiter_id/posted_by_recuriter_id matches user._id) → 403
 *
 * CONNECTIONS:
 * • routes/job.ts → maps endpoints to these functions
 * • models/* → Company, Job, Application for database operations
 * • tempelete.ts → HTML email template for status update emails
 * • producer.ts → Kafka producer for email notifications
 * • Utils Service → Cloudinary uploads (company logos)
 *
 * INTERVIEW QUESTIONS:
 * 1. How does the search work? → MongoDB $regex with case-insensitive flag on title/location.
 * 2. Why sort applications by subscribed:-1? → Premium users get top visibility. Monetization.
 * 3. Why cascade delete jobs when company is deleted? → Orphaned jobs with no company = broken data.
 * 4. Why populate company_id in getAllActiveJobs? → Frontend needs company name and logo on job cards.
 */
