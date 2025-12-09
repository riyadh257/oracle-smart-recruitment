import { getDb } from "./db";
import { emailAbTestsV2, abTestVariantResults, users } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { sendNotification } from "./notificationService";
import { notifyOwner } from "./_core/notification";

/**
 * Calculate statistical significance for A/B test
 */
function calculateStatisticalSignificance(
  variantA: any,
  variantB: any,
  metric: string
): {
  isSignificant: boolean;
  winner: 'A' | 'B' | null;
  confidenceLevel: number;
  improvement: number;
} {
  if (!variantA || !variantB) {
    return { isSignificant: false, winner: null, confidenceLevel: 0, improvement: 0 };
  }

  const getMetricValue = (variant: any) => {
    switch (metric) {
      case 'open_rate':
        return variant.sentCount > 0 ? variant.openCount / variant.sentCount : 0;
      case 'click_rate':
        return variant.sentCount > 0 ? variant.clickCount / variant.sentCount : 0;
      case 'conversion_rate':
        return variant.sentCount > 0 ? variant.conversionCount / variant.sentCount : 0;
      default:
        return 0;
    }
  };

  const rateA = getMetricValue(variantA);
  const rateB = getMetricValue(variantB);
  const nA = variantA.sentCount || 0;
  const nB = variantB.sentCount || 0;

  // Need minimum sample size
  if (nA < 30 || nB < 30) {
    return { isSignificant: false, winner: null, confidenceLevel: 0, improvement: 0 };
  }

  // Calculate z-score for two proportions
  const pooledRate = ((rateA * nA) + (rateB * nB)) / (nA + nB);
  const se = Math.sqrt(pooledRate * (1 - pooledRate) * (1/nA + 1/nB));
  
  if (se === 0) {
    return { isSignificant: false, winner: null, confidenceLevel: 0, improvement: 0 };
  }

  const zScore = Math.abs(rateA - rateB) / se;
  
  // 95% confidence level (z-score > 1.96)
  const isSignificant = zScore > 1.96;
  const winner = isSignificant ? (rateA > rateB ? 'A' : 'B') : null;
  const confidenceLevel = isSignificant ? 95 : Math.min(90, Math.round((zScore / 1.96) * 95));
  
  const improvement = winner === 'A' 
    ? ((rateA - rateB) / rateB) * 100 
    : winner === 'B' 
      ? ((rateB - rateA) / rateA) * 100 
      : 0;

  return { isSignificant, winner, confidenceLevel, improvement };
}

/**
 * Automatically analyze all active A/B tests and notify when winners are determined
 */
export async function autoAnalyzeTests(): Promise<{
  analyzed: number;
  winnersFound: number;
  notificationsSent: number;
}> {
  const db = await getDb();
  if (!db) {
    console.error("[A/B Test Auto-Analyze] Database unavailable");
    return { analyzed: 0, winnersFound: 0, notificationsSent: 0 };
  }

  try {
    // Get all active tests that don't have a winner yet
    const activeTests = await db
      .select()
      .from(emailAbTestsV2)
      .where(
        and(
          eq(emailAbTestsV2.status, 'active'),
          eq(emailAbTestsV2.winnerVariant, 'no_winner')
        )
      );

    let analyzed = 0;
    let winnersFound = 0;
    let notificationsSent = 0;

    for (const test of activeTests) {
      analyzed++;

      // Get variant results
      const results = await db
        .select()
        .from(abTestVariantResults)
        .where(eq(abTestVariantResults.testId, test.id));

      const variantA = results.find(r => r.variant === 'A');
      const variantB = results.find(r => r.variant === 'B');

      if (!variantA || !variantB) continue;

      // Calculate statistical significance
      const significance = calculateStatisticalSignificance(
        variantA, 
        variantB, 
        test.primaryMetric
      );

      // If we have a statistically significant winner
      if (significance.isSignificant && significance.winner) {
        winnersFound++;

        // Update test with winner
        await db.update(emailAbTestsV2)
          .set({
            status: 'completed',
            completedAt: new Date().toISOString(),
            winnerVariant: significance.winner,
            winnerDeterminedAt: new Date().toISOString(),
          })
          .where(eq(emailAbTestsV2.id, test.id));

        // Get test owner
        const [owner] = await db
          .select()
          .from(users)
          .where(eq(users.id, test.userId))
          .limit(1);

        if (owner) {
          // Send notification to test owner
          const winnerVariant = significance.winner === 'A' ? variantA : variantB;
          const loserVariant = significance.winner === 'A' ? variantB : variantA;

          const metricName = test.primaryMetric.replace('_', ' ');
          const winnerRate = test.primaryMetric === 'open_rate' 
            ? (winnerVariant.openCount / winnerVariant.sentCount * 100).toFixed(1)
            : test.primaryMetric === 'click_rate'
              ? (winnerVariant.clickCount / winnerVariant.sentCount * 100).toFixed(1)
              : (winnerVariant.conversionCount / winnerVariant.sentCount * 100).toFixed(1);

          const message = `Variant ${significance.winner} is the winner with ${significance.confidenceLevel}% confidence! ` +
            `${metricName}: ${winnerRate}%, improvement: ${significance.improvement.toFixed(1)}%`;

          try {
            await sendNotification({
              userId: test.userId,
              type: 'ab_test_result',
              title: `A/B Test Winner Determined: ${test.testName}`,
              message,
              actionUrl: `/ab-test-dashboard?testId=${test.id}`,
              priority: 'high',
              relatedEntityType: 'ab_test',
              relatedEntityId: test.id,
              metadata: {
                testId: test.id,
                testName: test.testName,
                winner: significance.winner,
                confidenceLevel: significance.confidenceLevel,
                improvement: significance.improvement,
              },
            });

            // Also notify owner via email
            await notifyOwner({
              title: `A/B Test Winner: ${test.testName}`,
              content: `Test "${test.testName}" has a statistically significant winner!\n\n` +
                `Winner: Variant ${significance.winner}\n` +
                `Confidence: ${significance.confidenceLevel}%\n` +
                `Improvement: ${significance.improvement.toFixed(1)}%\n` +
                `Metric: ${metricName} - ${winnerRate}%\n\n` +
                `View details: /ab-test-dashboard?testId=${test.id}`,
            });

            notificationsSent++;
          } catch (error) {
            console.error(`[A/B Test Auto-Analyze] Failed to send notification for test ${test.id}:`, error);
          }
        }
      }
    }

    console.log(`[A/B Test Auto-Analyze] Analyzed: ${analyzed}, Winners Found: ${winnersFound}, Notifications Sent: ${notificationsSent}`);
    return { analyzed, winnersFound, notificationsSent };

  } catch (error) {
    console.error("[A/B Test Auto-Analyze] Error:", error);
    return { analyzed: 0, winnersFound: 0, notificationsSent: 0 };
  }
}

/**
 * Manually trigger winner notification for a specific test
 */
export async function notifyTestWinner(testId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    const [test] = await db
      .select()
      .from(emailAbTestsV2)
      .where(eq(emailAbTestsV2.id, testId))
      .limit(1);

    if (!test || test.winnerVariant === 'no_winner') {
      return false;
    }

    const results = await db
      .select()
      .from(abTestVariantResults)
      .where(eq(abTestVariantResults.testId, testId));

    const winner = results.find(r => r.variant === test.winnerVariant);
    if (!winner) return false;

    const metricName = test.primaryMetric.replace('_', ' ');
    const winnerRate = test.primaryMetric === 'open_rate' 
      ? (winner.openCount / winner.sentCount * 100).toFixed(1)
      : test.primaryMetric === 'click_rate'
        ? (winner.clickCount / winner.sentCount * 100).toFixed(1)
        : (winner.conversionCount / winner.sentCount * 100).toFixed(1);

    await sendNotification({
      userId: test.userId,
      type: 'ab_test_result',
      title: `A/B Test Complete: ${test.testName}`,
      message: `Variant ${test.winnerVariant} won with ${metricName}: ${winnerRate}%`,
      actionUrl: `/ab-test-dashboard?testId=${testId}`,
      priority: 'high',
      relatedEntityType: 'ab_test',
      relatedEntityId: testId,
    });

    return true;
  } catch (error) {
    console.error(`[A/B Test Notification] Error for test ${testId}:`, error);
    return false;
  }
}
