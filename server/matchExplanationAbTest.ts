import { eq, and, gte, sql } from "drizzle-orm";
import { getDb } from "./db";

/**
 * A/B Testing Framework for Match Explanation Display Formats
 * Tracks which explanation format drives highest click-through and application conversion rates
 */

export interface MatchExplanationVariant {
  id: string;
  name: string;
  description: string;
  format: "compact" | "detailed" | "visual" | "bullet_points";
}

export const MATCH_EXPLANATION_VARIANTS: MatchExplanationVariant[] = [
  {
    id: "variant_a_compact",
    name: "Compact Summary",
    description: "Single paragraph summary with key highlights",
    format: "compact",
  },
  {
    id: "variant_b_detailed",
    name: "Detailed Breakdown",
    description: "Multi-section breakdown with scores and explanations",
    format: "detailed",
  },
  {
    id: "variant_c_visual",
    name: "Visual Cards",
    description: "Card-based layout with icons and visual indicators",
    format: "visual",
  },
  {
    id: "variant_d_bullets",
    name: "Bullet Points",
    description: "Concise bullet-point list of match reasons",
    format: "bullet_points",
  },
];

export interface AbTestAssignment {
  userId: number;
  variantId: string;
  assignedAt: Date;
}

export interface AbTestEvent {
  userId: number;
  variantId: string;
  jobId: number;
  eventType: "view" | "click" | "apply";
  timestamp: Date;
}

export interface AbTestResults {
  variantId: string;
  variantName: string;
  impressions: number;
  clicks: number;
  applications: number;
  clickThroughRate: number;
  applicationConversionRate: number;
}

/**
 * Assign a user to an A/B test variant (consistent hashing)
 */
export function assignVariant(userId: number): string {
  // Use simple modulo for consistent assignment
  const variantIndex = userId % MATCH_EXPLANATION_VARIANTS.length;
  return MATCH_EXPLANATION_VARIANTS[variantIndex].id;
}

/**
 * Get variant assignment for a user
 */
export function getUserVariant(userId: number): MatchExplanationVariant {
  const variantId = assignVariant(userId);
  return (
    MATCH_EXPLANATION_VARIANTS.find((v) => v.id === variantId) ||
    MATCH_EXPLANATION_VARIANTS[0]
  );
}

/**
 * Track A/B test event
 */
export async function trackAbTestEvent(event: AbTestEvent): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    // Store event in a simple tracking table (we'll create this in schema)
    // For now, we'll use a JSON column in a generic events table
    await db.execute(sql`
      INSERT INTO ab_test_events (user_id, variant_id, job_id, event_type, created_at)
      VALUES (${event.userId}, ${event.variantId}, ${event.jobId}, ${event.eventType}, ${event.timestamp.toISOString()})
      ON DUPLICATE KEY UPDATE created_at = VALUES(created_at)
    `);
  } catch (error) {
    console.error("[A/B Test] Error tracking event:", error);
  }
}

/**
 * Get A/B test results for all variants
 */
export async function getAbTestResults(
  startDate?: Date,
  endDate?: Date
): Promise<AbTestResults[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    const dateFilter = startDate && endDate
      ? sql`AND created_at >= ${startDate.toISOString()} AND created_at <= ${endDate.toISOString()}`
      : sql``;

    const results = await db.execute(sql`
      SELECT 
        variant_id,
        COUNT(DISTINCT CASE WHEN event_type = 'view' THEN CONCAT(user_id, '-', job_id) END) as impressions,
        COUNT(DISTINCT CASE WHEN event_type = 'click' THEN CONCAT(user_id, '-', job_id) END) as clicks,
        COUNT(DISTINCT CASE WHEN event_type = 'apply' THEN CONCAT(user_id, '-', job_id) END) as applications
      FROM ab_test_events
      WHERE 1=1 ${dateFilter}
      GROUP BY variant_id
    `);

    const abTestResults: AbTestResults[] = [];

    for (const row of results.rows as any[]) {
      const variant = MATCH_EXPLANATION_VARIANTS.find((v) => v.id === row.variant_id);
      if (!variant) continue;

      const impressions = parseInt(row.impressions) || 0;
      const clicks = parseInt(row.clicks) || 0;
      const applications = parseInt(row.applications) || 0;

      const clickThroughRate = impressions > 0 ? (clicks / impressions) * 100 : 0;
      const applicationConversionRate = clicks > 0 ? (applications / clicks) * 100 : 0;

      abTestResults.push({
        variantId: variant.id,
        variantName: variant.name,
        impressions,
        clicks,
        applications,
        clickThroughRate: Math.round(clickThroughRate * 100) / 100,
        applicationConversionRate: Math.round(applicationConversionRate * 100) / 100,
      });
    }

    return abTestResults;
  } catch (error) {
    console.error("[A/B Test] Error getting results:", error);
    return [];
  }
}

/**
 * Calculate statistical significance between two variants
 */
export function calculateStatisticalSignificance(
  variant1: AbTestResults,
  variant2: AbTestResults
): { isSignificant: boolean; pValue: number; confidenceLevel: number } {
  // Simplified chi-square test for conversion rates
  const n1 = variant1.impressions;
  const n2 = variant2.impressions;
  const p1 = variant1.clickThroughRate / 100;
  const p2 = variant2.clickThroughRate / 100;

  if (n1 === 0 || n2 === 0) {
    return { isSignificant: false, pValue: 1, confidenceLevel: 0 };
  }

  // Pooled proportion
  const pPool = ((n1 * p1) + (n2 * p2)) / (n1 + n2);

  // Standard error
  const se = Math.sqrt(pPool * (1 - pPool) * (1 / n1 + 1 / n2));

  // Z-score
  const z = Math.abs((p1 - p2) / se);

  // Approximate p-value (two-tailed)
  const pValue = 2 * (1 - normalCDF(z));

  // Confidence level
  const confidenceLevel = (1 - pValue) * 100;

  // Significant if p < 0.05 (95% confidence)
  const isSignificant = pValue < 0.05;

  return {
    isSignificant,
    pValue: Math.round(pValue * 10000) / 10000,
    confidenceLevel: Math.round(confidenceLevel * 100) / 100,
  };
}

/**
 * Normal CDF approximation (for p-value calculation)
 */
function normalCDF(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp(-z * z / 2);
  const prob =
    d *
    t *
    (0.3193815 +
      t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return z > 0 ? 1 - prob : prob;
}
