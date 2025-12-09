import { useState } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, X, History, GitCompare } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

export default function TemplateVersions() {
  const params = useParams();
  const templateId = params.id ? parseInt(params.id) : 0;
  const [selectedVersionId, setSelectedVersionId] = useState<number | null>(null);

  const { data: versions, isLoading, refetch } = trpc.templateVersioning.getVersions.useQuery({ templateId });
  const { data: versionDiff } = trpc.templateVersioning.getVersionDiff.useQuery(
    { versionId: selectedVersionId! },
    { enabled: !!selectedVersionId }
  );

  const approveMutation = trpc.templateVersioning.approveVersion.useMutation({
    onSuccess: () => {
      toast.success("Version approved and activated");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to approve version: ${error.message}`);
    },
  });

  const rejectMutation = trpc.templateVersioning.rejectVersion.useMutation({
    onSuccess: () => {
      toast.success("Version rejected");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to reject version: ${error.message}`);
    },
  });

  const rollbackMutation = trpc.templateVersioning.rollbackToVersion.useMutation({
    onSuccess: () => {
      toast.success("Rolled back to selected version");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to rollback: ${error.message}`);
    },
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8">
        <div className="flex items-center gap-2 mb-6">
          <History className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Template Version History</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Version List */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Versions</CardTitle>
                <CardDescription>All versions of this template</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {versions?.map((version) => (
                    <div
                      key={version.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedVersionId === version.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => setSelectedVersionId(version.id)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold">Version {version.versionNumber}</h3>
                          <p className="text-sm text-muted-foreground">
                            {new Date(version.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {version.isActive && (
                            <Badge variant="default">Active</Badge>
                          )}
                          {version.approvalStatus === "approved" && (
                            <Badge variant="outline" className="border-green-500 text-green-600">
                              <Check className="h-3 w-3 mr-1" />
                              Approved
                            </Badge>
                          )}
                          {version.approvalStatus === "rejected" && (
                            <Badge variant="outline" className="border-red-500 text-red-600">
                              <X className="h-3 w-3 mr-1" />
                              Rejected
                            </Badge>
                          )}
                          {version.approvalStatus === "pending" && (
                            <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                              Pending
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-sm">{version.changeDescription}</p>
                      
                      {version.approvalStatus === "pending" && (
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              approveMutation.mutate({ versionId: version.id });
                            }}
                            disabled={approveMutation.isPending}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              rejectMutation.mutate({ versionId: version.id });
                            }}
                            disabled={rejectMutation.isPending}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                      
                      {!version.isActive && version.approvalStatus === "approved" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-3"
                          onClick={(e) => {
                            e.stopPropagation();
                            rollbackMutation.mutate({ versionId: version.id });
                          }}
                          disabled={rollbackMutation.isPending}
                        >
                          <History className="h-4 w-4 mr-1" />
                          Rollback to this version
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Version Diff Viewer */}
          <div>
            {selectedVersionId && versionDiff ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <GitCompare className="h-5 w-5" />
                    <CardTitle>Changes in Version {versionDiff.version.versionNumber}</CardTitle>
                  </div>
                  {versionDiff.previousVersion && (
                    <CardDescription>
                      Comparing with Version {versionDiff.previousVersion.versionNumber}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {versionDiff.diffs.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">
                        No changes detected
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {["subject", "html", "text", "variables"].map((diffType) => {
                          const typeDiffs = versionDiff.diffs.filter(
                            (d) => d.diffType === diffType
                          );
                          
                          if (typeDiffs.length === 0) return null;

                          return (
                            <div key={diffType}>
                              <h4 className="font-semibold mb-2 capitalize">{diffType} Changes</h4>
                              <div className="border rounded-lg overflow-hidden">
                                <div className="bg-muted/50 p-2 text-sm font-mono">
                                  {typeDiffs.map((diff, idx) => (
                                    <div key={idx} className="mb-1">
                                      {diff.changeType === "added" && (
                                        <div className="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 px-2 py-1 rounded">
                                          <span className="text-green-600 mr-2">+</span>
                                          {diff.newContent}
                                        </div>
                                      )}
                                      {diff.changeType === "removed" && (
                                        <div className="bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 px-2 py-1 rounded">
                                          <span className="text-red-600 mr-2">-</span>
                                          {diff.oldContent}
                                        </div>
                                      )}
                                      {diff.changeType === "modified" && (
                                        <div className="space-y-1">
                                          <div className="bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 px-2 py-1 rounded">
                                            <span className="text-red-600 mr-2">-</span>
                                            {diff.oldContent}
                                          </div>
                                          <div className="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 px-2 py-1 rounded">
                                            <span className="text-green-600 mr-2">+</span>
                                            {diff.newContent}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center min-h-[400px]">
                  <p className="text-muted-foreground">
                    Select a version to view changes
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
