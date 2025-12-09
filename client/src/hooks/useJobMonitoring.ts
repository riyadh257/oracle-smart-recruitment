import { useEffect, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

interface JobStatusUpdate {
  jobId: number;
  status: "pending" | "running" | "completed" | "failed" | "cancelled" | "timeout";
  timestamp: Date;
  progress?: number;
  error?: string;
  duration?: number;
  metadata?: Record<string, any>;
}

interface JobNotification {
  id: string;
  type: "job_started" | "job_progress" | "job_completed" | "job_failed" | "export_completed";
  title: string;
  message: string;
  data?: {
    jobName?: string;
    jobId?: number;
    status?: string;
    progress?: number;
    error?: string;
    duration?: number;
    exportName?: string;
    exportId?: number;
    fileUrl?: string;
  };
  timestamp: Date;
  read: boolean;
}

export function useJobMonitoring() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [jobUpdates, setJobUpdates] = useState<Map<number, JobStatusUpdate>>(new Map());
  const { user, isAuthenticated } = useAuth();

  // Initialize WebSocket connection
  useEffect(() => {
    if (!isAuthenticated || !user) {
      return;
    }

    const socketInstance = io({
      path: "/api/socket.io",
      auth: {
        token: `user-${user.id}`, // In production, use actual JWT token
      },
    });

    socketInstance.on("connect", () => {
      console.log("[JobMonitoring] WebSocket connected");
      setIsConnected(true);
      
      // Join admin room if user is admin
      if (user.role === "admin") {
        socketInstance.emit("join:admin");
      }
    });

    socketInstance.on("disconnect", () => {
      console.log("[JobMonitoring] WebSocket disconnected");
      setIsConnected(false);
    });

    socketInstance.on("connected", (data: any) => {
      console.log("[JobMonitoring] Connection confirmed:", data);
    });

    // Listen for job status updates (admin-only broadcast)
    socketInstance.on("job:status", (update: JobStatusUpdate) => {
      console.log("[JobMonitoring] Job status update:", update);
      setJobUpdates((prev) => {
        const newMap = new Map(prev);
        newMap.set(update.jobId, update);
        return newMap;
      });
    });

    // Listen for job notifications (user-specific)
    socketInstance.on("notification", (notification: JobNotification) => {
      console.log("[JobMonitoring] Job notification:", notification);
      
      // Show toast notification based on type
      switch (notification.type) {
        case "job_started":
          toast.info(notification.message, {
            description: notification.data?.jobName,
          });
          break;
        case "job_progress":
          // Only show progress toast for significant milestones
          if (notification.data?.progress && notification.data.progress % 25 === 0) {
            toast.info(notification.message);
          }
          break;
        case "job_completed":
          toast.success(notification.message, {
            description: `Completed in ${notification.data?.duration ? Math.round(notification.data.duration / 1000) : 0}s`,
          });
          break;
        case "job_failed":
          toast.error(notification.message, {
            description: notification.data?.error,
          });
          break;
        case "export_completed":
          toast.success(notification.message, {
            description: "Click to download",
            action: notification.data?.fileUrl ? {
              label: "Download",
              onClick: () => window.open(notification.data.fileUrl, "_blank"),
            } : undefined,
          });
          break;
      }

      // Update job status if it's a job-related notification
      if (notification.data?.jobId) {
        setJobUpdates((prev) => {
          const newMap = new Map(prev);
          newMap.set(notification.data.jobId!, {
            jobId: notification.data.jobId!,
            status: notification.data.status as any || "running",
            timestamp: new Date(notification.timestamp),
            progress: notification.data.progress,
            error: notification.data.error,
            duration: notification.data.duration,
          });
          return newMap;
        });
      }
    });

    setSocket(socketInstance);

    return () => {
      console.log("[JobMonitoring] Cleaning up WebSocket connection");
      socketInstance.disconnect();
    };
  }, [isAuthenticated, user]);

  // Get status for a specific job
  const getJobStatus = useCallback(
    (jobId: number): JobStatusUpdate | undefined => {
      return jobUpdates.get(jobId);
    },
    [jobUpdates]
  );

  // Clear job update
  const clearJobUpdate = useCallback((jobId: number) => {
    setJobUpdates((prev) => {
      const newMap = new Map(prev);
      newMap.delete(jobId);
      return newMap;
    });
  }, []);

  // Clear all job updates
  const clearAllUpdates = useCallback(() => {
    setJobUpdates(new Map());
  }, []);

  return {
    socket,
    isConnected,
    jobUpdates: Array.from(jobUpdates.values()),
    getJobStatus,
    clearJobUpdate,
    clearAllUpdates,
  };
}
