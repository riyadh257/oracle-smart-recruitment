import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Users, TrendingUp, BarChart3, PieChart, Plus } from "lucide-react";
import { toast } from "sonner";

export default function DiversityDashboard() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [candidateId, setCandidateId] = useState("");
  const [jobId, setJobId] = useState("");
  const [gender, setGender] = useState("");
  const [ethnicity, setEthnicity] = useState("");
  const [ageRange, setAgeRange] = useState("");
  const [stage, setStage] = useState<string>("applied");

  const { data: analytics, refetch } = trpc.diversityAnalytics.getAnalytics.useQuery();
  const { data: metrics } = trpc.diversityAnalytics.getMetrics.useQuery();
  const { data: jobs } = trpc.jobs.list.useQuery();
  
  const createMetricMutation = trpc.diversityAnalytics.create.useMutation();

  const handleCreateMetric = async () => {
    try {
      await createMetricMutation.mutateAsync({
        candidateId: candidateId ? parseInt(candidateId) : undefined,
        jobId: jobId ? parseInt(jobId) : undefined,
        gender: gender || undefined,
        ethnicity: ethnicity || undefined,
        ageRange: ageRange || undefined,
        stage: stage as any,
      });
      toast.success("Diversity metric added successfully");
      setIsDialogOpen(false);
      refetch();
      setCandidateId("");
      setJobId("");
      setGender("");
      setEthnicity("");
      setAgeRange("");
      setStage("applied");
    } catch (error) {
      toast.error("Failed to add diversity metric");
    }
  };

  const calculatePercentage = (count: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((count / total) * 100);
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Diversity & Inclusion Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Track and improve hiring equity metrics across your organization
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Diversity Data
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Diversity Metric</DialogTitle>
                <DialogDescription>
                  Record diversity information for a candidate (all fields optional except stage)
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="candidateId">Candidate ID</Label>
                  <Input
                    id="candidateId"
                    type="number"
                    value={candidateId}
                    onChange={(e) => setCandidateId(e.target.value)}
                    placeholder="Enter candidate ID"
                  />
                </div>

                <div>
                  <Label htmlFor="jobId">Job ID</Label>
                  <Input
                    id="jobId"
                    type="number"
                    value={jobId}
                    onChange={(e) => setJobId(e.target.value)}
                    placeholder="Enter job ID"
                  />
                </div>

                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={gender} onValueChange={setGender}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Prefer not to say</SelectItem>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Non-binary">Non-binary</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="ethnicity">Ethnicity</Label>
                  <Select value={ethnicity} onValueChange={setEthnicity}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select ethnicity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Prefer not to say</SelectItem>
                      <SelectItem value="Asian">Asian</SelectItem>
                      <SelectItem value="Black or African American">Black or African American</SelectItem>
                      <SelectItem value="Hispanic or Latino">Hispanic or Latino</SelectItem>
                      <SelectItem value="White">White</SelectItem>
                      <SelectItem value="Native American">Native American</SelectItem>
                      <SelectItem value="Pacific Islander">Pacific Islander</SelectItem>
                      <SelectItem value="Two or more races">Two or more races</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="ageRange">Age Range</Label>
                  <Select value={ageRange} onValueChange={setAgeRange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select age range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Prefer not to say</SelectItem>
                      <SelectItem value="18-24">18-24</SelectItem>
                      <SelectItem value="25-34">25-34</SelectItem>
                      <SelectItem value="35-44">35-44</SelectItem>
                      <SelectItem value="45-54">45-54</SelectItem>
                      <SelectItem value="55-64">55-64</SelectItem>
                      <SelectItem value="65+">65+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="stage">Stage *</Label>
                  <Select value={stage} onValueChange={setStage}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select stage" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="applied">Applied</SelectItem>
                      <SelectItem value="screened">Screened</SelectItem>
                      <SelectItem value="interviewed">Interviewed</SelectItem>
                      <SelectItem value="offered">Offered</SelectItem>
                      <SelectItem value="hired">Hired</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleCreateMetric}
                  disabled={createMetricMutation.isPending}
                  className="w-full"
                >
                  {createMetricMutation.isPending ? "Adding..." : "Add Metric"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                Total Candidates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{analytics?.totalCandidates || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                With diversity data
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <PieChart className="h-4 w-4 text-green-600" />
                Gender Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {analytics?.genderBreakdown ? Object.keys(analytics.genderBreakdown).length : 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Unique categories
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-purple-600" />
                Ethnicity Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {analytics?.ethnicityBreakdown ? Object.keys(analytics.ethnicityBreakdown).length : 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Unique categories
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Gender Distribution</CardTitle>
              <CardDescription>
                Breakdown of candidates by gender identity
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analytics?.genderBreakdown && Object.keys(analytics.genderBreakdown).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(analytics.genderBreakdown || {}).map(([gender, count]: [string, any]) => (
                    <div key={gender} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{gender || "Not specified"}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-muted-foreground">
                            {count} candidates
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <div
                          className="h-2 bg-blue-600 rounded"
                          style={{
                            width: `${calculatePercentage(count, analytics.totalCandidates)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No gender distribution data available
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ethnicity Distribution</CardTitle>
              <CardDescription>
                Breakdown of candidates by ethnic background
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analytics?.ethnicityBreakdown && Object.keys(analytics.ethnicityBreakdown).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(analytics.ethnicityBreakdown || {}).map(([ethnicity, count]: [string, any]) => (
                    <div key={ethnicity} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{ethnicity || "Not specified"}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-muted-foreground">
                            {count} candidates
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <div
                          className="h-2 bg-purple-600 rounded"
                          style={{
                            width: `${calculatePercentage(count, analytics.totalCandidates)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No ethnicity distribution data available
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Diversity Trends Over Time
            </CardTitle>
            <CardDescription>
              Monthly trends in candidate diversity and hiring outcomes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {metrics && Array.isArray(metrics) && metrics.length > 0 ? (
              <div className="space-y-3">
                {/* Diversity trends would come from a separate analytics endpoint */}
                <p className="text-muted-foreground text-center py-8">
                  Diversity trends visualization coming soon
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No diversity trends data available
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
