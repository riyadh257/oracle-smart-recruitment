/**
 * Enhanced A/B Testing Module for Email Campaigns
 * Supports multiple variants, automatic winner selection, and statistical analysis
 */

import { getDb } from "./db";
import {
  emailAbTests,
  emailCampaignVariants,
  campaignPerformanceSnapshots,
  emailAnalytics,
  type EmailAbTest,
  type InsertEmailAbTest,
  type EmailCampaignVariant,
  type InsertEmailCampaignVariant,
  type CampaignPerformanceSnapshot,
  type InsertCampaignPerformanceSnapshot,
} from "../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";

/**
 * Create a new A/B test with multiple variants
 */
export async function createAbTest(
  testData: InsertEmailAbTest,
  variants: Array<{
    variantName: string;
    subjectLine: string;
    emailContent: string;
    trafficAllocation: number;
  }>
): Promise<{ test: EmailAbTest; variants: EmailCampaignVariant[] }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Validate traffic allocation sums to 100
  const totalAllocation = variants.reduce(
    (sum, v) => sum + v.trafficAllocation,
    0
  );
  if (totalAllocation !== 100) {
    throw new Error("Traffic allocation must sum to 100%");
  }

  // Create the test
  const testResult = await db.insert(emailAbTests).values(testData);
  const [test] = await db
    .select()
    .from(emailAbTests)
    .where(eq(emailAbTests.id, Number(testResult[0].insertId)));

  // Create variants
  const createdVariants: EmailCampaignVariant[] = [];
  for (const variant of variants) {
    const variantResult = await db.insert(emailCampaignVariants).values({
      testId: test.id,
      variantName: variant.variantName,
      subjectLine: variant.subjectLine,
      emailContent: variant.emailContent,
      trafficAllocation: variant.trafficAllocation,
      sentCount: 0,
      openCount: 0,
      clickCount: 0,
      replyCount: 0,
      openRate: 0,
      clickRate: 0,
      replyRate: 0,
      conversionCount: 0,
      conversionRate: 0,
      isWinner: false,
    });

    const [createdVariant] = await db
      .select()
      .from(emailCampaignVariants)
      .where(
        eq(emailCampaignVariants.id, Number(variantResult[0].insertId))
      );

    createdVariants.push(createdVariant);
  }

  return { test, variants: createdVariants };
}

/**
 * Get A/B test with all variants
 */
export async function getAbTestWithVariants(
  testId: number
): Promise<{ test: EmailAbTest; variants: EmailCampaignVariant[] } | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [test] = await db
    .select()
    .from(emailAbTests)
    .where(eq(emailAbTests.id, testId));

  if (!test) return null;

  const variants = await db
    .select()
    .from(emailCampaignVariants)
    .where(eq(emailCampaignVariants.testId, testId));

  return { test, variants };
}

/**
 * Get all A/B tests for an employer
 */
export async function getEmployerAbTests(
  employerId: number
): Promise<EmailAbTest[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(emailAbTests)
    .where(eq(emailAbTests.employerId, employerId))
    .orderBy(desc(emailAbTests.createdAt));
}

/**
 * Select variant for sending based on traffic allocation
 */
export async function selectVariantForSending(
  testId: number
): Promise<EmailCampaignVariant | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const variants = await db
    .select()
    .from(emailCampaignVariants)
    .where(eq(emailCampaignVariants.testId, testId));

  if (variants.length === 0) return null;

  // Use weighted random selection based on traffic allocation
  const random = Math.random() * 100;
  let cumulative = 0;

  for (const variant of variants) {
    cumulative += variant.trafficAllocation;
    if (random <= cumulative) {
      return variant;
    }
  }

  // Fallback to first variant
  return variants[0];
}

/**
 * Record email sent for a variant
 */
export async function recordVariantSent(variantId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(emailCampaignVariants)
    .set({
      sentCount: sql`${emailCampaignVariants.sentCount} + 1`,
    })
    .where(eq(emailCampaignVariants.id, variantId));
}

/**
 * Update variant metrics from email analytics
 */
export async function updateVariantMetrics(
  variantId: number
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get the variant to find the test
  const [variant] = await db
    .select()
    .from(emailCampaignVariants)
    .where(eq(emailCampaignVariants.id, variantId));

  if (!variant) return;

  // Calculate metrics from emailAnalytics
  // This is a simplified version - in production you'd link emails to variants
  const openRate =
    variant.sentCount > 0
      ? Math.round((variant.openCount / variant.sentCount) * 100)
      : 0;
  const clickRate =
    variant.sentCount > 0
      ? Math.round((variant.clickCount / variant.sentCount) * 100)
      : 0;
  const replyRate =
    variant.sentCount > 0
      ? Math.round((variant.replyCount / variant.sentCount) * 100)
      : 0;
  const conversionRate =
    variant.sentCount > 0
      ? Math.round((variant.conversionCount / variant.sentCount) * 100)
      : 0;

  await db
    .update(emailCampaignVariants)
    .set({
      openRate,
      clickRate,
      replyRate,
      conversionRate,
    })
    .where(eq(emailCampaignVariants.id, variantId));
}

/**
 * Calculate statistical significance between two variants
 * Using Z-test for proportions
 */
export function calculateStatisticalSignificance(
  variant1: EmailCampaignVariant,
  variant2: EmailCampaignVariant
): {
  pValue: number;
  confidenceLevel: number;
  isSignificant: boolean;
} {
  // Use conversion rate as the primary metric
  const p1 = variant1.conversionRate / 100;
  const p2 = variant2.conversionRate / 100;
  const n1 = variant1.sentCount;
  const n2 = variant2.sentCount;

  // Need minimum sample size
  if (n1 < 30 || n2 < 30) {
    return {
      pValue: 1,
      confidenceLevel: 0,
      isSignificant: false,
    };
  }

  // Pooled proportion
  const pPool =
    (variant1.conversionCount + variant2.conversionCount) / (n1 + n2);

  // Standard error
  const se = Math.sqrt(pPool * (1 - pPool) * (1 / n1 + 1 / n2));

  // Z-score
  const z = Math.abs(p1 - p2) / se;

  // P-value (two-tailed test)
  // Approximation using standard normal distribution
  const pValue = 2 * (1 - normalCDF(z));

  // Confidence level (percentage)
  const confidenceLevel = Math.round((1 - pValue) * 100);

  // Significant if p-value < 0.05 (95% confidence)
  const isSignificant = pValue < 0.05;

  return {
    pValue,
    confidenceLevel,
    isSignificant,
  };
}

/**
 * Normal cumulative distribution function approximation
 */
function normalCDF(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp((-x * x) / 2);
  const prob =
    d *
    t *
    (0.3193815 +
      t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));

  return x > 0 ? 1 - prob : prob;
}

/**
 * Determine winner of A/B test
 */
export async function determineWinner(
  testId: number
): Promise<EmailCampaignVariant | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const variants = await db
    .select()
    .from(emailCampaignVariants)
    .where(eq(emailCampaignVariants.testId, testId))
    .orderBy(desc(emailCampaignVariants.conversionRate));

  if (variants.length < 2) return null;

  const bestVariant = variants[0];
  const secondBest = variants[1];

  // Check statistical significance
  const significance = calculateStatisticalSignificance(
    bestVariant,
    secondBest
  );

  if (significance.isSignificant && significance.confidenceLevel >= 95) {
    // Mark as winner
    await db
      .update(emailCampaignVariants)
      .set({ isWinner: true })
      .where(eq(emailCampaignVariants.id, bestVariant.id));

    // Update test status to completed
    await db
      .update(emailAbTests)
      .set({ status: "completed" })
      .where(eq(emailAbTests.id, testId));

    return bestVariant;
  }

  return null;
}

/**
 * Create performance snapshot for tracking over time
 */
export async function createPerformanceSnapshot(
  testId: number
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const variants = await db
    .select()
    .from(emailCampaignVariants)
    .where(eq(emailCampaignVariants.testId, testId));

  for (const variant of variants) {
    // Calculate statistical significance against other variants
    let maxSignificance = 0;
    for (const otherVariant of variants) {
      if (otherVariant.id !== variant.id) {
        const sig = calculateStatisticalSignificance(variant, otherVariant);
        maxSignificance = Math.max(maxSignificance, sig.confidenceLevel);
      }
    }

    await db.insert(campaignPerformanceSnapshots).values({
      testId,
      variantId: variant.id,
      snapshotDate: new Date(),
      sentCount: variant.sentCount,
      openCount: variant.openCount,
      clickCount: variant.clickCount,
      conversionCount: variant.conversionCount,
      openRate: variant.openRate,
      clickRate: variant.clickRate,
      conversionRate: variant.conversionRate,
      statisticalSignificance: maxSignificance,
    });
  }
}

/**
 * Get performance snapshots for a test
 */
export async function getPerformanceSnapshots(
  testId: number
): Promise<CampaignPerformanceSnapshot[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(campaignPerformanceSnapshots)
    .where(eq(campaignPerformanceSnapshots.testId, testId))
    .orderBy(campaignPerformanceSnapshots.snapshotDate);
}

/**
 * Auto-promote winning variant
 */
export async function autoPromoteWinner(testId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const winner = await determineWinner(testId);

  if (winner) {
    // Update traffic allocation to give winner 100%
    await db
      .update(emailCampaignVariants)
      .set({ trafficAllocation: 100 })
      .where(eq(emailCampaignVariants.id, winner.id));

    // Set other variants to 0%
    await db
      .update(emailCampaignVariants)
      .set({ trafficAllocation: 0 })
      .where(
        and(
          eq(emailCampaignVariants.testId, testId),
          sql`${emailCampaignVariants.id} != ${winner.id}`
        )
      );

    return true;
  }

  return false;
}

/**
 * Get test comparison data
 */
export async function getTestComparison(testId: number): Promise<{
  variants: EmailCampaignVariant[];
  winner: EmailCampaignVariant | null;
  significanceMatrix: { [key: string]: { pValue: number; confidenceLevel: number; isSignificant: boolean } };
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const variants = await db
    .select()
    .from(emailCampaignVariants)
    .where(eq(emailCampaignVariants.testId, testId));

  const winner = variants.find((v) => v.isWinner) || null;

  // Calculate significance between all pairs
  const significanceMatrix: {
    [key: string]: {
      pValue: number;
      confidenceLevel: number;
      isSignificant: boolean;
    };
  } = {};

  for (let i = 0; i < variants.length; i++) {
    for (let j = i + 1; j < variants.length; j++) {
      const key = `${variants[i].variantName}_vs_${variants[j].variantName}`;
      significanceMatrix[key] = calculateStatisticalSignificance(
        variants[i],
        variants[j]
      );
    }
  }

  return {
    variants,
    winner,
    significanceMatrix,
  };
}
