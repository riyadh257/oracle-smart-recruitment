import { Server as HTTPServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { ENV } from "./env";
import { getUserByOpenId } from "../db";

export interface AuthenticatedSocket extends Socket {
  userId?: number;
  userOpenId?: string;
}

let io: SocketIOServer | null = null;

/**
 * Initialize Socket.IO server
 */
export function initializeSocketIO(httpServer: HTTPServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*", // In production, restrict this to your frontend domain
      methods: ["GET", "POST"],
      credentials: true,
    },
    path: "/socket.io/",
  });

  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next: (err?: Error) => void) => {
    try {
      const token = (socket as Socket).handshake.auth.token || (socket as Socket).handshake.headers.authorization?.replace("Bearer ", "");
      
      if (!token) {
        return next(new Error("Authentication token required"));
      }

      // Verify JWT token
      const decoded = jwt.verify(token, ENV.jwtSecret) as { openId: string };
      
      if (!decoded.openId) {
        return next(new Error("Invalid token"));
      }

      // Get user from database
      const user = await getUserByOpenId(decoded.openId);
      
      if (!user) {
        return next(new Error("User not found"));
      }

      // Attach user info to socket
      socket.userId = user.id;
      socket.userOpenId = user.openId;
      
      next();
    } catch (error) {
      console.error("[Socket.IO] Authentication error:", error);
      next(new Error("Authentication failed"));
    }
  });

  // Connection handler
  io.on("connection", (socket: AuthenticatedSocket) => {
    console.log(`[Socket.IO] User connected: ${socket.userId} (${socket.userOpenId})`);

    // Join user-specific room for targeted notifications
    if (socket.userId) {
      (socket as Socket).join(`user:${socket.userId}`);
    }

    // Handle disconnection
    (socket as Socket).on("disconnect", () => {
      console.log(`[Socket.IO] User disconnected: ${socket.userId}`);
    });

    // Handle notification read acknowledgment
    (socket as Socket).on("notification:read", (notificationId: number) => {
      console.log(`[Socket.IO] Notification ${notificationId} marked as read by user ${socket.userId}`);
      // Broadcast to other devices of the same user
      (socket as Socket).to(`user:${socket.userId}`).emit("notification:read", notificationId);
    });

    // Handle notification read all
    (socket as Socket).on("notification:read_all", () => {
      console.log(`[Socket.IO] All notifications marked as read by user ${socket.userId}`);
      (socket as Socket).to(`user:${socket.userId}`).emit("notification:read_all");
    });

    // WebRTC Video Interview Signaling
    (socket as Socket).on("join-video-room", (roomId: string) => {
      console.log(`[Socket.IO] User ${socket.userId} joining video room ${roomId}`);
      (socket as Socket).join(`video:${roomId}`);
      (socket as Socket).to(`video:${roomId}`).emit("user-joined-video", {
        userId: socket.userId,
        socketId: (socket as Socket).id,
      });
    });

    (socket as Socket).on("leave-video-room", (roomId: string) => {
      console.log(`[Socket.IO] User ${socket.userId} leaving video room ${roomId}`);
      (socket as Socket).to(`video:${roomId}`).emit("user-left-video", {
        userId: socket.userId,
        socketId: (socket as Socket).id,
      });
      (socket as Socket).leave(`video:${roomId}`);
    });

    (socket as Socket).on("webrtc-offer", (data: { roomId: string; to: string; offer: any }) => {
      console.log(`[Socket.IO] Sending WebRTC offer in room ${data.roomId}`);
      io?.to(data.to).emit("webrtc-offer", {
        from: (socket as Socket).id,
        offer: data.offer,
      });
    });

    (socket as Socket).on("webrtc-answer", (data: { roomId: string; to: string; answer: any }) => {
      console.log(`[Socket.IO] Sending WebRTC answer in room ${data.roomId}`);
      io?.to(data.to).emit("webrtc-answer", {
        from: (socket as Socket).id,
        answer: data.answer,
      });
    });

    (socket as Socket).on("webrtc-ice-candidate", (data: { roomId: string; to: string; candidate: any }) => {
      console.log(`[Socket.IO] Sending ICE candidate in room ${data.roomId}`);
      io?.to(data.to).emit("webrtc-ice-candidate", {
        from: (socket as Socket).id,
        candidate: data.candidate,
      });
    });

    (socket as Socket).on("video-chat-message", (data: { roomId: string; message: string }) => {
      console.log(`[Socket.IO] Chat message in video room ${data.roomId}`);
      (socket as Socket).to(`video:${data.roomId}`).emit("video-chat-message", {
        userId: socket.userId,
        message: data.message,
        timestamp: Date.now(),
      });
    });
  });

  console.log("[Socket.IO] Server initialized successfully");
  return io;
}

/**
 * Get Socket.IO server instance
 */
export function getSocketIO(): SocketIOServer | null {
  return io;
}

/**
 * Emit notification to specific user
 */
export function emitNotificationToUser(userId: number, notification: any) {
  if (!io) {
    console.warn("[Socket.IO] Server not initialized");
    return;
  }

  io.to(`user:${userId}`).emit("notification:new", notification);
  console.log(`[Socket.IO] Notification sent to user ${userId}:`, notification.title);
}

/**
 * Emit notification to all connected users (broadcast)
 */
export function emitNotificationToAll(notification: any) {
  if (!io) {
    console.warn("[Socket.IO] Server not initialized");
    return;
  }

  io.emit("notification:broadcast", notification);
  console.log("[Socket.IO] Broadcast notification sent:", notification.title);
}

/**
 * Emit notification to specific role (admin, recruiter, etc.)
 */
export function emitNotificationToRole(role: string, notification: any) {
  if (!io) {
    console.warn("[Socket.IO] Server not initialized");
    return;
  }

  io.to(`role:${role}`).emit("notification:new", notification);
  console.log(`[Socket.IO] Notification sent to role ${role}:`, notification.title);
}
