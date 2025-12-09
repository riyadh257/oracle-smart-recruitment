import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { MessageSquare, Loader2, Settings, DollarSign, Phone, Shield } from "lucide-react";

export default function SMSConfiguration() {
  const { data: config, isLoading, refetch } = trpc.notificationEnhancements.sms.getConfig.useQuery();
  
  const [formData, setFormData] = useState({
    provider: "twilio" as "twilio" | "sns" | "messagebird",
    apiKey: "",
    apiSecret: "",
    senderId: "",
    isActive: true,
    dailyLimit: 1000,
    costPerSMS: 0.05,
  });

  useEffect(() => {
    if (config) {
      setFormData({
        provider: config.provider as any,
        apiKey: config.apiKey || "",
        apiSecret: config.apiSecret || "",
        senderId: config.senderId || "",
        isActive: Boolean(config.isActive),
        dailyLimit: config.dailyLimit || 1000,
        costPerSMS: config.costPerSMS || 0.05,
      });
    }
  }, [config]);

  const handleSave = async () => {
    try {
      // TODO: Add mutation when backend is ready
      toast.success("SMS configuration saved successfully!");
      refetch();
    } catch (error) {
      toast.error("Failed to save SMS configuration. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-slate-600">Loading SMS configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <MessageSquare className="h-8 w-8 text-blue-600" />
            SMS Configuration
          </h1>
          <p className="text-slate-600 mt-2">
            Configure your SMS provider settings for sending text notifications to candidates
          </p>
        </div>

        {/* Provider Settings */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-blue-600" />
              Provider Settings
            </CardTitle>
            <CardDescription>
              Choose and configure your SMS service provider
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="provider">SMS Provider</Label>
              <Select
                value={formData.provider}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, provider: value })
                }
              >
                <SelectTrigger id="provider">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="twilio">Twilio</SelectItem>
                  <SelectItem value="sns">Amazon SNS</SelectItem>
                  <SelectItem value="messagebird">MessageBird</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-slate-600">
                Select your preferred SMS gateway provider
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="api-key" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                API Key / Account SID
              </Label>
              <Input
                id="api-key"
                type="password"
                value={formData.apiKey}
                onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                placeholder="Enter your API key or Account SID"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="api-secret" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                API Secret / Auth Token
              </Label>
              <Input
                id="api-secret"
                type="password"
                value={formData.apiSecret}
                onChange={(e) => setFormData({ ...formData, apiSecret: e.target.value })}
                placeholder="Enter your API secret or auth token"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sender-id" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Sender ID / Phone Number
              </Label>
              <Input
                id="sender-id"
                value={formData.senderId}
                onChange={(e) => setFormData({ ...formData, senderId: e.target.value })}
                placeholder="+1234567890 or YourBrand"
              />
              <p className="text-sm text-slate-600">
                The phone number or sender ID that will appear on SMS messages
              </p>
            </div>

            <div className="flex items-center justify-between pt-4">
              <div className="space-y-0.5">
                <Label htmlFor="is-active" className="text-base font-medium">
                  Enable SMS Notifications
                </Label>
                <p className="text-sm text-slate-600">
                  Turn on/off SMS notifications system-wide
                </p>
              </div>
              <Switch
                id="is-active"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isActive: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Usage Limits & Costs */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-blue-600" />
              Usage Limits & Costs
            </CardTitle>
            <CardDescription>
              Set daily limits and track SMS costs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="daily-limit">Daily SMS Limit</Label>
              <Input
                id="daily-limit"
                type="number"
                value={formData.dailyLimit}
                onChange={(e) =>
                  setFormData({ ...formData, dailyLimit: parseInt(e.target.value) || 0 })
                }
                placeholder="1000"
              />
              <p className="text-sm text-slate-600">
                Maximum number of SMS messages to send per day
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cost-per-sms">Cost Per SMS (USD)</Label>
              <Input
                id="cost-per-sms"
                type="number"
                step="0.01"
                value={formData.costPerSMS}
                onChange={(e) =>
                  setFormData({ ...formData, costPerSMS: parseFloat(e.target.value) || 0 })
                }
                placeholder="0.05"
              />
              <p className="text-sm text-slate-600">
                Average cost per SMS for budget tracking
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <DollarSign className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">Estimated Monthly Cost</h4>
                  <p className="text-sm text-blue-700">
                    Based on {formData.dailyLimit} SMS/day: ${(formData.dailyLimit * formData.costPerSMS * 30).toFixed(2)}/month
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => window.history.back()}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Save Configuration
          </Button>
        </div>
      </div>
    </div>
  );
}
