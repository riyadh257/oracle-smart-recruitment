import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Upload, Briefcase, Clock, CheckCircle2, XCircle } from "lucide-react";
import { APP_TITLE, APP_LOGO, COMPANY_NAME } from "@/const";
import Footer from "@/components/Footer";

export default function CandidatePortal() {
  const [selectedJob, setSelectedJob] = useState<number | null>(null);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  
  const { data: jobs, isLoading: jobsLoading } = trpc.jobs.listOpen.useQuery();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src={APP_LOGO} alt={COMPANY_NAME} className="h-12 w-auto" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{COMPANY_NAME}</h1>
                <p className="text-gray-600 mt-1">Candidate Portal</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                const trackingSection = document.getElementById('tracking');
                trackingSection?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Track Application
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        {/* Jobs Section */}
        <section className="mb-16">
          <div className="text-center mb-10">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Open Positions</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Join our team and make an impact. Browse available positions and apply today.
            </p>
          </div>

          {jobsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : jobs && jobs.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {jobs.map((job) => (
                <Card key={job.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <Briefcase className="h-8 w-8 text-blue-600" />
                      <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-800 rounded-full">
                        {job.employmentType}
                      </span>
                    </div>
                    <CardTitle className="mt-4">{job.title}</CardTitle>
                    <CardDescription>
                      {job.department && <span>{job.department} • </span>}
                      {job.location || "Remote"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                      {job.description}
                    </p>
                    <Button
                      className="w-full"
                      onClick={() => {
                        setSelectedJob(job.id);
                        setShowApplicationForm(true);
                      }}
                    >
                      Apply Now
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-500">No open positions at the moment. Check back later!</p>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Application Form Modal */}
        {showApplicationForm && selectedJob && (
          <ApplicationForm
            jobId={selectedJob}
            onClose={() => {
              setShowApplicationForm(false);
              setSelectedJob(null);
            }}
          />
        )}

        {/* Tracking Section */}
        <section id="tracking" className="scroll-mt-8">
          <div className="text-center mb-10">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Track Your Application</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Enter your email to view the status of your applications.
            </p>
          </div>
          <ApplicationTracker />
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

function ApplicationForm({ jobId, onClose }: { jobId: number; onClose: () => void }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    linkedinUrl: "",
    portfolioUrl: "",
  });
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const applyMutation = trpc.candidate.applyForJob.useMutation();
  const { data: job } = trpc.jobs.getPublic.useQuery({ id: jobId });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setResumeFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resumeFile) {
      toast.error("Please upload your resume");
      return;
    }

    setIsSubmitting(true);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result?.toString().split(',')[1];
        if (!base64) {
          toast.error("Failed to read resume file");
          setIsSubmitting(false);
          return;
        }

        await applyMutation.mutateAsync({
          ...formData,
          jobId,
          resumeUrl: base64,
          resumeKey: resumeFile.name,
        });

        toast.success("Application submitted successfully!");
        onClose();
      };
      reader.readAsDataURL(resumeFile);
    } catch (error) {
      toast.error("Failed to submit application");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>Apply for {job?.title}</CardTitle>
          <CardDescription>Fill out the form below to submit your application</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="linkedin">LinkedIn URL</Label>
              <Input
                id="linkedin"
                type="url"
                placeholder="https://linkedin.com/in/yourprofile"
                value={formData.linkedinUrl}
                onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="portfolio">Portfolio URL</Label>
              <Input
                id="portfolio"
                type="url"
                placeholder="https://yourportfolio.com"
                value={formData.portfolioUrl}
                onChange={(e) => setFormData({ ...formData, portfolioUrl: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="resume">Resume * (PDF, DOC, DOCX)</Label>
              <Input
                id="resume"
                type="file"
                required
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
              />
              {resumeFile && (
                <p className="text-sm text-gray-600 mt-1">
                  Selected: {resumeFile.name}
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Submit Application
                  </>
                )}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function ApplicationTracker() {
  const [email, setEmail] = useState("");
  const [searchEmail, setSearchEmail] = useState("");

  // TODO: Implement trackApplication procedure
  // const { data: applications, isLoading } = trpc.candidate.trackApplication.useQuery(
  //   { email: searchEmail },
  //   { enabled: !!searchEmail }
  // );
  const applications: any[] = [];
  const isLoading = false;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchEmail(email);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      new: "bg-blue-100 text-blue-800",
      screening: "bg-yellow-100 text-yellow-800",
      interview: "bg-purple-100 text-purple-800",
      offer: "bg-green-100 text-green-800",
      hired: "bg-green-200 text-green-900",
      rejected: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getStatusIcon = (status: string) => {
    if (status === "hired" || status === "offer") return <CheckCircle2 className="h-5 w-5" />;
    if (status === "rejected") return <XCircle className="h-5 w-5" />;
    return <Clock className="h-5 w-5" />;
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex gap-3 mb-6">
            <Input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Button type="submit">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Track"}
            </Button>
          </form>

          {isLoading && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          )}

          {applications && applications.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Your Applications</h3>
              {applications.map((app: any) => (
                <Card key={app.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-lg">{app.jobTitle}</h4>
                        <p className="text-sm text-gray-600">
                          Applied on {new Date(app.appliedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(app.status)}`}>
                        {getStatusIcon(app.status)}
                        {app.status}
                      </div>
                    </div>

                    {app.interviews.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <h5 className="font-medium mb-2">Interviews</h5>
                        <div className="space-y-2">
                          {app.interviews.map((interview: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-3 text-sm">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(interview.status)}`}>
                                {interview.status}
                              </span>
                              <span className="text-gray-600">
                                {interview.type} - {new Date(interview.scheduledAt).toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {applications && applications.length === 0 && searchEmail && (
            <p className="text-center text-gray-500 py-8">
              No applications found for this email address.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
