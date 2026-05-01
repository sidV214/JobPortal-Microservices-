"use client";
import CarrerGuide from "@/components/carrer-guide";
import Hero from "@/components/hero";
import Loading from "@/components/loading";
import ResumeAnalyzer from "@/components/resume-analyser";
import { Button } from "@/components/ui/button";
import { useAppData } from "@/context/AppContext";
import React from "react";

const Home = () => {
  const { loading } = useAppData();
  if (loading) return <Loading />;
  return (
    <div>
      <Hero />
      <CarrerGuide />
      <ResumeAnalyzer />
    </div>
  );
};

export default Home;

/*
 * ===========================================================================================
 *                              NOTES — frontend/src/app/page.tsx
 * ===========================================================================================
 *
 * PURPOSE: Landing page of JobNexus. Composed of 3 major sections:
 * 1. <Hero /> → Hero banner with CTA buttons and platform stats
 * 2. <CarrerGuide /> → AI career path advisor (Gemini-powered)
 * 3. <ResumeAnalyzer /> → AI ATS resume scorer (Gemini multimodal)
 *
 * Shows Loading spinner while AppContext is hydrating user data.
 */
