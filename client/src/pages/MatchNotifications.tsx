import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Bell, Check, Eye, Mail, Calendar, X } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

/**
 * Match Notifications Page
 * Displays real-time high-quality match notifications (≥90 score)
 */
export default function MatchNotifications() {
  const [, navigate] = useLocation();
  const [selectedAction, setSelectedAction] = useState<string | null>(null);

  // Fetch unacknowledged notifications
  const { data: notifications, isLoading, refetch } = trpc.matching.notifications.getUnacknowledged.useQuery();
  
  // Fetch notification stats
  const { data: stats } = trpc.matching.notifications.getStats.useQuery();

  // Acknowledge notification mutation
  const acknowledgeMutation = trpc.matching.notifications.acknowledge.useMutation({
    onSuccess: () => {
      toast.success("Notification acknowledged");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to acknowledge: ${error.message}`);
    },
  });

  const handleAcknowledge = (notificationId: number, action: 'viewed' | 'contacted' | 'scheduled' | 'dismissed') => {
    setSelectedAction(`${notificationId}-${action}`);
    acknowledgeMutation.mutate({
      notificationEventId: notificationId,
      action,
    });
  };

  const handleViewCandidate = (candidateId: number, notificationId: number) => {
    handleAcknowledge(notificationId, 'viewed');
    navigate(`/candidates/${candidateId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Match Notifications</h1>
        <p className="text-muted-foreground mt-2">
          Real-time alerts for high-quality candidate matches (≥90% score)
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Unacknowledged</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.unacknowledged}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Actions Taken</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-sm">
                {Object.entries(stats.byAction).map(([action, count]) => (
                  <div key={action} className="flex justify-between">
                    <span className="capitalize">{action}:</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Unacknowledged Notifications
          </CardTitle>
          <CardDescription>
            {notifications?.length || 0} high-quality matches awaiting your action
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!notifications || notifications.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No unacknowledged notifications</p>
              <p className="text-sm mt-2">You're all caught up!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification: any) => (
                <Card key={notification.id} className="border-l-4 border-l-primary">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        {/* Match Score Badge */}
                        <div className="flex items-center gap-2">
                          <Badge variant="default" className="text-lg px-3 py-1">
                            {notification.matchScore}% Match
                          </Badge>
                          <Badge variant="outline" className="capitalize">
                            {notification.matchType.replace(/_/g, ' ')}
                          </Badge>
                        </div>

                        {/* Candidate & Job Info */}
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">
                            Candidate ID: {notification.candidateId} • Job ID: {notification.jobId}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Notified: {new Date(notification.createdAt).toLocaleString()}
                          </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleViewCandidate(notification.candidateId, notification.id)}
                            disabled={acknowledgeMutation.isPending && selectedAction === `${notification.id}-viewed`}
                          >
                            {acknowledgeMutation.isPending && selectedAction === `${notification.id}-viewed` ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <Eye className="h-4 w-4 mr-2" />
                            )}
                            View Candidate
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAcknowledge(notification.id, 'contacted')}
                            disabled={acknowledgeMutation.isPending && selectedAction === `${notification.id}-contacted`}
                          >
                            {acknowledgeMutation.isPending && selectedAction === `${notification.id}-contacted` ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <Mail className="h-4 w-4 mr-2" />
                            )}
                            Mark as Contacted
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAcknowledge(notification.id, 'scheduled')}
                            disabled={acknowledgeMutation.isPending && selectedAction === `${notification.id}-scheduled`}
                          >
                            {acknowledgeMutation.isPending && selectedAction === `${notification.id}-scheduled` ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <Calendar className="h-4 w-4 mr-2" />
                            )}
                            Interview Scheduled
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleAcknowledge(notification.id, 'dismissed')}
                            disabled={acknowledgeMutation.isPending && selectedAction === `${notification.id}-dismissed`}
                          >
                            {acknowledgeMutation.isPending && selectedAction === `${notification.id}-dismissed` ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <X className="h-4 w-4 mr-2" />
                            )}
                            Dismiss
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
