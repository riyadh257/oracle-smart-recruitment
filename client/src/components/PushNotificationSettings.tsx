import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Bell, BellOff, CheckCircle2, AlertCircle, Smartphone } from "lucide-react";
import { toast } from "sonner";

export function PushNotificationManager() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { data: vapidKey } = trpc.pushNotifications.getVapidPublicKey.useQuery();
  const subscribeMutation = trpc.pushNotifications.subscribe.useMutation();
  const unsubscribeMutation = trpc.pushNotifications.unsubscribe.useMutation();
  const testNotificationMutation = trpc.pushNotifications.sendTestNotification.useMutation();

  useEffect(() => {
    // Check if push notifications are supported
    const supported = "serviceWorker" in navigator && "PushManager" in window;
    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission);
      checkSubscription();
    }
  }, []);

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error("Error checking subscription:", error);
    }
  };

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const handleSubscribe = async () => {
    if (!vapidKey?.publicKey) {
      toast.error("VAPID key not configured. Please contact support.");
      return;
    }

    setIsLoading(true);

    try {
      // Request notification permission
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);

      if (permissionResult !== "granted") {
        toast.error("Notification permission denied");
        setIsLoading(false);
        return;
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey.publicKey),
      });

      // Send subscription to server
      const subscriptionData = subscription.toJSON();
      await subscribeMutation.mutateAsync({
        endpoint: subscriptionData.endpoint!,
        p256dh: subscriptionData.keys!.p256dh!,
        auth: subscriptionData.keys!.auth!,
        userAgent: navigator.userAgent,
      });

      setIsSubscribed(true);
      toast.success("Push notifications enabled!");
    } catch (error: any) {
      console.error("Error subscribing to push notifications:", error);
      toast.error(`Failed to enable push notifications: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    setIsLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
        await unsubscribeMutation.mutateAsync({
          endpoint: subscription.endpoint,
        });
      }

      setIsSubscribed(false);
      toast.success("Push notifications disabled");
    } catch (error: any) {
      console.error("Error unsubscribing from push notifications:", error);
      toast.error(`Failed to disable push notifications: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestNotification = async () => {
    try {
      const result = await testNotificationMutation.mutateAsync();
      toast.success(`Test notification sent to ${result.sentTo} device(s)`);
    } catch (error: any) {
      toast.error(error.message || "Failed to send test notification");
    }
  };

  if (!isSupported) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Push notifications are not supported in your browser. Please use a modern browser like
          Chrome, Firefox, or Safari.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Push Notifications
        </CardTitle>
        <CardDescription>
          Receive real-time notifications on this device even when the app is closed
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-3">
            {isSubscribed ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <BellOff className="h-5 w-5 text-muted-foreground" />
            )}
            <div>
              <p className="font-medium">
                {isSubscribed ? "Notifications Enabled" : "Notifications Disabled"}
              </p>
              <p className="text-sm text-muted-foreground">
                {isSubscribed
                  ? "You'll receive push notifications on this device"
                  : "Enable to receive real-time updates"}
              </p>
            </div>
          </div>
          <Badge variant={isSubscribed ? "default" : "secondary"}>
            {permission === "granted" ? "Allowed" : permission === "denied" ? "Blocked" : "Not Set"}
          </Badge>
        </div>

        {permission === "denied" && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Notifications are blocked. Please enable them in your browser settings to receive push
              notifications.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          {!isSubscribed ? (
            <Button
              onClick={handleSubscribe}
              disabled={isLoading || permission === "denied"}
              className="flex-1"
            >
              <Bell className="h-4 w-4 mr-2" />
              Enable Push Notifications
            </Button>
          ) : (
            <>
              <Button onClick={handleUnsubscribe} disabled={isLoading} variant="outline" className="flex-1">
                <BellOff className="h-4 w-4 mr-2" />
                Disable Notifications
              </Button>
              <Button
                onClick={handleTestNotification}
                disabled={testNotificationMutation.isPending}
                variant="secondary"
              >
                <Smartphone className="h-4 w-4 mr-2" />
                Send Test
              </Button>
            </>
          )}
        </div>

        <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
          <p className="font-medium">What you'll receive:</p>
          <ul className="list-disc list-inside space-y-0.5 ml-2">
            <li>Interview reminders and schedule changes</li>
            <li>Feedback requests from completed interviews</li>
            <li>Candidate responses and engagement alerts</li>
            <li>A/B test results and performance updates</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
