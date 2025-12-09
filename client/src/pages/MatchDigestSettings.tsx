import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Mail, Clock, TrendingUp, Users, Save } from "lucide-react";

export default function MatchDigestSettings() {
  const [enabled, setEnabled] = useState(true);
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "biweekly">("daily");
  const [deliveryTime, setDeliveryTime] = useState("08:00");
  const [minMatchScore, setMinMatchScore] = useState(70);
  const [maxMatchesPerDigest, setMaxMatchesPerDigest] = useState(10);
  const [includeNewCandidates, setIncludeNewCandidates] = useState(true);
  const [includeScoreChanges, setIncludeScoreChanges] = useState(true);
  const [includeSavedMatches, setIncludeSavedMatches] = useState(true);

  // Fetch current preferences
  const { data: preferences, isLoading } = trpc.matchNotifications.getDigestPreferences.useQuery();

  // Update preferences mutation
  const updateMutation = trpc.matchNotifications.updateDigestPreferences.useMutation({
    onSuccess: () => {
      toast.success("Match digest preferences updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update preferences: " + error.message);
    },
  });

  // Load preferences into state
  useEffect(() => {
    if (preferences) {
      setEnabled(!!preferences.enabled);
      setFrequency(preferences.frequency);
      setDeliveryTime(preferences.deliveryTime);
      setMinMatchScore(preferences.minMatchScore);
      setMaxMatchesPerDigest(preferences.maxMatchesPerDigest);
      setIncludeNewCandidates(!!preferences.includeNewCandidates);
      setIncludeScoreChanges(!!preferences.includeScoreChanges);
      setIncludeSavedMatches(!!preferences.includeSavedMatches);
    }
  }, [preferences]);

  const handleSave = () => {
    updateMutation.mutate({
      enabled,
      frequency,
      deliveryTime,
      minMatchScore,
      maxMatchesPerDigest,
      includeNewCandidates,
      includeScoreChanges,
      includeSavedMatches,
    });
  };

  if (isLoading) {
    return (
      <div className="container py-8 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Match Digest Settings</h1>
        <p className="text-muted-foreground mt-2">
          Configure your daily email digest for AI-matched candidates
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Main Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Digest Configuration
            </CardTitle>
            <CardDescription>
              Receive regular updates about top candidate matches
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Enable/Disable */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enabled">Enable Match Digest</Label>
                <p className="text-sm text-muted-foreground">
                  Receive email summaries of matched candidates
                </p>
              </div>
              <Switch id="enabled" checked={enabled} onCheckedChange={setEnabled} />
            </div>

            {/* Frequency */}
            <div className="space-y-2">
              <Label htmlFor="frequency" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Delivery Frequency
              </Label>
              <Select value={frequency} onValueChange={(value: any) => setFrequency(value)} disabled={!enabled}>
                <SelectTrigger id="frequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly (Monday)</SelectItem>
                  <SelectItem value="biweekly">Bi-weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Delivery Time */}
            <div className="space-y-2">
              <Label htmlFor="deliveryTime">Delivery Time</Label>
              <Select value={deliveryTime} onValueChange={setDeliveryTime} disabled={!enabled}>
                <SelectTrigger id="deliveryTime">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="06:00">6:00 AM</SelectItem>
                  <SelectItem value="08:00">8:00 AM</SelectItem>
                  <SelectItem value="10:00">10:00 AM</SelectItem>
                  <SelectItem value="12:00">12:00 PM</SelectItem>
                  <SelectItem value="14:00">2:00 PM</SelectItem>
                  <SelectItem value="16:00">4:00 PM</SelectItem>
                  <SelectItem value="18:00">6:00 PM</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Time is in your local timezone</p>
            </div>

            {/* Min Match Score */}
            <div className="space-y-2">
              <Label htmlFor="minScore" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Minimum Match Score: {minMatchScore}%
              </Label>
              <Slider
                id="minScore"
                min={50}
                max={95}
                step={5}
                value={[minMatchScore]}
                onValueChange={(value) => setMinMatchScore(value[0])}
                disabled={!enabled}
                className="py-4"
              />
              <p className="text-xs text-muted-foreground">
                Only include candidates with match scores above this threshold
              </p>
            </div>

            {/* Max Matches */}
            <div className="space-y-2">
              <Label htmlFor="maxMatches" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Maximum Matches per Digest: {maxMatchesPerDigest}
              </Label>
              <Slider
                id="maxMatches"
                min={5}
                max={50}
                step={5}
                value={[maxMatchesPerDigest]}
                onValueChange={(value) => setMaxMatchesPerDigest(value[0])}
                disabled={!enabled}
                className="py-4"
              />
              <p className="text-xs text-muted-foreground">
                Limit the number of candidates included in each digest
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Content Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Content Filters</CardTitle>
            <CardDescription>Choose what to include in your digest</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="includeNew">New Candidates</Label>
                <p className="text-sm text-muted-foreground">
                  Include newly matched candidates since last digest
                </p>
              </div>
              <Switch
                id="includeNew"
                checked={includeNewCandidates}
                onCheckedChange={setIncludeNewCandidates}
                disabled={!enabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="includeChanges">Score Changes</Label>
                <p className="text-sm text-muted-foreground">
                  Include candidates with improved match scores
                </p>
              </div>
              <Switch
                id="includeChanges"
                checked={includeScoreChanges}
                onCheckedChange={setIncludeScoreChanges}
                disabled={!enabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="includeSaved">Saved Matches</Label>
                <p className="text-sm text-muted-foreground">
                  Include updates on candidates you've saved
                </p>
              </div>
              <Switch
                id="includeSaved"
                checked={includeSavedMatches}
                onCheckedChange={setIncludeSavedMatches}
                disabled={!enabled}
              />
            </div>

            {/* Preview Section */}
            <div className="pt-4 border-t">
              <h4 className="font-semibold mb-2">Digest Preview</h4>
              <div className="bg-muted p-4 rounded-lg text-sm space-y-2">
                <p>
                  <strong>Subject:</strong> Your {frequency} Match Digest - {maxMatchesPerDigest} Top
                  Candidates
                </p>
                <p>
                  <strong>Delivery:</strong> {frequency === "daily" ? "Every day" : frequency === "weekly" ? "Every Monday" : "Every other Monday"} at {deliveryTime}
                </p>
                <p>
                  <strong>Content:</strong> Candidates with {minMatchScore}%+ match score
                </p>
                {!enabled && (
                  <p className="text-orange-600 font-semibold">⚠️ Digest is currently disabled</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={updateMutation.isPending} size="lg">
          <Save className="h-4 w-4 mr-2" />
          {updateMutation.isPending ? "Saving..." : "Save Preferences"}
        </Button>
      </div>
    </div>
  );
}
