import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "wouter";
import { Search, Filter, UserPlus, Loader2, Star, Mail, Calendar, Brain, Heart, Users } from "lucide-react";
import { toast } from "sonner";

export default function CandidatesList() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  const { data: candidates, isLoading } = trpc.candidates.list.useQuery({});

  const filteredCandidates = candidates?.filter((candidate) => {
    const matchesSearch = 
      candidate.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      candidate.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = 
      statusFilter === "all" || 
      candidate.profileStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getProfileStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      active: "default",
      incomplete: "secondary",
      inactive: "secondary"
    };
    
    return (
      <Badge variant={variants[status] || "default"}>
        {status}
      </Badge>
    );
  };

  const getScoreColor = (score: number | null) => {
    if (!score) return "text-gray-400";
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Candidates</h1>
            <p className="text-muted-foreground mt-2">
              Manage your candidate database with AI-powered screening
            </p>
          </div>
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Candidate
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search candidates by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[200px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="incomplete">Incomplete</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Candidates List */}
        <div className="space-y-4">
          {filteredCandidates && filteredCandidates.length > 0 ? (
            filteredCandidates.map((candidate) => (
              <Card key={candidate.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Link href={`/candidates/${candidate.id}`}>
                          <h3 className="text-lg font-semibold hover:text-primary cursor-pointer">
                            {candidate.fullName}
                          </h3>
                        </Link>
                        {getProfileStatusBadge(candidate.profileStatus)}
                        {candidate.isAvailable && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Available
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {candidate.email}
                        </span>
                        {candidate.location && (
                          <span>📍 {candidate.location}</span>
                        )}
                        {candidate.yearsOfExperience && (
                          <span>💼 {candidate.yearsOfExperience} years exp.</span>
                        )}
                      </div>

                      {candidate.headline && (
                        <p className="text-sm text-muted-foreground mb-3">
                          {candidate.headline}
                        </p>
                      )}

                      {/* Skills */}
                      {candidate.technicalSkills && candidate.technicalSkills.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {candidate.technicalSkills.slice(0, 5).map((skill, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {candidate.technicalSkills.length > 5 && (
                            <Badge variant="secondary" className="text-xs">
                              +{candidate.technicalSkills.length - 5} more
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>

                    {/* AI Scores Section */}
                    <div className="flex flex-col items-end gap-3 ml-4">
                      {candidate.aiProfileScore !== null ? (
                        <div className="text-center">
                          <div className="flex items-center gap-2 mb-1">
                            <Brain className="h-4 w-4 text-primary" />
                            <span className="text-xs font-medium text-muted-foreground">
                              AI Score
                            </span>
                          </div>
                          <div className={`text-3xl font-bold ${getScoreColor(candidate.aiProfileScore)}`}>
                            {candidate.aiProfileScore}
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3 w-3 ${
                                  i < Math.round((candidate.aiProfileScore || 0) / 20)
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center">
                          <Brain className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
                          <span className="text-xs text-muted-foreground">
                            Not screened
                          </span>
                        </div>
                      )}

                      {/* Culture Fit & Wellbeing Indicators */}
                      <div className="flex gap-3 mt-2">
                        {/* Culture Fit Indicator */}
                        <div className="text-center bg-blue-50 rounded-lg px-3 py-2 border border-blue-200">
                          <div className="flex items-center gap-1 mb-1">
                            <Users className="h-3 w-3 text-blue-600" />
                            <span className="text-xs font-medium text-blue-600">Culture</span>
                          </div>
                          <div className="text-lg font-bold text-blue-700">
                            {candidate.cultureFitScore !== null && candidate.cultureFitScore !== undefined 
                              ? `${Math.round(candidate.cultureFitScore)}%` 
                              : '-'}
                          </div>
                        </div>

                        {/* Wellbeing Indicator */}
                        <div className="text-center bg-green-50 rounded-lg px-3 py-2 border border-green-200">
                          <div className="flex items-center gap-1 mb-1">
                            <Heart className="h-3 w-3 text-green-600" />
                            <span className="text-xs font-medium text-green-600">Wellbeing</span>
                          </div>
                          <div className="text-lg font-bold text-green-700">
                            {candidate.wellbeingScore !== null && candidate.wellbeingScore !== undefined
                              ? `${Math.round(candidate.wellbeingScore)}%`
                              : '-'}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-2">
                        <Button variant="outline" size="sm">
                          <Mail className="mr-1 h-3 w-3" />
                          Email
                        </Button>
                        <Button variant="outline" size="sm">
                          <Calendar className="mr-1 h-3 w-3" />
                          Schedule
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <UserPlus className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No candidates found</h3>
                <p className="text-muted-foreground mb-6 text-center max-w-md">
                  {searchQuery || statusFilter !== "all"
                    ? "Try adjusting your search or filters"
                    : "Start building your candidate database by adding your first candidate"}
                </p>
                {!searchQuery && statusFilter === "all" && (
                  <Button size="lg">
                    <UserPlus className="mr-2 h-5 w-5" />
                    Add First Candidate
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Stats Footer */}
        {filteredCandidates && filteredCandidates.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold">{filteredCandidates.length}</div>
                  <div className="text-sm text-muted-foreground">Total Candidates</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {filteredCandidates.filter(c => c.profileStatus === 'active').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Active</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {filteredCandidates.filter(c => c.aiProfileScore !== null).length}
                  </div>
                  <div className="text-sm text-muted-foreground">AI Screened</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {filteredCandidates.filter(c => c.isAvailable).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Available</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
