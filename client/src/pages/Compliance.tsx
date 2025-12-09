import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { 
  Loader2, 
  Shield, 
  TrendingUp, 
  Users, 
  Target, 
  AlertCircle, 
  CheckCircle,
  Info,
  Calendar,
  FileText,
  Award
} from "lucide-react";
import { toast } from "sonner";

export default function Compliance() {
  const { user, loading: authLoading } = useAuth();
  const [totalEmployees, setTotalEmployees] = useState("");
  const [saudiEmployees, setSaudiEmployees] = useState("");
  const [targetBand, setTargetBand] = useState<"platinum" | "green">("green");

  const utils = trpc.useUtils();

  // Fetch Nitaqat status
  const { data: nitaqatStatus, isLoading: nitaqatLoading } = trpc.ksaCompliance.nitaqat.getStatus.useQuery(
    { 
      totalEmployees: parseInt(totalEmployees) || 0,
      saudiEmployees: parseInt(saudiEmployees) || 0,
    },
    { enabled: !!totalEmployees && !!saudiEmployees }
  );

  // Fetch hiring plan
  const { data: hiringPlan, isLoading: hiringPlanLoading } = trpc.ksaCompliance.nitaqat.calculateHiringPlan.useQuery(
    {
      currentTotal: parseInt(totalEmployees) || 0,
      currentSaudi: parseInt(saudiEmployees) || 0,
      targetBand,
    },
    { enabled: !!totalEmployees && !!saudiEmployees }
  );

  const getBandColor = (band: string) => {
    switch (band) {
      case "platinum": return "text-purple-600 bg-purple-50 dark:bg-purple-950/20";
      case "green": return "text-green-600 bg-green-50 dark:bg-green-950/20";
      case "yellow": return "text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20";
      case "red": return "text-red-600 bg-red-50 dark:bg-red-950/20";
      default: return "text-gray-600 bg-gray-50 dark:bg-gray-950/20";
    }
  };

  const getBandIcon = (band: string) => {
    switch (band) {
      case "platinum":
      case "green":
        return <CheckCircle className="h-5 w-5" />;
      case "yellow":
        return <AlertCircle className="h-5 w-5" />;
      case "red":
        return <AlertCircle className="h-5 w-5" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              KSA Compliance Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">
              Nitaqat (Saudization) compliance tracking and workforce planning
            </p>
          </div>
        </div>

        {/* Workforce Input */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Current Workforce Composition
            </CardTitle>
            <CardDescription>
              Enter your current workforce numbers to calculate Nitaqat compliance status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="totalEmployees">Total Employees</Label>
                <Input
                  id="totalEmployees"
                  type="number"
                  placeholder="e.g., 100"
                  value={totalEmployees}
                  onChange={(e) => setTotalEmployees(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="saudiEmployees">Saudi Employees</Label>
                <Input
                  id="saudiEmployees"
                  type="number"
                  placeholder="e.g., 30"
                  value={saudiEmployees}
                  onChange={(e) => setSaudiEmployees(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="targetBand">Target Band</Label>
                <select
                  id="targetBand"
                  value={targetBand}
                  onChange={(e) => setTargetBand(e.target.value as any)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="green">Green (Compliant)</option>
                  <option value="platinum">Platinum (Excellent)</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Nitaqat Status */}
        {nitaqatStatus && (
          <Tabs defaultValue="status" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="status">Current Status</TabsTrigger>
              <TabsTrigger value="planning">Hiring Plan</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
            </TabsList>

            {/* Status Tab */}
            <TabsContent value="status" className="space-y-4">
              <Card className={getBandColor(nitaqatStatus.band)}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      {getBandIcon(nitaqatStatus.band)}
                      Nitaqat Band: {nitaqatStatus.band.toUpperCase()}
                    </CardTitle>
                    <Badge variant={nitaqatStatus.isCompliant ? "default" : "destructive"} className="text-lg px-4 py-1">
                      {nitaqatStatus.isCompliant ? "Compliant" : "Non-Compliant"}
                    </Badge>
                  </div>
                  <CardDescription className="text-base mt-2">
                    {nitaqatStatus.message}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Saudization Rate */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Saudization Rate</span>
                      <span className="text-2xl font-bold">{nitaqatStatus.saudizationRate.toFixed(1)}%</span>
                    </div>
                    <Progress value={nitaqatStatus.saudizationRate} className="h-3" />
                    <p className="text-xs text-muted-foreground">
                      {parseInt(saudiEmployees)} Saudi employees out of {parseInt(totalEmployees)} total employees
                    </p>
                  </div>

                  {/* Band Thresholds */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-red-500" />
                        <span className="text-xs font-medium">Red Band</span>
                      </div>
                      <p className="text-sm text-muted-foreground">Below threshold</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-yellow-500" />
                        <span className="text-xs font-medium">Yellow Band</span>
                      </div>
                      <p className="text-sm text-muted-foreground">Minimum compliance</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-green-500" />
                        <span className="text-xs font-medium">Green Band</span>
                      </div>
                      <p className="text-sm text-muted-foreground">Good compliance</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-purple-500" />
                        <span className="text-xs font-medium">Platinum Band</span>
                      </div>
                      <p className="text-sm text-muted-foreground">Excellent compliance</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Planning Tab */}
            <TabsContent value="planning" className="space-y-4">
              {hiringPlan && (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        Hiring Plan to Reach {targetBand.toUpperCase()} Band
                      </CardTitle>
                      <CardDescription>
                        Strategic workforce planning to achieve your Saudization goals
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {hiringPlan.saudiHiresNeeded > 0 ? (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Card className="bg-primary/5">
                              <CardContent className="pt-6">
                                <div className="text-center space-y-2">
                                  <Users className="h-8 w-8 mx-auto text-primary" />
                                  <div className="text-3xl font-bold text-primary">
                                    {hiringPlan.saudiHiresNeeded}
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    Saudi Hires Needed
                                  </p>
                                </div>
                              </CardContent>
                            </Card>

                            <Card className="bg-green-50 dark:bg-green-950/20">
                              <CardContent className="pt-6">
                                <div className="text-center space-y-2">
                                  <TrendingUp className="h-8 w-8 mx-auto text-green-600" />
                                  <div className="text-3xl font-bold text-green-600">
                                    {hiringPlan.projectedSaudizationRate.toFixed(1)}%
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    Projected Rate
                                  </p>
                                </div>
                              </CardContent>
                            </Card>

                            <Card className="bg-purple-50 dark:bg-purple-950/20">
                              <CardContent className="pt-6">
                                <div className="text-center space-y-2">
                                  <Award className="h-8 w-8 mx-auto text-purple-600" />
                                  <div className="text-2xl font-bold text-purple-600">
                                    {hiringPlan.projectedBand.toUpperCase()}
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    Target Band
                                  </p>
                                </div>
                              </CardContent>
                            </Card>
                          </div>

                          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
                            <div className="flex items-start gap-3">
                              <Info className="h-5 w-5 text-blue-600 dark:text-blue-500 mt-0.5 flex-shrink-0" />
                              <div className="space-y-2">
                                <h4 className="font-semibold text-sm text-blue-900 dark:text-blue-100">
                                  Hiring Recommendation
                                </h4>
                                <p className="text-sm text-blue-800 dark:text-blue-200">
                                  To reach the <strong>{targetBand.toUpperCase()}</strong> band, you need to hire{" "}
                                  <strong>{hiringPlan.saudiHiresNeeded}</strong> Saudi nationals. This will bring your
                                  Saudization rate from <strong>{nitaqatStatus.saudizationRate.toFixed(1)}%</strong> to{" "}
                                  <strong>{hiringPlan.projectedSaudizationRate.toFixed(1)}%</strong>.
                                </p>
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="p-8 text-center">
                          <CheckCircle className="h-12 w-12 mx-auto text-green-600 mb-4" />
                          <h3 className="text-lg font-semibold mb-2">Target Already Achieved!</h3>
                          <p className="text-muted-foreground">
                            Your current workforce composition already meets or exceeds the {targetBand.toUpperCase()} band requirements.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            {/* Insights Tab */}
            <TabsContent value="insights" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Compliance Insights & Best Practices
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-sm mb-1">Benefits of Higher Bands</h4>
                        <p className="text-sm text-muted-foreground">
                          Green and Platinum bands unlock benefits including easier work visa processing, 
                          priority in government contracts, and enhanced company reputation.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                      <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-sm mb-1">Consequences of Red Band</h4>
                        <p className="text-sm text-muted-foreground">
                          Red band status may result in restrictions on hiring foreign workers, 
                          penalties, and limitations on business operations in Saudi Arabia.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-sm mb-1">Strategic Workforce Planning</h4>
                        <p className="text-sm text-muted-foreground">
                          Use Oracle's AI Matching engine to identify qualified Saudi candidates who align 
                          with your culture and requirements, ensuring sustainable Saudization growth.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                      <Calendar className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-sm mb-1">Regular Monitoring</h4>
                        <p className="text-sm text-muted-foreground">
                          Nitaqat status is evaluated quarterly by MHRSD. Monitor your compliance regularly 
                          and plan hiring activities to maintain or improve your band status.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {/* Empty State */}
        {!totalEmployees || !saudiEmployees ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Shield className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Enter Workforce Data</h3>
              <p className="text-muted-foreground max-w-md">
                Enter your total employees and Saudi employees above to calculate your Nitaqat compliance status 
                and receive strategic hiring recommendations.
              </p>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </DashboardLayout>
  );
}
