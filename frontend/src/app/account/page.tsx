"use client";
import Loading from "@/components/loading";
import { useAppData } from "@/context/AppContext";
import React, { useEffect } from "react";
import Info from "./components/info";
import Skills from "./components/skills";
import Company from "./components/company";
import { useRouter } from "next/navigation";
import AppliedJobs from "./components/appliedJobs";

const AccountPage = () => {
  const { isAuth, user, loading, applications } = useAppData();

  const router = useRouter();

  useEffect(() => {
    if (!isAuth && !loading) {
      router.push("/login");
    }
  }, [isAuth, router, loading]);

  if (loading) return <Loading />;
  return (
    <>
      {user && (
        <div className="w-[90%] md:w-[60%] m-auto">
          <Info user={user} isYourAccount={true} />
          {user.role === "jobseeker" && (
            <Skills user={user} isYourAccount={true} />
          )}
          {user.role === "jobseeker" && (
            <AppliedJobs applications={applications} />
          )}
          {user.role === "recruiter" && <Company />}
        </div>
      )}
    </>
  );
};

export default AccountPage;

/*
 * ===========================================================================================
 *                              NOTES — frontend/src/app/account/page.tsx
 * ===========================================================================================
 *
 * PURPOSE: User's own account/profile page. Renders different sections based on role.
 *
 * AUTH GUARD: useEffect checks isAuth → redirects to /login if not authenticated.
 *
 * ROLE-BASED RENDERING:
 * - All users: <Info /> — profile info (name, email, bio, avatar, resume)
 * - Jobseeker: <Skills /> — add/remove skill tags
 * - Jobseeker: <AppliedJobs /> — list of submitted applications with status
 * - Recruiter: <Company /> — manage companies (create, view, delete)
 *
 * isYourAccount={true} → enables editing features (upload pic, update profile, etc.)
 * vs /account/[id] which shows another user's profile with isYourAccount={false}
 *
 * CONNECTIONS:
 * • AppContext → user, isAuth, loading, applications
 * • ./components/* → Info, Skills, Company, AppliedJobs sub-components
 */
