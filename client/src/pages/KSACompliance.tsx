import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { Shield, AlertTriangle, CheckCircle2, Calendar, Clock, DollarSign, Users, TrendingUp } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function KSACompliance() {
  const { user, loading: authLoading } = useAuth();
  const [saudiCount, setSaudiCount] = useState("");
  const [nonSaudiCount, setNonSaudiCount] = useState("");
  const [targetBand, setTargetBand] = useState<"platinum" | "green">("green");
  
  // Probation calculator
  const [hireDate, setHireDate] = useState("");
  
  // Notice period calculator
  const [employmentStartDate, setEmploymentStartDate] = useState("");
  const [resignationDate, setResignationDate] = useState("");
  
  // Gratuity calculator
  const [employmentDuration, setEmploymentDuration] = useState("");
  const [monthlySalary, setMonthlySalary] = useState("");

  const utils = trpc.useUtils();

  // Fetch Nitaqat status
  const { data: nitaqatStatus } = trpc.ksaCompliance.nitaqat.getStatus.useQuery();

  // Calculate hiring plan
  const { data: hiringPlan, refetch: refetchHiringPlan } = 
    trpc.ksaCompliance.nitaqat.calculateHiringPlan.useQuery(
      {
        currentSaudi: parseInt(saudiCount) || 0,
        currentNonSaudi: parseInt(nonSaudiCount) || 0,
        targetBand,
      },
      { enabled: false }
    );

  // Probation calculation
  const { data: probationResult, refetch: refetchProbation } = 
    trpc.ksaCompliance.laborLaw.calculateProbationEnd.useQuery(
      { hireDate },
      { enabled: false }
    );

  // Notice period calculation
  const { data: noticeResult, refetch: refetchNotice } = 
    trpc.ksaCompliance.laborLaw.calculateNoticePeriod.useQuery(
      { 
        employmentStartDate,
        resignationDate,
      },
      { enabled: false }
    );

  // Gratuity calculation
  const { data: gratuityResult, refetch: refetchGratuity } = 
    trpc.ksaCompliance.laborLaw.calculateGratuity.useQuery(
      {
        yearsOfService: parseFloat(employmentDuration) || 0,
        monthlySalary: parseFloat(monthlySalary) || 0,
      },
      { enabled: false }
    );

  // Fetch holidays
  const { data: holidays } = trpc.ksaCompliance.localization.getSaudiHolidays.useQuery(
    { year: new Date().getFullYear() }
  );

  const getBandColor = (band: string) => {
    const colors: Record<string, string> = {
      platinum: "bg-purple-500",
      green: "bg-green-500",
      yellow: "bg-yellow-500",
      red: "bg-red-500",
    };
    return colors[band.toLowerCase()] || "bg-gray-500";
  };

  const getBandVariant = (band: string): "default" | "secondary" | "destructive" => {
    if (band.toLowerCase() === "red") return "destructive";
    if (band.toLowerCase() === "yellow") return "secondary";
    return "default";
  };

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">KSA Compliance</h1>
          <p className="text-muted-foreground">
            Monitor Nitaqat status and ensure labor law compliance
          </p>
        </div>

        <Tabs defaultValue="nitaqat" className="space-y-6">
          <TabsList>
            <TabsTrigger value="nitaqat">Nitaqat Dashboard</TabsTrigger>
            <TabsTrigger value="laborlaw">Labor Law Tools</TabsTrigger>
            <TabsTrigger value="calendar">Saudi Calendar</TabsTrigger>
          </TabsList>

          {/* Nitaqat Dashboard */}
          <TabsContent value="nitaqat" className="space-y-6">
            {/* Current Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Current Nitaqat Status
                </CardTitle>
                <CardDescription>
                  Your organization's current Saudization classification
                </CardDescription>
              </CardHeader>
              <CardContent>
                {nitaqatStatus ? (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-muted-foreground mb-2">Current Band</div>
                        <Badge 
                          variant={getBandVariant(nitaqatStatus.currentBand)}
                          className="text-lg px-4 py-2"
                        >
                          {nitaqatStatus.currentBand.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground mb-2">Saudization Rate</div>
                        <div className="text-3xl font-bold">
                          {nitaqatStatus.saudizationPercentage.toFixed(1)}%
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <div className="text-sm text-muted-foreground">Saudi Employees</div>
                        <div className="text-2xl font-bold text-green-600">
                          {nitaqatStatus.saudiCount}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm text-muted-foreground">Non-Saudi Employees</div>
                        <div className="text-2xl font-bold text-blue-600">
                          {nitaqatStatus.nonSaudiCount}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm text-muted-foreground">Total Workforce</div>
                        <div className="text-2xl font-bold">
                          {nitaqatStatus.totalEmployees}
                        </div>
                      </div>
                    </div>

                    {nitaqatStatus.currentBand === 'red' && (
                      <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                        <div>
                          <div className="font-semibold text-red-900">Action Required</div>
                          <div className="text-sm text-red-700">
                            Your organization is in the Red band. You may face restrictions on hiring 
                            non-Saudi workers and renewing work permits.
                          </div>
                        </div>
                      </div>
                    )}

                    {nitaqatStatus.currentBand === 'yellow' && (
                      <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                        <div>
                          <div className="font-semibold text-yellow-900">Warning</div>
                          <div className="text-sm text-yellow-700">
                            Your organization is in the Yellow band. Consider increasing Saudi hires 
                            to reach Green or Platinum status.
                          </div>
                        </div>
                      </div>
                    )}

                    {(nitaqatStatus.currentBand === 'green' || nitaqatStatus.currentBand === 'platinum') && (
                      <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                        <div>
                          <div className="font-semibold text-green-900">Compliant</div>
                          <div className="text-sm text-green-700">
                            Your organization meets Nitaqat requirements. Continue maintaining this status.
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No workforce data available. Update your employee counts below.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Visualizations */}
            {nitaqatStatus && (
              <div className="grid gap-6 md:grid-cols-2">
                {/* Workforce Composition Pie Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Workforce Composition
                    </CardTitle>
                    <CardDescription>
                      Saudi vs Non-Saudi employee distribution
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div style={{ height: '250px' }}>
                      <Doughnut
                        data={{
                          labels: ['Saudi Employees', 'Non-Saudi Employees'],
                          datasets: [
                            {
                              data: [nitaqatStatus.saudiCount, nitaqatStatus.nonSaudiCount],
                              backgroundColor: [
                                'rgba(34, 197, 94, 0.8)',
                                'rgba(59, 130, 246, 0.8)',
                              ],
                              borderColor: [
                                'rgb(34, 197, 94)',
                                'rgb(59, 130, 246)',
                              ],
                              borderWidth: 2,
                            },
                          ],
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'bottom' as const,
                            },
                          },
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Saudization Progress Gauge */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Saudization Progress
                    </CardTitle>
                    <CardDescription>
                      Current rate vs band thresholds
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="text-4xl font-bold">
                          {nitaqatStatus.saudizationPercentage.toFixed(1)}%
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          Current Saudization Rate
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Red Band</span>
                            <span className="text-red-600">0-20%</span>
                          </div>
                          <Progress value={20} className="h-2 bg-red-100" />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Yellow Band</span>
                            <span className="text-yellow-600">20-40%</span>
                          </div>
                          <Progress value={40} className="h-2 bg-yellow-100" />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Green Band</span>
                            <span className="text-green-600">40-60%</span>
                          </div>
                          <Progress value={60} className="h-2 bg-green-100" />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Platinum Band</span>
                            <span className="text-purple-600">60%+</span>
                          </div>
                          <Progress value={100} className="h-2 bg-purple-100" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Hiring Plan Calculator */}
            <Card>
              <CardHeader>
                <CardTitle>Hiring Plan Calculator</CardTitle>
                <CardDescription>
                  Calculate how many Saudi employees you need to reach your target band
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="saudiCount">Current Saudi Employees</Label>
                    <Input
                      id="saudiCount"
                      type="number"
                      value={saudiCount}
                      onChange={(e) => setSaudiCount(e.target.value)}
                      placeholder="e.g., 50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nonSaudiCount">Current Non-Saudi Employees</Label>
                    <Input
                      id="nonSaudiCount"
                      type="number"
                      value={nonSaudiCount}
                      onChange={(e) => setNonSaudiCount(e.target.value)}
                      placeholder="e.g., 100"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetBand">Target Band</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={targetBand === "green" ? "default" : "outline"}
                      onClick={() => setTargetBand("green")}
                      className="flex-1"
                    >
                      Green
                    </Button>
                    <Button
                      type="button"
                      variant={targetBand === "platinum" ? "default" : "outline"}
                      onClick={() => setTargetBand("platinum")}
                      className="flex-1"
                    >
                      Platinum
                    </Button>
                  </div>
                </div>

                <Button 
                  onClick={() => refetchHiringPlan()}
                  disabled={!saudiCount || !nonSaudiCount}
                  className="w-full"
                >
                  Calculate Hiring Plan
                </Button>

                {hiringPlan && (
                  <div className="mt-6 p-4 bg-muted rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Saudi Hires Needed:</span>
                      <span className="text-2xl font-bold text-primary">
                        {hiringPlan.saudiHiresNeeded}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Current Rate:</span>
                      <span>{hiringPlan.currentPercentage.toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Target Rate:</span>
                      <span>{hiringPlan.targetPercentage.toFixed(1)}%</span>
                    </div>
                    <Progress 
                      value={(hiringPlan.currentPercentage / hiringPlan.targetPercentage) * 100} 
                      className="h-2"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Labor Law Tools */}
          <TabsContent value="laborlaw" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Probation Period Calculator */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Probation Period
                  </CardTitle>
                  <CardDescription>
                    Calculate 90-day probation end date
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="hireDate">Hire Date</Label>
                    <Input
                      id="hireDate"
                      type="date"
                      value={hireDate}
                      onChange={(e) => setHireDate(e.target.value)}
                    />
                  </div>
                  <Button 
                    onClick={() => refetchProbation()}
                    disabled={!hireDate}
                    className="w-full"
                  >
                    Calculate
                  </Button>
                  {probationResult && (
                    <div className="p-4 bg-muted rounded-lg space-y-2">
                      <div className="text-sm text-muted-foreground">Probation Ends:</div>
                      <div className="text-lg font-bold">
                        {new Date(probationResult.probationEndDate).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {probationResult.daysRemaining} days remaining
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Notice Period Calculator */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Notice Period
                  </CardTitle>
                  <CardDescription>
                    Calculate required notice period
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="employmentStartDate">Employment Start Date</Label>
                    <Input
                      id="employmentStartDate"
                      type="date"
                      value={employmentStartDate}
                      onChange={(e) => setEmploymentStartDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="resignationDate">Resignation Date</Label>
                    <Input
                      id="resignationDate"
                      type="date"
                      value={resignationDate}
                      onChange={(e) => setResignationDate(e.target.value)}
                    />
                  </div>
                  <Button 
                    onClick={() => refetchNotice()}
                    disabled={!employmentStartDate || !resignationDate}
                    className="w-full"
                  >
                    Calculate
                  </Button>
                  {noticeResult && (
                    <div className="p-4 bg-muted rounded-lg space-y-2">
                      <div className="text-sm text-muted-foreground">Notice Period:</div>
                      <div className="text-lg font-bold">
                        {noticeResult.noticePeriodDays} days
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Last working day: {new Date(noticeResult.lastWorkingDay).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* End of Service Benefits Calculator */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    End of Service Benefits
                  </CardTitle>
                  <CardDescription>
                    Calculate gratuity payment
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="employmentDuration">Years of Service</Label>
                    <Input
                      id="employmentDuration"
                      type="number"
                      step="0.1"
                      value={employmentDuration}
                      onChange={(e) => setEmploymentDuration(e.target.value)}
                      placeholder="e.g., 5.5"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="monthlySalary">Monthly Salary (SAR)</Label>
                    <Input
                      id="monthlySalary"
                      type="number"
                      value={monthlySalary}
                      onChange={(e) => setMonthlySalary(e.target.value)}
                      placeholder="e.g., 10000"
                    />
                  </div>
                  <Button 
                    onClick={() => refetchGratuity()}
                    disabled={!employmentDuration || !monthlySalary}
                    className="w-full"
                  >
                    Calculate
                  </Button>
                  {gratuityResult && (
                    <div className="p-4 bg-muted rounded-lg space-y-2">
                      <div className="text-sm text-muted-foreground">Total Gratuity:</div>
                      <div className="text-2xl font-bold text-primary">
                        {gratuityResult.totalGratuity.toLocaleString()} SAR
                      </div>
                      <div className="text-xs text-muted-foreground mt-2">
                        Breakdown:
                      </div>
                      <div className="text-xs space-y-1">
                        <div>First 5 years: {gratuityResult.firstFiveYears.toLocaleString()} SAR</div>
                        <div>After 5 years: {gratuityResult.afterFiveYears.toLocaleString()} SAR</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Working Hours Compliance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Working Hours
                  </CardTitle>
                  <CardDescription>
                    KSA labor law working hours limits
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <span className="text-sm font-medium">Standard Week</span>
                      <span className="text-lg font-bold">48 hours</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <span className="text-sm font-medium">Ramadan (Daily)</span>
                      <span className="text-lg font-bold">6 hours</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <span className="text-sm font-medium">Ramadan (Weekly)</span>
                      <span className="text-lg font-bold">36 hours</span>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <p className="mb-2">
                      <strong>Note:</strong> These are maximum limits as per Saudi Labor Law.
                    </p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Overtime must be compensated at 150% of regular rate</li>
                      <li>Weekly rest day is mandatory (typically Friday)</li>
                      <li>Ramadan hours apply to all Muslim employees</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Saudi Calendar */}
          <TabsContent value="calendar" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Saudi National Holidays {new Date().getFullYear()}</CardTitle>
                <CardDescription>
                  Official public holidays in Saudi Arabia
                </CardDescription>
              </CardHeader>
              <CardContent>
                {holidays && holidays.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Holiday</TableHead>
                        <TableHead>Date (Gregorian)</TableHead>
                        <TableHead>Date (Hijri)</TableHead>
                        <TableHead>Type</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {holidays.map((holiday, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{holiday.name}</TableCell>
                          <TableCell>{new Date(holiday.gregorianDate).toLocaleDateString()}</TableCell>
                          <TableCell>{holiday.hijriDate}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{holiday.type}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No holiday data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Important Dates</CardTitle>
                <CardDescription>
                  Key compliance and reporting deadlines
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 border rounded-lg">
                    <Calendar className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <div className="font-medium">GOSI Reporting</div>
                      <div className="text-sm text-muted-foreground">
                        Monthly reporting deadline: 15th of each month
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 border rounded-lg">
                    <Calendar className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <div className="font-medium">Nitaqat Review</div>
                      <div className="text-sm text-muted-foreground">
                        Quarterly workforce composition review
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 border rounded-lg">
                    <Calendar className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <div className="font-medium">Work Permit Renewals</div>
                      <div className="text-sm text-muted-foreground">
                        Check Iqama expiry dates 60 days in advance
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
