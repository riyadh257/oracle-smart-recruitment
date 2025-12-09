/**
 * Email Deliverability Monitoring Service
 * Track bounce rates, spam complaints, and sender reputation
 */

import { getDb } from "./db";

export interface DeliverabilityMetrics {
  id: number;
  employerId: number;
  date: string;
  totalSent: number;
  totalDelivered: number;
  hardBounces: number;
  softBounces: number;
  spamComplaints: number;
  unsubscribes: number;
  deliveryRate: number;
  bounceRate: number;
  spamRate: number;
  senderScore: number;
  reputationStatus: "excellent" | "good" | "fair" | "poor" | "critical";
  createdAt: Date;
  updatedAt: Date;
}

export interface DeliverabilityAlert {
  type: "high_bounce" | "spam_complaints" | "low_reputation";
  severity: "warning" | "critical";
  message: string;
  metric: string;
  value: number;
  threshold: number;
}

/**
 * Calculate sender score based on deliverability metrics
 */
function calculateSenderScore(metrics: {
  deliveryRate: number;
  bounceRate: number;
  spamRate: number;
}): number {
  // Weighted scoring: delivery (50%), bounce (30%), spam (20%)
  const deliveryScore = metrics.deliveryRate * 0.5;
  const bounceScore = (100 - metrics.bounceRate) * 0.3;
  const spamScore = (100 - metrics.spamRate) * 0.2;
  
  return Math.min(Math.round(deliveryScore + bounceScore + spamScore), 100);
}

/**
 * Determine reputation status based on sender score
 */
function getReputationStatus(score: number): DeliverabilityMetrics["reputationStatus"] {
  if (score >= 90) return "excellent";
  if (score >= 75) return "good";
  if (score >= 60) return "fair";
  if (score >= 40) return "poor";
  return "critical";
}

/**
 * Record email delivery event
 */
export async function recordDeliveryEvent(
  employerId: number,
  event: {
    sent?: number;
    delivered?: number;
    hardBounce?: boolean;
    softBounce?: boolean;
    spamComplaint?: boolean;
    unsubscribe?: boolean;
  }
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const today = new Date().toISOString().split("T")[0];

  // Get or create today's record
  const [existing] = await db.execute(
    "SELECT * FROM emailDeliverability WHERE employerId = ? AND date = ? LIMIT 1",
    [employerId, today]
  ) as any;

  if (existing.length === 0) {
    // Create new record
    const totalSent = event.sent || 0;
    const totalDelivered = event.delivered || 0;
    const hardBounces = event.hardBounce ? 1 : 0;
    const softBounces = event.softBounce ? 1 : 0;
    const spamComplaints = event.spamComplaint ? 1 : 0;
    const unsubscribes = event.unsubscribe ? 1 : 0;

    const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0;
    const bounceRate = totalSent > 0 ? ((hardBounces + softBounces) / totalSent) * 100 : 0;
    const spamRate = totalSent > 0 ? (spamComplaints / totalSent) * 100 : 0;

    const senderScore = calculateSenderScore({ deliveryRate, bounceRate, spamRate });
    const reputationStatus = getReputationStatus(senderScore);

    await db.execute(
      `INSERT INTO emailDeliverability 
       (employerId, date, totalSent, totalDelivered, hardBounces, softBounces, spamComplaints, unsubscribes,
        deliveryRate, bounceRate, spamRate, senderScore, reputationStatus)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        employerId,
        today,
        totalSent,
        totalDelivered,
        hardBounces,
        softBounces,
        spamComplaints,
        unsubscribes,
        deliveryRate,
        bounceRate,
        spamRate,
        senderScore,
        reputationStatus,
      ]
    );
  } else {
    // Update existing record
    const updates: string[] = [];
    const values: any[] = [];

    if (event.sent) {
      updates.push("totalSent = totalSent + ?");
      values.push(event.sent);
    }
    if (event.delivered) {
      updates.push("totalDelivered = totalDelivered + ?");
      values.push(event.delivered);
    }
    if (event.hardBounce) {
      updates.push("hardBounces = hardBounces + 1");
    }
    if (event.softBounce) {
      updates.push("softBounces = softBounces + 1");
    }
    if (event.spamComplaint) {
      updates.push("spamComplaints = spamComplaints + 1");
    }
    if (event.unsubscribe) {
      updates.push("unsubscribes = unsubscribes + 1");
    }

    if (updates.length > 0) {
      values.push(employerId, today);
      await db.execute(
        `UPDATE emailDeliverability SET ${updates.join(", ")} WHERE employerId = ? AND date = ?`,
        values
      );

      // Recalculate metrics
      await recalculateMetrics(employerId, today);
    }
  }
}

/**
 * Recalculate deliverability metrics
 */
async function recalculateMetrics(employerId: number, date: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [rows] = await db.execute(
    "SELECT * FROM emailDeliverability WHERE employerId = ? AND date = ? LIMIT 1",
    [employerId, date]
  ) as any;

  if (rows.length === 0) return;

  const record = rows[0];
  const totalSent = parseInt(record.totalSent);
  const totalDelivered = parseInt(record.totalDelivered);
  const hardBounces = parseInt(record.hardBounces);
  const softBounces = parseInt(record.softBounces);
  const spamComplaints = parseInt(record.spamComplaints);

  const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0;
  const bounceRate = totalSent > 0 ? ((hardBounces + softBounces) / totalSent) * 100 : 0;
  const spamRate = totalSent > 0 ? (spamComplaints / totalSent) * 100 : 0;

  const senderScore = calculateSenderScore({ deliveryRate, bounceRate, spamRate });
  const reputationStatus = getReputationStatus(senderScore);

  await db.execute(
    `UPDATE emailDeliverability 
     SET deliveryRate = ?, bounceRate = ?, spamRate = ?, senderScore = ?, reputationStatus = ?
     WHERE employerId = ? AND date = ?`,
    [deliveryRate, bounceRate, spamRate, senderScore, reputationStatus, employerId, date]
  );
}

/**
 * Get deliverability metrics for a date range
 */
export async function getDeliverabilityMetrics(
  employerId: number,
  startDate: string,
  endDate: string
): Promise<DeliverabilityMetrics[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [rows] = await db.execute(
    `SELECT * FROM emailDeliverability 
     WHERE employerId = ? AND date >= ? AND date <= ?
     ORDER BY date DESC`,
    [employerId, startDate, endDate]
  ) as any;

  return rows;
}

/**
 * Get current sender reputation
 */
export async function getCurrentReputation(employerId: number): Promise<{
  score: number;
  status: DeliverabilityMetrics["reputationStatus"];
  trend: "improving" | "stable" | "declining";
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get last 7 days
  const [rows] = await db.execute(
    `SELECT * FROM emailDeliverability 
     WHERE employerId = ? AND date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
     ORDER BY date DESC`,
    [employerId]
  ) as any;

  if (rows.length === 0) {
    return { score: 100, status: "excellent", trend: "stable" };
  }

  const latest = rows[0];
  const avgScore = rows.reduce((sum: number, row: any) => sum + parseInt(row.senderScore), 0) / rows.length;

  let trend: "improving" | "stable" | "declining" = "stable";
  if (rows.length >= 3) {
    const recentAvg = rows.slice(0, 3).reduce((sum: number, row: any) => sum + parseInt(row.senderScore), 0) / 3;
    const olderAvg = rows.slice(3).reduce((sum: number, row: any) => sum + parseInt(row.senderScore), 0) / (rows.length - 3);
    
    if (recentAvg > olderAvg + 5) trend = "improving";
    else if (recentAvg < olderAvg - 5) trend = "declining";
  }

  return {
    score: parseInt(latest.senderScore),
    status: latest.reputationStatus,
    trend,
  };
}

/**
 * Check for deliverability alerts
 */
export async function checkDeliverabilityAlerts(employerId: number): Promise<DeliverabilityAlert[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const alerts: DeliverabilityAlert[] = [];

  // Get last 7 days average
  const [rows] = await db.execute(
    `SELECT AVG(bounceRate) as avgBounce, AVG(spamRate) as avgSpam, AVG(senderScore) as avgScore
     FROM emailDeliverability 
     WHERE employerId = ? AND date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`,
    [employerId]
  ) as any;

  if (rows.length === 0) return alerts;

  const stats = rows[0];
  const avgBounce = parseFloat(stats.avgBounce || 0);
  const avgSpam = parseFloat(stats.avgSpam || 0);
  const avgScore = parseFloat(stats.avgScore || 100);

  // High bounce rate alert
  if (avgBounce > 5) {
    alerts.push({
      type: "high_bounce",
      severity: avgBounce > 10 ? "critical" : "warning",
      message: "Bounce rate is above recommended threshold",
      metric: "Bounce Rate",
      value: avgBounce,
      threshold: 5,
    });
  }

  // Spam complaints alert
  if (avgSpam > 0.1) {
    alerts.push({
      type: "spam_complaints",
      severity: avgSpam > 0.5 ? "critical" : "warning",
      message: "Spam complaint rate is elevated",
      metric: "Spam Rate",
      value: avgSpam,
      threshold: 0.1,
    });
  }

  // Low reputation alert
  if (avgScore < 70) {
    alerts.push({
      type: "low_reputation",
      severity: avgScore < 50 ? "critical" : "warning",
      message: "Sender reputation score is below healthy level",
      metric: "Sender Score",
      value: avgScore,
      threshold: 70,
    });
  }

  return alerts;
}

/**
 * Get deliverability summary statistics
 */
export async function getDeliverabilityStats(
  employerId: number,
  days: number = 30
): Promise<{
  totalSent: number;
  totalDelivered: number;
  avgDeliveryRate: number;
  avgBounceRate: number;
  avgSpamRate: number;
  currentScore: number;
  scoreChange: number;
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [rows] = await db.execute(
    `SELECT 
       SUM(totalSent) as totalSent,
       SUM(totalDelivered) as totalDelivered,
       AVG(deliveryRate) as avgDeliveryRate,
       AVG(bounceRate) as avgBounceRate,
       AVG(spamRate) as avgSpamRate
     FROM emailDeliverability 
     WHERE employerId = ? AND date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)`,
    [employerId, days]
  ) as any;

  const [currentScore] = await db.execute(
    `SELECT senderScore FROM emailDeliverability 
     WHERE employerId = ? 
     ORDER BY date DESC 
     LIMIT 1`,
    [employerId]
  ) as any;

  const [previousScore] = await db.execute(
    `SELECT senderScore FROM emailDeliverability 
     WHERE employerId = ? AND date < DATE_SUB(CURDATE(), INTERVAL 7 DAY)
     ORDER BY date DESC 
     LIMIT 1`,
    [employerId]
  ) as any;

  const stats = rows[0] || {};
  const current = currentScore[0]?.senderScore || 100;
  const previous = previousScore[0]?.senderScore || current;

  return {
    totalSent: parseInt(stats.totalSent || 0),
    totalDelivered: parseInt(stats.totalDelivered || 0),
    avgDeliveryRate: parseFloat(stats.avgDeliveryRate || 0),
    avgBounceRate: parseFloat(stats.avgBounceRate || 0),
    avgSpamRate: parseFloat(stats.avgSpamRate || 0),
    currentScore: current,
    scoreChange: current - previous,
  };
}
