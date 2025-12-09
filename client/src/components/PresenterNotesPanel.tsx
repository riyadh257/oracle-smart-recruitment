import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Clock, Eye, EyeOff, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

interface PresenterNotesPanelProps {
  presentationId: number;
  currentSlideIndex: number;
  isPresenterMode: boolean;
}

export function PresenterNotesPanel({
  presentationId,
  currentSlideIndex,
  isPresenterMode,
}: PresenterNotesPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState("");
  const [visibleToViewers, setVisibleToViewers] = useState(false);
  const [estimatedDuration, setEstimatedDuration] = useState<number | undefined>();

  const { data: note, isLoading, refetch } = trpc.presentation.getNoteBySlide.useQuery(
    { presentationId, slideIndex: currentSlideIndex },
    { enabled: isPresenterMode }
  );

  const createNoteMutation = trpc.presentation.createNote.useMutation({
    onSuccess: () => {
      toast.success("Note saved successfully");
      setIsEditing(false);
      refetch();
    },
    onError: (error: any) => {
      toast.error(`Failed to save note: ${error.message}`);
    },
  });

  const updateNoteMutation = trpc.presentation.updateNote.useMutation({
    onSuccess: () => {
      toast.success("Note updated successfully");
      setIsEditing(false);
      refetch();
    },
    onError: (error: any) => {
      toast.error(`Failed to update note: ${error.message}`);
    },
  });

  useEffect(() => {
    if (note) {
      setEditedContent(note.content);
      setVisibleToViewers(note.visibleToViewers);
      setEstimatedDuration(note.estimatedDuration || undefined);
    } else {
      setEditedContent("");
      setVisibleToViewers(false);
      setEstimatedDuration(undefined);
    }
    setIsEditing(false);
  }, [note, currentSlideIndex]);

  if (!isPresenterMode) {
    // Viewer mode - only show notes if they're marked as visible
    if (!note || !note.visibleToViewers) {
      return null;
    }

    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Slide Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <Streamdown>{note.content}</Streamdown>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Presenter mode - full editing capabilities
  const handleSave = () => {
    if (note) {
      updateNoteMutation.mutate({
        id: note.id,
        content: editedContent,
        visibleToViewers,
        estimatedDuration,
      });
    } else {
      createNoteMutation.mutate({
        presentationId,
        slideIndex: currentSlideIndex,
        content: editedContent,
        visibleToViewers,
        estimatedDuration,
      });
    }
  };

  const isSaving = createNoteMutation.isPending || updateNoteMutation.isPending;

  return (
    <Card className="mt-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Presenter Notes
            <Badge variant="secondary" className="ml-2">
              Slide {currentSlideIndex + 1}
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            {estimatedDuration && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {Math.floor(estimatedDuration / 60)}:{(estimatedDuration % 60).toString().padStart(2, '0')}
              </Badge>
            )}
            {!isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                Edit
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : isEditing ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="note-content">Note Content (Markdown supported)</Label>
              <Textarea
                id="note-content"
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                placeholder="Add speaker notes for this slide..."
                className="min-h-[200px] mt-2"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  id="visible-to-viewers"
                  checked={visibleToViewers}
                  onCheckedChange={setVisibleToViewers}
                />
                <Label htmlFor="visible-to-viewers" className="cursor-pointer">
                  {visibleToViewers ? (
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      Visible to viewers
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <EyeOff className="w-4 h-4" />
                      Presenter only
                    </span>
                  )}
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <Label htmlFor="duration" className="text-sm">
                  Duration (minutes):
                </Label>
                <input
                  id="duration"
                  type="number"
                  min="0"
                  max="60"
                  value={estimatedDuration ? Math.floor(estimatedDuration / 60) : ""}
                  onChange={(e) => {
                    const minutes = parseInt(e.target.value) || 0;
                    setEstimatedDuration(minutes * 60);
                  }}
                  className="w-16 px-2 py-1 text-sm border rounded"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  if (note) {
                    setEditedContent(note.content);
                    setVisibleToViewers(note.visibleToViewers);
                    setEstimatedDuration(note.estimatedDuration || undefined);
                  }
                }}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving || !editedContent.trim()}>
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Note
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : note ? (
          <div className="space-y-4">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <Streamdown>{note.content}</Streamdown>
            </div>
            {note.keyPoints && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-2">Key Points:</p>
                <div className="text-sm text-muted-foreground">
                  <Streamdown>{note.keyPoints}</Streamdown>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p className="mb-4">No notes for this slide yet</p>
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              Add Notes
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
