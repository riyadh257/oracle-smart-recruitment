import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { CheckCircle2, Circle, ArrowRight, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface OnboardingStepProps {
  stepNumber: number;
  title: string;
  description: string;
  data: Record<string, any>;
  onDataChange: (data: Record<string, any>) => void;
  onNext: () => void;
  onBack: () => void;
  isFirst: boolean;
  isLast: boolean;
}

function OnboardingStep({
  stepNumber,
  title,
  description,
  data,
  onDataChange,
  onNext,
  onBack,
  isFirst,
  isLast,
}: OnboardingStepProps) {
  const renderStepContent = () => {
    switch (stepNumber) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyInfo">Company Information</Label>
              <Textarea
                id="companyInfo"
                value={data.companyInfo || ""}
                onChange={(e) => onDataChange({ ...data, companyInfo: e.target.value })}
                placeholder="Tell us about your company, culture, and values..."
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hiringGoals">Hiring Goals</Label>
              <Textarea
                id="hiringGoals"
                value={data.hiringGoals || ""}
                onChange={(e) => onDataChange({ ...data, hiringGoals: e.target.value })}
                placeholder="What are your hiring objectives for the next 6 months?"
                rows={4}
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="teamSize">Current Team Size</Label>
              <Input
                id="teamSize"
                type="number"
                value={data.teamSize || ""}
                onChange={(e) => onDataChange({ ...data, teamSize: e.target.value })}
                placeholder="50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="departments">Key Departments</Label>
              <Input
                id="departments"
                value={data.departments || ""}
                onChange={(e) => onDataChange({ ...data, departments: e.target.value })}
                placeholder="Engineering, Sales, Marketing, etc."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="locations">Office Locations</Label>
              <Input
                id="locations"
                value={data.locations || ""}
                onChange={(e) => onDataChange({ ...data, locations: e.target.value })}
                placeholder="Riyadh, Jeddah, Dammam"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="atsIntegration">ATS Integration Needed?</Label>
              <Input
                id="atsIntegration"
                value={data.atsIntegration || ""}
                onChange={(e) => onDataChange({ ...data, atsIntegration: e.target.value })}
                placeholder="Oracle, SAP, Greenhouse, or None"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dataImport">Data to Import</Label>
              <Textarea
                id="dataImport"
                value={data.dataImport || ""}
                onChange={(e) => onDataChange({ ...data, dataImport: e.target.value })}
                placeholder="Existing candidates, job postings, etc."
                rows={4}
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="teamMembers">Team Members to Invite</Label>
              <Textarea
                id="teamMembers"
                value={data.teamMembers || ""}
                onChange={(e) => onDataChange({ ...data, teamMembers: e.target.value })}
                placeholder="Enter email addresses (one per line)"
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="permissions">Permission Levels</Label>
              <Input
                id="permissions"
                value={data.permissions || ""}
                onChange={(e) => onDataChange({ ...data, permissions: e.target.value })}
                placeholder="Admin, Recruiter, Hiring Manager"
              />
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-green-900 mb-2">
                Setup Complete!
              </h3>
              <p className="text-green-800">
                Your account is ready. You can now start using Oracle Smart Recruitment.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="feedback">Any questions or concerns?</Label>
              <Textarea
                id="feedback"
                value={data.feedback || ""}
                onChange={(e) => onDataChange({ ...data, feedback: e.target.value })}
                placeholder="Let us know if you need any help..."
                rows={4}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {renderStepContent()}

        <div className="flex gap-4">
          {!isFirst && (
            <Button type="button" variant="outline" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}
          <Button type="button" onClick={onNext} className="flex-1">
            {isLast ? "Complete Setup" : "Continue"}
            {!isLast && <ArrowRight className="w-4 h-4 ml-2" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function BetaOnboarding() {
  const [, setLocation] = useLocation();
  const [signupId, setSignupId] = useState<number | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [stepData, setStepData] = useState<Record<number, Record<string, any>>>({
    1: {},
    2: {},
    3: {},
    4: {},
    5: {},
  });

  // Get signupId from URL query params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("signupId");
    if (id) {
      setSignupId(parseInt(id));
    } else {
      toast.error("Invalid onboarding link");
      setLocation("/");
    }
  }, [setLocation]);

  const { data: progress, isLoading } = trpc.betaProgram.getOnboardingProgress.useQuery(
    { signupId: signupId! },
    { enabled: !!signupId }
  );

  const updateStepMutation = trpc.betaProgram.updateOnboardingStep.useMutation({
    onSuccess: () => {
      if (currentStep === 5) {
        toast.success("Onboarding completed!");
        setLocation("/employer/dashboard");
      } else {
        setCurrentStep((prev) => prev + 1);
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to save progress");
    },
  });

  useEffect(() => {
    if (progress) {
      setCurrentStep(progress.currentStep);
      // Load saved step data
      for (let i = 1; i <= 5; i++) {
        const key = `step${i}Data` as keyof typeof progress;
        if (progress[key]) {
          setStepData((prev) => ({
            ...prev,
            [i]: progress[key] as Record<string, any>,
          }));
        }
      }
    }
  }, [progress]);

  const handleStepDataChange = (step: number, data: Record<string, any>) => {
    setStepData((prev) => ({
      ...prev,
      [step]: data,
    }));
  };

  const handleNext = () => {
    if (!signupId) return;

    updateStepMutation.mutate({
      signupId,
      step: currentStep,
      stepData: stepData[currentStep],
      completed: true,
    });
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading onboarding...</p>
        </div>
      </div>
    );
  }

  const steps = [
    { number: 1, title: "Company Profile", description: "Tell us about your organization" },
    { number: 2, title: "Team Structure", description: "Define your team and locations" },
    { number: 3, title: "System Integration", description: "Connect your existing tools" },
    { number: 4, title: "Team Invitations", description: "Invite your team members" },
    { number: 5, title: "Final Review", description: "Complete your setup" },
  ];

  const progressPercentage = (currentStep / 5) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Beta Onboarding</h1>
          <p className="text-gray-600">Let's get your account set up in 5 simple steps</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {steps.map((step) => (
              <div key={step.number} className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    step.number < currentStep
                      ? "bg-green-600 text-white"
                      : step.number === currentStep
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {step.number < currentStep ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    <Circle className="w-6 h-6" />
                  )}
                </div>
                <span className="text-xs mt-2 text-center hidden md:block">{step.title}</span>
              </div>
            ))}
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Current Step */}
        <OnboardingStep
          stepNumber={currentStep}
          title={steps[currentStep - 1].title}
          description={steps[currentStep - 1].description}
          data={stepData[currentStep]}
          onDataChange={(data) => handleStepDataChange(currentStep, data)}
          onNext={handleNext}
          onBack={handleBack}
          isFirst={currentStep === 1}
          isLast={currentStep === 5}
        />
      </div>
    </div>
  );
}
