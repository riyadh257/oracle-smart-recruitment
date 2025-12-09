import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Edit, Trash2, AlertTriangle, FileText } from "lucide-react";

export function WorkPermitManagement() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState({
    permitNumber: "",
    employeeName: "",
    employeeNationalId: "",
    nationality: "",
    occupation: "",
    issueDate: "",
    expiryDate: "",
    status: "active",
    qiwaReferenceId: "",
    notes: "",
  });

  const { data: permits, refetch } = trpc.compliance.getWorkPermits.useQuery();
  const { data: expiringPermits } = trpc.compliance.getExpiringPermits.useQuery({ daysAhead: 30 });

  const createMutation = trpc.compliance.createWorkPermit.useMutation({
    onSuccess: () => {
      toast.success("Work permit created successfully");
      setShowAddDialog(false);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create work permit");
    },
  });

  const deleteMutation = trpc.compliance.deleteWorkPermit.useMutation({
    onSuccess: () => {
      toast.success("Work permit deleted successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete work permit");
    },
  });

  const resetForm = () => {
    setFormData({
      permitNumber: "",
      employeeName: "",
      employeeNationalId: "",
      nationality: "",
      occupation: "",
      issueDate: "",
      expiryDate: "",
      status: "active",
      qiwaReferenceId: "",
      notes: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    createMutation.mutate({
      permitNumber: formData.permitNumber,
      employeeName: formData.employeeName,
      employeeNationalId: formData.employeeNationalId || undefined,
      nationality: formData.nationality || undefined,
      occupation: formData.occupation || undefined,
      issueDate: new Date(formData.issueDate),
      expiryDate: new Date(formData.expiryDate),
      status: formData.status as any,
      qiwaReferenceId: formData.qiwaReferenceId || undefined,
      notes: formData.notes || undefined,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "expired":
        return "bg-red-100 text-red-800";
      case "pending_renewal":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-gray-100 text-gray-800";
      case "suspended":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getDaysUntilExpiry = (expiryDate: Date) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Work Permits</CardTitle>
            <CardDescription>Manage Qiwa work permits and renewals</CardDescription>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Permit
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Work Permit</DialogTitle>
                <DialogDescription>Enter work permit details</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="permitNumber">Permit Number *</Label>
                    <Input
                      id="permitNumber"
                      required
                      value={formData.permitNumber}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, permitNumber: e.target.value }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="employeeName">Employee Name *</Label>
                    <Input
                      id="employeeName"
                      required
                      value={formData.employeeName}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, employeeName: e.target.value }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="employeeNationalId">National ID</Label>
                    <Input
                      id="employeeNationalId"
                      value={formData.employeeNationalId}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, employeeNationalId: e.target.value }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nationality">Nationality</Label>
                    <Input
                      id="nationality"
                      value={formData.nationality}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, nationality: e.target.value }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="occupation">Occupation</Label>
                    <Input
                      id="occupation"
                      value={formData.occupation}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, occupation: e.target.value }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="qiwaReferenceId">Qiwa Reference ID</Label>
                    <Input
                      id="qiwaReferenceId"
                      value={formData.qiwaReferenceId}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, qiwaReferenceId: e.target.value }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="issueDate">Issue Date *</Label>
                    <Input
                      id="issueDate"
                      type="date"
                      required
                      value={formData.issueDate}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, issueDate: e.target.value }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expiryDate">Expiry Date *</Label>
                    <Input
                      id="expiryDate"
                      type="date"
                      required
                      value={formData.expiryDate}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, expiryDate: e.target.value }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger id="status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                        <SelectItem value="pending_renewal">Pending Renewal</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                    placeholder="Additional notes..."
                  />
                </div>

                <div className="flex gap-4">
                  <Button type="submit" disabled={createMutation.isPending} className="flex-1">
                    {createMutation.isPending ? "Creating..." : "Create Permit"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddDialog(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Expiring Permits Alert */}
        {expiringPermits && expiringPermits.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-yellow-900">Permits Expiring Soon</h4>
                <p className="text-sm text-yellow-800 mt-1">
                  {expiringPermits.length} work permit(s) expiring within 30 days
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Permits Table */}
        {permits && permits.length > 0 ? (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Permit #</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Occupation</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {permits.map((permit: any) => {
                  const daysUntilExpiry = getDaysUntilExpiry(permit.expiryDate);
                  const isExpiringSoon = daysUntilExpiry <= 30 && daysUntilExpiry > 0;

                  return (
                    <TableRow key={permit.id}>
                      <TableCell className="font-medium">{permit.permitNumber}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{permit.employeeName}</p>
                          {permit.nationality && (
                            <p className="text-sm text-muted-foreground">{permit.nationality}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{permit.occupation || "-"}</TableCell>
                      <TableCell>
                        <div>
                          <p>{new Date(permit.expiryDate).toLocaleDateString()}</p>
                          {isExpiringSoon && (
                            <p className="text-xs text-yellow-600 flex items-center gap-1 mt-1">
                              <AlertTriangle className="w-3 h-3" />
                              {daysUntilExpiry} days left
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(permit.status)}>
                          {permit.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button size="sm" variant="ghost">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              if (confirm("Are you sure you want to delete this permit?")) {
                                deleteMutation.mutate({ id: permit.id });
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No work permits found</p>
            <p className="text-sm text-muted-foreground mt-2">
              Click "Add Permit" to create your first work permit
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
