/**
 * Saudization Compliance Dashboard
 * 
 * CRITICAL MARKET DIFFERENTIATOR: Real-time Nitaqat monitoring and compliance management
 * NO COMPETITOR offers this comprehensive compliance dashboard
 * 
 * Features:
 * - Real-time Nitaqat status with color-coded bands
 * - Workforce composition visualization
 * - Compliance gap analysis
 * - 3/6/12-month forecasting
 * - "What-if" scenario planning
 * - Compliance alerts and notifications
 * - Workforce history trends
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Shield,
  Calculator,
  BarChart3,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";

export default function ComplianceDashboard() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  
  // Get employerId from user's employer profile
  const { data: profile } = trpc.employer.getProfile.useQuery();
  const employerId = profile?.id || 0;
  
  // Fetch Nitaqat tracking data
  const { data: tracking, isLoading, refetch } = trpc.saudization.getTracking.useQuery({ employerId });
  const { data: history } = trpc.saudization.getHistory.useQuery({ employerId, months: 12 });
  const { data: alerts } = trpc.saudization.getAlerts.useQuery({ employerId });
  
  // Update workforce mutation
  const updateWorkforce = trpc.saudization.updateWorkforce.useMutation({
    onSuccess: () => {
      toast.success(t("message.success"));
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  // Simulate scenario mutation
  const simulateScenario = trpc.saudization.simulateScenario.useMutation({
    onSuccess: (data) => {
      toast.success(`Scenario simulated: ${data.projectedBand} band`);
      setScenarioResult(data);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  // Workforce update form state
  const [workforceForm, setWorkforceForm] = useState({
    totalEmployees: tracking?.totalEmployees || 0,
    saudiEmployees: tracking?.saudiEmployees || 0,
    expatEmployees: tracking?.expatEmployees || 0,
    activitySector: tracking?.activitySector || "default",
  });
  
  // Scenario planning form state
  const [scenarioForm, setScenarioForm] = useState({
    scenarioName: "",
    saudiHires: 0,
    expatHires: 0,
    saudiTerminations: 0,
    expatTerminations: 0,
  });
  
  const [scenarioResult, setScenarioResult] = useState<any>(null);
  
  // Handle workforce update
  const handleUpdateWorkforce = () => {
    updateWorkforce.mutate({
      employerId,
      ...workforceForm,
    });
  };
  
  // Handle scenario simulation
  const handleSimulateScenario = () => {
    if (!scenarioForm.scenarioName) {
      toast.error("Please enter a scenario name");
      return;
    }
    simulateScenario.mutate({
      employerId,
      ...scenarioForm,
    });
  };
  
  // Get band color
  const getBandColor = (band: string) => {
    switch (band) {
      case "platinum": return "bg-purple-500 text-white";
      case "green": return "bg-green-500 text-white";
      case "yellow": return "bg-yellow-500 text-black";
      case "red": return "bg-red-500 text-white";
      default: return "bg-gray-500 text-white";
    }
  };
  
  // Get risk color
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "low": return "text-green-600";
      case "medium": return "text-yellow-600";
      case "high": return "text-orange-600";
      case "critical": return "text-red-600";
      default: return "text-gray-600";
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 animate-spin" />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("compliance.title")}</h1>
          <p className="text-muted-foreground mt-1">
            Real-time Nitaqat monitoring and compliance management
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          {t("action.refresh")}
        </Button>
      </div>
      
      {/* Critical Alerts */}
      {alerts && alerts.filter((a: any) => a.alertStatus === "active" && a.severity === "critical").length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Critical Compliance Alert</AlertTitle>
          <AlertDescription>
            {alerts.filter((a: any) => a.alertStatus === "active" && a.severity === "critical")[0]?.alertMessage}
          </AlertDescription>
        </Alert>
      )}
      
      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Nitaqat Band */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">{t("compliance.nitaqatBand")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Badge className={getBandColor(tracking?.nitaqatBand || "")}>
                {t(`band.${tracking?.nitaqatBand || "red"}`).toUpperCase()}
              </Badge>
              {tracking?.isCompliant ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-600" />
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Saudization Percentage */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">{t("compliance.saudizationPercentage")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tracking?.saudizationPercentage ? (tracking.saudizationPercentage / 100).toFixed(1) : 0}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Required: {tracking?.requiredSaudizationPercentage ? (tracking.requiredSaudizationPercentage / 100).toFixed(1) : 0}%
            </p>
          </CardContent>
        </Card>
        
        {/* Compliance Gap */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">{t("compliance.complianceGap")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tracking?.complianceGap || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Saudi employees needed
            </p>
          </CardContent>
        </Card>
        
        {/* Risk Level */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">{t("compliance.riskLevel")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getRiskColor(tracking?.riskLevel || "low")}`}>
              {t(`risk.${tracking?.riskLevel || "low"}`).toUpperCase()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Penalty: {tracking?.estimatedPenalty ? `${tracking.estimatedPenalty.toLocaleString()} SAR/mo` : "None"}
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">
            <BarChart3 className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="workforce">
            <Users className="w-4 h-4 mr-2" />
            Workforce
          </TabsTrigger>
          <TabsTrigger value="scenario">
            <Calculator className="w-4 h-4 mr-2" />
            What-If Analysis
          </TabsTrigger>
          <TabsTrigger value="alerts">
            <AlertCircle className="w-4 h-4 mr-2" />
            Alerts
          </TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Workforce Composition */}
            <Card>
              <CardHeader>
                <CardTitle>{t("compliance.workforce")}</CardTitle>
                <CardDescription>Current workforce breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{t("compliance.totalEmployees")}</span>
                    <span className="text-2xl font-bold">{tracking?.totalEmployees || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-green-600">{t("compliance.saudiEmployees")}</span>
                    <span className="text-2xl font-bold text-green-600">{tracking?.saudiEmployees || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-600">{t("compliance.expatEmployees")}</span>
                    <span className="text-2xl font-bold text-blue-600">{tracking?.expatEmployees || 0}</span>
                  </div>
                  
                  {/* Visual Bar */}
                  <div className="w-full h-8 bg-gray-200 rounded-full overflow-hidden flex">
                    <div 
                      className="bg-green-500 flex items-center justify-center text-white text-xs font-bold"
                      style={{ width: `${tracking?.saudizationPercentage ? tracking.saudizationPercentage / 100 : 0}%` }}
                    >
                      {tracking?.saudizationPercentage ? (tracking.saudizationPercentage / 100).toFixed(1) : 0}%
                    </div>
                    <div 
                      className="bg-blue-500 flex items-center justify-center text-white text-xs font-bold"
                      style={{ width: `${tracking?.saudizationPercentage ? 100 - (tracking.saudizationPercentage / 100) : 100}%` }}
                    >
                      {tracking?.saudizationPercentage ? (100 - (tracking.saudizationPercentage / 100)).toFixed(1) : 100}%
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Compliance Forecast */}
            <Card>
              <CardHeader>
                <CardTitle>{t("compliance.forecast")}</CardTitle>
                <CardDescription>Projected Nitaqat bands</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Current</span>
                    <Badge className={getBandColor(tracking?.nitaqatBand || "")}>
                      {t(`band.${tracking?.nitaqatBand || "red"}`)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">3 Months</span>
                    <Badge className={getBandColor(tracking?.forecastedBand3Months || "")}>
                      {t(`band.${tracking?.forecastedBand3Months || "red"}`)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">6 Months</span>
                    <Badge className={getBandColor(tracking?.forecastedBand6Months || "")}>
                      {t(`band.${tracking?.forecastedBand6Months || "red"}`)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">12 Months</span>
                    <Badge className={getBandColor(tracking?.forecastedBand12Months || "")}>
                      {t(`band.${tracking?.forecastedBand12Months || "red"}`)}
                    </Badge>
                  </div>
                  
                  {tracking?.projectedComplianceDate && (
                    <div className="mt-4 p-3 bg-green-50 rounded-lg">
                      <p className="text-sm font-medium text-green-800">
                        Projected compliance date: {new Date(tracking.projectedComplianceDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Workforce Tab */}
        <TabsContent value="workforce" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Update Workforce Composition</CardTitle>
              <CardDescription>Enter current workforce data to recalculate Nitaqat status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="totalEmployees">{t("compliance.totalEmployees")}</Label>
                  <Input
                    id="totalEmployees"
                    type="number"
                    value={workforceForm.totalEmployees}
                    onChange={(e) => setWorkforceForm({ ...workforceForm, totalEmployees: parseInt(e.target.value) || 0 })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="saudiEmployees">{t("compliance.saudiEmployees")}</Label>
                  <Input
                    id="saudiEmployees"
                    type="number"
                    value={workforceForm.saudiEmployees}
                    onChange={(e) => setWorkforceForm({ ...workforceForm, saudiEmployees: parseInt(e.target.value) || 0 })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="expatEmployees">{t("compliance.expatEmployees")}</Label>
                  <Input
                    id="expatEmployees"
                    type="number"
                    value={workforceForm.expatEmployees}
                    onChange={(e) => setWorkforceForm({ ...workforceForm, expatEmployees: parseInt(e.target.value) || 0 })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="activitySector">{t("compliance.activitySector")}</Label>
                  <Select
                    value={workforceForm.activitySector}
                    onValueChange={(value) => setWorkforceForm({ ...workforceForm, activitySector: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manufacturing">{t("sector.manufacturing")}</SelectItem>
                      <SelectItem value="retail">{t("sector.retail")}</SelectItem>
                      <SelectItem value="technology">{t("sector.technology")}</SelectItem>
                      <SelectItem value="hospitality">{t("sector.hospitality")}</SelectItem>
                      <SelectItem value="healthcare">{t("sector.healthcare")}</SelectItem>
                      <SelectItem value="construction">{t("sector.construction")}</SelectItem>
                      <SelectItem value="default">{t("sector.default")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Button onClick={handleUpdateWorkforce} disabled={updateWorkforce.isPending}>
                {updateWorkforce.isPending ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Shield className="w-4 h-4 mr-2" />
                )}
                Update & Recalculate
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Scenario Tab */}
        <TabsContent value="scenario" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("compliance.whatIf")}</CardTitle>
              <CardDescription>
                Simulate hiring scenarios to see impact on Nitaqat status (UNIQUE FEATURE)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="scenarioName">Scenario Name</Label>
                <Input
                  id="scenarioName"
                  placeholder="e.g., Q1 2025 Hiring Plan"
                  value={scenarioForm.scenarioName}
                  onChange={(e) => setScenarioForm({ ...scenarioForm, scenarioName: e.target.value })}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="saudiHires">Saudi Hires</Label>
                  <Input
                    id="saudiHires"
                    type="number"
                    value={scenarioForm.saudiHires}
                    onChange={(e) => setScenarioForm({ ...scenarioForm, saudiHires: parseInt(e.target.value) || 0 })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="expatHires">Expat Hires</Label>
                  <Input
                    id="expatHires"
                    type="number"
                    value={scenarioForm.expatHires}
                    onChange={(e) => setScenarioForm({ ...scenarioForm, expatHires: parseInt(e.target.value) || 0 })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="saudiTerminations">Saudi Terminations</Label>
                  <Input
                    id="saudiTerminations"
                    type="number"
                    value={scenarioForm.saudiTerminations}
                    onChange={(e) => setScenarioForm({ ...scenarioForm, saudiTerminations: parseInt(e.target.value) || 0 })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="expatTerminations">Expat Terminations</Label>
                  <Input
                    id="expatTerminations"
                    type="number"
                    value={scenarioForm.expatTerminations}
                    onChange={(e) => setScenarioForm({ ...scenarioForm, expatTerminations: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              
              <Button onClick={handleSimulateScenario} disabled={simulateScenario.isPending}>
                {simulateScenario.isPending ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Calculator className="w-4 h-4 mr-2" />
                )}
                Simulate Scenario
              </Button>
              
              {/* Scenario Results */}
              {scenarioResult && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg space-y-3">
                  <h4 className="font-semibold">Scenario Results:</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Projected Band</p>
                      <Badge className={getBandColor(scenarioResult.projectedBand)}>
                        {t(`band.${scenarioResult.projectedBand}`)}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Compliance Improvement</p>
                      <p className="font-semibold">
                        {scenarioResult.complianceImprovement ? (
                          <span className="text-green-600 flex items-center">
                            <TrendingUp className="w-4 h-4 mr-1" /> Yes
                          </span>
                        ) : (
                          <span className="text-red-600 flex items-center">
                            <TrendingDown className="w-4 h-4 mr-1" /> No
                          </span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Cost Impact</p>
                      <p className="font-semibold">{scenarioResult.estimatedCostImpact.toLocaleString()} SAR/year</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Time to Compliance</p>
                      <p className="font-semibold">
                        {scenarioResult.estimatedTimeToCompliance !== null 
                          ? `${scenarioResult.estimatedTimeToCompliance} days`
                          : "Already compliant"}
                      </p>
                    </div>
                  </div>
                  
                  {scenarioResult.recommendations && scenarioResult.recommendations.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium mb-2">Recommendations:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {scenarioResult.recommendations.map((rec: string, idx: number) => (
                          <li key={idx} className="text-sm text-muted-foreground">{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("compliance.alerts")}</CardTitle>
              <CardDescription>Active compliance alerts and notifications</CardDescription>
            </CardHeader>
            <CardContent>
              {alerts && alerts.length > 0 ? (
                <div className="space-y-3">
                  {alerts.map((alert) => (
                    <Alert 
                      key={alert.id} 
                      variant={alert.severity === "critical" ? "destructive" : "default"}
                    >
                      {alert.severity === "critical" ? (
                        <AlertTriangle className="h-4 w-4" />
                      ) : (
                        <AlertCircle className="h-4 w-4" />
                      )}
                      <AlertTitle>{alert.alertTitle}</AlertTitle>
                      <AlertDescription>
                        {alert.alertMessage}
                        {alert.actionRequired && (
                          <p className="mt-2 font-medium">Action Required: {alert.actionRequired}</p>
                        )}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No active alerts. Your compliance status is good!
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
