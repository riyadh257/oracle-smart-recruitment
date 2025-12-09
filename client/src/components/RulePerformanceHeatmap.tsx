import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface HeatmapData {
  hour: number;
  day: number;
  dayName: string;
  hourLabel: string;
  executions: number;
  opens: number;
  clicks: number;
  responses: number;
  engagementRate: number;
}

interface RulePerformanceHeatmapProps {
  data: HeatmapData[];
  title?: string;
  description?: string;
}

export default function RulePerformanceHeatmap({
  data,
  title = "Rule Performance Heatmap",
  description = "Engagement rates by time of day and day of week",
}: RulePerformanceHeatmapProps) {
  const maxEngagement = useMemo(() => {
    return Math.max(...data.map((d) => d.engagementRate), 1);
  }, [data]);

  const getColor = (engagementRate: number) => {
    if (engagementRate === 0) return "bg-gray-100";
    
    const intensity = (engagementRate / maxEngagement) * 100;
    
    if (intensity >= 80) return "bg-green-600";
    if (intensity >= 60) return "bg-green-500";
    if (intensity >= 40) return "bg-yellow-500";
    if (intensity >= 20) return "bg-orange-500";
    return "bg-red-500";
  };

  const getTextColor = (engagementRate: number) => {
    if (engagementRate === 0) return "text-gray-600";
    
    const intensity = (engagementRate / maxEngagement) * 100;
    return intensity >= 40 ? "text-white" : "text-gray-900";
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            {/* Header row with hours */}
            <div className="flex mb-2">
              <div className="w-16 flex-shrink-0" />
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="w-12 flex-shrink-0 text-center text-xs font-medium text-gray-600"
                >
                  {hour.toString().padStart(2, "0")}
                </div>
              ))}
            </div>

            {/* Heatmap grid */}
            <TooltipProvider>
              {days.map((dayName, dayIndex) => (
                <div key={dayName} className="flex mb-1">
                  {/* Day label */}
                  <div className="w-16 flex-shrink-0 flex items-center text-sm font-medium text-gray-700">
                    {dayName}
                  </div>

                  {/* Hour cells */}
                  {hours.map((hour) => {
                    const cellData = data.find((d) => d.day === dayIndex && d.hour === hour);
                    const engagementRate = cellData?.engagementRate || 0;
                    const executions = cellData?.executions || 0;

                    return (
                      <Tooltip key={`${dayIndex}-${hour}`}>
                        <TooltipTrigger asChild>
                          <div
                            className={`w-12 h-10 flex-shrink-0 flex items-center justify-center cursor-pointer transition-all hover:scale-110 hover:shadow-lg rounded ${getColor(
                              engagementRate
                            )} ${getTextColor(engagementRate)}`}
                          >
                            {executions > 0 && (
                              <span className="text-xs font-medium">
                                {Math.round(engagementRate / 100)}%
                              </span>
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-sm">
                            <div className="font-semibold mb-1">
                              {dayName} {hour.toString().padStart(2, "0")}:00
                            </div>
                            <div>Executions: {executions}</div>
                            <div>Opens: {cellData?.opens || 0}</div>
                            <div>Clicks: {cellData?.clicks || 0}</div>
                            <div>Responses: {cellData?.responses || 0}</div>
                            <div className="font-medium mt-1">
                              Engagement: {(engagementRate / 100).toFixed(1)}%
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              ))}
            </TooltipProvider>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 flex items-center justify-center gap-4">
          <span className="text-sm text-gray-600">Low</span>
          <div className="flex gap-1">
            <div className="w-8 h-4 bg-gray-100 rounded" />
            <div className="w-8 h-4 bg-red-500 rounded" />
            <div className="w-8 h-4 bg-orange-500 rounded" />
            <div className="w-8 h-4 bg-yellow-500 rounded" />
            <div className="w-8 h-4 bg-green-500 rounded" />
            <div className="w-8 h-4 bg-green-600 rounded" />
          </div>
          <span className="text-sm text-gray-600">High</span>
        </div>
      </CardContent>
    </Card>
  );
}
