"use client";
import { user_service } from "@/context/AppContext";
import { User } from "@/type";
import axios from "axios";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import Loading from "@/components/loading";
import Info from "../components/info";
import Skills from "../components/skills";

const UserAccount = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const { id } = useParams();

  async function fetchUser() {
    const token = Cookies.get("token");
    try {
      const { data } = await axios.get(`${user_service}/api/user/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setUser(data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUser();
  }, [id]);

  if (loading) return <Loading />;
  return (
    <>
      {user && (
        <div className="w-[90%] md:w-[60%] m-auto">
          <Info user={user} isYourAccount={false} />
          {user.role === "jobseeker" && (
            <Skills user={user} isYourAccount={false} />
          )}
        </div>
      )}
    </>
  );
};

export default UserAccount;

/*
 * ===========================================================================================
 *                              NOTES — frontend/src/app/account/[id]/page.tsx
 * ===========================================================================================
 *
 * PURPOSE: View another user's profile (read-only). Used when clicking on an applicant's name.
 *
 * PARAMS: [id] → user ID from URL (useParams)
 *
 * DATA FLOW:
 * 1. useEffect → GET user_service/api/user/:id → fetches target user's profile
 * 2. Renders <Info /> and <Skills /> with isYourAccount={false}
 *    → Disables editing features (no upload buttons, no edit forms)
 *
 * DIFFERENCE FROM /account:
 * - /account → own profile (isYourAccount=true, editable)
 * - /account/[id] → someone else's profile (isYourAccount=false, read-only)
 *
 * CONNECTIONS: User Service /api/user/:userId → fetch profile by ID
 */
