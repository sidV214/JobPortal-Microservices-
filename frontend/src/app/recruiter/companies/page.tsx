"use client";
import { useAppData } from "@/context/AppContext";
import React, { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Building2, Plus, ArrowRight } from "lucide-react";
import Loading from "@/components/loading";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const CompaniesPage = () => {
  const { recruiterCompanies, fetchRecruiterCompanies, loading } = useAppData();

  useEffect(() => {
    fetchRecruiterCompanies();
  }, []);

  if (loading && recruiterCompanies.length === 0) return <Loading />;

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-100">My Companies</h1>
            <p className="text-slate-400 mt-1">Manage the companies you recruit for.</p>
          </div>
          <Button asChild className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
            <Link href="/recruiter/companies/new">
              <Plus size={18} />
              Create Company
            </Link>
          </Button>
        </div>

        {recruiterCompanies.length === 0 ? (
          <div className="glass-panel rounded-2xl p-12 text-center flex flex-col items-center justify-center border border-slate-800">
            <Building2 size={48} className="text-slate-500 mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No companies yet</h3>
            <p className="text-slate-400 max-w-md mx-auto mb-6">You haven't created any companies. Create your first company to start posting jobs and hiring talent.</p>
            <Button asChild variant="outline" className="border-indigo-500/50 text-indigo-300 hover:bg-indigo-500/10">
              <Link href="/recruiter/companies/new">Create Company</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recruiterCompanies.map((company) => (
              <Card key={company._id} className="glass-panel-hover border-slate-700/50 hover:border-indigo-500/30 transition-all duration-300 group flex flex-col h-full">
                <CardHeader className="pb-4 border-b border-slate-800/50 shrink-0">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl border border-slate-700 overflow-hidden bg-slate-900 shrink-0">
                      <img
                        src={company.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(company.name)}&background=random&color=fff`}
                        alt={company.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(company.name)}&background=random&color=fff`;
                        }}
                      />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-100 group-hover:text-indigo-400 transition-colors line-clamp-1">{company.name}</h3>
                      <a href={company.website} target="_blank" rel="noreferrer" className="text-sm text-indigo-400/80 hover:text-indigo-300 hover:underline line-clamp-1">
                        {company.website}
                      </a>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 flex flex-col flex-1 justify-between gap-4">
                  <p className="text-slate-400 text-sm line-clamp-3">
                    {company.description}
                  </p>
                  <Button asChild variant="outline" className="w-full gap-2 group/btn border-slate-700 hover:border-indigo-500/50 mt-auto">
                    <Link href={`/company/${company._id}`}>
                      View Public Profile
                      <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CompaniesPage;
