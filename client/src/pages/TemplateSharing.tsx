import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Share2, Check, X, Clock, Eye, Edit, FileCheck, Loader2, Users } from "lucide-react";
import { toast } from "sonner";

export default function TemplateSharing() {
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [shareUserId, setShareUserId] = useState("");
  const [sharePermission, setSharePermission] = useState<"view" | "edit" | "use">("view");
  const [shareMessage, setShareMessage] = useState("");

  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [approvalTemplateId, setApprovalTemplateId] = useState<number | null>(null);
  const [approvalMessage, setApprovalMessage] = useState("");
  const [approverId, setApproverId] = useState("");

  const utils = trpc.useUtils();

  // Queries
  const { data: sharedWithMe, isLoading: loadingShared } = trpc.templateSharing.getSharedWithMe.useQuery();
  const { data: myTemplates, isLoading: loadingTemplates } = trpc.templateGallery.list.useQuery({});
  const { data: approvalRequests, isLoading: loadingApprovals } = trpc.templateSharing.getApprovalRequests.useQuery({ status: "pending" });
  const { data: myApprovalRequests, isLoading: loadingMyRequests } = trpc.templateSharing.getMyApprovalRequests.useQuery();

  // Mutations
  const shareTemplate = trpc.templateSharing.shareTemplate.useMutation({
    onSuccess: () => {
      toast.success("Template shared successfully");
      setShareDialogOpen(false);
      setShareUserId("");
      setShareMessage("");
      utils.templateSharing.getSharedWithMe.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to share template: ${error.message}`);
    },
  });

  const requestApproval = trpc.templateSharing.requestApproval.useMutation({
    onSuccess: () => {
      toast.success("Approval request sent");
      setApprovalDialogOpen(false);
      setApprovalMessage("");
      setApproverId("");
      utils.templateSharing.getMyApprovalRequests.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to request approval: ${error.message}`);
    },
  });

  const respondToApproval = trpc.templateSharing.respondToApproval.useMutation({
    onSuccess: () => {
      toast.success("Response submitted");
      utils.templateSharing.getApprovalRequests.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to respond: ${error.message}`);
    },
  });

  const revokeSharing = trpc.templateSharing.revokeSharing.useMutation({
    onSuccess: () => {
      toast.success("Sharing revoked");
      utils.templateSharing.getSharedWithMe.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to revoke sharing: ${error.message}`);
    },
  });

  const handleShare = () => {
    if (!selectedTemplateId || !shareUserId) {
      toast.error("Please select a template and enter user ID");
      return;
    }

    shareTemplate.mutate({
      templateId: selectedTemplateId,
      sharedWith: parseInt(shareUserId),
      permission: sharePermission,
      message: shareMessage || undefined,
    });
  };

  const handleRequestApproval = () => {
    if (!approvalTemplateId || !approverId) {
      toast.error("Please select a template and enter approver ID");
      return;
    }

    requestApproval.mutate({
      templateId: approvalTemplateId,
      approverId: parseInt(approverId),
      requestMessage: approvalMessage || undefined,
    });
  };

  const handleApprove = (approvalId: number) => {
    respondToApproval.mutate({
      approvalId,
      status: "approved",
    });
  };

  const handleReject = (approvalId: number, message?: string) => {
    respondToApproval.mutate({
      approvalId,
      status: "rejected",
      responseMessage: message,
    });
  };

  const getPermissionIcon = (permission: string) => {
    switch (permission) {
      case "view":
        return <Eye className="h-4 w-4" />;
      case "edit":
        return <Edit className="h-4 w-4" />;
      case "use":
        return <FileCheck className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      approved: "default",
      rejected: "destructive",
      active: "default",
      revoked: "outline",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Template Sharing & Approvals</h1>
          <p className="text-muted-foreground mt-2">
            Collaborate on email templates with your team
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Share2 className="mr-2 h-4 w-4" />
                Share Template
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Share Template</DialogTitle>
                <DialogDescription>
                  Share an email template with a team member
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="template">Template</Label>
                  <Select
                    value={selectedTemplateId?.toString()}
                    onValueChange={(value) => setSelectedTemplateId(parseInt(value))}
                  >
                    <SelectTrigger id="template">
                      <SelectValue placeholder="Select template" />
                    </SelectTrigger>
                    <SelectContent>
                      {myTemplates?.map((template) => (
                        <SelectItem key={template.id} value={template.id.toString()}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="userId">User ID</Label>
                  <Input
                    id="userId"
                    type="number"
                    placeholder="Enter user ID"
                    value={shareUserId}
                    onChange={(e) => setShareUserId(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="permission">Permission</Label>
                  <Select value={sharePermission} onValueChange={(value: any) => setSharePermission(value)}>
                    <SelectTrigger id="permission">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="view">View Only</SelectItem>
                      <SelectItem value="edit">Can Edit</SelectItem>
                      <SelectItem value="use">Can Use</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message (Optional)</Label>
                  <Textarea
                    id="message"
                    placeholder="Add a message..."
                    value={shareMessage}
                    onChange={(e) => setShareMessage(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShareDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleShare} disabled={shareTemplate.isPending}>
                  {shareTemplate.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Share
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <FileCheck className="mr-2 h-4 w-4" />
                Request Approval
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Request Template Approval</DialogTitle>
                <DialogDescription>
                  Request approval to deploy a template
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="approvalTemplate">Template</Label>
                  <Select
                    value={approvalTemplateId?.toString()}
                    onValueChange={(value) => setApprovalTemplateId(parseInt(value))}
                  >
                    <SelectTrigger id="approvalTemplate">
                      <SelectValue placeholder="Select template" />
                    </SelectTrigger>
                    <SelectContent>
                      {myTemplates?.map((template) => (
                        <SelectItem key={template.id} value={template.id.toString()}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="approverId">Approver User ID</Label>
                  <Input
                    id="approverId"
                    type="number"
                    placeholder="Enter approver user ID"
                    value={approverId}
                    onChange={(e) => setApproverId(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="approvalMessage">Request Message</Label>
                  <Textarea
                    id="approvalMessage"
                    placeholder="Explain why you need approval..."
                    value={approvalMessage}
                    onChange={(e) => setApprovalMessage(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setApprovalDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleRequestApproval} disabled={requestApproval.isPending}>
                  {requestApproval.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Request
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="shared">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="shared">
            <Users className="mr-2 h-4 w-4" />
            Shared With Me
          </TabsTrigger>
          <TabsTrigger value="approvals">
            <Clock className="mr-2 h-4 w-4" />
            Approval Requests
            {approvalRequests && approvalRequests.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {approvalRequests.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="my-requests">
            <FileCheck className="mr-2 h-4 w-4" />
            My Requests
          </TabsTrigger>
        </TabsList>

        <TabsContent value="shared" className="space-y-4">
          {loadingShared ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : sharedWithMe && sharedWithMe.length > 0 ? (
            sharedWithMe.map((shared) => (
              <Card key={shared.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{shared.template?.name || "Unknown Template"}</CardTitle>
                      <CardDescription>
                        Shared by {shared.sharedByUser?.name || "Unknown User"}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {getPermissionIcon(shared.permission)}
                      {getStatusBadge(shared.status)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {shared.message && (
                    <p className="text-sm text-muted-foreground mb-4">{shared.message}</p>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Shared {new Date(shared.createdAt).toLocaleDateString()}
                    </span>
                    {shared.status === "active" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => revokeSharing.mutate({ shareId: shared.id })}
                      >
                        Remove Access
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No templates shared with you yet
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="approvals" className="space-y-4">
          {loadingApprovals ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : approvalRequests && approvalRequests.length > 0 ? (
            approvalRequests.map((approval) => (
              <Card key={approval.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{approval.template?.name || "Unknown Template"}</CardTitle>
                      <CardDescription>
                        Requested by {approval.requester?.name || "Unknown User"}
                      </CardDescription>
                    </div>
                    {getStatusBadge(approval.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  {approval.requestMessage && (
                    <p className="text-sm mb-4">{approval.requestMessage}</p>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Requested {new Date(approval.requestedAt).toLocaleDateString()}
                    </span>
                    {approval.status === "pending" && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReject(approval.id)}
                        >
                          <X className="mr-2 h-4 w-4" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleApprove(approval.id)}
                        >
                          <Check className="mr-2 h-4 w-4" />
                          Approve
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No pending approval requests
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="my-requests" className="space-y-4">
          {loadingMyRequests ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : myApprovalRequests && myApprovalRequests.length > 0 ? (
            myApprovalRequests.map((approval) => (
              <Card key={approval.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{approval.template?.name || "Unknown Template"}</CardTitle>
                      <CardDescription>
                        Approver: {approval.approver?.name || "Unknown User"}
                      </CardDescription>
                    </div>
                    {getStatusBadge(approval.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  {approval.requestMessage && (
                    <div className="mb-4">
                      <p className="text-sm font-medium mb-1">Your Request:</p>
                      <p className="text-sm text-muted-foreground">{approval.requestMessage}</p>
                    </div>
                  )}
                  {approval.responseMessage && (
                    <div className="mb-4">
                      <p className="text-sm font-medium mb-1">Response:</p>
                      <p className="text-sm text-muted-foreground">{approval.responseMessage}</p>
                    </div>
                  )}
                  <div className="text-sm text-muted-foreground">
                    Requested {new Date(approval.requestedAt).toLocaleDateString()}
                    {approval.respondedAt && (
                      <> • Responded {new Date(approval.respondedAt).toLocaleDateString()}</>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No approval requests sent
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
