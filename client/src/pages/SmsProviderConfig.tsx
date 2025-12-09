import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Edit, Trash2, MessageSquare, TrendingUp } from "lucide-react";

export default function SmsProviderConfig() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<"twilio" | "aws_sns">("twilio");
  const [editingConfig, setEditingConfig] = useState<any>(null);

  const employerId = 1; // TODO: Get from auth context

  const { data: configs, refetch: refetchConfigs } = trpc.smsProvider.getConfig.useQuery({ employerId });
  const { data: stats } = trpc.smsProvider.getStats.useQuery({ employerId });

  const createMutation = trpc.smsProvider.createConfig.useMutation({
    onSuccess: () => {
      toast.success("SMS provider configured successfully");
      setIsCreateDialogOpen(false);
      refetchConfigs();
    },
  });

  const updateMutation = trpc.smsProvider.updateConfig.useMutation({
    onSuccess: () => {
      toast.success("Configuration updated successfully");
      setEditingConfig(null);
      refetchConfigs();
    },
  });

  const deleteMutation = trpc.smsProvider.deleteConfig.useMutation({
    onSuccess: () => {
      toast.success("Provider configuration deleted");
      refetchConfigs();
    },
  });

  const handleCreateConfig = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    if (selectedProvider === "twilio") {
      createMutation.mutate({
        employerId,
        provider: "twilio",
        isActive: formData.get("isActive") === "on",
        twilioAccountSid: formData.get("twilioAccountSid") as string,
        twilioAuthToken: formData.get("twilioAuthToken") as string,
        twilioPhoneNumber: formData.get("twilioPhoneNumber") as string,
      });
    } else {
      createMutation.mutate({
        employerId,
        provider: "aws_sns",
        isActive: formData.get("isActive") === "on",
        awsAccessKeyId: formData.get("awsAccessKeyId") as string,
        awsSecretAccessKey: formData.get("awsSecretAccessKey") as string,
        awsRegion: formData.get("awsRegion") as string,
        awsSnsTopicArn: formData.get("awsSnsTopicArn") as string,
      });
    }
  };

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">SMS Provider Configuration</h1>
          <p className="text-muted-foreground mt-2">
            Configure Twilio or AWS SNS for SMS and WhatsApp delivery
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Provider
        </Button>
      </div>

      {/* Statistics Overview */}
      {stats && (
        <div className="grid grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSent}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Delivered</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.totalDelivered}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Failed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.totalFailed}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.deliveryRate}%</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Provider Configurations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {configs?.map((config) => (
          <Card key={config.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {config.provider === "twilio" ? "Twilio" : "AWS SNS"}
                    {config.isActive && <Badge variant="default">Active</Badge>}
                  </CardTitle>
                  <CardDescription className="mt-2">
                    {config.provider === "twilio"
                      ? `Phone: ${config.twilioPhoneNumber || "Not configured"}`
                      : `Region: ${config.awsRegion || "Not configured"}`}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Sent</p>
                    <p className="font-medium">{config.messagesSent}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Delivered</p>
                    <p className="font-medium text-green-600">{config.messagesDelivered}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Failed</p>
                    <p className="font-medium text-red-600">{config.messagesFailed}</p>
                  </div>
                </div>
                {config.lastUsedAt && (
                  <p className="text-xs text-muted-foreground">
                    Last used: {new Date(config.lastUsedAt).toLocaleString()}
                  </p>
                )}
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingConfig(config)}
                  >
                    <Edit className="mr-1 h-3 w-3" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (confirm("Delete this provider configuration?")) {
                        deleteMutation.mutate({ id: config.id, employerId });
                      }
                    }}
                  >
                    <Trash2 className="mr-1 h-3 w-3" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Provider Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add SMS Provider</DialogTitle>
            <DialogDescription>
              Configure a new SMS provider for sending messages
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateConfig}>
            <div className="space-y-4">
              <div>
                <Label>Provider</Label>
                <Select value={selectedProvider} onValueChange={(v: any) => setSelectedProvider(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="twilio">Twilio</SelectItem>
                    <SelectItem value="aws_sns">AWS SNS</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="isActive" name="isActive" />
                <Label htmlFor="isActive">Set as active provider</Label>
              </div>

              {selectedProvider === "twilio" ? (
                <>
                  <div>
                    <Label htmlFor="twilioAccountSid">Account SID</Label>
                    <Input id="twilioAccountSid" name="twilioAccountSid" required />
                  </div>
                  <div>
                    <Label htmlFor="twilioAuthToken">Auth Token</Label>
                    <Input id="twilioAuthToken" name="twilioAuthToken" type="password" required />
                  </div>
                  <div>
                    <Label htmlFor="twilioPhoneNumber">Phone Number</Label>
                    <Input id="twilioPhoneNumber" name="twilioPhoneNumber" placeholder="+1234567890" required />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <Label htmlFor="awsAccessKeyId">AWS Access Key ID</Label>
                    <Input id="awsAccessKeyId" name="awsAccessKeyId" required />
                  </div>
                  <div>
                    <Label htmlFor="awsSecretAccessKey">AWS Secret Access Key</Label>
                    <Input id="awsSecretAccessKey" name="awsSecretAccessKey" type="password" required />
                  </div>
                  <div>
                    <Label htmlFor="awsRegion">AWS Region</Label>
                    <Input id="awsRegion" name="awsRegion" placeholder="us-east-1" required />
                  </div>
                  <div>
                    <Label htmlFor="awsSnsTopicArn">SNS Topic ARN (Optional)</Label>
                    <Input id="awsSnsTopicArn" name="awsSnsTopicArn" placeholder="arn:aws:sns:..." />
                  </div>
                </>
              )}
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Saving..." : "Save Configuration"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
