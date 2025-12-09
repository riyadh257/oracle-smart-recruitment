import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Calendar, Clock, Plus, Trash2, Users, TrendingUp, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function EmployerShiftScheduler() {
  const [, setLocation] = useLocation();
  const [employeeName, setEmployeeName] = useState("");
  const [shiftDate, setShiftDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [role, setRole] = useState("");

  const { data: shifts, refetch } = trpc.saas.getShifts.useQuery();
  const createShift = trpc.saas.createShift.useMutation({
    onSuccess: () => {
      toast.success("Shift created successfully");
      setEmployeeName("");
      setShiftDate("");
      setStartTime("");
      setEndTime("");
      setRole("");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create shift");
    }
  });

  const deleteShift = trpc.saas.deleteShift.useMutation({
    onSuccess: () => {
      toast.success("Shift deleted");
      refetch();
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeName || !shiftDate || !startTime || !endTime || !role) {
      toast.error("Please fill all fields");
      return;
    }

    createShift.mutate({
      employeeName,
      shiftDate,
      startTime,
      endTime,
      role
    });
  };

  // Calculate insights from shift data
  const insights = shifts ? {
    totalShifts: shifts.length,
    uniqueEmployees: new Set(shifts.map((s: any) => s.employeeName)).size,
    roleDistribution: shifts.reduce((acc: any, shift: any) => {
      acc[shift.role] = (acc[shift.role] || 0) + 1;
      return acc;
    }, {}),
    upcomingShifts: shifts.filter((s: any) => new Date(s.shiftDate) >= new Date()).length
  } : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => setLocation("/employer/dashboard")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="h-6 w-6 text-blue-600" />
                Shift Scheduler
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Strategic Value Banner */}
        <Card className="mb-8 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 mb-2">Predictive Hiring Intelligence</h3>
                <p className="text-sm text-slate-600 mb-3">
                  Our shift scheduler doesn't just organize your workforce—it predicts your hiring needs. By analyzing shift patterns,
                  employee availability, and workload trends, Oracle Smart Recruitment proactively identifies staffing gaps
                  <strong className="text-blue-700"> before you need to post a job</strong>.
                </p>
                <div className="grid md:grid-cols-3 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 bg-blue-600 rounded-full"></div>
                    <span className="text-slate-700">Automatic demand forecasting</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 bg-purple-600 rounded-full"></div>
                    <span className="text-slate-700">Skill gap detection</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 bg-green-600 rounded-full"></div>
                    <span className="text-slate-700">Pre-matched candidate suggestions</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Create Shift Form */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5 text-blue-600" />
                  Create Shift
                </CardTitle>
                <CardDescription>
                  Schedule employee shifts to track workforce patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="employeeName">Employee Name</Label>
                    <Input
                      id="employeeName"
                      value={employeeName}
                      onChange={(e) => setEmployeeName(e.target.value)}
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <Label htmlFor="role">Role</Label>
                    <Input
                      id="role"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      placeholder="e.g., Cashier, Manager, Developer"
                    />
                  </div>

                  <div>
                    <Label htmlFor="shiftDate">Shift Date</Label>
                    <Input
                      id="shiftDate"
                      type="date"
                      value={shiftDate}
                      onChange={(e) => setShiftDate(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startTime">Start Time</Label>
                      <Input
                        id="startTime"
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="endTime">End Time</Label>
                      <Input
                        id="endTime"
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={createShift.isPending}>
                    {createShift.isPending ? "Creating..." : "Create Shift"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Insights Card */}
            {insights && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-base">Workforce Insights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Total Shifts</span>
                    <span className="font-semibold text-slate-900">{insights.totalShifts}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Active Employees</span>
                    <span className="font-semibold text-slate-900">{insights.uniqueEmployees}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Upcoming Shifts</span>
                    <span className="font-semibold text-slate-900">{insights.upcomingShifts}</span>
                  </div>
                  
                  {Object.keys(insights.roleDistribution).length > 0 && (
                    <div className="pt-3 border-t">
                      <p className="text-sm font-semibold text-slate-900 mb-2">Role Distribution</p>
                      {Object.entries(insights.roleDistribution).map(([role, count]) => (
                        <div key={role} className="flex justify-between items-center text-sm mb-1">
                          <span className="text-slate-600">{role}</span>
                          <span className="text-slate-900">{count as number}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Shift List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  Scheduled Shifts
                </CardTitle>
                <CardDescription>
                  View and manage all employee shifts
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!shifts || shifts.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">No shifts scheduled</h3>
                    <p className="text-slate-600">
                      Start creating shifts to track workforce patterns and predict hiring needs
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {shifts.map((shift: any) => (
                      <Card key={shift.id} className="border-slate-200">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                                  <Users className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                  <p className="font-semibold text-slate-900">{shift.employeeName}</p>
                                  <p className="text-sm text-slate-600">{shift.role}</p>
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-4 text-sm text-slate-600 ml-13">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  <span>{new Date(shift.shiftDate).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  <span>{shift.startTime} - {shift.endTime}</span>
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteShift.mutate({ id: shift.id })}
                              disabled={deleteShift.isPending}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* AI Prediction Notice */}
            {shifts && shifts.length >= 5 && (
              <Card className="mt-6 border-orange-200 bg-orange-50">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="h-5 w-5 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 mb-1">AI Hiring Prediction Active</h3>
                      <p className="text-sm text-slate-600 mb-3">
                        Our AI is analyzing your shift patterns. With {shifts.length} shifts recorded, we can now predict:
                      </p>
                      <ul className="text-sm text-slate-700 space-y-1">
                        <li>• Peak demand periods requiring additional staff</li>
                        <li>• Skill gaps in your current workforce</li>
                        <li>• Optimal timing for new hires</li>
                        <li>• Pre-matched candidates for predicted needs</li>
                      </ul>
                      <Button size="sm" className="mt-4" onClick={() => setLocation("/employer/dashboard")}>
                        View Hiring Predictions
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
