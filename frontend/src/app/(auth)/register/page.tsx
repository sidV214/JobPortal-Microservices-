"use client";
import { auth_service, useAppData } from "@/context/AppContext";
import axios from "axios";
import { redirect } from "next/navigation";
import React, { FormEvent, useState } from "react";
import toast from "react-hot-toast";
import Cookies from "js-cookie";
import { Label } from "@/components/ui/label";
import { ArrowRight, Briefcase, Lock, Mail } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Loading from "@/components/loading";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const RegisterPage = () => {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [bio, setBio] = useState("");
  const [resume, setResume] = useState<File | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [btnLoading, setBtnLoading] = useState(false);

  const { isAuth, setUser, loading, setIsAuth } = useAppData();

  if (loading) return <Loading />;

  if (isAuth) return redirect("/");

  const submitHandler = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setBtnLoading(true);
    const formData = new FormData();

    formData.append("role", role);
    formData.append("name", name);
    formData.append("email", email);
    formData.append("password", password);
    formData.append("phoneNumber", phoneNumber);

    if (role === "jobseeker") {
      formData.append("bio", bio);
      if (resume) {
        formData.append("file", resume);
      }
    }
    try {
      const { data } = await axios.post(
        `${auth_service}/api/auth/register`,
        formData
      );

      toast.success(data.message);

      Cookies.set("token", data.token, {
        expires: 15,
        secure: false,
        path: "/",
      });
      setUser(data.registeredUser);
      setIsAuth(true);
    } catch (error: any) {
      toast.error(error.response.data.message);
      setIsAuth(false);
    } finally {
      setBtnLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 relative z-10">
          <h1 className="text-4xl font-extrabold mb-2 tracking-tight">Join JobNexus</h1>
          <p className="text-sm opacity-70">
            Create your account to start a new journey
          </p>
        </div>
        <div className="glass-panel rounded-3xl p-8 relative overflow-hidden">
          {/* Subtle glow inside the card */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-500/10 rounded-full blur-2xl"></div>
          <form onSubmit={submitHandler} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="role" className="text-sm font-medium">
                I want to
              </Label>
              <div className="relative">
                <Briefcase className="icon-style" />
                <Select value={role} onValueChange={setRole} required>
                  <SelectTrigger className="w-full h-11 pl-10 pr-4 border border-slate-700/50 rounded-lg bg-slate-900/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm text-slate-200">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900/95 backdrop-blur-md border-slate-700/50 text-slate-200">
                    <SelectItem value="jobseeker" className="focus:bg-indigo-500/20 focus:text-indigo-300 cursor-pointer">Find a Job</SelectItem>
                    <SelectItem value="recruiter" className="focus:bg-indigo-500/20 focus:text-indigo-300 cursor-pointer">Hire Talent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {role && (
              <div className="space-y-5 animate-in fade-in duration-300">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Full Name
                  </Label>
                  <div className="relative">
                    <Mail className="icon-style" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="pl-10 h-11"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="icon-style" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="pl-10 h-11"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="icon-style" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="********"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="pl-10 h-11"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">
                    Phone Number
                  </Label>
                  <div className="relative">
                    <Lock className="icon-style" />
                    <Input
                      id="phone"
                      type="number"
                      placeholder="+91 1234567890"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      required
                      className="pl-10 h-11"
                    />
                  </div>
                </div>

                {role === "jobseeker" && (
                  <div className="space-y-5 pt-4 border-t border-slate-700/50">
                    <div className="space-y-2">
                      <Label htmlFor="resume" className="text-sm font-medium">
                        Resume (PDF)
                      </Label>
                      <div className="relative">
                        <Lock className="icon-style" />
                        <Input
                          id="resume"
                          type="file"
                          accept="application/pdf"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setResume(e.target.files[0]);
                            }
                          }}
                          className="h-11 cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio" className="text-sm font-medium">
                        Bio
                      </Label>
                      <div className="relative">
                        <Lock className="icon-style" />
                        <Input
                          id="bio"
                          type="text"
                          placeholder="Tell us about yourself..."
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          required
                          className="pl-10 h-11"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <Button disabled={btnLoading} className="w-full">
                  {btnLoading ? "Please Wait..." : "Register"}
                  <ArrowRight size={18} />
                </Button>
              </div>
            )}
          </form>

          <div className="mt-6 pt-6 border-t border-slate-700/50 relative z-10">
            <p className="text-center text-sm">
              Already have an account{" "}
              <Link
                href={"/login"}
                className="text-indigo-400 font-medium hover:text-indigo-300 hover:underline transition-all"
              >
                Login?
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;

/*
 * ===========================================================================================
 *                              NOTES — frontend/src/app/(auth)/register/page.tsx
 * ===========================================================================================
 *
 * PURPOSE: Registration page for new users. Supports both jobseeker and recruiter roles.
 *
 * FORM FIELDS: name, email, password, phone_number, role (select), resume file (jobseeker only)
 *
 * DATA FLOW:
 * 1. User fills form → creates FormData object (multipart for file upload)
 * 2. POST to auth_service/api/auth/register (with multipart/form-data)
 * 3. Server creates user, uploads resume to Cloudinary → returns { token, user, message }
 * 4. Client stores token in cookie, updates context, redirects to home
 *
 * ROLE TOGGLE: Radio buttons or select for "jobseeker" vs "recruiter".
 * If jobseeker is selected, resume upload field appears.
 *
 * AUTH GUARD: If already logged in, redirects to home.
 *
 * CONNECTIONS:
 * • Auth Service /api/auth/register → handles registration
 * • AppContext → setUser, setIsAuth for auth state
 */
