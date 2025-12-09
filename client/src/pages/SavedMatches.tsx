import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Bookmark, TrendingUp, TrendingDown, Minus, Star, Mail, Calendar, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useLocation } from "wouter";

export default function SavedMatches() {
  const [, setLocation] = useLocation();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [editNotes, setEditNotes] = useState("");

  // Fetch saved matches
  const { data: matches, isLoading, refetch } = trpc.savedMatches.getSavedMatches.useQuery({
    status: statusFilter === "all" ? undefined : (statusFilter as any),
    priority: priorityFilter === "all" ? undefined : (priorityFilter as any),
  });

  // Fetch match trends for selected match
  const { data: trends } = trpc.savedMatches.getMatchTrends.useQuery(
    {
      candidateId: selectedMatch?.savedMatch.candidateId || 0,
      jobId: selectedMatch?.savedMatch.jobId || 0,
    },
    {
      enabled: !!selectedMatch,
    }
  );

  // Unsave match mutation
  const unsaveMutation = trpc.savedMatches.unsaveMatch.useMutation({
    onSuccess: () => {
      toast.success("Match removed from saved list");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to remove match: ${error.message}`);
    },
  });

  // Update match mutation
  const updateMutation = trpc.savedMatches.updateSavedMatch.useMutation({
    onSuccess: () => {
      toast.success("Match updated successfully");
      refetch();
      setSelectedMatch(null);
    },
    onError: (error) => {
      toast.error(`Failed to update match: ${error.message}`);
    },
  });

  const handleUnsave = (matchId: number) => {
    if (confirm("Are you sure you want to remove this saved match?")) {
      unsaveMutation.mutate({ savedMatchId: matchId });
    }
  };

  const handleUpdateNotes = () => {
    if (!selectedMatch) return;
    
    updateMutation.mutate({
      savedMatchId: selectedMatch.savedMatch.id,
      notes: editNotes,
    });
  };

  const handleUpdateStatus = (matchId: number, status: string) => {
    updateMutation.mutate({
      savedMatchId: matchId,
      status: status as any,
    });
  };

  const handleUpdatePriority = (matchId: number, priority: string) => {
    updateMutation.mutate({
      savedMatchId: matchId,
      priority: priority as any,
    });
  };

  const getScoreColor = (score: number | null | undefined) => {
    if (!score) return "text-gray-400";
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "saved":
        return "secondary";
      case "contacted":
        return "default";
      case "interviewing":
        return "default";
      case "archived":
        return "outline";
      default:
        return "outline";
    }
  };

  const formatTrendData = () => {
    if (!trends?.trends) return [];
    
    return trends.trends.map((t) => ({
      date: new Date(t.timestamp).toLocaleDateString(),
      overall: t.overallScore,
      skill: t.skillScore || 0,
      culture: t.cultureScore || 0,
      wellbeing: t.wellbeingScore || 0,
    }));
  };

  return (
    <DashboardLayout>
      <div className="container max-w-7xl py-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Bookmark className="h-8 w-8 text-primary" />
            Saved Matches
          </h1>
          <p className="text-muted-foreground mt-2">
            Track your bookmarked candidate-job matches and monitor score changes over time.
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Filter saved matches by status and priority</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="saved">Saved</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="interviewing">Interviewing</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Saved Matches List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-4">Loading saved matches...</p>
          </div>
        ) : matches && matches.length > 0 ? (
          <div className="grid gap-4">
            {matches.map((match) => (
              <Card key={match.savedMatch.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      {/* Candidate and Job Info */}
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold">
                            {match.candidate?.fullName || "Unknown Candidate"}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {match.job?.title || "Unknown Position"}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant={getPriorityColor(match.savedMatch.priority)}>
                            {match.savedMatch.priority}
                          </Badge>
                          <Badge variant={getStatusColor(match.savedMatch.status)}>
                            {match.savedMatch.status}
                          </Badge>
                        </div>
                      </div>

                      {/* Match Scores */}
                      {match.application && (
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Overall:</span>
                            <span className={`font-semibold ${getScoreColor(match.application.overallMatchScore)}`}>
                              {match.application.overallMatchScore || "N/A"}%
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Skills:</span>
                            <span className={`font-semibold ${getScoreColor(match.application.skillMatchScore)}`}>
                              {match.application.skillMatchScore || "N/A"}%
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Culture:</span>
                            <span className={`font-semibold ${getScoreColor(match.application.cultureFitScore)}`}>
                              {match.application.cultureFitScore || "N/A"}%
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Notes */}
                      {match.savedMatch.notes && (
                        <p className="text-sm text-muted-foreground italic">
                          "{match.savedMatch.notes}"
                        </p>
                      )}

                      {/* Saved Date */}
                      <p className="text-xs text-muted-foreground">
                        Saved on {new Date(match.savedMatch.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setLocation(`/candidates/${match.candidate?.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedMatch(match);
                              setEditNotes(match.savedMatch.notes || "");
                            }}
                          >
                            <TrendingUp className="h-4 w-4 mr-2" />
                            History
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Match History & Trends</DialogTitle>
                            <DialogDescription>
                              Track how the match score has changed over time
                            </DialogDescription>
                          </DialogHeader>

                          {trends?.hasHistory ? (
                            <div className="space-y-6">
                              {/* Score Trend Chart */}
                              <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                  <LineChart data={formatTrendData()}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis domain={[0, 100]} />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="overall" stroke="#3b82f6" name="Overall" />
                                    <Line type="monotone" dataKey="skill" stroke="#10b981" name="Skills" />
                                    <Line type="monotone" dataKey="culture" stroke="#f59e0b" name="Culture" />
                                    <Line type="monotone" dataKey="wellbeing" stroke="#8b5cf6" name="Wellbeing" />
                                  </LineChart>
                                </ResponsiveContainer>
                              </div>

                              {/* History Timeline */}
                              <div className="space-y-3">
                                <h4 className="font-semibold">Score Change History</h4>
                                {trends.trends.map((trend, index) => (
                                  <div key={index} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                                    <div className="mt-1">
                                      {trend.change > 0 ? (
                                        <TrendingUp className="h-5 w-5 text-green-600" />
                                      ) : trend.change < 0 ? (
                                        <TrendingDown className="h-5 w-5 text-red-600" />
                                      ) : (
                                        <Minus className="h-5 w-5 text-gray-400" />
                                      )}
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-center justify-between">
                                        <span className="font-medium">{trend.overallScore}%</span>
                                        <span className="text-sm text-muted-foreground">
                                          {new Date(trend.timestamp).toLocaleString()}
                                        </span>
                                      </div>
                                      {trend.changeReason && (
                                        <p className="text-sm text-muted-foreground mt-1">
                                          {trend.changeReason}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Edit Notes */}
                              <div className="space-y-3">
                                <Label>Notes</Label>
                                <Textarea
                                  value={editNotes}
                                  onChange={(e) => setEditNotes(e.target.value)}
                                  placeholder="Add notes about this match..."
                                  rows={3}
                                />
                                <Button onClick={handleUpdateNotes}>
                                  Save Notes
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-8">
                              <p className="text-muted-foreground">No history available for this match yet.</p>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUnsave(match.savedMatch.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Bookmark className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Saved Matches</h3>
                <p className="text-muted-foreground mb-4">
                  You haven't saved any candidate-job matches yet.
                </p>
                <Button onClick={() => setLocation("/ai-matching")}>
                  Browse Matches
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
