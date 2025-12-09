import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Briefcase, MapPin, DollarSign, Clock, ArrowLeft, Building2, Check, Bookmark } from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { toast } from "sonner";
import { TrainingRecommendations } from "@/components/TrainingRecommendations";

export default function CandidateJobDetail() {
  const [, params] = useRoute("/candidate/jobs/:id");
  const [, setLocation] = useLocation();
  const [coverLetter, setCoverLetter] = useState("");
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const utils = trpc.useUtils();

  const jobId = params?.id ? parseInt(params.id) : 0;

  const { data: job, isLoading } = trpc.job.getById.useQuery({ id: jobId });
  const { data: profile } = trpc.candidate.getProfile.useQuery();

  const { data: savedStatus } = trpc.savedJobs.isSaved.useQuery(
    { candidateId: profile?.id || 0, jobId },
    { enabled: !!profile?.id && jobId > 0 }
  );

  useEffect(() => {
    if (savedStatus !== undefined) {
      setIsSaved(savedStatus);
    }
  }, [savedStatus]);

  const saveJobMutation = trpc.savedJobs.save.useMutation({
    onSuccess: () => {
      setIsSaved(true);
      utils.savedJobs.isSaved.invalidate();
      toast.success("Job saved for later!");
    },
    onError: () => {
      toast.error("Failed to save job");
    },
  });

  const unsaveJobMutation = trpc.savedJobs.unsave.useMutation({
    onSuccess: () => {
      setIsSaved(false);
      utils.savedJobs.isSaved.invalidate();
      toast.success("Job removed from saved list");
    },
    onError: () => {
      toast.error("Failed to unsave job");
    },
  });

  const handleToggleSave = () => {
    if (!profile?.id) {
      toast.error("Please create a profile first");
      return;
    }

    if (isSaved) {
      unsaveJobMutation.mutate({ candidateId: profile.id, jobId });
    } else {
      saveJobMutation.mutate({ candidateId: profile.id, jobId });
    }
  };

  const submitApplication = trpc.application.submit.useMutation({
    onSuccess: () => {
      toast.success("Application submitted successfully!");
      setLocation("/candidate/dashboard");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to submit application");
    },
  });

  const handleApply = () => {
    if (!profile) {
      toast.error("Please complete your profile before applying");
      setLocation("/candidate/profile/create");
      return;
    }

    if (profile.profileStatus === "incomplete") {
      toast.error("Please complete your profile before applying");
      setLocation("/candidate/profile/edit");
      return;
    }

    setShowApplicationForm(true);
  };

  const handleSubmitApplication = () => {
    submitApplication.mutate({
      jobId,
      coverLetter: coverLetter || undefined,
    });
  };

  if (isLoading) {
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
          <Button onClick={() => setLocation("/candidate/jobs")}>
            Browse All Jobs
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
          <Button variant="ghost" size="sm" onClick={() => setLocation("/candidate/jobs")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Jobs
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
                  <div className="h-16 w-16 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-4">
                    <Briefcase className="h-8 w-8 text-blue-600" />
                  </div>
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

            {showApplicationForm && (
              <Card className="border-blue-200">
                <CardHeader>
                  <CardTitle>Submit Your Application</CardTitle>
                  <CardDescription>
                    Add a cover letter to highlight why you're a great fit (optional)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="coverLetter">Cover Letter</Label>
                    <Textarea
                      id="coverLetter"
                      value={coverLetter}
                      onChange={(e) => setCoverLetter(e.target.value)}
                      placeholder="Tell the employer why you're interested in this role and what makes you a great fit..."
                      rows={8}
                    />
                  </div>

                  <div className="flex gap-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowApplicationForm(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSubmitApplication}
                      disabled={submitApplication.isPending}
                      className="flex-1"
                    >
                      {submitApplication.isPending ? "Submitting..." : "Submit Application"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!showApplicationForm ? (
                  <>
                    <Button onClick={handleApply} className="w-full" size="lg">
                      Apply Now
                    </Button>
                    <Button
                      onClick={handleToggleSave}
                      variant="outline"
                      className="w-full"
                      disabled={saveJobMutation.isPending || unsaveJobMutation.isPending}
                    >
                      <Bookmark className={`h-4 w-4 mr-2 ${isSaved ? 'fill-current' : ''}`} />
                      {isSaved ? 'Saved' : 'Save for Later'}
                    </Button>
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-blue-600 bg-blue-50 p-3 rounded-lg">
                    <Check className="h-5 w-5" />
                    <span className="text-sm font-medium">Application form ready below</span>
                  </div>
                )}
                
                <div className="pt-4 border-t">
                  <h4 className="font-semibold text-slate-900 mb-3">Job Details</h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-slate-600">Posted</p>
                      <p className="font-medium text-slate-900">
                        {new Date(job.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-600">Applications</p>
                      <p className="font-medium text-slate-900">{job.applicationCount || 0}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Views</p>
                      <p className="font-medium text-slate-900">{job.viewCount || 0}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Status</p>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        job.status === "active" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-700"
                      }`}>
                        {job.status}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>About This Job</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <div className="h-5 w-5 bg-blue-100 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="h-3 w-3 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">AI-Matched</p>
                      <p className="text-slate-600">This job is matched to your profile using 10,000+ attributes</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="h-5 w-5 bg-green-100 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="h-3 w-3 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">Quick Response</p>
                      <p className="text-slate-600">Employers typically respond within 48 hours</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Training Recommendations - Priority 3: Pathways to Qualification */}
            <TrainingRecommendations jobId={jobId} />
          </div>
        </div>
      </div>
    </div>
  );
}
