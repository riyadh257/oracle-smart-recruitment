import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useLocation, useRoute } from "wouter";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, Briefcase, CheckCircle } from "lucide-react";

export default function InterviewFeedback() {
  const { user, loading } = useAuth();
  const [, params] = useRoute("/interviews/:id/feedback");
  const [, setLocation] = useLocation();
  const interviewId = params?.id ? parseInt(params.id) : 0;

  const { data: interview, isLoading: interviewLoading } = trpc.interviews.getById.useQuery(
    { id: interviewId },
    { enabled: interviewId > 0 }
  );

  const { data: candidate } = trpc.candidate.getById.useQuery(
    { id: interview?.candidateId || 0 },
    { enabled: !!interview?.candidateId }
  );

  const { data: job } = trpc.jobs.getById.useQuery(
    { id: interview?.jobId || 0 },
    { enabled: !!interview?.jobId }
  );

  const { data: templates } = trpc.scorecardTemplates.list.useQuery();

  const submitFeedback = trpc.interviews.submitFeedback.useMutation({
    onSuccess: () => {
      toast.success("Feedback submitted successfully");
      setLocation("/interviews");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to submit feedback");
    },
  });

  // Auto-select template from job if available
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(
    job?.templateId || null
  );

  // Update selected template when job data loads
  useEffect(() => {
    if (job?.templateId && !selectedTemplateId) {
      setSelectedTemplateId(job.templateId);
      const template = templates?.find((t: any) => t.id === job.templateId);
      if (template) {
        toast.info(`Using scorecard template: ${template.name}`);
      }
    }
  }, [job?.templateId, templates, selectedTemplateId]);
  const [formData, setFormData] = useState({
    technicalSkills: 3,
    communication: 3,
    problemSolving: 3,
    cultureFit: 3,
    overallRating: 3,
    strengths: "",
    weaknesses: "",
    recommendation: "maybe" as "strong-hire" | "hire" | "maybe" | "no-hire" | "strong-no-hire",
    comments: "",
  });

  const handleTemplateSelect = (templateId: string) => {
    const id = parseInt(templateId);
    setSelectedTemplateId(id);
    const template = templates?.find((t: any) => t.id === id);
    if (template && template.criteria) {
      try {
        const criteria = JSON.parse(template.criteria);
        toast.success(`Template "${template.name}" loaded`);
        // Template criteria loaded - form will show these criteria
      } catch (e) {
        toast.error("Failed to parse template criteria");
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.name) {
      toast.error("User name not found");
      return;
    }

    if (!formData.strengths.trim() || !formData.comments.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    submitFeedback.mutate({
      interviewId,
      candidateId: interview?.candidateId || 0,
      submittedBy: user.name,
      templateId: selectedTemplateId || undefined,
      ...formData,
    });
  };

  if (loading || interviewLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading interview details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!interview) {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Interview not found</p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  // Check if feedback already exists
  const existingFeedback = interview.feedback?.find((f: any) => f.submittedBy === user?.name);
  if (existingFeedback) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <CardTitle className="text-green-900">Feedback Already Submitted</CardTitle>
                  <CardDescription className="text-green-700">
                    You have already provided feedback for this interview
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-green-900">Overall Rating</Label>
                    <p className="text-2xl font-bold text-green-600">{existingFeedback.overallRating}/5</p>
                  </div>
                  <div>
                    <Label className="text-green-900">Recommendation</Label>
                    <Badge variant="default" className="mt-2">
                      {existingFeedback.recommendation.replace(/-/g, " ").toUpperCase()}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-green-900">Comments</Label>
                  <p className="text-green-800 mt-1">{existingFeedback.comments}</p>
                </div>
                <Button onClick={() => setLocation("/interviews")} className="w-full">
                  Back to Interviews
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const getRatingLabel = (value: number) => {
    const labels = ["Poor", "Below Average", "Average", "Good", "Excellent"];
    return labels[value - 1] || "Average";
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Interview Feedback</h1>
          <p className="text-muted-foreground mt-2">
            Provide detailed feedback for the interview
          </p>
        </div>

        {/* Interview Details Card */}
        <Card>
          <CardHeader>
            <CardTitle>Interview Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label className="text-xs text-muted-foreground">Candidate</Label>
                  <p className="font-medium">{candidate?.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Briefcase className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label className="text-xs text-muted-foreground">Position</Label>
                  <p className="font-medium">{job?.title}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label className="text-xs text-muted-foreground">Date</Label>
                  <p className="font-medium">
                    {new Date(interview.scheduledAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label className="text-xs text-muted-foreground">Type</Label>
                  <Badge variant="outline">{interview.type}</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feedback Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Template Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Scorecard Template (Optional)</CardTitle>
              <CardDescription>
                Select a template to auto-populate evaluation criteria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select
                value={selectedTemplateId?.toString() || ""}
                onValueChange={handleTemplateSelect}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a template or use default criteria" />
                </SelectTrigger>
                <SelectContent>
                  {templates?.map((template) => (
                    <SelectItem key={template.id} value={template.id.toString()}>
                      {template.name} ({template.jobRole})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Rating Criteria</CardTitle>
              <CardDescription>
                Rate the candidate on a scale of 1 to 5 for each criterion
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Technical Skills */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Technical Skills</Label>
                  <Badge variant="secondary">
                    {formData.technicalSkills} - {getRatingLabel(formData.technicalSkills)}
                  </Badge>
                </div>
                <Slider
                  value={[formData.technicalSkills]}
                  onValueChange={(value) =>
                    setFormData({ ...formData, technicalSkills: value[0] })
                  }
                  min={1}
                  max={5}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Communication */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Communication Skills</Label>
                  <Badge variant="secondary">
                    {formData.communication} - {getRatingLabel(formData.communication)}
                  </Badge>
                </div>
                <Slider
                  value={[formData.communication]}
                  onValueChange={(value) =>
                    setFormData({ ...formData, communication: value[0] })
                  }
                  min={1}
                  max={5}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Problem Solving */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Problem Solving</Label>
                  <Badge variant="secondary">
                    {formData.problemSolving} - {getRatingLabel(formData.problemSolving)}
                  </Badge>
                </div>
                <Slider
                  value={[formData.problemSolving]}
                  onValueChange={(value) =>
                    setFormData({ ...formData, problemSolving: value[0] })
                  }
                  min={1}
                  max={5}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Culture Fit */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Culture Fit</Label>
                  <Badge variant="secondary">
                    {formData.cultureFit} - {getRatingLabel(formData.cultureFit)}
                  </Badge>
                </div>
                <Slider
                  value={[formData.cultureFit]}
                  onValueChange={(value) =>
                    setFormData({ ...formData, cultureFit: value[0] })
                  }
                  min={1}
                  max={5}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Overall Rating */}
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-semibold">Overall Rating</Label>
                  <Badge variant="default" className="text-base px-3 py-1">
                    {formData.overallRating} - {getRatingLabel(formData.overallRating)}
                  </Badge>
                </div>
                <Slider
                  value={[formData.overallRating]}
                  onValueChange={(value) =>
                    setFormData({ ...formData, overallRating: value[0] })
                  }
                  min={1}
                  max={5}
                  step={1}
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detailed Feedback</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Strengths */}
              <div className="space-y-2">
                <Label htmlFor="strengths">
                  Strengths <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="strengths"
                  placeholder="What are the candidate's key strengths?"
                  value={formData.strengths}
                  onChange={(e) =>
                    setFormData({ ...formData, strengths: e.target.value })
                  }
                  rows={4}
                  required
                />
              </div>

              {/* Weaknesses */}
              <div className="space-y-2">
                <Label htmlFor="weaknesses">Areas for Improvement</Label>
                <Textarea
                  id="weaknesses"
                  placeholder="What areas could the candidate improve on?"
                  value={formData.weaknesses}
                  onChange={(e) =>
                    setFormData({ ...formData, weaknesses: e.target.value })
                  }
                  rows={4}
                />
              </div>

              {/* Recommendation */}
              <div className="space-y-2">
                <Label htmlFor="recommendation">
                  Hiring Recommendation <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.recommendation}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, recommendation: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="strong-hire">Strong Hire</SelectItem>
                    <SelectItem value="hire">Hire</SelectItem>
                    <SelectItem value="maybe">Maybe</SelectItem>
                    <SelectItem value="no-hire">No Hire</SelectItem>
                    <SelectItem value="strong-no-hire">Strong No Hire</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Additional Comments */}
              <div className="space-y-2">
                <Label htmlFor="comments">
                  Additional Comments <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="comments"
                  placeholder="Any additional observations or comments about the interview?"
                  value={formData.comments}
                  onChange={(e) =>
                    setFormData({ ...formData, comments: e.target.value })
                  }
                  rows={5}
                  required
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation("/interviews")}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitFeedback.isPending}
              className="flex-1"
            >
              {submitFeedback.isPending ? "Submitting..." : "Submit Feedback"}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
