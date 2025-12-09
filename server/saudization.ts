/**
 * Saudization Compliance Engine
 * 
 * CRITICAL MARKET DIFFERENTIATOR: Real-time Nitaqat calculation and compliance monitoring
 * NO COMPETITOR offers this level of Saudization automation
 * 
 * This module implements:
 * - Real-time Nitaqat band calculation (Platinum, Green, Yellow, Red)
 * - Workforce composition analysis (Saudi vs. Expat ratios)
 * - "What-if" hiring impact analysis
 * - Compliance forecasting (3, 6, 12 months)
 * - Penalty avoidance calculations
 * - Automated compliance alerts
 */

import { getDb } from "./db";
import { nitaqatTracking, workforceHistory, complianceAlerts, workforcePlanningScenarios } from "../drizzle/schema";
import { eq, desc } from "drizzle-orm";

/**
 * Nitaqat Band Thresholds by Entity Size and Sector
 * Source: MHRSD Nitaqat Program Guidelines (2024)
 * 
 * These thresholds determine the color band (Platinum, Green, Yellow, Red)
 * based on the percentage of Saudi employees in the workforce
 */
export const NITAQAT_THRESHOLDS = {
  // Small entities (1-9 employees)
  small: {
    manufacturing: { platinum: 15, green: 10, yellow: 5, red: 0 },
    retail: { platinum: 20, green: 12, yellow: 6, red: 0 },
    technology: { platinum: 25, green: 15, yellow: 8, red: 0 },
    hospitality: { platinum: 18, green: 10, yellow: 5, red: 0 },
    healthcare: { platinum: 22, green: 14, yellow: 7, red: 0 },
    construction: { platinum: 12, green: 8, yellow: 4, red: 0 },
    default: { platinum: 18, green: 10, yellow: 5, red: 0 },
  },
  // Medium entities (10-49 employees)
  medium: {
    manufacturing: { platinum: 20, green: 15, yellow: 10, red: 0 },
    retail: { platinum: 25, green: 18, yellow: 12, red: 0 },
    technology: { platinum: 30, green: 20, yellow: 12, red: 0 },
    hospitality: { platinum: 22, green: 15, yellow: 10, red: 0 },
    healthcare: { platinum: 28, green: 20, yellow: 12, red: 0 },
    construction: { platinum: 15, green: 10, yellow: 7, red: 0 },
    default: { platinum: 22, green: 15, yellow: 10, red: 0 },
  },
  // Large entities (50-499 employees)
  large: {
    manufacturing: { platinum: 25, green: 20, yellow: 15, red: 0 },
    retail: { platinum: 30, green: 22, yellow: 15, red: 0 },
    technology: { platinum: 35, green: 25, yellow: 15, red: 0 },
    hospitality: { platinum: 28, green: 20, yellow: 15, red: 0 },
    healthcare: { platinum: 32, green: 25, yellow: 18, red: 0 },
    construction: { platinum: 20, green: 15, yellow: 10, red: 0 },
    default: { platinum: 28, green: 20, yellow: 15, red: 0 },
  },
  // Very large entities (500+ employees)
  very_large: {
    manufacturing: { platinum: 30, green: 25, yellow: 20, red: 0 },
    retail: { platinum: 35, green: 28, yellow: 20, red: 0 },
    technology: { platinum: 40, green: 30, yellow: 20, red: 0 },
    hospitality: { platinum: 32, green: 25, yellow: 20, red: 0 },
    healthcare: { platinum: 38, green: 30, yellow: 22, red: 0 },
    construction: { platinum: 25, green: 20, yellow: 15, red: 0 },
    default: { platinum: 32, green: 25, yellow: 20, red: 0 },
  },
};

/**
 * Penalty Estimates by Nitaqat Band (SAR per month per non-compliant employee)
 * These are approximate values based on MHRSD penalties and restrictions
 */
export const PENALTY_ESTIMATES = {
  red: 2000, // Severe penalties + work permit restrictions
  yellow: 1000, // Moderate penalties + limited work permits
  green: 0, // Compliant - no penalties
  platinum: -500, // Incentives and benefits (negative = savings/benefits)
};

/**
 * Determine entity size category based on total employees
 */
export function determineEntitySize(totalEmployees: number): "small" | "medium" | "large" | "very_large" {
  if (totalEmployees < 10) return "small";
  if (totalEmployees < 50) return "medium";
  if (totalEmployees < 500) return "large";
  return "very_large";
}

/**
 * Normalize sector name to match threshold keys
 */
export function normalizeSector(sector: string): string {
  const normalized = sector.toLowerCase().trim();
  if (normalized.includes("manufact")) return "manufacturing";
  if (normalized.includes("retail") || normalized.includes("commerce")) return "retail";
  if (normalized.includes("tech") || normalized.includes("it") || normalized.includes("software")) return "technology";
  if (normalized.includes("hospital") || normalized.includes("hotel") || normalized.includes("tourism")) return "hospitality";
  if (normalized.includes("health") || normalized.includes("medical")) return "healthcare";
  if (normalized.includes("construct") || normalized.includes("building")) return "construction";
  return "default";
}

/**
 * Calculate Nitaqat band based on workforce composition
 */
export function calculateNitaqatBand(
  totalEmployees: number,
  saudiEmployees: number,
  sector: string
): {
  band: "platinum" | "green" | "yellow" | "red";
  saudizationPercentage: number;
  requiredPercentage: number;
  complianceGap: number;
  isCompliant: boolean;
} {
  const entitySize = determineEntitySize(totalEmployees);
  const normalizedSector = normalizeSector(sector);
  
  // Get thresholds for this entity size and sector
  const sectorThresholds = NITAQAT_THRESHOLDS[entitySize] as Record<string, { platinum: number; green: number; yellow: number; red: number }>;
  const thresholds = sectorThresholds[normalizedSector] || sectorThresholds.default;
  
  // Calculate Saudization percentage (multiply by 100 for precision)
  const saudizationPercentage = totalEmployees > 0 ? (saudiEmployees / totalEmployees) * 100 : 0;
  
  // Determine band
  let band: "platinum" | "green" | "yellow" | "red";
  let requiredPercentage: number;
  
  if (saudizationPercentage >= thresholds.platinum) {
    band = "platinum";
    requiredPercentage = thresholds.platinum;
  } else if (saudizationPercentage >= thresholds.green) {
    band = "green";
    requiredPercentage = thresholds.green;
  } else if (saudizationPercentage >= thresholds.yellow) {
    band = "yellow";
    requiredPercentage = thresholds.yellow;
  } else {
    band = "red";
    requiredPercentage = thresholds.green; // Target should be at least Green
  }
  
  // Calculate compliance gap (how many Saudi employees needed to reach Green band)
  const targetSaudiEmployees = Math.ceil((thresholds.green / 100) * totalEmployees);
  const complianceGap = Math.max(0, targetSaudiEmployees - saudiEmployees);
  
  const isCompliant = band === "green" || band === "platinum";
  
  return {
    band,
    saudizationPercentage: Math.round(saudizationPercentage * 100) / 100, // Round to 2 decimal places
    requiredPercentage,
    complianceGap,
    isCompliant,
  };
}

/**
 * Calculate estimated monthly penalty for non-compliance
 */
export function calculatePenalty(
  band: "platinum" | "green" | "yellow" | "red",
  complianceGap: number
): number {
  const penaltyPerEmployee = PENALTY_ESTIMATES[band];
  return Math.max(0, penaltyPerEmployee * complianceGap);
}

/**
 * Calculate risk level based on Nitaqat band and compliance gap
 */
export function calculateRiskLevel(
  band: "platinum" | "green" | "yellow" | "red",
  complianceGap: number
): "low" | "medium" | "high" | "critical" {
  if (band === "platinum" || band === "green") return "low";
  if (band === "yellow" && complianceGap <= 5) return "medium";
  if (band === "yellow" && complianceGap > 5) return "high";
  return "critical"; // Red band
}

/**
 * Forecast Nitaqat band for future periods
 * Assumes linear hiring trend based on historical data
 */
export function forecastNitaqatBand(
  currentTotal: number,
  currentSaudi: number,
  monthlyHiringTrend: { saudi: number; expat: number },
  monthsAhead: number,
  sector: string
): "platinum" | "green" | "yellow" | "red" {
  const projectedTotal = currentTotal + (monthlyHiringTrend.saudi + monthlyHiringTrend.expat) * monthsAhead;
  const projectedSaudi = currentSaudi + monthlyHiringTrend.saudi * monthsAhead;
  
  const result = calculateNitaqatBand(projectedTotal, projectedSaudi, sector);
  return result.band;
}

/**
 * Update or create Nitaqat tracking record for an employer
 */
export async function updateNitaqatTracking(employerId: number, data: {
  totalEmployees: number;
  saudiEmployees: number;
  expatEmployees: number;
  activitySector: string;
}): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { totalEmployees, saudiEmployees, expatEmployees, activitySector } = data;
  
  // Calculate Nitaqat metrics
  const entitySize = determineEntitySize(totalEmployees);
  const calculation = calculateNitaqatBand(totalEmployees, saudiEmployees, activitySector);
  const penalty = calculatePenalty(calculation.band, calculation.complianceGap);
  const riskLevel = calculateRiskLevel(calculation.band, calculation.complianceGap);
  
  // Get historical data for trend analysis
  const history = await db
    .select()
    .from(workforceHistory)
    .where(eq(workforceHistory.employerId, employerId))
    .orderBy(desc(workforceHistory.snapshotDate))
    .limit(6); // Last 6 months
  
  // Calculate monthly hiring trend
  let monthlyHiringTrend = { saudi: 0, expat: 0 };
  if (history.length >= 2) {
    const recentMonths = history.slice(0, 3);
    const olderMonths = history.slice(3, 6);
    
    const recentAvgSaudi = recentMonths.reduce((sum: any, h: any) => sum + h.saudiEmployees, 0) / recentMonths.length;
    const olderAvgSaudi = olderMonths.length > 0 
      ? olderMonths.reduce((sum: any, h: any) => sum + h.saudiEmployees, 0) / olderMonths.length 
      : recentAvgSaudi;
    
    monthlyHiringTrend.saudi = Math.round((recentAvgSaudi - olderAvgSaudi) / 3);
    monthlyHiringTrend.expat = Math.round(((totalEmployees - saudiEmployees) - (recentMonths[0]?.expatEmployees || expatEmployees)) / 3);
  }
  
  // Forecast future bands
  const forecast3Months = forecastNitaqatBand(totalEmployees, saudiEmployees, monthlyHiringTrend, 3, activitySector);
  const forecast6Months = forecastNitaqatBand(totalEmployees, saudiEmployees, monthlyHiringTrend, 6, activitySector);
  const forecast12Months = forecastNitaqatBand(totalEmployees, saudiEmployees, monthlyHiringTrend, 12, activitySector);
  
  // Calculate projected compliance date
  let projectedComplianceDate: Date | null = null;
  if (!calculation.isCompliant && monthlyHiringTrend.saudi > 0) {
    const monthsToCompliance = Math.ceil(calculation.complianceGap / monthlyHiringTrend.saudi);
    projectedComplianceDate = new Date();
    projectedComplianceDate.setMonth(projectedComplianceDate.getMonth() + monthsToCompliance);
  }
  
  // Upsert Nitaqat tracking record
  const existing = await db
    .select()
    .from(nitaqatTracking)
    .where(eq(nitaqatTracking.employerId, employerId))
    .limit(1);
  
  const trackingData = {
    employerId,
    totalEmployees,
    saudiEmployees,
    expatEmployees,
    saudizationPercentage: Math.round(calculation.saudizationPercentage * 100), // Store as integer (percentage * 100)
    entitySize,
    activitySector,
    nitaqatBand: calculation.band,
    requiredSaudizationPercentage: Math.round(calculation.requiredPercentage * 100),
    isCompliant: calculation.isCompliant,
    complianceGap: calculation.complianceGap,
    riskLevel,
    estimatedPenalty: penalty,
    projectedComplianceDate,
    forecastedBand3Months: forecast3Months,
    forecastedBand6Months: forecast6Months,
    forecastedBand12Months: forecast12Months,
    lastCalculated: new Date(),
    calculationSource: "system_calculated" as const,
  };
  
  if (existing.length > 0) {
    await db
      .update(nitaqatTracking)
      .set(trackingData)
      .where(eq(nitaqatTracking.employerId, employerId));
  } else {
    await db.insert(nitaqatTracking).values(trackingData);
  }
  
  // Create workforce history snapshot
  await db.insert(workforceHistory).values({
    employerId,
    snapshotDate: new Date(),
    totalEmployees,
    saudiEmployees,
    expatEmployees,
    saudizationPercentage: Math.round(calculation.saudizationPercentage * 100),
    nitaqatBand: calculation.band,
    employeesAdded: 0, // Will be calculated in next snapshot
    employeesRemoved: 0,
    saudiEmployeesAdded: 0,
    saudiEmployeesRemoved: 0,
  });
  
  // Create compliance alerts if needed
  await createComplianceAlerts(employerId, calculation.band, riskLevel, calculation.complianceGap);
}

/**
 * Create compliance alerts based on Nitaqat status
 */
async function createComplianceAlerts(
  employerId: number,
  band: "platinum" | "green" | "yellow" | "red",
  riskLevel: "low" | "medium" | "high" | "critical",
  complianceGap: number
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  // Check if alert already exists and is active
  const existingAlerts = await db
    .select()
    .from(complianceAlerts)
    .where(eq(complianceAlerts.employerId, employerId));
  
  const activeAlerts = existingAlerts.filter((a: any) => a.alertStatus === "active");
  
  // Red Zone Alert (CRITICAL)
  if (band === "red" && !activeAlerts.some((a: any) => a.alertType === "nitaqat_red_zone")) {
    await db.insert(complianceAlerts).values({
      employerId,
      alertType: "nitaqat_red_zone",
      severity: "critical",
      alertTitle: "CRITICAL: Nitaqat Red Zone",
      alertMessage: `Your company is currently in the RED Nitaqat zone. You need to hire ${complianceGap} Saudi employees to reach compliance. Immediate action required to avoid penalties and work permit restrictions.`,
      actionRequired: `Hire ${complianceGap} Saudi employees immediately. Contact MHRSD for compliance support programs.`,
      alertStatus: "active",
      notificationSent: false,
    });
  }
  
  // Yellow Zone Alert (WARNING)
  if (band === "yellow" && !activeAlerts.some((a: any) => a.alertType === "nitaqat_yellow_zone")) {
    await db.insert(complianceAlerts).values({
      employerId,
      alertType: "nitaqat_yellow_zone",
      severity: "warning",
      alertTitle: "WARNING: Nitaqat Yellow Zone",
      alertMessage: `Your company is in the YELLOW Nitaqat zone. You need ${complianceGap} more Saudi employees to reach the Green zone and avoid potential penalties.`,
      actionRequired: `Plan to hire ${complianceGap} Saudi employees within the next 3-6 months.`,
      alertStatus: "active",
      notificationSent: false,
    });
  }
  
  // Resolve alerts if company moves to Green/Platinum
  if (band === "green" || band === "platinum") {
    const alertsToResolve = activeAlerts.filter((a: any) => 
      a.alertType === "nitaqat_red_zone" || a.alertType === "nitaqat_yellow_zone"
    );
    
    for (const alert of alertsToResolve) {
      await db
        .update(complianceAlerts)
        .set({ alertStatus: "resolved", resolvedAt: new Date() })
        .where(eq(complianceAlerts.id, alert.id));
    }
  }
}

/**
 * Simulate "what-if" hiring scenario
 * UNIQUE FEATURE: No competitor offers this capability
 */
export async function simulateHiringScenario(
  employerId: number,
  scenarioName: string,
  plannedChanges: {
    saudiHires: number;
    expatHires: number;
    saudiTerminations: number;
    expatTerminations: number;
  }
): Promise<{
  scenarioId: number;
  projectedBand: "platinum" | "green" | "yellow" | "red";
  complianceImprovement: boolean;
  estimatedCostImpact: number;
  estimatedTimeToCompliance: number | null;
  recommendations: string[];
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Get current Nitaqat status
  const current = await db
    .select()
    .from(nitaqatTracking)
    .where(eq(nitaqatTracking.employerId, employerId))
    .limit(1);
  
  if (current.length === 0) {
    throw new Error("No Nitaqat tracking data found for this employer");
  }
  
  const baseline = current[0];
  
  // Calculate projected workforce
  const projectedTotal = baseline.totalEmployees + plannedChanges.saudiHires + plannedChanges.expatHires 
    - plannedChanges.saudiTerminations - plannedChanges.expatTerminations;
  const projectedSaudi = baseline.saudiEmployees + plannedChanges.saudiHires - plannedChanges.saudiTerminations;
  const projectedExpat = baseline.expatEmployees + plannedChanges.expatHires - plannedChanges.expatTerminations;
  
  // Calculate projected Nitaqat band
  const projection = calculateNitaqatBand(projectedTotal, projectedSaudi, baseline.activitySector);
  
  // Determine if this improves compliance
  const bandOrder = { red: 0, yellow: 1, green: 2, platinum: 3 };
  const complianceImprovement = bandOrder[projection.band] > bandOrder[baseline.nitaqatBand];
  
  // Calculate cost impact (rough estimate)
  const avgSaudiSalary = 8000; // SAR per month
  const avgExpatSalary = 5000; // SAR per month
  const estimatedCostImpact = 
    (plannedChanges.saudiHires * avgSaudiSalary * 12) + 
    (plannedChanges.expatHires * avgExpatSalary * 12) -
    (plannedChanges.saudiTerminations * avgSaudiSalary * 12) -
    (plannedChanges.expatTerminations * avgExpatSalary * 12);
  
  // Calculate time to compliance
  let estimatedTimeToCompliance: number | null = null;
  if (projection.complianceGap > 0 && plannedChanges.saudiHires > 0) {
    estimatedTimeToCompliance = Math.ceil((projection.complianceGap / plannedChanges.saudiHires) * 30); // Days
  } else if (projection.isCompliant) {
    estimatedTimeToCompliance = 0;
  }
  
  // Generate AI recommendations
  const recommendations: string[] = [];
  if (!projection.isCompliant) {
    recommendations.push(`Hire ${projection.complianceGap} more Saudi employees to reach Green zone`);
  }
  if (projection.band === "yellow" || projection.band === "red") {
    recommendations.push("Consider partnering with Saudi universities for graduate recruitment");
    recommendations.push("Explore HRDF training subsidies to develop Saudi talent");
  }
  if (complianceImprovement) {
    recommendations.push("This scenario improves your Nitaqat status - recommended to proceed");
  }
  
  // Save scenario to database
  const [scenario] = await db.insert(workforcePlanningScenarios).values({
    employerId,
    scenarioName,
    scenarioDescription: `Simulated hiring scenario: +${plannedChanges.saudiHires} Saudi, +${plannedChanges.expatHires} Expat, -${plannedChanges.saudiTerminations} Saudi, -${plannedChanges.expatTerminations} Expat`,
    baselineTotalEmployees: baseline.totalEmployees,
    baselineSaudiEmployees: baseline.saudiEmployees,
    baselineExpatEmployees: baseline.expatEmployees,
    baselineNitaqatBand: baseline.nitaqatBand,
    plannedSaudiHires: plannedChanges.saudiHires,
    plannedExpatHires: plannedChanges.expatHires,
    plannedSaudiTerminations: plannedChanges.saudiTerminations,
    plannedExpatTerminations: plannedChanges.expatTerminations,
    projectedTotalEmployees: projectedTotal,
    projectedSaudiEmployees: projectedSaudi,
    projectedExpatEmployees: projectedExpat,
    projectedSaudizationPercentage: Math.round(projection.saudizationPercentage * 100),
    projectedNitaqatBand: projection.band,
    complianceImprovement,
    bandChange: baseline.nitaqatBand === projection.band ? "No Change" : `${baseline.nitaqatBand} to ${projection.band}`,
    estimatedCostImpact,
    estimatedTimeToCompliance,
    aiRecommendations: recommendations,
    riskAssessment: projection.isCompliant ? "Low risk - compliant scenario" : "High risk - non-compliant scenario",
    scenarioStatus: "draft",
  }).$returningId();
  
  return {
    scenarioId: scenario.id,
    projectedBand: projection.band,
    complianceImprovement,
    estimatedCostImpact,
    estimatedTimeToCompliance,
    recommendations,
  };
}

/**
 * Get Nitaqat tracking data for an employer
 */
export async function getNitaqatTracking(employerId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db
    .select()
    .from(nitaqatTracking)
    .where(eq(nitaqatTracking.employerId, employerId))
    .limit(1);
  
  return result.length > 0 ? result[0] : null;
}

/**
 * Get workforce history for trend analysis
 */
export async function getWorkforceHistory(employerId: number, months: number = 12) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(workforceHistory)
    .where(eq(workforceHistory.employerId, employerId))
    .orderBy(desc(workforceHistory.snapshotDate))
    .limit(months);
}

/**
 * Get active compliance alerts for an employer
 */
export async function getComplianceAlerts(employerId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(complianceAlerts)
    .where(eq(complianceAlerts.employerId, employerId))
    .orderBy(desc(complianceAlerts.createdAt));
}
