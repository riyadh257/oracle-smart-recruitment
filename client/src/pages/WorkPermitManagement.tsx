import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, AlertTriangle, CheckCircle2, Clock, FileText, IdCard, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

export default function WorkPermitManagement() {
  const { user } = useAuth();

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <IdCard className="h-8 w-8 text-primary" />
            Work Permit & Iqama Management
          </h1>
          <p className="text-muted-foreground">
            Validate Iqama status and track expiring work permits for compliance
          </p>
        </div>

        <Tabs defaultValue="validate" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="validate">Iqama Validator</TabsTrigger>
            <TabsTrigger value="expiring">Expiring Permits</TabsTrigger>
          </TabsList>

          <TabsContent value="validate">
            <IqamaValidator />
          </TabsContent>

          <TabsContent value="expiring">
            <ExpiringPermits />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

function IqamaValidator() {
  const [iqamaNumber, setIqamaNumber] = useState<string>("");
  const [expiryDate, setExpiryDate] = useState<string>("");

  const validateIqama = trpc.ksaCompliance.workPermits.validateIqama.useQuery(
    {
      iqamaNumber,
      expiryDate: new Date(expiryDate)
    },
    { enabled: !!iqamaNumber && !!expiryDate }
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IdCard className="h-5 w-5" />
          Iqama Validation
        </CardTitle>
        <CardDescription>
          Validate Iqama (residency permit) status and expiry date
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="iqama-number">Iqama Number</Label>
            <Input
              id="iqama-number"
              value={iqamaNumber}
              onChange={(e) => setIqamaNumber(e.target.value)}
              placeholder="e.g., 2123456789"
              maxLength={10}
            />
            <p className="text-xs text-muted-foreground">
              10-digit Iqama number
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiry-date">Expiry Date</Label>
            <Input
              id="expiry-date"
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
            />
          </div>
        </div>

        {validateIqama.data && (
          <Alert className={
            validateIqama.data.status === "valid" ? "border-green-500" :
            validateIqama.data.status === "expiring_soon" ? "border-yellow-500" :
            "border-red-500"
          }>
            <AlertDescription className="space-y-4">
              <div className="flex items-center gap-3">
                {validateIqama.data.status === "valid" && (
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                )}
                {validateIqama.data.status === "expiring_soon" && (
                  <AlertTriangle className="h-6 w-6 text-yellow-600" />
                )}
                {validateIqama.data.status === "expired" && (
                  <XCircle className="h-6 w-6 text-red-600" />
                )}
                <div>
                  <p className="font-bold text-lg">
                    {validateIqama.data.status === "valid" && "Valid Iqama"}
                    {validateIqama.data.status === "expiring_soon" && "Expiring Soon"}
                    {validateIqama.data.status === "expired" && "Expired Iqama"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {validateIqama.data.message}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <p className="text-sm font-medium">Days Until Expiry</p>
                  <p className="text-2xl font-bold">
                    {validateIqama.data.daysUntilExpiry} days
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Expiry Date</p>
                  <p className="text-lg font-semibold">
                    {new Date(validateIqama.data.expiryDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {validateIqama.data.renewalRequired && (
                <div className="pt-2 border-t">
                  <p className="text-sm font-medium text-red-600">⚠️ Action Required</p>
                  <p className="text-sm">
                    Renewal process should be initiated immediately to avoid legal issues
                  </p>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        <div className="text-sm text-muted-foreground space-y-2">
          <p className="font-medium">Iqama Validation Rules:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Iqama must be valid for at least 90 days for work permit renewal</li>
            <li>Expiring within 90 days: Renewal process should begin</li>
            <li>Expired Iqama: Employee cannot legally work</li>
            <li>Iqama number must be 10 digits starting with 1 or 2</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

function ExpiringPermits() {
  const { user } = useAuth();
  const [daysAhead, setDaysAhead] = useState<number>(90);
  
  // Fetch employer profile to get employerId
  const { data: employer } = trpc.employers.getProfile.useQuery();

  const expiringPermits = trpc.ksaCompliance.workPermits.getExpiringPermits.useQuery(
    {
      employerId: employer?.id || 0,
      daysAhead
    },
    { enabled: !!employer?.id }
  );

  const getStatusBadge = (daysUntilExpiry: number) => {
    if (daysUntilExpiry < 0) {
      return <Badge variant="destructive">Expired</Badge>;
    } else if (daysUntilExpiry <= 30) {
      return <Badge className="bg-red-500 hover:bg-red-600">Critical</Badge>;
    } else if (daysUntilExpiry <= 60) {
      return <Badge className="bg-yellow-500 hover:bg-yellow-600">Warning</Badge>;
    } else {
      return <Badge className="bg-blue-500 hover:bg-blue-600">Upcoming</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Expiring Work Permits
        </CardTitle>
        <CardDescription>
          Track work permits expiring within the next {daysAhead} days
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4">
          <Label htmlFor="days-ahead">Alert Period (days)</Label>
          <Input
            id="days-ahead"
            type="number"
            value={daysAhead}
            onChange={(e) => setDaysAhead(parseInt(e.target.value) || 90)}
            className="w-32"
            min={30}
            max={365}
          />
        </div>

        {expiringPermits.isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {expiringPermits.data && expiringPermits.data.length === 0 && (
          <Alert className="border-green-500">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription>
              No work permits expiring within the next {daysAhead} days. All permits are up to date!
            </AlertDescription>
          </Alert>
        )}

        {expiringPermits.data && expiringPermits.data.length > 0 && (
          <>
            <Alert className="border-yellow-500">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription>
                Found {expiringPermits.data.length} work permit(s) expiring within {daysAhead} days
              </AlertDescription>
            </Alert>

            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Permit Number</TableHead>
                    <TableHead>Employee Name</TableHead>
                    <TableHead>Occupation</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Days Left</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expiringPermits.data.map((permit) => {
                    const daysLeft = permit.validation.daysUntilExpiry;
                    return (
                      <TableRow key={permit.id}>
                        <TableCell className="font-mono text-sm">
                          {permit.permitNumber}
                        </TableCell>
                        <TableCell className="font-medium">
                          {permit.employeeName}
                        </TableCell>
                        <TableCell>
                          {permit.occupation || "—"}
                        </TableCell>
                        <TableCell>
                          {new Date(permit.expiryDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {daysLeft} days
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(daysLeft)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </>
        )}

        <div className="text-sm text-muted-foreground space-y-2">
          <p className="font-medium">Renewal Timeline:</p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>90+ days:</strong> Monitor and plan renewal</li>
            <li><strong>60-90 days:</strong> Begin renewal application process</li>
            <li><strong>30-60 days:</strong> Ensure all documents are submitted</li>
            <li><strong>&lt;30 days:</strong> Critical - expedite renewal immediately</li>
            <li><strong>Expired:</strong> Employee cannot legally work - urgent action required</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
