import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Smartphone,
  Calendar,
  Bell,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  X,
} from "lucide-react";
import { useLocation } from "wouter";

const ONBOARDING_COMPLETED_KEY = "oracle-onboarding-completed";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  content: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function OnboardingTutorial() {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Check if onboarding has been completed
    const completed = localStorage.getItem(ONBOARDING_COMPLETED_KEY);
    if (!completed) {
      // Show onboarding after a short delay
      const timer = setTimeout(() => {
        setOpen(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleComplete = () => {
    localStorage.setItem(ONBOARDING_COMPLETED_KEY, "true");
    setOpen(false);
  };

  const handleSkip = () => {
    localStorage.setItem(ONBOARDING_COMPLETED_KEY, "true");
    setOpen(false);
  };

  const steps: OnboardingStep[] = [
    {
      id: "welcome",
      title: "Welcome to Oracle Smart Recruitment",
      description: "Let's get you started with the key features",
      icon: CheckCircle2,
      content: (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This quick tutorial will help you set up your recruitment workflow
            for maximum efficiency. We'll cover:
          </p>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <span className="text-sm">
                Installing the mobile app for on-the-go access
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <span className="text-sm">
                Connecting your calendar for seamless scheduling
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <span className="text-sm">
                Setting up notifications to stay informed
              </span>
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: "pwa",
      title: "Install the Mobile App",
      description: "Access Oracle from your home screen",
      icon: Smartphone,
      content: (
        <div className="space-y-4">
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-primary" />
              Why install the app?
            </h4>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Instant access from your home screen</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Works offline for viewing candidate data</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Faster load times and smoother experience</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Push notifications for important updates</span>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-sm">Installation Steps:</h4>
            <div className="space-y-2">
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="shrink-0">
                      iOS
                    </Badge>
                    <div className="text-sm space-y-1">
                      <p className="font-medium">Safari Browser</p>
                      <ol className="list-decimal list-inside text-muted-foreground space-y-0.5">
                        <li>Tap the Share button</li>
                        <li>Scroll and tap "Add to Home Screen"</li>
                        <li>Tap "Add" to confirm</li>
                      </ol>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="shrink-0">
                      Android
                    </Badge>
                    <div className="text-sm space-y-1">
                      <p className="font-medium">Chrome Browser</p>
                      <ol className="list-decimal list-inside text-muted-foreground space-y-0.5">
                        <li>Tap the menu (three dots)</li>
                        <li>Tap "Add to Home screen"</li>
                        <li>Tap "Add" to confirm</li>
                      </ol>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "calendar",
      title: "Connect Your Calendar",
      description: "Sync interviews with Google or Outlook Calendar",
      icon: Calendar,
      content: (
        <div className="space-y-4">
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Calendar Integration Benefits
            </h4>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Automatic interview scheduling based on availability</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Prevent double-booking with conflict detection</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Send calendar invites to candidates automatically</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Sync across all your devices</span>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              You can connect either Google Calendar or Outlook Calendar (or both)
              to enable smart scheduling features.
            </p>
            <p className="text-sm font-medium">
              Go to Calendar Settings to get started →
            </p>
          </div>
        </div>
      ),
      action: {
        label: "Open Calendar Settings",
        onClick: () => {
          handleComplete();
          setLocation("/settings/calendar");
        },
      },
    },
    {
      id: "notifications",
      title: "Set Up Notifications",
      description: "Stay informed about important recruitment events",
      icon: Bell,
      content: (
        <div className="space-y-4">
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              Stay in the Loop
            </h4>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Get notified when candidates respond to interviews</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Receive alerts for high-engagement candidates</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Track A/B test results in real-time</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Customize notification frequency and channels</span>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Configure your notification preferences to control what updates you
              receive and when.
            </p>
            <p className="text-sm font-medium">
              Visit Notification Settings to customize →
            </p>
          </div>
        </div>
      ),
      action: {
        label: "Open Notification Settings",
        onClick: () => {
          handleComplete();
          setLocation("/settings/notifications");
        },
      },
    },
  ];

  const currentStepData = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1.5">
              <DialogTitle className="text-xl flex items-center gap-2">
                <currentStepData.icon className="h-5 w-5 text-primary" />
                {currentStepData.title}
              </DialogTitle>
              <DialogDescription>{currentStepData.description}</DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={handleSkip}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress indicator */}
          <div className="flex items-center gap-2">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  index <= currentStep ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>

          {/* Step content */}
          <div className="min-h-[300px]">{currentStepData.content}</div>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
                disabled={isFirstStep}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleSkip}>
                Skip Tutorial
              </Button>

              {currentStepData.action ? (
                <Button size="sm" onClick={currentStepData.action.onClick}>
                  {currentStepData.action.label}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : isLastStep ? (
                <Button size="sm" onClick={handleComplete}>
                  Get Started
                  <CheckCircle2 className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() =>
                    setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1))
                  }
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hook to manually trigger onboarding
export function useOnboarding() {
  const resetOnboarding = () => {
    localStorage.removeItem(ONBOARDING_COMPLETED_KEY);
    window.location.reload();
  };

  return { resetOnboarding };
}
