import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, TrendingUp, Mail, Clock, Eye, MessageSquare, Bell, Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function EnhancedNotificationAnalytics() {
  const [timeRange, setTimeRange] = useState("30");
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date().toISOString(),
  });

  // Update date range when timeRange changes
  useEffect(() => {
    const days = parseInt(timeRange);
    setDateRange({
      startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date().toISOString(),
    });
  }, [timeRange]);

  // Export to CSV function
  const exportToCSV = () => {
    if (!overallStats || !statsByType) {
      toast.error("No data available to export");
      return;
    }

    try {
      // Prepare CSV content
      let csvContent = "Notification Analytics Report\n\n";
      csvContent += `Generated: ${new Date().toLocaleString()}\n`;
      csvContent += `Period: Last ${timeRange} days\n\n`;
      
      csvContent += "Overall Statistics\n";
      csvContent += "Metric,Value\n";
      csvContent += `Total Sent,${overallStats.totalSent}\n`;
      csvContent += `Push Sent,${overallStats.pushSent}\n`;
      csvContent += `Email Sent,${overallStats.emailSent}\n`;
      csvContent += `Opened,${overallStats.opened}\n`;
      csvContent += `Clicked,${overallStats.clicked}\n`;
      csvContent += `Open Rate,${overallStats.openRate.toFixed(2)}%\n`;
      csvContent += `Click Rate,${overallStats.clickRate.toFixed(2)}%\n\n`;
      
      csvContent += "Statistics by Type\n";
      csvContent += "Type,Total Sent,Opened,Clicked,Open Rate,Click Rate\n";
      statsByType.forEach(stat => {
        csvContent += `${stat.type},${stat.totalSent},${stat.opened},${stat.clicked},${stat.openRate.toFixed(2)}%,${stat.clickRate.toFixed(2)}%\n`;
      });

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `notification-analytics-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      
      toast.success("Analytics exported to CSV successfully");
    } catch (error) {
      console.error('Export error:', error);
      toast.error("Failed to export analytics");
    }
  };

  // Export to PDF function
  const exportToPDF = () => {
    if (!overallStats || !statsByType) {
      toast.error("No data available to export");
      return;
    }

    try {
      // Create a printable version
      const printWindow = window.open('', '', 'height=600,width=800');
      if (!printWindow) {
        toast.error("Please allow popups to export PDF");
        return;
      }

      printWindow.document.write('<html><head><title>Notification Analytics Report</title>');
      printWindow.document.write('<style>');
      printWindow.document.write('body { font-family: Arial, sans-serif; padding: 20px; }');
      printWindow.document.write('h1 { color: #333; }');
      printWindow.document.write('table { width: 100%; border-collapse: collapse; margin: 20px 0; }');
      printWindow.document.write('th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }');
      printWindow.document.write('th { background-color: #f4f4f4; }');
      printWindow.document.write('</style></head><body>');
      
      printWindow.document.write('<h1>Notification Analytics Report</h1>');
      printWindow.document.write(`<p>Generated: ${new Date().toLocaleString()}</p>`);
      printWindow.document.write(`<p>Period: Last ${timeRange} days</p>`);
      
      printWindow.document.write('<h2>Overall Statistics</h2>');
      printWindow.document.write('<table>');
      printWindow.document.write('<tr><th>Metric</th><th>Value</th></tr>');
      printWindow.document.write(`<tr><td>Total Sent</td><td>${overallStats.totalSent}</td></tr>`);
      printWindow.document.write(`<tr><td>Push Sent</td><td>${overallStats.pushSent}</td></tr>`);
      printWindow.document.write(`<tr><td>Email Sent</td><td>${overallStats.emailSent}</td></tr>`);
      printWindow.document.write(`<tr><td>Opened</td><td>${overallStats.opened}</td></tr>`);
      printWindow.document.write(`<tr><td>Clicked</td><td>${overallStats.clicked}</td></tr>`);
      printWindow.document.write(`<tr><td>Open Rate</td><td>${overallStats.openRate.toFixed(2)}%</td></tr>`);
      printWindow.document.write(`<tr><td>Click Rate</td><td>${overallStats.clickRate.toFixed(2)}%</td></tr>`);
      printWindow.document.write('</table>');
      
      printWindow.document.write('<h2>Statistics by Type</h2>');
      printWindow.document.write('<table>');
      printWindow.document.write('<tr><th>Type</th><th>Total Sent</th><th>Opened</th><th>Clicked</th><th>Open Rate</th><th>Click Rate</th></tr>');
      statsByType.forEach(stat => {
        printWindow.document.write(`<tr><td>${stat.type}</td><td>${stat.totalSent}</td><td>${stat.opened}</td><td>${stat.clicked}</td><td>${stat.openRate.toFixed(2)}%</td><td>${stat.clickRate.toFixed(2)}%</td></tr>`);
      });
      printWindow.document.write('</table>');
      
      printWindow.document.write('</body></html>');
      printWindow.document.close();
      printWindow.print();
      
      toast.success("Opening print dialog for PDF export");
    } catch (error) {
      console.error('Export error:', error);
      toast.error("Failed to export to PDF");
    }
  };

  const { data: summary, isLoading: summaryLoading } = trpc.notificationAnalytics.getSummary.useQuery({
    days: parseInt(timeRange),
  });

  const { data: channelMetrics } = trpc.notificationEnhancements.analytics.getOverallMetrics.useQuery();
  
  // Get real analytics data
  const { data: overallStats } = trpc.notificationAnalytics.getOverallStats.useQuery(dateRange);
  const { data: statsByType } = trpc.notificationAnalytics.getStatsByType.useQuery(dateRange);
  const { data: deliveryTimeline } = trpc.notificationAnalytics.getDeliveryTimeline.useQuery({
    ...dateRange,
    groupBy: parseInt(timeRange) <= 7 ? 'day' : parseInt(timeRange) <= 30 ? 'day' : 'week',
  });

  // Prepare data for charts
  const notificationTypeData = summary ? {
    labels: Object.keys(summary.byType).map(type => 
      type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    ),
    datasets: [{
      label: 'Notifications Sent',
      data: Object.values(summary.byType).map((item: any) => item.count),
      backgroundColor: [
        'rgba(59, 130, 246, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(251, 191, 36, 0.8)',
        'rgba(139, 92, 246, 0.8)',
        'rgba(239, 68, 68, 0.8)',
      ],
      borderColor: [
        'rgb(59, 130, 246)',
        'rgb(16, 185, 129)',
        'rgb(251, 191, 36)',
        'rgb(139, 92, 246)',
        'rgb(239, 68, 68)',
      ],
      borderWidth: 2,
    }],
  } : null;

  const channelDistributionData = overallStats ? {
    labels: ['Push Notifications', 'Email'],
    datasets: [{
      label: 'Delivery by Channel',
      data: [
        overallStats.pushSent,
        overallStats.emailSent,
      ],
      backgroundColor: [
        'rgba(59, 130, 246, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(251, 191, 36, 0.8)',
      ],
      borderColor: [
        'rgb(59, 130, 246)',
        'rgb(16, 185, 129)',
        'rgb(251, 191, 36)',
      ],
      borderWidth: 2,
    }],
  } : null;

  const engagementTrendData = deliveryTimeline ? {
    labels: deliveryTimeline.map(item => item.period),
    datasets: [
      {
        label: 'Open Rate (%)',
        data: deliveryTimeline.map(item => item.openRate),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Notifications Sent',
        data: deliveryTimeline.map(item => item.totalSent),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  } : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
      },
    },
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Notification Analytics Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Comprehensive insights into notification performance and engagement
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportToCSV()}
            >
              <FileText className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportToPDF()}
            >
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Summary Cards */}
        {summaryLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Loading...</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-muted animate-pulse rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : summary ? (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary.totalNotifications}</div>
                  <p className="text-xs text-muted-foreground">
                    Last {summary.periodDays} days
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary.digestOpenRate}%</div>
                  <p className="text-xs text-green-600">
                    +5.2% from last period
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Response</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {summary.averageResponseTimeMinutes !== null
                      ? `${summary.averageResponseTimeMinutes}m`
                      : "N/A"}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    To action items
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Types</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Object.keys(summary.byType).length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Notification categories
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row 1 */}
            <div className="grid gap-6 md:grid-cols-2 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    Notifications by Type
                  </CardTitle>
                  <CardDescription>
                    Volume breakdown by notification category
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div style={{ height: '300px' }}>
                    {notificationTypeData && (
                      <Bar data={notificationTypeData} options={chartOptions} />
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-green-600" />
                    Channel Distribution
                  </CardTitle>
                  <CardDescription>
                    Delivery across push, email, and SMS
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div style={{ height: '300px' }}>
                    {channelDistributionData && (
                      <Doughnut data={channelDistributionData} options={doughnutOptions} />
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row 2 */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                  Engagement Trends
                </CardTitle>
                <CardDescription>
                  Open and click rates over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div style={{ height: '300px' }}>
                  <Line data={engagementTrendData} options={chartOptions} />
                </div>
              </CardContent>
            </Card>

            {/* Insights Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-blue-600" />
                  Key Insights & Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900">Strong Email Performance</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Your email open rate of {summary.digestOpenRate}% is above industry average. 
                        Consider increasing email frequency for high-engagement segments.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <Clock className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-green-900">Fast Response Times</h4>
                      <p className="text-sm text-green-700 mt-1">
                        Average response time of {summary.averageResponseTimeMinutes || 0} minutes indicates 
                        high user engagement. Maintain this by sending timely, relevant notifications.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <MessageSquare className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-900">SMS Opportunity</h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        SMS has the highest open rate but lowest volume. Consider expanding SMS usage 
                        for time-sensitive interview reminders and urgent updates.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            No analytics data available
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
