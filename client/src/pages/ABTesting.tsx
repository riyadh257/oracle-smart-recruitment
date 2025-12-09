import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, BarChart3, Play, Pause, CheckCircle2, Clock, TrendingUp } from "lucide-react";
import { useLocation } from "wouter";

export default function ABTesting() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<"active" | "completed" | undefined>(undefined);

  const { data: tests, isLoading, refetch } = trpc.communication.abTesting.list.useQuery({
    status: selectedStatus,
    limit: 50,
    offset: 0,
  });

  const createTest = trpc.communication.abTesting.create.useMutation({
    onSuccess: () => {
      toast.success("A/B test created successfully");
      setIsCreateDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error("Failed to create test: " + error.message);
    },
  });

  const [formData, setFormData] = useState({
    name: "",
    emailType: "custom" as const,
    variantA: { subject: "", bodyHtml: "", bodyText: "" },
    variantB: { subject: "", bodyHtml: "", bodyText: "" },
    sampleSize: 100,
    confidenceLevel: 95,
  });

  const handleCreateTest = () => {
    if (!formData.name || !formData.variantA.subject || !formData.variantB.subject) {
      toast.error("Please fill in all required fields");
      return;
    }
    createTest.mutate(formData);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      draft: "outline",
      active: "default",
      paused: "secondary",
      completed: "secondary",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active": return <Play className="h-4 w-4 text-green-600" />;
      case "paused": return <Pause className="h-4 w-4 text-yellow-600" />;
      case "completed": return <CheckCircle2 className="h-4 w-4 text-blue-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please log in to access A/B testing</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">A/B Testing</h1>
          <p className="text-muted-foreground mt-2">Optimize your email campaigns with data-driven testing</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Create A/B Test</Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New A/B Test</DialogTitle>
              <DialogDescription>Test two email variants to see which performs better</DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="test-name">Test Name</Label>
                <Input id="test-name" placeholder="e.g., Subject Line Test" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email-type">Email Type</Label>
                <Select value={formData.emailType} onValueChange={(value: any) => setFormData({ ...formData, emailType: value })}>
                  <SelectTrigger id="email-type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="interview_invite">Interview Invite</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Tabs defaultValue="variant-a" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="variant-a">Variant A</TabsTrigger>
                  <TabsTrigger value="variant-b">Variant B</TabsTrigger>
                </TabsList>
                <TabsContent value="variant-a" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Subject Line</Label>
                    <Input placeholder="Variant A subject" value={formData.variantA.subject} onChange={(e) => setFormData({ ...formData, variantA: { ...formData.variantA, subject: e.target.value } })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Email Body (HTML)</Label>
                    <Textarea rows={8} value={formData.variantA.bodyHtml} onChange={(e) => setFormData({ ...formData, variantA: { ...formData.variantA, bodyHtml: e.target.value } })} />
                  </div>
                </TabsContent>
                <TabsContent value="variant-b" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Subject Line</Label>
                    <Input placeholder="Variant B subject" value={formData.variantB.subject} onChange={(e) => setFormData({ ...formData, variantB: { ...formData.variantB, subject: e.target.value } })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Email Body (HTML)</Label>
                    <Textarea rows={8} value={formData.variantB.bodyHtml} onChange={(e) => setFormData({ ...formData, variantB: { ...formData.variantB, bodyHtml: e.target.value } })} />
                  </div>
                </TabsContent>
              </Tabs>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateTest} disabled={createTest.isPending}>{createTest.isPending ? "Creating..." : "Create Test"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="mb-6">
        <Tabs value={selectedStatus || "all"} onValueChange={(value) => setSelectedStatus(value === "all" ? undefined : value as any)}>
          <TabsList>
            <TabsTrigger value="all">All Tests</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        </div>
      ) : tests && tests.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tests.map((test) => (
            <Card key={test.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/ab-testing/" + test.id)}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">{getStatusIcon(test.status)}{getStatusBadge(test.status)}</div>
                </div>
                <CardTitle className="mt-4">{test.name}</CardTitle>
                <CardDescription className="capitalize">{test.emailType.replace(/_/g, " ")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Sample Size:</span><span className="font-medium">{test.sampleSize}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Created:</span><span className="font-medium">{new Date(test.createdAt).toLocaleDateString()}</span></div>
                </div>
                {test.status === "completed" && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center gap-2 text-sm text-green-600"><TrendingUp className="h-4 w-4" /><span>View Results</span></div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No A/B Tests Yet</h3>
              <p className="text-muted-foreground mb-6">Create your first A/B test to start optimizing</p>
              <Button onClick={() => setIsCreateDialogOpen(true)}><Plus className="h-4 w-4 mr-2" />Create Your First Test</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
