import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, AlertTriangle, CheckCircle, Clock, XCircle, Search } from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function VisaComplianceDashboard() {
  const [employerId, setEmployerId] = useState(1); // TODO: Get from auth context
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: analytics, isLoading: analyticsLoading } = trpc.visaCompliance.analytics.getOverview.useQuery({
    employerId,
  });
  
  const { data: trends, isLoading: trendsLoading } = trpc.visaCompliance.analytics.getTrends.useQuery({
    employerId,
    days: 90,
  });
  
  const { data: alerts, isLoading: alertsLoading, refetch: refetchAlerts } = trpc.visaCompliance.alerts.getActive.useQuery();
  
  const acknowledgeAlertMutation = trpc.visaCompliance.alerts.acknowledge.useMutation({
    onSuccess: () => refetchAlerts(),
  });
  
  const dismissAlertMutation = trpc.visaCompliance.alerts.dismiss.useMutation({
    onSuccess: () => refetchAlerts(),
  });
  
  // Prepare trends data for Chart.js
  const trendsChartData = {
    labels: trends?.map(t => new Date(t.createdAt).toLocaleDateString()) || [],
    datasets: [
      {
        label: 'Documents Added',
        data: trends?.map(() => 1) || [], // Count of documents per day
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      },
    ],
  };
  
  // Prepare expiration forecast data
  const expirationForecastData = {
    labels: ['Next 7 Days', 'Next 15 Days', 'Next 30 Days', 'Beyond 30 Days'],
    datasets: [
      {
        label: 'Documents Expiring',
        data: [
          trends?.filter(t => {
            const days = Math.ceil((new Date(t.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            return days <= 7 && days >= 0;
          }).length || 0,
          trends?.filter(t => {
            const days = Math.ceil((new Date(t.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            return days <= 15 && days >= 0;
          }).length || 0,
          trends?.filter(t => {
            const days = Math.ceil((new Date(t.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            return days <= 30 && days >= 0;
          }).length || 0,
          trends?.filter(t => {
            const days = Math.ceil((new Date(t.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            return days > 30;
          }).length || 0,
        ],
        backgroundColor: [
          'rgba(239, 68, 68, 0.8)',
          'rgba(251, 146, 60, 0.8)',
          'rgba(251, 191, 36, 0.8)',
          'rgba(34, 197, 94, 0.8)',
        ],
      },
    ],
  };
  
  const filteredAlerts = alerts?.filter(alert => {
    if (!searchTerm) return true;
    const employeeName = `${alert.employee?.firstName || ''} ${alert.employee?.lastName || ''}`.toLowerCase();
    return employeeName.includes(searchTerm.toLowerCase()) ||
           alert.alert.message.toLowerCase().includes(searchTerm.toLowerCase());
  });
  
  if (analyticsLoading || trendsLoading || alertsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Visa & Work Permit Compliance</h1>
        <p className="text-muted-foreground">Monitor visa and work permit compliance across your workforce</p>
      </div>
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalEmployees || 0}</div>
            <p className="text-xs text-muted-foreground">Active workforce</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{analytics?.expiringSoon || 0}</div>
            <p className="text-xs text-muted-foreground">Within 30 days</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired Documents</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{analytics?.expired || 0}</div>
            <p className="text-xs text-muted-foreground">Immediate action required</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{analytics?.criticalAlerts || 0}</div>
            <p className="text-xs text-muted-foreground">Unacknowledged</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Compliance Trends</CardTitle>
            <CardDescription>Document additions over the last 90 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <Line
                data={trendsChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top' as const,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        precision: 0,
                      },
                    },
                  },
                }}
              />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Expiration Forecast</CardTitle>
            <CardDescription>Upcoming document expirations by timeframe</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <Bar
                data={expirationForecastData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        precision: 0,
                      },
                    },
                  },
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Active Alerts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Active Compliance Alerts</CardTitle>
              <CardDescription>Unacknowledged alerts requiring attention</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search alerts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-[250px]"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredAlerts && filteredAlerts.length > 0 ? (
              filteredAlerts.map((item) => (
                <Alert
                  key={item.alert.id}
                  className={
                    item.alert.severity === 'critical'
                      ? 'border-red-500 bg-red-50'
                      : item.alert.severity === 'warning'
                      ? 'border-yellow-500 bg-yellow-50'
                      : 'border-blue-500 bg-blue-50'
                  }
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge
                          variant={
                            item.alert.severity === 'critical'
                              ? 'destructive'
                              : item.alert.severity === 'warning'
                              ? 'default'
                              : 'secondary'
                          }
                        >
                          {item.alert.severity}
                        </Badge>
                        <Badge variant="outline">{item.alert.alertType.replace(/_/g, ' ')}</Badge>
                        <span className="text-sm font-medium">
                          {item.employee?.firstName} {item.employee?.lastName}
                        </span>
                      </div>
                      <AlertDescription className="text-sm">
                        {item.alert.message}
                      </AlertDescription>
                      <p className="text-xs text-muted-foreground mt-2">
                        {item.compliance?.documentType} - Expires:{' '}
                        {item.compliance?.expiryDate ? new Date(item.compliance.expiryDate).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => acknowledgeAlertMutation.mutate({ alertId: item.alert.id })}
                        disabled={acknowledgeAlertMutation.isPending}
                      >
                        Acknowledge
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => dismissAlertMutation.mutate({ alertId: item.alert.id })}
                        disabled={dismissAlertMutation.isPending}
                      >
                        Dismiss
                      </Button>
                    </div>
                  </div>
                </Alert>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                <p>No active alerts. All compliance requirements are up to date!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
