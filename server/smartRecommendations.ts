import { and, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { getDb } from "./db";
import { matchHistory, candidates, jobs, savedMatches } from "../drizzle/schema";
import { calculateMatchScore } from "./aiMatching";

/**
 * Learning weights based on historical outcomes
 * These weights are adjusted based on which attributes led to successful hires
 */
interface LearningWeights {
  skillWeight: number;
  cultureWeight: number;
  wellbeingWeight: number;
  experienceWeight: number;
  outcomeBonus: Record<string, number>;
}

/**
 * Calculate learning weights from historical match outcomes
 * Analyzes which attributes correlated with successful hires
 */
export async function calculateLearningWeights(params: {
  userId: number;
  lookbackDays?: number;
}): Promise<LearningWeights> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { userId, lookbackDays = 90 } = params;

  const lookbackDate = new Date();
  lookbackDate.setDate(lookbackDate.getDate() - lookbackDays);

  // Get historical matches with outcomes
  const historicalMatches = await db
    .select({
      outcome: matchHistory.outcome,
      skillScore: matchHistory.skillScore,
      cultureScore: matchHistory.cultureScore,
      wellbeingScore: matchHistory.wellbeingScore,
      technicalScore: matchHistory.technicalScore,
      overallScore: matchHistory.overallScore,
    })
    .from(matchHistory)
    .where(
      and(
        eq(matchHistory.userId, userId),
        gte(matchHistory.matchedAt, lookbackDate.toISOString())
      )
    );

  if (historicalMatches.length === 0) {
    // Default weights if no history
    return {
      skillWeight: 0.35,
      cultureWeight: 0.25,
      wellbeingWeight: 0.20,
      experienceWeight: 0.20,
      outcomeBonus: {
        hired: 1.2,
        offered: 1.1,
        interviewed: 1.05,
        contacted: 1.0,
        rejected: 0.8,
      },
    };
  }

  // Calculate correlation between scores and positive outcomes
  const hiredMatches = historicalMatches.filter(m => m.outcome === 'hired');
  const offeredMatches = historicalMatches.filter(m => m.outcome === 'offered');
  const interviewedMatches = historicalMatches.filter(m => m.outcome === 'interviewed');

  const successfulMatches = [...hiredMatches, ...offeredMatches, ...interviewedMatches];

  if (successfulMatches.length === 0) {
    // Default weights if no successful outcomes yet
    return {
      skillWeight: 0.35,
      cultureWeight: 0.25,
      wellbeingWeight: 0.20,
      experienceWeight: 0.20,
      outcomeBonus: {
        hired: 1.2,
        offered: 1.1,
        interviewed: 1.05,
        contacted: 1.0,
        rejected: 0.8,
      },
    };
  }

  // Calculate average scores for successful matches
  const avgSkillScore = successfulMatches.reduce((sum, m) => sum + (m.skillScore || 0), 0) / successfulMatches.length;
  const avgCultureScore = successfulMatches.reduce((sum, m) => sum + (m.cultureScore || 0), 0) / successfulMatches.length;
  const avgWellbeingScore = successfulMatches.reduce((sum, m) => sum + (m.wellbeingScore || 0), 0) / successfulMatches.length;
  const avgTechnicalScore = successfulMatches.reduce((sum, m) => sum + (m.technicalScore || 0), 0) / successfulMatches.length;

  // Normalize to weights that sum to 1.0
  const total = avgSkillScore + avgCultureScore + avgWellbeingScore + avgTechnicalScore;

  return {
    skillWeight: avgSkillScore / total,
    cultureWeight: avgCultureScore / total,
    wellbeingWeight: avgWellbeingScore / total,
    experienceWeight: avgTechnicalScore / total,
    outcomeBonus: {
      hired: 1.2,
      offered: 1.1,
      interviewed: 1.05,
      contacted: 1.0,
      rejected: 0.8,
    },
  };
}

/**
 * Get smart recommendations for a new job
 * Uses learning weights to rank candidates based on historical success patterns
 */
export async function getSmartRecommendations(params: {
  userId: number;
  jobId: number;
  limit?: number;
  minScore?: number;
}): Promise<Array<{
  candidate: any;
  recommendationScore: number;
  matchScores: any;
  explanation: string;
  confidence: number;
}>> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { userId, jobId, limit = 10, minScore = 60 } = params;

  // Get learning weights from historical data
  const weights = await calculateLearningWeights({ userId });

  // Get the job
  const [job] = await db
    .select()
    .from(jobs)
    .where(and(eq(jobs.id, jobId), eq(jobs.userId, userId)))
    .limit(1);

  if (!job) {
    throw new Error("Job not found");
  }

  // Get all active candidates
  const candidatesList = await db
    .select()
    .from(candidates)
    .where(eq(candidates.userId, userId));

  // Calculate match scores for all candidates
  const recommendations = [];

  for (const candidate of candidatesList) {
    try {
      // Calculate base match score
      const matchScores = await calculateMatchScore(candidate, job);

      // Apply learning weights to calculate recommendation score
      const recommendationScore = 
        (matchScores.skillMatchScore * weights.skillWeight) +
        (matchScores.cultureFitScore * weights.cultureWeight) +
        (matchScores.wellbeingMatchScore * weights.wellbeingWeight) +
        (matchScores.experienceMatchScore * weights.experienceWeight);

      // Check if candidate has history with similar jobs
      const candidateHistory = await db
        .select()
        .from(matchHistory)
        .where(
          and(
            eq(matchHistory.candidateId, candidate.id),
            eq(matchHistory.userId, userId)
          )
        )
        .limit(5);

      // Calculate confidence based on historical data
      let confidence = 0.7; // Base confidence
      if (candidateHistory.length > 0) {
        const successfulOutcomes = candidateHistory.filter(
          h => h.outcome === 'hired' || h.outcome === 'offered' || h.outcome === 'interviewed'
        ).length;
        confidence = Math.min(0.95, 0.7 + (successfulOutcomes / candidateHistory.length) * 0.25);
      }

      // Apply outcome bonus if candidate has positive history
      let finalScore = recommendationScore;
      if (candidateHistory.length > 0) {
        const lastOutcome = candidateHistory[0]?.outcome;
        if (lastOutcome && weights.outcomeBonus[lastOutcome]) {
          finalScore *= weights.outcomeBonus[lastOutcome];
        }
      }

      if (finalScore >= minScore) {
        recommendations.push({
          candidate,
          recommendationScore: Math.round(finalScore),
          matchScores,
          explanation: generateRecommendationExplanation(matchScores, weights, candidateHistory),
          confidence: Math.round(confidence * 100) / 100,
        });
      }
    } catch (error) {
      console.error(`Error calculating recommendation for candidate ${candidate.id}:`, error);
      // Continue with next candidate
    }
  }

  // Sort by recommendation score and return top N
  recommendations.sort((a, b) => b.recommendationScore - a.recommendationScore);
  return recommendations.slice(0, limit);
}

/**
 * Generate human-readable explanation for recommendation
 */
function generateRecommendationExplanation(
  matchScores: any,
  weights: LearningWeights,
  history: any[]
): string {
  const reasons = [];

  // Identify strongest attributes
  const scores = [
    { name: 'skills', score: matchScores.skillMatchScore, weight: weights.skillWeight },
    { name: 'culture fit', score: matchScores.cultureFitScore, weight: weights.cultureWeight },
    { name: 'wellbeing compatibility', score: matchScores.wellbeingMatchScore, weight: weights.wellbeingWeight },
    { name: 'experience', score: matchScores.experienceMatchScore, weight: weights.experienceWeight },
  ];

  scores.sort((a, b) => (b.score * b.weight) - (a.score * a.weight));

  reasons.push(`Strong ${scores[0].name} match (${scores[0].score}/100)`);
  reasons.push(`Good ${scores[1].name} (${scores[1].score}/100)`);

  if (history.length > 0) {
    const successfulOutcomes = history.filter(
      h => h.outcome === 'hired' || h.outcome === 'offered' || h.outcome === 'interviewed'
    ).length;
    if (successfulOutcomes > 0) {
      reasons.push(`Positive history: ${successfulOutcomes} successful outcome${successfulOutcomes > 1 ? 's' : ''}`);
    }
  }

  return reasons.join('. ');
}

/**
 * Get recommendation statistics
 */
export async function getRecommendationStatistics(params: {
  userId: number;
  jobId: number;
}): Promise<{
  totalCandidates: number;
  highConfidence: number;
  mediumConfidence: number;
  lowConfidence: number;
  avgRecommendationScore: number;
}> {
  const recommendations = await getSmartRecommendations({
    userId: params.userId,
    jobId: params.jobId,
    limit: 100,
    minScore: 0,
  });

  const highConfidence = recommendations.filter(r => r.confidence >= 0.8).length;
  const mediumConfidence = recommendations.filter(r => r.confidence >= 0.6 && r.confidence < 0.8).length;
  const lowConfidence = recommendations.filter(r => r.confidence < 0.6).length;

  const avgScore = recommendations.length > 0
    ? recommendations.reduce((sum, r) => sum + r.recommendationScore, 0) / recommendations.length
    : 0;

  return {
    totalCandidates: recommendations.length,
    highConfidence,
    mediumConfidence,
    lowConfidence,
    avgRecommendationScore: Math.round(avgScore),
  };
}

/**
 * Record feedback on recommendations to improve learning
 */
export async function recordRecommendationFeedback(params: {
  userId: number;
  candidateId: number;
  jobId: number;
  wasHelpful: boolean;
  actualOutcome?: string;
}): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // This feedback can be used to further refine the learning weights
  // For now, we just log it
  console.log('Recommendation feedback:', params);

  // In a production system, you would:
  // 1. Store feedback in a dedicated table
  // 2. Periodically retrain the learning weights based on feedback
  // 3. Use A/B testing to validate weight adjustments
}
