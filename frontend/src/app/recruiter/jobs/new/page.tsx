"use client";
import React, { useState, useEffect } from "react";
import { useAppData } from "@/context/AppContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Briefcase, MapPin, DollarSign, Users } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const PostJobPage = () => {
  const { createJob, recruiterCompanies, fetchRecruiterCompanies, btnLoading } = useAppData();
  const router = useRouter();

  useEffect(() => {
    fetchRecruiterCompanies();
  }, []);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    salary: "",
    location: "",
    role: "",
    job_type: "",
    work_location: "",
    openings: "",
    company_id: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.company_id) {
      toast.error("Please select a company to post this job under.");
      return;
    }

    const payload = {
      ...formData,
      salary: formData.salary ? Number(formData.salary) : null,
      openings: formData.openings ? Number(formData.openings) : 1,
    };

    await createJob(payload);
    router.push("/recruiter/jobs");
  };

  if (recruiterCompanies.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-panel p-8 rounded-2xl max-w-md text-center border border-slate-700/50">
          <h2 className="text-xl font-bold mb-4">Create a Company First</h2>
          <p className="text-slate-400 mb-6">You must create at least one company profile before you can post a job.</p>
          <Button asChild className="w-full bg-indigo-600 hover:bg-indigo-700">
            <Link href="/recruiter/companies/new">Create Company</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
      <div className="w-full max-w-3xl">
        <div className="mb-8">
          <Link href="/recruiter/jobs" className="inline-flex items-center gap-2 text-slate-400 hover:text-indigo-400 transition-colors mb-6">
            <ArrowLeft size={16} /> Back to My Jobs
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-100">Post a New Job</h1>
          <p className="text-slate-400 mt-2">Create a detailed job listing to attract the best talent.</p>
        </div>

        <div className="glass-panel rounded-3xl p-8 border border-slate-700/50 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-indigo-500 to-purple-500"></div>
          
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Section 1: Basic Info */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold border-b border-slate-800 pb-2">Basic Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-medium">Job Title *</Label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input id="title" placeholder="e.g. Senior Frontend Developer" required className="pl-10 h-11 bg-slate-900/50 border-slate-700/50" value={formData.title} onChange={handleChange} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company_id" className="text-sm font-medium">Hiring Company *</Label>
                  <Select value={formData.company_id} onValueChange={(val) => handleSelectChange('company_id', val)} required>
                    <SelectTrigger className="w-full h-11 bg-slate-900/50 border-slate-700/50">
                      <SelectValue placeholder="Select a company" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700">
                      {recruiterCompanies.map(company => (
                        <SelectItem key={company._id} value={company._id}>{company.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">Job Description *</Label>
                <Textarea id="description" placeholder="Describe the responsibilities, requirements, and benefits..." required className="min-h-[150px] bg-slate-900/50 border-slate-700/50" value={formData.description} onChange={handleChange} />
              </div>
            </div>

            {/* Section 2: Details */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold border-b border-slate-800 pb-2">Job Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="job_type" className="text-sm font-medium">Job Type *</Label>
                  <Select value={formData.job_type} onValueChange={(val) => handleSelectChange('job_type', val)} required>
                    <SelectTrigger className="w-full h-11 bg-slate-900/50 border-slate-700/50">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700">
                      <SelectItem value="Full-time">Full-time</SelectItem>
                      <SelectItem value="Part-time">Part-time</SelectItem>
                      <SelectItem value="Contract">Contract</SelectItem>
                      <SelectItem value="Internship">Internship</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="work_location" className="text-sm font-medium">Work Location Type *</Label>
                  <Select value={formData.work_location} onValueChange={(val) => handleSelectChange('work_location', val)} required>
                    <SelectTrigger className="w-full h-11 bg-slate-900/50 border-slate-700/50">
                      <SelectValue placeholder="Select work location" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700">
                      <SelectItem value="On-site">On-site</SelectItem>
                      <SelectItem value="Remote">Remote</SelectItem>
                      <SelectItem value="Hybrid">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role" className="text-sm font-medium">Role / Department *</Label>
                  <Input id="role" placeholder="e.g. Engineering, Marketing" required className="h-11 bg-slate-900/50 border-slate-700/50" value={formData.role} onChange={handleChange} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location" className="text-sm font-medium">City Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input id="location" placeholder="e.g. New York, Remote" className="pl-10 h-11 bg-slate-900/50 border-slate-700/50" value={formData.location} onChange={handleChange} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="salary" className="text-sm font-medium">Annual Salary ($)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input id="salary" type="number" placeholder="e.g. 120000" min="0" className="pl-10 h-11 bg-slate-900/50 border-slate-700/50" value={formData.salary} onChange={handleChange} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="openings" className="text-sm font-medium">Number of Openings</Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input id="openings" type="number" placeholder="1" min="1" className="pl-10 h-11 bg-slate-900/50 border-slate-700/50" value={formData.openings} onChange={handleChange} />
                  </div>
                </div>
              </div>
            </div>

            <Button disabled={btnLoading} className="w-full h-11 text-base bg-indigo-600 hover:bg-indigo-700 mt-8">
              {btnLoading ? "Posting Job..." : "Post Job Listing"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PostJobPage;
