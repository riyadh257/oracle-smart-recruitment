import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { ArrowRight, Loader2 } from "lucide-react";
import { ResumeUploadWidget } from "@/components/ResumeUploadWidget";

export default function CandidateProfileCreate() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    fullName: user?.name || "",
    email: user?.email || "",
    phone: "",
    location: "",
    headline: "",
    summary: "",
    yearsOfExperience: "",
    desiredSalaryMin: "",
    desiredSalaryMax: "",
    preferredWorkSetting: "",
    willingToRelocate: false,
  });

  const createProfile = trpc.candidate.createProfile.useMutation({
    onSuccess: () => {
      toast.success("Profile created successfully!");
      setLocation("/candidate/dashboard");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create profile");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fullName || !formData.email) {
      toast.error("Please fill in all required fields");
      return;
    }

    createProfile.mutate({
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone || undefined,
      location: formData.location || undefined,
      headline: formData.headline || undefined,
      summary: formData.summary || undefined,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Create Your Candidate Profile</h1>
          <p className="text-slate-600">
            Tell us about yourself so we can match you with the perfect opportunities
          </p>
        </div>

        {/* Resume Upload Widget */}
        <ResumeUploadWidget
          onUploadSuccess={(parsedData) => {
            // Auto-populate form with parsed resume data
            setFormData((prev) => ({
              ...prev,
              fullName: parsedData.name || prev.fullName,
              email: parsedData.email || prev.email,
              summary: parsedData.summary || prev.summary,
            }));
            toast.success("Resume uploaded and parsed successfully!");
          }}
        />

        <form onSubmit={handleSubmit} className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Start with your contact details (or upload resume above to auto-fill)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@example.com"
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="San Francisco, CA"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="headline">Professional Headline</Label>
                <Input
                  id="headline"
                  value={formData.headline}
                  onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                  placeholder="Senior Software Engineer | Full-Stack Developer"
                  maxLength={500}
                />
                <p className="text-xs text-slate-500">
                  A brief tagline that summarizes your professional identity
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="summary">Professional Summary</Label>
                <Textarea
                  id="summary"
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  placeholder="Tell us about your experience, skills, and career goals..."
                  rows={6}
                />
                <p className="text-xs text-slate-500">
                  Share your background, key achievements, and what you're looking for in your next role
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Work Preferences</CardTitle>
              <CardDescription>Help us find the right fit for you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="yearsOfExperience">Years of Experience</Label>
                  <Input
                    id="yearsOfExperience"
                    type="number"
                    value={formData.yearsOfExperience}
                    onChange={(e) => setFormData({ ...formData, yearsOfExperience: e.target.value })}
                    placeholder="5"
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="preferredWorkSetting">Preferred Work Setting</Label>
                  <Select
                    value={formData.preferredWorkSetting}
                    onValueChange={(value) => setFormData({ ...formData, preferredWorkSetting: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select work setting" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="remote">Remote</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                      <SelectItem value="onsite">On-site</SelectItem>
                      <SelectItem value="flexible">Flexible</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="desiredSalaryMin">Desired Salary (Min)</Label>
                  <Input
                    id="desiredSalaryMin"
                    type="number"
                    value={formData.desiredSalaryMin}
                    onChange={(e) => setFormData({ ...formData, desiredSalaryMin: e.target.value })}
                    placeholder="80000"
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="desiredSalaryMax">Desired Salary (Max)</Label>
                  <Input
                    id="desiredSalaryMax"
                    type="number"
                    value={formData.desiredSalaryMax}
                    onChange={(e) => setFormData({ ...formData, desiredSalaryMax: e.target.value })}
                    placeholder="120000"
                    min="0"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="willingToRelocate"
                  checked={formData.willingToRelocate}
                  onChange={(e) => setFormData({ ...formData, willingToRelocate: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300"
                />
                <Label htmlFor="willingToRelocate" className="cursor-pointer">
                  I'm willing to relocate for the right opportunity
                </Label>
              </div>
            </CardContent>
          </Card>

          <div className="mt-8 flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation("/")}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createProfile.isPending}
              className="flex-1"
            >
              {createProfile.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Profile...
                </>
              ) : (
                <>
                  Create Profile
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </form>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-900">
            <strong>Next Steps:</strong> After creating your profile, you'll be able to add your skills, upload your resume, and start browsing job opportunities matched to your profile.
          </p>
        </div>
      </div>
    </div>
  );
}
