import { useEffect, useState } from "react";
import {
  requestNotificationPermission,
  onForegroundMessage,
  isPushNotificationSupported,
} from "@/lib/firebase";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [token, setToken] = useState<string | null>(null);

  // TODO: Implement pushSubscriptions router
  // const registerMutation = trpc.pushSubscriptions.register.useMutation();

  useEffect(() => {
    // Check if push notifications are supported
    setIsSupported(isPushNotificationSupported());
    
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    // Listen for foreground messages
    if (isSupported) {
      const unsubscribe = onForegroundMessage((payload) => {
        console.log("Foreground notification received:", payload);
        
        // Show a toast notification
        const title = payload.notification?.title || "New Notification";
        const body = payload.notification?.body || "";
        
        toast(title, {
          description: body,
          action: payload.data?.actionUrl
            ? {
                label: "View",
                onClick: () => {
                  window.location.href = payload.data.actionUrl;
                },
              }
            : undefined,
        });
      });

      return unsubscribe;
    }
  }, [isSupported]);

  const requestPermission = async () => {
    if (!isSupported) {
      toast.error("Push notifications are not supported in this browser");
      return false;
    }

    try {
      const fcmToken = await requestNotificationPermission();
      
      if (fcmToken) {
        setToken(fcmToken);
        setPermission("granted");
        
        // Register the token with the backend
        const deviceInfo = {
          browser: navigator.userAgent,
          os: navigator.platform,
        };
        
        // TODO: Implement pushSubscriptions router
        // await registerMutation.mutateAsync({
        //   deviceToken: fcmToken,
        //   deviceType: "web",
        //   deviceInfo,
        // });
        
        toast.success("Push notifications enabled successfully");
        return true;
      } else {
        setPermission("denied");
        toast.error("Failed to get notification permission");
        return false;
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      toast.error("Failed to enable push notifications");
      return false;
    }
  };

  return {
    isSupported,
    permission,
    token,
    requestPermission,
  };
}
