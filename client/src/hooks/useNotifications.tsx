import { useEffect, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

interface Notification {
  type: string;
  title: string;
  message: string;
  data?: any;
  timestamp?: number;
}

export function useNotifications() {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Connect to WebSocket server
    const socketInstance = io(window.location.origin, {
      path: "/socket.io",
      transports: ["websocket", "polling"],
    });

    socketInstance.on("connect", () => {
      console.log("[WebSocket] Connected");
      setIsConnected(true);

      // Authenticate
      socketInstance.emit("authenticate", { userId: user.id });
    });

    socketInstance.on("authenticated", (data: { success: boolean; userId: number }) => {
      if (data.success) {
        console.log("[WebSocket] Authenticated as user", data.userId);
      }
    });

    socketInstance.on("unread_count", (data: { count: number }) => {
      setUnreadCount(data.count);
    });

    socketInstance.on("notification", (notification: Notification) => {
      console.log("[WebSocket] Received notification:", notification);

      // Add timestamp
      const notificationWithTimestamp = {
        ...notification,
        timestamp: Date.now(),
      };

      // Add to notifications list
      setNotifications((prev) => [notificationWithTimestamp, ...prev]);

      // Increment unread count
      setUnreadCount((prev) => prev + 1);

      // Show toast
      toast(notification.title, {
        description: notification.message,
        duration: 5000,
      });

      // Play notification sound (optional)
      playNotificationSound();
    });

    socketInstance.on("marked_read", (data: { notificationId: number }) => {
      console.log("[WebSocket] Notification marked as read:", data.notificationId);
    });

    socketInstance.on("all_marked_read", () => {
      console.log("[WebSocket] All notifications marked as read");
      setUnreadCount(0);
    });

    socketInstance.on("disconnect", () => {
      console.log("[WebSocket] Disconnected");
      setIsConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [user]);

  const markAsRead = useCallback(
    (notificationId: number) => {
      if (socket) {
        socket.emit("mark_read", { notificationId });
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    },
    [socket]
  );

  const markAllAsRead = useCallback(() => {
    if (socket) {
      socket.emit("mark_all_read");
      setUnreadCount(0);
    }
  }, [socket]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  };
}

function playNotificationSound() {
  try {
    // يمكن إضافة ملف صوتي للإشعارات
    const audio = new Audio("/notification.mp3");
    audio.volume = 0.5;
    audio.play().catch(() => {
      // Ignore autoplay errors
    });
  } catch (error) {
    // Ignore sound errors
  }
}
