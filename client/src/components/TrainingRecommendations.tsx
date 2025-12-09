import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { GraduationCap, TrendingUp, AlertCircle, ArrowRight, BookOpen, CheckCircle2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";

interface TrainingRecommendationsProps {
  jobId: number;
}

/**
 * Training-to-Job Pathways Component
 * Priority 3: Pathways to Qualification
 * Shows skill gaps and recommended training to improve match scores
 */
export function TrainingRecommendations({ jobId }: TrainingRecommendationsProps) {
  const { data, isLoading, error } = trpc.aiMatching.getTrainingRecommendations.useQuery({ jobId });
  const { data: enrollments } = trpc.trainingCompletion.getMyEnrollments.useQuery();
  const utils = trpc.useUtils();

  // Enroll in program mutation
  const enrollMutation = trpc.trainingCompletion.enrollInProgram.useMutation({
    onSuccess: () => {
      toast.success("Successfully enrolled in training program");
      utils.trainingCompletion.getMyEnrollments.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to enroll in program");
    }
  });

  // Complete program mutation
  const completeMutation = trpc.trainingCompletion.completeProgram.useMutation({
    onSuccess: (result) => {
      toast.success("Training completed! Your match scores have been updated.");
      
      // Show improvements if any
      if (result.matchScoreImprovements.length > 0) {
        const topImprovement = result.matchScoreImprovements[0];
        toast.success(
          `Your match for "${topImprovement.jobTitle}" improved by ${topImprovement.improvement}%!`,
          { duration: 5000 }
        );
      }
      
      utils.trainingCompletion.getMyEnrollments.invalidate();
      utils.aiMatching.getTrainingRecommendations.invalidate();
      utils.job.getWithMatchScores.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to complete training");
    }
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            Improve Your Match
          </CardTitle>
          <CardDescription>Recommended training to strengthen your application</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return null; // Silently fail - not critical feature
  }

  // Don't show if no skill gaps or already high match
  if (data.skillGaps.length === 0 || data.currentMatchScore >= 90) {
    return null;
  }

  return (
    <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-purple-600" />
              Improve Your Match
            </CardTitle>
            <CardDescription>
              Complete these training programs to increase your match score
            </CardDescription>
          </div>
          {data.estimatedMatchImpact > 0 && (
            <Badge variant="secondary" className="bg-purple-100 text-purple-700">
              +{data.estimatedMatchImpact}% Match
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current vs Projected Match Score */}
        <div className="bg-white rounded-lg p-4 border border-purple-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Current Match</span>
            <span className="font-semibold text-lg">{data.currentMatchScore}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2 mb-3">
            <div
              className="bg-slate-400 h-2 rounded-full transition-all"
              style={{ width: `${data.currentMatchScore}%` }}
            />
          </div>
          
          {data.projectedMatchScore > data.currentMatchScore && (
            <>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-purple-600 font-medium flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  After Training
                </span>
                <span className="font-semibold text-lg text-purple-600">
                  {data.projectedMatchScore}%
                </span>
              </div>
              <div className="w-full bg-purple-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all"
                  style={{ width: `${data.projectedMatchScore}%` }}
                />
              </div>
            </>
          )}
        </div>

        {/* Skill Gaps */}
        {data.skillGaps.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm text-slate-900 mb-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-500" />
              Skills to Develop
            </h4>
            <div className="flex flex-wrap gap-2">
              {data.skillGaps.slice(0, 6).map((gap, index) => (
                <Badge
                  key={index}
                  variant={gap.priority === "required" ? "destructive" : "secondary"}
                  className="text-xs"
                >
                  {gap.skill}
                  {gap.priority === "required" && " *"}
                </Badge>
              ))}
              {data.skillGaps.length > 6 && (
                <Badge variant="outline" className="text-xs">
                  +{data.skillGaps.length - 6} more
                </Badge>
              )}
            </div>
            {data.skillGaps.some(g => g.priority === "required") && (
              <p className="text-xs text-muted-foreground mt-2">
                * Required for this role
              </p>
            )}
          </div>
        )}

        {/* Recommended Training Programs */}
        {data.recommendedTraining.length > 0 ? (
          <div>
            <h4 className="font-semibold text-sm text-slate-900 mb-3 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-purple-600" />
              Recommended Training Programs
            </h4>
            <div className="space-y-3">
              {data.recommendedTraining.slice(0, 3).map((rec: any) => {
                const enrollment = enrollments?.find(e => e.programId === rec.program.id);
                const isCompleted = enrollment?.status === 'completed';
                const isEnrolled = !!enrollment;

                return (
                  <div key={rec.program.id} className="bg-white border border-purple-100 rounded-lg p-4 hover:border-purple-300 hover:shadow-sm transition-all">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h5 className="font-semibold text-slate-900">
                            {rec.program.title}
                          </h5>
                          {isCompleted && (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Completed
                            </Badge>
                          )}
                          {isEnrolled && !isCompleted && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                              Enrolled
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          {rec.program.provider} • {rec.program.duration} • {rec.program.level}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {rec.matchedGaps.slice(0, 3).map((gap: string, idx: number) => (
                            <Badge key={idx} variant="outline" className="text-xs bg-purple-50">
                              {gap}
                            </Badge>
                          ))}
                          {rec.matchedGaps.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{rec.matchedGaps.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-xs">
                        {rec.relevanceScore}% Match
                      </Badge>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      {!isEnrolled && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => enrollMutation.mutate({ programId: rec.program.id })}
                          disabled={enrollMutation.isPending}
                        >
                          <Sparkles className="h-3 w-3 mr-1" />
                          Enroll
                        </Button>
                      )}

                      {isEnrolled && !isCompleted && (
                        <>
                          <Link href={`/training/${rec.program.id}`}>
                            <Button size="sm" variant="outline">
                              Continue Learning
                              <ArrowRight className="h-3 w-3 ml-1" />
                            </Button>
                          </Link>
                          <Button
                            size="sm"
                            onClick={() => completeMutation.mutate({ programId: rec.program.id })}
                            disabled={completeMutation.isPending}
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Mark Complete
                          </Button>
                        </>
                      )}

                      {isCompleted && (
                        <Link href={`/training/${rec.program.id}`}>
                          <Button size="sm" variant="outline">
                            View Details
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {data.recommendedTraining.length > 3 && (
              <Link href="/training">
                <Button variant="outline" size="sm" className="w-full mt-3">
                  View All Training Programs
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="text-center py-6">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              No specific training recommendations available yet.
            </p>
            <Link href="/training">
              <Button variant="outline" size="sm" className="mt-3">
                Browse All Training
              </Button>
            </Link>
          </div>
        )}

        {/* Call to Action */}
        {data.recommendedTraining.length > 0 && (
          <div className="bg-purple-100 rounded-lg p-4 text-center">
            <p className="text-sm text-purple-900 font-medium mb-2">
              Complete training to boost your qualifications
            </p>
            <p className="text-xs text-purple-700">
              Your updated skills will automatically improve your match score for this and similar roles
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
