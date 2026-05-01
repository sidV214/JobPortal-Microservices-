"use client";
import { auth_service, useAppData } from "@/context/AppContext";
import axios from "axios";
import { redirect } from "next/navigation";
import React, { FormEvent, useState } from "react";
import toast from "react-hot-toast";
import Cookies from "js-cookie";
import { Label } from "@/components/ui/label";
import { ArrowRight, Lock, Mail } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Loading from "@/components/loading";
import { GoogleLogin } from "@react-oauth/google";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [btnLoading, setBtnLoading] = useState(false);

  const { isAuth, setUser, loading, setIsAuth, fetchApplications } =
    useAppData();

  if (loading) return <Loading />;

  if (isAuth) return redirect("/");

  const submitHandler = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setBtnLoading(true);
    try {
      const { data } = await axios.post(`${auth_service}/api/auth/login`, {
        email,
        password,
      });

      toast.success(data.message);

      Cookies.set("token", data.token, {
        expires: 15,
        secure: false,
        path: "/",
      });
      setUser(data.userObject);
      setIsAuth(true);
      fetchApplications();
    } catch (error: any) {
      console.log(error);
      toast.error(error.response.data.message);
      setIsAuth(false);
    } finally {
      setBtnLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setBtnLoading(true);
    try {
      const { data } = await axios.post(`${auth_service}/api/auth/google`, {
        credential: credentialResponse.credential,
      });

      toast.success(data.message);

      Cookies.set("token", data.token, {
        expires: 15,
        secure: false,
        path: "/",
      });
      setUser(data.userObject);
      setIsAuth(true);
      fetchApplications();
    } catch (error: any) {
      console.log(error);
      toast.error(error?.response?.data?.message || "Google login failed");
      setIsAuth(false);
    } finally {
      setBtnLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 relative z-10">
          <h1 className="text-4xl font-extrabold mb-2 tracking-tight">
            Welcome back to JobNexus
          </h1>
          <p className="text-sm opacity-70">Sign in to continue your journey</p>
        </div>
        <div className="glass-panel rounded-3xl p-8 relative overflow-hidden">
          {/* Subtle glow inside the card */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl"></div>

          {/* Google Sign-In Button */}
          <div className="flex justify-center mb-5">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => toast.error("Google login failed")}
              theme="filled_black"
              shape="pill"
              size="large"
              width="100%"
              text="signin_with"
            />
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700/50"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-900 px-3 text-slate-400">
                Or continue with email
              </span>
            </div>
          </div>

          <form onSubmit={submitHandler} className="space-y-5">
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

            <div className="flex items-center justify-end">
              <Link
                href={"/forgot"}
                className="text-sm text-indigo-400 hover:text-indigo-300 hover:underline transition-all"
              >
                Forgot Password?
              </Link>
            </div>

            <Button disabled={btnLoading} className="w-full">
              {btnLoading ? "Signing in..." : "Sign In"}
              <ArrowRight size={18} />
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-700/50 relative z-10">
            <p className="text-center text-sm">
              Don't have an account?{" "}
              <Link
                href={"/register"}
                className="text-indigo-400 font-medium hover:text-indigo-300 hover:underline transition-all"
              >
                Create a new account?
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

/*
 * ===========================================================================================
 *                              NOTES — frontend/src/app/(auth)/login/page.tsx
 * ===========================================================================================
 *
 * PURPOSE: Login page with two authentication methods:
 * 1. Email + Password → POST /api/auth/login
 * 2. Google OAuth → POST /api/auth/google (via @react-oauth/google)
 *
 * STATE: email, password, btnLoading
 *
 * CONTEXT: useAppData() → { isAuth, loading, setUser, setIsAuth }
 *
 * LOGIN FLOW (Email/Password):
 * 1. User submits form → POST to auth_service/api/auth/login
 * 2. Server validates credentials → returns { token, user }
 * 3. Client stores token in cookie (Cookies.set("token"))
 * 4. Updates context: setUser(data.user), setIsAuth(true)
 * 5. Redirects to home page
 *
 * GOOGLE OAUTH FLOW:
 * 1. <GoogleLogin> renders a Google Sign-In button
 * 2. onSuccess callback receives { credential } (Google ID token)
 * 3. POST credential to auth_service/api/auth/google
 * 4. Server verifies with Google → returns { token, user }
 * 5. Same cookie/context flow as email login
 *
 * AUTH GUARD: If already logged in (isAuth), redirects to home via redirect("/")
 *
 * CONNECTIONS:
 * • Auth Service /api/auth/login → email/password authentication
 * • Auth Service /api/auth/google → Google OAuth verification
 * • AppContext → setUser, setIsAuth for global auth state
 */

