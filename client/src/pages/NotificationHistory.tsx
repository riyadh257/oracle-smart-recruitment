import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { trpc } from "@/lib/trpc";
import { Bell, Calendar, CheckCircle, Filter, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function NotificationHistory() {
  const { user, loading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [limit, setLimit] = useState(50);

  const { data: notifications, isLoading, refetch } = trpc.notificationHistory.list.useQuery({
    type: typeFilter === "all" ? undefined : typeFilter,
    limit,
  });

  const markAsRead = trpc.notificationHistory.markAsRead.useMutation({
    onSuccess: () => {
      toast.success("Notification marked as read");
      refetch();
    },
  });

  if (loading || !user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "feedback_submitted":
        return "default";
      case "interview_scheduled":
        return "secondary";
      case "candidate_status_change":
        return "outline";
      default:
        return "secondary";
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      feedback_submitted: "Feedback Submitted",
      interview_scheduled: "Interview Scheduled",
      candidate_status_change: "Status Change",
      status_change: "Status Change",
      interview_reminder: "Interview Reminder",
      message: "Message",
      general: "General",
    };
    return labels[type] || type;
  };

  const filteredNotifications = notifications?.filter((notification: any) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      notification.title.toLowerCase().includes(query) ||
      notification.body.toLowerCase().includes(query)
    );
  });

  const unreadCount = notifications?.filter((n: any) => !n.readAt).length || 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Notification History</h1>
            <p className="text-muted-foreground mt-2">
              Review all notifications you've received about candidates and interviews
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {unreadCount} unread
            </span>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search notifications..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="type">Notification Type</Label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="feedback_submitted">Feedback Submitted</SelectItem>
                    <SelectItem value="interview_scheduled">Interview Scheduled</SelectItem>
                    <SelectItem value="candidate_status_change">Status Change</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="limit">Show</Label>
                <Select value={limit.toString()} onValueChange={(v) => setLimit(parseInt(v))}>
                  <SelectTrigger id="limit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">Last 25</SelectItem>
                    <SelectItem value="50">Last 50</SelectItem>
                    <SelectItem value="100">Last 100</SelectItem>
                    <SelectItem value="200">Last 200</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications List */}
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[200px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading notifications...</p>
            </div>
          </div>
        ) : filteredNotifications && filteredNotifications.length > 0 ? (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => (
              <Card
                key={notification.id}
                className={`transition-all ${
                  notification.readAt
                    ? "bg-background"
                    : "bg-accent/30 border-l-4 border-l-primary"
                }`}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        {!notification.readAt && (
                          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                        )}
                        <Badge variant={getTypeColor(notification.type)}>
                          {getTypeLabel(notification.type)}
                        </Badge>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {new Date(notification.sentAt).toLocaleDateString()} at{" "}
                            {new Date(notification.sentAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        {notification.includedInDigest && notification.digestSentAt && (
                          <Badge variant="outline" className="text-xs">
                            Sent in digest
                          </Badge>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{notification.title}</h3>
                        <p className="text-muted-foreground mt-1">{notification.body}</p>
                      </div>
                      {notification.data && (
                        <details className="text-sm">
                          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                            View details
                          </summary>
                          <pre className="mt-2 p-3 bg-muted rounded text-xs overflow-x-auto">
                            {JSON.stringify(JSON.parse(notification.data), null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      {!notification.readAt && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => markAsRead.mutate({ id: notification.id })}
                          disabled={markAsRead.isPending}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Mark as read
                        </Button>
                      )}
                      {notification.readAt && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Read
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No notifications found</h3>
                <p className="text-muted-foreground">
                  {searchQuery || typeFilter !== "all"
                    ? "Try adjusting your filters"
                    : "You haven't received any notifications yet"}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
