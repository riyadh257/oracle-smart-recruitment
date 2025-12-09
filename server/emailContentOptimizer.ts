/**
 * AI-Powered Email Content Optimizer
 * Use AI to suggest improvements for email content based on historical performance
 */

import { getDb } from "./db";
import { invokeLLM } from "./_core/llm";

export interface ContentOptimization {
  subjectLineVariations: string[];
  contentImprovements: string[];
  optimalSendTime: {
    dayOfWeek: string;
    hour: number;
    confidence: number;
  };
  abTestSuggestions: Array<{
    element: string;
    variants: string[];
    rationale: string;
  }>;
  performancePrediction: {
    openRateEstimate: number;
    clickRateEstimate: number;
    confidence: string;
  };
}

/**
 * Analyze historical email performance
 */
async function getHistoricalPerformance(employerId: number): Promise<{
  topPerformingSubjects: Array<{ subject: string; openRate: number; clickRate: number }>;
  avgOpenRate: number;
  avgClickRate: number;
  bestSendTimes: Array<{ dayOfWeek: string; hour: number; avgOpenRate: number }>;
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get top performing subjects
  const [topSubjects] = await db.execute(
    `SELECT subject, openRate, clickRate
     FROM emailAnalytics
     WHERE employerId = ? AND openRate > 0
     ORDER BY openRate DESC, clickRate DESC
     LIMIT 10`,
    [employerId]
  ) as any;

  // Get average rates
  const [avgRates] = await db.execute(
    `SELECT AVG(openRate) as avgOpenRate, AVG(clickRate) as avgClickRate
     FROM emailAnalytics
     WHERE employerId = ?`,
    [employerId]
  ) as any;

  // Get best send times
  const [sendTimes] = await db.execute(
    `SELECT 
       DAYNAME(sentAt) as dayOfWeek,
       HOUR(sentAt) as hour,
       AVG(openRate) as avgOpenRate
     FROM emailAnalytics
     WHERE employerId = ? AND openRate > 0
     GROUP BY dayOfWeek, hour
     ORDER BY avgOpenRate DESC
     LIMIT 5`,
    [employerId]
  ) as any;

  return {
    topPerformingSubjects: topSubjects || [],
    avgOpenRate: avgRates[0]?.avgOpenRate || 0,
    avgClickRate: avgRates[0]?.avgClickRate || 0,
    bestSendTimes: sendTimes || [],
  };
}

/**
 * Generate content optimization suggestions using AI
 */
export async function optimizeEmailContent(
  employerId: number,
  currentSubject: string,
  currentContent: string,
  emailType: string = "general"
): Promise<ContentOptimization> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get historical performance data
  const historical = await getHistoricalPerformance(employerId);

  // Build context for AI
  const context = `
Historical Performance Data:
- Average Open Rate: ${historical.avgOpenRate.toFixed(1)}%
- Average Click Rate: ${historical.avgClickRate.toFixed(1)}%

Top Performing Subject Lines:
${historical.topPerformingSubjects
  .slice(0, 5)
  .map((s, i) => `${i + 1}. "${s.subject}" (Open: ${s.openRate.toFixed(1)}%, Click: ${s.clickRate.toFixed(1)}%)`)
  .join("\n")}

Best Send Times:
${historical.bestSendTimes
  .slice(0, 3)
  .map((t, i) => `${i + 1}. ${t.dayOfWeek} at ${t.hour}:00 (Open: ${t.avgOpenRate.toFixed(1)}%)`)
  .join("\n")}

Current Email:
Subject: ${currentSubject}
Content: ${currentContent.substring(0, 500)}...
Type: ${emailType}

Please provide optimization suggestions.
`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "You are an expert email marketing optimizer specializing in recruitment communications. Provide actionable, data-driven suggestions.",
        },
        { role: "user", content: context },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "email_optimization",
          strict: true,
          schema: {
            type: "object",
            properties: {
              subjectLineVariations: {
                type: "array",
                items: { type: "string" },
                description: "5 improved subject line variations",
              },
              contentImprovements: {
                type: "array",
                items: { type: "string" },
                description: "3-5 specific content improvement suggestions",
              },
              optimalSendTime: {
                type: "object",
                properties: {
                  dayOfWeek: { type: "string" },
                  hour: { type: "number" },
                  confidence: { type: "number" },
                },
                required: ["dayOfWeek", "hour", "confidence"],
              },
              abTestSuggestions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    element: { type: "string" },
                    variants: {
                      type: "array",
                      items: { type: "string" },
                    },
                    rationale: { type: "string" },
                  },
                  required: ["element", "variants", "rationale"],
                },
              },
              performancePrediction: {
                type: "object",
                properties: {
                  openRateEstimate: { type: "number" },
                  clickRateEstimate: { type: "number" },
                  confidence: { type: "string" },
                },
                required: ["openRateEstimate", "clickRateEstimate", "confidence"],
              },
            },
            required: [
              "subjectLineVariations",
              "contentImprovements",
              "optimalSendTime",
              "abTestSuggestions",
              "performancePrediction",
            ],
            additionalProperties: false,
          },
        },
      },
    });

    const optimization = JSON.parse(response.choices[0].message.content);
    return optimization;
  } catch (error) {
    console.error("[Content Optimizer] AI analysis failed:", error);
    // Fallback to basic suggestions
    return {
      subjectLineVariations: [
        currentSubject,
        `${currentSubject} - Limited Time`,
        `Quick Update: ${currentSubject}`,
        `${currentSubject} | Important`,
        `Re: ${currentSubject}`,
      ],
      contentImprovements: [
        "Add a clear call-to-action button",
        "Personalize with candidate name and details",
        "Keep paragraphs short (2-3 sentences max)",
        "Include social proof or testimonials",
        "Add urgency with deadline or limited availability",
      ],
      optimalSendTime: {
        dayOfWeek: historical.bestSendTimes[0]?.dayOfWeek || "Tuesday",
        hour: historical.bestSendTimes[0]?.hour || 10,
        confidence: 0.7,
      },
      abTestSuggestions: [
        {
          element: "Subject Line",
          variants: [currentSubject, `${currentSubject} - Action Required`],
          rationale: "Test urgency vs. neutral tone",
        },
      ],
      performancePrediction: {
        openRateEstimate: historical.avgOpenRate || 25,
        clickRateEstimate: historical.avgClickRate || 5,
        confidence: "medium",
      },
    };
  }
}

/**
 * Analyze subject line effectiveness
 */
export async function analyzeSubjectLine(
  employerId: number,
  subjectLine: string
): Promise<{
  score: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const historical = await getHistoricalPerformance(employerId);

  const prompt = `Analyze this email subject line for a recruitment email:

Subject: "${subjectLine}"

Historical Context:
- Average open rate: ${historical.avgOpenRate.toFixed(1)}%
- Top performing subjects use these patterns: ${historical.topPerformingSubjects
    .slice(0, 3)
    .map((s) => `"${s.subject}"`)
    .join(", ")}

Provide a detailed analysis.`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are an email subject line expert. Analyze effectiveness for recruitment emails.",
        },
        { role: "user", content: prompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "subject_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              score: {
                type: "number",
                description: "Score from 0-100",
              },
              strengths: {
                type: "array",
                items: { type: "string" },
                description: "What works well",
              },
              weaknesses: {
                type: "array",
                items: { type: "string" },
                description: "What could be improved",
              },
              suggestions: {
                type: "array",
                items: { type: "string" },
                description: "Specific improvement suggestions",
              },
            },
            required: ["score", "strengths", "weaknesses", "suggestions"],
            additionalProperties: false,
          },
        },
      },
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error("[Subject Analyzer] AI analysis failed:", error);
    return {
      score: 50,
      strengths: ["Clear and professional"],
      weaknesses: ["Could be more engaging"],
      suggestions: ["Add personalization", "Create urgency", "Use action words"],
    };
  }
}

/**
 * Get send time recommendations
 */
export async function getSendTimeRecommendations(employerId: number): Promise<
  Array<{
    dayOfWeek: string;
    hour: number;
    avgOpenRate: number;
    avgClickRate: number;
    emailsSent: number;
    recommendation: string;
  }>
> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [results] = await db.execute(
    `SELECT 
       DAYNAME(sentAt) as dayOfWeek,
       HOUR(sentAt) as hour,
       AVG(openRate) as avgOpenRate,
       AVG(clickRate) as avgClickRate,
       COUNT(*) as emailsSent
     FROM emailAnalytics
     WHERE employerId = ? AND openRate > 0
     GROUP BY dayOfWeek, hour
     HAVING emailsSent >= 5
     ORDER BY avgOpenRate DESC, avgClickRate DESC
     LIMIT 10`,
    [employerId]
  ) as any;

  return results.map((r: any, index: number) => ({
    ...r,
    recommendation:
      index === 0
        ? "Best time - highest engagement"
        : index < 3
        ? "Excellent time - strong performance"
        : "Good time - above average performance",
  }));
}
