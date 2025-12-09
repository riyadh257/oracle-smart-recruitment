import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Brain, TrendingUp, Filter, AlertTriangle } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/**
 * Notification Priority Settings Page
 * 
 * Allows users to manage smart notification filtering including:
 * - View and configure priority rules
 * - Enable/disable automatic suppression
 * - Recalculate priorities based on behavior
 * - View suppressed notifications and statistics
 */
export default function NotificationPriority() {
  const { user, loading: authLoading } = useAuth();
  const utils = trpc.useUtils();

  const { data: rules, isLoading } = trpc.notificationPriority.getRules.useQuery(undefined, {
    enabled: !!user,
  });

  const { data: behaviorStats } = trpc.notificationBehavior.getStats.useQuery(
    { days: 30 },
    { enabled: !!user }
  );

  const { data: suppressedNotifications } = trpc.notificationPriority.getSuppressed.useQuery(
    { days: 7 },
    { enabled: !!user }
  );

  const { data: suppressionStats } = trpc.notificationPriority.getSuppressionStats.useQuery(
    { days: 30 },
    { enabled: !!user }
  );

  const updateRule = trpc.notificationPriority.updateRule.useMutation({
    onSuccess: () => {
      toast.success("Priority rule updated successfully");
      utils.notificationPriority.getRules.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to update rule: ${error.message}`);
    },
  });

  const recalculate = trpc.notificationPriority.recalculate.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      utils.notificationPriority.getRules.invalidate();
      utils.notificationBehavior.getStats.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to recalculate: ${error.message}`);
    },
  });

  const [editingRule, setEditingRule] = useState<string | null>(null);
  const [ruleSettings, setRuleSettings] = useState<{
    [key: string]: {
      priority: string;
      suppressIfLowPriority: boolean;
      minPriorityThreshold: string;
    };
  }>({});

  const notificationTypes = [
    { value: "feedback_submitted", label: "Feedback Submitted" },
    { value: "interview_scheduled", label: "Interview Scheduled" },
    { value: "candidate_status_change", label: "Candidate Status Change" },
    { value: "digest", label: "Digest" },
  ];

  const priorityLevels = [
    { value: "critical", label: "Critical", color: "destructive" },
    { value: "high", label: "High", color: "default" },
    { value: "medium", label: "Medium", color: "secondary" },
    { value: "low", label: "Low", color: "outline" },
  ];

  const getPriorityColor = (priority: string) => {
    const level = priorityLevels.find((p) => p.value === priority);
    return level?.color || "secondary";
  };

  const handleUpdateRule = (notificationType: string) => {
    const settings = ruleSettings[notificationType];
    if (!settings) return;

    updateRule.mutate({
      notificationType: notificationType as any,
      priority: settings.priority as any,
      suppressIfLowPriority: settings.suppressIfLowPriority,
      minPriorityThreshold: settings.minPriorityThreshold as any,
    });

    setEditingRule(null);
  };

  const startEditing = (notificationType: string, rule: any) => {
    setEditingRule(notificationType);
    setRuleSettings({
      ...ruleSettings,
      [notificationType]: {
        priority: rule?.priority || "medium",
        suppressIfLowPriority: rule?.suppressIfLowPriority || false,
        minPriorityThreshold: rule?.minPriorityThreshold || "low",
      },
    });
  };

  if (authLoading || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container max-w-6xl py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Notification Priority & Filtering</h1>
          <p className="text-muted-foreground mt-2">
            Manage smart notification filtering based on your engagement patterns
          </p>
        </div>

        <Tabs defaultValue="rules" className="space-y-6">
          <TabsList>
            <TabsTrigger value="rules">Priority Rules</TabsTrigger>
            <TabsTrigger value="behavior">Behavior Stats</TabsTrigger>
            <TabsTrigger value="suppressed">Suppressed</TabsTrigger>
          </TabsList>

          {/* Priority Rules Tab */}
          <TabsContent value="rules" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Smart Priority Rules
                </CardTitle>
                <CardDescription>
                  Configure how notifications are prioritized and filtered based on your behavior
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() => recalculate.mutate()}
                    disabled={recalculate.isPending}
                  >
                    {recalculate.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Recalculate Priorities
                  </Button>
                </div>

                {notificationTypes.map((type) => {
                  const rule = rules?.find((r) => r.notificationType === type.value);
                  const isEditing = editingRule === type.value;
                  const settings = ruleSettings[type.value];

                  return (
                    <div key={type.value} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <h3 className="font-medium">{type.label}</h3>
                          {rule && (
                            <Badge variant={getPriorityColor(rule.priority) as any}>
                              {rule.priority}
                            </Badge>
                          )}
                          {rule?.autoCalculated && (
                            <Badge variant="outline">Auto</Badge>
                          )}
                        </div>
                        {!isEditing && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditing(type.value, rule)}
                          >
                            Edit
                          </Button>
                        )}
                      </div>

                      {rule && (
                        <div className="text-sm text-muted-foreground">
                          Engagement Score: {rule.engagementScore || 50}/100
                        </div>
                      )}

                      {isEditing && settings && (
                        <div className="space-y-4 pt-2">
                          <div className="space-y-2">
                            <Label>Priority Level</Label>
                            <Select
                              value={settings.priority}
                              onValueChange={(value) =>
                                setRuleSettings({
                                  ...ruleSettings,
                                  [type.value]: { ...settings, priority: value },
                                })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {priorityLevels.map((level) => (
                                  <SelectItem key={level.value} value={level.value}>
                                    {level.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label>Suppress Low Priority</Label>
                              <p className="text-sm text-muted-foreground">
                                Automatically filter out low-priority notifications
                              </p>
                            </div>
                            <Switch
                              checked={settings.suppressIfLowPriority}
                              onCheckedChange={(checked) =>
                                setRuleSettings({
                                  ...ruleSettings,
                                  [type.value]: { ...settings, suppressIfLowPriority: checked },
                                })
                              }
                            />
                          </div>

                          {settings.suppressIfLowPriority && (
                            <div className="space-y-2">
                              <Label>Minimum Priority Threshold</Label>
                              <Select
                                value={settings.minPriorityThreshold}
                                onValueChange={(value) =>
                                  setRuleSettings({
                                    ...ruleSettings,
                                    [type.value]: { ...settings, minPriorityThreshold: value },
                                  })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {priorityLevels.map((level) => (
                                    <SelectItem key={level.value} value={level.value}>
                                      {level.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <p className="text-sm text-muted-foreground">
                                Notifications below this priority will be suppressed
                              </p>
                            </div>
                          )}

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleUpdateRule(type.value)}
                              disabled={updateRule.isPending}
                            >
                              {updateRule.isPending && (
                                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                              )}
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingRule(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Behavior Stats Tab */}
          <TabsContent value="behavior" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Engagement Statistics
                </CardTitle>
                <CardDescription>
                  Your notification interaction patterns over the last 30 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                {behaviorStats ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 border rounded-lg">
                        <p className="text-sm text-muted-foreground">Open Rate</p>
                        <p className="text-2xl font-bold">{behaviorStats.openRate}%</p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <p className="text-sm text-muted-foreground">Click Rate</p>
                        <p className="text-2xl font-bold">{behaviorStats.clickRate}%</p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <p className="text-sm text-muted-foreground">Action Rate</p>
                        <p className="text-2xl font-bold">{behaviorStats.actionRate}%</p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <p className="text-sm text-muted-foreground">Dismiss Rate</p>
                        <p className="text-2xl font-bold">{behaviorStats.dismissRate}%</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium">By Notification Type</h4>
                      {Object.entries(behaviorStats.byType).map(([type, stats]: [string, any]) => (
                        <div key={type} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium capitalize">
                              {type.replace(/_/g, " ")}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {stats.total} total
                            </span>
                          </div>
                          <div className="grid grid-cols-4 gap-2 text-sm">
                            <div>
                              <p className="text-muted-foreground">Opened</p>
                              <p className="font-medium">{stats.opened}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Clicked</p>
                              <p className="font-medium">{stats.clicked}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Action</p>
                              <p className="font-medium">{stats.actionTaken}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Dismissed</p>
                              <p className="font-medium">{stats.dismissed}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No behavior data available yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Suppressed Notifications Tab */}
          <TabsContent value="suppressed" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Suppressed Notifications
                </CardTitle>
                <CardDescription>
                  Notifications that were automatically filtered in the last 7 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                {suppressionStats && (
                  <div className="mb-6 p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="font-medium">
                        {suppressionStats.total} notifications suppressed in the last 30 days
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">By Type</p>
                        {Object.entries(suppressionStats.byType).map(([type, count]) => (
                          <div key={type} className="flex justify-between text-sm">
                            <span className="capitalize">{type.replace(/_/g, " ")}</span>
                            <span className="font-medium">{count as number}</span>
                          </div>
                        ))}
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">By Priority</p>
                        {Object.entries(suppressionStats.byPriority).map(([priority, count]) => (
                          <div key={priority} className="flex justify-between text-sm">
                            <span className="capitalize">{priority}</span>
                            <span className="font-medium">{count as number}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {suppressedNotifications && suppressedNotifications.length > 0 ? (
                    suppressedNotifications.map((notification) => (
                      <div key={notification.id} className="p-4 border rounded-lg space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium">{notification.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {notification.body}
                            </p>
                          </div>
                          <Badge variant={getPriorityColor(notification.calculatedPriority) as any}>
                            {notification.calculatedPriority}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          <p>Reason: {notification.suppressedReason}</p>
                          <p>
                            Suppressed: {new Date(notification.suppressedAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      No suppressed notifications in the last 7 days
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
