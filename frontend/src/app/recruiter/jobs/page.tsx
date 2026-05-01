"use client";
import { useAppData } from "@/context/AppContext";
import React, { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Briefcase, Plus, Users, MapPin, DollarSign, Calendar } from "lucide-react";
import Loading from "@/components/loading";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const RecruiterJobsPage = () => {
  const { recruiterJobs, fetchRecruiterJobs, loading } = useAppData();

  useEffect(() => {
    fetchRecruiterJobs();
  }, []);

  if (loading && recruiterJobs.length === 0) return <Loading />;

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-100">My Jobs</h1>
            <p className="text-slate-400 mt-1">Manage your job postings and review applications.</p>
          </div>
          <Button asChild className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
            <Link href="/recruiter/jobs/new">
              <Plus size={18} />
              Post a Job
            </Link>
          </Button>
        </div>

        {recruiterJobs.length === 0 ? (
          <div className="glass-panel rounded-2xl p-12 text-center flex flex-col items-center justify-center border border-slate-800">
            <Briefcase size={48} className="text-slate-500 mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No jobs posted yet</h3>
            <p className="text-slate-400 max-w-md mx-auto mb-6">You haven't posted any jobs. Create your first job posting to start receiving applications.</p>
            <Button asChild variant="outline" className="border-indigo-500/50 text-indigo-300 hover:bg-indigo-500/10">
              <Link href="/recruiter/jobs/new">Post a Job</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {recruiterJobs.map((job) => (
              <Card key={job.job_id} className="glass-panel-hover border-slate-700/50 hover:border-indigo-500/30 transition-all duration-300">
                <CardHeader className="pb-4 border-b border-slate-800/50">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl border border-slate-700 overflow-hidden bg-slate-900 shrink-0">
                        <img
                          src={job.company_logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(job.company_name)}&background=random&color=fff`}
                          alt={job.company_name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-100">{job.title}</h3>
                        <p className="text-sm text-indigo-400 font-medium">{job.company_name}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${job.is_active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                        {job.is_active ? 'Active' : 'Closed'}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-slate-500 font-medium uppercase tracking-wider flex items-center gap-1">
                        <MapPin size={12} /> Location
                      </span>
                      <span className="text-sm text-slate-300 truncate">{job.location || 'Not specified'}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-slate-500 font-medium uppercase tracking-wider flex items-center gap-1">
                        <DollarSign size={12} /> Salary
                      </span>
                      <span className="text-sm text-slate-300">
                        {job.salary ? `$${job.salary.toLocaleString()}` : 'Not disclosed'}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-slate-500 font-medium uppercase tracking-wider flex items-center gap-1">
                        <Briefcase size={12} /> Type
                      </span>
                      <span className="text-sm text-slate-300">{job.job_type}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-slate-500 font-medium uppercase tracking-wider flex items-center gap-1">
                        <Calendar size={12} /> Posted
                      </span>
                      <span className="text-sm text-slate-300">{new Date(job.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button asChild className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                      <Link href={`/recruiter/jobs/${job.job_id}/applicants`}>
                        <Users size={16} />
                        View Applicants
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="border-slate-700 hover:border-slate-500 bg-slate-800/50 hover:bg-slate-800 text-slate-300">
                      <Link href={`/jobs/${job.job_id}`}>
                        View Public
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecruiterJobsPage;
