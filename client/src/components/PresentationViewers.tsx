import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Eye, Circle } from "lucide-react";
import { io, Socket } from "socket.io-client";

interface Viewer {
  id: number;
  viewerId: string;
  viewerName: string;
  currentSlideIndex: number;
  status: "online" | "away" | "offline";
  isFollowingPresenter: boolean;
}

interface PresentationViewersProps {
  sessionId: string;
  currentSlideIndex?: number;
}

export function PresentationViewers({ sessionId, currentSlideIndex }: PresentationViewersProps) {
  const [viewers, setViewers] = useState<Viewer[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);

  // Fetch initial viewers
  const { data: initialViewers } = trpc.presentation.getSessionViewers.useQuery(
    { sessionId },
    { refetchInterval: 5000 } // Fallback polling
  );

  useEffect(() => {
    if (initialViewers) {
      setViewers(initialViewers as Viewer[]);
    }
  }, [initialViewers]);

  // WebSocket connection for real-time updates
  useEffect(() => {
    const newSocket = io("/presentation", {
      path: "/socket.io",
    });

    newSocket.on("connect", () => {
      console.log("Connected to presentation WebSocket");
    });

    newSocket.on("viewer-joined", (data: { viewerId: string; viewerName: string; userId?: number }) => {
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
      setViewers((prev) =>
        prev.map((v) =>
          v.viewerId === data.viewerId ? { ...v, status: "offline" as const } : v
        )
      );
    });

    newSocket.on("viewer-slide-changed", (data: { viewerId: string; slideIndex: number }) => {
      setViewers((prev) =>
        prev.map((v) =>
          v.viewerId === data.viewerId ? { ...v, currentSlideIndex: data.slideIndex } : v
        )
      );
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const onlineViewers = viewers.filter((v) => v.status === "online");
  const viewerCount = onlineViewers.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="w-4 h-4" />
          Live Viewers ({viewerCount})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {viewerCount === 0 ? (
          <p className="text-sm text-muted-foreground">No viewers currently watching</p>
        ) : (
          <div className="space-y-2">
            {onlineViewers.map((viewer) => (
              <div
                key={viewer.viewerId}
                className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
              >
                <div className="flex items-center gap-2">
                  <Circle
                    className={`w-2 h-2 fill-current ${
                      viewer.status === "online"
                        ? "text-green-500"
                        : viewer.status === "away"
                        ? "text-yellow-500"
                        : "text-gray-400"
                    }`}
                  />
                  <span className="text-sm font-medium">{viewer.viewerName}</span>
                </div>
                <div className="flex items-center gap-2">
                  {viewer.isFollowingPresenter && (
                    <Badge variant="secondary" className="text-xs">
                      <Eye className="w-3 h-3 mr-1" />
                      Following
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    Slide {viewer.currentSlideIndex + 1}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
