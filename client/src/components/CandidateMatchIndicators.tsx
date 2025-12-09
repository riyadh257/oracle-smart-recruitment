import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Heart, Brain, TrendingUp } from "lucide-react";

interface CandidateMatchIndicatorsProps {
  cultureFitScore?: number;
  wellbeingMatchScore?: number;
  overallMatchScore?: number;
  compact?: boolean;
}

/**
 * Compact visualization of candidate matching scores
 * Displays culture fit, wellbeing compatibility, and overall match as badges
 */
export function CandidateMatchIndicators({
  cultureFitScore,
  wellbeingMatchScore,
  overallMatchScore,
  compact = true,
}: CandidateMatchIndicatorsProps) {
  const getScoreColor = (score: number): string => {
    if (score >= 80) return "bg-green-100 text-green-800 border-green-300";
    if (score >= 60) return "bg-blue-100 text-blue-800 border-blue-300";
    if (score >= 40) return "bg-yellow-100 text-yellow-800 border-yellow-300";
    return "bg-red-100 text-red-800 border-red-300";
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Poor";
  };

  if (!cultureFitScore && !wellbeingMatchScore && !overallMatchScore) {
    return (
      <div className="flex gap-2 items-center text-sm text-muted-foreground">
        <span>No match data available</span>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex gap-2 items-center flex-wrap">
        {overallMatchScore !== undefined && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="outline"
                className={`${getScoreColor(overallMatchScore)} border flex items-center gap-1`}
              >
                <TrendingUp className="h-3 w-3" />
                {overallMatchScore}%
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-semibold">Overall Match</p>
              <p className="text-sm">{getScoreLabel(overallMatchScore)} compatibility</p>
            </TooltipContent>
          </Tooltip>
        )}

        {cultureFitScore !== undefined && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="outline"
                className={`${getScoreColor(cultureFitScore)} border flex items-center gap-1`}
              >
                <Brain className="h-3 w-3" />
                {cultureFitScore}%
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-semibold">Culture Fit</p>
              <p className="text-sm">{getScoreLabel(cultureFitScore)} cultural alignment</p>
            </TooltipContent>
          </Tooltip>
        )}

        {wellbeingMatchScore !== undefined && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="outline"
                className={`${getScoreColor(wellbeingMatchScore)} border flex items-center gap-1`}
              >
                <Heart className="h-3 w-3" />
                {wellbeingMatchScore}%
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-semibold">Wellbeing Match</p>
              <p className="text-sm">{getScoreLabel(wellbeingMatchScore)} wellbeing compatibility</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    );
  }

  // Expanded view with labels
  return (
    <div className="grid grid-cols-3 gap-3">
      {overallMatchScore !== undefined && (
        <div className="flex flex-col items-center gap-1">
          <div className={`${getScoreColor(overallMatchScore)} px-3 py-2 rounded-lg border text-center w-full`}>
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="font-bold text-lg">{overallMatchScore}%</span>
            </div>
            <p className="text-xs">Overall</p>
          </div>
        </div>
      )}

      {cultureFitScore !== undefined && (
        <div className="flex flex-col items-center gap-1">
          <div className={`${getScoreColor(cultureFitScore)} px-3 py-2 rounded-lg border text-center w-full`}>
            <div className="flex items-center justify-center gap-1 mb-1">
              <Brain className="h-4 w-4" />
              <span className="font-bold text-lg">{cultureFitScore}%</span>
            </div>
            <p className="text-xs">Culture</p>
          </div>
        </div>
      )}

      {wellbeingMatchScore !== undefined && (
        <div className="flex flex-col items-center gap-1">
          <div className={`${getScoreColor(wellbeingMatchScore)} px-3 py-2 rounded-lg border text-center w-full`}>
            <div className="flex items-center justify-center gap-1 mb-1">
              <Heart className="h-4 w-4" />
              <span className="font-bold text-lg">{wellbeingMatchScore}%</span>
            </div>
            <p className="text-xs">Wellbeing</p>
          </div>
        </div>
      )}
    </div>
  );
}
