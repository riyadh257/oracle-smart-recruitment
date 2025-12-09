import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Eye, Share2, Download, BarChart3, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function Presentations() {
  const [, setLocation] = useLocation();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newPresentation, setNewPresentation] = useState({
    title: "",
    description: "",
    slidesPath: "",
    slidesVersion: "",
    status: "draft" as "draft" | "published" | "archived",
  });

  const { data: presentations, isLoading, refetch } = trpc.presentation.list.useQuery();
  const createMutation = trpc.presentation.create.useMutation({
    onSuccess: () => {
      toast.success("Presentation created successfully");
      setIsCreateDialogOpen(false);
      setNewPresentation({
        title: "",
        description: "",
        slidesPath: "",
        slidesVersion: "",
        status: "draft",
      });
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to create presentation: ${error.message}`);
    },
  });

  const deleteMutation = trpc.presentation.delete.useMutation({
    onSuccess: () => {
      toast.success("Presentation deleted successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to delete presentation: ${error.message}`);
    },
  });

  const handleCreate = () => {
    if (!newPresentation.title || !newPresentation.slidesPath) {
      toast.error("Please fill in all required fields");
      return;
    }
    createMutation.mutate(newPresentation);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this presentation?")) {
      deleteMutation.mutate({ id });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-500";
      case "draft":
        return "bg-yellow-500";
      case "archived":
        return "bg-gray-500";
      default:
        return "bg-blue-500";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Presentations</h1>
          <p className="text-muted-foreground mt-2">
            Manage your recruitment presentations, analytics, and sharing
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Presentation
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Presentation</DialogTitle>
              <DialogDescription>
                Add a new presentation to track analytics and create shareable links
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={newPresentation.title}
                  onChange={(e) =>
                    setNewPresentation({ ...newPresentation, title: e.target.value })
                  }
                  placeholder="Q4 Recruitment Strategy"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newPresentation.description}
                  onChange={(e) =>
                    setNewPresentation({ ...newPresentation, description: e.target.value })
                  }
                  placeholder="Overview of our Q4 recruitment initiatives..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slidesPath">Slides Path *</Label>
                <Input
                  id="slidesPath"
                  value={newPresentation.slidesPath}
                  onChange={(e) =>
                    setNewPresentation({ ...newPresentation, slidesPath: e.target.value })
                  }
                  placeholder="/home/ubuntu/oracle-smart-recruitment/presentation/slides"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slidesVersion">Slides Version ID</Label>
                <Input
                  id="slidesVersion"
                  value={newPresentation.slidesVersion}
                  onChange={(e) =>
                    setNewPresentation({ ...newPresentation, slidesVersion: e.target.value })
                  }
                  placeholder="Optional version identifier"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={newPresentation.status}
                  onValueChange={(value: "draft" | "published" | "archived") =>
                    setNewPresentation({ ...newPresentation, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Create Presentation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {presentations && presentations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">No presentations yet</p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Presentation
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {presentations?.map((presentation) => (
            <Card key={presentation.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{presentation.title}</CardTitle>
                    <CardDescription className="mt-2 line-clamp-2">
                      {presentation.description || "No description"}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(presentation.status)}>
                    {presentation.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setLocation(`/presentations/${presentation.id}`)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setLocation(`/presentations/${presentation.id}/analytics`)}
                  >
                    <BarChart3 className="h-4 w-4 mr-1" />
                    Analytics
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setLocation(`/presentations/${presentation.id}/share`)}
                  >
                    <Share2 className="h-4 w-4 mr-1" />
                    Share
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setLocation(`/presentations/${presentation.id}/export`)}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Export
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(presentation.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
                <div className="mt-4 text-xs text-muted-foreground">
                  Created {new Date(presentation.createdAt).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
