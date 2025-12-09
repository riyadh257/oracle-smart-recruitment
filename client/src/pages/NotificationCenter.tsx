import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bell,
  BellOff,
  CheckCheck,
  Trash2,
  ExternalLink,
  AlertCircle,
  Info,
  AlertTriangle,
  Zap,
  Filter,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useLocation } from "wouter";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type NotificationType =
  | "interview_reminder"
  | "feedback_request"
  | "candidate_response"
  | "engagement_alert"
  | "ab_test_result"
  | "system_update"
  | "general";

type NotificationPriority = "low" | "medium" | "high" | "urgent";

export default function NotificationCenter() {
  const [, setLocation] = useLocation();
  const [filterType, setFilterType] = useState<NotificationType | "all">("all");
  const [filterUnread, setFilterUnread] = useState(false);

  const { data, isLoading, refetch } = trpc.pushNotifications.getNotificationHistory.useQuery({
    limit: 50,
    offset: 0,
    unreadOnly: filterUnread,
  });

  const { data: unreadCount } = trpc.pushNotifications.getUnreadCount.useQuery();

  const markAsReadMutation = trpc.pushNotifications.markAsRead.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Notification marked as read");
    },
  });

  const markAllAsReadMutation = trpc.pushNotifications.markAllAsRead.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("All notifications marked as read");
    },
  });

  const deleteNotificationMutation = trpc.pushNotifications.deleteNotification.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Notification deleted");
    },
  });

  const handleMarkAsRead = (notificationId: number) => {
    markAsReadMutation.mutate({ notificationId });
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const handleDelete = (notificationId: number) => {
    deleteNotificationMutation.mutate({ notificationId });
  };

  const handleNotificationClick = (notification: any) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }
    if (notification.actionUrl) {
      setLocation(notification.actionUrl);
    }
  };

  const getNotificationIcon = (type: NotificationType, priority: NotificationPriority) => {
    if (priority === "urgent") return <Zap className="h-5 w-5 text-red-500" />;
    if (priority === "high") return <AlertTriangle className="h-5 w-5 text-orange-500" />;

    switch (type) {
      case "interview_reminder":
        return <Bell className="h-5 w-5 text-blue-500" />;
      case "feedback_request":
        return <AlertCircle className="h-5 w-5 text-purple-500" />;
      case "candidate_response":
        return <Info className="h-5 w-5 text-green-500" />;
      case "engagement_alert":
        return <Zap className="h-5 w-5 text-yellow-500" />;
      case "ab_test_result":
        return <Info className="h-5 w-5 text-cyan-500" />;
      case "system_update":
        return <Info className="h-5 w-5 text-gray-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getPriorityBadgeVariant = (priority: NotificationPriority) => {
    switch (priority) {
      case "urgent":
        return "destructive";
      case "high":
        return "default";
      case "medium":
        return "secondary";
      case "low":
        return "outline";
      default:
        return "outline";
    }
  };

  const filteredNotifications = data?.notifications.filter((n) => {
    if (filterType !== "all" && n.type !== filterType) return false;
    return true;
  });

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notification Center</h1>
          <p className="text-muted-foreground mt-2">
            Manage your notifications and stay updated
          </p>
        </div>
        {unreadCount && unreadCount.count > 0 && (
          <Badge variant="default" className="text-base px-3 py-1">
            {unreadCount.count} unread
          </Badge>
        )}
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select
                  value={filterType}
                  onValueChange={(value) => setFilterType(value as NotificationType | "all")}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="interview_reminder">Interview Reminders</SelectItem>
                    <SelectItem value="feedback_request">Feedback Requests</SelectItem>
                    <SelectItem value="candidate_response">Candidate Responses</SelectItem>
                    <SelectItem value="engagement_alert">Engagement Alerts</SelectItem>
                    <SelectItem value="ab_test_result">A/B Test Results</SelectItem>
                    <SelectItem value="system_update">System Updates</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant={filterUnread ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterUnread(!filterUnread)}
              >
                {filterUnread ? <Bell className="h-4 w-4 mr-2" /> : <BellOff className="h-4 w-4 mr-2" />}
                {filterUnread ? "Unread Only" : "Show All"}
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={!unreadCount || unreadCount.count === 0}
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark All as Read
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Notifications List */}
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : filteredNotifications && filteredNotifications.length > 0 ? (
          filteredNotifications.map((notification) => (
            <Card
              key={notification.id}
              className={`transition-all hover:shadow-md ${
                !notification.isRead ? "border-l-4 border-l-primary bg-primary/5" : ""
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="shrink-0 mt-1">
                    {getNotificationIcon(notification.type, notification.priority)}
                  </div>

                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3
                            className={`font-semibold ${
                              !notification.isRead ? "text-foreground" : "text-muted-foreground"
                            }`}
                          >
                            {notification.title}
                          </h3>
                          <Badge variant={getPriorityBadgeVariant(notification.priority)}>
                            {notification.priority}
                          </Badge>
                          {!notification.isRead && (
                            <Badge variant="default" className="text-xs">
                              New
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {notification.actionUrl && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleNotificationClick(notification)}
                            title="Open"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                        {!notification.isRead && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleMarkAsRead(notification.id)}
                            title="Mark as read"
                          >
                            <CheckCheck className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(notification.id)}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                      {notification.deliveryMethod && (
                        <Badge variant="outline" className="text-xs">
                          {notification.deliveryMethod}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <BellOff className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No notifications</h3>
              <p className="text-sm text-muted-foreground">
                {filterUnread
                  ? "You're all caught up! No unread notifications."
                  : "You don't have any notifications yet."}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Load More */}
      {data && data.hasMore && (
        <div className="text-center">
          <Button variant="outline" onClick={() => refetch()}>
            Load More
          </Button>
        </div>
      )}
    </div>
  );
}
