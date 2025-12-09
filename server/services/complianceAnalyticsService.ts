import { getDb } from '../db';
import {
  workPermits,
  saudizationTracking,
  workforceHistory,
  complianceAlerts,
} from '../../drizzle/schema';
import { and, gte, lte, eq, desc, sql } from 'drizzle-orm';

export interface ComplianceTrend {
  date: string;
  expiringPermits: number;
  saudizationPercentage: number;
  nitaqatBand: string;
  complianceScore: number;
  violations: number;
}

export interface PredictiveAlert {
  type: 'permit_expiry' | 'saudization_decline' | 'nitaqat_downgrade' | 'mass_expiry';
  severity: 'low' | 'medium' | 'high' | 'critical';
  predictedDate: Date;
  confidence: number;
  description: string;
  recommendedAction: string;
  impactScore: number;
}

export interface ComplianceMetrics {
  currentScore: number;
  trend: 'improving' | 'stable' | 'declining';
  activePermits: number;
  expiringIn30Days: number;
  expiringIn60Days: number;
  expiringIn90Days: number;
  currentSaudizationRate: number;
  targetSaudizationRate: number;
  saudizationGap: number;
  nitaqatBand: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Compliance Analytics Service
 * Provides trend analysis, predictive alerts, and compliance scoring
 */
export class ComplianceAnalyticsService {
  /**
   * Get historical compliance trends for the past N months
   */
  async getComplianceTrends(employerId: number, months: number = 12): Promise<ComplianceTrend[]> {
    const db = await getDb();
    if (!db) {
      throw new Error('Database not available');
    }

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    // Get workforce history
    const history = await db
      .select()
      .from(workforceHistory)
      .where(
        and(
          eq(workforceHistory.employerId, employerId),
          gte(workforceHistory.snapshotDate, startDate)
        )
      )
      .orderBy(workforceHistory.snapshotDate);

    const trends: ComplianceTrend[] = [];

    for (const snapshot of history) {
      const snapshotDate = new Date(snapshot.snapshotDate);
      
      // Count permits expiring within 30 days of this snapshot
      const expiringCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(workPermits)
        .where(
          and(
            eq(workPermits.employerId, employerId),
            gte(workPermits.expiryDate, snapshotDate),
            lte(workPermits.expiryDate, new Date(snapshotDate.getTime() + 30 * 24 * 60 * 60 * 1000))
          )
        );

      // Calculate compliance score (0-100)
      const complianceScore = this.calculateComplianceScore({
        saudizationPercentage: Number(snapshot.saudizationPercentage),
        nitaqatBand: snapshot.nitaqatBand,
        expiringPermits: Number(expiringCount[0]?.count || 0),
      });

      trends.push({
        date: snapshot.snapshotDate,
        expiringPermits: Number(expiringCount[0]?.count || 0),
        saudizationPercentage: Number(snapshot.saudizationPercentage),
        nitaqatBand: snapshot.nitaqatBand,
        complianceScore,
        violations: 0, // Would be calculated from compliance alerts
      });
    }

    return trends;
  }

  /**
   * Get current compliance metrics
   */
  async getCurrentMetrics(employerId: number): Promise<ComplianceMetrics> {
    const db = await getDb();
    if (!db) {
      throw new Error('Database not available');
    }

    const now = new Date();

    // Get active permits count
    const activePermitsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(workPermits)
      .where(
        and(
          eq(workPermits.employerId, employerId),
          eq(workPermits.status, 'active')
        )
      );

    const activePermits = Number(activePermitsResult[0]?.count || 0);

    // Get expiring permits in different time windows
    const expiring30 = await this.getExpiringPermitsCount(employerId, 30);
    const expiring60 = await this.getExpiringPermitsCount(employerId, 60);
    const expiring90 = await this.getExpiringPermitsCount(employerId, 90);

    // Get latest workforce snapshot
    const latestSnapshot = await db
      .select()
      .from(workforceHistory)
      .where(eq(workforceHistory.employerId, employerId))
      .orderBy(desc(workforceHistory.snapshotDate))
      .limit(1);

    const currentSaudizationRate = latestSnapshot[0] ? Number(latestSnapshot[0].saudizationPercentage) : 0;
    const nitaqatBand = latestSnapshot[0]?.nitaqatBand || 'red';
    
    // Target based on band (simplified)
    const targetSaudizationRate = this.getTargetSaudizationRate(nitaqatBand);
    const saudizationGap = targetSaudizationRate - currentSaudizationRate;

    // Calculate overall compliance score
    const currentScore = this.calculateComplianceScore({
      saudizationPercentage: currentSaudizationRate,
      nitaqatBand,
      expiringPermits: expiring30,
    });

    // Determine trend by comparing with previous month
    const previousMonth = new Date();
    previousMonth.setMonth(previousMonth.getMonth() - 1);
    
    const previousSnapshot = await db
      .select()
      .from(workforceHistory)
      .where(
        and(
          eq(workforceHistory.employerId, employerId),
          lte(workforceHistory.snapshotDate, previousMonth)
        )
      )
      .orderBy(desc(workforceHistory.snapshotDate))
      .limit(1);

    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    if (previousSnapshot[0]) {
      const previousScore = this.calculateComplianceScore({
        saudizationPercentage: Number(previousSnapshot[0].saudizationPercentage),
        nitaqatBand: previousSnapshot[0].nitaqatBand,
        expiringPermits: 0,
      });
      
      if (currentScore > previousScore + 5) trend = 'improving';
      else if (currentScore < previousScore - 5) trend = 'declining';
    }

    // Determine risk level
    const riskLevel = this.calculateRiskLevel(currentScore, expiring30, saudizationGap);

    return {
      currentScore,
      trend,
      activePermits,
      expiringIn30Days: expiring30,
      expiringIn60Days: expiring60,
      expiringIn90Days: expiring90,
      currentSaudizationRate,
      targetSaudizationRate,
      saudizationGap,
      nitaqatBand,
      riskLevel,
    };
  }

  /**
   * Generate predictive alerts based on historical data and trends
   */
  async generatePredictiveAlerts(employerId: number): Promise<PredictiveAlert[]> {
    const db = await getDb();
    if (!db) {
      throw new Error('Database not available');
    }

    const alerts: PredictiveAlert[] = [];

    // Predict permit expiry clusters
    const massExpiryAlert = await this.predictMassExpiry(employerId);
    if (massExpiryAlert) alerts.push(massExpiryAlert);

    // Predict Saudization decline
    const saudizationAlert = await this.predictSaudizationDecline(employerId);
    if (saudizationAlert) alerts.push(saudizationAlert);

    // Predict Nitaqat band downgrade
    const nitaqatAlert = await this.predictNitaqatDowngrade(employerId);
    if (nitaqatAlert) alerts.push(nitaqatAlert);

    // Predict individual permit expiries
    const permitAlerts = await this.predictPermitExpiries(employerId);
    alerts.push(...permitAlerts);

    // Sort by severity and impact
    return alerts.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity] || b.impactScore - a.impactScore;
    });
  }

  /**
   * Predict mass permit expiry events (>10 permits expiring in same month)
   */
  private async predictMassExpiry(employerId: number): Promise<PredictiveAlert | null> {
    const db = await getDb();
    if (!db) return null;

    const now = new Date();
    const next12Months = new Date();
    next12Months.setMonth(next12Months.getMonth() + 12);

    const permits = await db
      .select()
      .from(workPermits)
      .where(
        and(
          eq(workPermits.employerId, employerId),
          eq(workPermits.status, 'active'),
          gte(workPermits.expiryDate, now),
          lte(workPermits.expiryDate, next12Months)
        )
      );

    // Group by month
    const monthlyExpiries: Record<string, number> = {};
    permits.forEach(permit => {
      const month = new Date(permit.expiryDate).toISOString().substring(0, 7); // YYYY-MM
      monthlyExpiries[month] = (monthlyExpiries[month] || 0) + 1;
    });

    // Find months with >10 expiries
    for (const [month, count] of Object.entries(monthlyExpiries)) {
      if (count >= 10) {
        return {
          type: 'mass_expiry',
          severity: count >= 20 ? 'critical' : 'high',
          predictedDate: new Date(month + '-01'),
          confidence: 0.95,
          description: `${count} work permits will expire in ${month}`,
          recommendedAction: `Start bulk renewal process immediately. Allocate resources for processing ${count} permits.`,
          impactScore: Math.min(count * 5, 100),
        };
      }
    }

    return null;
  }

  /**
   * Predict Saudization rate decline based on historical trends
   */
  private async predictSaudizationDecline(employerId: number): Promise<PredictiveAlert | null> {
    const db = await getDb();
    if (!db) return null;

    const past6Months = new Date();
    past6Months.setMonth(past6Months.getMonth() - 6);

    const history = await db
      .select()
      .from(workforceHistory)
      .where(
        and(
          eq(workforceHistory.employerId, employerId),
          gte(workforceHistory.snapshotDate, past6Months)
        )
      )
      .orderBy(workforceHistory.snapshotDate);

    if (history.length < 3) return null;

    // Calculate trend using linear regression (simplified)
    const rates = history.map(h => Number(h.saudizationPercentage));
    const avgChange = (rates[rates.length - 1] - rates[0]) / rates.length;

    if (avgChange < -0.5) {
      // Declining trend detected
      const predictedRate = rates[rates.length - 1] + avgChange * 3; // 3 months ahead
      const predictedDate = new Date();
      predictedDate.setMonth(predictedDate.getMonth() + 3);

      return {
        type: 'saudization_decline',
        severity: avgChange < -1 ? 'high' : 'medium',
        predictedDate,
        confidence: 0.75,
        description: `Saudization rate declining at ${Math.abs(avgChange).toFixed(2)}% per month. Predicted rate in 3 months: ${predictedRate.toFixed(1)}%`,
        recommendedAction: 'Increase Saudi hiring efforts. Review current recruitment strategies and consider targeted campaigns.',
        impactScore: Math.abs(avgChange) * 20,
      };
    }

    return null;
  }

  /**
   * Predict Nitaqat band downgrade risk
   */
  private async predictNitaqatDowngrade(employerId: number): Promise<PredictiveAlert | null> {
    const db = await getDb();
    if (!db) return null;

    const latest = await db
      .select()
      .from(workforceHistory)
      .where(eq(workforceHistory.employerId, employerId))
      .orderBy(desc(workforceHistory.snapshotDate))
      .limit(1);

    if (!latest[0]) return null;

    const currentBand = latest[0].nitaqatBand;
    const currentRate = Number(latest[0].saudizationPercentage);

    // Simplified thresholds (would use actual Nitaqat thresholds in production)
    const thresholds = {
      platinum: 20,
      green: 15,
      yellow: 10,
      red: 0,
    };

    const currentThreshold = thresholds[currentBand];
    const buffer = currentRate - currentThreshold;

    if (buffer < 2 && currentBand !== 'red') {
      const predictedDate = new Date();
      predictedDate.setMonth(predictedDate.getMonth() + 2);

      return {
        type: 'nitaqat_downgrade',
        severity: 'critical',
        predictedDate,
        confidence: 0.80,
        description: `Risk of downgrade from ${currentBand.toUpperCase()} band. Current rate (${currentRate.toFixed(1)}%) is only ${buffer.toFixed(1)}% above threshold.`,
        recommendedAction: 'URGENT: Hire Saudi nationals immediately to maintain current Nitaqat band. Consider emergency recruitment campaign.',
        impactScore: 95,
      };
    }

    return null;
  }

  /**
   * Predict individual permit expiries
   */
  private async predictPermitExpiries(employerId: number): Promise<PredictiveAlert[]> {
    const db = await getDb();
    if (!db) return [];

    const now = new Date();
    const next90Days = new Date();
    next90Days.setDate(next90Days.getDate() + 90);

    const permits = await db
      .select()
      .from(workPermits)
      .where(
        and(
          eq(workPermits.employerId, employerId),
          eq(workPermits.status, 'active'),
          gte(workPermits.expiryDate, now),
          lte(workPermits.expiryDate, next90Days)
        )
      )
      .orderBy(workPermits.expiryDate)
      .limit(5); // Top 5 most urgent

    return permits.map(permit => {
      const daysUntilExpiry = Math.ceil(
        (new Date(permit.expiryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      let severity: 'low' | 'medium' | 'high' | 'critical';
      if (daysUntilExpiry <= 7) severity = 'critical';
      else if (daysUntilExpiry <= 30) severity = 'high';
      else if (daysUntilExpiry <= 60) severity = 'medium';
      else severity = 'low';

      return {
        type: 'permit_expiry' as const,
        severity,
        predictedDate: new Date(permit.expiryDate),
        confidence: 1.0,
        description: `Work permit for ${permit.candidateName || permit.employeeName} expires in ${daysUntilExpiry} days`,
        recommendedAction: `Initiate renewal process for permit #${permit.permitNumber}`,
        impactScore: Math.max(100 - daysUntilExpiry, 0),
      };
    });
  }

  /**
   * Calculate compliance score (0-100)
   */
  private calculateComplianceScore(params: {
    saudizationPercentage: number;
    nitaqatBand: string;
    expiringPermits: number;
  }): number {
    let score = 100;

    // Nitaqat band scoring
    const bandScores = { platinum: 0, green: -10, yellow: -25, red: -50 };
    score += bandScores[params.nitaqatBand as keyof typeof bandScores] || -50;

    // Saudization rate scoring
    if (params.saudizationPercentage < 10) score -= 20;
    else if (params.saudizationPercentage < 15) score -= 10;

    // Expiring permits penalty
    score -= Math.min(params.expiringPermits * 2, 30);

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate risk level based on compliance score and other factors
   */
  private calculateRiskLevel(
    score: number,
    expiringPermits: number,
    saudizationGap: number
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (score < 50 || expiringPermits > 20 || saudizationGap > 10) return 'critical';
    if (score < 70 || expiringPermits > 10 || saudizationGap > 5) return 'high';
    if (score < 85 || expiringPermits > 5 || saudizationGap > 2) return 'medium';
    return 'low';
  }

  /**
   * Get target Saudization rate based on current band
   */
  private getTargetSaudizationRate(currentBand: string): number {
    const targets = {
      platinum: 25,
      green: 20,
      yellow: 15,
      red: 10,
    };
    return targets[currentBand as keyof typeof targets] || 10;
  }

  /**
   * Get count of permits expiring within N days
   */
  private async getExpiringPermitsCount(employerId: number, days: number): Promise<number> {
    const db = await getDb();
    if (!db) return 0;

    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + days);

    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(workPermits)
      .where(
        and(
          eq(workPermits.employerId, employerId),
          eq(workPermits.status, 'active'),
          gte(workPermits.expiryDate, now),
          lte(workPermits.expiryDate, futureDate)
        )
      );

    return Number(result[0]?.count || 0);
  }
}

export const complianceAnalyticsService = new ComplianceAnalyticsService();
