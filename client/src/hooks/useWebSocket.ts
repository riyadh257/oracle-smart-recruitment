import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/_core/hooks/useAuth";

type ApplicationUpdateEvent = {
  type: "application:created" | "application:updated" | "application:status_changed";
  applicationId: number;
  candidateId: number;
  candidateName: string;
  jobId: number;
  jobTitle: string;
  status: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
};

type InterviewUpdateEvent = {
  type: "interview:completed" | "interview:started";
  applicationId: number;
  candidateId: number;
  candidateName: string;
  jobId: number;
  jobTitle: string;
  timestamp: string;
  analysisResults?: {
    communicationScore: number;
    psychometricProfile: string;
    overallScore: number;
  };
};

type NotificationEvent = {
  type: "notification:new";
  userId: number;
  title: string;
  message: string;
  timestamp: string;
  link?: string;
};

export function useWebSocket() {
  const { user, isAuthenticated } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<ApplicationUpdateEvent | InterviewUpdateEvent | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      return;
    }

    // Initialize socket connection
    const socket = io({
      path: "/api/socket.io",
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[WebSocket] Connected to server");
      setIsConnected(true);

      // Join user-specific room
      socket.emit("join:user", user.id);

      // If user is admin/recruiter, join recruiter room
      if (user.role === "admin") {
        socket.emit("join:recruiter", user.id);
      }
    });

    socket.on("disconnect", () => {
      console.log("[WebSocket] Disconnected from server");
      setIsConnected(false);
    });

    socket.on("connect_error", (error: any) => {
      console.error("[WebSocket] Connection error:", error);
      setIsConnected(false);
    });

    // Listen for application updates
    socket.on("application:update", (event: ApplicationUpdateEvent) => {
      console.log("[WebSocket] Application update received:", event);
      setLastUpdate(event);
    });

    // Listen for interview updates
    socket.on("interview:update", (event: InterviewUpdateEvent) => {
      console.log("[WebSocket] Interview update received:", event);
      setLastUpdate(event);
    });

    return () => {
      console.log("[WebSocket] Cleaning up socket connection");
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, user]);

  const joinJobRoom = (jobId: number) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("join:job", jobId);
      console.log(`[WebSocket] Joined job room: ${jobId}`);
    }
  };

  const leaveJobRoom = (jobId: number) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("leave:job", jobId);
      console.log(`[WebSocket] Left job room: ${jobId}`);
    }
  };

  return {
    isConnected,
    lastUpdate,
    joinJobRoom,
    leaveJobRoom,
    socket: socketRef.current,
  };
}

// Hook for listening to specific event types
export function useWebSocketEvent<T = unknown>(
  eventName: string,
  callback: (data: T) => void
) {
  const { socket } = useWebSocket();

  useEffect(() => {
    if (!socket) return;

    socket.on(eventName, callback);

    return () => {
      socket.off(eventName, callback);
    };
  }, [socket, eventName, callback]);
}
