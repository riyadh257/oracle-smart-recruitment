import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Clock, Award, TrendingUp, CheckCircle2, PlayCircle } from "lucide-react";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";

export default function MyLearning() {
  const [, setLocation] = useLocation();
  const [statusFilter, setStatusFilter] = useState<"all" | "in_progress" | "completed">("all");

  const { data: enrollments, isLoading } = trpc.training.getMyEnrollments.useQuery({
    status: statusFilter === "all" ? undefined : statusFilter,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'enrolled': return 'bg-gray-100 text-gray-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'dropped': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const inProgressCount = enrollments?.filter(e => e.enrollment.status === 'in_progress').length || 0;
  const completedCount = enrollments?.filter(e => e.enrollment.status === 'completed').length || 0;
  const totalTimeSpent = enrollments?.reduce((sum, e) => sum + (e.enrollment.timeSpent || 0), 0) || 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">My Learning</h1>
          <p className="text-gray-600 mt-1">Track your progress and continue learning</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Enrolled</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{enrollments?.length || 0}</div>
              <p className="text-xs text-gray-500 mt-1">courses</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">In Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{inProgressCount}</div>
              <p className="text-xs text-gray-500 mt-1">active courses</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{completedCount}</div>
              <p className="text-xs text-gray-500 mt-1">certificates earned</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Time Invested</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">
                {Math.round(totalTimeSpent / 60)}h
              </div>
              <p className="text-xs text-gray-500 mt-1">learning time</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for filtering */}
        <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)} className="w-full">
          <TabsList>
            <TabsTrigger value="all">All Courses</TabsTrigger>
            <TabsTrigger value="in_progress">In Progress</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value={statusFilter} className="mt-6">
            {isLoading ? (
              <div className="grid md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-2 bg-gray-200 rounded w-full"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : enrollments && enrollments.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-4">
                {enrollments.map(({ enrollment, program }) => {
                  if (!program) return null;
                  
                  return (
                    <Card key={enrollment.id} className="hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => setLocation(`/learning/${enrollment.id}`)}>
                      <CardHeader>
                        <div className="flex items-start justify-between mb-2">
                          <Badge className={getStatusColor(enrollment.status)}>
                            {enrollment.status.replace('_', ' ')}
                          </Badge>
                          {enrollment.status === 'completed' && (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          )}
                        </div>
                        <CardTitle className="line-clamp-2">{program.title}</CardTitle>
                        <CardDescription className="line-clamp-2">
                          {program.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Progress Bar */}
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-600">Progress</span>
                            <span className="font-medium">{(enrollment.progress / 100).toFixed(0)}%</span>
                          </div>
                          <Progress value={enrollment.progress / 100} className="h-2" />
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {formatDuration(enrollment.timeSpent || 0)}
                          </div>
                          {program.duration && (
                            <div className="flex items-center gap-1">
                              <BookOpen className="h-4 w-4" />
                              {program.duration}h total
                            </div>
                          )}
                          {enrollment.status === 'completed' && program.certificateAwarded === 1 && (
                            <div className="flex items-center gap-1 text-green-600">
                              <Award className="h-4 w-4" />
                              Certificate
                            </div>
                          )}
                        </div>

                        {/* Action Button */}
                        <Button 
                          className="w-full"
                          variant={enrollment.status === 'completed' ? 'outline' : 'default'}
                          onClick={(e) => {
                            e.stopPropagation();
                            setLocation(`/learning/${enrollment.id}`);
                          }}
                        >
                          {enrollment.status === 'completed' ? (
                            <>
                              <Award className="h-4 w-4 mr-2" />
                              View Certificate
                            </>
                          ) : (
                            <>
                              <PlayCircle className="h-4 w-4 mr-2" />
                              Continue Learning
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No courses yet</h3>
                  <p className="text-gray-600 mb-4">
                    {statusFilter === "all" 
                      ? "Start your learning journey by enrolling in a course"
                      : `No ${statusFilter.replace('_', ' ')} courses`}
                  </p>
                  <Button onClick={() => setLocation("/training")}>
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Browse Courses
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        {enrollments && enrollments.length > 0 && (
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Keep Learning
              </CardTitle>
              <CardDescription>
                Discover more courses to advance your skills
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setLocation("/training")}>
                Explore More Courses
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
