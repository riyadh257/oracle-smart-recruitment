import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';

let io: Server | null = null;

export interface NotificationPayload {
  type: 'engagement_alert' | 'ab_test_result' | 'interview_reminder' | 'system_notification';
  title: string;
  message: string;
  severity?: 'info' | 'warning' | 'critical';
  data?: any;
  timestamp: number;
}

/**
 * Initialize WebSocket server
 */
export function initializeWebSocket(httpServer: HTTPServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.VITE_FRONTEND_URL || '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    path: '/api/socket.io',
  });

  io.on('connection', (socket: Socket) => {
    console.log(`[WebSocket] Client connected: ${socket.id}`);

    // Handle authentication
    socket.on('authenticate', (data: { userId: number }) => {
      socket.data.userId = data.userId;
      socket.join(`user:${data.userId}`);
      console.log(`[WebSocket] User ${data.userId} authenticated`);
    });

    // Handle subscription to specific channels
    socket.on('subscribe', (channel: string) => {
      socket.join(channel);
      console.log(`[WebSocket] Client ${socket.id} subscribed to ${channel}`);
    });

    socket.on('unsubscribe', (channel: string) => {
      socket.leave(channel);
      console.log(`[WebSocket] Client ${socket.id} unsubscribed from ${channel}`);
    });

    socket.on('disconnect', () => {
      console.log(`[WebSocket] Client disconnected: ${socket.id}`);
    });
  });

  console.log('[WebSocket] Server initialized');
  return io;
}

/**
 * Get the Socket.IO server instance
 */
export function getIO(): Server | null {
  return io;
}

/**
 * Send notification to a specific user
 */
export function notifyUser(userId: number, notification: NotificationPayload) {
  if (!io) {
    console.warn('[WebSocket] Server not initialized');
    return false;
  }

  io.to(`user:${userId}`).emit('notification', notification);
  console.log(`[WebSocket] Notification sent to user ${userId}:`, notification.type);
  return true;
}

/**
 * Send notification to all users in a channel
 */
export function notifyChannel(channel: string, notification: NotificationPayload) {
  if (!io) {
    console.warn('[WebSocket] Server not initialized');
    return false;
  }

  io.to(channel).emit('notification', notification);
  console.log(`[WebSocket] Notification sent to channel ${channel}:`, notification.type);
  return true;
}

/**
 * Broadcast notification to all connected clients
 */
export function broadcastNotification(notification: NotificationPayload) {
  if (!io) {
    console.warn('[WebSocket] Server not initialized');
    return false;
  }

  io.emit('notification', notification);
  console.log(`[WebSocket] Broadcast notification:`, notification.type);
  return true;
}

/**
 * Send engagement score alert
 */
export function sendEngagementAlert(userId: number, candidateId: number, data: {
  candidateName: string;
  scoreBefore: number;
  scoreAfter: number;
  changePercentage: number;
}) {
  const notification: NotificationPayload = {
    type: 'engagement_alert',
    title: 'Engagement Score Alert',
    message: `${data.candidateName}'s engagement score dropped from ${data.scoreBefore} to ${data.scoreAfter} (${data.changePercentage}% decrease)`,
    severity: data.changePercentage > 30 ? 'critical' : data.changePercentage > 15 ? 'warning' : 'info',
    data: {
      candidateId,
      ...data,
    },
    timestamp: Date.now(),
  };

  return notifyUser(userId, notification);
}

/**
 * Send A/B test result notification
 */
export function sendABTestResult(userId: number, testId: number, data: {
  testName: string;
  variantA: string;
  variantB: string;
  winner: string;
  confidence: number;
  improvement: number;
}) {
  const notification: NotificationPayload = {
    type: 'ab_test_result',
    title: 'A/B Test Results Ready',
    message: `${data.testName}: ${data.winner} won with ${data.improvement}% improvement (${data.confidence}% confidence)`,
    severity: 'info',
    data: {
      testId,
      ...data,
    },
    timestamp: Date.now(),
  };

  return notifyUser(userId, notification);
}

/**
 * Send interview reminder
 */
export function sendInterviewReminder(userId: number, interviewId: number, data: {
  candidateName: string;
  interviewTime: string;
  minutesUntil: number;
}) {
  const notification: NotificationPayload = {
    type: 'interview_reminder',
    title: 'Interview Reminder',
    message: `Interview with ${data.candidateName} starts in ${data.minutesUntil} minutes`,
    severity: 'warning',
    data: {
      interviewId,
      ...data,
    },
    timestamp: Date.now(),
  };

  return notifyUser(userId, notification);
}
