import { Users, Eye, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

interface Viewer {
  id: number;
  viewerId: string;
  viewerName: string;
  currentSlideIndex: number;
  status: "online" | "away" | "offline";
  isFollowingPresenter: boolean;
}

interface ViewerPresenceProps {
  viewers: Viewer[];
  currentSlideIndex: number;
  isFollowingPresenter: boolean;
  onToggleFollow: () => void;
  className?: string;
}

export function ViewerPresence({
  viewers,
  currentSlideIndex,
  isFollowingPresenter,
  onToggleFollow,
  className = "",
}: ViewerPresenceProps) {
  const onlineViewers = viewers.filter((v) => v.status === "online");
  const viewersOnCurrentSlide = onlineViewers.filter(
    (v) => v.currentSlideIndex === currentSlideIndex
  );

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Follow Presenter Toggle */}
      <Button
        variant={isFollowingPresenter ? "default" : "outline"}
        size="sm"
        onClick={onToggleFollow}
        className="gap-2"
      >
        <UserCheck className="w-4 h-4" />
        {isFollowingPresenter ? "Following" : "Follow Presenter"}
      </Button>

      {/* Viewers List */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Users className="w-4 h-4" />
            <span>{onlineViewers.length}</span>
            {viewersOnCurrentSlide.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                <Eye className="w-3 h-3 mr-1" />
                {viewersOnCurrentSlide.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm">Active Viewers</h4>
              <Badge variant="outline">{onlineViewers.length} online</Badge>
            </div>

            {onlineViewers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No other viewers online
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {onlineViewers.map((viewer) => (
                  <div
                    key={viewer.viewerId}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                      <span className="text-sm font-medium truncate">
                        {viewer.viewerName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {viewer.isFollowingPresenter && (
                        <Badge variant="secondary" className="text-xs">
                          <UserCheck className="w-3 h-3 mr-1" />
                          Following
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        Slide {viewer.currentSlideIndex + 1}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {viewersOnCurrentSlide.length > 0 && (
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">
                  <Eye className="w-3 h-3 inline mr-1" />
                  {viewersOnCurrentSlide.length} viewer
                  {viewersOnCurrentSlide.length !== 1 ? "s" : ""} on this slide
                </p>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
