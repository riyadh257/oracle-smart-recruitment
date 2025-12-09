import { getDb } from "./db";
import { matchFeedback, feedbackAnalytics } from "../drizzle/schema";
import { eq, and, gte, desc } from "drizzle-orm";

/**
 * Match Feedback Service
 * Handles post-hire feedback collection for continuous AI algorithm improvement
 */

export interface MatchFeedbackData {
  candidateId: number;
  jobId: number;
  applicationId?: number;
  recruiterId: number;
  matchId?: number;
  
  // Original match scores
  originalMatchScore?: number;
  originalSkillScore?: number;
  originalCultureScore?: number;
  originalWellbeingScore?: number;
  
  // Outcome data
  wasHired: boolean;
  hiredDate?: Date;
  matchSuccessful?: boolean; // null = too early to tell
  
  // Feedback ratings (1-5 scale)
  skillMatchAccuracy?: number;
  cultureFitAccuracy?: number;
  wellbeingMatchAccuracy?: number;
  overallSatisfaction?: number;
  
  // Qualitative feedback
  whatWorkedWell?: string;
  whatDidntWork?: string;
  unexpectedFactors?: string;
  improvementSuggestions?: string;
  
  // Performance data
  employeePerformanceRating?: number;
  retentionMonths?: number;
  stillEmployed?: boolean;
  
  // Metadata
  feedbackStage: '30_days' | '90_days' | '6_months' | '1_year' | 'exit';
  feedbackSource?: 'recruiter' | 'hiring_manager' | 'hr' | 'automated';
}

/**
 * Submit match feedback
 */
export async function submitMatchFeedback(data: MatchFeedbackData): Promise<number> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const [result] = await db.insert(matchFeedback).values({
    matchId: data.matchId || null,
    candidateId: data.candidateId,
    jobId: data.jobId,
    applicationId: data.applicationId || null,
    recruiterId: data.recruiterId,
    
    originalMatchScore: data.originalMatchScore || null,
    originalSkillScore: data.originalSkillScore || null,
    originalCultureScore: data.originalCultureScore || null,
    originalWellbeingScore: data.originalWellbeingScore || null,
    
    wasHired: data.wasHired ? 1 : 0,
    hiredDate: data.hiredDate || null,
    matchSuccessful: data.matchSuccessful !== undefined ? (data.matchSuccessful ? 1 : 0) : null,
    
    skillMatchAccuracy: data.skillMatchAccuracy || null,
    cultureFitAccuracy: data.cultureFitAccuracy || null,
    wellbeingMatchAccuracy: data.wellbeingMatchAccuracy || null,
    overallSatisfaction: data.overallSatisfaction || null,
    
    whatWorkedWell: data.whatWorkedWell || null,
    whatDidntWork: data.whatDidntWork || null,
    unexpectedFactors: data.unexpectedFactors || null,
    improvementSuggestions: data.improvementSuggestions || null,
    
    employeePerformanceRating: data.employeePerformanceRating || null,
    retentionMonths: data.retentionMonths || null,
    stillEmployed: data.stillEmployed !== undefined ? (data.stillEmployed ? 1 : 0) : 1,
    
    feedbackStage: data.feedbackStage,
    feedbackSource: data.feedbackSource || 'recruiter',
  });

  const feedbackId = result.insertId as number;
  
  console.log(`[MatchFeedback] Submitted feedback ${feedbackId} for candidate ${data.candidateId}`);
  
  // Trigger analytics update asynchronously
  updateFeedbackAnalytics().catch(error => {
    console.error("[MatchFeedback] Error updating analytics:", error);
  });

  return feedbackId;
}

/**
 * Get feedback for a specific match
 */
export async function getMatchFeedback(candidateId: number, jobId: number): Promise<any[]> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const feedback = await db.select()
    .from(matchFeedback)
    .where(
      and(
        eq(matchFeedback.candidateId, candidateId),
        eq(matchFeedback.jobId, jobId)
      )
    )
    .orderBy(desc(matchFeedback.createdAt));

  return feedback;
}

/**
 * Get pending feedback requests (matches that need feedback)
 */
export async function getPendingFeedbackRequests(recruiterId: number): Promise<any[]> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Find hired candidates without recent feedback
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const feedback = await db.select()
    .from(matchFeedback)
    .where(
      and(
        eq(matchFeedback.recruiterId, recruiterId),
        eq(matchFeedback.wasHired, 1),
        gte(matchFeedback.hiredDate, thirtyDaysAgo)
      )
    )
    .orderBy(desc(matchFeedback.hiredDate));

  return feedback;
}

/**
 * Update feedback analytics (aggregated insights)
 */
export async function updateFeedbackAnalytics(): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    // Get all feedback
    const allFeedback = await db.select().from(matchFeedback);

    if (allFeedback.length === 0) {
      console.log("[MatchFeedback] No feedback data available for analytics");
      return;
    }

    // Calculate accuracy metrics
    const skillAccuracyScores = allFeedback
      .filter(f => f.skillMatchAccuracy !== null)
      .map(f => f.skillMatchAccuracy as number);
    
    const cultureAccuracyScores = allFeedback
      .filter(f => f.cultureFitAccuracy !== null)
      .map(f => f.cultureFitAccuracy as number);
    
    const wellbeingAccuracyScores = allFeedback
      .filter(f => f.wellbeingMatchAccuracy !== null)
      .map(f => f.wellbeingMatchAccuracy as number);
    
    const satisfactionScores = allFeedback
      .filter(f => f.overallSatisfaction !== null)
      .map(f => f.overallSatisfaction as number);

    const avgSkillMatchAccuracy = calculateAverage(skillAccuracyScores);
    const avgCultureFitAccuracy = calculateAverage(cultureAccuracyScores);
    const avgWellbeingMatchAccuracy = calculateAverage(wellbeingAccuracyScores);
    const avgOverallSatisfaction = calculateAverage(satisfactionScores);

    // Calculate success rates
    const hiredCount = allFeedback.filter(f => f.wasHired === 1).length;
    const successfulCount = allFeedback.filter(f => f.matchSuccessful === 1).length;
    const stillEmployedCount = allFeedback.filter(f => f.stillEmployed === 1).length;

    const hireRate = Math.round((hiredCount / allFeedback.length) * 10000); // * 100 for percentage, * 100 for storage
    const successRate = hiredCount > 0 ? Math.round((successfulCount / hiredCount) * 10000) : 0;
    const retentionRate = hiredCount > 0 ? Math.round((stillEmployedCount / hiredCount) * 10000) : 0;

    // Generate calibration data for model retraining
    const scoreCalibrationData = generateCalibrationData(allFeedback);
    const recommendedAdjustments = generateRecommendedAdjustments(allFeedback);

    // Determine trend
    const improvementTrend = determineImprovementTrend(allFeedback);

    // Generate key insights
    const keyInsights = generateKeyInsights(allFeedback, {
      avgSkillMatchAccuracy,
      avgCultureFitAccuracy,
      avgWellbeingMatchAccuracy,
      successRate,
      retentionRate,
    });

    // Insert analytics record
    await db.insert(feedbackAnalytics).values({
      analysisDate: new Date(),
      totalFeedbackCount: allFeedback.length,
      avgSkillMatchAccuracy,
      avgCultureFitAccuracy,
      avgWellbeingMatchAccuracy,
      avgOverallSatisfaction,
      hireRate,
      successRate,
      retentionRate,
      scoreCalibrationData,
      recommendedAdjustments,
      improvementTrend,
      keyInsights,
    });

    console.log("[MatchFeedback] Analytics updated successfully");
  } catch (error) {
    console.error("[MatchFeedback] Error updating analytics:", error);
    throw error;
  }
}

/**
 * Helper: Calculate average of numbers
 */
function calculateAverage(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  const sum = numbers.reduce((acc, n) => acc + n, 0);
  return Math.round((sum / numbers.length) * 100); // * 100 for storage (e.g., 4.25 -> 425)
}

/**
 * Helper: Generate calibration data for model retraining
 */
function generateCalibrationData(feedback: any[]): any {
  const calibrationPoints = feedback
    .filter(f => f.originalMatchScore !== null && f.matchSuccessful !== null)
    .map(f => ({
      predictedScore: f.originalMatchScore,
      actualSuccess: f.matchSuccessful === 1,
      skillScore: f.originalSkillScore,
      cultureScore: f.originalCultureScore,
      wellbeingScore: f.originalWellbeingScore,
      skillAccuracy: f.skillMatchAccuracy,
      cultureAccuracy: f.cultureFitAccuracy,
      wellbeingAccuracy: f.wellbeingMatchAccuracy,
    }));

  return {
    dataPoints: calibrationPoints.length,
    sampleData: calibrationPoints.slice(0, 100), // Store sample for analysis
  };
}

/**
 * Helper: Generate recommended weight adjustments
 */
function generateRecommendedAdjustments(feedback: any[]): any {
  // Analyze which components are most predictive of success
  const successfulMatches = feedback.filter(f => f.matchSuccessful === 1);
  const unsuccessfulMatches = feedback.filter(f => f.matchSuccessful === 0);

  const avgSuccessfulSkill = calculateAverage(
    successfulMatches.filter(f => f.originalSkillScore !== null).map(f => f.originalSkillScore as number)
  );
  const avgSuccessfulCulture = calculateAverage(
    successfulMatches.filter(f => f.originalCultureScore !== null).map(f => f.originalCultureScore as number)
  );
  const avgSuccessfulWellbeing = calculateAverage(
    successfulMatches.filter(f => f.originalWellbeingScore !== null).map(f => f.originalWellbeingScore as number)
  );

  return {
    currentWeights: {
      skill: 40,
      culture: 30,
      wellbeing: 30,
    },
    suggestedWeights: {
      skill: avgSuccessfulSkill > 7500 ? 45 : 35,
      culture: avgSuccessfulCulture > 7500 ? 35 : 25,
      wellbeing: avgSuccessfulWellbeing > 7500 ? 35 : 25,
    },
    confidence: feedback.length >= 50 ? 'high' : feedback.length >= 20 ? 'medium' : 'low',
  };
}

/**
 * Helper: Determine improvement trend
 */
function determineImprovementTrend(feedback: any[]): 'improving' | 'stable' | 'declining' {
  if (feedback.length < 10) return 'stable';

  // Sort by date
  const sorted = [...feedback].sort((a, b) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const midpoint = Math.floor(sorted.length / 2);
  const firstHalf = sorted.slice(0, midpoint);
  const secondHalf = sorted.slice(midpoint);

  const firstHalfSuccess = firstHalf.filter(f => f.matchSuccessful === 1).length / firstHalf.length;
  const secondHalfSuccess = secondHalf.filter(f => f.matchSuccessful === 1).length / secondHalf.length;

  const improvement = secondHalfSuccess - firstHalfSuccess;

  if (improvement > 0.05) return 'improving';
  if (improvement < -0.05) return 'declining';
  return 'stable';
}

/**
 * Helper: Generate key insights text
 */
function generateKeyInsights(feedback: any[], metrics: any): string {
  const insights: string[] = [];

  // Success rate insight
  const successRatePercent = metrics.successRate / 100;
  if (successRatePercent >= 80) {
    insights.push(`Excellent match success rate of ${successRatePercent}%.`);
  } else if (successRatePercent >= 60) {
    insights.push(`Good match success rate of ${successRatePercent}%, with room for improvement.`);
  } else {
    insights.push(`Match success rate of ${successRatePercent}% indicates need for algorithm refinement.`);
  }

  // Retention insight
  const retentionPercent = metrics.retentionRate / 100;
  if (retentionPercent >= 85) {
    insights.push(`Strong retention rate of ${retentionPercent}% shows quality matches.`);
  } else if (retentionPercent < 70) {
    insights.push(`Retention rate of ${retentionPercent}% suggests focus on long-term fit factors.`);
  }

  // Component accuracy insight
  const skillAccuracy = metrics.avgSkillMatchAccuracy / 100;
  const cultureAccuracy = metrics.avgCultureFitAccuracy / 100;
  const wellbeingAccuracy = metrics.avgWellbeingMatchAccuracy / 100;

  const lowestComponent = Math.min(skillAccuracy, cultureAccuracy, wellbeingAccuracy);
  if (lowestComponent === skillAccuracy) {
    insights.push("Skill matching accuracy could be improved with better skill taxonomy.");
  } else if (lowestComponent === cultureAccuracy) {
    insights.push("Culture fit assessment needs refinement for better predictions.");
  } else {
    insights.push("Wellbeing compatibility scoring requires more training data.");
  }

  return insights.join(" ");
}

/**
 * Get latest feedback analytics
 */
export async function getLatestFeedbackAnalytics(): Promise<any> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const [latest] = await db.select()
    .from(feedbackAnalytics)
    .orderBy(desc(feedbackAnalytics.analysisDate))
    .limit(1);

  return latest;
}

/**
 * Get feedback analytics history
 */
export async function getFeedbackAnalyticsHistory(limit: number = 30): Promise<any[]> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const history = await db.select()
    .from(feedbackAnalytics)
    .orderBy(desc(feedbackAnalytics.analysisDate))
    .limit(limit);

  return history;
}
