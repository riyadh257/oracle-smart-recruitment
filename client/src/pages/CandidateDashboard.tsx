import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Briefcase, FileText, MessageSquare, Settings, TrendingUp, User } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { TopMatchesWidget } from "@/components/TopMatchesWidget";

export default function CandidateDashboard() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  const { data: profile, isLoading: profileLoading } = trpc.candidatePortal.getProfile.useQuery();
  const { data: applications, isLoading: applicationsLoading } = trpc.candidatePortal.getMyApplications.useQuery();
  const { data: recommendations } = trpc.candidatePortal.getRecommendedJobs.useQuery({ limit: 5, minScore: 60 });
  const { data: insights } = trpc.candidatePortal.getCareerInsights.useQuery({ limit: 3, unreadOnly: true });

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

  if (!profile?.candidate) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-slate-600">Please complete your profile to access the dashboard.</p>
            <Button className="w-full mt-4" onClick={() => setLocation("/profile-settings")}>Complete Profile</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-900">Oracle Smart Recruitment</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">Welcome, {profile.fullName}</span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Welcome Back, {profile.candidate.fullName?.split(' ')[0]}!</h2>
          <p className="text-slate-600">
            {profile.candidate.headline || "Here's what's happening with your job search"}
          </p>
        </div>

        {/* Career Insights Alert */}
        {insights && insights.length > 0 && (
          <Card className="mb-6 border-purple-200 bg-purple-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 mb-1">New Career Insights Available</h3>
                  <p className="text-sm text-slate-600 mb-3">
                    You have {insights.length} new AI-generated career tips waiting for you
                  </p>
                  <Button size="sm" onClick={() => setLocation("/career-coaching")}>
                    View Insights
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Applications</p>
                  <p className="text-2xl font-bold text-slate-900">{applications?.length || 0}</p>
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
                  <p className="text-sm text-slate-600">Recommendations</p>
                  <p className="text-2xl font-bold text-slate-900">{recommendations?.length || 0}</p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Career Insights</p>
                  <p className="text-2xl font-bold text-slate-900">{insights?.length || 0}</p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FileText className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Interviewing</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {applications?.filter(a => a.application.status === "interviewing").length || 0}
                  </p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <User className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Matches Widget - Priority 2: Engagement & Conversion */}
        <div className="mb-8">
          <TopMatchesWidget />
        </div>

        {/* Main Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setLocation("/job-recommendations")}>
            <CardHeader>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Briefcase className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle>Browse Jobs</CardTitle>
              <CardDescription>
                Explore AI-matched opportunities tailored to your profile
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setLocation("/candidate/coach")}>
            <CardHeader>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <MessageSquare className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle>AI Career Coach</CardTitle>
              <CardDescription>
                Get personalized advice on your resume, career path, and interviews
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setLocation("/candidate/profile/edit")}>
            <CardHeader>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Settings className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle>Manage Profile</CardTitle>
              <CardDescription>
                Update your skills, preferences, and career information
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Recent Applications */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Applications</CardTitle>
            <CardDescription>Track the status of your job applications</CardDescription>
          </CardHeader>
          <CardContent>
            {applicationsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin h-6 w-6 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-sm text-slate-600">Loading applications...</p>
              </div>
            ) : applications && applications.length > 0 ? (
              <div className="space-y-4">
                {applications.slice(0, 5).map((app: any) => (
                  <div key={app.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50">
                    <div>
                      <h4 className="font-semibold text-slate-900">Job #{app.jobId}</h4>
                      <p className="text-sm text-slate-600">Applied on {new Date(app.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      {app.overallMatchScore && (
                        <div className="text-right">
                          <p className="text-sm text-slate-600">Match Score</p>
                          <p className="font-semibold text-blue-600">{app.overallMatchScore}%</p>
                        </div>
                      )}
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        app.status === "submitted" ? "bg-blue-100 text-blue-700" :
                        app.status === "screening" ? "bg-yellow-100 text-yellow-700" :
                        app.status === "interviewing" ? "bg-purple-100 text-purple-700" :
                        app.status === "offered" ? "bg-green-100 text-green-700" :
                        "bg-slate-100 text-slate-700"
                      }`}>
                        {app.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Briefcase className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 mb-4">No applications yet</p>
                <Button onClick={() => setLocation("/candidate/jobs")}>
                  Browse Jobs
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
