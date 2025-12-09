import { useState, useEffect } from "react";
import { X, Download, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { promptInstall, isStandalone } from "@/lib/registerSW";

const BANNER_DISMISSED_KEY = "pwa-install-banner-dismissed";
const BANNER_DISMISSED_TIMESTAMP_KEY = "pwa-install-banner-dismissed-timestamp";
const DISMISSAL_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

export default function PWAInstallBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // Don't show if already installed as PWA
    if (isStandalone()) {
      return;
    }

    // Check if banner was dismissed recently
    const dismissedTimestamp = localStorage.getItem(BANNER_DISMISSED_TIMESTAMP_KEY);
    if (dismissedTimestamp) {
      const timeSinceDismissal = Date.now() - parseInt(dismissedTimestamp, 10);
      if (timeSinceDismissal < DISMISSAL_DURATION) {
        return;
      }
    }

    // Check if permanently dismissed (legacy support)
    const permanentlyDismissed = localStorage.getItem(BANNER_DISMISSED_KEY);
    if (permanentlyDismissed === "true") {
      return;
    }

    // Only show on mobile devices
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (!isMobile) {
      return;
    }

    // Wait a bit before showing the banner (better UX)
    const timer = setTimeout(() => {
      setShowBanner(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleInstall = async () => {
    setIsInstalling(true);
    
    try {
      const installed = await promptInstall();
      
      if (installed) {
        setShowBanner(false);
        localStorage.setItem(BANNER_DISMISSED_KEY, "true");
      }
    } catch (error) {
      console.error("[PWA] Install failed:", error);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem(BANNER_DISMISSED_TIMESTAMP_KEY, Date.now().toString());
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-safe animate-in slide-in-from-bottom duration-300">
      <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent backdrop-blur-sm">
        <div className="flex items-center gap-4 p-4">
          {/* Icon */}
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-primary" />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm mb-1">
              Install Oracle Recruit
            </h3>
            <p className="text-xs text-muted-foreground line-clamp-2">
              Get faster access and work offline. Install our app for the best experience.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              size="sm"
              onClick={handleInstall}
              disabled={isInstalling}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              {isInstalling ? "Installing..." : "Install"}
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDismiss}
              className="w-8 h-8 p-0"
            >
              <X className="w-4 h-4" />
              <span className="sr-only">Dismiss</span>
            </Button>
          </div>
        </div>

        {/* Decorative gradient bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-purple-500 to-primary" />
      </Card>
    </div>
  );
}
