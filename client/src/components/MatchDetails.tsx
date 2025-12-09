import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, AlertCircle, Lightbulb, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

interface MatchDetailsProps {
  applicationId: number;
}

export function MatchDetails({ applicationId }: MatchDetailsProps) {
  const { data, isLoading, error } = trpc.aiMatching.getMatchDetails.useQuery({
    applicationId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <p>Failed to load match details: {error.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  const { application, explanations, cultureScores, wellbeingScores } = data;

  // Prepare radar chart data for culture fit
  const cultureChartData = cultureScores.length > 0 ? [
    { dimension: "Hierarchy", score: cultureScores[0]?.hierarchyScore || 50 },
    { dimension: "Innovation", score: cultureScores[0]?.innovationScore || 50 },
    { dimension: "Team Style", score: cultureScores[0]?.teamStyleScore || 50 },
    { dimension: "Communication", score: cultureScores[0]?.communicationScore || 50 },
    { dimension: "Work Pace", score: cultureScores[0]?.workPaceScore || 50 },
    { dimension: "Risk Tolerance", score: cultureScores[0]?.riskToleranceScore || 50 },
    { dimension: "Decision Making", score: cultureScores[0]?.decisionMakingScore || 50 },
    { dimension: "Feedback Style", score: cultureScores[0]?.feedbackStyleScore || 50 },
  ] : [];

  // Prepare radar chart data for wellbeing
  const wellbeingChartData = wellbeingScores.length > 0 ? [
    { dimension: "Work-Life Balance", score: wellbeingScores[0]?.workLifeBalanceScore || 50 },
    { dimension: "Stress Tolerance", score: wellbeingScores[0]?.stressToleranceScore || 50 },
    { dimension: "Growth Mindset", score: wellbeingScores[0]?.growthMindsetScore || 50 },
    { dimension: "Autonomy", score: wellbeingScores[0]?.autonomyScore || 50 },
    { dimension: "Social Connection", score: wellbeingScores[0]?.socialConnectionScore || 50 },
    { dimension: "Purpose Alignment", score: wellbeingScores[0]?.purposeAlignmentScore || 50 },
    { dimension: "Learning Opportunity", score: wellbeingScores[0]?.learningOpportunityScore || 50 },
    { dimension: "Recognition", score: wellbeingScores[0]?.recognitionScore || 50 },
  ] : [];

  const overallExplanation = explanations.find(e => e.explanationType === "overall");

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-6">
      {/* Overall Match Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Overall Match Score
          </CardTitle>
          <CardDescription>
            Comprehensive analysis across technical, culture, and wellbeing dimensions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Technical Skills</span>
                <span className={`text-2xl font-bold ${getScoreColor(application.skillMatchScore || 0)}`}>
                  {application.skillMatchScore}%
                </span>
              </div>
              <Progress 
                value={application.skillMatchScore || 0} 
                className={getProgressColor(application.skillMatchScore || 0)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Culture Fit</span>
                <span className={`text-2xl font-bold ${getScoreColor(application.cultureFitScore || 0)}`}>
                  {application.cultureFitScore}%
                </span>
              </div>
              <Progress 
                value={application.cultureFitScore || 0} 
                className={getProgressColor(application.cultureFitScore || 0)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Wellbeing Match</span>
                <span className={`text-2xl font-bold ${getScoreColor(application.wellbeingMatchScore || 0)}`}>
                  {application.wellbeingMatchScore}%
                </span>
              </div>
              <Progress 
                value={application.wellbeingMatchScore || 0} 
                className={getProgressColor(application.wellbeingMatchScore || 0)}
              />
            </div>
          </div>

          <div className="mt-6 p-4 bg-purple-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold">Overall Match</span>
              <Badge className="text-lg px-4 py-1">
                {application.overallMatchScore}%
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI-Generated Explanation */}
      {overallExplanation && (
        <Card>
          <CardHeader>
            <CardTitle>AI Match Analysis</CardTitle>
            <CardDescription>
              Detailed insights generated by our AI matching engine
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {overallExplanation.summary && (
              <div>
                <h4 className="font-semibold mb-2">Summary</h4>
                <p className="text-sm text-muted-foreground">{overallExplanation.summary}</p>
              </div>
            )}

            {overallExplanation.strengths && (
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  Key Strengths
                </h4>
                <ul className="space-y-2">
                  {(overallExplanation.strengths as string[]).map((strength, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <span className="text-green-600 mt-1">•</span>
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {overallExplanation.concerns && (
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  Areas of Concern
                </h4>
                <ul className="space-y-2">
                  {(overallExplanation.concerns as string[]).map((concern, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <span className="text-yellow-600 mt-1">•</span>
                      <span>{concern}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {overallExplanation.recommendations && (
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-blue-600" />
                  Recommendations
                </h4>
                <ul className="space-y-2">
                  {(overallExplanation.recommendations as string[]).map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Culture Fit Visualization */}
      {cultureChartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Culture Fit Analysis</CardTitle>
            <CardDescription>
              8-dimensional culture compatibility assessment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={cultureChartData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="dimension" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar
                  name="Culture Fit"
                  dataKey="score"
                  stroke="#8b5cf6"
                  fill="#8b5cf6"
                  fillOpacity={0.6}
                />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Wellbeing Compatibility Visualization */}
      {wellbeingChartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Wellbeing Compatibility</CardTitle>
            <CardDescription>
              8-factor wellbeing alignment analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={wellbeingChartData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="dimension" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar
                  name="Wellbeing"
                  dataKey="score"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.6}
                />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
