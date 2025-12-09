import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Mail, MessageSquare, Check, X, Bell } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation } from "wouter";

export default function Settings() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const { data: settings, refetch } = trpc.settings.getAll.useQuery();
  const setSetting = trpc.settings.set.useMutation({
    onSuccess: () => {
      toast.success("Settings saved");
      refetch();
    },
  });
  const testSmtp = trpc.settings.testSmtp.useMutation();
  const testSlack = trpc.settings.testSlack.useMutation();

  const [smtpConfig, setSmtpConfig] = useState({
    host: "",
    port: 587,
    user: "",
    password: "",
    from: "",
  });

  const [slackConfig, setSlackConfig] = useState({
    webhookUrl: "",
  });

  useEffect(() => {
    if (settings) {
      const smtpHost = settings.find((s) => s.key === "smtp_host");
      const smtpPort = settings.find((s) => s.key === "smtp_port");
      const smtpUser = settings.find((s) => s.key === "smtp_user");
      const smtpPassword = settings.find((s) => s.key === "smtp_password");
      const smtpFrom = settings.find((s) => s.key === "smtp_from");
      const slackWebhook = settings.find((s) => s.key === "slack_webhook_url");

      setSmtpConfig({
        host: smtpHost?.value || "",
        port: parseInt(smtpPort?.value || "587"),
        user: smtpUser?.value || "",
        password: smtpPassword?.value || "",
        from: smtpFrom?.value || "",
      });

      setSlackConfig({
        webhookUrl: slackWebhook?.value || "",
      });
    }
  }, [settings]);

  const handleSaveSmtp = async () => {
    await Promise.all([
      setSetting.mutateAsync({ key: "smtp_host", value: smtpConfig.host }),
      setSetting.mutateAsync({ key: "smtp_port", value: smtpConfig.port.toString() }),
      setSetting.mutateAsync({ key: "smtp_user", value: smtpConfig.user }),
      setSetting.mutateAsync({ key: "smtp_password", value: smtpConfig.password }),
      setSetting.mutateAsync({ key: "smtp_from", value: smtpConfig.from }),
    ]);
  };

  const handleTestSmtp = async () => {
    // TODO: Update testSmtp procedure to accept parameters
    const result = await testSmtp.mutateAsync();
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  };

  const handleSaveSlack = async () => {
    await setSetting.mutateAsync({
      key: "slack_webhook_url",
      value: slackConfig.webhookUrl,
    });
  };

  const handleTestSlack = async () => {
    // TODO: Update testSlack procedure to accept parameters
    const result = await testSlack.mutateAsync();
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  };

  if (loading || !user) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-2">
            Configure integrations and notifications
          </p>
        </div>

        <Tabs defaultValue="smtp" className="w-full">
          <TabsList>
            <TabsTrigger value="smtp">
              <Mail className="h-4 w-4 mr-2" />
              SMTP Configuration
            </TabsTrigger>
            <TabsTrigger value="slack">
              <MessageSquare className="h-4 w-4 mr-2" />
              Slack Integration
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </TabsTrigger>
          </TabsList>

          <TabsContent value="smtp" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>SMTP Email Configuration</CardTitle>
                <CardDescription>
                  Configure your email provider to send notifications and interview invitations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="smtp_host">SMTP Host</Label>
                    <Input
                      id="smtp_host"
                      placeholder="smtp.gmail.com"
                      value={smtpConfig.host}
                      onChange={(e) =>
                        setSmtpConfig({ ...smtpConfig, host: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="smtp_port">SMTP Port</Label>
                    <Input
                      id="smtp_port"
                      type="number"
                      placeholder="587"
                      value={smtpConfig.port}
                      onChange={(e) =>
                        setSmtpConfig({
                          ...smtpConfig,
                          port: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="smtp_user">SMTP Username</Label>
                  <Input
                    id="smtp_user"
                    placeholder="your-email@gmail.com"
                    value={smtpConfig.user}
                    onChange={(e) =>
                      setSmtpConfig({ ...smtpConfig, user: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="smtp_password">SMTP Password</Label>
                  <Input
                    id="smtp_password"
                    type="password"
                    placeholder="••••••••"
                    value={smtpConfig.password}
                    onChange={(e) =>
                      setSmtpConfig({ ...smtpConfig, password: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="smtp_from">From Email</Label>
                  <Input
                    id="smtp_from"
                    placeholder="noreply@company.com"
                    value={smtpConfig.from}
                    onChange={(e) =>
                      setSmtpConfig({ ...smtpConfig, from: e.target.value })
                    }
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSaveSmtp} disabled={setSetting.isPending}>
                    <Check className="h-4 w-4 mr-2" />
                    Save Configuration
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleTestSmtp}
                    disabled={testSmtp.isPending || !smtpConfig.host}
                  >
                    {testSmtp.isPending ? "Testing..." : "Test Connection"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="slack" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Slack Integration</CardTitle>
                <CardDescription>
                  Connect Slack to receive real-time notifications for recruitment activities
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="slack_webhook">Slack Webhook URL</Label>
                  <Input
                    id="slack_webhook"
                    placeholder="https://hooks.slack.com/services/..."
                    value={slackConfig.webhookUrl}
                    onChange={(e) =>
                      setSlackConfig({ ...slackConfig, webhookUrl: e.target.value })
                    }
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    Get your webhook URL from{" "}
                    <a
                      href="https://api.slack.com/messaging/webhooks"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Slack Incoming Webhooks
                    </a>
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSaveSlack} disabled={setSetting.isPending}>
                    <Check className="h-4 w-4 mr-2" />
                    Save Configuration
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleTestSlack}
                    disabled={testSlack.isPending || !slackConfig.webhookUrl}
                  >
                    {testSlack.isPending ? "Testing..." : "Test Connection"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Manage your notification settings for recruitment activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => setLocation("/notification-settings")}>
                  <Bell className="h-4 w-4 mr-2" />
                  Manage Notification Settings
                </Button>
                <p className="text-sm text-muted-foreground mt-4">
                  Configure which types of notifications you want to receive and how often
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
