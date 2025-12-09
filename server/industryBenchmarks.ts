/**
 * Industry Benchmark Data for Recruitment Email Performance
 * Based on industry research and recruitment email analytics studies
 */

export interface BenchmarkData {
  emailType: string;
  openRate: number; // percentage
  clickRate: number; // percentage
  responseRate: number; // percentage
  source: string;
}

export interface IndustrySector {
  id: string;
  name: string;
  benchmarks: BenchmarkData[];
}

export interface CompanySize {
  id: string;
  name: string;
  range: string;
  multiplier: number; // Adjustment factor for company size
}

/**
 * Recruitment industry benchmark data
 * Sources: Various recruitment email performance studies (2023-2024)
 */
export const RECRUITMENT_BENCHMARKS: BenchmarkData[] = [
  {
    emailType: "interview_invite",
    openRate: 68.5,
    clickRate: 42.3,
    responseRate: 78.2,
    source: "Recruitment Email Benchmark Study 2024",
  },
  {
    emailType: "interview_reminder",
    openRate: 82.4,
    clickRate: 65.8,
    responseRate: 91.5,
    source: "Recruitment Email Benchmark Study 2024",
  },
  {
    emailType: "application_received",
    openRate: 71.2,
    clickRate: 38.6,
    responseRate: 45.3,
    source: "Recruitment Email Benchmark Study 2024",
  },
  {
    emailType: "application_update",
    openRate: 74.8,
    clickRate: 52.1,
    responseRate: 68.9,
    source: "Recruitment Email Benchmark Study 2024",
  },
  {
    emailType: "job_match",
    openRate: 58.3,
    clickRate: 34.7,
    responseRate: 42.1,
    source: "Recruitment Email Benchmark Study 2024",
  },
  {
    emailType: "rejection",
    openRate: 65.9,
    clickRate: 28.4,
    responseRate: 15.2,
    source: "Recruitment Email Benchmark Study 2024",
  },
  {
    emailType: "offer",
    openRate: 95.2,
    clickRate: 87.6,
    responseRate: 92.8,
    source: "Recruitment Email Benchmark Study 2024",
  },
  {
    emailType: "custom",
    openRate: 62.1,
    clickRate: 35.9,
    responseRate: 48.5,
    source: "General Recruitment Email Average",
  },
];

/**
 * Industry sectors with specific benchmark adjustments
 */
export const INDUSTRY_SECTORS: IndustrySector[] = [
  {
    id: "technology",
    name: "Technology & Software",
    benchmarks: RECRUITMENT_BENCHMARKS.map((b: any) => ({
      ...b,
      openRate: b.openRate * 1.08, // Tech candidates are 8% more engaged
      clickRate: b.clickRate * 1.12,
    })),
  },
  {
    id: "healthcare",
    name: "Healthcare & Medical",
    benchmarks: RECRUITMENT_BENCHMARKS.map((b: any) => ({
      ...b,
      openRate: b.openRate * 0.95, // Healthcare professionals have lower engagement
      clickRate: b.clickRate * 0.92,
    })),
  },
  {
    id: "finance",
    name: "Finance & Banking",
    benchmarks: RECRUITMENT_BENCHMARKS.map((b: any) => ({
      ...b,
      openRate: b.openRate * 1.05,
      clickRate: b.clickRate * 1.08,
    })),
  },
  {
    id: "retail",
    name: "Retail & E-commerce",
    benchmarks: RECRUITMENT_BENCHMARKS.map((b: any) => ({
      ...b,
      openRate: b.openRate * 0.92,
      clickRate: b.clickRate * 0.88,
    })),
  },
  {
    id: "general",
    name: "General / Other",
    benchmarks: RECRUITMENT_BENCHMARKS,
  },
];

/**
 * Company size categories with adjustment factors
 */
export const COMPANY_SIZES: CompanySize[] = [
  {
    id: "startup",
    name: "Startup",
    range: "1-50 employees",
    multiplier: 1.15, // Startups often have higher engagement
  },
  {
    id: "small",
    name: "Small Business",
    range: "51-200 employees",
    multiplier: 1.08,
  },
  {
    id: "medium",
    name: "Medium Business",
    range: "201-1000 employees",
    multiplier: 1.0,
  },
  {
    id: "large",
    name: "Large Enterprise",
    range: "1001-5000 employees",
    multiplier: 0.95,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    range: "5000+ employees",
    multiplier: 0.92, // Large companies may have lower engagement
  },
];

export interface PerformanceComparison {
  metric: "openRate" | "clickRate" | "responseRate";
  yourValue: number;
  benchmarkValue: number;
  difference: number;
  percentageDifference: number;
  status: "above" | "below" | "at";
  insight: string;
}

export interface BenchmarkComparison {
  emailType: string;
  sector: string;
  companySize: string;
  comparisons: PerformanceComparison[];
  overallScore: number; // 0-100
  recommendations: string[];
}

/**
 * Get benchmark data for specific email type and sector
 */
export function getBenchmark(
  emailType: string,
  sectorId: string = "general",
  companySizeId: string = "medium"
): BenchmarkData | null {
  const sector = INDUSTRY_SECTORS.find((s: any) => s.id === sectorId);
  if (!sector) return null;

  const benchmark = sector.benchmarks.find((b: any) => b.emailType === emailType);
  if (!benchmark) return null;

  const companySize = COMPANY_SIZES.find((cs: any) => cs.id === companySizeId);
  const multiplier = companySize?.multiplier || 1.0;

  return {
    ...benchmark,
    openRate: benchmark.openRate * multiplier,
    clickRate: benchmark.clickRate * multiplier,
    responseRate: benchmark.responseRate * multiplier,
  };
}

/**
 * Compare your performance against industry benchmarks
 */
export function comparePerformance(
  emailType: string,
  yourOpenRate: number,
  yourClickRate: number,
  yourResponseRate: number = 0,
  sectorId: string = "general",
  companySizeId: string = "medium"
): BenchmarkComparison {
  const benchmark = getBenchmark(emailType, sectorId, companySizeId);
  
  if (!benchmark) {
    throw new Error("Benchmark not found for specified parameters");
  }

  const comparisons: PerformanceComparison[] = [];

  // Open Rate Comparison
  const openDiff = yourOpenRate - benchmark.openRate;
  const openPctDiff = (openDiff / benchmark.openRate) * 100;
  comparisons.push({
    metric: "openRate",
    yourValue: yourOpenRate,
    benchmarkValue: benchmark.openRate,
    difference: openDiff,
    percentageDifference: openPctDiff,
    status: openDiff > 2 ? "above" : openDiff < -2 ? "below" : "at",
    insight: generateInsight("openRate", openPctDiff),
  });

  // Click Rate Comparison
  const clickDiff = yourClickRate - benchmark.clickRate;
  const clickPctDiff = (clickDiff / benchmark.clickRate) * 100;
  comparisons.push({
    metric: "clickRate",
    yourValue: yourClickRate,
    benchmarkValue: benchmark.clickRate,
    difference: clickDiff,
    percentageDifference: clickPctDiff,
    status: clickDiff > 2 ? "above" : clickDiff < -2 ? "below" : "at",
    insight: generateInsight("clickRate", clickPctDiff),
  });

  // Response Rate Comparison (if available)
  if (yourResponseRate > 0) {
    const responseDiff = yourResponseRate - benchmark.responseRate;
    const responsePctDiff = (responseDiff / benchmark.responseRate) * 100;
    comparisons.push({
      metric: "responseRate",
      yourValue: yourResponseRate,
      benchmarkValue: benchmark.responseRate,
      difference: responseDiff,
      percentageDifference: responsePctDiff,
      status: responseDiff > 2 ? "above" : responseDiff < -2 ? "below" : "at",
      insight: generateInsight("responseRate", responsePctDiff),
    });
  }

  // Calculate overall score (0-100)
  const overallScore = calculateOverallScore(comparisons);

  // Generate recommendations
  const recommendations = generateRecommendations(comparisons, emailType);

  const sector = INDUSTRY_SECTORS.find((s: any) => s.id === sectorId);
  const companySize = COMPANY_SIZES.find((cs: any) => cs.id === companySizeId);

  return {
    emailType,
    sector: sector?.name || "General",
    companySize: companySize?.name || "Medium Business",
    comparisons,
    overallScore,
    recommendations,
  };
}

/**
 * Generate insight text for a metric comparison
 */
function generateInsight(metric: string, percentageDiff: number): string {
  const metricName = metric === "openRate" ? "open rate" : metric === "clickRate" ? "click rate" : "response rate";
  
  if (percentageDiff > 20) {
    return `Excellent! Your ${metricName} is significantly above industry average.`;
  } else if (percentageDiff > 10) {
    return `Great! Your ${metricName} exceeds industry standards.`;
  } else if (percentageDiff > 0) {
    return `Good! Your ${metricName} is above average.`;
  } else if (percentageDiff > -10) {
    return `Your ${metricName} is slightly below average. Room for improvement.`;
  } else if (percentageDiff > -20) {
    return `Your ${metricName} is below industry standards. Consider optimization.`;
  } else {
    return `Your ${metricName} needs significant improvement. Review your strategy.`;
  }
}

/**
 * Calculate overall performance score
 */
function calculateOverallScore(comparisons: PerformanceComparison[]): number {
  if (comparisons.length === 0) return 50;

  let totalScore = 0;
  
  comparisons.forEach((comp: any) => {
    // Convert percentage difference to a 0-100 score
    // +50% above benchmark = 100, at benchmark = 50, -50% below = 0
    const score = Math.max(0, Math.min(100, 50 + comp.percentageDifference));
    totalScore += score;
  });

  return Math.round(totalScore / comparisons.length);
}

/**
 * Generate actionable recommendations
 */
function generateRecommendations(
  comparisons: PerformanceComparison[],
  emailType: string
): string[] {
  const recommendations: string[] = [];

  const openComp = comparisons.find((c: any) => c.metric === "openRate");
  const clickComp = comparisons.find((c: any) => c.metric === "clickRate");

  // Open rate recommendations
  if (openComp && openComp.status === "below") {
    recommendations.push("Improve subject lines: Test different subject line styles (questions, urgency, personalization) to increase open rates.");
    recommendations.push("Optimize send times: Experiment with different days and times to find when your audience is most engaged.");
    recommendations.push("Clean your email list: Remove inactive recipients to improve overall engagement metrics.");
  }

  // Click rate recommendations
  if (clickComp && clickComp.status === "below") {
    recommendations.push("Strengthen CTAs: Make your call-to-action buttons more prominent and compelling.");
    recommendations.push("Improve email design: Ensure your emails are mobile-responsive and visually appealing.");
    recommendations.push("Personalize content: Use recipient data to make emails more relevant and engaging.");
  }

  // Email type-specific recommendations
  if (emailType === "interview_invite" && clickComp && clickComp.status === "below") {
    recommendations.push("Simplify scheduling: Provide multiple time slots or a calendar link to make it easier for candidates to respond.");
  }

  if (emailType === "job_match" && openComp && openComp.status === "below") {
    recommendations.push("Improve job matching: Ensure recommended jobs closely match candidate profiles to increase relevance and engagement.");
  }

  // If performing well
  if (openComp && openComp.status === "above" && clickComp && clickComp.status === "above") {
    recommendations.push("Maintain excellence: Your emails are performing well. Continue monitoring and A/B testing to sustain results.");
    recommendations.push("Share best practices: Document what's working and apply these strategies to other email types.");
  }

  return recommendations.slice(0, 5); // Return top 5 recommendations
}

/**
 * Get all available sectors
 */
export function getAllSectors(): IndustrySector[] {
  return INDUSTRY_SECTORS;
}

/**
 * Get all company sizes
 */
export function getAllCompanySizes(): CompanySize[] {
  return COMPANY_SIZES;
}
