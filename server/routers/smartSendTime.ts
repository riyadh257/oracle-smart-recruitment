import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { 
  workflowAnalytics,
  conversionEvents,
  campaignSends,
  candidates
} from "../../drizzle/schema";
import { eq, and, sql, gte, desc } from "drizzle-orm";

interface SendTimeData {
  hour: number;
  dayOfWeek: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
  sampleSize: number;
}

interface CandidateSegment {
  industry?: string;
  experienceLevel?: string;
  location?: string;
}

export const smartSendTimeRouter = router({
  // Get optimal send time for a candidate segment
  getOptimalSendTime: protectedProcedure
    .input(
      z.object({
        segment: z.object({
          industry: z.string().optional(),
          experienceLevel: z.string().optional(),
          location: z.string().optional(),
        }).optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Analyze historical send time performance
      const sendTimeAnalysis = await analyzeSendTimePerformance(db, input.segment);

      // Use ML-inspired scoring to find optimal time
      const optimalTime = findOptimalSendTime(sendTimeAnalysis);

      return {
        recommendedHour: optimalTime.hour,
        recommendedDayOfWeek: optimalTime.dayOfWeek,
        expectedOpenRate: optimalTime.openRate,
        expectedClickRate: optimalTime.clickRate,
        expectedConversionRate: optimalTime.conversionRate,
        confidence: optimalTime.confidence,
        alternativeTimes: optimalTime.alternatives,
        reasoning: optimalTime.reasoning,
      };
    }),

  // Batch predict optimal send times for multiple candidates
  batchPredictSendTimes: protectedProcedure
    .input(
      z.object({
        candidateIds: z.array(z.number()),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const predictions = [];

      for (const candidateId of input.candidateIds) {
        // Get candidate profile
        const [candidate] = await db
          .select()
          .from(candidates)
          .where(eq(candidates.id, candidateId))
          .limit(1);

        if (!candidate) continue;

        // Extract segment from candidate data
        const segment: CandidateSegment = {
          industry: candidate.industry || undefined,
          experienceLevel: candidate.experienceLevel || undefined,
          location: candidate.location || undefined,
        };

        // Get historical performance for this segment
        const sendTimeAnalysis = await analyzeSendTimePerformance(db, segment);
        const optimalTime = findOptimalSendTime(sendTimeAnalysis);

        predictions.push({
          candidateId,
          candidateName: candidate.name,
          recommendedHour: optimalTime.hour,
          recommendedDayOfWeek: optimalTime.dayOfWeek,
          expectedConversionRate: optimalTime.conversionRate,
          confidence: optimalTime.confidence,
        });
      }

      return { predictions };
    }),

  // Get send time performance heatmap
  getSendTimeHeatmap: protectedProcedure
    .input(
      z.object({
        segment: z.object({
          industry: z.string().optional(),
          experienceLevel: z.string().optional(),
          location: z.string().optional(),
        }).optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const sendTimeAnalysis = await analyzeSendTimePerformance(db, input.segment);

      // Create heatmap data structure
      const heatmap = [];
      for (let day = 0; day < 7; day++) {
        for (let hour = 0; hour < 24; hour++) {
          const dataPoint = sendTimeAnalysis.find(
            d => d.hour === hour && d.dayOfWeek === day
          );

          heatmap.push({
            day,
            hour,
            openRate: dataPoint?.openRate || 0,
            clickRate: dataPoint?.clickRate || 0,
            conversionRate: dataPoint?.conversionRate || 0,
            sampleSize: dataPoint?.sampleSize || 0,
          });
        }
      }

      return { heatmap };
    }),

  // Train and update ML model with new data
  updateModel: protectedProcedure
    .mutation(async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // This would be where you'd train a more sophisticated ML model
      // For now, we'll use statistical analysis
      
      // Analyze all segments
      const segments = [
        { industry: "technology" },
        { industry: "healthcare" },
        { industry: "finance" },
        { experienceLevel: "entry" },
        { experienceLevel: "mid" },
        { experienceLevel: "senior" },
      ];

      const modelData = [];

      for (const segment of segments) {
        const analysis = await analyzeSendTimePerformance(db, segment);
        const optimal = findOptimalSendTime(analysis);

        modelData.push({
          segment,
          optimalHour: optimal.hour,
          optimalDay: optimal.dayOfWeek,
          expectedPerformance: optimal.conversionRate,
        });
      }

      return {
        success: true,
        modelVersion: new Date().toISOString(),
        segmentsAnalyzed: modelData.length,
        modelData,
      };
    }),

  // Get personalized send time recommendations
  getPersonalizedRecommendation: protectedProcedure
    .input(z.object({ candidateId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get candidate's historical engagement patterns
      const candidateHistory = await db
        .select({
          sentAt: campaignSends.sentAt,
          openedAt: campaignSends.openedAt,
          clickedAt: campaignSends.clickedAt,
        })
        .from(campaignSends)
        .where(eq(campaignSends.candidateId, input.candidateId))
        .orderBy(desc(campaignSends.sentAt))
        .limit(50);

      if (candidateHistory.length === 0) {
        // No history, use general recommendations
        const [candidate] = await db
          .select()
          .from(candidates)
          .where(eq(candidates.id, input.candidateId))
          .limit(1);

        const segment: CandidateSegment = {
          industry: candidate?.industry || undefined,
          experienceLevel: candidate?.experienceLevel || undefined,
        };

        const analysis = await analyzeSendTimePerformance(db, segment);
        const optimal = findOptimalSendTime(analysis);

        return {
          recommendedHour: optimal.hour,
          recommendedDayOfWeek: optimal.dayOfWeek,
          confidence: "low",
          reasoning: "Based on general segment data (no personal history available)",
        };
      }

      // Analyze candidate's engagement patterns
      const engagementByHour: Record<number, number> = {};
      const engagementByDay: Record<number, number> = {};

      candidateHistory.forEach(record => {
        if (record.openedAt) {
          const openedDate = new Date(record.openedAt);
          const hour = openedDate.getHours();
          const day = openedDate.getDay();

          engagementByHour[hour] = (engagementByHour[hour] || 0) + 1;
          engagementByDay[day] = (engagementByDay[day] || 0) + 1;
        }
      });

      // Find most engaged hour and day
      const bestHour = Object.entries(engagementByHour)
        .sort(([, a], [, b]) => b - a)[0]?.[0] || "9";
      const bestDay = Object.entries(engagementByDay)
        .sort(([, a], [, b]) => b - a)[0]?.[0] || "2";

      return {
        recommendedHour: parseInt(bestHour),
        recommendedDayOfWeek: parseInt(bestDay),
        confidence: "high",
        reasoning: `Based on ${candidateHistory.length} historical interactions with this candidate`,
        personalEngagementPattern: {
          mostActiveHours: Object.entries(engagementByHour)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([hour, count]) => ({ hour: parseInt(hour), engagements: count })),
          mostActiveDays: Object.entries(engagementByDay)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([day, count]) => ({ day: parseInt(day), engagements: count })),
        },
      };
    }),
});

// Helper function: Analyze send time performance from historical data
async function analyzeSendTimePerformance(
  db: any,
  segment?: CandidateSegment
): Promise<SendTimeData[]> {
  // Query historical campaign sends with performance data
  const query = db
    .select({
      sentAt: campaignSends.sentAt,
      openedAt: campaignSends.openedAt,
      clickedAt: campaignSends.clickedAt,
      candidateId: campaignSends.candidateId,
    })
    .from(campaignSends)
    .where(sql`${campaignSends.sentAt} IS NOT NULL`)
    .limit(10000);

  const sends = await query;

  // Group by hour and day of week
  const performanceMap: Record<string, {
    total: number;
    opened: number;
    clicked: number;
    converted: number;
  }> = {};

  for (const send of sends) {
    if (!send.sentAt) continue;

    const sentDate = new Date(send.sentAt);
    const hour = sentDate.getHours();
    const dayOfWeek = sentDate.getDay();
    const key = `${dayOfWeek}-${hour}`;

    if (!performanceMap[key]) {
      performanceMap[key] = { total: 0, opened: 0, clicked: 0, converted: 0 };
    }

    performanceMap[key].total++;
    if (send.openedAt) performanceMap[key].opened++;
    if (send.clickedAt) performanceMap[key].clicked++;
  }

  // Convert to array format
  const results: SendTimeData[] = [];

  Object.entries(performanceMap).forEach(([key, stats]) => {
    const [dayStr, hourStr] = key.split('-');
    const day = parseInt(dayStr);
    const hour = parseInt(hourStr);

    if (stats.total >= 10) { // Minimum sample size
      results.push({
        hour,
        dayOfWeek: day,
        openRate: stats.opened / stats.total,
        clickRate: stats.clicked / stats.total,
        conversionRate: stats.converted / stats.total,
        sampleSize: stats.total,
      });
    }
  });

  return results;
}

// Helper function: Find optimal send time using ML-inspired scoring
function findOptimalSendTime(data: SendTimeData[]): {
  hour: number;
  dayOfWeek: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
  confidence: string;
  alternatives: Array<{ hour: number; dayOfWeek: number; score: number }>;
  reasoning: string;
} {
  if (data.length === 0) {
    // Default recommendation
    return {
      hour: 10,
      dayOfWeek: 2, // Tuesday
      openRate: 0,
      clickRate: 0,
      conversionRate: 0,
      confidence: "low",
      alternatives: [],
      reasoning: "No historical data available. Using industry best practice (Tuesday 10 AM).",
    };
  }

  // Score each time slot using weighted formula
  const scored = data.map(d => ({
    ...d,
    score: (
      d.conversionRate * 0.5 +  // Conversion is most important
      d.clickRate * 0.3 +        // Click rate is secondary
      d.openRate * 0.2           // Open rate is tertiary
    ) * Math.log(d.sampleSize + 1), // Weight by sample size
  }));

  // Sort by score
  scored.sort((a, b) => b.score - a.score);

  const best = scored[0];
  const alternatives = scored.slice(1, 4).map(d => ({
    hour: d.hour,
    dayOfWeek: d.dayOfWeek,
    score: d.score,
  }));

  // Determine confidence based on sample size and score difference
  let confidence = "medium";
  if (best.sampleSize >= 100 && scored.length > 5) {
    confidence = "high";
  } else if (best.sampleSize < 30) {
    confidence = "low";
  }

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const reasoning = `Based on ${data.length} time slots analyzed. ${dayNames[best.dayOfWeek]} at ${best.hour}:00 shows ${(best.conversionRate * 100).toFixed(1)}% conversion rate from ${best.sampleSize} samples.`;

  return {
    hour: best.hour,
    dayOfWeek: best.dayOfWeek,
    openRate: best.openRate,
    clickRate: best.clickRate,
    conversionRate: best.conversionRate,
    confidence,
    alternatives,
    reasoning,
  };
}
