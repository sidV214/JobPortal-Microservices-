import React, { ReactNode } from "react";

export interface JobOptions {
  title: string;
  responsibilities: string;
  why: string;
}

export interface SkillsToLearn {
  title: string;
  why: string;
  how: string;
}

export interface SkillCategory {
  category: string;
  skills: SkillsToLearn[];
}

export interface LearningApproach {
  title: string;
  points: string[];
}

export interface CareerGuideResponse {
  summary: string;
  jobOptions: JobOptions[];
  skillsToLearn: SkillCategory[];
  learningApproach: LearningApproach;
}

export interface ScoreBreakdown {
  formatting: { score: number; feedback: string };
  keywords: { score: number; feedback: string };
  structure: { score: number; feedback: string };
  readability: { score: number; feedback: string };
}

export interface Suggestion {
  category: string;
  issue: string;
  recommendation: string;
  priority: "high" | "medium" | "low";
}

export interface ResumeAnalysisResponse {
  atsScore: number;
  scoreBreakdown: ScoreBreakdown;
  suggestions: Suggestion[];
  strengths: string[];
  summary: string;
}

export interface User {
  user_id: number;
  name: string;
  email: string;
  phone_number: string;
  role: "jobseeker" | "recruiter";
  bio: string | null;
  resume: string | null;
  resume_public_id: string | null;
  profile_pic: string | null;
  profile_pic_public_id: string | null;
  skills: string[];
  subscription: string | null;
}

export interface AppContextType {
  user: User | null;
  loading: boolean;
  btnLoading: boolean;
  isAuth: boolean;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setIsAuth: React.Dispatch<React.SetStateAction<boolean>>;
  logoutUser: () => Promise<void>;
  updateProfilePic: (formData: any) => Promise<void>;
  updateResume: (formData: any) => Promise<void>;
  updateUser: (name: string, phoneNumber: string, bio: string) => Promise<void>;
  addSkill: (
    skill: string,
    setSkill: React.Dispatch<React.SetStateAction<string>>
  ) => Promise<void>;
  removeSkill: (skill: string) => Promise<void>;
  applyJob: (job_id: number) => Promise<void>;
  applications: Application[];
  fetchApplications: () => Promise<void>;
  recruiterCompanies: Company[];
  fetchRecruiterCompanies: () => Promise<void>;
  recruiterJobs: Job[];
  fetchRecruiterJobs: () => Promise<void>;
  createCompany: (formData: any) => Promise<void>;
  createJob: (data: any) => Promise<void>;
  jobApplicants: Application[];
  fetchJobApplicants: (jobId: string) => Promise<void>;
  updateApplicationStatus: (appId: string, status: string) => Promise<void>;
  myApplications: any[];
  fetchMyApplications: () => Promise<void>;
  withdrawApplication: (applicationId: string) => Promise<void>;
}

export interface AppProviderProps {
  children: ReactNode;
}

export interface AccontProps {
  user: User;
  isYourAccount: boolean;
}

export interface Job {
  job_id: number;
  title: string;
  description: string;
  salary: number | null;
  location: string | null;
  job_type: "Full-time" | "Part-time" | "Contract" | "Internship";
  openings: number;
  role: string;
  work_location: "On-site" | "Remote" | "Hybrid";
  company_id: number;
  company_name: string;
  company_logo: string;
  posted_by_recuriter_id: number;
  created_at: string;
  is_active: boolean;
}

export interface Company {
  _id: string;
  name: string;
  description: string;
  website: string;
  logo: string;
  logo_public_id: string;
  recruiter_id: number;
  created_at: string;
  jobs?: Job[];
}

type ApplicationStatus = "Submitted" | "Rejected" | "Hired";

export interface Application {
  _id: string;
  applicant_id: string;
  job_id: string;
  applicant_email: string;
  status: ApplicationStatus;
  resume: string;
  applied_at: string;
  subscribed: boolean;
  job_title: string;
  job_salary: number;
  job_location: string;
}

/*
 * ===========================================================================================
 *                              NOTES — frontend/src/type.ts
 * ===========================================================================================
 *
 * PURPOSE: Central TypeScript type definitions for the entire frontend.
 * All interfaces used by components, context, and pages are defined here.
 *
 * TYPE GROUPS:
 * 1. AI Feature Types: CareerGuideResponse, ResumeAnalysisResponse, JobOptions, etc.
 *    → Shape of data returned by Gemini AI endpoints
 * 2. User Types: User interface with all profile fields
 * 3. App Context Types: AppContextType (all context values/functions), AppProviderProps
 * 4. Business Types: Job, Company, Application — match MongoDB schema shapes
 * 5. UI Types: AccontProps — used by account page components
 *
 * CONNECTIONS: Imported by AppContext.tsx, pages, and components for type safety.
 */
