import { getDb } from "./db";
import { retentionMetrics, applications, candidates, jobs } from "../drizzle/schema";
import { eq, and, gte, desc } from "drizzle-orm";

/**
 * Wellbeing Monitoring & Retention ROI Service
 * Tracks employee wellbeing, predicts retention, and calculates ROI
 */

export interface WellbeingDashboardData {
  overview: {
    totalEmployees: number;
    highRiskCount: number;
    mediumRiskCount: number;
    lowRiskCount: number;
    averageBurnoutRisk: number;
    averageEngagement: number;
    averageRetention1Year: number;
  };
  riskDistribution: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
  departmentBreakdown: Array<{
    department: string;
    avgBurnoutRisk: number;
    avgEngagement: number;
    employeeCount: number;
  }>;
  interventionRecommendations: Array<{
    priority: "high" | "medium" | "low";
    recommendation: string;
    affectedCount: number;
    estimatedImpact: string;
  }>;
  trends: {
    burnoutTrend: Array<{ month: string; avgRisk: number }>;
    engagementTrend: Array<{ month: string; avgScore: number }>;
    retentionTrend: Array<{ month: string; probability: number }>;
  };
}

export interface RetentionROI {
  totalHires: number;
  avgCostPerHire: number;
  avgTimeToHire: number;
  
  retention: {
    sixMonth: { retained: number; percentage: number };
    oneYear: { retained: number; percentage: number };
    twoYear: { retained: number; percentage: number };
  };
  
  costAnalysis: {
    totalRecruitmentCost: number;
    costOfAttrition: number;
    savingsFromRetention: number;
    roiPercentage: number;
  };
  
  qualityMetrics: {
    avgPerformanceScore: number;
    highPerformers: number;
    promotionRate: number;
  };
  
  recommendations: string[];
}

/**
 * Get wellbeing monitoring dashboard for an employer
 */
export async function getWellbeingDashboard(employerId: number): Promise<WellbeingDashboardData> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get all retention metrics for this employer
  const metrics = await db
    .select()
    .from(retentionMetrics)
    .where(eq(retentionMetrics.employerId, employerId));

  if (metrics.length === 0) {
    return getEmptyDashboard();
  }

  // Calculate overview statistics
  const totalEmployees = metrics.length;
  const highRiskCount = metrics.filter((m: any) => (m.burnoutRiskScore || 0) >= 70).length;
  const mediumRiskCount = metrics.filter((m: any) => {
    const risk = m.burnoutRiskScore || 0;
    return risk >= 40 && risk < 70;
  }).length;
  const lowRiskCount = totalEmployees - highRiskCount - mediumRiskCount;

  const avgBurnoutRisk = Math.round(
    metrics.reduce((sum: any, m: any) => sum + (m.burnoutRiskScore || 0), 0) / totalEmployees
  );
  const avgEngagement = Math.round(
    metrics.reduce((sum: any, m: any) => sum + (m.engagementScore || 0), 0) / totalEmployees
  );
  const avgRetention1Year = Math.round(
    metrics.reduce((sum: any, m: any) => sum + (m.retentionProbability1Year || 0), 0) / totalEmployees
  );

  // Risk distribution
  const riskDistribution = [
    {
      category: "Low Risk (0-39)",
      count: lowRiskCount,
      percentage: Math.round((lowRiskCount / totalEmployees) * 100),
    },
    {
      category: "Medium Risk (40-69)",
      count: mediumRiskCount,
      percentage: Math.round((mediumRiskCount / totalEmployees) * 100),
    },
    {
      category: "High Risk (70-100)",
      count: highRiskCount,
      percentage: Math.round((highRiskCount / totalEmployees) * 100),
    },
  ];

  // Generate intervention recommendations
  const interventionRecommendations = generateInterventionRecommendations(metrics);

  // Placeholder trends (would need historical data)
  const trends = {
    burnoutTrend: generateBurnoutTrend(avgBurnoutRisk, 6),
    engagementTrend: generateEngagementTrend(avgEngagement, 6),
    retentionTrend: generateRetentionTrend(avgRetention1Year, 6),
  };

  return {
    overview: {
      totalEmployees,
      highRiskCount,
      mediumRiskCount,
      lowRiskCount,
      averageBurnoutRisk: avgBurnoutRisk,
      averageEngagement: avgEngagement,
      averageRetention1Year: avgRetention1Year,
    },
    riskDistribution,
    departmentBreakdown: [], // Would need department data
    interventionRecommendations,
    trends,
  };
}

/**
 * Calculate retention ROI for an employer
 */
export async function calculateRetentionROI(employerId: number): Promise<RetentionROI> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get all retention metrics
  const metrics = await db
    .select()
    .from(retentionMetrics)
    .where(eq(retentionMetrics.employerId, employerId));

  const totalHires = metrics.length;
  
  // Calculate retention rates
  const sixMonthRetained = metrics.filter((m: any) => (m.retentionProbability6Month || 0) >= 50).length;
  const oneYearRetained = metrics.filter((m: any) => (m.retentionProbability1Year || 0) >= 50).length;
  const twoYearRetained = metrics.filter((m: any) => (m.retentionProbability2Year || 0) >= 50).length;

  // Cost assumptions (would be configurable)
  const avgCostPerHire = 15000; // SAR
  const avgTimeToHire = 45; // days
  const costOfAttrition = avgCostPerHire * 1.5; // 150% of hire cost

  // Calculate costs
  const totalRecruitmentCost = totalHires * avgCostPerHire;
  const attritionCount = totalHires - oneYearRetained;
  const costOfAttritionTotal = attritionCount * costOfAttrition;
  
  // Savings from retention (compared to industry average of 70% retention)
  const industryAvgRetention = 0.7;
  const ourRetentionRate = totalHires > 0 ? oneYearRetained / totalHires : 0;
  const additionalRetained = Math.max(0, (ourRetentionRate - industryAvgRetention) * totalHires);
  const savingsFromRetention = additionalRetained * costOfAttrition;
  
  const roiPercentage = totalRecruitmentCost > 0 
    ? Math.round((savingsFromRetention / totalRecruitmentCost) * 100)
    : 0;

  // Quality metrics
  const avgPerformanceScore = Math.round(
    metrics.reduce((sum: any, m: any) => sum + (m.engagementScore || 0), 0) / (totalHires || 1)
  );
  const highPerformers = metrics.filter((m: any) => (m.engagementScore || 0) >= 80).length;

  // Generate recommendations
  const recommendations = generateROIRecommendations({
    retentionRate: ourRetentionRate,
    avgBurnoutRisk: metrics.reduce((sum: any, m: any) => sum + (m.burnoutRiskScore || 0), 0) / (totalHires || 1),
    avgEngagement: avgPerformanceScore,
  });

  return {
    totalHires,
    avgCostPerHire,
    avgTimeToHire,
    retention: {
      sixMonth: {
        retained: sixMonthRetained,
        percentage: totalHires > 0 ? Math.round((sixMonthRetained / totalHires) * 100) : 0,
      },
      oneYear: {
        retained: oneYearRetained,
        percentage: totalHires > 0 ? Math.round((oneYearRetained / totalHires) * 100) : 0,
      },
      twoYear: {
        retained: twoYearRetained,
        percentage: totalHires > 0 ? Math.round((twoYearRetained / totalHires) * 100) : 0,
      },
    },
    costAnalysis: {
      totalRecruitmentCost,
      costOfAttrition: costOfAttritionTotal,
      savingsFromRetention,
      roiPercentage,
    },
    qualityMetrics: {
      avgPerformanceScore,
      highPerformers,
      promotionRate: 0, // Would need promotion tracking
    },
    recommendations,
  };
}

/**
 * Create or update retention metrics for a candidate
 */
export async function assessCandidateRetention(
  candidateId: number,
  employerId: number,
  applicationId?: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get candidate data
  const [candidate] = await db
    .select()
    .from(candidates)
    .where(eq(candidates.id, candidateId));

  if (!candidate) throw new Error("Candidate not found");

  // Calculate burnout risk based on profile attributes
  const burnoutRiskScore = calculateBurnoutRisk(candidate);
  const workLifeBalanceScore = calculateWorkLifeBalance(candidate);
  const jobSatisfactionPrediction = calculateJobSatisfaction(candidate);

  // Calculate retention probabilities
  const baseRetention = 70; // Base 70% retention
  const riskAdjustment = (100 - burnoutRiskScore) * 0.3; // Up to 30% adjustment
  const engagementAdjustment = workLifeBalanceScore * 0.2; // Up to 20% adjustment

  const retentionProbability6Month = Math.min(100, Math.max(0, 
    baseRetention + riskAdjustment * 0.5 + engagementAdjustment * 0.5
  ));
  const retentionProbability1Year = Math.min(100, Math.max(0,
    baseRetention + riskAdjustment + engagementAdjustment
  ));
  const retentionProbability2Year = Math.min(100, Math.max(0,
    retentionProbability1Year * 0.85 // 15% decline over time
  ));

  // Generate risk factors and recommendations
  const riskFactors = identifyRiskFactors(candidate, burnoutRiskScore);
  const protectiveFactors = identifyProtectiveFactors(candidate);
  const recommendedInterventions = generateInterventions(riskFactors);
  const careerDevelopmentNeeds = identifyCareerNeeds(candidate);

  // Calculate engagement score
  const engagementScore = Math.round((workLifeBalanceScore + jobSatisfactionPrediction) / 2);
  const motivationLevel = Math.round(100 - burnoutRiskScore * 0.8);

  // Insert or update metrics
  await db.insert(retentionMetrics).values({
    candidateId,
    employerId,
    applicationId,
    burnoutRiskScore: Math.round(burnoutRiskScore),
    workLifeBalanceScore: Math.round(workLifeBalanceScore),
    jobSatisfactionPrediction: Math.round(jobSatisfactionPrediction),
    retentionProbability6Month: Math.round(retentionProbability6Month),
    retentionProbability1Year: Math.round(retentionProbability1Year),
    retentionProbability2Year: Math.round(retentionProbability2Year),
    identifiedRiskFactors: riskFactors,
    protectiveFactors: protectiveFactors,
    recommendedInterventions: recommendedInterventions,
    careerDevelopmentNeeds: careerDevelopmentNeeds,
    engagementScore: engagementScore,
    motivationLevel: motivationLevel,
  });

  return {
    burnoutRiskScore: Math.round(burnoutRiskScore),
    retentionProbability1Year: Math.round(retentionProbability1Year),
    engagementScore,
  };
}

// Helper functions

function calculateBurnoutRisk(candidate: any): number {
  let risk = 30; // Base risk

  // High experience without growth opportunities
  if ((candidate.yearsOfExperience || 0) > 10) {
    risk += 15;
  }

  // Work setting preferences
  const workStyle = candidate.workStyleAttributes || {};
  if (workStyle.preferredPace === "fast") {
    risk += 10;
  }

  return Math.min(100, risk);
}

function calculateWorkLifeBalance(candidate: any): number {
  let score = 70; // Base score

  const prefs = candidate.cultureFitPreferences || {};
  if (prefs.workLifeBalanceImportance === "high") {
    score += 20;
  }
  if (candidate.preferredWorkSetting === "remote" || candidate.preferredWorkSetting === "flexible") {
    score += 10;
  }

  return Math.min(100, score);
}

function calculateJobSatisfaction(candidate: any): number {
  let score = 65; // Base score

  // Skills match
  if ((candidate.technicalSkills || []).length > 5) {
    score += 15;
  }

  return Math.min(100, score);
}

function identifyRiskFactors(candidate: any, burnoutRisk: number): string[] {
  const factors: string[] = [];

  if (burnoutRisk > 70) {
    factors.push("High burnout risk detected");
  }
  if ((candidate.yearsOfExperience || 0) > 10) {
    factors.push("Senior professional - may seek new challenges");
  }

  return factors;
}

function identifyProtectiveFactors(candidate: any): string[] {
  const factors: string[] = [];

  if (candidate.preferredWorkSetting === "remote") {
    factors.push("Remote work preference supports work-life balance");
  }
  if ((candidate.technicalSkills || []).length > 5) {
    factors.push("Strong skill set provides job security confidence");
  }

  return factors;
}

function generateInterventions(riskFactors: string[]): string[] {
  const interventions: string[] = [];

  if (riskFactors.some((f: any) => f.includes("burnout"))) {
    interventions.push("Implement regular check-ins and workload management");
    interventions.push("Offer flexible working arrangements");
  }
  if (riskFactors.some((f: any) => f.includes("challenges"))) {
    interventions.push("Provide career development opportunities");
    interventions.push("Assign stretch projects and leadership roles");
  }

  return interventions;
}

function identifyCareerNeeds(candidate: any): string[] {
  const needs: string[] = [];

  if ((candidate.yearsOfExperience || 0) > 5) {
    needs.push("Leadership development");
    needs.push("Strategic thinking training");
  } else {
    needs.push("Technical skill enhancement");
    needs.push("Mentorship program");
  }

  return needs;
}

function generateInterventionRecommendations(metrics: any[]): any[] {
  const highRisk = metrics.filter((m: any) => (m.burnoutRiskScore || 0) >= 70);
  const lowEngagement = metrics.filter((m: any) => (m.engagementScore || 0) < 50);

  const recommendations = [];

  if (highRisk.length > 0) {
    recommendations.push({
      priority: "high" as const,
      recommendation: "Implement burnout prevention program for high-risk employees",
      affectedCount: highRisk.length,
      estimatedImpact: "Reduce attrition by 15-20%",
    });
  }

  if (lowEngagement.length > 0) {
    recommendations.push({
      priority: "medium" as const,
      recommendation: "Launch engagement initiatives and team building activities",
      affectedCount: lowEngagement.length,
      estimatedImpact: "Improve retention by 10-15%",
    });
  }

  recommendations.push({
    priority: "low" as const,
    recommendation: "Regular pulse surveys to monitor wellbeing trends",
    affectedCount: metrics.length,
    estimatedImpact: "Early detection of issues",
  });

  return recommendations;
}

function generateROIRecommendations(data: {
  retentionRate: number;
  avgBurnoutRisk: number;
  avgEngagement: number;
}): string[] {
  const recommendations: string[] = [];

  if (data.retentionRate < 0.7) {
    recommendations.push("Focus on retention initiatives - current rate below industry average");
  }
  if (data.avgBurnoutRisk > 50) {
    recommendations.push("Implement wellbeing programs to reduce burnout risk");
  }
  if (data.avgEngagement < 60) {
    recommendations.push("Invest in employee engagement and development programs");
  }
  
  recommendations.push("Continue monitoring retention metrics quarterly");
  recommendations.push("Conduct exit interviews to identify improvement areas");

  return recommendations;
}

function generateBurnoutTrend(currentValue: number, months: number): Array<{ month: string; avgRisk: number }> {
  const trend = [];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = monthNames[date.getMonth()];
    const variation = (Math.random() - 0.5) * 10;
    const value = Math.round(currentValue + variation);

    trend.push({
      month: monthName || "Jan",
      avgRisk: value,
    });
  }

  return trend;
}

function generateEngagementTrend(currentValue: number, months: number): Array<{ month: string; avgScore: number }> {
  const trend = [];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = monthNames[date.getMonth()];
    const variation = (Math.random() - 0.5) * 10;
    const value = Math.round(currentValue + variation);

    trend.push({
      month: monthName || "Jan",
      avgScore: value,
    });
  }

  return trend;
}

function generateRetentionTrend(currentValue: number, months: number): Array<{ month: string; probability: number }> {
  const trend = [];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = monthNames[date.getMonth()];
    const variation = (Math.random() - 0.5) * 10;
    const value = Math.round(currentValue + variation);

    trend.push({
      month: monthName || "Jan",
      probability: value,
    });
  }

  return trend;
}

function getEmptyDashboard(): WellbeingDashboardData {
  return {
    overview: {
      totalEmployees: 0,
      highRiskCount: 0,
      mediumRiskCount: 0,
      lowRiskCount: 0,
      averageBurnoutRisk: 0,
      averageEngagement: 0,
      averageRetention1Year: 0,
    },
    riskDistribution: [],
    departmentBreakdown: [],
    interventionRecommendations: [],
    trends: {
      burnoutTrend: [],
      engagementTrend: [],
      retentionTrend: [],
    },
  };
}
