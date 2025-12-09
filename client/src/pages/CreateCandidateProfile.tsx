import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Loader2, User, CheckCircle, Upload } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function CreateCandidateProfile() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    fullName: user?.name || "",
    email: user?.email || "",
    phone: "",
    location: "",
    currentTitle: "",
    yearsExperience: "",
    education: "",
    skills: "",
    summary: "",
    preferredWorkStyle: "",
    careerGoals: "",
  });

  const createCandidateMutation = trpc.candidates.create.useMutation({
    onSuccess: () => {
      toast.success("Profile created successfully!");
      setLocation("/candidates");
    },
    onError: (error) => {
      toast.error(`Failed to create profile: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("You must be logged in to create a profile");
      return;
    }

    createCandidateMutation.mutate({
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone || undefined,
      location: formData.location,
      currentTitle: formData.currentTitle || undefined,
      yearsExperience: formData.yearsExperience ? parseInt(formData.yearsExperience) : undefined,
      education: formData.education || undefined,
      skills: formData.skills,
      summary: formData.summary || undefined,
      preferredWorkStyle: formData.preferredWorkStyle || undefined,
      careerGoals: formData.careerGoals || undefined,
    });
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <User className="h-8 w-8 text-primary" />
            Create Candidate Profile
          </h1>
          <p className="text-muted-foreground mt-2">
            Build your profile and let our AI match you with the perfect opportunities
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Tell us about yourself to help employers find you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  placeholder="e.g., Ahmed Al-Rashid"
                  value={formData.fullName}
                  onChange={(e) => handleChange("fullName", e.target.value)}
                  required
                />
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="ahmed@example.com"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+966 50 123 4567"
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                  />
                </div>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  placeholder="e.g., Riyadh, Saudi Arabia"
                  value={formData.location}
                  onChange={(e) => handleChange("location", e.target.value)}
                  required
                />
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Professional Background</CardTitle>
              <CardDescription>
                Share your experience and qualifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Current Title & Years of Experience */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currentTitle">Current/Recent Title</Label>
                  <Input
                    id="currentTitle"
                    placeholder="e.g., Software Engineer"
                    value={formData.currentTitle}
                    onChange={(e) => handleChange("currentTitle", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="yearsExperience">Years of Experience</Label>
                  <Input
                    id="yearsExperience"
                    type="number"
                    placeholder="e.g., 5"
                    value={formData.yearsExperience}
                    onChange={(e) => handleChange("yearsExperience", e.target.value)}
                  />
                </div>
              </div>

              {/* Education */}
              <div className="space-y-2">
                <Label htmlFor="education">Education</Label>
                <Input
                  id="education"
                  placeholder="e.g., Bachelor's in Computer Science - King Saud University"
                  value={formData.education}
                  onChange={(e) => handleChange("education", e.target.value)}
                />
              </div>

              {/* Skills */}
              <div className="space-y-2">
                <Label htmlFor="skills">Skills & Expertise *</Label>
                <Textarea
                  id="skills"
                  placeholder="List your key skills, technologies, certifications, and areas of expertise..."
                  value={formData.skills}
                  onChange={(e) => handleChange("skills", e.target.value)}
                  rows={4}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Be specific - this helps our AI match you with relevant opportunities
                </p>
              </div>

              {/* Professional Summary */}
              <div className="space-y-2">
                <Label htmlFor="summary">Professional Summary</Label>
                <Textarea
                  id="summary"
                  placeholder="Briefly describe your professional background, achievements, and what you bring to the table..."
                  value={formData.summary}
                  onChange={(e) => handleChange("summary", e.target.value)}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Work Preferences</CardTitle>
              <CardDescription>
                Help us understand your ideal work environment and goals
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Preferred Work Style */}
              <div className="space-y-2">
                <Label htmlFor="preferredWorkStyle">Preferred Work Style</Label>
                <Textarea
                  id="preferredWorkStyle"
                  placeholder="Describe your preferred work environment, team dynamics, management style, work-life balance expectations..."
                  value={formData.preferredWorkStyle}
                  onChange={(e) => handleChange("preferredWorkStyle", e.target.value)}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  This helps our AI assess culture fit and wellbeing compatibility
                </p>
              </div>

              {/* Career Goals */}
              <div className="space-y-2">
                <Label htmlFor="careerGoals">Career Goals</Label>
                <Textarea
                  id="careerGoals"
                  placeholder="What are your short-term and long-term career aspirations? What kind of growth opportunities are you seeking?"
                  value={formData.careerGoals}
                  onChange={(e) => handleChange("careerGoals", e.target.value)}
                  rows={3}
                />
              </div>

              {/* Resume Upload Placeholder */}
              <div className="space-y-2">
                <Label>Resume/CV (Optional)</Label>
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Resume upload coming soon
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    For now, please fill in the form fields above
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={createCandidateMutation.isPending}
                >
                  {createCandidateMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating Profile...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Create Profile
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/candidates")}
                  disabled={createCandidateMutation.isPending}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </DashboardLayout>
  );
}
