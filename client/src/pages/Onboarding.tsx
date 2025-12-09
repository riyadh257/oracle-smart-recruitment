import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_TITLE } from "@/const";
import { Building2, User, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function Onboarding() {
  const [selectedRole, setSelectedRole] = useState<"candidate" | "employer" | null>(null);
  const [, setLocation] = useLocation();

  const handleRoleSelection = () => {
    if (!selectedRole) {
      toast.error("Please select a role to continue");
      return;
    }

    if (selectedRole === "candidate") {
      setLocation("/candidate/profile/create");
    } else {
      setLocation("/employer/profile/create");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome to {APP_TITLE}</h1>
          <p className="text-slate-600">Let's get you set up. How would you like to use our platform?</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card 
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedRole === "candidate" ? "border-2 border-blue-600 shadow-lg" : "border-2 border-transparent"
            }`}
            onClick={() => setSelectedRole("candidate")}
          >
            <CardHeader>
              <div className="h-16 w-16 bg-blue-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <User className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle className="text-center">I'm a Job Seeker</CardTitle>
              <CardDescription className="text-center">
                Find your perfect role with AI-powered matching
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <div className="h-5 w-5 flex-shrink-0 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                    <div className="h-2 w-2 bg-green-600 rounded-full"></div>
                  </div>
                  <span>Get matched to roles that fit your skills and personality</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-5 w-5 flex-shrink-0 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                    <div className="h-2 w-2 bg-green-600 rounded-full"></div>
                  </div>
                  <span>Receive AI-powered career coaching and resume optimization</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-5 w-5 flex-shrink-0 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                    <div className="h-2 w-2 bg-green-600 rounded-full"></div>
                  </div>
                  <span>Track your applications and get real-time updates</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedRole === "employer" ? "border-2 border-blue-600 shadow-lg" : "border-2 border-transparent"
            }`}
            onClick={() => setSelectedRole("employer")}
          >
            <CardHeader>
              <div className="h-16 w-16 bg-purple-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <Building2 className="h-8 w-8 text-purple-600" />
              </div>
              <CardTitle className="text-center">I'm an Employer</CardTitle>
              <CardDescription className="text-center">
                Find top talent with predictive AI matching
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <div className="h-5 w-5 flex-shrink-0 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                    <div className="h-2 w-2 bg-green-600 rounded-full"></div>
                  </div>
                  <span>Access pre-qualified candidates matched to your needs</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-5 w-5 flex-shrink-0 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                    <div className="h-2 w-2 bg-green-600 rounded-full"></div>
                  </div>
                  <span>Reduce time-to-hire by 90% with AI-powered screening</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-5 w-5 flex-shrink-0 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                    <div className="h-2 w-2 bg-green-600 rounded-full"></div>
                  </div>
                  <span>Pay only for performance—qualified applications and hires</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-center">
          <Button 
            onClick={handleRoleSelection} 
            size="lg" 
            disabled={!selectedRole}
            className="px-8"
          >
            Continue
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
