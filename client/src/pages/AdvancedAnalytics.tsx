import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, TrendingUp, Users, Target, Award } from "lucide-react";
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
import { Line, Bar, Doughnut } from 'react-chartjs-2';

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

export default function AdvancedAnalytics() {
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  });

  const { data: timeToHire, isLoading: timeToHireLoading } = trpc.analytics.getTimeToHire.useQuery(
    dateRange.startDate || dateRange.endDate ? dateRange : undefined
  );

  const { data: conversionFunnel, isLoading: funnelLoading } = trpc.analytics.getConversionFunnel.useQuery();

  const { data: sourceEffectiveness, isLoading: sourceLoading } = trpc.analytics.getSourceEffectiveness.useQuery();

  const handleDateRangeChange = (field: 'startDate' | 'endDate', value: string) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
  };

  const timeToHireChartData = {
    labels: timeToHire?.data.map((d: any) => d.candidateName) || [],
    datasets: [
      {
        label: 'Days to Hire',
        data: timeToHire?.data.map((d: any) => d.daysToHire) || [],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const funnelChartData = {
    labels: conversionFunnel ? Object.keys(conversionFunnel) : [],
    datasets: [
      {
        label: 'Candidates',
        data: conversionFunnel ? Object.values(conversionFunnel) : [],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(147, 51, 234, 0.8)',
          'rgba(236, 72, 153, 0.8)',
          'rgba(251, 146, 60, 0.8)',
          'rgba(34, 197, 94, 0.8)',
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(147, 51, 234)',
          'rgb(236, 72, 153)',
          'rgb(251, 146, 60)',
          'rgb(34, 197, 94)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const sourceChartData = {
    labels: sourceEffectiveness?.map((s: any) => s.source) || [],
    datasets: [
      {
        label: 'Total Applications',
        data: sourceEffectiveness?.map((s: any) => s.applications) || [],
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
      },
      {
        label: 'Hired',
        data: sourceEffectiveness?.map((s: any) => s.hires) || [],
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 1,
      },
    ],
  };

  const conversionRateData = {
    labels: sourceEffectiveness?.map((s: any) => s.source) || [],
    datasets: [
      {
        label: 'Conversion Rate (%)',
        data: sourceEffectiveness?.map((s: any) => (s.hires / s.applications * 100).toFixed(1)) || [],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(147, 51, 234, 0.8)',
          'rgba(236, 72, 153, 0.8)',
          'rgba(251, 146, 60, 0.8)',
          'rgba(34, 197, 94, 0.8)',
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(147, 51, 234)',
          'rgb(236, 72, 153)',
          'rgb(251, 146, 60)',
          'rgb(34, 197, 94)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Advanced Analytics</h1>
          <p className="text-gray-600 mt-2">
            Deep insights into recruitment performance and bottlenecks
          </p>
        </div>

        {/* Date Range Filter */}
        <Card>
          <CardHeader>
            <CardTitle>Date Range Filter</CardTitle>
            <CardDescription>Filter analytics by date range</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => setDateRange({ startDate: "", endDate: "" })}
                  className="w-full"
                >
                  Clear Filter
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Avg. Time to Hire</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              {timeToHireLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{timeToHire?.average || 0} days</div>
                  <p className="text-xs text-gray-600 mt-1">From application to hire</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <Target className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              {funnelLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {conversionFunnel && conversionFunnel.applied && conversionFunnel.hired
                      ? Math.round((conversionFunnel.hired / conversionFunnel.applied) * 100)
                      : 0}%
                  </div>
                  <p className="text-xs text-gray-600 mt-1">Applied to hired</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Sources</CardTitle>
              <Users className="h-4 w-4 text-pink-600" />
            </CardHeader>
            <CardContent>
              {sourceLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{sourceEffectiveness?.length || 0}</div>
                  <p className="text-xs text-gray-600 mt-1">Active recruitment sources</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Best Source</CardTitle>
              <Award className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              {sourceLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {sourceEffectiveness && sourceEffectiveness[0]?.source || "N/A"}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {sourceEffectiveness && sourceEffectiveness[0]?.hireRate || 0}% hire rate
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Time to Hire Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Time to Hire Trend</CardTitle>
            <CardDescription>Average days from application to hire over time</CardDescription>
          </CardHeader>
          <CardContent>
            {timeToHireLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : timeToHire?.data && timeToHire.data.length > 0 ? (
              <div style={{ height: '300px' }}>
                <Line data={timeToHireChartData} options={chartOptions} />
              </div>
            ) : (
              <p className="text-center text-gray-500 py-12">No data available for the selected period</p>
            )}
          </CardContent>
        </Card>

        {/* Conversion Funnel */}
        <Card>
          <CardHeader>
            <CardTitle>Recruitment Conversion Funnel</CardTitle>
            <CardDescription>Candidate progression through hiring stages</CardDescription>
          </CardHeader>
          <CardContent>
            {funnelLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : conversionFunnel && Object.keys(conversionFunnel).length > 0 ? (
              <div className="grid md:grid-cols-2 gap-6">
                <div style={{ height: '300px' }}>
                  <Bar data={funnelChartData} options={chartOptions} />
                </div>
                <div className="space-y-4">
                  {Object.entries(conversionFunnel).map(([stage, count]: [string, any], idx: number) => {
                    const total = Object.values(conversionFunnel)[0] as number;
                    const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                    return (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{stage}</p>
                          <p className="text-sm text-gray-600">{count} candidates</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-blue-600">{percentage}%</p>
                          <p className="text-xs text-gray-500">of total</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-center text-gray-500 py-12">No data available for the selected period</p>
            )}
          </CardContent>
        </Card>

        {/* Source Effectiveness */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Source Performance</CardTitle>
              <CardDescription>Applications and hires by source</CardDescription>
            </CardHeader>
            <CardContent>
              {sourceLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : sourceEffectiveness && sourceEffectiveness.length > 0 ? (
                <div style={{ height: '300px' }}>
                  <Bar data={sourceChartData} options={chartOptions} />
                </div>
              ) : (
                <p className="text-center text-gray-500 py-12">No data available</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Source Conversion Rates</CardTitle>
              <CardDescription>Percentage of applicants hired by source</CardDescription>
            </CardHeader>
            <CardContent>
              {sourceLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : sourceEffectiveness && sourceEffectiveness.length > 0 ? (
                <div style={{ height: '300px' }}>
                  <Doughnut data={conversionRateData} options={chartOptions} />
                </div>
              ) : (
                <p className="text-center text-gray-500 py-12">No data available</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Bottleneck Identification */}
        <Card>
          <CardHeader>
            <CardTitle>Recruitment Bottlenecks</CardTitle>
            <CardDescription>Identify stages where candidates drop off</CardDescription>
          </CardHeader>
          <CardContent>
            {funnelLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : conversionFunnel && Object.keys(conversionFunnel).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(conversionFunnel).map(([stage, count]: [string, any], idx: number) => {
                  if (idx === 0) return null;
                  const prevEntry = Object.entries(conversionFunnel)[idx - 1];
                  const prevStage = prevEntry[0];
                  const prevCount = prevEntry[1] as number;
                  const dropOff = prevCount - count;
                  const dropOffRate = prevCount > 0 
                    ? Math.round((dropOff / prevCount) * 100) 
                    : 0;
                  
                  return (
                    <div key={idx} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">
                          {prevStage} → {stage}
                        </p>
                        <p className="text-sm text-gray-600">
                          {dropOff} candidates dropped ({dropOffRate}% drop-off rate)
                        </p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                        dropOffRate > 50 ? 'bg-red-100 text-red-800' :
                        dropOffRate > 30 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {dropOffRate > 50 ? 'High Risk' :
                         dropOffRate > 30 ? 'Monitor' :
                         'Healthy'}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-12">No data available for the selected period</p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
