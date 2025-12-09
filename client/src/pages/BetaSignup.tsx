import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { CheckCircle2, Rocket, Users, Zap } from "lucide-react";

export default function BetaSignup() {
  const [formData, setFormData] = useState({
    companyName: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    industry: "",
    companySize: "",
    currentAts: "",
    painPoints: "",
    expectedHires: "",
  });

  const [submitted, setSubmitted] = useState(false);

  const signupMutation = trpc.betaProgram.signup.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success("Successfully registered for beta program!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to submit signup");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    signupMutation.mutate({
      companyName: formData.companyName,
      contactName: formData.contactName,
      contactEmail: formData.contactEmail,
      contactPhone: formData.contactPhone || undefined,
      industry: formData.industry || undefined,
      companySize: formData.companySize as any || undefined,
      currentAts: formData.currentAts || undefined,
      painPoints: formData.painPoints || undefined,
      expectedHires: formData.expectedHires ? parseInt(formData.expectedHires) : undefined,
    });
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <CardTitle className="text-3xl">Thank You for Joining!</CardTitle>
            <CardDescription className="text-lg mt-2">
              Your application has been received successfully
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              We're excited to have you as part of our beta program. Our team will review your
              application and reach out to you within 2-3 business days.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
              <h4 className="font-semibold text-blue-900 mb-2">What's Next?</h4>
              <ul className="text-sm text-blue-800 space-y-2 text-left">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Application review by our team (1-2 days)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Onboarding call to discuss your needs</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Beta access credentials and setup guidance</span>
                </li>
              </ul>
            </div>
            <Button
              onClick={() => (window.location.href = "/")}
              className="mt-6"
            >
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Rocket className="w-4 h-4" />
            Limited Beta Program
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Join Oracle Smart Recruitment Beta
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Be among the first 10 companies to experience the future of AI-powered recruitment
            in Saudi Arabia
          </p>
        </div>

        {/* Benefits */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader>
              <Zap className="w-8 h-8 text-blue-600 mb-2" />
              <CardTitle className="text-lg">Early Access</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Get exclusive access to cutting-edge AI matching and Arabic NLP features
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Users className="w-8 h-8 text-purple-600 mb-2" />
              <CardTitle className="text-lg">Priority Support</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Direct line to our team for setup, training, and ongoing assistance
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CheckCircle2 className="w-8 h-8 text-green-600 mb-2" />
              <CardTitle className="text-lg">Shape the Product</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Your feedback directly influences feature development and priorities
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Signup Form */}
        <Card>
          <CardHeader>
            <CardTitle>Beta Program Application</CardTitle>
            <CardDescription>
              Fill out the form below to apply for our exclusive beta program
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="companyName">
                    Company Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="companyName"
                    required
                    value={formData.companyName}
                    onChange={(e) => handleChange("companyName", e.target.value)}
                    placeholder="Acme Corporation"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactName">
                    Contact Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="contactName"
                    required
                    value={formData.contactName}
                    onChange={(e) => handleChange("contactName", e.target.value)}
                    placeholder="John Doe"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactEmail">
                    Email Address <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    required
                    value={formData.contactEmail}
                    onChange={(e) => handleChange("contactEmail", e.target.value)}
                    placeholder="john@acme.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Phone Number</Label>
                  <Input
                    id="contactPhone"
                    type="tel"
                    value={formData.contactPhone}
                    onChange={(e) => handleChange("contactPhone", e.target.value)}
                    placeholder="+966 50 123 4567"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    value={formData.industry}
                    onChange={(e) => handleChange("industry", e.target.value)}
                    placeholder="Technology, Healthcare, etc."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companySize">Company Size</Label>
                  <Select
                    value={formData.companySize}
                    onValueChange={(value) => handleChange("companySize", value)}
                  >
                    <SelectTrigger id="companySize">
                      <SelectValue placeholder="Select company size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-10">1-10 employees</SelectItem>
                      <SelectItem value="11-50">11-50 employees</SelectItem>
                      <SelectItem value="51-200">51-200 employees</SelectItem>
                      <SelectItem value="201-500">201-500 employees</SelectItem>
                      <SelectItem value="501+">501+ employees</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currentAts">Current ATS (if any)</Label>
                  <Input
                    id="currentAts"
                    value={formData.currentAts}
                    onChange={(e) => handleChange("currentAts", e.target.value)}
                    placeholder="Oracle, SAP, Greenhouse, etc."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expectedHires">Expected Hires per Month</Label>
                  <Input
                    id="expectedHires"
                    type="number"
                    min="0"
                    value={formData.expectedHires}
                    onChange={(e) => handleChange("expectedHires", e.target.value)}
                    placeholder="10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="painPoints">
                  What are your biggest recruitment challenges?
                </Label>
                <Textarea
                  id="painPoints"
                  value={formData.painPoints}
                  onChange={(e) => handleChange("painPoints", e.target.value)}
                  placeholder="Tell us about your current recruitment pain points..."
                  rows={4}
                />
              </div>

              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={signupMutation.isPending}
                  className="flex-1"
                >
                  {signupMutation.isPending ? "Submitting..." : "Apply for Beta Access"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => (window.location.href = "/")}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
