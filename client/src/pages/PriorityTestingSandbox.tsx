import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, PlayCircle, AlertTriangle, CheckCircle, XCircle, TrendingUp, TrendingDown } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

export default function PriorityTestingSandbox() {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [selectedNotification, setSelectedNotification] = useState<any>(null);
  
  const { data: sampleNotifications } = trpc.priorityTesting.getSampleNotifications.useQuery();
  
  const runFullTest = trpc.priorityTesting.runFullTest.useMutation({
    onSuccess: (results) => {
      setTestResults(results);
      toast.success(`Test completed! Evaluated ${results.length} notifications`);
    },
    onError: (error) => {
      toast.error(`Test failed: ${error.message}`);
    },
  });
  
  const testSingleNotification = trpc.priorityTesting.testNotification.useMutation({
    onSuccess: (result) => {
      setSelectedNotification(result);
      toast.success("Notification tested successfully");
    },
    onError: (error) => {
      toast.error(`Test failed: ${error.message}`);
    },
  });
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-500";
      case "high":
        return "bg-orange-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-gray-400";
      default:
        return "bg-gray-300";
    }
  };
  
  const getPriorityBadgeVariant = (priority: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (priority) {
      case "critical":
        return "destructive";
      case "high":
        return "default";
      case "medium":
        return "secondary";
      default:
        return "outline";
    }
  };
  
  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Priority Rule Testing Sandbox</h1>
          <p className="text-muted-foreground mt-2">
            Test your priority rules against sample notifications to verify expected behavior
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Run Full Test Suite</CardTitle>
            <CardDescription>
              Test all your active priority rules against 6 sample notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => runFullTest.mutate()}
              disabled={runFullTest.isPending}
              size="lg"
            >
              {runFullTest.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              <PlayCircle className="mr-2 h-5 w-5" />
              Run Full Test
            </Button>
          </CardContent>
        </Card>
        
        {testResults.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Test Results</h2>
            
            {testResults.map((result, index) => (
              <Card key={index} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{result.notification.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {result.notification.body}
                      </CardDescription>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {result.notification.candidateStage && (
                          <Badge variant="outline">Stage: {result.notification.candidateStage}</Badge>
                        )}
                        {result.notification.jobDepartment && (
                          <Badge variant="outline">Dept: {result.notification.jobDepartment}</Badge>
                        )}
                        {result.notification.eventTime && (
                          <Badge variant="outline">
                            Event: {new Date(result.notification.eventTime).toLocaleString()}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 ml-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Original:</span>
                        <Badge variant={getPriorityBadgeVariant(result.originalPriority)}>
                          {result.originalPriority}
                        </Badge>
                      </div>
                      {result.originalPriority !== result.finalPriority && (
                        <>
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Final:</span>
                            <Badge variant={getPriorityBadgeVariant(result.finalPriority)}>
                              {result.finalPriority}
                            </Badge>
                          </div>
                        </>
                      )}
                      {result.finalBoost !== 0 && (
                        <Badge variant="secondary">
                          Boost: {result.finalBoost > 0 ? "+" : ""}{result.finalBoost}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  {result.appliedRules.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Applied Rules:</h4>
                      <div className="flex flex-wrap gap-2">
                        {result.appliedRules.map((ruleName: string, idx: number) => (
                          <Badge key={idx} variant="default">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            {ruleName}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {result.conflicts.length > 0 && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Conflicts Detected:</strong>
                        <ul className="list-disc list-inside mt-1">
                          {result.conflicts.map((conflict: string, idx: number) => (
                            <li key={idx} className="text-sm">{conflict}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {result.warnings.length > 0 && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Warnings:</strong>
                        <ul className="list-disc list-inside mt-1">
                          {result.warnings.map((warning: string, idx: number) => (
                            <li key={idx} className="text-sm">{warning}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <details className="text-sm">
                    <summary className="cursor-pointer font-semibold hover:text-primary">
                      View Evaluation Steps ({result.evaluationSteps.length} rules checked)
                    </summary>
                    <div className="mt-3 space-y-2 pl-4 border-l-2">
                      {result.evaluationSteps.map((step: any, idx: number) => (
                        <div key={idx} className="pb-2">
                          <div className="flex items-start gap-2">
                            {step.applied ? (
                              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                            ) : (
                              <XCircle className="h-4 w-4 text-gray-400 mt-0.5" />
                            )}
                            <div className="flex-1">
                              <p className="font-medium">{step.ruleName}</p>
                              <p className="text-muted-foreground text-xs">{step.reason}</p>
                              {step.applied && step.priorityBefore !== step.priorityAfter && (
                                <p className="text-xs mt-1">
                                  Priority: {step.priorityBefore} → {step.priorityAfter}
                                </p>
                              )}
                              {step.applied && step.boostBefore !== step.boostAfter && (
                                <p className="text-xs mt-1">
                                  Boost: {step.boostBefore} → {step.boostAfter} 
                                  ({step.boostAfter > step.boostBefore ? "+" : ""}
                                  {step.boostAfter - step.boostBefore})
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </details>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        
        {sampleNotifications && testResults.length === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Sample Notifications</CardTitle>
              <CardDescription>
                These are the notifications that will be used for testing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {sampleNotifications.map((notif: any) => (
                <div key={notif.id} className="p-3 border rounded-lg">
                  <h4 className="font-semibold">{notif.title}</h4>
                  <p className="text-sm text-muted-foreground">{notif.body}</p>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    <Badge variant="outline">{notif.type}</Badge>
                    {notif.candidateStage && (
                      <Badge variant="outline">Stage: {notif.candidateStage}</Badge>
                    )}
                    {notif.jobDepartment && (
                      <Badge variant="outline">Dept: {notif.jobDepartment}</Badge>
                    )}
                    {notif.eventTime && (
                      <Badge variant="outline">
                        Event: {new Date(notif.eventTime).toLocaleString()}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
