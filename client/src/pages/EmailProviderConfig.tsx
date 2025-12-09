import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, XCircle, Mail, BarChart3 } from "lucide-react";
import { toast } from "sonner";

export default function EmailProviderConfig() {
  const [selectedProvider, setSelectedProvider] = useState<"sendgrid" | "aws-ses" | "mock">("mock");
  const [testingConnection, setTestingConnection] = useState(false);
  
  // SendGrid fields
  const [sendgridApiKey, setSendgridApiKey] = useState("");
  const [sendgridFromEmail, setSendgridFromEmail] = useState("");
  const [sendgridFromName, setSendgridFromName] = useState("");
  
  // AWS SES fields
  const [awsAccessKeyId, setAwsAccessKeyId] = useState("");
  const [awsSecretAccessKey, setAwsSecretAccessKey] = useState("");
  const [awsRegion, setAwsRegion] = useState("us-east-1");
  const [awsSesFromEmail, setAwsSesFromEmail] = useState("");
  const [awsSesFromName, setAwsSesFromName] = useState("");
  
  const { data: settings, refetch: refetchSettings } = trpc.emailProvider.getSettings.useQuery();
  const { data: activeProvider } = trpc.emailProvider.getActive.useQuery();
  const { data: sendgridStats } = trpc.emailProvider.getStats.useQuery({ provider: "sendgrid" });
  const { data: awsStats } = trpc.emailProvider.getStats.useQuery({ provider: "aws-ses" });
  
  const upsertMutation = trpc.emailProvider.upsert.useMutation({
    onSuccess: () => {
      toast.success("Email provider settings saved successfully");
      refetchSettings();
    },
    onError: (error) => {
      toast.error(`Failed to save settings: ${error.message}`);
    },
  });
  
  const testConnectionMutation = trpc.emailProvider.testConnection.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast.success(`Connection test successful! Message ID: ${result.messageId}`);
      } else {
        toast.error(`Connection test failed: ${result.error}`);
      }
      setTestingConnection(false);
    },
    onError: (error) => {
      toast.error(`Connection test failed: ${error.message}`);
      setTestingConnection(false);
    },
  });
  
  const setActiveMutation = trpc.emailProvider.setActive.useMutation({
    onSuccess: () => {
      toast.success("Active email provider updated");
      refetchSettings();
    },
    onError: (error) => {
      toast.error(`Failed to set active provider: ${error.message}`);
    },
  });
  
  const handleSave = () => {
    const data: any = {
      provider: selectedProvider,
    };
    
    if (selectedProvider === "sendgrid") {
      data.sendgridApiKey = sendgridApiKey;
      data.sendgridFromEmail = sendgridFromEmail;
      data.sendgridFromName = sendgridFromName;
    } else if (selectedProvider === "aws-ses") {
      data.awsAccessKeyId = awsAccessKeyId;
      data.awsSecretAccessKey = awsSecretAccessKey;
      data.awsRegion = awsRegion;
      data.awsSesFromEmail = awsSesFromEmail;
      data.awsSesFromName = awsSesFromName;
    }
    
    upsertMutation.mutate(data);
  };
  
  const handleTestConnection = () => {
    setTestingConnection(true);
    
    const data: any = {
      provider: selectedProvider,
    };
    
    if (selectedProvider === "sendgrid") {
      data.sendgridApiKey = sendgridApiKey;
      data.sendgridFromEmail = sendgridFromEmail;
    } else if (selectedProvider === "aws-ses") {
      data.awsAccessKeyId = awsAccessKeyId;
      data.awsSecretAccessKey = awsSecretAccessKey;
      data.awsRegion = awsRegion;
      data.awsSesFromEmail = awsSesFromEmail;
    }
    
    testConnectionMutation.mutate(data);
  };
  
  const handleSetActive = () => {
    setActiveMutation.mutate({ provider: selectedProvider });
  };
  
  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Email Provider Configuration</h1>
        <p className="text-muted-foreground mt-2">
          Configure your email service provider for sending digest emails and notifications
        </p>
      </div>
      
      {activeProvider && (
        <Alert>
          <Mail className="h-4 w-4" />
          <AlertDescription>
            Currently active provider: <strong>{activeProvider.provider}</strong>
            {activeProvider.connectionStatus === "success" && (
              <span className="ml-2 text-green-600">✓ Connected</span>
            )}
            {activeProvider.connectionStatus === "failed" && (
              <span className="ml-2 text-red-600">✗ Connection failed</span>
            )}
          </AlertDescription>
        </Alert>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>Select Email Provider</CardTitle>
          <CardDescription>
            Choose your preferred email service provider
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <RadioGroup value={selectedProvider} onValueChange={(value: any) => setSelectedProvider(value)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="mock" id="mock" />
              <Label htmlFor="mock">Mock (Testing Only - No real emails sent)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="sendgrid" id="sendgrid" />
              <Label htmlFor="sendgrid">SendGrid</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="aws-ses" id="aws-ses" />
              <Label htmlFor="aws-ses">AWS SES</Label>
            </div>
          </RadioGroup>
          
          {selectedProvider === "sendgrid" && (
            <div className="space-y-4 pt-4 border-t">
              <div>
                <Label htmlFor="sendgrid-api-key">SendGrid API Key *</Label>
                <Input
                  id="sendgrid-api-key"
                  type="password"
                  value={sendgridApiKey}
                  onChange={(e) => setSendgridApiKey(e.target.value)}
                  placeholder="SG.xxxxxxxxxxxx"
                />
              </div>
              <div>
                <Label htmlFor="sendgrid-from-email">From Email *</Label>
                <Input
                  id="sendgrid-from-email"
                  type="email"
                  value={sendgridFromEmail}
                  onChange={(e) => setSendgridFromEmail(e.target.value)}
                  placeholder="noreply@yourcompany.com"
                />
              </div>
              <div>
                <Label htmlFor="sendgrid-from-name">From Name</Label>
                <Input
                  id="sendgrid-from-name"
                  value={sendgridFromName}
                  onChange={(e) => setSendgridFromName(e.target.value)}
                  placeholder="Your Company Recruitment"
                />
              </div>
            </div>
          )}
          
          {selectedProvider === "aws-ses" && (
            <div className="space-y-4 pt-4 border-t">
              <div>
                <Label htmlFor="aws-access-key">AWS Access Key ID *</Label>
                <Input
                  id="aws-access-key"
                  type="password"
                  value={awsAccessKeyId}
                  onChange={(e) => setAwsAccessKeyId(e.target.value)}
                  placeholder="AKIAIOSFODNN7EXAMPLE"
                />
              </div>
              <div>
                <Label htmlFor="aws-secret-key">AWS Secret Access Key *</Label>
                <Input
                  id="aws-secret-key"
                  type="password"
                  value={awsSecretAccessKey}
                  onChange={(e) => setAwsSecretAccessKey(e.target.value)}
                  placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                />
              </div>
              <div>
                <Label htmlFor="aws-region">AWS Region *</Label>
                <Input
                  id="aws-region"
                  value={awsRegion}
                  onChange={(e) => setAwsRegion(e.target.value)}
                  placeholder="us-east-1"
                />
              </div>
              <div>
                <Label htmlFor="aws-from-email">From Email *</Label>
                <Input
                  id="aws-from-email"
                  type="email"
                  value={awsSesFromEmail}
                  onChange={(e) => setAwsSesFromEmail(e.target.value)}
                  placeholder="noreply@yourcompany.com"
                />
              </div>
              <div>
                <Label htmlFor="aws-from-name">From Name</Label>
                <Input
                  id="aws-from-name"
                  value={awsSesFromName}
                  onChange={(e) => setAwsSesFromName(e.target.value)}
                  placeholder="Your Company Recruitment"
                />
              </div>
            </div>
          )}
          
          {selectedProvider === "mock" && (
            <Alert>
              <AlertDescription>
                Mock provider is for testing only. No real emails will be sent.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={upsertMutation.isPending}>
              {upsertMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Configuration
            </Button>
            
            {selectedProvider !== "mock" && (
              <Button
                variant="outline"
                onClick={handleTestConnection}
                disabled={testingConnection || testConnectionMutation.isPending}
              >
                {(testingConnection || testConnectionMutation.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Test Connection
              </Button>
            )}
            
            <Button
              variant="secondary"
              onClick={handleSetActive}
              disabled={setActiveMutation.isPending}
            >
              Set as Active Provider
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              SendGrid Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sendgridStats ? (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Sent:</span>
                  <span className="font-semibold">{sendgridStats.totalSent}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivered:</span>
                  <span className="font-semibold text-green-600">{sendgridStats.totalDelivered}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Failed:</span>
                  <span className="font-semibold text-red-600">{sendgridStats.totalFailed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bounced:</span>
                  <span className="font-semibold text-orange-600">{sendgridStats.totalBounced}</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-muted-foreground">Delivery Rate:</span>
                  <span className="font-semibold">{sendgridStats.deliveryRate}%</span>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No statistics available</p>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              AWS SES Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            {awsStats ? (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Sent:</span>
                  <span className="font-semibold">{awsStats.totalSent}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivered:</span>
                  <span className="font-semibold text-green-600">{awsStats.totalDelivered}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Failed:</span>
                  <span className="font-semibold text-red-600">{awsStats.totalFailed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bounced:</span>
                  <span className="font-semibold text-orange-600">{awsStats.totalBounced}</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-muted-foreground">Delivery Rate:</span>
                  <span className="font-semibold">{awsStats.deliveryRate}%</span>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No statistics available</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
