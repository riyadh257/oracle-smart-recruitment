import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Plus, Copy, Eye, Trash2, Link2, Lock } from "lucide-react";
import { toast } from "sonner";

export default function PresentationShare() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newShare, setNewShare] = useState({
    password: "",
    enablePassword: false,
    enableExpiration: false,
    expiresAt: "",
    enableMaxViews: false,
    maxViews: 100,
  });

  const presentationId = parseInt(id || "0");
  const { data: presentation, isLoading: loadingPresentation } = trpc.presentation.getById.useQuery(
    { id: presentationId },
    { enabled: !!presentationId }
  );

  const { data: shareLinks, isLoading: loadingLinks, refetch } = trpc.presentation.listShareLinks.useQuery(
    { presentationId },
    { enabled: !!presentationId }
  );

  const createShareMutation = trpc.presentation.createShareLink.useMutation({
    onSuccess: (data) => {
      toast.success("Share link created successfully");
      const shareUrl = `${window.location.origin}/shared/${data.shareToken}`;
      navigator.clipboard.writeText(shareUrl);
      toast.info("Link copied to clipboard");
      setIsCreateDialogOpen(false);
      setNewShare({
        password: "",
        enablePassword: false,
        enableExpiration: false,
        expiresAt: "",
        enableMaxViews: false,
        maxViews: 100,
      });
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to create share link: ${error.message}`);
    },
  });

  const deleteShareMutation = trpc.presentation.deleteShareLink.useMutation({
    onSuccess: () => {
      toast.success("Share link deleted successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to delete share link: ${error.message}`);
    },
  });

  const handleCreateShare = () => {
    const shareData: {
      presentationId: number;
      password?: string;
      expiresAt?: Date;
      maxViews?: number;
    } = {
      presentationId,
    };

    if (newShare.enablePassword && newShare.password) {
      shareData.password = newShare.password;
    }

    if (newShare.enableExpiration && newShare.expiresAt) {
      shareData.expiresAt = new Date(newShare.expiresAt);
    }

    if (newShare.enableMaxViews && newShare.maxViews) {
      shareData.maxViews = newShare.maxViews;
    }

    createShareMutation.mutate(shareData);
  };

  const handleCopyLink = (token: string) => {
    const shareUrl = `${window.location.origin}/shared/${token}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success("Link copied to clipboard");
  };

  const handleDeleteShare = (linkId: number) => {
    if (confirm("Are you sure you want to delete this share link?")) {
      deleteShareMutation.mutate({ id: linkId });
    }
  };

  const isLoading = loadingPresentation || loadingLinks;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!presentation) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Presentation not found</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setLocation("/presentations")}
            >
              Back to Presentations
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => setLocation("/presentations")}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Presentations
      </Button>

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">{presentation.title}</h1>
          <p className="text-muted-foreground mt-2">Manage shareable links</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Share Link
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Shareable Link</DialogTitle>
              <DialogDescription>
                Generate a link to share this presentation with external stakeholders
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Password Protection</Label>
                  <p className="text-sm text-muted-foreground">
                    Require a password to view the presentation
                  </p>
                </div>
                <Switch
                  checked={newShare.enablePassword}
                  onCheckedChange={(checked) =>
                    setNewShare({ ...newShare, enablePassword: checked })
                  }
                />
              </div>
              {newShare.enablePassword && (
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newShare.password}
                    onChange={(e) =>
                      setNewShare({ ...newShare, password: e.target.value })
                    }
                    placeholder="Enter password"
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Expiration Date</Label>
                  <p className="text-sm text-muted-foreground">
                    Set when this link should expire
                  </p>
                </div>
                <Switch
                  checked={newShare.enableExpiration}
                  onCheckedChange={(checked) =>
                    setNewShare({ ...newShare, enableExpiration: checked })
                  }
                />
              </div>
              {newShare.enableExpiration && (
                <div className="space-y-2">
                  <Label htmlFor="expiresAt">Expires At</Label>
                  <Input
                    id="expiresAt"
                    type="datetime-local"
                    value={newShare.expiresAt}
                    onChange={(e) =>
                      setNewShare({ ...newShare, expiresAt: e.target.value })
                    }
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>View Limit</Label>
                  <p className="text-sm text-muted-foreground">
                    Limit the number of times this link can be viewed
                  </p>
                </div>
                <Switch
                  checked={newShare.enableMaxViews}
                  onCheckedChange={(checked) =>
                    setNewShare({ ...newShare, enableMaxViews: checked })
                  }
                />
              </div>
              {newShare.enableMaxViews && (
                <div className="space-y-2">
                  <Label htmlFor="maxViews">Maximum Views</Label>
                  <Input
                    id="maxViews"
                    type="number"
                    value={newShare.maxViews}
                    onChange={(e) =>
                      setNewShare({ ...newShare, maxViews: parseInt(e.target.value) })
                    }
                    min={1}
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateShare}
                disabled={createShareMutation.isPending}
              >
                {createShareMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Create Link
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {shareLinks && shareLinks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Link2 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No share links created yet</p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Share Link
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {shareLinks?.map((link) => (
            <Card key={link.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Link2 className="h-4 w-4" />
                      Share Link
                      {link.password && <Lock className="h-3 w-3 text-muted-foreground" />}
                    </CardTitle>
                    <CardDescription className="mt-2 font-mono text-xs break-all">
                      {window.location.origin}/shared/{link.shareToken}
                    </CardDescription>
                  </div>
                  <Badge variant={link.isActive ? "default" : "secondary"}>
                    {link.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    <span>{link.viewCount} views</span>
                  </div>
                  {link.maxViews && (
                    <div>Max: {link.maxViews} views</div>
                  )}
                  {link.expiresAt && (
                    <div>
                      Expires: {new Date(link.expiresAt).toLocaleDateString()}
                    </div>
                  )}
                  {link.password && (
                    <div className="flex items-center gap-1">
                      <Lock className="h-4 w-4" />
                      <span>Password protected</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopyLink(link.shareToken)}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copy Link
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteShare(link.id)}
                    disabled={deleteShareMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
                <div className="mt-3 text-xs text-muted-foreground">
                  Created {new Date(link.createdAt).toLocaleDateString()}
                  {link.lastAccessedAt && (
                    <> • Last accessed {new Date(link.lastAccessedAt).toLocaleDateString()}</>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
