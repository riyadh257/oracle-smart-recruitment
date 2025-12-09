import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RefreshCw, X } from "lucide-react";

/**
 * PWA Update Notification Component
 * Displays a notification when a new version of the app is available
 * and allows users to update immediately
 */
export function PWAUpdateNotification() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    // Check if service worker is supported
    if (!("serviceWorker" in navigator)) {
      return;
    }

    // Register service worker
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        console.log("[PWA] Service worker registered");
        setRegistration(reg);

        // Check for updates periodically (every 1 hour)
        const checkForUpdates = () => {
          reg.update().catch((error) => {
            console.error("[PWA] Update check failed:", error);
          });
        };

        // Check immediately
        checkForUpdates();

        // Check every hour
        const intervalId = setInterval(checkForUpdates, 60 * 60 * 1000);

        // Listen for updates
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              // New service worker is installed and ready
              console.log("[PWA] New version available");
              setShowUpdate(true);
            }
          });
        });

        return () => clearInterval(intervalId);
      })
      .catch((error) => {
        console.error("[PWA] Service worker registration failed:", error);
      });

    // Listen for controller change (when new SW takes over)
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      console.log("[PWA] New service worker activated, reloading...");
      window.location.reload();
    });
  }, []);

  const handleUpdate = () => {
    if (!registration || !registration.waiting) {
      return;
    }

    // Tell the waiting service worker to skip waiting and become active
    registration.waiting.postMessage({ type: "SKIP_WAITING" });
    
    // The page will reload automatically when the new SW takes control
    setShowUpdate(false);
  };

  const handleDismiss = () => {
    setShowUpdate(false);
  };

  if (!showUpdate) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md animate-in slide-in-from-bottom-5">
      <Alert className="border-blue-200 bg-blue-50">
        <RefreshCw className="h-5 w-5 text-blue-600" />
        <AlertTitle className="text-blue-900 flex items-center justify-between">
          Update Available
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </AlertTitle>
        <AlertDescription className="text-blue-800">
          <p className="mb-3">
            A new version of Oracle Recruitment System is available. Update now to get the latest features and improvements.
          </p>
          <div className="flex gap-2">
            <Button
              onClick={handleUpdate}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Update Now
            </Button>
            <Button
              onClick={handleDismiss}
              size="sm"
              variant="outline"
            >
              Later
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}
