"use client";
import { useAppData } from "@/context/AppContext";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, FileText, CheckCircle, XCircle, Mail, Clock } from "lucide-react";
import Loading from "@/components/loading";
import { Card, CardContent } from "@/components/ui/card";

const ApplicantsPage = ({ params }: { params: Promise<{ id: string }> }) => {
  const unwrappedParams = React.use(params);
  const jobId = unwrappedParams.id;
  const { jobApplicants, fetchJobApplicants, updateApplicationStatus, loading } = useAppData();
  
  // Need to fetch when component mounts
  useEffect(() => {
    fetchJobApplicants(jobId);
  }, [jobId]);

  const handleStatusUpdate = async (appId: string, status: string) => {
    await updateApplicationStatus(appId, status);
    // Refresh applicants to show new status
    fetchJobApplicants(jobId);
  };

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <Link href="/recruiter/jobs" className="inline-flex items-center gap-2 text-slate-400 hover:text-indigo-400 transition-colors mb-4">
              <ArrowLeft size={16} /> Back to My Jobs
            </Link>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-100 flex items-center gap-3">
              <Users className="text-indigo-500" /> Job Applicants
            </h1>
            <p className="text-slate-400 mt-1">Review candidates and update their application status.</p>
          </div>
        </div>

        {jobApplicants.length === 0 ? (
          <div className="glass-panel rounded-2xl p-12 text-center flex flex-col items-center justify-center border border-slate-800">
            <Users size={48} className="text-slate-500 mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No applicants yet</h3>
            <p className="text-slate-400 max-w-md mx-auto">This job listing hasn't received any applications yet. Check back later.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobApplicants.map((app) => (
              <Card key={app._id} className="glass-panel border-slate-700/50 hover:border-indigo-500/30 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    
                    {/* Applicant Info */}
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                        <span className="text-lg font-bold text-slate-300">
                          {app.applicant_email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-bold text-slate-100 truncate max-w-[200px] sm:max-w-xs">{app.applicant_email}</h3>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium border ${
                            app.status === 'Hired' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                            app.status === 'Rejected' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 
                            'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          }`}>
                            {app.status}
                          </span>
                          {app.subscribed && (
                            <span className="px-2 py-0.5 rounded text-xs font-medium border bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
                              Premium
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-400">
                          <span className="flex items-center gap-1"><Mail size={14} /> Contact</span>
                          <span className="flex items-center gap-1"><Clock size={14} /> Applied {new Date(app.applied_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                      <Button asChild variant="outline" className="border-slate-700 hover:bg-slate-800 text-slate-300 flex-1 md:flex-none">
                        <a href={app.resume} target="_blank" rel="noreferrer" className="flex items-center gap-2">
                          <FileText size={16} /> View Resume
                        </a>
                      </Button>
                      
                      {app.status === 'Submitted' && (
                        <>
                          <Button 
                            onClick={() => handleStatusUpdate(app._id, 'Hired')}
                            className="bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-500/30 flex-1 md:flex-none"
                          >
                            <CheckCircle size={16} className="mr-2" /> Accept
                          </Button>
                          <Button 
                            onClick={() => handleStatusUpdate(app._id, 'Rejected')}
                            className="bg-rose-600/20 hover:bg-rose-600/40 text-rose-400 border border-rose-500/30 flex-1 md:flex-none"
                          >
                            <XCircle size={16} className="mr-2" /> Reject
                          </Button>
                        </>
                      )}
                    </div>
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

export default ApplicantsPage;
