import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Briefcase, FileText, Plus, Settings, TrendingUp, Users, Calendar, Award, Mail, BarChart3, Shield } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function EmployerDashboard() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  const { data: profile, isLoading: profileLoading } = trpc.employer.getProfile.useQuery();
  const { data: jobs, isLoading: jobsLoading } = trpc.employer.getJobs.useQuery();

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out successfully");
    setLocation("/");
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    setLocation("/employer/profile/create");
    return null;
  }

  const activeJobs = jobs?.filter((job: any) => job.status === "active").length || 0;
  const totalApplications = jobs?.reduce((sum: any, job: any) => sum + (job.applicationCount || 0), 0) || 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-900">Oracle Smart Recruitment</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">Welcome, {profile.companyName}</span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Employer Dashboard</h2>
            <p className="text-slate-600">
              Manage your job postings and find top talent with AI-powered matching
            </p>
          </div>
          <Button onClick={() => setLocation("/employer/jobs/create")} size="lg">
            <Plus className="mr-2 h-5 w-5" />
            Post New Job
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Active Jobs</p>
                  <p className="text-2xl font-bold text-slate-900">{activeJobs}</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Briefcase className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Total Applications</p>
                  <p className="text-2xl font-bold text-slate-900">{totalApplications}</p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <FileText className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Matched Candidates</p>
                  <p className="text-2xl font-bold text-slate-900">0</p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Account Status</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {profile.accountStatus === "active" ? "Active" : "Inactive"}
                  </p>
                </div>
                <div className={`h-12 w-12 ${profile.accountStatus === 'active' ? 'bg-green-100' : 'bg-slate-100'} rounded-lg flex items-center justify-center`}>
                  <TrendingUp className={`h-6 w-6 ${profile.accountStatus === 'active' ? 'text-green-600' : 'text-slate-600'}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setLocation("/employer/jobs/create")}>
            <CardHeader>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Plus className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle>Post a Job</CardTitle>
              <CardDescription>
                Create a new job posting with AI-powered enrichment
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setLocation("/employer/candidates")}>
            <CardHeader>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle>Browse Candidates</CardTitle>
              <CardDescription>
                Search and review AI-matched candidates for your openings
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setLocation("/employer/billing")}>
            <CardHeader>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Settings className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle>Billing & Payments</CardTitle>
              <CardDescription>
                View pay-for-performance charges and payment history
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setLocation("/employer/analytics")}>
            <CardHeader>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle>Advanced Analytics</CardTitle>
              <CardDescription>
                View hiring funnel, time-to-hire, ROI, and performance insights
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setLocation("/employer/email-analytics")}>
            <CardHeader>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Mail className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle>Email Analytics & A/B Testing</CardTitle>
              <CardDescription>
                Track email performance and optimize with A/B testing
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setLocation("/employer/engagement")}>
            <CardHeader>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle>Candidate Engagement</CardTitle>
              <CardDescription>
                Track highly engaged candidates for priority follow-up
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-blue-200 bg-blue-50/50" onClick={() => setLocation("/employer/compliance")}>
            <CardHeader>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle className="flex items-center gap-2">
                Saudization Compliance
                <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">NEW</span>
              </CardTitle>
              <CardDescription>
                Real-time Nitaqat monitoring and "what-if" scenario planning
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Active Job Postings */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Your Job Postings</CardTitle>
                <CardDescription>Manage and track your active job listings</CardDescription>
              </div>
              <Button variant="outline" onClick={() => setLocation("/employer/jobs/create")}>
                <Plus className="mr-2 h-4 w-4" />
                New Job
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {jobsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin h-6 w-6 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-sm text-slate-600">Loading jobs...</p>
              </div>
            ) : jobs && jobs.length > 0 ? (
              <div className="space-y-4">
                {jobs.map((job: any) => (
                  <div 
                    key={job.id} 
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 cursor-pointer"
                    onClick={() => setLocation(`/employer/jobs/${job.id}`)}
                  >
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-900">{job.title}</h4>
                      <div className="flex items-center gap-4 mt-1 text-sm text-slate-600">
                        <span>{job.location || "Remote"}</span>
                        <span>•</span>
                        <span className="capitalize">{job.workSetting || "Flexible"}</span>
                        <span>•</span>
                        <span>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-sm text-slate-600">Applications</p>
                        <p className="font-semibold text-blue-600">{job.applicationCount || 0}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-600">Views</p>
                        <p className="font-semibold text-slate-900">{job.viewCount || 0}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        job.status === "active" ? "bg-green-100 text-green-700" :
                        job.status === "draft" ? "bg-yellow-100 text-yellow-700" :
                        "bg-slate-100 text-slate-700"
                      }`}>
                        {job.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Briefcase className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 mb-4">No job postings yet</p>
                <Button onClick={() => setLocation("/employer/jobs/create")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Post Your First Job
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* B2B SaaS Tools */}
        <div className="mt-8 mb-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Predictive Hiring Tools</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-blue-200" onClick={() => setLocation("/employer/shift-scheduler")}>
              <CardHeader>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle>Shift Scheduler</CardTitle>
                <CardDescription>
                  Track workforce patterns to predict hiring needs before you post jobs
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-purple-200" onClick={() => setLocation("/employer/skill-tracker")}>
              <CardHeader>
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Award className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle>Skill Tracker</CardTitle>
                <CardDescription>
                  Map team capabilities to identify skill gaps and get pre-matched candidates
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>

        {/* B2B SaaS Tools Promotion */}
        {profile.saasToolEnabled === false && (
          <Card className="mt-6 border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 mb-1">Unlock Predictive Hiring</h3>
                  <p className="text-sm text-slate-600 mb-3">
                    Enable our free B2B SaaS tools (shift scheduler, skill tracker) to help us predict your hiring needs 30-90 days in advance and proactively match you with talent.
                  </p>
                  <Button size="sm" variant="outline" className="bg-white">
                    Learn More
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
