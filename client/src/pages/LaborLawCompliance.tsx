import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Calculator, Calendar, DollarSign, Clock, FileText, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function LaborLawCompliance() {
  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Calculator className="h-8 w-8 text-primary" />
            Labor Law Compliance Calculator
          </h1>
          <p className="text-muted-foreground">
            Calculate probation periods, notice periods, end-of-service benefits, and validate working hours according to KSA labor law
          </p>
        </div>

        <Tabs defaultValue="probation" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="probation">Probation</TabsTrigger>
            <TabsTrigger value="notice">Notice Period</TabsTrigger>
            <TabsTrigger value="gratuity">Gratuity</TabsTrigger>
            <TabsTrigger value="hours">Working Hours</TabsTrigger>
            <TabsTrigger value="leave">Annual Leave</TabsTrigger>
          </TabsList>

          <TabsContent value="probation">
            <ProbationCalculator />
          </TabsContent>

          <TabsContent value="notice">
            <NoticePeriodCalculator />
          </TabsContent>

          <TabsContent value="gratuity">
            <GratuityCalculator />
          </TabsContent>

          <TabsContent value="hours">
            <WorkingHoursValidator />
          </TabsContent>

          <TabsContent value="leave">
            <AnnualLeaveCalculator />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

function ProbationCalculator() {
  const [startDate, setStartDate] = useState<string>("");
  const calculateProbation = trpc.ksaCompliance.laborLaw.calculateProbation.useQuery(
    { startDate: new Date(startDate) },
    { enabled: !!startDate }
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Probation Period Calculator
        </CardTitle>
        <CardDescription>
          Calculate the 90-day probation period end date according to KSA labor law
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="start-date">Employment Start Date</Label>
          <Input
            id="start-date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        {calculateProbation.data && (
          <Alert className={calculateProbation.data.isComplete ? "border-green-500" : "border-blue-500"}>
            <AlertDescription className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">Probation End Date:</span>
                <Badge variant={calculateProbation.data.isComplete ? "default" : "secondary"}>
                  {new Date(calculateProbation.data.endDate).toLocaleDateString()}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Days Remaining:</span>
                <span className="text-lg font-bold">
                  {calculateProbation.data.daysRemaining} days
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Status:</span>
                <Badge variant={calculateProbation.data.isComplete ? "default" : "outline"}>
                  {calculateProbation.data.isComplete ? "Completed" : "In Progress"}
                </Badge>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="text-sm text-muted-foreground space-y-2">
          <p className="font-medium">KSA Labor Law Requirements:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Standard probation period is 90 days</li>
            <li>Can be extended once for another 90 days (total 180 days)</li>
            <li>Either party can terminate during probation without notice</li>
            <li>No end-of-service benefits during probation period</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

function NoticePeriodCalculator() {
  const [contractStartDate, setContractStartDate] = useState<string>("");
  const [contractType, setContractType] = useState<"indefinite" | "fixed">("indefinite");

  const calculateNotice = trpc.ksaCompliance.laborLaw.calculateNotice.useQuery(
    { 
      contractStartDate: new Date(contractStartDate),
      contractType 
    },
    { enabled: !!contractStartDate }
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Notice Period Calculator
        </CardTitle>
        <CardDescription>
          Calculate required notice period for contract termination
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="contract-start">Contract Start Date</Label>
            <Input
              id="contract-start"
              type="date"
              value={contractStartDate}
              onChange={(e) => setContractStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contract-type">Contract Type</Label>
            <Select value={contractType} onValueChange={(v) => setContractType(v as "indefinite" | "fixed")}>
              <SelectTrigger id="contract-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="indefinite">Indefinite (Open-ended)</SelectItem>
                <SelectItem value="fixed">Fixed Term</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {calculateNotice.data && (
          <Alert className="border-blue-500">
            <AlertDescription className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">Required Notice Period:</span>
                <Badge variant="secondary" className="text-lg">
                  {calculateNotice.data.noticeDays} days
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">If Notice Given Today:</span>
                <span className="font-medium">
                  Last Working Day: {new Date(calculateNotice.data.noticeEndDate).toLocaleDateString()}
                </span>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="text-sm text-muted-foreground space-y-2">
          <p className="font-medium">KSA Labor Law Requirements:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Minimum 30 days notice for contracts less than 5 years</li>
            <li>Minimum 60 days notice for contracts 5+ years</li>
            <li>Notice period can be waived by mutual agreement</li>
            <li>Employer may pay salary in lieu of notice</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

function GratuityCalculator() {
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [monthlySalary, setMonthlySalary] = useState<string>("");
  const [terminationType, setTerminationType] = useState<"resignation" | "termination" | "mutual" | "contract_end">("resignation");

  const calculateGratuity = trpc.ksaCompliance.laborLaw.calculateGratuity.useQuery(
    {
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      lastMonthlySalary: parseFloat(monthlySalary) || 0,
      terminationType
    },
    { enabled: !!startDate && !!endDate && !!monthlySalary }
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          End-of-Service Benefits (Gratuity) Calculator
        </CardTitle>
        <CardDescription>
          Calculate end-of-service benefits according to KSA labor law
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="emp-start">Employment Start Date</Label>
            <Input
              id="emp-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emp-end">Employment End Date</Label>
            <Input
              id="emp-end"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="salary">Last Monthly Salary (SAR)</Label>
            <Input
              id="salary"
              type="number"
              value={monthlySalary}
              onChange={(e) => setMonthlySalary(e.target.value)}
              placeholder="10000"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="termination">Termination Type</Label>
            <Select value={terminationType} onValueChange={(v) => setTerminationType(v as any)}>
              <SelectTrigger id="termination">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="resignation">Employee Resignation</SelectItem>
                <SelectItem value="termination">Employer Termination</SelectItem>
                <SelectItem value="mutual">Mutual Agreement</SelectItem>
                <SelectItem value="contract_end">Contract End</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {calculateGratuity.data && (
          <Alert className="border-green-500">
            <AlertDescription className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Years of Service:</span>
                <Badge variant="secondary">{calculateGratuity.data.yearsOfService.toFixed(2)} years</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Total Gratuity Amount:</span>
                <span className="text-2xl font-bold text-green-600">
                  {calculateGratuity.data.totalAmount.toLocaleString()} SAR
                </span>
              </div>
              <div className="text-sm space-y-1">
                <p><strong>Calculation Breakdown:</strong></p>
                <p>• First 5 years: {calculateGratuity.data.firstFiveYearsAmount.toLocaleString()} SAR</p>
                <p>• After 5 years: {calculateGratuity.data.afterFiveYearsAmount.toLocaleString()} SAR</p>
                <p className="text-muted-foreground mt-2">{calculateGratuity.data.explanation}</p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="text-sm text-muted-foreground space-y-2">
          <p className="font-medium">KSA Labor Law Formula:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>First 5 years: Half month salary per year</li>
            <li>After 5 years: Full month salary per year</li>
            <li>Resignation before 2 years: No gratuity</li>
            <li>Resignation 2-5 years: 1/3 of calculated amount</li>
            <li>Resignation 5-10 years: 2/3 of calculated amount</li>
            <li>Resignation 10+ years or termination: Full amount</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

function WorkingHoursValidator() {
  const [weeklyHours, setWeeklyHours] = useState<string>("");
  const [dailyHours, setDailyHours] = useState<string>("");
  const [isRamadan, setIsRamadan] = useState<boolean>(false);
  const [isMuslim, setIsMuslim] = useState<boolean>(true);

  const validateHours = trpc.ksaCompliance.laborLaw.validateHours.useQuery(
    {
      weeklyHours: parseFloat(weeklyHours) || 0,
      dailyHours: parseFloat(dailyHours) || 0,
      isRamadan,
      isMuslim
    },
    { enabled: !!weeklyHours && !!dailyHours }
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Working Hours Validator
        </CardTitle>
        <CardDescription>
          Validate working hours compliance with KSA labor law
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="weekly">Weekly Hours</Label>
            <Input
              id="weekly"
              type="number"
              value={weeklyHours}
              onChange={(e) => setWeeklyHours(e.target.value)}
              placeholder="48"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="daily">Daily Hours</Label>
            <Input
              id="daily"
              type="number"
              value={dailyHours}
              onChange={(e) => setDailyHours(e.target.value)}
              placeholder="8"
            />
          </div>
        </div>

        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isRamadan}
              onChange={(e) => setIsRamadan(e.target.checked)}
              className="h-4 w-4"
            />
            <span>Ramadan Period</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isMuslim}
              onChange={(e) => setIsMuslim(e.target.checked)}
              className="h-4 w-4"
            />
            <span>Muslim Employee</span>
          </label>
        </div>

        {validateHours.data && (
          <Alert className={validateHours.data.isCompliant ? "border-green-500" : "border-red-500"}>
            <AlertDescription className="space-y-3">
              <div className="flex items-center gap-2">
                {validateHours.data.isCompliant ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                )}
                <span className="font-bold text-lg">
                  {validateHours.data.isCompliant ? "Compliant" : "Non-Compliant"}
                </span>
              </div>
              
              {validateHours.data.violations.length > 0 && (
                <div className="space-y-1">
                  <p className="font-medium text-red-600">Violations:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {validateHours.data.violations.map((v, idx) => (
                      <li key={idx}>{v}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="text-sm space-y-1">
                <p><strong>Maximum Allowed:</strong></p>
                <p>• Weekly: {validateHours.data.maxWeeklyHours} hours</p>
                <p>• Daily: {validateHours.data.maxDailyHours} hours</p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="text-sm text-muted-foreground space-y-2">
          <p className="font-medium">KSA Labor Law Limits:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Standard: 48 hours/week, 8 hours/day maximum</li>
            <li>Ramadan (Muslims): 36 hours/week, 6 hours/day maximum</li>
            <li>Overtime: Maximum 12 hours/day including overtime</li>
            <li>Overtime pay: 150% of regular hourly rate</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

function AnnualLeaveCalculator() {
  const [yearsOfService, setYearsOfService] = useState<string>("");

  const calculateLeave = trpc.ksaCompliance.laborLaw.calculateLeave.useQuery(
    { yearsOfService: parseFloat(yearsOfService) || 0 },
    { enabled: !!yearsOfService }
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Annual Leave Calculator
        </CardTitle>
        <CardDescription>
          Calculate annual leave entitlement based on years of service
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="years">Years of Service</Label>
          <Input
            id="years"
            type="number"
            value={yearsOfService}
            onChange={(e) => setYearsOfService(e.target.value)}
            placeholder="5"
            step="0.1"
          />
        </div>

        {calculateLeave.data && (
          <Alert className="border-blue-500">
            <AlertDescription className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">Annual Leave Entitlement:</span>
                <Badge variant="secondary" className="text-xl">
                  {calculateLeave.data.annualLeaveDays} days
                </Badge>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="text-sm text-muted-foreground space-y-2">
          <p className="font-medium">KSA Labor Law Entitlement:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Less than 5 years: 21 days per year</li>
            <li>5+ years of service: 30 days per year</li>
            <li>Unused leave can be carried forward (with employer approval)</li>
            <li>Leave must be paid at regular salary rate</li>
            <li>Employee can request leave encashment upon termination</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
