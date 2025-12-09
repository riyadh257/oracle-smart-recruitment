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
import { Building2, Users, Mail, Phone, Briefcase, FileText } from "lucide-react";

export default function EnterpriseQuote() {
  const [formData, setFormData] = useState({
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    companySize: "",
    industry: "",
    expectedHires: "",
    specialRequirements: "",
  });

  const submitMutation = trpc.enterpriseQuotes.submit.useMutation({
    onSuccess: () => {
      toast.success("Quote request submitted successfully! We'll contact you soon.");
      setFormData({
        companyName: "",
        contactName: "",
        email: "",
        phone: "",
        companySize: "",
        industry: "",
        expectedHires: "",
        specialRequirements: "",
      });
    },
    onError: (error) => {
      toast.error(`Failed to submit request: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    submitMutation.mutate({
      companyName: formData.companyName,
      contactName: formData.contactName,
      email: formData.email,
      phone: formData.phone || undefined,
      companySize: formData.companySize as "1-50" | "51-200" | "201-500" | "501-1000" | "1000-5000" | "5000+",
      industry: formData.industry || undefined,
      expectedHires: formData.expectedHires ? parseInt(formData.expectedHires) : undefined,
      specialRequirements: formData.specialRequirements || undefined,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Oracle Smart Recruitment
              </span>
            </div>
            <Button variant="outline" onClick={() => window.history.back()}>
              Back to Home
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Enterprise Plan
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Get a customized solution tailored to your organization's unique recruitment needs
            </p>
          </div>

          {/* Benefits Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card>
              <CardHeader>
                <Users className="h-10 w-10 text-blue-600 mb-2" />
                <CardTitle>Unlimited Users</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Add as many team members as you need without per-seat pricing
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Briefcase className="h-10 w-10 text-purple-600 mb-2" />
                <CardTitle>Custom Integrations</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Connect with your existing HR systems and tools seamlessly
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <FileText className="h-10 w-10 text-green-600 mb-2" />
                <CardTitle>Dedicated Support</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Get priority support with a dedicated account manager
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quote Request Form */}
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl">Request a Custom Quote</CardTitle>
              <CardDescription>
                Fill out the form below and our team will get back to you within 24 hours
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Company Name */}
                  <div className="space-y-2">
                    <Label htmlFor="companyName" className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Company Name *
                    </Label>
                    <Input
                      id="companyName"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      placeholder="Acme Corporation"
                      required
                    />
                  </div>

                  {/* Contact Name */}
                  <div className="space-y-2">
                    <Label htmlFor="contactName" className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Contact Name *
                    </Label>
                    <Input
                      id="contactName"
                      value={formData.contactName}
                      onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                      placeholder="John Doe"
                      required
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email Address *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="john@acme.com"
                      required
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  {/* Company Size */}
                  <div className="space-y-2">
                    <Label htmlFor="companySize">Company Size *</Label>
                    <Select
                      value={formData.companySize}
                      onValueChange={(value) => setFormData({ ...formData, companySize: value })}
                      required
                    >
                      <SelectTrigger id="companySize">
                        <SelectValue placeholder="Select company size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-50">1-50 employees</SelectItem>
                        <SelectItem value="51-200">51-200 employees</SelectItem>
                        <SelectItem value="201-500">201-500 employees</SelectItem>
                        <SelectItem value="501-1000">501-1,000 employees</SelectItem>
                        <SelectItem value="1000-5000">1,000-5,000 employees</SelectItem>
                        <SelectItem value="5000+">5,000+ employees</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Industry */}
                  <div className="space-y-2">
                    <Label htmlFor="industry">Industry</Label>
                    <Input
                      id="industry"
                      value={formData.industry}
                      onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                      placeholder="Technology, Healthcare, Finance..."
                    />
                  </div>

                  {/* Expected Hires */}
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="expectedHires">Expected Hires Per Year</Label>
                    <Input
                      id="expectedHires"
                      type="number"
                      min="1"
                      value={formData.expectedHires}
                      onChange={(e) => setFormData({ ...formData, expectedHires: e.target.value })}
                      placeholder="50"
                    />
                  </div>

                  {/* Special Requirements */}
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="specialRequirements">
                      Special Requirements or Custom Features
                    </Label>
                    <Textarea
                      id="specialRequirements"
                      value={formData.specialRequirements}
                      onChange={(e) =>
                        setFormData({ ...formData, specialRequirements: e.target.value })
                      }
                      placeholder="Tell us about any specific features, integrations, or requirements you need..."
                      rows={5}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => window.history.back()}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitMutation.isPending}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {submitMutation.isPending ? "Submitting..." : "Submit Request"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Additional Info */}
          <div className="mt-8 text-center text-gray-600">
            <p>
              Questions? Contact us at{" "}
              <a href="mailto:enterprise@oracle-recruitment.com" className="text-blue-600 hover:underline">
                enterprise@oracle-recruitment.com
              </a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
