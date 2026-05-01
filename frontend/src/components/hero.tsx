import { ArrowRight, Briefcase, Search, TrendingUp } from "lucide-react";
import Link from "next/link";
import React from "react";
import { Button } from "./ui/button";

const Hero = () => {
  return (
    <section className="relative overflow-hidden pt-20 pb-32">
      {/* Premium Background Orbs specific to Hero */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] mix-blend-screen"></div>
      </div>

      <div className="container mx-auto px-5 relative z-10">
        <div className="flex flex-col-reverse md:flex-row items-center gap-12 md:gap-16">
          <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left space-y-8">
            {/* badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 backdrop-blur-md shadow-[0_0_15px_rgba(99,102,241,0.2)]">
              <TrendingUp size={16} className="text-indigo-400" />
              <span className="text-sm font-medium text-indigo-100">
                #1 Job Platform in India
              </span>
            </div>

            {/* main heading */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1]">
              Find Your Dream Job at{" "}
              <span className="inline-block">
                Job<span className="text-gradient-primary">Nexus</span>
              </span>
            </h1>

            {/* descripiton */}
            <p className="text-lg md:text-xl leading-relaxed text-slate-400 max-w-2xl font-light">
              Connect with top employers and discover opportunities that match
              your skills. Whether you're a job seeker or recruiter, we've got
              you covered with powerful AI tools and a seamless experience.
            </p>

            {/* stats */}
            <div className="flex flex-wrap justify-center md:justify-start gap-10 py-4">
              <div className="text-center md:text-left group">
                <p className="text-4xl font-black text-slate-100 group-hover:text-indigo-400 transition-colors">10k+</p>
                <p className="text-sm text-slate-500 uppercase tracking-widest mt-1">Active Jobs</p>
              </div>
              <div className="text-center md:text-left group">
                <p className="text-4xl font-black text-slate-100 group-hover:text-purple-400 transition-colors">5k+</p>
                <p className="text-sm text-slate-500 uppercase tracking-widest mt-1">Companies</p>
              </div>
              <div className="text-center md:text-left group">
                <p className="text-4xl font-black text-slate-100 group-hover:text-pink-400 transition-colors">50k+</p>
                <p className="text-sm text-slate-500 uppercase tracking-widest mt-1">Job Seekers</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-2 w-full sm:w-auto">
              <Button
                asChild
                size={"lg"}
                className="w-full text-base px-8 h-14 rounded-xl gap-2 group transition-all sm:w-auto"
              >
                <Link href={"/jobs"}>
                  <Search size={18} className="text-indigo-100" />
                  Browse Jobs{" "}
                  <ArrowRight
                    size={18}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </Link>
              </Button>
              <Button
                asChild
                variant={"outline"}
                size={"lg"}
                className="w-full text-base px-8 h-14 rounded-xl gap-2 text-slate-300 hover:text-white sm:w-auto"
              >
                <Link href={"/about"}>
                  <Briefcase size={18} />
                  Learn More
                </Link>
              </Button>
            </div>

            {/* trust indicator section */}
            <div className="flex items-center justify-center md:justify-start gap-4 text-sm text-slate-500 pt-4 flex-wrap">
              <span className="flex items-center gap-1"><span className="text-indigo-400">✓</span> Free to use</span>
              <span className="opacity-30">•</span>
              <span className="flex items-center gap-1"><span className="text-purple-400">✓</span> Verified employers</span>
              <span className="opacity-30">•</span>
              <span className="flex items-center gap-1"><span className="text-pink-400">✓</span> Secure platform</span>
            </div>
          </div>

          {/* image section */}
          <div className="flex-1 relative w-full max-w-lg mx-auto mt-10 md:mt-0">
            <div className="relative group perspective-1000">
              {/* Premium glowing backdrop for image */}
              <div className="absolute -inset-1 bg-linear-to-r from-indigo-500 to-purple-500 rounded-3xl blur-2xl opacity-30 group-hover:opacity-60 transition duration-1000"></div>

              <div className="relative rounded-3xl overflow-hidden glass-panel border border-slate-700/50 p-2 transform transition-transform duration-700 group-hover:scale-[1.02] group-hover:rotate-1">
                <div className="rounded-2xl overflow-hidden">
                  <img
                    src="/hero.jpeg"
                    className="object-cover object-center w-full h-full opacity-90 group-hover:opacity-100 transition-opacity"
                    alt="Job Seeker"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;

/*
 * ===========================================================================================
 *                              NOTES — frontend/src/components/hero.tsx
 * ===========================================================================================
 *
 * PURPOSE: Landing page hero section with animated background orbs, tagline, and CTA buttons.
 *
 * SECTIONS:
 * - Badge: "#1 Job Platform in India" pill
 * - Heading: "Find Your Dream Job at JobNexus" with gradient text
 * - Subtitle: Descriptive text about the platform
 * - CTA Buttons: "Browse Jobs" → /jobs, "Post a Job" → /register
 * - Stats: 10K+ Jobs, 5K+ Companies, 15K+ Hires (hardcoded promotional numbers)
 *
 * DESIGN: Indigo/purple gradient orbs with blur for premium dark space aesthetic.
 * Responsive: flex-col-reverse on mobile, flex-row on desktop.
 *
 * CONNECTIONS: Links to /jobs and /register for user conversion.
 */
