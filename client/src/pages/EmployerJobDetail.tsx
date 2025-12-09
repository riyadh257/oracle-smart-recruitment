import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Briefcase, DollarSign, Eye, FileText, MapPin, Users, UserPlus } from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { toast } from "sonner";

export default function EmployerJobDetail() {
  const [, params] = useRoute("/employer/jobs/:id");
  const [, setLocation] = useLocation();

  const jobId = params?.id ? parseInt(params.id) : 0;

  const { data: job, isLoading: jobLoading } = trpc.job.getById.useQuery({ id: jobId });
  const { data: applications, isLoading: applicationsLoading } = trpc.application.getJobApplications.useQuery({ jobId });
  const { data: employer } = trpc.employer.getProfile.useQuery();
  const utils = trpc.useUtils();

  const addToTalentPoolMutation = trpc.talentPool.add.useMutation({
    onSuccess: () => {
      toast.success("Candidate added to talent pool!");
      utils.talentPool.list.invalidate();
    },
    onError: () => {
      toast.error("Failed to add candidate to talent pool");
    },
  });

  const handleAddToTalentPool = (candidateId: number, matchScore?: number) => {
    if (!employer?.id) {
      toast.error("Employer profile not found");
      return;
    }
    addToTalentPoolMutation.mutate({
      employerId: employer.id,
      candidateId,
      matchScore,
      addedFromJobId: jobId,
    });
  };

  if (jobLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Job Not Found</h2>
          <p className="text-slate-600 mb-4">The job you're looking for doesn't exist</p>
          <Button onClick={() => setLocation("/employer/dashboard")}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/employer/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-3xl mb-4">{job.title}</CardTitle>
                    <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                      {job.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span>{job.location}</span>
                        </div>
                      )}
                      {job.workSetting && (
                        <span className="capitalize">{job.workSetting}</span>
                      )}
                      {job.employmentType && (
                        <span className="capitalize">{job.employmentType.replace('_', ' ')}</span>
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
                  <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                    job.status === "active" ? "bg-green-100 text-green-700" :
                    job.status === "draft" ? "bg-yellow-100 text-yellow-700" :
                    "bg-slate-100 text-slate-700"
                  }`}>
                    {job.status}
                  </span>
                </div>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Job Description</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-slate max-w-none">
                  <p className="whitespace-pre-wrap">
                    {job.enrichedDescription || job.originalDescription || "No description available"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {job.requiredSkills && job.requiredSkills.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Required Skills</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {job.requiredSkills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Applications */}
            <Card>
              <CardHeader>
                <CardTitle>Applications ({applications?.length || 0})</CardTitle>
                <CardDescription>Review candidates who applied for this position</CardDescription>
              </CardHeader>
              <CardContent>
                {applicationsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin h-6 w-6 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                    <p className="text-sm text-slate-600">Loading applications...</p>
                  </div>
                ) : applications && applications.length > 0 ? (
                  <div className="space-y-4">
                    {applications.map((app: any) => (
                      <div key={app.id} className="p-4 border rounded-lg hover:bg-slate-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-slate-900">Candidate #{app.candidateId}</h4>
                            <p className="text-sm text-slate-600 mt-1">
                              Applied {new Date(app.createdAt).toLocaleDateString()}
                            </p>
                            {app.coverLetter && (
                              <p className="text-sm text-slate-600 mt-2 line-clamp-2">
                                {app.coverLetter}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-4 ml-4">
                            {app.overallMatchScore && (
                              <div className="text-center">
                                <p className="text-2xl font-bold text-blue-600">{app.overallMatchScore}%</p>
                                <p className="text-xs text-slate-600">Match</p>
                              </div>
                            )}
                            <div className="flex flex-col gap-2">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap text-center ${
                                app.status === "submitted" ? "bg-blue-100 text-blue-700" :
                                app.status === "screening" ? "bg-yellow-100 text-yellow-700" :
                                app.status === "interviewing" ? "bg-purple-100 text-purple-700" :
                                app.status === "offered" ? "bg-green-100 text-green-700" :
                                "bg-slate-100 text-slate-700"
                              }`}>
                                {app.status}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAddToTalentPool(app.candidateId, app.overallMatchScore)}
                                disabled={addToTalentPoolMutation.isPending}
                              >
                                <UserPlus className="h-3 w-3 mr-1" />
                                Add to Pool
                              </Button>
                            </div>
                          </div>
                        </div>
                        {app.matchBreakdown && (
                          <div className="mt-3 pt-3 border-t grid grid-cols-3 gap-4 text-sm">
                            {app.skillMatchScore && (
                              <div>
                                <p className="text-slate-600">Skills</p>
                                <p className="font-semibold text-slate-900">{app.skillMatchScore}%</p>
                              </div>
                            )}
                            {app.cultureFitScore && (
                              <div>
                                <p className="text-slate-600">Culture Fit</p>
                                <p className="font-semibold text-slate-900">{app.cultureFitScore}%</p>
                              </div>
                            )}
                            {app.wellbeingMatchScore && (
                              <div>
                                <p className="text-slate-600">Wellbeing</p>
                                <p className="font-semibold text-slate-900">{app.wellbeingMatchScore}%</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600">No applications yet</p>
                    <p className="text-sm text-slate-500 mt-2">
                      Applications will appear here as candidates apply
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Job Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Eye className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Views</p>
                      <p className="text-xl font-bold text-slate-900">{job.viewCount || 0}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <FileText className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Applications</p>
                      <p className="text-xl font-bold text-slate-900">{job.applicationCount || 0}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Briefcase className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Posted</p>
                      <p className="text-sm font-medium text-slate-900">
                        {new Date(job.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full">
                  Edit Job
                </Button>
                <Button variant="outline" className="w-full">
                  Close Job
                </Button>
                <Button variant="outline" className="w-full text-red-600 hover:text-red-700">
                  Delete Job
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
