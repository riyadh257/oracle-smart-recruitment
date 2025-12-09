import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles, Lightbulb, CheckCircle2, TrendingUp, Target, BookOpen, Users, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

const FOCUS_AREAS = [
  { value: "skill_gap", label: "Skill Gap Analysis", icon: Target, description: "Identify skills you need to develop" },
  { value: "career_path", label: "Career Path Guidance", icon: TrendingUp, description: "Plan your next career move" },
  { value: "resume_improvement", label: "Resume Tips", icon: BookOpen, description: "Optimize your resume" },
  { value: "interview_tips", label: "Interview Preparation", icon: Users, description: "Ace your next interview" },
  { value: "market_trends", label: "Market Insights", icon: Lightbulb, description: "Stay ahead of industry trends" },
  { value: "salary_guidance", label: "Salary Negotiation", icon: DollarSign, description: "Get paid what you're worth" },
  { value: "networking_advice", label: "Networking Strategy", icon: Users, description: "Build professional connections" },
];

export default function CareerCoaching() {
  const [selectedFocus, setSelectedFocus] = useState<string>("");
  const [generatingInsight, setGeneratingInsight] = useState(false);

  // Fetch career insights
  const { data: insights, isLoading, refetch } = trpc.candidatePortal.getCareerInsights.useQuery({
    limit: 20,
    unreadOnly: false,
  });

  // Generate coaching mutation
  const generateMutation = trpc.candidatePortal.generateCareerCoaching.useMutation({
    onSuccess: (data) => {
      toast.success("New career insight generated!");
      setGeneratingInsight(false);
      refetch();
      setSelectedFocus("");
    },
    onError: (error) => {
      toast.error(`Failed to generate insight: ${error.message}`);
      setGeneratingInsight(false);
    },
  });

  // Mark as read mutation
  const markReadMutation = trpc.candidatePortal.markInsightRead.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const handleGenerateInsight = () => {
    if (!selectedFocus) {
      toast.error("Please select a focus area");
      return;
    }

    setGeneratingInsight(true);
    generateMutation.mutate({
      focusArea: selectedFocus as any,
    });
  };

  const handleMarkRead = (insightId: number) => {
    markReadMutation.mutate({ insightId });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getInsightIcon = (type: string) => {
    const area = FOCUS_AREAS.find(a => a.value === type);
    return area?.icon || Lightbulb;
  };

  return (
    <DashboardLayout>
      <div className="container max-w-7xl py-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-primary" />
            AI Career Coach
          </h1>
          <p className="text-muted-foreground mt-2">
            Get personalized career advice powered by artificial intelligence
          </p>
        </div>

        {/* Generate New Insight */}
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <CardTitle>Generate New Insight</CardTitle>
            <CardDescription>
              Choose a focus area to receive personalized AI-generated career advice
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Select value={selectedFocus} onValueChange={setSelectedFocus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a focus area" />
                  </SelectTrigger>
                  <SelectContent>
                    {FOCUS_AREAS.map((area) => (
                      <SelectItem key={area.value} value={area.value}>
                        {area.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedFocus && (
                  <p className="text-sm text-muted-foreground">
                    {FOCUS_AREAS.find(a => a.value === selectedFocus)?.description}
                  </p>
                )}
              </div>

              <div className="flex items-end">
                <Button 
                  onClick={handleGenerateInsight} 
                  disabled={!selectedFocus || generatingInsight}
                  className="w-full"
                >
                  {generatingInsight ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Insight
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Focus Area Cards */}
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
          {FOCUS_AREAS.map((area) => {
            const Icon = area.icon;
            return (
              <Card 
                key={area.value}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedFocus(area.value)}
              >
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center space-y-2">
                    <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-sm">{area.label}</h3>
                    <p className="text-xs text-muted-foreground">{area.description}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Career Insights */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Your Career Insights</h2>
          
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-4">Loading insights...</p>
            </div>
          ) : insights && insights.length > 0 ? (
            <div className="space-y-4">
              {insights.map((insight) => {
                const Icon = getInsightIcon(insight.insightType);
                return (
                  <Card 
                    key={insight.id}
                    className={`${!insight.isRead ? 'border-primary/50 bg-primary/5' : ''}`}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                            <Icon className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <CardTitle className="text-lg">{insight.title}</CardTitle>
                              {!insight.isRead && (
                                <Badge variant="default">New</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">
                                {insight.insightType.replace(/_/g, " ")}
                              </Badge>
                              <Badge variant={getPriorityColor(insight.priority)}>
                                {insight.priority} priority
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {new Date(insight.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        {!insight.isRead && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleMarkRead(insight.id)}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Mark Read
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-sm max-w-none">
                        <Streamdown>{insight.content}</Streamdown>
                      </div>

                      {/* Action Items */}
                      {insight.actionItems && insight.actionItems.length > 0 && (
                        <div className="mt-4 p-4 bg-muted rounded-lg">
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <Target className="h-4 w-4" />
                            Action Items
                          </h4>
                          <ul className="space-y-2">
                            {insight.actionItems.map((item, index) => (
                              <li key={index} className="flex items-start gap-2 text-sm">
                                <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Insights Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Generate your first career insight using the form above
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
