import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { Loader2, Settings, TrendingUp, Brain, Heart, Bell } from "lucide-react";

export default function MatchingPreferences() {
  const { user, loading: authLoading } = useAuth();
  const { data: preferences, isLoading, refetch } = trpc.matchingPreferences.get.useQuery(undefined, {
    enabled: !!user,
  });
  const updatePreferences = trpc.matchingPreferences.update.useMutation({
    onSuccess: () => {
      toast.success("Matching preferences updated successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to update preferences: ${error.message}`);
    },
  });

  const [technicalWeight, setTechnicalWeight] = useState(40);
  const [cultureWeight, setCultureWeight] = useState(30);
  const [wellbeingWeight, setWellbeingWeight] = useState(30);
  const [minOverallScore, setMinOverallScore] = useState(60);
  const [minTechnicalScore, setMinTechnicalScore] = useState(50);
  const [minCultureScore, setMinCultureScore] = useState(50);
  const [minWellbeingScore, setMinWellbeingScore] = useState(50);
  const [enableAutoNotifications, setEnableAutoNotifications] = useState(true);
  const [notificationFrequency, setNotificationFrequency] = useState<"immediate" | "daily_digest" | "weekly_digest">("daily_digest");

  // Load preferences when data is available
  useEffect(() => {
    if (preferences) {
      setTechnicalWeight(preferences.technicalWeight);
      setCultureWeight(preferences.cultureWeight);
      setWellbeingWeight(preferences.wellbeingWeight);
      setMinOverallScore(preferences.minOverallMatchScore);
      setMinTechnicalScore(preferences.minTechnicalScore);
      setMinCultureScore(preferences.minCultureScore);
      setMinWellbeingScore(preferences.minWellbeingScore);
      setEnableAutoNotifications(preferences.enableAutoNotifications);
      setNotificationFrequency(preferences.notificationFrequency);
    }
  }, [preferences]);

  // Auto-adjust weights to sum to 100
  const handleWeightChange = (type: "technical" | "culture" | "wellbeing", value: number) => {
    const newWeights = { technical: technicalWeight, culture: cultureWeight, wellbeing: wellbeingWeight };
    newWeights[type] = value;

    // Calculate remaining weight
    const total = newWeights.technical + newWeights.culture + newWeights.wellbeing;
    if (total !== 100) {
      // Distribute difference proportionally to other weights
      const diff = 100 - total;
      const others = Object.entries(newWeights).filter(([k]) => k !== type);
      const otherTotal = others.reduce((sum, [, v]) => sum + v, 0);

      if (otherTotal > 0) {
        others.forEach(([key]) => {
          const proportion = newWeights[key as keyof typeof newWeights] / otherTotal;
          newWeights[key as keyof typeof newWeights] = Math.max(0, Math.round(newWeights[key as keyof typeof newWeights] + diff * proportion));
        });
      }
    }

    setTechnicalWeight(newWeights.technical);
    setCultureWeight(newWeights.culture);
    setWellbeingWeight(newWeights.wellbeing);
  };

  const handleSave = () => {
    // Validate weights sum to 100
    const totalWeight = technicalWeight + cultureWeight + wellbeingWeight;
    if (totalWeight !== 100) {
      toast.error(`Weights must sum to 100% (currently ${totalWeight}%)`);
      return;
    }

    updatePreferences.mutate({
      technicalWeight,
      cultureWeight,
      wellbeingWeight,
      minOverallMatchScore: minOverallScore,
      minTechnicalScore,
      minCultureScore,
      minWellbeingScore,
      enableAutoNotifications,
      notificationFrequency,
    });
  };

  if (authLoading || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <p>Please log in to access matching preferences.</p>
        </div>
      </DashboardLayout>
    );
  }

  const totalWeight = technicalWeight + cultureWeight + wellbeingWeight;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Settings className="h-8 w-8" />
              Matching Preferences
            </h1>
            <p className="text-muted-foreground mt-2">
              Customize how candidates are matched to your job postings
            </p>
          </div>
          <Button onClick={handleSave} disabled={updatePreferences.isPending || totalWeight !== 100}>
            {updatePreferences.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Preferences"
            )}
          </Button>
        </div>

        {/* Matching Weights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Matching Weights
            </CardTitle>
            <CardDescription>
              Adjust the importance of each matching dimension. Weights must sum to 100%.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className={`p-4 rounded-lg ${totalWeight === 100 ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
              <p className={`text-sm font-medium ${totalWeight === 100 ? "text-green-800" : "text-red-800"}`}>
                Total Weight: {totalWeight}% {totalWeight === 100 ? "✓" : `(${totalWeight > 100 ? "+" : ""}${totalWeight - 100}%)`}
              </p>
            </div>

            {/* Technical Skills Weight */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-blue-600" />
                  Technical Skills Weight
                </Label>
                <span className="text-sm font-medium">{technicalWeight}%</span>
              </div>
              <Slider
                value={[technicalWeight]}
                onValueChange={([value]) => handleWeightChange("technical", value)}
                min={0}
                max={100}
                step={5}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                How much technical skills and experience matter in candidate matching
              </p>
            </div>

            {/* Culture Fit Weight */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-purple-600" />
                  Culture Fit Weight
                </Label>
                <span className="text-sm font-medium">{cultureWeight}%</span>
              </div>
              <Slider
                value={[cultureWeight]}
                onValueChange={([value]) => handleWeightChange("culture", value)}
                min={0}
                max={100}
                step={5}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                How much cultural alignment and work style compatibility matter
              </p>
            </div>

            {/* Wellbeing Compatibility Weight */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-red-600" />
                  Wellbeing Compatibility Weight
                </Label>
                <span className="text-sm font-medium">{wellbeingWeight}%</span>
              </div>
              <Slider
                value={[wellbeingWeight]}
                onValueChange={([value]) => handleWeightChange("wellbeing", value)}
                min={0}
                max={100}
                step={5}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                How much work-life balance and wellbeing needs matter
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Minimum Score Thresholds */}
        <Card>
          <CardHeader>
            <CardTitle>Minimum Score Thresholds</CardTitle>
            <CardDescription>
              Set minimum scores for automated candidate notifications and filtering
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Overall Match Score */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Minimum Overall Match Score</Label>
                <span className="text-sm font-medium">{minOverallScore}%</span>
              </div>
              <Slider
                value={[minOverallScore]}
                onValueChange={([value]) => setMinOverallScore(value)}
                min={0}
                max={100}
                step={5}
                className="w-full"
              />
            </div>

            {/* Technical Score */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Minimum Technical Score</Label>
                <span className="text-sm font-medium">{minTechnicalScore}%</span>
              </div>
              <Slider
                value={[minTechnicalScore]}
                onValueChange={([value]) => setMinTechnicalScore(value)}
                min={0}
                max={100}
                step={5}
                className="w-full"
              />
            </div>

            {/* Culture Score */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Minimum Culture Fit Score</Label>
                <span className="text-sm font-medium">{minCultureScore}%</span>
              </div>
              <Slider
                value={[minCultureScore]}
                onValueChange={([value]) => setMinCultureScore(value)}
                min={0}
                max={100}
                step={5}
                className="w-full"
              />
            </div>

            {/* Wellbeing Score */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Minimum Wellbeing Score</Label>
                <span className="text-sm font-medium">{minWellbeingScore}%</span>
              </div>
              <Slider
                value={[minWellbeingScore]}
                onValueChange={([value]) => setMinWellbeingScore(value)}
                min={0}
                max={100}
                step={5}
                className="w-full"
              />
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Settings
            </CardTitle>
            <CardDescription>
              Configure how you receive candidate match notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Automated Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications when candidates meet your matching criteria
                </p>
              </div>
              <Switch
                checked={enableAutoNotifications}
                onCheckedChange={setEnableAutoNotifications}
              />
            </div>

            {enableAutoNotifications && (
              <div className="space-y-2">
                <Label>Notification Frequency</Label>
                <Select
                  value={notificationFrequency}
                  onValueChange={(value: "immediate" | "daily_digest" | "weekly_digest") =>
                    setNotificationFrequency(value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Immediate (real-time)</SelectItem>
                    <SelectItem value="daily_digest">Daily Digest</SelectItem>
                    <SelectItem value="weekly_digest">Weekly Digest</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  How often you want to receive candidate match notifications
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
