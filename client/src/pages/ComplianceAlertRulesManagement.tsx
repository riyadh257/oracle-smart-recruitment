import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Plus, MoreVertical, Edit, Trash2, Power, PowerOff, Settings } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

export default function ComplianceAlertRulesManagement() {
  const [, navigate] = useLocation();
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Placeholder data - will be replaced with actual tRPC queries
  const rules = [
    {
      id: 1,
      name: "Iqama Expiry Monitoring",
      description: "Alert when Iqama documents are expiring within 30 days",
      isActive: 1,
      monitoredTable: "workPermits",
      conditionType: "threshold",
      severity: "high",
      notifyInApp: 1,
      notifyEmail: 1,
    },
    {
      id: 2,
      name: "Saudization Ratio Alert",
      description: "Alert when Saudization ratio drops below threshold",
      isActive: 1,
      monitoredTable: "saudizationTracking",
      conditionType: "threshold",
      severity: "critical",
      notifyInApp: 1,
      notifyEmail: 1,
    },
    {
      id: 3,
      name: "Missing Contract Data",
      description: "Alert when employee contracts are missing end dates",
      isActive: 0,
      monitoredTable: "employmentContracts",
      conditionType: "missing_data",
      severity: "medium",
      notifyInApp: 1,
      notifyEmail: 0,
    },
  ];

  const handleToggleActive = (ruleId: number) => {
    toast.success("Rule status updated");
    // TODO: Implement toggle mutation
  };

  const handleDelete = (ruleId: number) => {
    toast.success("Rule deleted");
    setDeleteId(null);
    // TODO: Implement delete mutation
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "destructive";
      case "high":
        return "default";
      case "medium":
        return "secondary";
      case "low":
        return "outline";
      default:
        return "outline";
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Settings className="w-8 h-8" />
              Alert Rules Management
            </h1>
            <p className="text-muted-foreground mt-2">
              Configure and manage compliance alert rules
            </p>
          </div>
          <Button onClick={() => navigate("/compliance-alerts/rules/new")}>
            <Plus className="w-4 h-4 mr-2" />
            New Rule
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Active Rules</CardTitle>
            <CardDescription>
              {rules.filter((r) => r.isActive).length} active rule{rules.filter((r) => r.isActive).length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Table</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Notifications</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell>
                      {rule.isActive ? (
                        <Badge variant="default" className="flex items-center gap-1 w-fit">
                          <Power className="w-3 h-3" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                          <PowerOff className="w-3 h-3" />
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{rule.name}</TableCell>
                    <TableCell className="max-w-xs truncate">{rule.description}</TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {rule.monitoredTable}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{rule.conditionType.replace("_", " ")}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getSeverityColor(rule.severity) as any}>
                        {rule.severity.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {rule.notifyInApp === 1 && (
                          <Badge variant="outline" className="text-xs">
                            App
                          </Badge>
                        )}
                        {rule.notifyEmail === 1 && (
                          <Badge variant="outline" className="text-xs">
                            Email
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => navigate(`/compliance-alerts/rules/${rule.id}/edit`)}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleActive(rule.id)}>
                            {rule.isActive ? (
                              <>
                                <PowerOff className="w-4 h-4 mr-2" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <Power className="w-4 h-4 mr-2" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeleteId(rule.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Alert Rule</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this alert rule? This action cannot be undone.
                All alert history associated with this rule will be preserved.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteId && handleDelete(deleteId)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
