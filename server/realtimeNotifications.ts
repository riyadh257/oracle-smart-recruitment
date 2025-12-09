import { Server as SocketIOServer } from "socket.io";
import { Server as HTTPServer } from "http";
// WebSocket authentication will use session cookies
// Auth verification happens at the HTTP middleware level

/**
 * Real-time Notification Service
 * Handles WebSocket connections and real-time notifications
 */

export interface NotificationPayload {
  id: string;
  type: "interview_invite" | "job_match" | "application_update" | "message" | "system" | "high_quality_match" | "bulk_operation_complete" | "profile_enrichment_complete" | "engagement_alert" | "ab_test_result" | "interview_reminder" | "dashboard_update" | "job_started" | "job_progress" | "job_completed" | "job_failed" | "export_completed";
  title: string;
  message: string;
  data?: Record<string, any>;
  timestamp: Date;
  read: boolean;
}

let io: SocketIOServer | null = null;
const userSockets = new Map<number, Set<string>>(); // userId -> Set of socket IDs

/**
 * Initialize Socket.IO server
 */
export function initializeWebSocket(httpServer: HTTPServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*", // Configure based on your needs
      methods: ["GET", "POST"],
    },
    path: "/api/socket.io",
  });

  io.use(async (socket, next) => {
    try {
      // Get token from handshake auth or query
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      
      if (!token || typeof token !== "string") {
        return next(new Error("Authentication token required"));
      }

      // For now, accept any token and extract user info from it
      // In production, verify JWT or session token properly
      socket.data.user = { id: 1, name: "User" }; // Placeholder
      next();
    } catch (error) {
      console.error("[WebSocket] Authentication error:", error);
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket: any) => {
    const user = socket.data.user;
    
    if (!user) {
      socket.disconnect();
      return;
    }

    console.log(`[WebSocket] User ${user.id} (${user.name}) connected`);

    // Track user's socket connections
    if (!userSockets.has(user.id)) {
      userSockets.set(user.id, new Set());
    }
    userSockets.get(user.id)!.add(socket.id);

    // Join user-specific room
    socket.join(`user:${user.id}`);

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log(`[WebSocket] User ${user.id} disconnected`);
      
      const sockets = userSockets.get(user.id);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          userSockets.delete(user.id);
        }
      }
    });

    // Handle notification read acknowledgment
    socket.on("notification:read", (notificationId: string) => {
      console.log(`[WebSocket] User ${user.id} marked notification ${notificationId} as read`);
      // You can update database here if needed
    });

    // Send initial connection success
    socket.emit("connected", {
      message: "Real-time notifications connected",
      userId: user.id,
    });
  });

  console.log("[WebSocket] Real-time notification system initialized");
  
  return io;
}

/**
 * Send notification to a specific user
 */
export function sendNotificationToUser(userId: number, notification: NotificationPayload): void {
  if (!io) {
    console.warn("[WebSocket] Socket.IO not initialized");
    return;
  }

  io.to(`user:${userId}`).emit("notification", notification);
  console.log(`[WebSocket] Sent notification to user ${userId}:`, notification.type);
}

/**
 * Send notification to multiple users
 */
export function sendNotificationToUsers(userIds: number[], notification: NotificationPayload): void {
  if (!io) {
    console.warn("[WebSocket] Socket.IO not initialized");
    return;
  }

  userIds.forEach((userId: any) => {
    io!.to(`user:${userId}`).emit("notification", notification);
  });
  
  console.log(`[WebSocket] Sent notification to ${userIds.length} users:`, notification.type);
}

/**
 * Broadcast notification to all connected users
 */
export function broadcastNotification(notification: NotificationPayload): void {
  if (!io) {
    console.warn("[WebSocket] Socket.IO not initialized");
    return;
  }

  io.emit("notification", notification);
  console.log(`[WebSocket] Broadcast notification:`, notification.type);
}

/**
 * Check if user is currently online
 */
export function isUserOnline(userId: number): boolean {
  return userSockets.has(userId) && userSockets.get(userId)!.size > 0;
}

/**
 * Get count of online users
 */
export function getOnlineUserCount(): number {
  return userSockets.size;
}

/**
 * Helper functions for specific notification types
 */

export function notifyInterviewInvite(candidateId: number, jobTitle: string, interviewTime: Date): void {
  sendNotificationToUser(candidateId, {
    id: `interview-${Date.now()}`,
    type: "interview_invite",
    title: "New Interview Invitation",
    message: `You have been invited to interview for ${jobTitle}`,
    data: { jobTitle, interviewTime: interviewTime.toISOString() },
    timestamp: new Date(),
    read: false,
  });
}

export function notifyJobMatch(candidateId: number, jobTitle: string, matchScore: number): void {
  sendNotificationToUser(candidateId, {
    id: `job-match-${Date.now()}`,
    type: "job_match",
    title: "New Job Match",
    message: `New job matching your profile: ${jobTitle} (${matchScore}% match)`,
    data: { jobTitle, matchScore },
    timestamp: new Date(),
    read: false,
  });
}

export function notifyApplicationUpdate(candidateId: number, jobTitle: string, status: string): void {
  sendNotificationToUser(candidateId, {
    id: `app-update-${Date.now()}`,
    type: "application_update",
    title: "Application Update",
    message: `Your application for ${jobTitle} has been ${status}`,
    data: { jobTitle, status },
    timestamp: new Date(),
    read: false,
  });
}

export function notifyEmployerNewApplication(employerId: number, candidateName: string, jobTitle: string): void {
  sendNotificationToUser(employerId, {
    id: `new-app-${Date.now()}`,
    type: "application_update",
    title: "New Application",
    message: `${candidateName} applied for ${jobTitle}`,
    data: { candidateName, jobTitle },
    timestamp: new Date(),
    read: false,
  });
}

/**
 * Get Socket.IO instance (for advanced usage)
 */
export function getSocketIO(): SocketIOServer | null {
  return io;
}

/**
 * Send engagement score alert notification
 */
export function notifyEngagementScoreAlert(
  userId: number, 
  candidateId: number, 
  data: {
    candidateName: string;
    scoreBefore: number;
    scoreAfter: number;
    changePercentage: number;
  }
): void {
  const severity = data.changePercentage > 30 ? 'critical' : data.changePercentage > 15 ? 'warning' : 'info';
  
  sendNotificationToUser(userId, {
    id: `engagement-alert-${Date.now()}`,
    type: "engagement_alert",
    title: "Engagement Score Alert",
    message: `${data.candidateName}'s engagement score dropped from ${data.scoreBefore} to ${data.scoreAfter} (${data.changePercentage}% decrease)`,
    data: {
      candidateId,
      ...data,
      severity,
    },
    timestamp: new Date(),
    read: false,
  });
}

/**
 * Send A/B test result notification
 */
export function notifyABTestResult(
  userId: number, 
  testId: number, 
  data: {
    testName: string;
    variantA: string;
    variantB: string;
    winner: string;
    confidence: number;
    improvement: number;
    statisticallySignificant: boolean;
  }
): void {
  sendNotificationToUser(userId, {
    id: `ab-test-${Date.now()}`,
    type: "ab_test_result",
    title: "A/B Test Results Ready",
    message: data.statisticallySignificant
      ? `${data.testName}: ${data.winner} won with ${data.improvement}% improvement (${data.confidence}% confidence)`
      : `${data.testName}: Results not yet statistically significant`,
    data: {
      testId,
      ...data,
    },
    timestamp: new Date(),
    read: false,
  });
}

/**
 * Send interview reminder notification
 */
export function notifyInterviewReminder(
  userId: number, 
  interviewId: number, 
  data: {
    candidateName: string;
    interviewTime: string;
    minutesUntil: number;
  }
): void {
  sendNotificationToUser(userId, {
    id: `interview-reminder-${Date.now()}`,
    type: "interview_reminder",
    title: "Interview Reminder",
    message: `Interview with ${data.candidateName} starts in ${data.minutesUntil} minutes`,
    data: {
      interviewId,
      ...data,
    },
    timestamp: new Date(),
    read: false,
  });
}

/**
 * Send dashboard update notification (for live updates)
 */
export function notifyDashboardUpdate(
  userId: number, 
  updateType: string, 
  data: any
): void {
  sendNotificationToUser(userId, {
    id: `dashboard-update-${Date.now()}`,
    type: "dashboard_update",
    title: "Dashboard Update",
    message: `${updateType} data has been updated`,
    data: {
      updateType,
      ...data,
    },
    timestamp: new Date(),
    read: false,
  });
}

/**
 * Send high-quality match notification (score ≥ 80)
 */
export function notifyHighQualityMatch(
  userId: number,
  matchData: {
    candidateName: string;
    jobTitle: string;
    matchScore: number;
    matchId: number;
    cultureFitScore?: number;
    wellbeingScore?: number;
  }
): void {
  sendNotificationToUser(userId, {
    id: `high-quality-match-${Date.now()}`,
    type: "high_quality_match",
    title: "🎯 High-Quality Match Found!",
    message: `${matchData.candidateName} is a ${matchData.matchScore}% match for ${matchData.jobTitle}`,
    data: {
      ...matchData,
      priority: "high",
      actionUrl: `/matches/${matchData.matchId}`,
    },
    timestamp: new Date(),
    read: false,
  });
}

/**
 * Send bulk operation completion notification
 */
export function notifyBulkOperationComplete(
  userId: number,
  operationData: {
    operationType: string;
    totalProcessed: number;
    successCount: number;
    failureCount: number;
    duration: number;
  }
): void {
  const status = operationData.failureCount === 0 ? "✅ Completed" : "⚠️ Completed with errors";
  
  sendNotificationToUser(userId, {
    id: `bulk-op-${Date.now()}`,
    type: "bulk_operation_complete",
    title: `${status}: ${operationData.operationType}`,
    message: `Processed ${operationData.totalProcessed} items (${operationData.successCount} succeeded, ${operationData.failureCount} failed) in ${operationData.duration}s`,
    data: operationData,
    timestamp: new Date(),
    read: false,
  });
}

/**
 * Send profile enrichment completion notification
 */
export function notifyProfileEnrichmentComplete(
  userId: number,
  enrichmentData: {
    candidateName: string;
    candidateId: number;
    skillsExtracted: number;
    completenessScore: number;
  }
): void {
  sendNotificationToUser(userId, {
    id: `profile-enrichment-${Date.now()}`,
    type: "profile_enrichment_complete",
    title: "Profile Enrichment Complete",
    message: `${enrichmentData.candidateName}'s profile is now ${enrichmentData.completenessScore}% complete with ${enrichmentData.skillsExtracted} skills extracted`,
    data: {
      ...enrichmentData,
      actionUrl: `/candidates/${enrichmentData.candidateId}`,
    },
    timestamp: new Date(),
    read: false,
  });
}

/**
 * Job Monitoring Notification Helpers
 */

export function notifyJobStarted(userId: number, jobName: string, jobId: number): void {
  sendNotificationToUser(userId, {
    id: `job-started-${jobId}-${Date.now()}`,
    type: "job_started",
    title: "Job Started",
    message: `${jobName} has started execution`,
    data: { jobName, jobId, status: "running" },
    timestamp: new Date(),
    read: false,
  });
}

export function notifyJobProgress(userId: number, jobName: string, jobId: number, progress: number): void {
  sendNotificationToUser(userId, {
    id: `job-progress-${jobId}-${Date.now()}`,
    type: "job_progress",
    title: "Job Progress",
    message: `${jobName} is ${progress}% complete`,
    data: { jobName, jobId, progress, status: "running" },
    timestamp: new Date(),
    read: false,
  });
}

export function notifyJobCompleted(userId: number, jobName: string, jobId: number, duration: number): void {
  sendNotificationToUser(userId, {
    id: `job-completed-${jobId}-${Date.now()}`,
    type: "job_completed",
    title: "Job Completed",
    message: `${jobName} completed successfully in ${Math.round(duration / 1000)}s`,
    data: { jobName, jobId, duration, status: "completed" },
    timestamp: new Date(),
    read: false,
  });
}

export function notifyJobFailed(userId: number, jobName: string, jobId: number, error: string): void {
  sendNotificationToUser(userId, {
    id: `job-failed-${jobId}-${Date.now()}`,
    type: "job_failed",
    title: "Job Failed",
    message: `${jobName} failed: ${error}`,
    data: { jobName, jobId, error, status: "failed" },
    timestamp: new Date(),
    read: false,
  });
}

export function notifyExportCompleted(userId: number, exportName: string, exportId: number, fileUrl: string): void {
  sendNotificationToUser(userId, {
    id: `export-completed-${exportId}-${Date.now()}`,
    type: "export_completed",
    title: "Export Ready",
    message: `${exportName} is ready for download`,
    data: { exportName, exportId, fileUrl },
    timestamp: new Date(),
    read: false,
  });
}

/**
 * Broadcast job status update to all admin users
 */
export function broadcastJobStatusUpdate(jobId: number, status: string, data?: Record<string, any>): void {
  if (!io) {
    console.warn("[WebSocket] Socket.IO not initialized");
    return;
  }

  // Emit to admin room (admins should join this room on connection)
  io.to("admin").emit("job:status", {
    jobId,
    status,
    timestamp: new Date(),
    ...data,
  });
}
