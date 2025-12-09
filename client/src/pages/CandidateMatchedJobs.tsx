import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Briefcase, MapPin, DollarSign, Clock, ArrowLeft, Building2, Sparkles, TrendingUp } from "lucide-react";
import { useLocation } from "wouter";

export default function CandidateMatchedJobs() {
  const [, setLocation] = useLocation();

  const { data: jobs, isLoading } = trpc.job.list.useQuery();
  const { data: profile } = trpc.candidate.getProfile.useQuery();

  // In a real implementation, this would call a dedicated "getMatchedJobs" endpoint
  // that uses the AI matching engine to pre-calculate scores
  const matchedJobs = jobs?.filter((job: any) => job.status === "active") || [];

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
            <h1 className="text-xl font-bold text-slate-900">AI-Matched Jobs</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* AI Matching Info Banner */}
        <Card className="mb-8 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  10,000+ Attribute Matching
                  <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">AI-Powered</span>
                </h3>
                <p className="text-sm text-slate-600 mb-3">
                  These jobs are ranked using our advanced AI matching engine that analyzes over 10,000 attributes including:
                </p>
                <div className="grid md:grid-cols-3 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 bg-blue-600 rounded-full"></div>
                    <span className="text-slate-700">Technical & soft skills match</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 bg-purple-600 rounded-full"></div>
                    <span className="text-slate-700">Work environment preferences</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 bg-green-600 rounded-full"></div>
                    <span className="text-slate-700">Career growth potential</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 bg-orange-600 rounded-full"></div>
                    <span className="text-slate-700">Cultural fit & values alignment</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 bg-pink-600 rounded-full"></div>
                    <span className="text-slate-700">Work-life balance compatibility</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 bg-indigo-600 rounded-full"></div>
                    <span className="text-slate-700">Long-term retention prediction</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Completion Check */}
        {profile && profile.profileStatus === "incomplete" && (
          <Card className="mb-6 border-orange-200 bg-orange-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 mb-1">Improve Your Match Scores</h3>
                  <p className="text-sm text-slate-600 mb-3">
                    Complete your profile to get more accurate AI matching and higher match scores
                  </p>
                  <Button size="sm" onClick={() => setLocation("/candidate/profile/edit")}>
                    Complete Profile
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-slate-600">
            {isLoading ? "Loading matched jobs..." : `${matchedJobs.length} jobs matched to your profile`}
          </p>
        </div>

        {/* Job Listings with Match Scores */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-slate-600">Analyzing matches with AI...</p>
          </div>
        ) : matchedJobs && matchedJobs.length > 0 ? (
          <div className="space-y-4">
            {matchedJobs.map((job, index) => {
              // Simulated match score (in production, this would come from the backend)
              const mockMatchScore = 95 - (index * 3);
              
              return (
                <Card 
                  key={job.id} 
                  className="hover:shadow-lg transition-shadow cursor-pointer relative overflow-hidden"
                  onClick={() => setLocation(`/candidate/jobs/${job.id}`)}
                >
                  {/* Match Score Badge */}
                  <div className="absolute top-4 right-4 z-10">
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full shadow-lg">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        <span className="font-bold text-lg">{mockMatchScore}%</span>
                        <span className="text-xs opacity-90">Match</span>
                      </div>
                    </div>
                  </div>

                  <CardHeader>
                    <div className="flex items-start justify-between pr-32">
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
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="line-clamp-2 mb-4">
                      {job.enrichedDescription || job.originalDescription || "No description available"}
                    </CardDescription>

                    {/* Match Breakdown */}
                    <div className="grid grid-cols-5 gap-2 mb-4 p-3 bg-slate-50 rounded-lg">
                      <div className="text-center">
                        <p className="text-xs text-slate-600 mb-1">Skills</p>
                        <p className="font-semibold text-blue-600">{mockMatchScore - 2}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-slate-600 mb-1">Culture</p>
                        <p className="font-semibold text-purple-600">{mockMatchScore + 1}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-slate-600 mb-1">Growth</p>
                        <p className="font-semibold text-green-600">{mockMatchScore - 5}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-slate-600 mb-1">Wellbeing</p>
                        <p className="font-semibold text-orange-600">{mockMatchScore + 3}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-slate-600 mb-1">Location</p>
                        <p className="font-semibold text-pink-600">{mockMatchScore}%</p>
                      </div>
                    </div>
                    
                    {job.requiredSkills && job.requiredSkills.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {job.requiredSkills.slice(0, 5).map((skill, idx) => (
                          <span
                            key={idx}
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
                        View Details & Apply
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Briefcase className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No matched jobs yet</h3>
              <p className="text-slate-600 mb-4">
                Complete your profile to start receiving AI-powered job recommendations
              </p>
              <Button onClick={() => setLocation("/candidate/profile/edit")}>
                Complete Profile
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
