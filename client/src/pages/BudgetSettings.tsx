import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Plus,
  Settings,
  TrendingUp,
  Trash2,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface ThresholdFormData {
  name: string;
  thresholdType: "monthly" | "weekly" | "daily" | "per_campaign" | "total";
  thresholdAmount: number;
  currency: string;
  warningPercentage: number;
  criticalPercentage: number;
  alertChannels: ("email" | "push" | "sms")[];
  alertRecipients: number[];
}

export default function BudgetSettings() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState<ThresholdFormData>({
    name: "",
    thresholdType: "monthly",
    thresholdAmount: 1000,
    currency: "SAR",
    warningPercentage: 80,
    criticalPercentage: 95,
    alertChannels: ["email", "push"],
    alertRecipients: [],
  });

  const utils = trpc.useUtils();

  // Queries
  const { data: thresholds, isLoading: loadingThresholds } =
    trpc.budgetManagement.getThresholds.useQuery();
  const { data: currentStatus, isLoading: loadingStatus } =
    trpc.budgetManagement.getCurrentStatus.useQuery();
  const { data: alerts, isLoading: loadingAlerts } =
    trpc.budgetManagement.getAlerts.useQuery({ limit: 10 });

  // Mutations
  const createThreshold = trpc.budgetManagement.createThreshold.useMutation({
    onSuccess: () => {
      toast.success("Budget threshold created successfully");
      setIsCreateDialogOpen(false);
      utils.budgetManagement.getThresholds.invalidate();
      utils.budgetManagement.getCurrentStatus.invalidate();
      resetForm();
    },
    onError: (error) => {
      toast.error(`Failed to create threshold: ${error.message}`);
    },
  });

  const deleteThreshold = trpc.budgetManagement.deleteThreshold.useMutation({
    onSuccess: () => {
      toast.success("Budget threshold deleted");
      utils.budgetManagement.getThresholds.invalidate();
      utils.budgetManagement.getCurrentStatus.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to delete threshold: ${error.message}`);
    },
  });

  const acknowledgeAlert = trpc.budgetManagement.acknowledgeAlert.useMutation({
    onSuccess: () => {
      toast.success("Alert acknowledged");
      utils.budgetManagement.getAlerts.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to acknowledge alert: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      thresholdType: "monthly",
      thresholdAmount: 1000,
      currency: "SAR",
      warningPercentage: 80,
      criticalPercentage: 95,
      alertChannels: ["email", "push"],
      alertRecipients: [],
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createThreshold.mutate(formData);
  };

  const handleChannelToggle = (channel: "email" | "push" | "sms") => {
    setFormData((prev) => ({
      ...prev,
      alertChannels: prev.alertChannels.includes(channel)
        ? prev.alertChannels.filter((c) => c !== channel)
        : [...prev.alertChannels, channel],
    }));
  };

  const getAlertLevelIcon = (level: string) => {
    switch (level) {
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "critical":
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case "exceeded":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  const getAlertLevelBadge = (level: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      warning: "secondary",
      critical: "default",
      exceeded: "destructive",
    };
    return (
      <Badge variant={variants[level] || "outline"} className="capitalize">
        {level}
      </Badge>
    );
  };

  if (loadingThresholds || loadingStatus) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading budget settings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Budget Management</h1>
          <p className="text-muted-foreground mt-2">
            Monitor and control SMS spending with configurable alerts
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Threshold
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Create Budget Threshold</DialogTitle>
                <DialogDescription>
                  Set up a new spending threshold with automated alerts
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Threshold Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g., Monthly SMS Budget"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="thresholdType">Period</Label>
                    <Select
                      value={formData.thresholdType}
                      onValueChange={(value: any) =>
                        setFormData({ ...formData, thresholdType: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="per_campaign">Per Campaign</SelectItem>
                        <SelectItem value="total">Total (All Time)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="thresholdAmount">Amount ({formData.currency})</Label>
                    <Input
                      id="thresholdAmount"
                      type="number"
                      min="1"
                      value={formData.thresholdAmount}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          thresholdAmount: parseInt(e.target.value),
                        })
                      }
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="warningPercentage">Warning at (%)</Label>
                    <Input
                      id="warningPercentage"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.warningPercentage}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          warningPercentage: parseInt(e.target.value),
                        })
                      }
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="criticalPercentage">Critical at (%)</Label>
                    <Input
                      id="criticalPercentage"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.criticalPercentage}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          criticalPercentage: parseInt(e.target.value),
                        })
                      }
                      required
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Alert Channels</Label>
                  <div className="flex gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="email"
                        checked={formData.alertChannels.includes("email")}
                        onCheckedChange={() => handleChannelToggle("email")}
                      />
                      <Label htmlFor="email" className="font-normal">
                        Email
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="push"
                        checked={formData.alertChannels.includes("push")}
                        onCheckedChange={() => handleChannelToggle("push")}
                      />
                      <Label htmlFor="push" className="font-normal">
                        Push Notification
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="sms"
                        checked={formData.alertChannels.includes("sms")}
                        onCheckedChange={() => handleChannelToggle("sms")}
                      />
                      <Label htmlFor="sms" className="font-normal">
                        SMS
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createThreshold.isPending}>
                  {createThreshold.isPending ? "Creating..." : "Create Threshold"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Current Status Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {currentStatus?.map((status) => {
          const threshold = thresholds?.find((t) => t.id === status.thresholdId);
          if (!threshold) return null;

          return (
            <Card key={status.thresholdId}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{status.thresholdName}</CardTitle>
                  {status.shouldAlert && getAlertLevelIcon(status.alertLevel || "")}
                </div>
                <CardDescription className="capitalize">
                  {threshold.thresholdType} Budget
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold">
                    {status.currentSpending.toLocaleString()}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    / {status.thresholdAmount.toLocaleString()} {threshold.currency}
                  </span>
                </div>
                <Progress value={status.percentageUsed} className="h-2" />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {status.percentageUsed}% used
                  </span>
                  <span className="text-muted-foreground">
                    {status.smsCount} SMS sent
                  </span>
                </div>
                {status.shouldAlert && (
                  <div className="pt-2">
                    {getAlertLevelBadge(status.alertLevel || "")}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Configured Thresholds */}
      <Card>
        <CardHeader>
          <CardTitle>Configured Thresholds</CardTitle>
          <CardDescription>
            Manage your budget thresholds and alert settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!thresholds || thresholds.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No budget thresholds configured. Create one to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Warning / Critical</TableHead>
                  <TableHead>Channels</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {thresholds.map((threshold) => (
                  <TableRow key={threshold.id}>
                    <TableCell className="font-medium">{threshold.name}</TableCell>
                    <TableCell className="capitalize">
                      {threshold.thresholdType}
                    </TableCell>
                    <TableCell>
                      {threshold.thresholdAmount.toLocaleString()} {threshold.currency}
                    </TableCell>
                    <TableCell>
                      {threshold.warningPercentage}% / {threshold.criticalPercentage}%
                    </TableCell>
                    <TableCell>
                      {(JSON.parse(threshold.alertChannels as any) as string[])
                        .join(", ")}
                    </TableCell>
                    <TableCell>
                      <Badge variant={threshold.isActive ? "default" : "secondary"}>
                        {threshold.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (
                            confirm(
                              `Are you sure you want to delete "${threshold.name}"?`
                            )
                          ) {
                            deleteThreshold.mutate({ id: threshold.id });
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Recent Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Alerts</CardTitle>
          <CardDescription>Latest budget alerts and notifications</CardDescription>
        </CardHeader>
        <CardContent>
          {!alerts || alerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No alerts triggered yet
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Level</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Spending</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alerts.map((alert) => (
                  <TableRow key={alert.id}>
                    <TableCell>{getAlertLevelBadge(alert.alertLevel)}</TableCell>
                    <TableCell className="max-w-md truncate">
                      {alert.message}
                    </TableCell>
                    <TableCell>
                      {alert.currentSpending.toLocaleString()} /{" "}
                      {alert.thresholdAmount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {new Date(alert.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {alert.acknowledged ? (
                        <Badge variant="outline">Acknowledged</Badge>
                      ) : (
                        <Badge variant="secondary">Pending</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {!alert.acknowledged && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => acknowledgeAlert.mutate({ id: alert.id })}
                        >
                          Acknowledge
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
