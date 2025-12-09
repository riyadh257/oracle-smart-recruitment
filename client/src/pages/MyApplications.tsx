import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileText, MapPin, Briefcase, ArrowRight, Star, X, MoreVertical } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { toast } from "sonner";

/**
 * My Applications Page
 * List view of all candidate applications with bulk actions and favorites
 */

export default function MyApplications() {
  const { data: applications, isLoading, refetch } = trpc.applications.getCandidateApplications.useQuery();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [filterFavorites, setFilterFavorites] = useState(false);

  const bulkWithdraw = trpc.applications.bulkWithdrawApplications.useMutation({
    onSuccess: (data) => {
      toast.success(`Successfully withdrew ${data.count} application(s)`);
      setSelectedIds([]);
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to withdraw applications: ${error.message}`);
    },
  });

  const bulkToggleFavorite = trpc.applications.bulkToggleFavoriteApplications.useMutation({
    onSuccess: (data) => {
      toast.success(`Updated ${data.count} application(s)`);
      setSelectedIds([]);
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to update favorites: ${error.message}`);
    },
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      submitted: "bg-blue-500",
      screening: "bg-yellow-500",
      interviewing: "bg-purple-500",
      offered: "bg-green-500",
      rejected: "bg-red-500",
    };
    return colors[status] || "bg-gray-500";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      submitted: "Submitted",
      screening: "Under Screening",
      interviewing: "Interview Stage",
      offered: "Offer Extended",
      rejected: "Rejected",
    };
    return labels[status] || status;
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked && applications) {
      const activeApps = applications.filter(app => !app.withdrawnAt);
      setSelectedIds(activeApps.map(app => app.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter(sid => sid !== id));
    }
  };

  const handleBulkWithdraw = () => {
    if (selectedIds.length === 0) return;
    if (confirm(`Are you sure you want to withdraw ${selectedIds.length} application(s)?`)) {
      bulkWithdraw.mutate({ applicationIds: selectedIds });
    }
  };

  const handleBulkFavorite = (isFavorite: boolean) => {
    if (selectedIds.length === 0) return;
    bulkToggleFavorite.mutate({ applicationIds: selectedIds, isFavorite });
  };

  const handleToggleSingleFavorite = (id: number, currentFavorite: boolean) => {
    bulkToggleFavorite.mutate({ applicationIds: [id], isFavorite: !currentFavorite });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <Skeleton className="h-12 w-64 mb-6" />
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const activeApplications = applications?.filter(app => !app.withdrawnAt) || [];
  const displayedApplications = filterFavorites 
    ? activeApplications.filter(app => app.isFavorite)
    : activeApplications;

  return (
    <div className="container mx-auto py-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Applications</h1>
        <p className="text-muted-foreground">
          Track the status of all your job applications
        </p>
      </div>

      {!applications || applications.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Applications Yet</h3>
              <p className="text-muted-foreground mb-6">
                Start applying to jobs to see your applications here
              </p>
              <Link href="/jobs">
                <Button>Browse Jobs</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Bulk Actions Toolbar */}
          <div className="mb-4 flex items-center justify-between bg-muted p-4 rounded-lg">
            <div className="flex items-center gap-4">
              <Checkbox
                checked={selectedIds.length > 0 && selectedIds.length === activeApplications.length}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm font-medium">
                {selectedIds.length > 0 ? `${selectedIds.length} selected` : "Select all"}
              </span>
              
              {selectedIds.length > 0 && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkFavorite(true)}
                  >
                    <Star className="h-4 w-4 mr-2" />
                    Mark Favorite
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkFavorite(false)}
                  >
                    <Star className="h-4 w-4 mr-2 fill-none" />
                    Remove Favorite
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleBulkWithdraw}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Withdraw
                  </Button>
                </div>
              )}
            </div>
            
            <Button
              size="sm"
              variant={filterFavorites ? "default" : "outline"}
              onClick={() => setFilterFavorites(!filterFavorites)}
            >
              <Star className={`h-4 w-4 mr-2 ${filterFavorites ? "fill-current" : ""}`} />
              {filterFavorites ? "Show All" : "Favorites Only"}
            </Button>
          </div>

          {/* Applications List */}
          <div className="space-y-4">
            {displayedApplications.map((app) => (
              <Card key={app.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <Checkbox
                      checked={selectedIds.includes(app.id)}
                      onCheckedChange={(checked) => handleSelectOne(app.id, checked as boolean)}
                    />
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-xl font-semibold">
                              {app.job?.title || "Unknown Position"}
                            </h3>
                            <button
                              onClick={() => handleToggleSingleFavorite(app.id, app.isFavorite || false)}
                              className="text-yellow-500 hover:scale-110 transition-transform"
                            >
                              <Star className={`h-5 w-5 ${app.isFavorite ? "fill-current" : ""}`} />
                            </button>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            {app.job?.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {app.job.location}
                              </span>
                            )}
                            {app.job?.employmentType && (
                              <span className="flex items-center gap-1">
                                <Briefcase className="h-4 w-4" />
                                {app.job.employmentType.replace("_", " ")}
                              </span>
                            )}
                          </div>
                        </div>
                        <Badge className={getStatusColor(app.status)}>
                          {getStatusLabel(app.status)}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                          <div>
                            <span className="block text-xs">Applied</span>
                            <span className="font-medium text-foreground">
                              {new Date(app.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          {app.overallMatchScore && (
                            <div>
                              <span className="block text-xs">Match Score</span>
                              <span className="font-medium text-foreground">
                                {app.overallMatchScore}%
                              </span>
                            </div>
                          )}
                          <div>
                            <span className="block text-xs">Last Updated</span>
                            <span className="font-medium text-foreground">
                              {new Date(app.updatedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <Link href={`/applications/${app.id}`}>
                          <Button variant="outline" size="sm">
                            View Details
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {displayedApplications.length === 0 && filterFavorites && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <Star className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Favorite Applications</h3>
                  <p className="text-muted-foreground">
                    Mark applications as favorites to see them here
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Statistics */}
          {activeApplications.length > 0 && (
            <div className="mt-8 p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Total Applications</p>
                  <p className="text-2xl font-bold">{activeApplications.length}</p>
                </div>
                <div>
                  <p className="font-medium">Favorites</p>
                  <p className="text-2xl font-bold">
                    {activeApplications.filter(a => a.isFavorite).length}
                  </p>
                </div>
                <div>
                  <p className="font-medium">Active</p>
                  <p className="text-2xl font-bold">
                    {activeApplications.filter(a => 
                      a.status !== "rejected" && a.status !== "offered"
                    ).length}
                  </p>
                </div>
                <div>
                  <p className="font-medium">Interviews</p>
                  <p className="text-2xl font-bold">
                    {activeApplications.filter(a => a.status === "interviewing").length}
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
