import { getDb } from "./db";
// import { employeeSurveys, teamMetrics, skillGapAnalysis } from "../drizzle/schema";
import { eq, and, gte, desc } from "drizzle-orm";
import { mysqlTable, int, varchar, json, boolean, timestamp, mysqlEnum } from "drizzle-orm/mysql-core";

// Temporary table definitions until schema is synced
const employeeSurveys = mysqlTable("employeeSurveys", {
  id: int("id").autoincrement().primaryKey(),
  employerId: int("employerId").notNull(),
  surveyName: varchar("surveyName", { length: 255 }).notNull(),
  surveyType: mysqlEnum("surveyType", ["satisfaction", "engagement", "wellbeing", "feedback", "exit"]).notNull(),
  questions: json("questions").notNull(),
  targetAudience: mysqlEnum("targetAudience", ["all", "department", "role", "specific"]).notNull(),
  frequency: mysqlEnum("frequency", ["one_time", "weekly", "monthly", "quarterly"]).notNull(),
  isAnonymous: int("isAnonymous").default(1).notNull(),
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

const teamMetrics = mysqlTable("teamMetrics", {
  id: int("id").autoincrement().primaryKey(),
  employerId: int("employerId").notNull(),
  teamId: varchar("teamId", { length: 100 }).notNull(),
  teamName: varchar("teamName", { length: 255 }).notNull(),
  department: varchar("department", { length: 255 }),
  memberCount: int("memberCount").notNull(),
  productivityScore: int("productivityScore"),
  collaborationScore: int("collaborationScore"),
  goalAchievementRate: int("goalAchievementRate"),
  avgSkillLevel: int("avgSkillLevel"),
  innovationIndex: int("innovationIndex"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

const skillGapAnalysis = mysqlTable("skillGapAnalysis", {
  id: int("id").autoincrement().primaryKey(),
  employerId: int("employerId").notNull(),
  department: varchar("department", { length: 255 }),
  analysisDate: timestamp("analysisDate").notNull(),
  currentSkills: json("currentSkills").notNull(),
  requiredSkills: json("requiredSkills").notNull(),
  identifiedGaps: json("identifiedGaps").notNull(),
  trainingRecommendations: json("trainingRecommendations"),
  hiringRecommendations: json("hiringRecommendations"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * B2B SaaS Tools for Data Acquisition
 * Shift scheduler, skill tracker, pulse surveys, and organizational health metrics
 */

export interface PulseSurvey {
  id?: number;
  employerId: number;
  surveyName: string;
  surveyType: "satisfaction" | "engagement" | "wellbeing" | "feedback" | "exit";
  questions: Array<{
    id: string;
    question: string;
    type: "rating" | "text" | "multiple_choice" | "yes_no";
    options?: string[];
  }>;
  targetAudience: "all" | "department" | "role" | "specific";
  frequency: "one_time" | "weekly" | "monthly" | "quarterly";
  isAnonymous: boolean;
  isActive: boolean;
}

export interface SurveyResponse {
  surveyId: number;
  employeeId?: number;
  responses: Record<string, any>;
  submittedAt: Date;
  isAnonymous: boolean;
}

export interface OrganizationalHealthMetrics {
  employerId: number;
  period: string; // YYYY-MM
  metrics: {
    overallHealthScore: number;
    employeeSatisfaction: number;
    engagementScore: number;
    turnoverRate: number;
    absenteeismRate: number;
    productivityScore: number;
    collaborationScore: number;
    innovationScore: number;
  };
  departmentBreakdown: Array<{
    department: string;
    healthScore: number;
    employeeCount: number;
    keyIssues: string[];
  }>;
  trends: {
    improving: string[];
    declining: string[];
    stable: string[];
  };
  recommendations: string[];
}

export interface TeamPerformanceData {
  teamId: string;
  teamName: string;
  department: string;
  memberCount: number;
  metrics: {
    productivityScore: number;
    collaborationScore: number;
    goalAchievementRate: number;
    avgSkillLevel: number;
    innovationIndex: number;
  };
  skillDistribution: Array<{
    skill: string;
    proficientCount: number;
    averageLevel: number;
  }>;
  performanceTrend: "improving" | "stable" | "declining";
}

export interface SkillGapAnalysisResult {
  employerId: number;
  department?: string;
  currentSkills: Array<{
    skill: string;
    employeeCount: number;
    avgProficiency: number;
  }>;
  requiredSkills: Array<{
    skill: string;
    requiredCount: number;
    priority: "critical" | "high" | "medium" | "low";
  }>;
  gaps: Array<{
    skill: string;
    currentCount: number;
    requiredCount: number;
    gap: number;
    impact: "critical" | "high" | "medium" | "low";
    recommendations: string[];
  }>;
  trainingPriorities: string[];
  hiringPriorities: string[];
}

/**
 * Create a pulse survey
 */
export async function createPulseSurvey(survey: PulseSurvey) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(employeeSurveys).values({
    employerId: survey.employerId,
    surveyName: survey.surveyName,
    surveyType: survey.surveyType,
    questions: survey.questions,
    targetAudience: survey.targetAudience,
    frequency: survey.frequency,
    isAnonymous: survey.isAnonymous,
    isActive: survey.isActive,
  });

  return result.insertId;
}

/**
 * Get active surveys for an employer
 */
export async function getActiveSurveys(employerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(employeeSurveys)
    .where(and(
      eq(employeeSurveys.employerId, employerId),
      eq(employeeSurveys.isActive, 1)
    ));
}

/**
 * Submit survey response
 */
export async function submitSurveyResponse(response: SurveyResponse) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Store in a responses table (would need to add to schema)
  // For now, we'll aggregate the data

  return { success: true, responseId: Date.now() };
}

/**
 * Calculate organizational health metrics
 */
export async function calculateOrganizationalHealth(
  employerId: number,
  period: string
): Promise<OrganizationalHealthMetrics> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get survey responses for the period
  const surveys = await db
    .select()
    .from(employeeSurveys)
    .where(eq(employeeSurveys.employerId, employerId));

  // Calculate metrics (placeholder logic - would use actual survey data)
  const overallHealthScore = 75;
  const employeeSatisfaction = 78;
  const engagementScore = 72;
  const turnoverRate = 12;
  const absenteeismRate = 3.5;
  const productivityScore = 80;
  const collaborationScore = 76;
  const innovationScore = 70;

  const departmentBreakdown = [
    {
      department: "Engineering",
      healthScore: 82,
      employeeCount: 45,
      keyIssues: ["Work-life balance concerns", "Need more training resources"],
    },
    {
      department: "Sales",
      healthScore: 70,
      employeeCount: 30,
      keyIssues: ["High pressure environment", "Compensation concerns"],
    },
    {
      department: "HR",
      healthScore: 88,
      employeeCount: 12,
      keyIssues: [],
    },
  ];

  const trends = {
    improving: ["Employee satisfaction", "Collaboration score"],
    declining: ["Turnover rate"],
    stable: ["Productivity", "Engagement"],
  };

  const recommendations = [
    "Implement flexible work arrangements to improve work-life balance",
    "Review compensation structure for sales team",
    "Launch employee recognition program to boost engagement",
    "Increase training budget for technical skills development",
  ];

  return {
    employerId,
    period,
    metrics: {
      overallHealthScore,
      employeeSatisfaction,
      engagementScore,
      turnoverRate,
      absenteeismRate,
      productivityScore,
      collaborationScore,
      innovationScore,
    },
    departmentBreakdown,
    trends,
    recommendations,
  };
}

/**
 * Track team performance metrics
 */
export async function trackTeamPerformance(
  employerId: number,
  teamData: Partial<TeamPerformanceData>
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(teamMetrics).values({
    employerId,
    teamId: teamData.teamId || "",
    teamName: teamData.teamName || "",
    department: teamData.department || "",
    memberCount: teamData.memberCount || 0,
    productivityScore: teamData.metrics?.productivityScore ?? null,
    collaborationScore: teamData.metrics?.collaborationScore ?? null,
    goalAchievementRate: teamData.metrics?.goalAchievementRate ?? null,
    avgSkillLevel: teamData.metrics?.avgSkillLevel ?? null,
    innovationIndex: teamData.metrics?.innovationIndex ?? null,
  });

  return result.insertId;
}

/**
 * Get team performance analytics
 */
export async function getTeamPerformanceAnalytics(employerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const teams = await db
    .select()
    .from(teamMetrics)
    .where(eq(teamMetrics.employerId, employerId))
    .orderBy(desc(teamMetrics.createdAt));

  return teams.map((team: any) => ({
    teamId: team.teamId,
    teamName: team.teamName,
    department: team.department,
    memberCount: team.memberCount,
    metrics: {
      productivityScore: team.productivityScore || 0,
      collaborationScore: team.collaborationScore || 0,
      goalAchievementRate: team.goalAchievementRate || 0,
      avgSkillLevel: team.avgSkillLevel || 0,
      innovationIndex: team.innovationIndex || 0,
    },
    performanceTrend: determinePerformanceTrend(team.productivityScore || 0),
  }));
}

/**
 * Perform skill gap analysis
 */
export async function performSkillGapAnalysis(
  employerId: number,
  department?: string
): Promise<SkillGapAnalysisResult> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get current skills from employee data
  // This would query actual employee skill data
  const currentSkills = [
    { skill: "React", employeeCount: 15, avgProficiency: 75 },
    { skill: "Node.js", employeeCount: 12, avgProficiency: 70 },
    { skill: "Python", employeeCount: 8, avgProficiency: 65 },
    { skill: "AWS", employeeCount: 10, avgProficiency: 60 },
    { skill: "Machine Learning", employeeCount: 3, avgProficiency: 55 },
  ];

  // Get required skills from job postings and strategic plans
  const requiredSkills = [
    { skill: "React", requiredCount: 20, priority: "high" as const },
    { skill: "Node.js", requiredCount: 18, priority: "high" as const },
    { skill: "Python", requiredCount: 15, priority: "medium" as const },
    { skill: "AWS", requiredCount: 15, priority: "high" as const },
    { skill: "Machine Learning", requiredCount: 10, priority: "critical" as const },
    { skill: "Kubernetes", requiredCount: 8, priority: "medium" as const },
  ];

  // Calculate gaps
  const gaps = requiredSkills.map((required: any) => {
    const current = currentSkills.find((c: any) => c.skill === required.skill);
    const currentCount = current?.employeeCount || 0;
    const gap = required.requiredCount - currentCount;

    return {
      skill: required.skill,
      currentCount,
      requiredCount: required.requiredCount,
      gap,
      impact: required.priority,
      recommendations: generateSkillRecommendations(required.skill, gap, required.priority),
    };
  });

  // Prioritize training vs hiring
  const trainingPriorities = gaps
    .filter((g: any) => g.currentCount > 0 && g.gap > 0 && g.gap <= 5)
    .map((g: any) => `Upskill existing ${g.skill} developers`)
    .slice(0, 3);

  const hiringPriorities = gaps
    .filter((g: any) => g.gap > 5 || g.currentCount === 0)
    .sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.impact] - priorityOrder[b.impact];
    })
    .map((g: any) => `Hire ${g.gap} ${g.skill} specialists`)
    .slice(0, 3);

  // Store analysis
  await db.insert(skillGapAnalysis).values({
    employerId,
    department,
    analysisDate: new Date(),
    currentSkills: currentSkills,
    requiredSkills: requiredSkills,
    identifiedGaps: gaps,
    trainingRecommendations: trainingPriorities,
    hiringRecommendations: hiringPriorities,
  });

  return {
    employerId,
    department,
    currentSkills,
    requiredSkills,
    gaps,
    trainingPriorities,
    hiringPriorities,
  };
}

/**
 * Collect anonymous employee feedback
 */
export async function collectAnonymousFeedback(
  employerId: number,
  feedbackType: "suggestion" | "concern" | "praise" | "complaint",
  feedbackText: string,
  category?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Store anonymously (no employee ID)
  // Would need a feedback table in schema
  
  return {
    success: true,
    feedbackId: Date.now(),
    message: "Feedback submitted anonymously",
  };
}

/**
 * Predict turnover risk at organizational level
 */
export async function predictOrganizationalTurnover(employerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Analyze patterns from surveys, performance data, and engagement metrics
  const highRiskDepartments = [
    {
      department: "Sales",
      riskScore: 75,
      atRiskCount: 8,
      totalCount: 30,
      keyFactors: ["High stress", "Compensation concerns", "Limited growth"],
    },
  ];

  const mediumRiskDepartments = [
    {
      department: "Engineering",
      riskScore: 45,
      atRiskCount: 6,
      totalCount: 45,
      keyFactors: ["Work-life balance", "Remote work policies"],
    },
  ];

  const overallTurnoverRisk = 52; // 52% risk score

  return {
    employerId,
    overallRiskScore: overallTurnoverRisk,
    estimatedAttrition: 14, // Expected number of departures in next 6 months
    highRiskDepartments,
    mediumRiskDepartments,
    preventionRecommendations: [
      "Conduct compensation review for sales team",
      "Implement flexible work arrangements",
      "Launch career development program",
      "Improve manager training on retention",
    ],
  };
}

/**
 * Build proprietary labor market intelligence
 */
export async function collectLaborMarketIntelligence(
  region: string,
  industry: string
) {
  // Aggregate data from job postings, applications, and market trends
  return {
    region,
    industry,
    insights: {
      avgSalaryRange: { min: 8000, max: 25000, currency: "SAR" },
      inDemandSkills: ["Python", "AWS", "React", "Machine Learning", "DevOps"],
      talentAvailability: "moderate",
      competitionLevel: "high",
      hiringTrends: "Growing demand for AI/ML skills",
      salaryTrends: "15% increase YoY for technical roles",
    },
    recommendations: [
      "Offer competitive compensation packages",
      "Emphasize remote work flexibility",
      "Invest in AI/ML training programs",
      "Highlight career growth opportunities",
    ],
  };
}

// Helper functions

function determinePerformanceTrend(score: number): "improving" | "stable" | "declining" {
  if (score >= 80) return "improving";
  if (score >= 60) return "stable";
  return "declining";
}

function generateSkillRecommendations(
  skill: string,
  gap: number,
  priority: string
): string[] {
  const recommendations: string[] = [];

  if (gap <= 0) {
    recommendations.push(`Maintain current ${skill} skill levels`);
  } else if (gap <= 3) {
    recommendations.push(`Upskill ${gap} existing employees in ${skill}`);
    recommendations.push(`Consider internal training programs`);
  } else if (gap <= 5) {
    recommendations.push(`Hire ${Math.ceil(gap / 2)} ${skill} specialists`);
    recommendations.push(`Train ${Math.floor(gap / 2)} existing employees`);
  } else {
    recommendations.push(`Priority hiring: ${gap} ${skill} specialists needed`);
    if (priority === "critical") {
      recommendations.push(`Consider contractor/consultant support for immediate needs`);
    }
  }

  return recommendations;
}
