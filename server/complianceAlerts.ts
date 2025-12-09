import { getDb } from "./db";
import { eq, and, lte, gte, sql } from "drizzle-orm";
// import { workPermits, employmentContracts, nitaqatTracking, complianceAlerts } from "../drizzle/schema";
import { notifyOwner } from "./_core/notification";
import { sendCriticalComplianceAlert } from "./multiChannelNotifications";
import { calculateNitaqatBand } from "./saudization";

/**
 * Compliance Alerts Service
 * Monitors and sends proactive alerts for KSA compliance issues
 */

export interface ComplianceAlert {
  id: number;
  employerId: number;
  alertType: "nitaqat_drop" | "permit_expiry" | "labor_law_violation" | "probation_ending" | "contract_expiry";
  severity: "info" | "warning" | "critical";
  title: string;
  message: string;
  metadata: Record<string, any>;
  createdAt: Date;
  acknowledged: boolean;
}

/**
 * Check for work permits approaching expiry
 * Alerts at 90, 60, and 30 days before expiry
 */
export async function checkWorkPermitExpiry(employerId: number): Promise<ComplianceAlert[]> {
  const db = await getDb();
  if (!db) return [];

  const now = new Date();
  const alerts: ComplianceAlert[] = [];

  // Check for permits expiring in 30, 60, or 90 days
  const thresholds = [
    { days: 30, severity: "critical" as const },
    { days: 60, severity: "warning" as const },
    { days: 90, severity: "info" as const },
  ];

  for (const threshold of thresholds) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + threshold.days);

    const expiringPermits = await db
      .select()
      .from(workPermits)
      .where(
        and(
          eq(workPermits.employerId, employerId),
          eq(workPermits.status, "active"),
          lte(workPermits.expiryDate, expiryDate),
          gte(workPermits.expiryDate, now)
        )
      );

    for (const permit of expiringPermits) {
      const daysUntilExpiry = Math.ceil(
        (permit.expiryDate!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Only alert if within the threshold range
      if (daysUntilExpiry <= threshold.days && daysUntilExpiry > (threshold.days - 30)) {
        alerts.push({
          id: 0,
          employerId,
          alertType: "permit_expiry",
          severity: threshold.severity,
          title: `Work Permit Expiring in ${daysUntilExpiry} Days`,
          message: `Work permit #${permit.permitNumber} for candidate ID ${permit.candidateId} expires on ${permit.expiryDate?.toLocaleDateString()}. Renewal required.`,
          metadata: {
            permitId: permit.id,
            permitNumber: permit.permitNumber,
            candidateId: permit.candidateId,
            expiryDate: permit.expiryDate,
            daysUntilExpiry,
          },
          createdAt: now,
          acknowledged: false,
        });
      }
    }
  }

  return alerts;
}

/**
 * Check for Nitaqat band drops
 * Monitors workforce composition and alerts if band decreases
 */
export async function checkNitaqatBandDrop(employerId: number): Promise<ComplianceAlert[]> {
  const db = await getDb();
  if (!db) return [];

  const alerts: ComplianceAlert[] = [];

  // Get current Nitaqat tracking
  const tracking = await db
    .select()
    .from(nitaqatTracking)
    .where(eq(nitaqatTracking.employerId, employerId))
    .orderBy(sql`${nitaqatTracking.updatedAt} DESC`)
    .limit(2);

  if (tracking.length < 2) return alerts;

  const current = tracking[0];
  const previous = tracking[1];

  // Calculate current band
  const currentBand = calculateNitaqatBand(
    current.totalEmployees,
    current.saudiEmployees,
    current.activitySector
  );

  // Calculate previous band
  const previousBand = calculateNitaqatBand(
    previous.totalEmployees,
    previous.saudiEmployees,
    previous.activitySector
  );

  // Band hierarchy: Platinum > Green > Yellow > Red
  const bandHierarchy = { platinum: 4, green: 3, yellow: 2, red: 1 };

  if (bandHierarchy[currentBand.band] < bandHierarchy[previousBand.band]) {
    alerts.push({
      id: 0,
      employerId,
      alertType: "nitaqat_drop",
      severity: currentBand.band === "red" ? "critical" : "warning",
      title: `Nitaqat Band Dropped to ${currentBand.band.toUpperCase()}`,
      message: `Your Nitaqat band has decreased from ${previousBand.band.toUpperCase()} to ${currentBand.band.toUpperCase()}. Current Saudization rate: ${currentBand.saudizationPercentage.toFixed(1)}%. ${currentBand.saudiHiresNeeded > 0 ? `You need to hire ${currentBand.saudiHiresNeeded} Saudi nationals to reach Green band.` : ""}`,
      metadata: {
        previousBand: previousBand.band,
        currentBand: currentBand.band,
        saudizationPercentage: currentBand.saudizationPercentage,
        saudiHiresNeeded: currentBand.saudiHiresNeeded,
        totalEmployees: current.totalEmployees,
        saudiEmployees: current.saudiEmployees,
      },
      createdAt: new Date(),
      acknowledged: false,
    });
  }

  return alerts;
}

/**
 * Check for labor law violations
 * Monitors working hours, probation periods, and contract compliance
 */
export async function checkLaborLawViolations(employerId: number): Promise<ComplianceAlert[]> {
  const db = await getDb();
  if (!db) return [];

  const alerts: ComplianceAlert[] = [];
  const now = new Date();

  // Check for contracts with excessive working hours
  const contracts = await db
    .select()
    .from(employmentContracts)
    .where(
      and(
        eq(employmentContracts.contractStatus, "active"),
        sql`${employmentContracts.weeklyHours} > 48`
      )
    );

  for (const contract of contracts) {
    if (contract.weeklyHours && contract.weeklyHours > 48) {
      alerts.push({
        id: 0,
        employerId,
        alertType: "labor_law_violation",
        severity: "critical",
        title: "Excessive Working Hours Detected",
        message: `Contract ID ${contract.id} has ${contract.weeklyHours} weekly hours, exceeding the legal limit of 48 hours per week.`,
        metadata: {
          contractId: contract.id,
          weeklyHours: contract.weeklyHours,
          legalLimit: 48,
        },
        createdAt: now,
        acknowledged: false,
      });
    }
  }

  // Check for probation periods ending soon (within 7 days)
  const probationEndingSoon = new Date();
  probationEndingSoon.setDate(probationEndingSoon.getDate() + 7);

  const probationContracts = await db
    .select()
    .from(employmentContracts)
    .where(
      and(
        eq(employmentContracts.contractStatus, "active"),
        lte(employmentContracts.probationEndDate, probationEndingSoon),
        gte(employmentContracts.probationEndDate, now)
      )
    );

  for (const contract of probationContracts) {
    if (contract.probationEndDate) {
      const daysUntilEnd = Math.ceil(
        (contract.probationEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      alerts.push({
        id: 0,
        employerId,
        alertType: "probation_ending",
        severity: "info",
        title: `Probation Period Ending in ${daysUntilEnd} Days`,
        message: `Contract ID ${contract.id} probation period ends on ${contract.probationEndDate.toLocaleDateString()}. Review employee performance and confirm continuation.`,
        metadata: {
          contractId: contract.id,
          probationEndDate: contract.probationEndDate,
          daysUntilEnd,
        },
        createdAt: now,
        acknowledged: false,
      });
    }
  }

  // Check for contracts expiring soon (within 30 days)
  const contractExpiringSoon = new Date();
  contractExpiringSoon.setDate(contractExpiringSoon.getDate() + 30);

  const expiringContracts = await db
    .select()
    .from(employmentContracts)
    .where(
      and(
        eq(employmentContracts.contractStatus, "active"),
        lte(employmentContracts.endDate, contractExpiringSoon),
        gte(employmentContracts.endDate, now)
      )
    );

  for (const contract of expiringContracts) {
    if (contract.endDate) {
      const daysUntilExpiry = Math.ceil(
        (contract.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      alerts.push({
        id: 0,
        employerId,
        alertType: "contract_expiry",
        severity: daysUntilExpiry <= 7 ? "warning" : "info",
        title: `Employment Contract Expiring in ${daysUntilExpiry} Days`,
        message: `Contract ID ${contract.id} expires on ${contract.endDate.toLocaleDateString()}. Renewal or termination action required.`,
        metadata: {
          contractId: contract.id,
          endDate: contract.endDate,
          daysUntilExpiry,
        },
        createdAt: now,
        acknowledged: false,
      });
    }
  }

  return alerts;
}

/**
 * Run all compliance checks and send notifications
 */
export async function runComplianceChecks(employerId: number): Promise<{
  totalAlerts: number;
  criticalAlerts: number;
  warningAlerts: number;
  infoAlerts: number;
  alerts: ComplianceAlert[];
}> {
  const permitAlerts = await checkWorkPermitExpiry(employerId);
  const nitaqatAlerts = await checkNitaqatBandDrop(employerId);
  const laborLawAlerts = await checkLaborLawViolations(employerId);

  const allAlerts = [...permitAlerts, ...nitaqatAlerts, ...laborLawAlerts];

  // Send notifications for critical and warning alerts
  for (const alert of allAlerts) {
    if (alert.severity === "critical" || alert.severity === "warning") {
      await notifyOwner({
        title: alert.title,
        content: alert.message,
      });
      
      // Send multi-channel notification (SMS/WhatsApp) for critical alerts
      if (alert.severity === "critical") {
        try {
          const dashboardUrl = process.env.VITE_APP_URL || "https://oracle-recruitment.manus.space";
          await sendCriticalComplianceAlert(employerId, {
            title: alert.title,
            message: alert.message,
            alertType: alert.alertType,
            severity: alert.severity,
            dashboardUrl,
          });
        } catch (error) {
          console.error("Failed to send multi-channel notification:", error);
        }
      }
    }
  }

  // Store alerts in database if schema exists
  const db = await getDb();
  if (db) {
    try {
      // Check if complianceAlerts table exists
      for (const alert of allAlerts) {
        await db.insert(complianceAlerts).values({
          employerId: alert.employerId,
          alertType: alert.alertType as any, // Map to existing enum values
          severity: alert.severity,
          alertTitle: alert.title,
          alertMessage: alert.message,
          alertStatus: "active",
          notificationSent: true,
          notificationSentAt: new Date(),
        });
      }
    } catch (error) {
      console.error("Failed to store compliance alerts:", error);
    }
  }

  return {
    totalAlerts: allAlerts.length,
    criticalAlerts: allAlerts.filter((a) => a.severity === "critical").length,
    warningAlerts: allAlerts.filter((a) => a.severity === "warning").length,
    infoAlerts: allAlerts.filter((a) => a.severity === "info").length,
    alerts: allAlerts,
  };
}

/**
 * Get all compliance alerts for an employer
 */
export async function getComplianceAlertsForEmployer(employerId: number): Promise<ComplianceAlert[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    const alerts = await db
      .select()
      .from(complianceAlerts)
      .where(eq(complianceAlerts.employerId, employerId))
      .orderBy(sql`${complianceAlerts.createdAt} DESC`)
      .limit(50);

    return alerts.map((alert) => ({
      id: alert.id,
      employerId: alert.employerId,
      alertType: alert.alertType as any,
      severity: alert.severity,
      title: alert.alertTitle,
      message: alert.alertMessage,
      metadata: {},
      createdAt: alert.createdAt,
      acknowledged: alert.alertStatus === "acknowledged" || alert.alertStatus === "resolved",
    }));
  } catch (error) {
    console.error("Failed to fetch compliance alerts:", error);
    return [];
  }
}

/**
 * Acknowledge a compliance alert
 */
export async function acknowledgeComplianceAlert(alertId: number, userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    await db
      .update(complianceAlerts)
      .set({
        alertStatus: "acknowledged",
        acknowledgedBy: userId,
        acknowledgedAt: new Date(),
      })
      .where(eq(complianceAlerts.id, alertId));

    return true;
  } catch (error) {
    console.error("Failed to acknowledge compliance alert:", error);
    return false;
  }
}
