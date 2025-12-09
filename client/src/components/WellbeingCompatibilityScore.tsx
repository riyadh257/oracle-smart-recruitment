import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Heart, TrendingUp, Smile, Brain, Battery, Users, Target, AlertTriangle } from "lucide-react";

interface WellbeingScore {
  overall: number;
  factors: {
    workLifeBalance: number;
    stressManagement: number;
    growthMindset: number;
    autonomy: number;
    socialConnection: number;
    purposeAlignment: number;
    energyLevel: number;
    emotionalSafety: number;
  };
  burnoutRisk?: number;
  recommendations?: string[];
}

interface WellbeingCompatibilityScoreProps {
  score: WellbeingScore;
  compact?: boolean;
}

export function WellbeingCompatibilityScore({ score, compact = false }: WellbeingCompatibilityScoreProps) {
  const getScoreColor = (value: number) => {
    if (value >= 80) return "text-green-600";
    if (value >= 60) return "text-blue-600";
    if (value >= 40) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadge = (value: number) => {
    if (value >= 80) return <Badge className="bg-green-500 hover:bg-green-600">Excellent</Badge>;
    if (value >= 60) return <Badge className="bg-blue-500 hover:bg-blue-600">Good</Badge>;
    if (value >= 40) return <Badge className="bg-yellow-500 hover:bg-yellow-600">Fair</Badge>;
    return <Badge variant="destructive">Needs Attention</Badge>;
  };

  const getBurnoutRiskBadge = (risk: number) => {
    if (risk >= 70) return <Badge variant="destructive">High Risk</Badge>;
    if (risk >= 40) return <Badge className="bg-yellow-500 hover:bg-yellow-600">Medium Risk</Badge>;
    return <Badge className="bg-green-500 hover:bg-green-600">Low Risk</Badge>;
  };

  const factors = [
    { key: "workLifeBalance", label: "Work-Life Balance", icon: Heart, value: score.factors.workLifeBalance },
    { key: "stressManagement", label: "Stress Management", icon: Brain, value: score.factors.stressManagement },
    { key: "growthMindset", label: "Growth Mindset", icon: TrendingUp, value: score.factors.growthMindset },
    { key: "autonomy", label: "Autonomy", icon: Target, value: score.factors.autonomy },
    { key: "socialConnection", label: "Social Connection", icon: Users, value: score.factors.socialConnection },
    { key: "purposeAlignment", label: "Purpose Alignment", icon: Smile, value: score.factors.purposeAlignment },
    { key: "energyLevel", label: "Energy Level", icon: Battery, value: score.factors.energyLevel },
    { key: "emotionalSafety", label: "Emotional Safety", icon: Heart, value: score.factors.emotionalSafety },
  ];

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-pink-500" />
            <span className="font-semibold">Wellbeing Compatibility</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-2xl font-bold ${getScoreColor(score.overall)}`}>
              {score.overall}%
            </span>
            {getScoreBadge(score.overall)}
          </div>
        </div>
        
        {score.burnoutRisk !== undefined && score.burnoutRisk > 40 && (
          <div className="flex items-center gap-2 text-sm text-yellow-700 bg-yellow-50 p-2 rounded">
            <AlertTriangle className="h-4 w-4" />
            <span>Burnout Risk: {score.burnoutRisk}%</span>
            {getBurnoutRiskBadge(score.burnoutRisk)}
          </div>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-pink-500" />
              Wellbeing Compatibility
            </CardTitle>
            <CardDescription>
              Assessment of workplace wellbeing factors
            </CardDescription>
          </div>
          <div className="text-right">
            <div className={`text-4xl font-bold ${getScoreColor(score.overall)}`}>
              {score.overall}%
            </div>
            <div className="mt-1">
              {getScoreBadge(score.overall)}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Burnout Risk Alert */}
        {score.burnoutRisk !== undefined && (
          <div className="p-4 bg-gray-50 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className={`h-5 w-5 ${score.burnoutRisk >= 70 ? 'text-red-500' : score.burnoutRisk >= 40 ? 'text-yellow-500' : 'text-green-500'}`} />
                <span className="font-semibold">Burnout Risk Assessment</span>
              </div>
              {getBurnoutRiskBadge(score.burnoutRisk)}
            </div>
            <Progress value={score.burnoutRisk} className="h-2" />
            <p className="text-sm text-muted-foreground">
              {score.burnoutRisk >= 70 
                ? "High burnout risk detected. Immediate intervention recommended."
                : score.burnoutRisk >= 40
                ? "Moderate burnout risk. Monitor workload and stress levels."
                : "Low burnout risk. Wellbeing indicators are healthy."}
            </p>
          </div>
        )}

        {/* Factor Breakdown */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm">Wellbeing Factors</h4>
          {factors.map((factor) => {
            const Icon = factor.icon;
            return (
              <div key={factor.key} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span>{factor.label}</span>
                  </div>
                  <span className={`font-semibold ${getScoreColor(factor.value)}`}>
                    {factor.value}%
                  </span>
                </div>
                <Progress value={factor.value} className="h-1.5" />
              </div>
            );
          })}
        </div>

        {/* Recommendations */}
        {score.recommendations && score.recommendations.length > 0 && (
          <div className="space-y-2 pt-4 border-t">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              Recommendations
            </h4>
            <ul className="space-y-1">
              {score.recommendations.map((rec, idx) => (
                <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
