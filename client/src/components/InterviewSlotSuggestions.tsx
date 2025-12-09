import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar, Clock, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface InterviewSlotSuggestionsProps {
  durationMinutes?: number;
  onSelectSlot?: (start: string, end: string) => void;
}

export function InterviewSlotSuggestions({
  durationMinutes = 60,
  onSelectSlot,
}: InterviewSlotSuggestionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Array<{
    start: string;
    end: string;
    duration: number;
  }>>([]);

  const fetchSuggestions = async () => {
    setIsLoading(true);
    try {
      const result = await trpc.interviews.suggestSlots.query({
        durationMinutes,
        daysAhead: 7,
        workingHoursStart: 9,
        workingHoursEnd: 17,
        maxSuggestions: 5,
      });
      setSuggestions(result);
      if (result.length === 0) {
        toast.info("No available slots found in the next 7 days");
      }
    } catch (error) {
      toast.error("Failed to fetch suggested slots");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return {
      date: date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
      time: date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  const handleSelectSlot = (start: string, end: string) => {
    if (onSelectSlot) {
      onSelectSlot(start, end);
      toast.success("Time slot selected");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Auto-Suggest Interview Slots
            </CardTitle>
            <CardDescription>
              Find available times based on your Google Calendar
            </CardDescription>
          </div>
          <Button
            onClick={fetchSuggestions}
            disabled={isLoading}
            variant="outline"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <Calendar className="h-4 w-4 mr-2" />
                Find Slots
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {suggestions.length > 0 ? (
          <div className="space-y-2">
            {suggestions.map((slot, index) => {
              const startFormatted = formatDateTime(slot.start);
              const endFormatted = formatDateTime(slot.end);

              return (
                <Card key={index} className="hover:bg-accent/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{startFormatted.date}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {startFormatted.time} - {endFormatted.time}
                            </span>
                          </div>
                        </div>
                        <Badge variant="secondary">{slot.duration} min</Badge>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleSelectSlot(slot.start, slot.end)}
                      >
                        Select
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Click "Find Slots" to see available interview times</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
