import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { toast } from "sonner";

export default function CalendarSettings() {
  const [provider, setProvider] = useState<"google" | "outlook">("google");
  const [outlookEmail, setOutlookEmail] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch current settings
  const { data: settings, isLoading, refetch } = trpc.calendarSettings.getSettings.useQuery();

  // Update provider mutation
  const updateMutation = trpc.calendarSettings.updateProvider.useMutation({
    onSuccess: () => {
      toast.success("Calendar settings updated successfully!");
      setHasChanges(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to update settings: ${error.message}`);
    },
  });

  // Initialize form with current settings
  useEffect(() => {
    if (settings) {
      setProvider(settings.provider || "google");
      setOutlookEmail(settings.outlookUserId || "");
    }
  }, [settings]);

  // Track changes
  useEffect(() => {
    if (!settings) return;
    
    const providerChanged = provider !== settings.provider;
    const emailChanged = provider === "outlook" && outlookEmail !== (settings.outlookUserId || "");
    
    setHasChanges(providerChanged || emailChanged);
  }, [provider, outlookEmail, settings]);

  const handleSave = () => {
    if (provider === "outlook" && !outlookEmail) {
      toast.error("Please enter your Outlook email address");
      return;
    }

    updateMutation.mutate({
      provider,
      outlookUserId: provider === "outlook" ? outlookEmail : undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="container max-w-4xl py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Calendar className="h-8 w-8 text-primary" />
          Calendar Settings
        </h1>
        <p className="text-muted-foreground mt-2">
          Configure your calendar integration for interview scheduling and availability checking.
        </p>
      </div>

      {/* Available Providers Info */}
      {settings && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Available Calendar Providers</AlertTitle>
          <AlertDescription>
            <div className="mt-2 space-y-1">
              {settings.availableProviders.includes("google") && (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Google Calendar (via MCP integration)</span>
                </div>
              )}
              {settings.isOutlookConfigured ? (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Outlook Calendar (via Microsoft Graph API)</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <span className="text-muted-foreground">
                    Outlook Calendar (not configured - contact administrator)
                  </span>
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Calendar Provider Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Calendar Provider</CardTitle>
          <CardDescription>
            Select which calendar service to use for interview scheduling and availability checking.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <RadioGroup value={provider} onValueChange={(v) => setProvider(v as "google" | "outlook")}>
            {/* Google Calendar Option */}
            <div className="flex items-start space-x-3 space-y-0">
              <RadioGroupItem value="google" id="google" />
              <div className="flex-1">
                <Label htmlFor="google" className="font-medium cursor-pointer flex items-center gap-2">
                  Google Calendar
                  {settings?.provider === "google" && (
                    <Badge variant="secondary">Current</Badge>
                  )}
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Use your Google Calendar for interview scheduling. Automatically syncs with your Google account.
                </p>
              </div>
            </div>

            {/* Outlook Calendar Option */}
            <div className="flex items-start space-x-3 space-y-0">
              <RadioGroupItem 
                value="outlook" 
                id="outlook" 
                disabled={!settings?.isOutlookConfigured}
              />
              <div className="flex-1">
                <Label 
                  htmlFor="outlook" 
                  className={`font-medium cursor-pointer flex items-center gap-2 ${
                    !settings?.isOutlookConfigured ? 'text-muted-foreground' : ''
                  }`}
                >
                  Outlook Calendar
                  {settings?.provider === "outlook" && (
                    <Badge variant="secondary">Current</Badge>
                  )}
                  {!settings?.isOutlookConfigured && (
                    <Badge variant="outline">Not Available</Badge>
                  )}
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Use your Microsoft Outlook/Office 365 calendar for interview scheduling.
                  {!settings?.isOutlookConfigured && (
                    <span className="block mt-1 text-amber-600">
                      Outlook integration is not configured. Please contact your system administrator.
                    </span>
                  )}
                </p>
              </div>
            </div>
          </RadioGroup>

          {/* Outlook Email Configuration */}
          {provider === "outlook" && settings?.isOutlookConfigured && (
            <div className="space-y-2 pt-4 border-t">
              <Label htmlFor="outlookEmail">Outlook Email Address</Label>
              <Input
                id="outlookEmail"
                type="email"
                placeholder="your.email@company.com"
                value={outlookEmail}
                onChange={(e) => setOutlookEmail(e.target.value)}
                className="max-w-md"
              />
              <p className="text-sm text-muted-foreground">
                Enter the email address associated with your Outlook/Office 365 account.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle>How Calendar Integration Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                1
              </div>
              <div>
                <h4 className="font-medium">Automatic Availability Checking</h4>
                <p className="text-sm text-muted-foreground">
                  When scheduling interviews, the system checks your calendar for conflicts in real-time.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                2
              </div>
              <div>
                <h4 className="font-medium">Smart Time Slot Suggestions</h4>
                <p className="text-sm text-muted-foreground">
                  If conflicts are detected, the system suggests alternative time slots based on your availability.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                3
              </div>
              <div>
                <h4 className="font-medium">Calendar Event Creation</h4>
                <p className="text-sm text-muted-foreground">
                  Interview invitations are automatically added to your calendar with all relevant details.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => {
            if (settings) {
              setProvider(settings.provider || "google");
              setOutlookEmail(settings.outlookUserId || "");
              setHasChanges(false);
            }
          }}
          disabled={!hasChanges}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={!hasChanges || updateMutation.isPending}
        >
          {updateMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
