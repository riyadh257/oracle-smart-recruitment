import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageCircle, Send, CheckCircle, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";

export default function WhatsAppSettings() {
  const { data: settings, isLoading, refetch } = trpc.visaCompliance.whatsapp.getSettings.useQuery();
  const { data: logs } = trpc.visaCompliance.whatsapp.getLogs.useQuery({ limit: 20 });
  
  const updateSettingsMutation = trpc.visaCompliance.whatsapp.updateSettings.useMutation({
    onSuccess: () => {
      toast.success("WhatsApp settings updated successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  const sendTestMessageMutation = trpc.visaCompliance.whatsapp.sendTestMessage.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Test message sent successfully!");
      } else {
        toast.error(`Failed to send test message: ${result.error}`);
      }
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  const [formData, setFormData] = useState({
    phoneNumber: "",
    countryCode: "+966",
    enableDailySummary: 1,
    enableCriticalAlerts: 1,
    enableWeeklyReports: 0,
    dailySummaryTime: "09:00",
    weeklyReportDay: "monday" as const,
    isActive: 1,
  });
  
  useEffect(() => {
    if (settings) {
      setFormData({
        phoneNumber: settings.phoneNumber || "",
        countryCode: settings.countryCode || "+966",
        enableDailySummary: settings.enableDailySummary || 1,
        enableCriticalAlerts: settings.enableCriticalAlerts || 1,
        enableWeeklyReports: settings.enableWeeklyReports || 0,
        dailySummaryTime: settings.dailySummaryTime || "09:00",
        weeklyReportDay: (settings.weeklyReportDay || "monday") as const,
        isActive: settings.isActive || 1,
      });
    }
  }, [settings]);
  
  const handleSaveSettings = () => {
    if (!formData.phoneNumber) {
      toast.error("Please enter a phone number");
      return;
    }
    
    updateSettingsMutation.mutate(formData);
  };
  
  const handleSendTestMessage = () => {
    if (!formData.phoneNumber) {
      toast.error("Please save your phone number first");
      return;
    }
    
    sendTestMessageMutation.mutate();
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">WhatsApp Notification Settings</h1>
        <p className="text-muted-foreground">Configure WhatsApp notifications for compliance alerts and summaries</p>
      </div>
      
      {/* Settings Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Phone Number Configuration</CardTitle>
            <CardDescription>Enter your WhatsApp-enabled phone number</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="countryCode">Country Code</Label>
                <Select
                  value={formData.countryCode}
                  onValueChange={(value) => setFormData({ ...formData, countryCode: value })}
                >
                  <SelectTrigger id="countryCode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="+966">+966 (Saudi Arabia)</SelectItem>
                    <SelectItem value="+971">+971 (UAE)</SelectItem>
                    <SelectItem value="+965">+965 (Kuwait)</SelectItem>
                    <SelectItem value="+974">+974 (Qatar)</SelectItem>
                    <SelectItem value="+973">+973 (Bahrain)</SelectItem>
                    <SelectItem value="+968">+968 (Oman)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="col-span-2 space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="5xxxxxxxx"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <p className="text-sm font-medium">Full Number</p>
                <p className="text-lg font-mono">{formData.countryCode}{formData.phoneNumber}</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="isActive">Enable WhatsApp Notifications</Label>
                <p className="text-sm text-muted-foreground">Turn on/off all WhatsApp notifications</p>
              </div>
              <Switch
                id="isActive"
                checked={formData.isActive === 1}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked ? 1 : 0 })}
              />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
            <CardDescription>Choose which notifications you want to receive</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="enableCriticalAlerts">Critical Alerts</Label>
                <p className="text-sm text-muted-foreground">Immediate notifications for critical compliance issues</p>
              </div>
              <Switch
                id="enableCriticalAlerts"
                checked={formData.enableCriticalAlerts === 1}
                onCheckedChange={(checked) => setFormData({ ...formData, enableCriticalAlerts: checked ? 1 : 0 })}
              />
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enableDailySummary">Daily Summary</Label>
                  <p className="text-sm text-muted-foreground">Daily compliance status summary</p>
                </div>
                <Switch
                  id="enableDailySummary"
                  checked={formData.enableDailySummary === 1}
                  onCheckedChange={(checked) => setFormData({ ...formData, enableDailySummary: checked ? 1 : 0 })}
                />
              </div>
              
              {formData.enableDailySummary === 1 && (
                <div className="ml-6 space-y-2">
                  <Label htmlFor="dailySummaryTime">Delivery Time</Label>
                  <Input
                    id="dailySummaryTime"
                    type="time"
                    value={formData.dailySummaryTime}
                    onChange={(e) => setFormData({ ...formData, dailySummaryTime: e.target.value })}
                  />
                </div>
              )}
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enableWeeklyReports">Weekly Reports</Label>
                  <p className="text-sm text-muted-foreground">Comprehensive weekly compliance report</p>
                </div>
                <Switch
                  id="enableWeeklyReports"
                  checked={formData.enableWeeklyReports === 1}
                  onCheckedChange={(checked) => setFormData({ ...formData, enableWeeklyReports: checked ? 1 : 0 })}
                />
              </div>
              
              {formData.enableWeeklyReports === 1 && (
                <div className="ml-6 space-y-2">
                  <Label htmlFor="weeklyReportDay">Delivery Day</Label>
                  <Select
                    value={formData.weeklyReportDay}
                    onValueChange={(value: any) => setFormData({ ...formData, weeklyReportDay: value })}
                  >
                    <SelectTrigger id="weeklyReportDay">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monday">Monday</SelectItem>
                      <SelectItem value="tuesday">Tuesday</SelectItem>
                      <SelectItem value="wednesday">Wednesday</SelectItem>
                      <SelectItem value="thursday">Thursday</SelectItem>
                      <SelectItem value="friday">Friday</SelectItem>
                      <SelectItem value="saturday">Saturday</SelectItem>
                      <SelectItem value="sunday">Sunday</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button
          onClick={handleSaveSettings}
          disabled={updateSettingsMutation.isPending}
        >
          {updateSettingsMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Settings
        </Button>
        
        <Button
          variant="outline"
          onClick={handleSendTestMessage}
          disabled={sendTestMessageMutation.isPending || !formData.phoneNumber}
        >
          {sendTestMessageMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Send className="mr-2 h-4 w-4" />
          )}
          Send Test Message
        </Button>
      </div>
      
      {/* Notification History */}
      <Card>
        <CardHeader>
          <CardTitle>Notification History</CardTitle>
          <CardDescription>Recent WhatsApp messages sent to your number</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {logs && logs.length > 0 ? (
              logs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="mt-1">
                    {getStatusIcon(log.status)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline">{log.messageType.replace(/_/g, ' ')}</Badge>
                      <Badge
                        variant={
                          log.status === 'sent' || log.status === 'delivered'
                            ? 'default'
                            : log.status === 'failed'
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {log.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{log.messageContent}</p>
                    {log.errorMessage && (
                      <p className="text-xs text-red-600 mt-1">Error: {log.errorMessage}</p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No notification history yet</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
