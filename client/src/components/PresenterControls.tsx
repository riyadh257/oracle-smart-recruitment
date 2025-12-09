import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Users,
  MonitorPlay,
} from "lucide-react";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";

interface PresenterControlsProps {
  sessionId: string;
  currentSlide: number;
  totalSlides: number;
  onSlideChange: (slideIndex: number) => void;
  isPresenterMode: boolean;
}

export function PresenterControls({
  sessionId,
  currentSlide,
  totalSlides,
  onSlideChange,
  isPresenterMode,
}: PresenterControlsProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!isPresenterMode) return;

    const newSocket = io("/presentation", {
      path: "/socket.io",
    });

    newSocket.on("connect", () => {
      console.log("Presenter connected to WebSocket");
      setIsConnected(true);
      
      // Join as presenter
      newSocket.emit("join-presentation", {
        presentationId: parseInt(sessionId),
        sessionId,
        isPresenter: true,
      });
    });

    newSocket.on("disconnect", () => {
      setIsConnected(false);
    });

    newSocket.on("viewer-joined", () => {
      setViewerCount((prev: any) => prev + 1);
      toast.info("A viewer joined the presentation");
    });

    newSocket.on("viewer-left", () => {
      setViewerCount((prev: any) => Math.max(0, prev - 1));
    });

    newSocket.on("viewers-list", (data: { viewers: any[] }) => {
      setViewerCount(data.viewers.filter((v) => v.status === "online").length);
    });

    // Request initial viewer count
    setTimeout(() => {
      newSocket.emit("get-viewers");
    }, 1000);

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [isPresenterMode, sessionId]);

  const handlePrevious = () => {
    if (currentSlide > 0) {
      const newSlide = currentSlide - 1;
      onSlideChange(newSlide);
      
      if (socket && isPresenterMode) {
        socket.emit("presenter-navigate", { slideIndex: newSlide });
      }
    }
  };

  const handleNext = () => {
    if (currentSlide < totalSlides - 1) {
      const newSlide = currentSlide + 1;
      onSlideChange(newSlide);
      
      if (socket && isPresenterMode) {
        socket.emit("presenter-navigate", { slideIndex: newSlide });
      }
    }
  };

  const handleGoToSlide = (slideIndex: number) => {
    if (slideIndex >= 0 && slideIndex < totalSlides) {
      onSlideChange(slideIndex);
      
      if (socket && isPresenterMode) {
        socket.emit("presenter-navigate", { slideIndex });
      }
    }
  };

  if (!isPresenterMode) {
    return (
      <Card className="fixed bottom-4 right-4 w-auto">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrevious}
              disabled={currentSlide === 0}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium min-w-[80px] text-center">
              {currentSlide + 1} / {totalSlides}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={handleNext}
              disabled={currentSlide === totalSlides - 1}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 w-auto">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <MonitorPlay className="w-4 h-4 text-primary" />
            <Badge variant={isConnected ? "default" : "secondary"}>
              {isConnected ? "Presenting" : "Disconnected"}
            </Badge>
          </div>

          <div className="flex items-center gap-1 px-3 py-1 rounded-md bg-muted">
            <Users className="w-4 h-4" />
            <span className="text-sm font-medium">{viewerCount}</span>
          </div>

          <div className="h-6 w-px bg-border" />

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrevious}
              disabled={currentSlide === 0}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="1"
                max={totalSlides}
                value={currentSlide + 1}
                onChange={(e) => {
                  const value = parseInt(e.target.value) - 1;
                  if (!isNaN(value)) {
                    handleGoToSlide(value);
                  }
                }}
                className="w-12 px-2 py-1 text-sm text-center border rounded"
              />
              <span className="text-sm text-muted-foreground">/ {totalSlides}</span>
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={handleNext}
              disabled={currentSlide === totalSlides - 1}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
