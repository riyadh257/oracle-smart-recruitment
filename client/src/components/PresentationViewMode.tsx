import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Monitor } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PresentationViewModeProps {
  isPresenterMode: boolean;
  onToggle: () => void;
}

export function PresentationViewMode({
  isPresenterMode,
  onToggle,
}: PresentationViewModeProps) {
  return (
    <div className="flex items-center gap-2">
      <Badge variant={isPresenterMode ? "default" : "secondary"} className="flex items-center gap-1">
        {isPresenterMode ? (
          <>
            <Monitor className="w-3 h-3" />
            Presenter Mode
          </>
        ) : (
          <>
            <Eye className="w-3 h-3" />
            Viewer Mode
          </>
        )}
      </Badge>
      <Button
        variant="outline"
        size="sm"
        onClick={onToggle}
        title={isPresenterMode ? "Switch to Viewer Mode" : "Switch to Presenter Mode"}
      >
        {isPresenterMode ? (
          <>
            <Eye className="w-4 h-4 mr-2" />
            View as Audience
          </>
        ) : (
          <>
            <EyeOff className="w-4 h-4 mr-2" />
            Presenter View
          </>
        )}
      </Button>
    </div>
  );
}
