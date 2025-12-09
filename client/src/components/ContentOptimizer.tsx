import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Sparkles, TrendingUp, Clock, Lightbulb, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function ContentOptimizer() {
  const [currentSubject, setCurrentSubject] = useState("");
  const [currentContent, setCurrentContent] = useState("");
  const [emailType, setEmailType] = useState("general");
  const [optimization, setOptimization] = useState<any>(null);
  const [subjectAnalysis, setSubjectAnalysis] = useState<any>(null);

  const { data: sendTimeRecs, isLoading: sendTimeLoading } = trpc.optimizer.getSendTimeRecommendations.useQuery();

  const optimizeMutation = trpc.optimizer.optimizeContent.useMutation({
    onSuccess: (data) => {
      setOptimization(data);
      toast.success("Content optimization complete");
    },
    onError: (error) => {
      toast.error(`Optimization failed: ${error.message}`);
    },
  });

  const analyzeMutation = trpc.optimizer.analyzeSubject.useMutation({
    onSuccess: (data) => {
      setSubjectAnalysis(data);
      toast.success("Subject line analyzed");
    },
    onError: (error) => {
      toast.error(`Analysis failed: ${error.message}`);
    },
  });

  const handleOptimize = () => {
    if (!currentSubject || !currentContent) {
      toast.error("Please enter both subject and content");
      return;
    }
    optimizeMutation.mutate({ currentSubject, currentContent, emailType });
  };

  const handleAnalyzeSubject = () => {
    if (!currentSubject) {
      toast.error("Please enter a subject line");
      return;
    }
    analyzeMutation.mutate({ subjectLine: currentSubject });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-blue-600";
    if (score >= 40) return "text-yellow-600";
    return "text-red-600";
  };

  const getConfidenceColor = (confidence: string) => {
    if (confidence === "high") return "text-green-600";
    if (confidence === "medium") return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">AI Content Optimizer</h2>
        <p className="text-sm text-muted-foreground">
          Get AI-powered suggestions to improve email performance
        </p>
      </div>

      <Tabs defaultValue="optimize" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="optimize">Optimize</TabsTrigger>
          <TabsTrigger value="analyze">Analyze</TabsTrigger>
          <TabsTrigger value="timing">Send Times</TabsTrigger>
        </TabsList>

        {/* Content Optimizer */}
        <TabsContent value="optimize" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Content</CardTitle>
              <CardDescription>Enter your email details for AI optimization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject Line</Label>
                <Input
                  id="subject"
                  value={currentSubject}
                  onChange={(e) => setCurrentSubject(e.target.value)}
                  placeholder="Enter email subject line"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Email Content</Label>
                <Textarea
                  id="content"
                  value={currentContent}
                  onChange={(e) => setCurrentContent(e.target.value)}
                  placeholder="Enter email body content"
                  rows={8}
                />
              </div>

              <Button onClick={handleOptimize} disabled={optimizeMutation.isPending} className="w-full">
                {optimizeMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Sparkles className="h-4 w-4 mr-2" />
                Optimize with AI
              </Button>
            </CardContent>
          </Card>

          {/* Optimization Results */}
          {optimization && (
            <>
              {/* Subject Line Variations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-600" />
                    Subject Line Variations
                  </CardTitle>
                  <CardDescription>AI-generated alternatives to test</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {optimization.subjectLineVariations.map((subject: string, index: number) => (
                      <div
                        key={index}
                        className="p-3 border rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                        onClick={() => {
                          setCurrentSubject(subject);
                          toast.success("Subject line copied");
                        }}
                      >
                        <p className="font-medium">{subject}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Content Improvements */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-yellow-600" />
                    Content Improvements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {optimization.contentImprovements.map((improvement: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>{improvement}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Optimal Send Time */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    Optimal Send Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <div>
                      <p className="text-2xl font-bold text-blue-900">
                        {optimization.optimalSendTime.dayOfWeek} at {optimization.optimalSendTime.hour}:00
                      </p>
                      <p className="text-sm text-blue-700">
                        Confidence: {Math.round(optimization.optimalSendTime.confidence * 100)}%
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              {/* A/B Test Suggestions */}
              <Card>
                <CardHeader>
                  <CardTitle>A/B Test Suggestions</CardTitle>
                  <CardDescription>Recommended elements to test</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {optimization.abTestSuggestions.map((suggestion: any, index: number) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <h4 className="font-semibold mb-2">{suggestion.element}</h4>
                        <div className="space-y-2 mb-3">
                          {suggestion.variants.map((variant: string, vIdx: number) => (
                            <Badge key={vIdx} variant="outline">
                              Variant {vIdx + 1}: {variant}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-sm text-muted-foreground">{suggestion.rationale}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Performance Prediction */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance Prediction</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Est. Open Rate</p>
                      <p className="text-3xl font-bold text-blue-600">
                        {optimization.performancePrediction.openRateEstimate.toFixed(1)}%
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Est. Click Rate</p>
                      <p className="text-3xl font-bold text-green-600">
                        {optimization.performancePrediction.clickRateEstimate.toFixed(1)}%
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Confidence</p>
                      <p
                        className={`text-3xl font-bold capitalize ${getConfidenceColor(
                          optimization.performancePrediction.confidence
                        )}`}
                      >
                        {optimization.performancePrediction.confidence}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Subject Line Analyzer */}
        <TabsContent value="analyze" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Subject Line Analyzer</CardTitle>
              <CardDescription>Get detailed analysis of your subject line effectiveness</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="analyzeSubject">Subject Line</Label>
                <Input
                  id="analyzeSubject"
                  value={currentSubject}
                  onChange={(e) => setCurrentSubject(e.target.value)}
                  placeholder="Enter subject line to analyze"
                />
              </div>

              <Button onClick={handleAnalyzeSubject} disabled={analyzeMutation.isPending} className="w-full">
                {analyzeMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Analyze Subject Line
              </Button>
            </CardContent>
          </Card>

          {/* Analysis Results */}
          {subjectAnalysis && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Effectiveness Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center p-8">
                    <div className="text-center">
                      <p className={`text-6xl font-bold ${getScoreColor(subjectAnalysis.score)}`}>
                        {subjectAnalysis.score}
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">out of 100</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="h-5 w-5" />
                      Strengths
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {subjectAnalysis.strengths.map((strength: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-green-600">✓</span>
                          <span>{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-orange-600">
                      <AlertTriangle className="h-5 w-5" />
                      Weaknesses
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {subjectAnalysis.weaknesses.map((weakness: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-orange-600">!</span>
                          <span>{weakness}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-yellow-600" />
                    Suggestions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {subjectAnalysis.suggestions.map((suggestion: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-blue-600">→</span>
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Send Time Recommendations */}
        <TabsContent value="timing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                Best Send Times
              </CardTitle>
              <CardDescription>Based on your historical email performance</CardDescription>
            </CardHeader>
            <CardContent>
              {sendTimeLoading ? (
                <div className="flex items-center justify-center p-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : sendTimeRecs && sendTimeRecs.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Day & Time</TableHead>
                      <TableHead>Open Rate</TableHead>
                      <TableHead>Click Rate</TableHead>
                      <TableHead>Emails Sent</TableHead>
                      <TableHead>Recommendation</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sendTimeRecs.map((rec: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {rec.dayOfWeek} at {rec.hour}:00
                        </TableCell>
                        <TableCell>
                          <span className="text-blue-600 font-semibold">{rec.avgOpenRate.toFixed(1)}%</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-green-600 font-semibold">{rec.avgClickRate.toFixed(1)}%</span>
                        </TableCell>
                        <TableCell>{rec.emailsSent}</TableCell>
                        <TableCell>
                          <Badge variant={index === 0 ? "default" : "secondary"}>{rec.recommendation}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center p-12">
                  <Clock className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Not enough data yet. Send more emails to get personalized recommendations.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
