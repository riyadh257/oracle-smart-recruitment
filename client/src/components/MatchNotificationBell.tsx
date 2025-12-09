import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, Check, Eye, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "wouter";

export function MatchNotificationBell() {
  const [, navigate] = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch recent match notifications
  const { data: notifications, refetch } = trpc.matchNotifications.getRecentMatchNotifications.useQuery({
    limit: 20,
    unreadOnly: false,
  });

  // Subscribe to real-time match notifications
  trpc.matchNotifications.subscribeToMatches.useSubscription(undefined, {
    onData: (data) => {
      toast.success(`New High-Score Match: ${data.candidateName}`, {
        description: `${data.overallScore}% match for ${data.jobTitle}`,
        action: {
          label: "View",
          onClick: () => navigate("/employer-match-dashboard"),
        },
      });
      refetch();
      setUnreadCount((prev) => prev + 1);
    },
  });

  // Calculate unread count
  useEffect(() => {
    if (notifications) {
      const unread = notifications.filter((n) => !n.isRead).length;
      setUnreadCount(unread);
    }
  }, [notifications]);

  // Mark notification as read mutation
  const markAsReadMutation = trpc.matchNotifications.markNotificationAsRead.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const handleNotificationClick = (notificationId: number, metadata: any) => {
    markAsReadMutation.mutate({ notificationId });
    if (metadata?.matchId) {
      navigate("/employer-match-dashboard");
    }
  };

  const handleMarkAllAsRead = () => {
    notifications?.forEach((notification) => {
      if (!notification.isRead) {
        markAsReadMutation.mutate({ notificationId: notification.id });
      }
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-600" />
            Match Notifications
          </span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="h-6 text-xs"
            >
              <Check className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-96">
          {!notifications || notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No match notifications yet
            </div>
          ) : (
            notifications.map((notification) => {
              const metadata = notification.metadata
                ? JSON.parse(notification.metadata as string)
                : {};
              return (
                <DropdownMenuItem
                  key={notification.id}
                  className={`flex flex-col items-start p-3 cursor-pointer ${
                    !notification.isRead ? "bg-blue-50" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification.id, metadata)}
                >
                  <div className="flex items-start justify-between w-full">
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{notification.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                      {metadata.overallScore && (
                        <Badge variant="default" className="mt-2 text-xs">
                          {metadata.overallScore}% Match
                        </Badge>
                      )}
                    </div>
                    {!notification.isRead && (
                      <div className="h-2 w-2 bg-blue-600 rounded-full ml-2 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                </DropdownMenuItem>
              );
            })
          )}
        </ScrollArea>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="justify-center text-blue-600 cursor-pointer"
          onClick={() => navigate("/notification-settings")}
        >
          Notification Settings
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
