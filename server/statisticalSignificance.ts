/**
 * Statistical Significance Calculator for A/B Testing
 * Implements confidence intervals, p-value calculations, and significance testing
 */

// Standard normal distribution Z-scores for common confidence levels
const Z_SCORES = {
  90: 1.645,
  95: 1.96,
  99: 2.576,
};

export interface VariantStats {
  sentCount: number;
  openCount: number;
  clickCount: number;
  openRate: number; // in basis points (10000 = 100%)
  clickRate: number; // in basis points (10000 = 100%)
}

export interface SignificanceResult {
  isSignificant: boolean;
  confidenceLevel: 90 | 95 | 99;
  pValue: number;
  winner: "A" | "B" | "tie" | null;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  minimumSampleSize: number;
  currentSampleSize: number;
  sampleSizeReached: boolean;
  effectSize: number; // Difference in conversion rates
}

/**
 * Calculate standard error for a proportion
 */
function calculateStandardError(p: number, n: number): number {
  return Math.sqrt((p * (1 - p)) / n);
}

/**
 * Calculate pooled standard error for two proportions
 */
function calculatePooledStandardError(p1: number, n1: number, p2: number, n2: number): number {
  const pooledP = (p1 * n1 + p2 * n2) / (n1 + n2);
  return Math.sqrt(pooledP * (1 - pooledP) * (1 / n1 + 1 / n2));
}

/**
 * Calculate Z-score for two proportions
 */
function calculateZScore(p1: number, n1: number, p2: number, n2: number): number {
  const se = calculatePooledStandardError(p1, n1, p2, n2);
  if (se === 0) return 0;
  return (p1 - p2) / se;
}

/**
 * Calculate p-value from Z-score (two-tailed test)
 */
function calculatePValue(zScore: number): number {
  // Approximation of the cumulative distribution function
  const z = Math.abs(zScore);
  const t = 1 / (1 + 0.2316419 * z);
  const d = 0.3989423 * Math.exp(-z * z / 2);
  const p =
    d *
    t *
    (0.3193815 +
      t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  
  // Two-tailed test
  return 2 * p;
}

/**
 * Calculate confidence interval for a proportion
 */
function calculateConfidenceInterval(
  p: number,
  n: number,
  confidenceLevel: 90 | 95 | 99
): { lower: number; upper: number } {
  const z = Z_SCORES[confidenceLevel];
  const se = calculateStandardError(p, n);
  const margin = z * se;
  
  return {
    lower: Math.max(0, p - margin),
    upper: Math.min(1, p + margin),
  };
}

/**
 * Calculate minimum sample size needed for statistical power
 * Based on desired effect size and power level (default 80%)
 */
function calculateMinimumSampleSize(
  baselineRate: number,
  minimumDetectableEffect: number = 0.1, // 10% relative improvement
  power: number = 0.8,
  alpha: number = 0.05
): number {
  const p1 = baselineRate;
  const p2 = baselineRate * (1 + minimumDetectableEffect);
  
  const zAlpha = 1.96; // Z-score for 95% confidence (alpha = 0.05, two-tailed)
  const zBeta = 0.84; // Z-score for 80% power (beta = 0.2)
  
  const numerator =
    Math.pow(zAlpha + zBeta, 2) *
    (p1 * (1 - p1) + p2 * (1 - p2));
  const denominator = Math.pow(p2 - p1, 2);
  
  return Math.ceil(numerator / denominator);
}

/**
 * Analyze A/B test statistical significance
 */
export function analyzeAbTestSignificance(
  variantA: VariantStats,
  variantB: VariantStats,
  metric: "open" | "click" = "open",
  confidenceLevel: 90 | 95 | 99 = 95
): SignificanceResult {
  // Convert basis points to proportions
  const rateA = metric === "open" ? variantA.openRate / 10000 : variantA.clickRate / 10000;
  const rateB = metric === "open" ? variantB.openRate / 10000 : variantB.clickRate / 10000;
  
  const nA = variantA.sentCount;
  const nB = variantB.sentCount;
  
  // Calculate effect size (absolute difference)
  const effectSize = Math.abs(rateA - rateB);
  
  // Calculate minimum sample size
  const baselineRate = Math.max(rateA, rateB);
  const minimumSampleSize = calculateMinimumSampleSize(baselineRate);
  const currentSampleSize = Math.min(nA, nB);
  const sampleSizeReached = currentSampleSize >= minimumSampleSize;
  
  // If sample size is too small, return not significant
  if (!sampleSizeReached || nA < 30 || nB < 30) {
    return {
      isSignificant: false,
      confidenceLevel,
      pValue: 1,
      winner: null,
      confidenceInterval: { lower: 0, upper: 0 },
      minimumSampleSize,
      currentSampleSize,
      sampleSizeReached: false,
      effectSize,
    };
  }
  
  // Calculate Z-score and p-value
  const zScore = calculateZScore(rateA, nA, rateB, nB);
  const pValue = calculatePValue(zScore);
  
  // Determine significance based on confidence level
  const alphaLevels = {
    90: 0.10,
    95: 0.05,
    99: 0.01,
  };
  const alpha = alphaLevels[confidenceLevel];
  const isSignificant = pValue < alpha;
  
  // Determine winner
  let winner: "A" | "B" | "tie" | null = null;
  if (isSignificant) {
    if (Math.abs(rateA - rateB) < 0.001) {
      winner = "tie";
    } else {
      winner = rateA > rateB ? "A" : "B";
    }
  }
  
  // Calculate confidence interval for the difference
  const seDiff = Math.sqrt(
    calculateStandardError(rateA, nA) ** 2 +
    calculateStandardError(rateB, nB) ** 2
  );
  const z = Z_SCORES[confidenceLevel];
  const margin = z * seDiff;
  const diff = rateA - rateB;
  
  return {
    isSignificant,
    confidenceLevel,
    pValue,
    winner,
    confidenceInterval: {
      lower: diff - margin,
      upper: diff + margin,
    },
    minimumSampleSize,
    currentSampleSize,
    sampleSizeReached,
    effectSize,
  };
}

/**
 * Get human-readable significance summary
 */
export function getSignificanceSummary(result: SignificanceResult): string {
  if (!result.sampleSizeReached) {
    const needed = result.minimumSampleSize - result.currentSampleSize;
    return `Need ${needed} more samples per variant to reach statistical power`;
  }
  
  if (!result.isSignificant) {
    return `No significant difference detected (p=${result.pValue.toFixed(3)})`;
  }
  
  if (result.winner === "tie") {
    return `Variants perform equally (p=${result.pValue.toFixed(3)})`;
  }
  
  const improvement = (result.effectSize * 100).toFixed(1);
  return `Variant ${result.winner} wins with ${improvement}% improvement (${result.confidenceLevel}% confidence, p=${result.pValue.toFixed(3)})`;
}

/**
 * Calculate recommended test duration in days
 * Based on current traffic and minimum sample size
 */
export function calculateRecommendedDuration(
  dailyTraffic: number,
  trafficSplit: number, // percentage for variant A (e.g., 50)
  minimumSampleSize: number
): number {
  const dailyPerVariant = (dailyTraffic * trafficSplit) / 100;
  if (dailyPerVariant === 0) return Infinity;
  
  const daysNeeded = Math.ceil(minimumSampleSize / dailyPerVariant);
  return Math.max(7, daysNeeded); // Minimum 7 days to account for weekly patterns
}
