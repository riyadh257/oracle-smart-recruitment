import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Lock } from "lucide-react";
import { PresenterNotesPanel } from "@/components/PresenterNotesPanel";
import { PresentationViewMode } from "@/components/PresentationViewMode";
import { ViewerPresence } from "@/components/ViewerPresence";
import { usePresentationCollaboration } from "@/hooks/usePresentationCollaboration";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

export default function SharedPresentationViewer() {
  const { token } = useParams<{ token: string }>();
  const [password, setPassword] = useState("");
  const [sessionId] = useState(() => {
    // Generate unique session ID for analytics
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  });
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slideStartTime, setSlideStartTime] = useState(Date.now());
  const [isPresenterMode, setIsPresenterMode] = useState(false);
  const { user } = useAuth();

  const { data, isLoading, error, refetch } = trpc.presentation.getSharedPresentation.useQuery(
    { token: token || "", password: password || undefined },
    { enabled: !!token, retry: false }
  );

  const trackViewMutation = trpc.presentation.trackSlideView.useMutation();
  const updateTimeMutation = trpc.presentation.updateSlideTimeSpent.useMutation();

  // Real-time collaboration
  const collaboration = usePresentationCollaboration({
    presentationId: data?.presentation?.id || 0,
    userId: user?.id,
    viewerName: user?.name || "Anonymous",
    isPresenter: isPresenterMode,
    onSlideChange: (slideIndex) => {
      setCurrentSlide(slideIndex);
    },
  });

  useEffect(() => {
    if (data?.presentation && data?.sharedLink) {
      // Track initial slide view
      trackViewMutation.mutate({
        presentationId: data.presentation.id,
        sharedLinkId: data.sharedLink.id,
        slideId: `slide-${currentSlide}`,
        slideIndex: currentSlide,
        viewerSessionId: sessionId,
      });
      setSlideStartTime(Date.now());
    }
  }, [data, currentSlide, sessionId]);

  useEffect(() => {
    // Update time spent when leaving slide
    return () => {
      if (data?.presentation) {
        const timeSpent = Math.floor((Date.now() - slideStartTime) / 1000);
        if (timeSpent > 0) {
          updateTimeMutation.mutate({
            viewerSessionId: sessionId,
            slideId: `slide-${currentSlide}`,
            additionalTime: timeSpent,
          });
        }
      }
    };
  }, [currentSlide, data, sessionId, slideStartTime]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      toast.error("Please enter a password");
      return;
    }
    refetch();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Show password prompt if needed
  if (error?.data?.code === "UNAUTHORIZED") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Lock className="h-5 w-5" />
              <CardTitle>Password Required</CardTitle>
            </div>
            <CardDescription>
              This presentation is password protected. Please enter the password to continue.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full">
                Access Presentation
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error for other cases
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              {error.message || "Unable to access this presentation"}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!data?.presentation) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Presentation Not Found</CardTitle>
            <CardDescription>
              The presentation you're looking for could not be found.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const { presentation } = data;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>{presentation.title}</CardTitle>
                {presentation.description && (
                  <CardDescription>{presentation.description}</CardDescription>
                )}
              </div>
              <div className="flex items-center gap-2">
                {collaboration.isConnected && (
                  <ViewerPresence
                    viewers={collaboration.viewers}
                    currentSlideIndex={currentSlide}
                    isFollowingPresenter={collaboration.isFollowingPresenter}
                    onToggleFollow={collaboration.toggleFollowPresenter}
                  />
                )}
                <PresentationViewMode
                  isPresenterMode={isPresenterMode}
                  onToggle={() => setIsPresenterMode(!isPresenterMode)}
                />
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardContent className="p-8">
            <div className="bg-white rounded-lg shadow-lg aspect-video flex items-center justify-center">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-4">Presentation Viewer</h2>
                <p className="text-muted-foreground mb-4">
                  Slide {currentSlide + 1}
                </p>
                <p className="text-sm text-muted-foreground">
                  Integration with actual slide viewer would display slides here
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Path: {presentation.slidesPath}
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  const newSlide = Math.max(0, currentSlide - 1);
                  if (isPresenterMode) {
                    collaboration.presenterNavigate(newSlide);
                  } else {
                    collaboration.updateSlide(newSlide);
                  }
                  setCurrentSlide(newSlide);
                }}
                disabled={currentSlide === 0}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Slide {currentSlide + 1}
              </span>
              <Button
                variant="outline"
                onClick={() => {
                  const newSlide = currentSlide + 1;
                  if (isPresenterMode) {
                    collaboration.presenterNavigate(newSlide);
                  } else {
                    collaboration.updateSlide(newSlide);
                  }
                  setCurrentSlide(newSlide);
                }}
              >
                Next
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Presenter Notes Panel - shows based on view mode */}
        <PresenterNotesPanel
          presentationId={presentation.id}
          currentSlideIndex={currentSlide}
          isPresenterMode={isPresenterMode}
        />

        <div className="mt-6 text-center text-xs text-muted-foreground">
          <p>Oracle Smart Recruitment System</p>
          <p className="mt-1">
            Analytics are being tracked for this viewing session
          </p>
        </div>
      </div>
    </div>
  );
}
