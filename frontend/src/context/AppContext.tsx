"use client";

import { AppContextType, Application, AppProviderProps, User, Company, Job } from "@/type";
import React, { createContext, useContext, useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import Cookies from "js-cookie";
import axios from "axios";

export const utils_service = "http://localhost:5001";
export const auth_service = "http://localhost:5000";
export const user_service = "http://localhost:5002";
export const job_service = "http://localhost:5003";
export const payment_service = "http://localhost:5004";

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(true);
  const [btnLoading, setBtnLoading] = useState(false);

  const token = Cookies.get("token");

  async function fetchUser() {
    try {
      const { data } = await axios.get(`${user_service}/api/user/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setUser(data);
      setIsAuth(true);
    } catch (error) {
      console.log(error);
      setIsAuth(false);
    } finally {
      setLoading(false);
    }
  }

  async function updateProfilePic(fromData: any) {
    setLoading(true);
    try {
      const { data } = await axios.put(
        `${user_service}/api/user/update/pic`,
        fromData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success(data.message);
      fetchUser();
    } catch (error: any) {
      toast.error(error.response.data.message);
    } finally {
      setLoading(false);
    }
  }

  async function updateResume(fromData: any) {
    setLoading(true);
    try {
      const { data } = await axios.put(
        `${user_service}/api/user/update/resume`,
        fromData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success(data.message);
      fetchUser();
    } catch (error: any) {
      toast.error(error.response.data.message);
    } finally {
      setLoading(false);
    }
  }

  async function updateUser(name: string, phoneNumber: string, bio: string) {
    setBtnLoading(true);
    try {
      const { data } = await axios.put(
        `${user_service}/api/user/update/profile`,
        { name, phoneNumber, bio },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast.success(data.message);
      fetchUser();
    } catch (error: any) {
      toast.error(error.response.data.message);
    } finally {
      setBtnLoading(false);
    }
  }

  async function logoutUser() {
    Cookies.set("token", "");
    setUser(null);
    setIsAuth(false);
    setApplications([]);
    toast.success("Logged out successfully");
  }

  async function addSkill(
    skill: string,
    setSkill: React.Dispatch<React.SetStateAction<string>>
  ) {
    setBtnLoading(true);
    try {
      const { data } = await axios.post(
        `${user_service}/api/user/skill/add`,
        { skillName: skill },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast.success(data.message);
      setSkill("");
      fetchUser();
    } catch (error: any) {
      toast.error(error.response.data.message);
    } finally {
      setBtnLoading(false);
    }
  }

  async function removeSkill(skill: string) {
    try {
      const { data } = await axios.put(
        `${user_service}/api/user/skill/delete`,
        { skillName: skill },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast.success(data.message);
      fetchUser();
    } catch (error: any) {
      toast.error(error.response.data.message);
    }
  }

  async function applyJob(job_id: number) {
    setBtnLoading(true);
    try {
      const { data } = await axios.post(
        `${user_service}/api/user/apply/job`,
        { job_id },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success(data.message);
      fetchApplications();
    } catch (error: any) {
      toast.error(error.response.data.message);
    } finally {
      setBtnLoading(false);
    }
  }

  const [applications, setApplications] = useState<Application[]>([]);

  async function fetchApplications() {
    try {
      const { data } = await axios.get(
        `${user_service}/api/user/application/all`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setApplications(data);
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    fetchUser();
    fetchApplications();
    fetchRecruiterCompanies();
  }, []);

  const [recruiterCompanies, setRecruiterCompanies] = useState<Company[]>([]);
  const [recruiterJobs, setRecruiterJobs] = useState<Job[]>([]);
  const [jobApplicants, setJobApplicants] = useState<Application[]>([]);
  const [myApplications, setMyApplications] = useState<any[]>([]);

  async function fetchRecruiterCompanies() {
    if (!token) return;
    try {
      const { data } = await axios.get(`${job_service}/api/job/company/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRecruiterCompanies(data);
    } catch (error) {
      console.log(error);
    }
  }

  async function fetchRecruiterJobs() {
    if (!token) return;
    try {
      const { data } = await axios.get(`${job_service}/api/job/recruiter/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRecruiterJobs(data);
    } catch (error) {
      console.log(error);
    }
  }

  async function createCompany(formData: any) {
    setBtnLoading(true);
    try {
      const { data } = await axios.post(`${job_service}/api/job/company/new`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success(data.message);
      fetchRecruiterCompanies();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error creating company");
    } finally {
      setBtnLoading(false);
    }
  }

  async function createJob(dataObj: any) {
    setBtnLoading(true);
    try {
      const { data } = await axios.post(`${job_service}/api/job/new`, dataObj, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success(data.message);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error posting job");
    } finally {
      setBtnLoading(false);
    }
  }

  async function fetchJobApplicants(jobId: string) {
    if (!token) return;
    try {
      const { data } = await axios.get(`${job_service}/api/job/application/${jobId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setJobApplicants(data);
    } catch (error) {
      console.log(error);
    }
  }

  async function fetchMyApplications() {
    if (!token) return;
    try {
      const { data } = await axios.get(`${user_service}/api/user/application/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMyApplications(data);
    } catch (error) {
      console.log(error);
    }
  }

  async function withdrawApplication(applicationId: string) {
    if (!token) return;
    try {
      await axios.delete(`${user_service}/api/user/application/withdraw/${applicationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchMyApplications();
    } catch (error) {
      console.log(error);
    }
  }

  async function updateApplicationStatus(appId: string, status: string) {
    if (!token) return;
    try {
      const { data } = await axios.put(`${job_service}/api/job/application/update/${appId}`, { status }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success(data.message);
      // Optionally update local state without refetching if performance needed, 
      // but usually the page will refetch on mount anyway.
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error updating status");
    } finally {
      setBtnLoading(false);
    }
  }

  return (
    <AppContext.Provider
      value={{
        user,
        loading,
        btnLoading,
        setUser,
        isAuth,
        setIsAuth,
        setLoading,
        logoutUser,
        updateProfilePic,
        updateResume,
        updateUser,
        addSkill,
        removeSkill,
        applyJob,
        applications,
        fetchApplications,
        recruiterCompanies,
        fetchRecruiterCompanies,
        recruiterJobs,
        fetchRecruiterJobs,
        createCompany,
        createJob,
        jobApplicants,
        fetchJobApplicants,
        updateApplicationStatus,
        myApplications,
        fetchMyApplications,
        withdrawApplication,
      }}
    >
      {children}
      <Toaster />
    </AppContext.Provider>
  );
};

export const useAppData = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppData must be used within AppProvider");
  }
  return context;
};

/*
 * ===========================================================================================
 *                              NOTES — frontend/src/context/AppContext.tsx
 * ===========================================================================================
 *
 * PURPOSE: Global state management for the entire JobNexus frontend using React Context API.
 * This is the SINGLE SOURCE OF TRUTH for user state, authentication, and shared API functions.
 * Every component in the app can access this context via the useAppData() hook.
 *
 * ROLE IN ARCHITECTURE: Frontend → State Management Layer
 *
 * SERVICE URL CONSTANTS:
 * - utils_service: http://localhost:5001 → Cloudinary uploads, AI features
 * - auth_service: http://localhost:5000 → Login, register, forgot password
 * - user_service: http://localhost:5002 → Profile, skills, applications
 * - job_service: http://localhost:5003 → Job listings, companies
 * - payment_service: http://localhost:5004 → Razorpay subscription
 *
 * STATE VARIABLES:
 * - user (User | null) → Current logged-in user's data
 * - isAuth (boolean) → Whether user is authenticated
 * - loading (boolean) → Global loading spinner state
 * - btnLoading (boolean) → Button-specific loading state (prevents double-clicks)
 * - applications (Application[]) → User's job application history
 *
 * TOKEN MANAGEMENT:
 * - JWT is stored in cookies via js-cookie (Cookies.get("token"))
 * - Sent as Authorization: Bearer header on every API call
 * - Set during login/register (in auth pages), cleared during logout
 *
 * FUNCTIONS:
 * 1. fetchUser() → GET /api/user/me → hydrates user state on mount
 * 2. updateProfilePic(formData) → PUT /api/user/update/pic → uploads profile picture
 * 3. updateResume(formData) → PUT /api/user/update/resume → uploads resume PDF
 * 4. updateUser(name, phoneNumber, bio) → PUT /api/user/update/profile → edits profile
 * 5. logoutUser() → Clears cookie + resets state (no API call needed, stateless JWT)
 * 6. addSkill(skill, setSkill) → POST /api/user/skill/add → adds skill tag
 * 7. removeSkill(skill) → PUT /api/user/skill/delete → removes skill tag
 * 8. applyJob(job_id) → POST /api/user/apply/job → submits job application
 * 9. fetchApplications() → GET /api/user/application/all → loads application history
 *
 * LIFECYCLE: useEffect on mount → fetchUser() + fetchApplications()
 * → Runs ONCE when the app loads to check if user is logged in
 *
 * PATTERN: React Context + Provider + custom hook (useAppData)
 * - AppProvider wraps the entire app in layout.tsx
 * - useAppData() hook provides typed access to all context values
 * - Throws error if used outside AppProvider (developer safety)
 *
 * ERROR HANDLING: All API functions show toast notifications on success/error.
 * After successful mutations, fetchUser() is called to re-sync state with server.
 *
 * CONNECTIONS:
 * • layout.tsx → wraps children in <AppProvider>
 * • Every page/component → uses useAppData() hook
 * • All backend services → called via axios with Bearer token
 * • type.ts → provides TypeScript types for User, Application, AppContextType
 *
 * INTERVIEW QUESTIONS:
 * 1. Why Context API instead of Redux?
 *    → Simpler for this scale. No external dependency, less boilerplate.
 * 2. Why store JWT in cookies instead of localStorage?
 *    → Cookies persist across tabs and are easier to clear. Both are vulnerable to XSS.
 * 3. Why call fetchUser() after every mutation?
 *    → To ensure UI always reflects server state (source of truth pattern).
 * 4. Why separate loading and btnLoading?
 *    → loading = full-page spinner, btnLoading = submit button spinner (UX).
 */
