"use client";
import React, { useEffect } from "react";
import { useAppData } from "@/context/AppContext";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Briefcase, MapPin, DollarSign, Calendar, ArrowRight, Clock, CheckCircle, XCircle } from "lucide-react";
import Loading from "@/components/loading";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const MyApplicationsPage = () => {
  const { myApplications, fetchMyApplications, withdrawApplication, loading, user } = useAppData();

  useEffect(() => {
    fetchMyApplications();
  }, []);

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-100">My Applications</h1>
          <p className="text-slate-400 mt-2">Track the status of your job applications.</p>
        </div>

        {myApplications.length === 0 ? (
          <div className="glass-panel rounded-2xl p-12 text-center flex flex-col items-center justify-center border border-slate-800">
            <Briefcase size={48} className="text-slate-500 mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No applications yet</h3>
            <p className="text-slate-400 max-w-md mx-auto mb-6">You haven't applied to any jobs yet. Start exploring opportunities to advance your career.</p>
            <Button asChild className="bg-indigo-600 hover:bg-indigo-700">
              <Link href="/jobs">Browse Jobs</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {myApplications.map((app) => (
              <Card key={app._id} className="glass-panel-hover border-slate-700/50 hover:border-indigo-500/30 transition-all duration-300">
                <CardHeader className="pb-4 border-b border-slate-800/50">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl border border-slate-700 overflow-hidden bg-slate-900 flex items-center justify-center shrink-0">
                        <Briefcase className="text-slate-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-100">{app.job_title || "Job Title Unavailable"}</h3>
                      </div>
                    </div>
                    <div>
                      {app.status === 'Hired' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle size={14} /> Accepted
                        </span>
                      )}
                      {app.status === 'Rejected' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          <XCircle size={14} /> Rejected
                        </span>
                      )}
                      {app.status === 'Submitted' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <Clock size={14} /> Pending Review
                        </span>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm text-slate-400">
                    <span className="flex items-center gap-1">
                      <MapPin size={14} /> {app.job_location || "Remote"}
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign size={14} /> {app.job_salary ? `$${app.job_salary.toLocaleString()}` : "Not Disclosed"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={14} /> Applied on {new Date(app.applied_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                    {app.status === 'Submitted' && (
                      <Button 
                        variant="ghost" 
                        onClick={() => withdrawApplication(app._id)}
                        className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20"
                      >
                        Withdraw
                      </Button>
                    )}
                    
                    {app.job_id && (
                      <Button asChild variant="outline" className="flex-1 sm:flex-none border-slate-700 hover:border-indigo-500/50 hover:bg-slate-800 text-slate-300">
                        <Link href={`/jobs/${app.job_id}`} className="flex items-center gap-2">
                          View Job Listing <ArrowRight size={14} />
                        </Link>
                      </Button>
                    )}
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

export default MyApplicationsPage;
