import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { 
  Loader2, 
  Bookmark, 
  BookmarkCheck,
  Star,
  Trash2,
  Edit,
  Filter,
  X,
  TrendingUp,
  Users,
  Briefcase,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";

export default function SavedMatchesPage() {
  const { user, loading: authLoading } = useAuth();
  
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editNotes, setEditNotes] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editPriority, setEditPriority] = useState("");

  const { data: savedMatches, isLoading, refetch } = trpc.savedMatches.list.useQuery({
    status: statusFilter || undefined,
    priority: priorityFilter || undefined,
  });

  const updateMatch = trpc.savedMatches.update.useMutation({
    onSuccess: () => {
      toast.success("Match updated successfully");
      refetch();
      setEditDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Failed to update match: ${error.message}`);
    },
  });

  const unsaveMatch = trpc.savedMatches.unsave.useMutation({
    onSuccess: () => {
      toast.success("Match removed from saved list");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to remove match: ${error.message}`);
    },
  });

  const handleEditMatch = (match: any) => {
    setSelectedMatch(match);
    setEditNotes(match.notes || "");
    setEditTags(match.tags?.join(", ") || "");
    setEditStatus(match.status);
    setEditPriority(match.priority);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!selectedMatch) return;

    const tags = editTags
      .split(",")
      .map(t => t.trim())
      .filter(t => t.length > 0);

    updateMatch.mutate({
      id: selectedMatch.id,
      notes: editNotes,
      tags,
      status: editStatus as any,
      priority: editPriority as any,
    });
  };

  const handleUnsave = (matchId: number) => {
    if (confirm("Are you sure you want to remove this saved match?")) {
      unsaveMatch.mutate({ id: matchId });
    }
  };

  const clearFilters = () => {
    setStatusFilter("");
    setPriorityFilter("");
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      saved: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      contacted: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      interviewing: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      hired: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      archived: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getPriorityIcon = (priority: string) => {
    if (priority === "high") return <AlertCircle className="h-4 w-4 text-red-500" />;
    if (priority === "medium") return <TrendingUp className="h-4 w-4 text-yellow-500" />;
    return null;
  };

  if (authLoading || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <BookmarkCheck className="h-8 w-8 text-primary" />
              Saved Matches
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage your bookmarked candidate-job matches
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All statuses</SelectItem>
                    <SelectItem value="saved">Saved</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="interviewing">Interviewing</SelectItem>
                    <SelectItem value="hired">Hired</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All priorities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All priorities</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button variant="outline" onClick={clearFilters} className="w-full">
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Saved Matches List */}
        {!savedMatches || savedMatches.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Bookmark className="h-16 w-16 text-muted-foreground/20 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No saved matches</h3>
              <p className="text-muted-foreground max-w-md">
                Start saving promising candidate-job matches from the AI Matching dashboard to track them here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {savedMatches.map((match: any) => (
              <Card key={match.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      {/* Match Info */}
                      <div className="flex items-center gap-3">
                        {getPriorityIcon(match.priority)}
                        <div>
                          <h3 className="font-semibold text-lg">
                            Candidate #{match.candidateId} → Job #{match.jobId}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Saved {new Date(match.savedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {/* Scores */}
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="font-semibold">
                          Overall: {match.overallScore}%
                        </Badge>
                        <Badge variant="outline">
                          Technical: {match.technicalScore}%
                        </Badge>
                        <Badge variant="outline">
                          Culture: {match.cultureFitScore}%
                        </Badge>
                        <Badge variant="outline">
                          Wellbeing: {match.wellbeingScore}%
                        </Badge>
                      </div>

                      {/* Status and Tags */}
                      <div className="flex flex-wrap gap-2 items-center">
                        <Badge className={getStatusColor(match.status)}>
                          {match.status}
                        </Badge>
                        {match.tags && match.tags.length > 0 && (
                          <>
                            {match.tags.map((tag: string, idx: number) => (
                              <Badge key={idx} variant="secondary">
                                {tag}
                              </Badge>
                            ))}
                          </>
                        )}
                      </div>

                      {/* Notes */}
                      {match.notes && (
                        <div className="p-3 bg-muted rounded-md">
                          <p className="text-sm">{match.notes}</p>
                        </div>
                      )}

                      {/* Match Explanation */}
                      {match.matchExplanation && (
                        <div className="text-sm text-muted-foreground">
                          {match.matchExplanation}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditMatch(match)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnsave(match.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Saved Match</DialogTitle>
              <DialogDescription>
                Update notes, tags, status, and priority for this match
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={editStatus} onValueChange={setEditStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="saved">Saved</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="interviewing">Interviewing</SelectItem>
                    <SelectItem value="hired">Hired</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={editPriority} onValueChange={setEditPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tags (comma-separated)</Label>
                <Input
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  placeholder="e.g., urgent, top-candidate, follow-up"
                />
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Add notes about this match..."
                  rows={4}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit} disabled={updateMatch.isPending}>
                  {updateMatch.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
