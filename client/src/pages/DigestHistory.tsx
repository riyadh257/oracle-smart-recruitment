import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Calendar, Mail, Eye, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";

export default function DigestHistory() {
  const [selectedDigest, setSelectedDigest] = useState<number | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const { data: history, isLoading, refetch } = trpc.digestHistory.get.useQuery({ limit: 50 });
  const { data: digestDetail } = trpc.digestHistory.getById.useQuery(
    { id: selectedDigest! },
    { enabled: !!selectedDigest }
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Sent
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "bounced":
        return (
          <Badge className="bg-orange-100 text-orange-800 border-orange-200">
            <AlertCircle className="w-3 h-3 mr-1" />
            Bounced
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const handlePreview = (digestId: number) => {
    setSelectedDigest(digestId);
    setPreviewOpen(true);
  };

  if (isLoading) {
    return (
      <div className="container py-8 space-y-6">
        <div>
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Digest History</h1>
        <p className="text-muted-foreground">
          View all sent digest emails and preview their content
        </p>
      </div>

      {!history || history.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Mail className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No Digest History</h3>
            <p className="text-muted-foreground mb-4">
              You haven't received any digest emails yet. Enable digest notifications to start receiving daily summaries.
            </p>
            <Button onClick={() => window.location.href = "/digest-settings"}>
              Configure Digest Settings
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {history.map((digest) => (
            <Card key={digest.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">{digest.subject}</CardTitle>
                    <CardDescription className="space-y-2">
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(digest.createdAt).toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Mail className="w-4 h-4" />
                          {digest.notificationCount} notifications
                        </span>
                        {digest.emailProvider && (
                          <span className="text-xs text-muted-foreground">
                            via {digest.emailProvider}
                          </span>
                        )}
                      </div>
                      {digest.sentAt && (
                        <div className="text-xs text-muted-foreground">
                          Sent at {new Date(digest.sentAt).toLocaleString()}
                        </div>
                      )}
                      {digest.deliveryError && (
                        <div className="text-xs text-red-600 flex items-start gap-1">
                          <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <span>{digest.deliveryError}</span>
                        </div>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(digest.deliveryStatus)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePreview(digest.id)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Preview Content
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{digestDetail?.subject}</DialogTitle>
            <DialogDescription>
              {digestDetail && (
                <div className="flex items-center gap-4 mt-2">
                  <span>{new Date(digestDetail.createdAt).toLocaleString()}</span>
                  <span>•</span>
                  <span>{digestDetail.notificationCount} notifications</span>
                  <span>•</span>
                  {getStatusBadge(digestDetail.deliveryStatus)}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          {digestDetail ? (
            <div className="mt-4">
              <div className="border rounded-lg p-4 bg-white">
                <div
                  dangerouslySetInnerHTML={{ __html: digestDetail.htmlContent }}
                  className="prose max-w-none"
                />
              </div>

              {digestDetail.textContent && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium text-muted-foreground">
                    View Plain Text Version
                  </summary>
                  <pre className="mt-2 p-4 bg-muted rounded-lg text-xs whitespace-pre-wrap">
                    {digestDetail.textContent}
                  </pre>
                </details>
              )}
            </div>
          ) : (
            <div className="py-8 text-center">
              <Skeleton className="h-64 w-full" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
