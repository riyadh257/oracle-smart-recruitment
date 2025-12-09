import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Briefcase, MapPin, DollarSign, Clock, Search, ArrowLeft, Building2 } from "lucide-react";
import { useLocation } from "wouter";

export default function CandidateJobs() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [workSetting, setWorkSetting] = useState<string>("all");

  const { data: jobs, isLoading } = trpc.job.list.useQuery();

  const filteredJobs = jobs?.filter((job) => {
    const matchesSearch = searchTerm === "" || 
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (job.location && job.location.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesWorkSetting = workSetting === "all" || job.workSetting === workSetting;
    
    return matchesSearch && matchesWorkSetting;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => setLocation("/candidate/dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-xl font-bold text-slate-900">Browse Jobs</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-4 md:py-8">
        {/* Search and Filters */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search by job title or location..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 text-base"
                  />
                </div>
              </div>
              <div>
                <Select value={workSetting} onValueChange={setWorkSetting}>
                  <SelectTrigger>
                    <SelectValue placeholder="Work Setting" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Work Settings</SelectItem>
                    <SelectItem value="remote">Remote</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                    <SelectItem value="onsite">On-site</SelectItem>
                    <SelectItem value="flexible">Flexible</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-slate-600">
            {isLoading ? "Loading jobs..." : `${filteredJobs?.length || 0} jobs found`}
          </p>
        </div>

        {/* Job Listings */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-slate-600">Loading job opportunities...</p>
          </div>
        ) : filteredJobs && filteredJobs.length > 0 ? (
          <div className="space-y-3 md:space-y-4">
            {filteredJobs.map((job) => (
              <Card 
                key={job.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setLocation(`/candidate/jobs/${job.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">{job.title}</CardTitle>
                      <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                        {job.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            <span>{job.location}</span>
                          </div>
                        )}
                        {job.workSetting && (
                          <div className="flex items-center gap-1">
                            <Building2 className="h-4 w-4" />
                            <span className="capitalize">{job.workSetting}</span>
                          </div>
                        )}
                        {job.employmentType && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span className="capitalize">{job.employmentType.replace('_', ' ')}</span>
                          </div>
                        )}
                        {(job.salaryMin || job.salaryMax) && (
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            <span>
                              {job.salaryMin && job.salaryMax
                                ? `$${(job.salaryMin / 1000).toFixed(0)}k - $${(job.salaryMax / 1000).toFixed(0)}k`
                                : job.salaryMin
                                ? `From $${(job.salaryMin / 1000).toFixed(0)}k`
                                : `Up to $${(job.salaryMax! / 1000).toFixed(0)}k`}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0 ml-4">
                      <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Briefcase className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="line-clamp-2">
                    {job.enrichedDescription || job.originalDescription || "No description available"}
                  </CardDescription>
                  
                  {job.requiredSkills && job.requiredSkills.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {job.requiredSkills.slice(0, 5).map((skill, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                      {job.requiredSkills.length > 5 && (
                        <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium">
                          +{job.requiredSkills.length - 5} more
                        </span>
                      )}
                    </div>
                  )}

                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      Posted {new Date(job.createdAt).toLocaleDateString()}
                    </span>
                    <Button size="sm">
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Briefcase className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No jobs found</h3>
              <p className="text-slate-600 mb-4">
                {searchTerm || workSetting !== "all"
                  ? "Try adjusting your search filters"
                  : "Check back soon for new opportunities"}
              </p>
              {(searchTerm || workSetting !== "all") && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setWorkSetting("all");
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
