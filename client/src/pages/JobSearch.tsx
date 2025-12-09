import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Briefcase, MapPin, DollarSign, Clock, Building2, Search, Bookmark, TrendingUp, Star, Lightbulb, ChevronDown, ChevronUp } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

export default function JobSearch() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [workSettingFilter, setWorkSettingFilter] = useState<string>("all");
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState<string>("all");
  const [expandedExplanations, setExpandedExplanations] = useState<Set<number>>(new Set());

  // Use AI-powered job matching if authenticated, otherwise show all jobs
  const { data: jobs, isLoading } = isAuthenticated 
    ? trpc.job.getWithMatchScores.useQuery()
    : trpc.job.list.useQuery();

  // Get candidate profile to save jobs
  const { data: candidateProfile } = trpc.candidate.getByUserId.useQuery(
    { userId: user?.id! },
    { enabled: isAuthenticated && !!user?.id }
  );

  const saveJobMutation = trpc.savedJobs.save.useMutation({
    onSuccess: () => {
      toast.success("Job saved to your list");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to save job");
    },
  });

  const handleSaveJob = (jobId: number) => {
    if (!isAuthenticated) {
      toast.error("Please sign in to save jobs");
      return;
    }
    if (!candidateProfile?.id) {
      toast.error("Please complete your candidate profile first");
      return;
    }
    saveJobMutation.mutate({ candidateId: candidateProfile.id, jobId });
  };

  const handleApply = (jobId: number) => {
    if (!isAuthenticated) {
      toast.error("Please sign in to apply for jobs");
      return;
    }
    setLocation(`/jobs/${jobId}/apply`);
  };

  // Filter jobs
  const filteredJobs = jobs?.filter((job) => {
    if (job.status !== 'active') return false;
    
    const matchesSearch = !searchQuery || 
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.department?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesLocation = !locationFilter || 
      job.location?.toLowerCase().includes(locationFilter.toLowerCase());
    
    const matchesWorkSetting = workSettingFilter === "all" || 
      job.workSetting === workSettingFilter;
    
    const matchesEmploymentType = employmentTypeFilter === "all" || 
      job.employmentType === employmentTypeFilter;

    return matchesSearch && matchesLocation && matchesWorkSetting && matchesEmploymentType;
  }) || [];

  const getWorkSettingBadge = (setting: string) => {
    const colors: Record<string, string> = {
      remote: 'bg-green-100 text-green-800',
      hybrid: 'bg-blue-100 text-blue-800',
      onsite: 'bg-gray-100 text-gray-800',
      flexible: 'bg-purple-100 text-purple-800',
    };
    return colors[setting] || 'bg-gray-100 text-gray-800';
  };

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return null;
    if (min && max) return `$${(min / 1000).toFixed(0)}k - $${(max / 1000).toFixed(0)}k`;
    if (min) return `From $${(min / 1000).toFixed(0)}k`;
    if (max) return `Up to $${(max / 1000).toFixed(0)}k`;
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-16">
        <div className="container max-w-6xl">
          <h1 className="text-4xl font-bold mb-4">Find Your Dream Job</h1>
          <p className="text-xl text-purple-100 mb-8">
            Discover opportunities matched to your skills and career goals
          </p>
          
          {/* Search Bar */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Job title, keywords, or company"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white"
              />
            </div>
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Location"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="pl-10 bg-white"
              />
            </div>
            <Button size="lg" variant="secondary">
              Search Jobs
            </Button>
          </div>
        </div>
      </div>

      <div className="container max-w-6xl py-8">
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <Select value={workSettingFilter} onValueChange={setWorkSettingFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Work Setting" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Settings</SelectItem>
              <SelectItem value="remote">Remote</SelectItem>
              <SelectItem value="hybrid">Hybrid</SelectItem>
              <SelectItem value="onsite">On-site</SelectItem>
              <SelectItem value="flexible">Flexible</SelectItem>
            </SelectContent>
          </Select>

          <Select value={employmentTypeFilter} onValueChange={setEmploymentTypeFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Employment Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="full_time">Full Time</SelectItem>
              <SelectItem value="part_time">Part Time</SelectItem>
              <SelectItem value="contract">Contract</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={() => setLocation("/saved-jobs")}>
            <Bookmark className="h-4 w-4 mr-2" />
            Saved Jobs
          </Button>
        </div>

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-gray-600">
            <span className="font-semibold">{filteredJobs.length}</span> jobs found
          </p>
        </div>

        {/* Job Listings */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredJobs.length > 0 ? (
          <div className="space-y-4">
            {filteredJobs.map((job) => (
              <Card key={job.id} className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setLocation(`/jobs/${job.id}`)}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">{job.title}</CardTitle>
                      <CardDescription className="flex items-center gap-4 text-base">
                        <span className="flex items-center gap-1">
                          <Building2 className="h-4 w-4" />
                          {job.department || "Company"}
                        </span>
                        {job.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {job.location}
                          </span>
                        )}
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSaveJob(job.id);
                      }}
                    >
                      <Bookmark className="h-5 w-5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Badges */}
                  <div className="flex flex-wrap gap-2">
                    {job.workSetting && (
                      <Badge className={getWorkSettingBadge(job.workSetting)}>
                        {job.workSetting}
                      </Badge>
                    )}
                    {job.employmentType && (
                      <Badge variant="outline">
                        <Briefcase className="h-3 w-3 mr-1" />
                        {job.employmentType.replace('_', ' ')}
                      </Badge>
                    )}
                    {formatSalary(job.salaryMin, job.salaryMax) && (
                      <Badge variant="outline">
                        <DollarSign className="h-3 w-3 mr-1" />
                        {formatSalary(job.salaryMin, job.salaryMax)}
                      </Badge>
                    )}
                  </div>

                  {/* Description */}
                  {job.enrichedDescription && (
                    <p className="text-gray-700 line-clamp-2">
                      {job.enrichedDescription.substring(0, 200)}...
                    </p>
                  )}

                  {/* AI Match Score with Explanation */}
                  {isAuthenticated && job.matchScore !== undefined && (
                    <div className={`rounded-lg border ${
                      job.matchScore >= 80 
                        ? 'bg-green-50 border-green-200' 
                        : job.matchScore >= 60 
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}>
                      {/* Match Score Header */}
                      <div className="flex items-center gap-2 p-3">
                        <Star className={`h-5 w-5 ${
                          job.matchScore >= 80 
                            ? 'text-green-600 fill-green-600' 
                            : job.matchScore >= 60 
                            ? 'text-blue-600 fill-blue-600'
                            : 'text-gray-600 fill-gray-600'
                        }`} />
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${
                            job.matchScore >= 80 
                              ? 'text-green-900' 
                              : job.matchScore >= 60 
                              ? 'text-blue-900'
                              : 'text-gray-900'
                          }`}>
                            {job.matchScore}% AI Match
                          </p>
                          <p className="text-xs text-gray-600">
                            Based on your skills and experience
                          </p>
                        </div>
                        {job.matchExplanation && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedExplanations(prev => {
                                const newSet = new Set(prev);
                                if (newSet.has(job.id)) {
                                  newSet.delete(job.id);
                                } else {
                                  newSet.add(job.id);
                                }
                                return newSet;
                              });
                            }}
                          >
                            {expandedExplanations.has(job.id) ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </div>

                      {/* Match Explanation (Expandable) */}
                      {job.matchExplanation && expandedExplanations.has(job.id) && (
                        <div className="px-3 pb-3 pt-0 space-y-2 border-t border-gray-200/50 mt-2">
                          {/* Summary */}
                          <div className="flex items-start gap-2 mt-2">
                            <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-gray-700">
                              {job.matchExplanation.summary}
                            </p>
                          </div>

                          {/* Top Matched Skills */}
                          {job.matchExplanation.topMatchedSkills?.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-gray-700 mb-1">Top Matched Skills:</p>
                              <div className="flex flex-wrap gap-1">
                                {job.matchExplanation.topMatchedSkills.map((skill: string, idx: number) => (
                                  <Badge key={idx} variant="secondary" className="text-xs bg-green-100 text-green-800">
                                    {skill}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Growth Opportunities */}
                          {job.matchExplanation.growthOpportunities?.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-gray-700 mb-1">Growth Opportunities:</p>
                              <ul className="text-xs text-gray-600 space-y-0.5 ml-4 list-disc">
                                {job.matchExplanation.growthOpportunities.map((opp: string, idx: number) => (
                                  <li key={idx}>{opp}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Strength Areas */}
                          {job.matchExplanation.strengthAreas?.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-gray-700 mb-1">Your Strengths:</p>
                              <div className="space-y-1">
                                {job.matchExplanation.strengthAreas.map((area: any, idx: number) => (
                                  <div key={idx} className="flex items-center gap-2">
                                    <div className="flex-1">
                                      <p className="text-xs text-gray-700 font-medium">{area.category}</p>
                                      <p className="text-xs text-gray-600">{area.description}</p>
                                    </div>
                                    <Badge variant="outline" className="text-xs">
                                      {area.score}%
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Posted Date */}
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Clock className="h-4 w-4" />
                    Posted {new Date(job.createdAt).toLocaleDateString()}
                  </div>
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Button 
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleApply(job.id);
                    }}
                  >
                    Apply Now
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLocation(`/jobs/${job.id}`);
                    }}
                  >
                    View Details
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No jobs found</h3>
              <p className="text-gray-600 mb-4">
                Try adjusting your search criteria or filters
              </p>
              <Button onClick={() => {
                setSearchQuery("");
                setLocationFilter("");
                setWorkSettingFilter("all");
                setEmploymentTypeFilter("all");
              }}>
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Career Development CTA */}
        {filteredJobs.length > 0 && (
          <Card className="mt-8 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                Boost Your Career
              </CardTitle>
              <CardDescription>
                Enhance your skills with our training programs to match more jobs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setLocation("/training")}>
                Explore Training Programs
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
