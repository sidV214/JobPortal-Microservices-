"use client";
import Link from "next/link";
import React, { useState } from "react";
import { Button } from "./ui/button";
import { Briefcase, Building2, Home, Info, LogOut, Menu, User, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useAppData } from "@/context/AppContext";

const NavBar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const { isAuth, user, loading, logoutUser } = useAppData();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const logoutHandler = () => {
    logoutUser();
  };
  return (
    <nav className="z-50 sticky top-0 bg-slate-950/60 border-b border-slate-800/50 backdrop-blur-xl shadow-lg shadow-indigo-500/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href={"/"} className="flex items-center gap-1 group">
              <div className="text-2xl font-bold tracking-tight">
                <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent group-hover:from-purple-400 group-hover:to-pink-400 transition-all duration-500">
                  Job
                </span>
                <span className="text-slate-100 group-hover:text-white transition-colors duration-500">Nexus</span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            <Button
              asChild
              variant={"ghost"}
              className="flex items-center gap-2 font-medium hover:text-indigo-400 transition-colors"
            >
              <Link href={"/"}>
                <Home size={16} /> Home
              </Link>
            </Button>

            {user?.role === "recruiter" ? (
              <>
                <Button
                  asChild
                  variant={"ghost"}
                  className="flex items-center gap-2 font-medium hover:text-indigo-400 transition-colors"
                >
                  <Link href={"/recruiter/companies"}>
                    <Building2 size={16} /> My Companies
                  </Link>
                </Button>
                <Button
                  asChild
                  variant={"ghost"}
                  className="flex items-center gap-2 font-medium hover:text-indigo-400 transition-colors"
                >
                  <Link href={"/recruiter/jobs"}>
                    <Briefcase size={16} /> My Jobs
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <Button
                  asChild
                  variant={"ghost"}
                  className="flex items-center gap-2 font-medium hover:text-indigo-400 transition-colors"
                >
                  <Link href={"/jobs"}>
                    <Briefcase size={16} /> Jobs
                  </Link>
                </Button>
                <Button
                  asChild
                  variant={"ghost"}
                  className="flex items-center gap-2 font-medium hover:text-indigo-400 transition-colors"
                >
                  <Link href={"/about"}>
                    <Info size={16} /> About
                  </Link>
                </Button>
              </>
            )}
          </div>

          {/* Right side Actions */}
          <div className="hidden md:flex items-center gap-3">
            {loading ? (
              <div className="h-9 w-9 rounded-full bg-slate-800 animate-pulse"></div>
            ) : (
              <>
                {isAuth ? (
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="flex items-center gap-2 hover:opacity-80 transition-opacity outline-none">
                        <Avatar className="h-9 w-9 ring-2 ring-offset-2 ring-offset-slate-950 ring-indigo-500/40 cursor-pointer hover:ring-indigo-400 transition-all hover:shadow-[0_0_15px_rgba(99,102,241,0.5)]">
                          <AvatarImage
                            src={user ? (user.profile_pic as string) : ""}
                            alt={user ? user.name : ""}
                          />
                          <AvatarFallback className="bg-indigo-900/50 text-indigo-300 border border-indigo-700/50">
                            {user?.name?.charAt(0).toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                      </button>
                    </PopoverTrigger>

                    <PopoverContent className="w-56 p-2 glass-panel border-slate-700/50" align="end">
                      <div className="px-3 py-2 mb-2 border-b border-slate-800">
                        <p className="text-sm font-semibold text-slate-200">
                          {user && user.name}
                        </p>
                        <p className="text-xs text-slate-400 truncate">
                          {user && user.email}
                        </p>
                      </div>

                      <Button
                        asChild
                        className="w-full justify-start gap-2 hover:bg-slate-800/50 text-slate-300 hover:text-indigo-300 transition-colors"
                        variant={"ghost"}
                      >
                        <Link href={"/account"}>
                          <User size={16} /> My Profile
                        </Link>
                      </Button>

                      {user?.role === "jobseeker" && (
                        <Button
                          asChild
                          className="w-full justify-start gap-2 mt-1 hover:bg-slate-800/50 text-slate-300 hover:text-indigo-300 transition-colors"
                          variant={"ghost"}
                        >
                          <Link href={"/applications"}>
                            <Briefcase size={16} /> My Applications
                          </Link>
                        </Button>
                      )}

                      <Button
                        className="w-full justify-start gap-2 mt-1 hover:bg-red-950/30 text-slate-300 hover:text-red-400 transition-colors"
                        variant={"ghost"}
                        onClick={logoutHandler}
                      >
                        <LogOut size={16} />
                        Logout
                      </Button>
                    </PopoverContent>
                  </Popover>
                ) : (
                  <Button asChild className="gap-2 px-6 rounded-full shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all duration-300">
                    <Link href={"/login"}>
                      <User size={16} />
                      Sign In
                    </Link>
                  </Button>
                )}
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-3">
            <button
              onClick={toggleMenu}
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-300 transition-colors outline-none"
              aria-label="Toggle menu"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* mobile view */}
      <div
        className={`md:hidden border-t border-slate-800/50 overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-4 py-4 space-y-2 bg-slate-950/90 backdrop-blur-xl">
          <Button
            asChild
            variant={"ghost"}
            className="w-full justify-start gap-3 h-12 text-slate-300 hover:text-indigo-300 hover:bg-slate-900 block"
          >
            <Link href={"/"} onClick={toggleMenu}>
              <Home size={18} /> Home
            </Link>
          </Button>

          {user?.role === "recruiter" ? (
            <>
              <Button
                asChild
                variant={"ghost"}
                className="w-full justify-start gap-3 h-12 text-slate-300 hover:text-indigo-300 hover:bg-slate-900 block"
              >
                <Link href={"/recruiter/companies"} onClick={toggleMenu}>
                  <Building2 size={18} /> My Companies
                </Link>
              </Button>
              <Button
                asChild
                variant={"ghost"}
                className="w-full justify-start gap-3 h-12 text-slate-300 hover:text-indigo-300 hover:bg-slate-900 block"
              >
                <Link href={"/recruiter/jobs"} onClick={toggleMenu}>
                  <Briefcase size={18} /> My Jobs
                </Link>
              </Button>
            </>
          ) : (
            <>
              <Button
                asChild
                variant={"ghost"}
                className="w-full justify-start gap-3 h-12 text-slate-300 hover:text-indigo-300 hover:bg-slate-900 block"
              >
                <Link href={"/jobs"} onClick={toggleMenu}>
                  <Briefcase size={18} /> Jobs
                </Link>
              </Button>
              <Button
                asChild
                variant={"ghost"}
                className="w-full justify-start gap-3 h-12 text-slate-300 hover:text-indigo-300 hover:bg-slate-900 block"
              >
                <Link href={"/applications"} onClick={toggleMenu}>
                  <Briefcase size={18} /> My Applications
                </Link>
              </Button>
              <Button
                asChild
                variant={"ghost"}
                className="w-full justify-start gap-3 h-12 text-slate-300 hover:text-indigo-300 hover:bg-slate-900 block"
              >
                <Link href={"/about"} onClick={toggleMenu}>
                  <Info size={18} /> About
                </Link>
              </Button>
            </>
          )}

          {isAuth ? (
            <>
              <Button
                asChild
                variant={"ghost"}
                className="w-full justify-start gap-3 h-12 text-slate-300 hover:text-indigo-300 hover:bg-slate-900 block"
              >
                <Link href={"/account"} onClick={toggleMenu}>
                  <User size={18} /> My Profile
                </Link>
              </Button>
              <Button
                variant={"ghost"}
                className="w-full justify-start gap-3 h-12 text-slate-300 hover:text-red-400 hover:bg-red-950/30 mt-2"
                onClick={() => {
                  logoutHandler();
                  toggleMenu();
                }}
              >
                <LogOut size={18} /> Logout
              </Button>
            </>
          ) : (
            <Button asChild className="w-full justify-center gap-3 h-12 rounded-xl shadow-lg shadow-indigo-500/20 block mt-4">
              <Link href={"/login"} onClick={toggleMenu}>
                <User size={18} /> Sign In
              </Link>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default NavBar;

/*
 * ===========================================================================================
 *                              NOTES — frontend/src/components/navbar.tsx
 * ===========================================================================================
 *
 * PURPOSE: Responsive navigation bar shown on every page. Handles desktop and mobile views,
 * authenticated vs unauthenticated states, and user avatar popover.
 *
 * ROLE IN ARCHITECTURE: Frontend → Shared Component (included in layout.tsx)
 *
 * STATE: isOpen (boolean) → mobile hamburger menu toggle
 *
 * CONTEXT: Uses useAppData() → { isAuth, user, loading, logoutUser }
 *
 * CONDITIONAL RENDERING:
 * - loading → shows skeleton pulse avatar (shimmer effect)
 * - isAuth=true → shows Avatar with Popover (My Profile + Logout)
 * - isAuth=false → shows "Sign In" button linking to /login
 *
 * RESPONSIVE DESIGN:
 * - Desktop (md+): Horizontal nav links + avatar popover
 * - Mobile (<md): Hamburger menu → toggleable slide-down menu
 *   Uses CSS max-h transition with overflow-hidden for smooth animation
 *
 * COMPONENTS USED (shadcn/ui):
 * - Button, Popover, PopoverContent, PopoverTrigger, Avatar, AvatarFallback, AvatarImage
 *
 * ICONS (lucide-react): Home, Briefcase, Info, LogOut, Menu, X, User
 *
 * CONNECTIONS:
 * • layout.tsx → renders <NavBar /> on every page
 * • AppContext.tsx → provides auth state and logoutUser function
 * • /login, /account, /jobs, /about → navigation links
 */
