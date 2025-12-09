import { useEffect, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import Cookies from "js-cookie";
import { COOKIE_NAME } from "@shared/const";

let socket: Socket | null = null;

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [lastNotification, setLastNotification] = useState<any>(null);

  useEffect(() => {
    // Get auth token from cookie
    const token = Cookies.get(COOKIE_NAME);
    
    if (!token) {
      console.warn("[Socket] No auth token found");
      return;
    }

    // Initialize socket connection if not already connected
    if (!socket) {
      socket = io({
        path: "/socket.io/",
        auth: {
          token,
        },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      });

      socket.on("connect", () => {
        console.log("[Socket] Connected to server");
        setIsConnected(true);
      });

      socket.on("disconnect", () => {
        console.log("[Socket] Disconnected from server");
        setIsConnected(false);
      });

      socket.on("connect_error", (error: any) => {
        console.error("[Socket] Connection error:", error.message);
        setIsConnected(false);
      });

      // Listen for new notifications
      socket.on("notification:new", (notification: any) => {
        console.log("[Socket] New notification received:", notification);
        setLastNotification(notification);
      });

      // Listen for notification read events from other devices
      socket.on("notification:read", (notificationId: any) => {
        console.log("[Socket] Notification marked as read:", notificationId);
        // Trigger UI update
        window.dispatchEvent(
          new CustomEvent("notification:read", { detail: notificationId })
        );
      });

      // Listen for mark all as read events
      socket.on("notification:read_all", () => {
        console.log("[Socket] All notifications marked as read");
        window.dispatchEvent(new CustomEvent("notification:read_all"));
      });
    }

    return () => {
      // Don't disconnect on unmount to keep connection alive
      // socket?.disconnect();
    };
  }, []);

  const emitNotificationRead = useCallback((notificationId: number) => {
    if (socket && isConnected) {
      socket.emit("notification:read", notificationId);
    }
  }, [isConnected]);

  const emitNotificationReadAll = useCallback(() => {
    if (socket && isConnected) {
      socket.emit("notification:read_all");
    }
  }, [isConnected]);

  return {
    isConnected,
    lastNotification,
    emitNotificationRead,
    emitNotificationReadAll,
  };
}
