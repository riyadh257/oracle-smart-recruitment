import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  ArrowLeft,
  Send,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Shield
} from "lucide-react";

const statusColors: Record<string, string> = {
  open: "bg-blue-100 text-blue-800",
  "in-progress": "bg-yellow-100 text-yellow-800",
  "waiting-customer": "bg-purple-100 text-purple-800",
  resolved: "bg-green-100 text-green-800",
  closed: "bg-gray-100 text-gray-800"
};

const priorityColors: Record<string, string> = {
  low: "bg-gray-100 text-gray-800",
  medium: "bg-blue-100 text-blue-800",
  high: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800"
};

export default function SupportTicketDetail() {
  const params = useParams();
  const ticketId = parseInt(params.id || "0");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const utils = trpc.useUtils();

  const isAdmin = user?.role === "admin";

  const [newComment, setNewComment] = useState("");
  const [statusUpdate, setStatusUpdate] = useState("");
  const [priorityUpdate, setPriorityUpdate] = useState("");

  const { data: ticket, isLoading } = trpc.support.getTicketById.useQuery({ id: ticketId });
  const { data: comments } = trpc.support.getTicketComments.useQuery({
    ticketId,
    includeInternal: isAdmin
  });

  const createCommentMutation = trpc.support.createComment.useMutation({
    onSuccess: () => {
      toast.success("Comment added successfully");
      utils.support.getTicketComments.invalidate({ ticketId });
      setNewComment("");
    },
    onError: (error) => {
      toast.error("Failed to add comment: " + error.message);
    }
  });

  const updateTicketMutation = trpc.support.updateTicket.useMutation({
    onSuccess: () => {
      toast.success("Ticket updated successfully");
      utils.support.getTicketById.invalidate({ id: ticketId });
      utils.support.getTicketsWithFilters.invalidate();
    },
    onError: (error) => {
      toast.error("Failed to update ticket: " + error.message);
    }
  });

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    createCommentMutation.mutate({
      ticketId,
      userId: user?.id,
      authorName: user?.name || "Anonymous",
      authorEmail: user?.email || undefined,
      isStaffReply: isAdmin,
      content: newComment
    });
  };

  const handleUpdateStatus = () => {
    if (!statusUpdate) return;
    updateTicketMutation.mutate({
      id: ticketId,
      data: { status: statusUpdate as any }
    });
  };

  const handleUpdatePriority = () => {
    if (!priorityUpdate) return;
    updateTicketMutation.mutate({
      id: ticketId,
      data: { priority: priorityUpdate as any }
    });
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-96" />
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="container mx-auto py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Ticket not found</h1>
        <Button onClick={() => setLocation("/support/tickets")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tickets
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={() => setLocation("/support/tickets")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <span className="font-mono text-muted-foreground">#{ticket.ticketNumber}</span>
            <h1 className="text-3xl font-bold">{ticket.subject}</h1>
          </div>
        </div>
        <Badge className={statusColors[ticket.status]}>
          {ticket.status.replace("-", " ")}
        </Badge>
        <Badge className={priorityColors[ticket.priority]}>
          {ticket.priority}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Original Ticket */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">{ticket.contactName}</p>
                    <p className="text-sm text-muted-foreground">{ticket.contactEmail}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{formatDate(ticket.createdAt)}</p>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <p className="whitespace-pre-line">{ticket.description}</p>
              </div>
            </CardContent>
          </Card>

          {/* Comments Thread */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Conversation ({comments?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {comments && comments.length > 0 ? (
                comments.map((comment) => (
                  <div
                    key={comment.id}
                    className={`border rounded-lg p-4 ${
                      comment.isStaffReply ? "bg-blue-50 dark:bg-blue-900/10 border-blue-200" : ""
                    } ${
                      comment.isInternal ? "bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-full ${
                          comment.isStaffReply ? "bg-blue-100 dark:bg-blue-900/20" : "bg-gray-100"
                        }`}>
                          {comment.isStaffReply ? (
                            <Shield className="h-4 w-4 text-blue-600" />
                          ) : (
                            <User className="h-4 w-4 text-gray-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{comment.authorName}</p>
                          {comment.isStaffReply && (
                            <Badge variant="secondary" className="text-xs">Support Team</Badge>
                          )}
                          {comment.isInternal && (
                            <Badge variant="outline" className="text-xs ml-1">Internal Note</Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</p>
                    </div>
                    <p className="text-sm whitespace-pre-line">{comment.content}</p>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No comments yet. Be the first to respond!
                </p>
              )}

              {/* Add Comment Form */}
              <form onSubmit={handleAddComment} className="border-t pt-4 mt-4">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Type your message..."
                  rows={4}
                  className="mb-3"
                />
                <div className="flex justify-end">
                  <Button type="submit" disabled={createCommentMutation.isPending || !newComment.trim()}>
                    <Send className="h-4 w-4 mr-2" />
                    {createCommentMutation.isPending ? "Sending..." : "Send Message"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Resolution (if resolved) */}
          {ticket.resolution && (
            <Card className="bg-green-50 dark:bg-green-900/10 border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
                  <CheckCircle2 className="h-5 w-5" />
                  Resolution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line">{ticket.resolution}</p>
                {ticket.resolvedAt && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Resolved on {formatDate(ticket.resolvedAt)}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ticket Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="text-muted-foreground mb-1">Status</p>
                {isAdmin ? (
                  <div className="flex gap-2">
                    <Select value={statusUpdate || ticket.status} onValueChange={setStatusUpdate}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="waiting-customer">Waiting Customer</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                    {statusUpdate && statusUpdate !== ticket.status && (
                      <Button size="sm" onClick={handleUpdateStatus}>Update</Button>
                    )}
                  </div>
                ) : (
                  <Badge className={statusColors[ticket.status]}>
                    {ticket.status.replace("-", " ")}
                  </Badge>
                )}
              </div>

              <div>
                <p className="text-muted-foreground mb-1">Priority</p>
                {isAdmin ? (
                  <div className="flex gap-2">
                    <Select value={priorityUpdate || ticket.priority} onValueChange={setPriorityUpdate}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                    {priorityUpdate && priorityUpdate !== ticket.priority && (
                      <Button size="sm" onClick={handleUpdatePriority}>Update</Button>
                    )}
                  </div>
                ) : (
                  <Badge className={priorityColors[ticket.priority]}>
                    {ticket.priority}
                  </Badge>
                )}
              </div>

              <div>
                <p className="text-muted-foreground mb-1">Category</p>
                <Badge variant="outline">{ticket.category.replace("-", " ")}</Badge>
              </div>

              <div>
                <p className="text-muted-foreground mb-1">Created</p>
                <p className="font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {formatDate(ticket.createdAt)}
                </p>
              </div>

              {ticket.firstResponseAt && (
                <div>
                  <p className="text-muted-foreground mb-1">First Response</p>
                  <p className="font-medium">{formatDate(ticket.firstResponseAt)}</p>
                </div>
              )}

              {ticket.resolvedAt && (
                <div>
                  <p className="text-muted-foreground mb-1">Resolved</p>
                  <p className="font-medium text-green-600">
                    {formatDate(ticket.resolvedAt)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground mb-1">Name</p>
                <p className="font-medium">{ticket.contactName}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Email</p>
                <p className="font-medium">{ticket.contactEmail}</p>
              </div>
            </CardContent>
          </Card>

          {isAdmin && ticket.status !== "resolved" && ticket.status !== "closed" && (
            <Card className="bg-primary text-primary-foreground">
              <CardContent className="p-4">
                <h3 className="font-bold mb-2">Quick Actions</h3>
                <div className="space-y-2">
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => {
                      updateTicketMutation.mutate({
                        id: ticketId,
                        data: { status: "resolved" }
                      });
                    }}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Mark as Resolved
                  </Button>
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => {
                      updateTicketMutation.mutate({
                        id: ticketId,
                        data: { status: "waiting-customer" }
                      });
                    }}
                  >
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Waiting for Customer
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
