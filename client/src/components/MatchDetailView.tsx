import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  Heart, 
  Brain, 
  Users, 
  Target, 
  Zap, 
  Shield,
  AlertCircle,
  CheckCircle,
  Info
} from "lucide-react";
import { Streamdown } from "streamdown";

interface MatchDetailViewProps {
  match: {
    overallScore: number;
    technicalScore: number;
    cultureFitScore: number;
    wellbeingScore: number;
    explanation?: string;
    topAttributes?: Array<{ name: string; score: number; category?: string }>;
    cultureFitDetails?: {
      dimensions: Array<{
        name: string;
        candidateScore: number;
        companyScore: number;
        gap: number;
      }>;
      overallAlignment: number;
    };
    wellbeingDetails?: {
      factors: Array<{
        name: string;
        candidatePreference: number;
        jobEnvironment: number;
        gap: number;
      }>;
      burnoutRisk: number;
      recommendations?: string[];
    };
  };
  candidateName?: string;
  jobTitle?: string;
}

export default function MatchDetailView({ match, candidateName, jobTitle }: MatchDetailViewProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-green-50 dark:bg-green-950/20";
    if (score >= 60) return "bg-yellow-50 dark:bg-yellow-950/20";
    return "bg-red-50 dark:bg-red-950/20";
  };

  const getGapIndicator = (gap: number) => {
    const absGap = Math.abs(gap);
    if (absGap <= 15) return { icon: CheckCircle, color: "text-green-600", label: "Excellent Alignment" };
    if (absGap <= 30) return { icon: Info, color: "text-yellow-600", label: "Good Alignment" };
    return { icon: AlertCircle, color: "text-red-600", label: "Needs Attention" };
  };

  return (
    <div className="space-y-6">
      {/* Overall Score Card */}
      <Card className={getScoreBgColor(match.overallScore)}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-1">Overall Match Score</h3>
              <p className="text-sm text-muted-foreground">
                {candidateName && jobTitle && `${candidateName} × ${jobTitle}`}
              </p>
            </div>
            <div className={`text-5xl font-bold ${getScoreColor(match.overallScore)}`}>
              {match.overallScore}%
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Score Breakdown Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="technical">Technical</TabsTrigger>
          <TabsTrigger value="culture">Culture Fit</TabsTrigger>
          <TabsTrigger value="wellbeing">Wellbeing</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Score Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">Technical Match</span>
                    </span>
                    <span className="font-semibold">{match.technicalScore}%</span>
                  </div>
                  <Progress value={match.technicalScore} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    Skills, experience, and qualifications alignment
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Heart className="h-4 w-4 text-pink-600" />
                      <span className="font-medium">Culture Fit</span>
                    </span>
                    <span className="font-semibold">{match.cultureFitScore}%</span>
                  </div>
                  <Progress value={match.cultureFitScore} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    Values, work style, and team dynamics compatibility
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-green-600" />
                      <span className="font-medium">Wellbeing Compatibility</span>
                    </span>
                    <span className="font-semibold">{match.wellbeingScore}%</span>
                  </div>
                  <Progress value={match.wellbeingScore} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    Work-life balance and sustainable performance alignment
                  </p>
                </div>
              </div>

              {/* AI Explanation */}
              {match.explanation && (
                <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <div className="flex items-start gap-2">
                    <Brain className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <h4 className="font-semibold text-sm">AI Match Analysis</h4>
                      <div className="text-sm prose prose-sm max-w-none dark:prose-invert">
                        <Streamdown>{match.explanation}</Streamdown>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Technical Tab */}
        <TabsContent value="technical" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Technical Attributes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {match.topAttributes && match.topAttributes.length > 0 ? (
                <div className="space-y-3">
                  {match.topAttributes.map((attr, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{attr.name}</span>
                        <Badge variant={attr.score >= 80 ? "default" : attr.score >= 60 ? "secondary" : "outline"}>
                          {attr.score}%
                        </Badge>
                      </div>
                      <Progress value={attr.score} className="h-1.5" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No detailed attribute data available
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Culture Fit Tab */}
        <TabsContent value="culture" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Culture Fit Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {match.cultureFitDetails ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {match.cultureFitDetails.dimensions.map((dim, index) => {
                      const gapInfo = getGapIndicator(dim.gap);
                      const GapIcon = gapInfo.icon;
                      
                      return (
                        <div key={index} className="p-4 border rounded-lg space-y-3">
                          <div className="flex items-start justify-between">
                            <h4 className="font-semibold text-sm">{dim.name}</h4>
                            <GapIcon className={`h-4 w-4 ${gapInfo.color}`} />
                          </div>
                          
                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Candidate</span>
                              <span className="font-medium">{dim.candidateScore}/10</span>
                            </div>
                            <Progress value={dim.candidateScore * 10} className="h-1.5" />
                            
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Company</span>
                              <span className="font-medium">{dim.companyScore}/10</span>
                            </div>
                            <Progress value={dim.companyScore * 10} className="h-1.5" />
                          </div>
                          
                          <Badge variant="outline" className="text-xs">
                            Gap: {Math.abs(dim.gap).toFixed(1)} - {gapInfo.label}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>

                  <div className="p-4 bg-primary/5 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-sm">Overall Culture Alignment</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Progress value={match.cultureFitDetails.overallAlignment} className="flex-1 h-2" />
                      <span className="font-bold text-lg">{match.cultureFitDetails.overallAlignment}%</span>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No detailed culture fit data available
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Wellbeing Tab */}
        <TabsContent value="wellbeing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Wellbeing Compatibility
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {match.wellbeingDetails ? (
                <>
                  {/* Burnout Risk Alert */}
                  {match.wellbeingDetails.burnoutRisk > 50 && (
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 rounded-lg">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5 flex-shrink-0" />
                        <div className="space-y-1">
                          <h4 className="font-semibold text-sm text-yellow-900 dark:text-yellow-100">
                            Elevated Burnout Risk: {match.wellbeingDetails.burnoutRisk}%
                          </h4>
                          <p className="text-xs text-yellow-800 dark:text-yellow-200">
                            This match shows potential wellbeing concerns that may require attention and support.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Wellbeing Factors */}
                  <div className="space-y-4">
                    {match.wellbeingDetails.factors.map((factor, index) => {
                      const gapInfo = getGapIndicator(factor.gap);
                      const GapIcon = gapInfo.icon;
                      
                      return (
                        <div key={index} className="p-4 border rounded-lg space-y-3">
                          <div className="flex items-start justify-between">
                            <h4 className="font-semibold text-sm">{factor.name}</h4>
                            <GapIcon className={`h-4 w-4 ${gapInfo.color}`} />
                          </div>
                          
                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Candidate Preference</span>
                              <span className="font-medium">{factor.candidatePreference}/10</span>
                            </div>
                            <Progress value={factor.candidatePreference * 10} className="h-1.5" />
                            
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Job Environment</span>
                              <span className="font-medium">{factor.jobEnvironment}/10</span>
                            </div>
                            <Progress value={factor.jobEnvironment * 10} className="h-1.5" />
                          </div>
                          
                          <Badge variant="outline" className="text-xs">
                            Gap: {Math.abs(factor.gap).toFixed(1)} - {gapInfo.label}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>

                  {/* Recommendations */}
                  {match.wellbeingDetails.recommendations && match.wellbeingDetails.recommendations.length > 0 && (
                    <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg">
                      <div className="flex items-start gap-3">
                        <Zap className="h-5 w-5 text-green-600 dark:text-green-500 mt-0.5 flex-shrink-0" />
                        <div className="space-y-2 flex-1">
                          <h4 className="font-semibold text-sm text-green-900 dark:text-green-100">
                            Wellbeing Recommendations
                          </h4>
                          <ul className="space-y-1 text-xs text-green-800 dark:text-green-200">
                            {match.wellbeingDetails.recommendations.map((rec, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-green-600 dark:text-green-500 mt-0.5">•</span>
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No detailed wellbeing data available
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
