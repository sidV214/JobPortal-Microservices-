"use client";
import React, { useState } from "react";
import { useAppData } from "@/context/AppContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Building2, Globe, Link as LinkIcon, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

const CreateCompanyPage = () => {
  const { createCompany, btnLoading } = useAppData();
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [logo, setLogo] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !description || !website || !logo) {
      toast.error("Please fill all fields and upload a logo");
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    formData.append("website", website);
    formData.append("file", logo);

    await createCompany(formData);
    router.push("/recruiter/companies");
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
      <div className="w-full max-w-2xl">
        <div className="mb-8">
          <Link href="/recruiter/companies" className="inline-flex items-center gap-2 text-slate-400 hover:text-indigo-400 transition-colors mb-6">
            <ArrowLeft size={16} /> Back to Companies
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-100">Create a New Company</h1>
          <p className="text-slate-400 mt-2">Set up your company profile to start posting jobs.</p>
        </div>

        <div className="glass-panel rounded-3xl p-8 border border-slate-700/50 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-indigo-500 to-purple-500"></div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">Company Name</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="name"
                  placeholder="e.g. Google, Stripe, Local Startup"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="pl-10 h-11 bg-slate-900/50 border-slate-700/50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website" className="text-sm font-medium">Website URL</Label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="website"
                  type="url"
                  placeholder="https://example.com"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  required
                  className="pl-10 h-11 bg-slate-900/50 border-slate-700/50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">Company Description</Label>
              <Textarea
                id="description"
                placeholder="What does your company do? What is your mission?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="min-h-[120px] bg-slate-900/50 border-slate-700/50 resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo" className="text-sm font-medium">Company Logo (Image)</Label>
              <div className="relative">
                <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="logo"
                  type="file"
                  accept="image/*"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    if (e.target.files && e.target.files[0]) {
                      setLogo(e.target.files[0]);
                    }
                  }}
                  required
                  className="pl-10 h-11 bg-slate-900/50 border-slate-700/50 cursor-pointer file:text-indigo-400 file:mr-4 file:bg-transparent file:border-0"
                />
              </div>
            </div>

            <Button disabled={btnLoading} className="w-full h-11 text-base bg-indigo-600 hover:bg-indigo-700 mt-4">
              {btnLoading ? "Creating Company..." : "Create Company"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateCompanyPage;
