import { useState, useEffect, useCallback, useRef } from "react";
import { io } from "socket.io-client";
import type { Socket } from "socket.io-client";

interface Viewer {
  id: number;
  viewerId: string;
  viewerName: string;
  currentSlideIndex: number;
  status: "online" | "away" | "offline";
  isFollowingPresenter: boolean;
}

interface UsePresentationCollaborationProps {
  presentationId: number;
  sessionId?: string;
  userId?: number;
  viewerName?: string;
  isPresenter?: boolean;
  onSlideChange?: (slideIndex: number) => void;
}

export function usePresentationCollaboration({
  presentationId,
  sessionId: initialSessionId,
  userId,
  viewerName,
  isPresenter = false,
  onSlideChange,
}: UsePresentationCollaborationProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [sessionId, setSessionId] = useState<string | undefined>(initialSessionId);
  const [viewerId, setViewerId] = useState<string | undefined>();
  const [viewers, setViewers] = useState<Viewer[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isFollowingPresenter, setIsFollowingPresenter] = useState(true);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const heartbeatInterval = useRef<NodeJS.Timeout | undefined>(undefined);

  // Initialize WebSocket connection
  useEffect(() => {
    const newSocket = io(window.location.origin + "/presentation", {
      path: "/socket.io",
      transports: ["websocket", "polling"],
      autoConnect: true,
    });

    newSocket.on("connect", () => {
      console.log("[Collaboration] Connected to presentation WebSocket");
      setIsConnected(true);

      // Join presentation
      newSocket.emit("join-presentation", {
        presentationId,
        sessionId: initialSessionId,
        userId,
        viewerName: viewerName || "Anonymous",
        isPresenter,
      });
    });

    newSocket.on("disconnect", () => {
      console.log("[Collaboration] Disconnected from presentation WebSocket");
      setIsConnected(false);
    });

    newSocket.on("joined-presentation", (data: {
      sessionId: string;
      viewerId: string;
      viewers: Viewer[];
    }) => {
      console.log("[Collaboration] Joined presentation", data);
      setSessionId(data.sessionId);
      setViewerId(data.viewerId);
      setViewers(data.viewers);
    });

    newSocket.on("viewer-joined", (data: {
      viewerId: string;
      viewerName: string;
      userId?: number;
    }) => {
      console.log("[Collaboration] Viewer joined", data);
      setViewers((prev) => [
        ...prev,
        {
          id: Date.now(),
          viewerId: data.viewerId,
          viewerName: data.viewerName,
          currentSlideIndex: 0,
          status: "online",
          isFollowingPresenter: true,
        },
      ]);
    });

    newSocket.on("viewer-left", (data: { viewerId: string }) => {
      console.log("[Collaboration] Viewer left", data);
      setViewers((prev) =>
        prev.map((v) =>
          v.viewerId === data.viewerId ? { ...v, status: "offline" as const } : v
        )
      );
    });

    newSocket.on("viewer-slide-changed", (data: {
      viewerId: string;
      slideIndex: number;
    }) => {
      console.log("[Collaboration] Viewer slide changed", data);
      setViewers((prev) =>
        prev.map((v) =>
          v.viewerId === data.viewerId ? { ...v, currentSlideIndex: data.slideIndex } : v
        )
      );
    });

    newSocket.on("presenter-navigated", (data: {
      slideIndex: number;
      presenterId: string;
    }) => {
      console.log("[Collaboration] Presenter navigated", data);
      
      // Auto-follow if following mode is enabled
      if (isFollowingPresenter && onSlideChange) {
        setCurrentSlideIndex(data.slideIndex);
        onSlideChange(data.slideIndex);
      }
    });

    newSocket.on("follow-mode-updated", (data: { isFollowing: boolean }) => {
      console.log("[Collaboration] Follow mode updated", data);
      setIsFollowingPresenter(data.isFollowing);
    });

    newSocket.on("viewers-list", (data: { viewers: Viewer[] }) => {
      console.log("[Collaboration] Viewers list received", data);
      setViewers(data.viewers);
    });

    newSocket.on("annotation-received", (data: {
      type: "laser" | "draw" | "highlight";
      x: number;
      y: number;
      color?: string;
    }) => {
      // Handle annotations (can be implemented later)
      console.log("[Collaboration] Annotation received", data);
    });

    newSocket.on("error", (error: { message: string }) => {
      console.error("[Collaboration] WebSocket error:", error);
    });

    setSocket(newSocket);

    // Setup heartbeat
    heartbeatInterval.current = setInterval(() => {
      if (newSocket.connected) {
        newSocket.emit("heartbeat");
      }
    }, 30000); // Every 30 seconds

    return () => {
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
      }
      newSocket.close();
    };
  }, [presentationId, initialSessionId, userId, viewerName, isPresenter]);

  // Update slide (for viewers)
  const updateSlide = useCallback((slideIndex: number) => {
    if (socket && isConnected) {
      setCurrentSlideIndex(slideIndex);
      socket.emit("update-slide", { slideIndex });
    }
  }, [socket, isConnected]);

  // Navigate as presenter (syncs all followers)
  const presenterNavigate = useCallback((slideIndex: number) => {
    if (socket && isConnected && isPresenter) {
      setCurrentSlideIndex(slideIndex);
      socket.emit("presenter-navigate", { slideIndex });
    }
  }, [socket, isConnected, isPresenter]);

  // Toggle follow presenter mode
  const toggleFollowPresenter = useCallback(() => {
    if (socket && isConnected) {
      const newFollowState = !isFollowingPresenter;
      socket.emit("toggle-follow-presenter", { isFollowing: newFollowState });
    }
  }, [socket, isConnected, isFollowingPresenter]);

  // Request viewers list
  const refreshViewers = useCallback(() => {
    if (socket && isConnected) {
      socket.emit("get-viewers");
    }
  }, [socket, isConnected]);

  // Send annotation
  const sendAnnotation = useCallback((annotation: {
    type: "laser" | "draw" | "highlight";
    x: number;
    y: number;
    color?: string;
  }) => {
    if (socket && isConnected && isPresenter) {
      socket.emit("presenter-annotation", annotation);
    }
  }, [socket, isConnected, isPresenter]);

  const onlineViewers = viewers.filter((v) => v.status === "online");

  return {
    sessionId,
    viewerId,
    viewers: onlineViewers,
    allViewers: viewers,
    isConnected,
    isFollowingPresenter,
    currentSlideIndex,
    updateSlide,
    presenterNavigate,
    toggleFollowPresenter,
    refreshViewers,
    sendAnnotation,
  };
}
