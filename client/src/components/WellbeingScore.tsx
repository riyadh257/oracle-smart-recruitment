import { AlertCircle, TrendingDown, TrendingUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface WellbeingScoreProps {
  score: number;
  burnoutRisk: number;
  factors: {
    workLifeBalance: number;
    stressTolerance: number;
    growthMindset: number;
    autonomyPreference: number;
    socialNeeds: number;
    meaningPurpose: number;
    flexibilityNeeds: number;
    recognitionNeeds: number;
  };
  gaps?: Array<{
    factor: string;
    candidateScore: number;
    companyScore: number;
    gap: number;
    recommendation: string;
  }>;
  className?: string;
}

export default function WellbeingScore({
  score,
  burnoutRisk,
  factors,
  gaps = [],
  className = '',
}: WellbeingScoreProps) {
  const getScoreColor = (value: number) => {
    if (value >= 80) return 'text-green-600';
    if (value >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (value: number) => {
    if (value >= 80) return 'bg-green-100';
    if (value >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getRiskLevel = (risk: number) => {
    if (risk >= 70) return { label: 'High', color: 'text-red-600', icon: TrendingUp };
    if (risk >= 40) return { label: 'Medium', color: 'text-yellow-600', icon: TrendingUp };
    return { label: 'Low', color: 'text-green-600', icon: TrendingDown };
  };

  const riskLevel = getRiskLevel(burnoutRisk);
  const RiskIcon = riskLevel.icon;

  const factorLabels: Record<keyof typeof factors, string> = {
    workLifeBalance: 'Work-Life Balance',
    stressTolerance: 'Stress Tolerance',
    growthMindset: 'Growth Mindset',
    autonomyPreference: 'Autonomy',
    socialNeeds: 'Social Needs',
    meaningPurpose: 'Meaning & Purpose',
    flexibilityNeeds: 'Flexibility',
    recognitionNeeds: 'Recognition',
  };

  return (
    <div className={`bg-white rounded-lg border p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Wellbeing Compatibility</h3>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">Overall Score</div>
          <div className={`text-2xl font-bold ${getScoreColor(score)}`}>
            {score.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Burnout Risk Indicator */}
      <div className={`rounded-lg p-3 mb-4 ${getScoreBgColor(100 - burnoutRisk)}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RiskIcon className={`h-5 w-5 ${riskLevel.color}`} />
            <span className="font-medium">Burnout Risk</span>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <span className={`text-lg font-bold ${riskLevel.color}`}>
                  {riskLevel.label}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Risk Score: {burnoutRisk.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Based on workload, stress factors, and recovery needs
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Wellbeing Factors */}
      <div className="space-y-3 mb-4">
        <h4 className="text-sm font-medium text-muted-foreground">Wellbeing Factors</h4>
        {Object.entries(factors).map(([key, value]) => (
          <div key={key} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span>{factorLabels[key as keyof typeof factors]}</span>
              <span className={`font-medium ${getScoreColor(value)}`}>
                {value.toFixed(1)}/10
              </span>
            </div>
            <Progress value={value * 10} className="h-2" />
          </div>
        ))}
      </div>

      {/* Compatibility Gaps */}
      {gaps.length > 0 && (
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Key Compatibility Gaps
          </h4>
          <div className="space-y-3">
            {gaps.slice(0, 3).map((gap, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{gap.factor}</span>
                  <span className="text-xs text-muted-foreground">
                    Gap: {Math.abs(gap.gap).toFixed(1)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{gap.recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
