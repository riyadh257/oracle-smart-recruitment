import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Briefcase, 
  Bell, 
  Shield, 
  X,
  Plus,
  MapPin,
  Building,
  DollarSign,
  Users,
  TrendingUp
} from "lucide-react";

/**
 * Profile Settings Page
 * Candidate-facing settings for job preferences, notifications, and privacy controls
 */

export default function ProfileSettings() {
  const { data: settings, isLoading } = trpc.profileSettings.getSettings.useQuery();
  const updateJobPrefs = trpc.profileSettings.updateJobPreferences.useMutation();
  const updateNotifications = trpc.profileSettings.updateNotificationSettings.useMutation();
  const updatePrivacy = trpc.profileSettings.updatePrivacySettings.useMutation();
  const utils = trpc.useUtils();

  // Job Preferences State
  const [industries, setIndustries] = useState<string[]>([]);
  const [companySizes, setCompanySizes] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [maxCommuteTime, setMaxCommuteTime] = useState<number | null>(null);
  const [benefits, setBenefits] = useState<string[]>([]);
  const [careerGoals, setCareerGoals] = useState<string>("");
  const [learningInterests, setLearningInterests] = useState<string[]>([]);
  const [workLifeBalance, setWorkLifeBalance] = useState(5);
  const [growthOpportunities, setGrowthOpportunities] = useState(5);
  const [teamSize, setTeamSize] = useState("any");
  const [managementStyle, setManagementStyle] = useState("any");

  // Notification Settings State
  const [notificationFrequency, setNotificationFrequency] = useState("daily");
  const [jobAlertEnabled, setJobAlertEnabled] = useState(true);
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(true);
  const [inAppNotificationsEnabled, setInAppNotificationsEnabled] = useState(true);

  // Privacy Settings State
  const [profileVisibility, setProfileVisibility] = useState("employers_only");
  const [allowDataSharing, setAllowDataSharing] = useState(true);

  // Input states for adding items
  const [newIndustry, setNewIndustry] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newBenefit, setNewBenefit] = useState("");
  const [newLearning, setNewLearning] = useState("");

  useEffect(() => {
    if (settings) {
      setIndustries(settings.preferredIndustries || []);
      setCompanySizes(settings.preferredCompanySizes || []);
      setLocations(settings.preferredLocations || []);
      setMaxCommuteTime(settings.maxCommuteTime);
      setBenefits(settings.desiredBenefits || []);
      setCareerGoals(settings.careerGoals || "");
      setLearningInterests(settings.learningInterests || []);
      setWorkLifeBalance(settings.workLifeBalance || 5);
      setGrowthOpportunities(settings.growthOpportunities || 5);
      setTeamSize(settings.teamSize || "any");
      setManagementStyle(settings.managementStyle || "any");
      setNotificationFrequency(settings.notificationFrequency || "daily");
      setJobAlertEnabled(settings.jobAlertEnabled ?? true);
      setEmailNotificationsEnabled(settings.emailNotificationsEnabled ?? true);
      setInAppNotificationsEnabled(settings.inAppNotificationsEnabled ?? true);
      setProfileVisibility(settings.profileVisibility || "employers_only");
      setAllowDataSharing(settings.allowDataSharing ?? true);
    }
  }, [settings]);

  const handleSaveJobPreferences = async () => {
    try {
      await updateJobPrefs.mutateAsync({
        preferredIndustries: industries,
        preferredCompanySizes: companySizes,
        preferredLocations: locations,
        maxCommuteTime,
        desiredBenefits: benefits,
        careerGoals: careerGoals || null,
        learningInterests,
        workLifeBalance,
        growthOpportunities,
        teamSize: teamSize as any,
        managementStyle: managementStyle as any,
      });
      
      utils.profileSettings.getSettings.invalidate();
      toast.success("Job preferences saved successfully");
    } catch (error) {
      toast.error("Failed to save job preferences");
    }
  };

  const handleSaveNotifications = async () => {
    try {
      await updateNotifications.mutateAsync({
        notificationFrequency: notificationFrequency as any,
        jobAlertEnabled,
        emailNotificationsEnabled,
        inAppNotificationsEnabled,
      });
      
      utils.profileSettings.getSettings.invalidate();
      toast.success("Notification settings saved successfully");
    } catch (error) {
      toast.error("Failed to save notification settings");
    }
  };

  const handleSavePrivacy = async () => {
    try {
      await updatePrivacy.mutateAsync({
        profileVisibility: profileVisibility as any,
        allowDataSharing,
      });
      
      utils.profileSettings.getSettings.invalidate();
      toast.success("Privacy settings saved successfully");
    } catch (error) {
      toast.error("Failed to save privacy settings");
    }
  };

  const addItem = (list: string[], setList: (items: string[]) => void, value: string, setValue: (v: string) => void) => {
    if (value.trim() && !list.includes(value.trim())) {
      setList([...list, value.trim()]);
      setValue("");
    }
  };

  const removeItem = (list: string[], setList: (items: string[]) => void, item: string) => {
    setList(list.filter(i => i !== item));
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 max-w-5xl">
        <Skeleton className="h-12 w-64 mb-6" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Profile Settings</h1>
        <p className="text-muted-foreground">
          Manage your job preferences, notifications, and privacy settings
        </p>
      </div>

      <Tabs defaultValue="job-preferences" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="job-preferences">
            <Briefcase className="h-4 w-4 mr-2" />
            Job Preferences
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="privacy">
            <Shield className="h-4 w-4 mr-2" />
            Privacy
          </TabsTrigger>
        </TabsList>

        {/* Job Preferences Tab */}
        <TabsContent value="job-preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Industries & Company Size</CardTitle>
              <CardDescription>
                Specify your preferred industries and company sizes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Preferred Industries</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    placeholder="Add industry (e.g., Technology, Healthcare)"
                    value={newIndustry}
                    onChange={(e) => setNewIndustry(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        addItem(industries, setIndustries, newIndustry, setNewIndustry);
                      }
                    }}
                  />
                  <Button 
                    size="icon" 
                    onClick={() => addItem(industries, setIndustries, newIndustry, setNewIndustry)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {industries.map((industry) => (
                    <Badge key={industry} variant="secondary">
                      {industry}
                      <button
                        onClick={() => removeItem(industries, setIndustries, industry)}
                        className="ml-2 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label>Preferred Company Sizes</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"].map((size) => (
                    <Button
                      key={size}
                      variant={companySizes.includes(size) ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        if (companySizes.includes(size)) {
                          setCompanySizes(companySizes.filter(s => s !== size));
                        } else {
                          setCompanySizes([...companySizes, size]);
                        }
                      }}
                    >
                      {size}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Location & Commute</CardTitle>
              <CardDescription>
                Set your preferred work locations and commute preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Preferred Locations</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    placeholder="Add location (e.g., San Francisco, Remote)"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        addItem(locations, setLocations, newLocation, setNewLocation);
                      }
                    }}
                  />
                  <Button 
                    size="icon" 
                    onClick={() => addItem(locations, setLocations, newLocation, setNewLocation)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {locations.map((location) => (
                    <Badge key={location} variant="secondary">
                      <MapPin className="h-3 w-3 mr-1" />
                      {location}
                      <button
                        onClick={() => removeItem(locations, setLocations, location)}
                        className="ml-2 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="commute">
                  Maximum Commute Time: {maxCommuteTime || 0} minutes
                </Label>
                <Input
                  id="commute"
                  type="range"
                  min="0"
                  max="180"
                  step="15"
                  value={maxCommuteTime || 0}
                  onChange={(e) => setMaxCommuteTime(parseInt(e.target.value))}
                  className="mt-2"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Work Preferences</CardTitle>
              <CardDescription>
                Define your ideal work environment and priorities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="teamSize">Preferred Team Size</Label>
                  <Select value={teamSize} onValueChange={setTeamSize}>
                    <SelectTrigger id="teamSize">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small (1-10)</SelectItem>
                      <SelectItem value="medium">Medium (11-50)</SelectItem>
                      <SelectItem value="large">Large (50+)</SelectItem>
                      <SelectItem value="any">Any Size</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="managementStyle">Management Style</Label>
                  <Select value={managementStyle} onValueChange={setManagementStyle}>
                    <SelectTrigger id="managementStyle">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hands_on">Hands-on</SelectItem>
                      <SelectItem value="autonomous">Autonomous</SelectItem>
                      <SelectItem value="collaborative">Collaborative</SelectItem>
                      <SelectItem value="any">Any Style</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="workLife">
                  Work-Life Balance Priority: {workLifeBalance}/10
                </Label>
                <Input
                  id="workLife"
                  type="range"
                  min="1"
                  max="10"
                  value={workLifeBalance}
                  onChange={(e) => setWorkLifeBalance(parseInt(e.target.value))}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="growth">
                  Growth Opportunities Priority: {growthOpportunities}/10
                </Label>
                <Input
                  id="growth"
                  type="range"
                  min="1"
                  max="10"
                  value={growthOpportunities}
                  onChange={(e) => setGrowthOpportunities(parseInt(e.target.value))}
                  className="mt-2"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Benefits & Career Goals</CardTitle>
              <CardDescription>
                Specify desired benefits and your career aspirations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Desired Benefits</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    placeholder="Add benefit (e.g., Health Insurance, 401k)"
                    value={newBenefit}
                    onChange={(e) => setNewBenefit(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        addItem(benefits, setBenefits, newBenefit, setNewBenefit);
                      }
                    }}
                  />
                  <Button 
                    size="icon" 
                    onClick={() => addItem(benefits, setBenefits, newBenefit, setNewBenefit)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {benefits.map((benefit) => (
                    <Badge key={benefit} variant="secondary">
                      {benefit}
                      <button
                        onClick={() => removeItem(benefits, setBenefits, benefit)}
                        className="ml-2 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="careerGoals">Career Goals</Label>
                <Textarea
                  id="careerGoals"
                  placeholder="Describe your career aspirations and goals..."
                  value={careerGoals}
                  onChange={(e) => setCareerGoals(e.target.value)}
                  rows={4}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Learning Interests</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    placeholder="Add skill or topic (e.g., Machine Learning)"
                    value={newLearning}
                    onChange={(e) => setNewLearning(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        addItem(learningInterests, setLearningInterests, newLearning, setNewLearning);
                      }
                    }}
                  />
                  <Button 
                    size="icon" 
                    onClick={() => addItem(learningInterests, setLearningInterests, newLearning, setNewLearning)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {learningInterests.map((interest) => (
                    <Badge key={interest} variant="secondary">
                      {interest}
                      <button
                        onClick={() => removeItem(learningInterests, setLearningInterests, interest)}
                        className="ml-2 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Button 
            onClick={handleSaveJobPreferences} 
            disabled={updateJobPrefs.isPending}
            className="w-full"
          >
            {updateJobPrefs.isPending ? "Saving..." : "Save Job Preferences"}
          </Button>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Control how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="frequency">Notification Frequency</Label>
                <Select value={notificationFrequency} onValueChange={setNotificationFrequency}>
                  <SelectTrigger id="frequency" className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Immediate</SelectItem>
                    <SelectItem value="daily">Daily Digest</SelectItem>
                    <SelectItem value="weekly">Weekly Summary</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="jobAlerts">Job Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified about new job matches
                    </p>
                  </div>
                  <Switch
                    id="jobAlerts"
                    checked={jobAlertEnabled}
                    onCheckedChange={setJobAlertEnabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="emailNotifs">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch
                    id="emailNotifs"
                    checked={emailNotificationsEnabled}
                    onCheckedChange={setEmailNotificationsEnabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="inAppNotifs">In-App Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Show notifications within the platform
                    </p>
                  </div>
                  <Switch
                    id="inAppNotifs"
                    checked={inAppNotificationsEnabled}
                    onCheckedChange={setInAppNotificationsEnabled}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Button 
            onClick={handleSaveNotifications} 
            disabled={updateNotifications.isPending}
            className="w-full"
          >
            {updateNotifications.isPending ? "Saving..." : "Save Notification Settings"}
          </Button>
        </TabsContent>

        {/* Privacy Tab */}
        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Controls</CardTitle>
              <CardDescription>
                Manage your profile visibility and data sharing preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="visibility">Profile Visibility</Label>
                <Select value={profileVisibility} onValueChange={setProfileVisibility}>
                  <SelectTrigger id="visibility" className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public - Visible to everyone</SelectItem>
                    <SelectItem value="employers_only">Employers Only - Visible to verified employers</SelectItem>
                    <SelectItem value="private">Private - Hidden from search</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground mt-2">
                  Control who can view your profile and contact you
                </p>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="dataSharing">Allow Data Sharing</Label>
                  <p className="text-sm text-muted-foreground">
                    Share anonymized data to improve matching algorithms
                  </p>
                </div>
                <Switch
                  id="dataSharing"
                  checked={allowDataSharing}
                  onCheckedChange={setAllowDataSharing}
                />
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Data Privacy Information</h4>
                <p className="text-sm text-muted-foreground">
                  Your personal information is always protected. We never share identifiable data
                  with third parties without your explicit consent. Anonymized data helps us improve
                  our matching algorithms to provide better job recommendations for all users.
                </p>
              </div>
            </CardContent>
          </Card>

          <Button 
            onClick={handleSavePrivacy} 
            disabled={updatePrivacy.isPending}
            className="w-full"
          >
            {updatePrivacy.isPending ? "Saving..." : "Save Privacy Settings"}
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}
