/**
 * Multivariate Testing Service
 * Supports testing 3+ variants simultaneously with advanced analytics
 */

import { analyzeAbTestSignificance, type SignificanceResult, type VariantStats } from "./statisticalSignificance";

export interface MultivariateVariant {
  id: string;
  name: string;
  stats: VariantStats;
}

export interface MultivariateComparisonResult {
  variants: MultivariateVariant[];
  pairwiseComparisons: PairwiseComparison[];
  overallWinner: string | null;
  confidenceLevel: 90 | 95 | 99;
  recommendations: string[];
}

export interface PairwiseComparison {
  variantA: string;
  variantB: string;
  significance: SignificanceResult;
}

/**
 * Perform pairwise statistical comparisons between all variants
 */
export function performMultivariateAnalysis(
  variants: MultivariateVariant[],
  metric: "open" | "click" = "open",
  confidenceLevel: 90 | 95 | 99 = 95
): MultivariateComparisonResult {
  if (variants.length < 2) {
    throw new Error("Need at least 2 variants for comparison");
  }

  const pairwiseComparisons: PairwiseComparison[] = [];
  
  // Perform all pairwise comparisons
  for (let i = 0; i < variants.length; i++) {
    for (let j = i + 1; j < variants.length; j++) {
      const variantA = variants[i];
      const variantB = variants[j];
      
      if (!variantA || !variantB) continue;
      
      const significance = analyzeAbTestSignificance(
        variantA.stats,
        variantB.stats,
        metric,
        confidenceLevel
      );
      
      pairwiseComparisons.push({
        variantA: variantA.id,
        variantB: variantB.id,
        significance,
      });
    }
  }
  
  // Determine overall winner using tournament-style comparison
  const overallWinner = determineOverallWinner(variants, pairwiseComparisons, metric);
  
  // Generate recommendations
  const recommendations = generateRecommendations(variants, pairwiseComparisons, overallWinner, metric);
  
  return {
    variants,
    pairwiseComparisons,
    overallWinner,
    confidenceLevel,
    recommendations,
  };
}

/**
 * Determine the overall winner from pairwise comparisons
 */
function determineOverallWinner(
  variants: MultivariateVariant[],
  comparisons: PairwiseComparison[],
  metric: "open" | "click"
): string | null {
  // Count wins for each variant
  const wins: Record<string, number> = {};
  const losses: Record<string, number> = {};
  
  variants.forEach((v: any) => {
    wins[v.id] = 0;
    losses[v.id] = 0;
  });
  
  comparisons.forEach((comp: any) => {
    if (comp.significance.isSignificant && comp.significance.winner) {
      if (comp.significance.winner === "A") {
        wins[comp.variantA] = (wins[comp.variantA] || 0) + 1;
        losses[comp.variantB] = (losses[comp.variantB] || 0) + 1;
      } else if (comp.significance.winner === "B") {
        wins[comp.variantB] = (wins[comp.variantB] || 0) + 1;
        losses[comp.variantA] = (losses[comp.variantA] || 0) + 1;
      }
    }
  });
  
  // Find variant with most wins and fewest losses
  let bestVariant: string | null = null;
  let bestScore = -Infinity;
  
  variants.forEach((v: any) => {
    const score = (wins[v.id] || 0) - (losses[v.id] || 0);
    if (score > bestScore) {
      bestScore = score;
      bestVariant = v.id;
    }
  });
  
  // Only declare winner if they have at least one significant win
  if (bestVariant && (wins[bestVariant] || 0) > 0) {
    return bestVariant;
  }
  
  return null;
}

/**
 * Generate actionable recommendations based on test results
 */
function generateRecommendations(
  variants: MultivariateVariant[],
  comparisons: PairwiseComparison[],
  winner: string | null,
  metric: "open" | "click"
): string[] {
  const recommendations: string[] = [];
  
  // Check if we have enough data
  const minSampleSize = Math.min(...variants.map((v: any) => v.stats.sentCount));
  if (minSampleSize < 100) {
    recommendations.push(`Collect more data: Current minimum sample size is ${minSampleSize}. Aim for at least 100 sends per variant for reliable results.`);
  }
  
  // Check for clear winner
  if (winner) {
    const winnerVariant = variants.find((v: any) => v.id === winner);
    if (winnerVariant) {
      const rate = metric === "open" 
        ? winnerVariant.stats.openRate / 100 
        : winnerVariant.stats.clickRate / 100;
      recommendations.push(`Deploy ${winnerVariant.name}: This variant shows the best performance with a ${rate.toFixed(2)}% ${metric} rate.`);
    }
  } else {
    recommendations.push("No clear winner yet: Continue running the test or increase sample size for more conclusive results.");
  }
  
  // Check for underperformers
  const significantComparisons = comparisons.filter((c: any) => c.significance.isSignificant);
  if (significantComparisons.length > 0) {
    const consistentLosers = findConsistentLosers(variants, significantComparisons);
    if (consistentLosers.length > 0) {
      recommendations.push(`Consider removing underperforming variants: ${consistentLosers.join(", ")} consistently perform worse than others.`);
    }
  }
  
  // Check for similar performers
  const similarPairs = comparisons.filter((c: any) => !c.significance.isSignificant && c.significance.sampleSizeReached);
  if (similarPairs.length > 0 && !winner) {
    recommendations.push("Multiple variants perform similarly: Consider combining best elements from top performers or testing different variables.");
  }
  
  return recommendations;
}

/**
 * Find variants that consistently lose comparisons
 */
function findConsistentLosers(
  variants: MultivariateVariant[],
  significantComparisons: PairwiseComparison[]
): string[] {
  const lossCount: Record<string, number> = {};
  const comparisonCount: Record<string, number> = {};
  
  variants.forEach((v: any) => {
    lossCount[v.id] = 0;
    comparisonCount[v.id] = 0;
  });
  
  significantComparisons.forEach((comp: any) => {
    if (comp.significance.winner === "A") {
      lossCount[comp.variantB] = (lossCount[comp.variantB] || 0) + 1;
      comparisonCount[comp.variantB] = (comparisonCount[comp.variantB] || 0) + 1;
      comparisonCount[comp.variantA] = (comparisonCount[comp.variantA] || 0) + 1;
    } else if (comp.significance.winner === "B") {
      lossCount[comp.variantA] = (lossCount[comp.variantA] || 0) + 1;
      comparisonCount[comp.variantA] = (comparisonCount[comp.variantA] || 0) + 1;
      comparisonCount[comp.variantB] = (comparisonCount[comp.variantB] || 0) + 1;
    }
  });
  
  const losers: string[] = [];
  variants.forEach((v: any) => {
    const totalComparisons = comparisonCount[v.id] || 0;
    const losses = lossCount[v.id] || 0;
    
    // Mark as consistent loser if they lost 75%+ of their comparisons
    if (totalComparisons >= 2 && losses / totalComparisons >= 0.75) {
      losers.push(v.name);
    }
  });
  
  return losers;
}

/**
 * Calculate optimal traffic split for multivariate test
 */
export function calculateTrafficSplit(variantCount: number): number[] {
  // Equal split by default
  const equalSplit = 100 / variantCount;
  return Array(variantCount).fill(equalSplit);
}

/**
 * Assign variant to a new email send based on traffic split
 */
export function assignVariant(
  variants: { id: string; sentCount: number }[],
  targetSplits: number[]
): string {
  if (variants.length !== targetSplits.length) {
    throw new Error("Variants and splits must have same length");
  }
  
  const totalSent = variants.reduce((sum: any, v: any) => sum + v.sentCount, 0);
  
  // Calculate current actual splits
  const actualSplits = variants.map((v: any) => 
    totalSent === 0 ? 0 : (v.sentCount / totalSent) * 100
  );
  
  // Find variant that is most under-represented
  let maxDeficit = -Infinity;
  let selectedIndex = 0;
  
  variants.forEach((v, i) => {
    const deficit = (targetSplits[i] || 0) - (actualSplits[i] || 0);
    if (deficit > maxDeficit) {
      maxDeficit = deficit;
      selectedIndex = i;
    }
  });
  
  return variants[selectedIndex]?.id || variants[0]?.id || "";
}
