"use client";
import { useAppData } from "@/context/AppContext";
import { Job } from "@/type";
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "./ui/card";
import {
  ArrowRight,
  Briefcase,
  Building2,
  CheckCircle,
  DollarSign,
  MapPin,
} from "lucide-react";
import Link from "next/link";
import { Button } from "./ui/button";
import toast from "react-hot-toast";

interface JobCardProps {
  job: Job;
}

const JobCard: React.FC<JobCardProps> = ({ job }) => {
  const { user, btnLoading, applyJob, applications, updateResume } = useAppData();

  const applyJobHandler = (id: number) => {
    applyJob(id);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        toast.error("Please upload a PDF file");
        return;
      }
      const formData = new FormData();
      formData.append("file", file);
      await updateResume(formData);
    }
  };

  const [applied, setApplied] = useState(false);

  useEffect(() => {
    if (applications && job.job_id) {
      const hasApplied = applications.some((item: any) => item.job_id === job.job_id);
      setApplied(hasApplied);
    } else {
      setApplied(false);
    }
  }, [applications, job.job_id]);

  return (
    <Card className="w-full max-w-[380px] glass-panel-hover hover:-translate-y-1 group">
      <CardHeader className="space-y-4 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold mb-2 line-clamp-2 group-hover:text-indigo-400 transition-colors">
              {job.title}
            </h3>
            <div className="flex items-center gap-2 text-sm opacity-70">
              <Building2 size={16} />
              <span>{job.company_name}</span>
            </div>
          </div>

          <Link href={`/company/${job.company_id}`} className="shrink-0">
            <div className="w-14 h-14 rounded-xl border border-slate-700 overflow-hidden hover:scale-105 transition-transform bg-slate-900">
              <img
                src={job.company_logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(job.company_name || 'C')}&background=random&color=fff&bold=true`}
                alt={job.company_name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(job.company_name || 'C')}&background=random&color=fff&bold=true`;
                }}
              />
            </div>
          </Link>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <MapPin size={14} />
              <span className="font-medium">{job.location}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-base font-semibold">
            <DollarSign size={18} className="text-emerald-500" />
            <span>₹ {job.salary} P.A</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-3 pt-4 border-t border-slate-700/50">
        <div className="flex w-full gap-2">
          <Link href={`/jobs/${job.job_id}`} className="flex-1">
            <Button variant={"outline"} className="w-full gap-2 group/btn">
              View Details{" "}
              <ArrowRight
                size={16}
                className="group-hover/btn:translate-x-1 transition-transform"
              />
            </Button>
          </Link>

          {user && user.role === "jobseeker" && (
            <>
              {applied ? (
                <div className="flex-1 flex items-center justify-center gap-2 text-emerald-400 font-medium text-sm bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
                  <CheckCircle size={15} />
                  Applied
                </div>
              ) : (
                <>
                  {job.is_active !== false && (
                    user?.resume ? (
                      <Button
                        disabled={btnLoading}
                        onClick={() => applyJobHandler(job.job_id)}
                        className="flex-1 gap-2"
                      >
                        <Briefcase size={16} />
                        Easy Apply
                      </Button>
                    ) : (
                      <div className="flex-1 relative">
                        <input
                          type="file"
                          title="Upload Resume"
                          className={`absolute inset-0 w-full h-full opacity-0 z-10 ${btnLoading ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                          accept="application/pdf"
                          onChange={handleFileChange}
                          disabled={btnLoading}
                        />
                        <Button
                          disabled={btnLoading}
                          className="w-full gap-2 pointer-events-none"
                        >
                          <Briefcase size={16} />
                          {btnLoading ? "Uploading..." : "Upload Resume"}
                        </Button>
                      </div>
                    )
                  )}
                </>
              )}
            </>
          )}
        </div>

        {job.is_active === false && (
          <div className="w-full text-center text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2 font-medium">
            Postion Closed
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default JobCard;

/*
 * ===========================================================================================
 *                              NOTES — frontend/src/components/job-card.tsx
 * ===========================================================================================
 *
 * PURPOSE: Reusable job listing card component used on the /jobs page and company pages.
 * Displays job title, company, salary, location, and apply/view buttons.
 *
 * PROPS: { job: Job } — a single job object from the API
 *
 * STATE: applied (boolean) — whether the user has already applied to this job
 *
 * CONTEXT: { user, btnLoading, applyJob, applications } from useAppData()
 *
 * APPLIED DETECTION:
 * useEffect checks if any item in user's applications array matches job.job_id.
 * If so, sets applied=true → shows green "Applied" badge instead of "Easy Apply" button.
 *
 * CONDITIONAL RENDERING:
 * - Not logged in / recruiter → no apply button (only "View Details")
 * - Jobseeker + not applied + is_active → "Easy Apply" button
 * - Jobseeker + applied → green "✓ Applied" badge
 * - is_active=false → "Position Closed" red banner
 *
 * COMPONENTS: Card, CardHeader, CardContent (shadcn/ui), Button, icons (lucide)
 *
 * CONNECTIONS:
 * • /jobs page → renders a grid of <JobCard /> components
 * • /company/[id] page → also renders JobCards
 * • AppContext → provides applyJob() and applications[]
 */
