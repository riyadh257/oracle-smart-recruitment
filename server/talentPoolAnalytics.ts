import * as db from "./db";
import { sql } from "drizzle-orm";

/**
 * Talent Pool Analytics Service
 * Provides metrics and insights for employer talent pools
 */

export interface TalentPoolMetrics {
  totalCandidates: number;
  activeCandidates: number;
  contactedCandidates: number;
  hiredCandidates: number;
  averageMatchScore: number;
  growthRate: number; // Percentage growth over last period
  conversionRate: number; // Percentage of talent pool that got hired
  engagementRate: number; // Percentage that have been contacted
}

export interface TalentPoolGrowthData {
  date: string;
  count: number;
  cumulative: number;
}

export interface ConversionFunnelData {
  stage: string;
  count: number;
  percentage: number;
}

export interface SkillDistribution {
  skill: string;
  count: number;
}

/**
 * Get comprehensive talent pool metrics for an employer
 */
export async function getTalentPoolMetrics(employerId: number): Promise<TalentPoolMetrics> {
  const allCandidates = await db.getTalentPoolByEmployerId(employerId);
  
  const totalCandidates = allCandidates.length;
  const activeCandidates = allCandidates.filter((c: any) => c.talentPoolEntry.status === 'active').length;
  const contactedCandidates = allCandidates.filter((c: any) => c.talentPoolEntry.status === 'contacted').length;
  const hiredCandidates = allCandidates.filter((c: any) => c.talentPoolEntry.status === 'hired').length;
  
  // Calculate average match score
  const matchScores = allCandidates
    .map((c: any) => c.talentPoolEntry.matchScore)
    .filter((score): score is number => score !== null && score !== undefined);
  const averageMatchScore = matchScores.length > 0
    ? matchScores.reduce((sum: any, score: any) => sum + score, 0) / matchScores.length
    : 0;
  
  // Calculate growth rate (last 30 days vs previous 30 days)
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  
  const recentAdditions = allCandidates.filter(
    c => new Date(c.talentPoolEntry.createdAt) >= thirtyDaysAgo
  ).length;
  const previousAdditions = allCandidates.filter(
    c => new Date(c.talentPoolEntry.createdAt) >= sixtyDaysAgo && new Date(c.talentPoolEntry.createdAt) < thirtyDaysAgo
  ).length;
  
  const growthRate = previousAdditions > 0
    ? ((recentAdditions - previousAdditions) / previousAdditions) * 100
    : recentAdditions > 0 ? 100 : 0;
  
  // Calculate conversion rate (hired / total)
  const conversionRate = totalCandidates > 0
    ? (hiredCandidates / totalCandidates) * 100
    : 0;
  
  // Calculate engagement rate (contacted or hired / total)
  const engagementRate = totalCandidates > 0
    ? ((contactedCandidates + hiredCandidates) / totalCandidates) * 100
    : 0;
  
  return {
    totalCandidates,
    activeCandidates,
    contactedCandidates,
    hiredCandidates,
    averageMatchScore: Math.round(averageMatchScore),
    growthRate: Math.round(growthRate * 10) / 10,
    conversionRate: Math.round(conversionRate * 10) / 10,
    engagementRate: Math.round(engagementRate * 10) / 10,
  };
}

/**
 * Get talent pool growth over time (last 90 days)
 */
export async function getTalentPoolGrowth(employerId: number): Promise<TalentPoolGrowthData[]> {
  const allCandidates = await db.getTalentPoolByEmployerId(employerId);
  
  const now = new Date();
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  
  // Group by date
  const dailyCounts = new Map<string, number>();
  
  for (const candidate of allCandidates) {
    const createdDate = new Date(candidate.talentPoolEntry.createdAt);
    if (createdDate >= ninetyDaysAgo) {
      const dateKey = createdDate.toISOString().split('T')[0];
      dailyCounts.set(dateKey, (dailyCounts.get(dateKey) || 0) + 1);
    }
  }
  
  // Generate array with cumulative counts
  const growthData: TalentPoolGrowthData[] = [];
  let cumulative = 0;
  
  // Fill in all dates in the range
  for (let i = 90; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateKey = date.toISOString().split('T')[0];
    const count = dailyCounts.get(dateKey) || 0;
    cumulative += count;
    
    growthData.push({
      date: dateKey,
      count,
      cumulative,
    });
  }
  
  return growthData;
}

/**
 * Get conversion funnel data
 */
export async function getConversionFunnel(employerId: number): Promise<ConversionFunnelData[]> {
  const metrics = await getTalentPoolMetrics(employerId);
  
  const funnel: ConversionFunnelData[] = [
    {
      stage: "Added to Talent Pool",
      count: metrics.totalCandidates,
      percentage: 100,
    },
    {
      stage: "Contacted",
      count: metrics.contactedCandidates + metrics.hiredCandidates,
      percentage: metrics.totalCandidates > 0
        ? Math.round(((metrics.contactedCandidates + metrics.hiredCandidates) / metrics.totalCandidates) * 100)
        : 0,
    },
    {
      stage: "Hired",
      count: metrics.hiredCandidates,
      percentage: metrics.totalCandidates > 0
        ? Math.round((metrics.hiredCandidates / metrics.totalCandidates) * 100)
        : 0,
    },
  ];
  
  return funnel;
}

/**
 * Get skill distribution in talent pool
 */
export async function getSkillDistribution(employerId: number): Promise<SkillDistribution[]> {
  const allCandidates = await db.getTalentPoolByEmployerId(employerId);
  
  const skillCounts = new Map<string, number>();
  
  for (const candidate of allCandidates) {
    const skills = (candidate.candidate.technicalSkills as string[] | null) || [];
    for (const skill of skills) {
      skillCounts.set(skill, (skillCounts.get(skill) || 0) + 1);
    }
  }
  
  // Convert to array and sort by count
  const distribution = Array.from(skillCounts.entries())
    .map(([skill, count]) => ({ skill, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20); // Top 20 skills
  
  return distribution;
}

/**
 * Get match score distribution
 */
export async function getMatchScoreDistribution(employerId: number): Promise<{ range: string; count: number }[]> {
  const allCandidates = await db.getTalentPoolByEmployerId(employerId);
  
  const ranges = [
    { min: 0, max: 50, label: "0-50%" },
    { min: 50, max: 70, label: "50-70%" },
    { min: 70, max: 85, label: "70-85%" },
    { min: 85, max: 100, label: "85-100%" },
  ];
  
  const distribution = ranges.map((range: any) => {
    const count = allCandidates.filter((c: any) => {
      const score = c.talentPoolEntry.matchScore || 0;
      return score >= range.min && score < range.max;
    }).length;
    
    return {
      range: range.label,
      count,
    };
  });
  
  return distribution;
}

/**
 * Get comprehensive analytics dashboard data
 */
export async function getTalentPoolAnalyticsDashboard(employerId: number) {
  const [metrics, growth, funnel, skills, matchScores] = await Promise.all([
    getTalentPoolMetrics(employerId),
    getTalentPoolGrowth(employerId),
    getConversionFunnel(employerId),
    getSkillDistribution(employerId),
    getMatchScoreDistribution(employerId),
  ]);
  
  return {
    metrics,
    growth,
    funnel,
    skills,
    matchScores,
  };
}
