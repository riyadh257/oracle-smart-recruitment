import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  HelpCircle,
  BookOpen,
  Video,
  MessageSquare,
  ExternalLink,
  Play,
  CheckCircle2,
  Smartphone,
  Calendar,
  Bell,
} from "lucide-react";
import { OnboardingTutorial } from "@/components/OnboardingTutorial";

export default function Help() {
  const [showTutorial, setShowTutorial] = useState(false);

  const handleReplayTutorial = () => {
    // Clear the onboarding completed flag to allow replay
    localStorage.removeItem("oracle-onboarding-completed");
    setShowTutorial(true);
    // Force re-render by toggling state
    setTimeout(() => {
      setShowTutorial(false);
      // Reload to trigger the tutorial
      window.location.reload();
    }, 100);
  };

  const quickGuides = [
    {
      title: "Getting Started",
      description: "Learn the basics of Oracle Smart Recruitment",
      icon: BookOpen,
      topics: [
        "Creating your first job posting",
        "Adding candidates to the system",
        "Understanding the dashboard",
        "Navigating the interface",
      ],
    },
    {
      title: "Interview Management",
      description: "Master the interview scheduling and feedback process",
      icon: Calendar,
      topics: [
        "Scheduling bulk interviews",
        "Using feedback templates",
        "Submitting interview feedback",
        "Accessing mobile feedback forms via QR codes",
      ],
    },
    {
      title: "Notifications & Alerts",
      description: "Stay informed with real-time updates",
      icon: Bell,
      topics: [
        "Configuring notification preferences",
        "Setting up push notifications",
        "Managing quiet hours",
        "Understanding notification priorities",
      ],
    },
    {
      title: "Mobile App",
      description: "Use Oracle on the go",
      icon: Smartphone,
      topics: [
        "Installing the PWA on iOS",
        "Installing the PWA on Android",
        "Offline feedback submission",
        "Syncing data across devices",
      ],
    },
  ];

  const supportResources = [
    {
      title: "Video Tutorials",
      description: "Watch step-by-step guides",
      icon: Video,
      action: "Coming Soon",
      disabled: true,
    },
    {
      title: "Documentation",
      description: "Read detailed feature guides",
      icon: BookOpen,
      action: "Coming Soon",
      disabled: true,
    },
    {
      title: "Contact Support",
      description: "Get help from our team",
      icon: MessageSquare,
      action: "Coming Soon",
      disabled: true,
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      {showTutorial && <OnboardingTutorial />}

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Help & Tutorial</h1>
        <p className="text-muted-foreground mt-2">
          Learn how to make the most of Oracle Smart Recruitment System
        </p>
      </div>

      {/* Interactive Tutorial Section */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5 text-primary" />
                Interactive Onboarding Tutorial
              </CardTitle>
              <CardDescription>
                Walk through the essential setup steps for Oracle Smart Recruitment
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            <div className="flex items-start gap-3 text-sm">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Install the Mobile App</p>
                <p className="text-muted-foreground">
                  Add Oracle to your home screen for quick access
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Connect Your Calendar</p>
                <p className="text-muted-foreground">
                  Sync with Google or Outlook for smart scheduling
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Set Up Notifications</p>
                <p className="text-muted-foreground">
                  Configure alerts to stay informed about recruitment events
                </p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Takes about 3 minutes to complete
            </p>
            <Button onClick={handleReplayTutorial} className="gap-2">
              <Play className="h-4 w-4" />
              Start Tutorial
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Guides */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Quick Guides</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Browse topics to learn specific features
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {quickGuides.map((guide) => (
            <Card key={guide.title}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <guide.icon className="h-5 w-5 text-primary" />
                  {guide.title}
                </CardTitle>
                <CardDescription>{guide.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {guide.topics.map((topic) => (
                    <li key={topic} className="flex items-start gap-2 text-sm">
                      <span className="text-primary mt-1">•</span>
                      <span className="text-muted-foreground">{topic}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Support Resources */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Support Resources
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Additional ways to get help
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {supportResources.map((resource) => (
            <Card key={resource.title} className={resource.disabled ? "opacity-60" : ""}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <resource.icon className="h-5 w-5 text-primary" />
                  {resource.title}
                </CardTitle>
                <CardDescription>{resource.description}</CardDescription>
              </CardHeader>
              <CardContent>
                {resource.disabled ? (
                  <Badge variant="secondary" className="text-xs">
                    {resource.action}
                  </Badge>
                ) : (
                  <Button variant="outline" size="sm" className="gap-2 w-full">
                    {resource.action}
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            Frequently Asked Questions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <p className="font-medium text-sm">
                How do I reset my notification preferences?
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Navigate to Notification Settings from the sidebar and adjust your
                preferences. Changes are saved automatically.
              </p>
            </div>
            <Separator />
            <div>
              <p className="font-medium text-sm">
                Can I use Oracle offline?
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Yes! Install the PWA and you can view candidate data and submit
                interview feedback offline. Data will sync when you're back online.
              </p>
            </div>
            <Separator />
            <div>
              <p className="font-medium text-sm">
                How do I connect multiple calendar accounts?
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Go to Calendar Settings and add both Google and Outlook calendars.
                The system will check availability across all connected calendars.
              </p>
            </div>
            <Separator />
            <div>
              <p className="font-medium text-sm">
                What browsers are supported?
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Oracle works best on modern browsers: Chrome, Safari, Firefox, and
                Edge. For PWA installation, use Safari on iOS or Chrome on Android.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
