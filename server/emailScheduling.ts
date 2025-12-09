/**
 * Email Scheduling Service
 * Schedule email campaigns with smart send-time optimization
 */

import { getDb } from "./db";

export interface EmailSchedule {
  id: number;
  employerId: number;
  name: string;
  emailType: string;
  templateId?: string;
  templateVersionId?: number;
  subject: string;
  bodyHtml: string;
  bodyText?: string;
  recipientType: "all_candidates" | "matched_candidates" | "specific_job" | "custom_list";
  recipientFilter?: Record<string, any>;
  scheduledFor?: Date;
  useSmartTiming: boolean;
  recommendedSendTime?: Date;
  status: "draft" | "scheduled" | "sending" | "sent" | "cancelled" | "failed";
  isRecurring: boolean;
  recurringPattern?: string;
  totalRecipients: number;
  sentCount: number;
  createdAt: Date;
  updatedAt: Date;
  sentAt?: Date;
  createdBy: number;
}

export interface SendTimeAnalysis {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  hourOfDay: number; // 0-23
  openRate: number;
  sampleSize: number;
  confidence: "low" | "medium" | "high";
}

export interface SmartTimingRecommendation {
  recommendedTime: Date;
  expectedOpenRate: number;
  confidence: "low" | "medium" | "high";
  alternativeTimes: Array<{
    time: Date;
    expectedOpenRate: number;
  }>;
  reasoning: string;
}

/**
 * Analyze historical email performance by day and hour
 */
export async function analyzeHistoricalPerformance(
  employerId: number
): Promise<SendTimeAnalysis[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Query email analytics grouped by day of week and hour
  const [rows] = await db.execute(
    `SELECT 
      DAYOFWEEK(sentAt) - 1 as dayOfWeek,
      HOUR(sentAt) as hourOfDay,
      AVG(openRate) as avgOpenRate,
      COUNT(*) as sampleSize
    FROM emailAnalytics
    WHERE employerId = ? AND sentAt IS NOT NULL
    GROUP BY dayOfWeek, hourOfDay
    HAVING sampleSize >= 5
    ORDER BY avgOpenRate DESC`,
    [employerId]
  ) as any;

  return rows.map((row: any) => {
    const sampleSize = parseInt(row.sampleSize);
    let confidence: "low" | "medium" | "high" = "low";
    
    if (sampleSize >= 50) confidence = "high";
    else if (sampleSize >= 20) confidence = "medium";

    return {
      dayOfWeek: parseInt(row.dayOfWeek),
      hourOfDay: parseInt(row.hourOfDay),
      openRate: parseFloat(row.avgOpenRate),
      sampleSize,
      confidence,
    };
  });
}

/**
 * Get smart timing recommendation for an email campaign
 */
export async function getSmartTimingRecommendation(
  employerId: number,
  emailType: string,
  preferredDate?: Date
): Promise<SmartTimingRecommendation> {
  const analysis = await analyzeHistoricalPerformance(employerId);

  if (analysis.length === 0) {
    // No historical data - use industry best practices
    return getDefaultRecommendation(preferredDate);
  }

  // Filter to high-confidence data points
  const highConfidenceData = analysis.filter((a: any) => a.confidence === "high" || a.confidence === "medium");
  const dataToUse = highConfidenceData.length > 0 ? highConfidenceData : analysis;

  // Sort by open rate
  dataToUse.sort((a, b) => b.openRate - a.openRate);

  const bestTime = dataToUse[0];
  if (!bestTime) {
    return getDefaultRecommendation(preferredDate);
  }

  // Calculate recommended time
  const now = new Date();
  const recommendedTime = getNextOccurrence(
    bestTime.dayOfWeek,
    bestTime.hourOfDay,
    preferredDate || now
  );

  // Get alternative times (top 3)
  const alternativeTimes = dataToUse.slice(1, 4).map((time: any) => ({
    time: getNextOccurrence(time.dayOfWeek, time.hourOfDay, preferredDate || now),
    expectedOpenRate: time.openRate,
  }));

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const reasoning = `Based on your historical data, ${dayNames[bestTime.dayOfWeek]}s at ${formatHour(bestTime.hourOfDay)} have the highest open rate (${bestTime.openRate.toFixed(1)}%) with ${bestTime.sampleSize} emails analyzed.`;

  return {
    recommendedTime,
    expectedOpenRate: bestTime.openRate,
    confidence: bestTime.confidence,
    alternativeTimes,
    reasoning,
  };
}

/**
 * Get default recommendation when no historical data is available
 */
function getDefaultRecommendation(preferredDate?: Date): SmartTimingRecommendation {
  // Industry best practices: Tuesday-Thursday, 10 AM or 2 PM
  const now = preferredDate || new Date();
  const tuesday10am = getNextOccurrence(2, 10, now); // Tuesday at 10 AM
  const wednesday2pm = getNextOccurrence(3, 14, now); // Wednesday at 2 PM
  const thursday10am = getNextOccurrence(4, 10, now); // Thursday at 10 AM

  return {
    recommendedTime: tuesday10am,
    expectedOpenRate: 65.0, // Industry average
    confidence: "low",
    alternativeTimes: [
      { time: wednesday2pm, expectedOpenRate: 64.0 },
      { time: thursday10am, expectedOpenRate: 63.5 },
    ],
    reasoning: "Based on recruitment industry best practices, Tuesday-Thursday mornings (10 AM) and early afternoons (2 PM) typically have the highest engagement rates.",
  };
}

/**
 * Get the next occurrence of a specific day and hour
 */
function getNextOccurrence(dayOfWeek: number, hourOfDay: number, after: Date): Date {
  const result = new Date(after);
  result.setHours(hourOfDay, 0, 0, 0);

  // Calculate days until target day
  const currentDay = result.getDay();
  let daysUntilTarget = dayOfWeek - currentDay;
  
  if (daysUntilTarget < 0 || (daysUntilTarget === 0 && result <= after)) {
    daysUntilTarget += 7;
  }

  result.setDate(result.getDate() + daysUntilTarget);
  return result;
}

/**
 * Format hour for display (12-hour format)
 */
function formatHour(hour: number): string {
  if (hour === 0) return "12 AM";
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return "12 PM";
  return `${hour - 12} PM`;
}

/**
 * Create a new email schedule
 */
export async function createEmailSchedule(schedule: Omit<EmailSchedule, "id" | "createdAt" | "updatedAt" | "sentAt">): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.execute(
    `INSERT INTO emailSchedules 
    (employerId, name, emailType, templateId, templateVersionId, subject, bodyHtml, bodyText,
     recipientType, recipientFilter, scheduledFor, useSmartTiming, recommendedSendTime,
     status, isRecurring, recurringPattern, totalRecipients, sentCount, createdBy)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      schedule.employerId,
      schedule.name,
      schedule.emailType,
      schedule.templateId || null,
      schedule.templateVersionId || null,
      schedule.subject,
      schedule.bodyHtml,
      schedule.bodyText || null,
      schedule.recipientType,
      schedule.recipientFilter ? JSON.stringify(schedule.recipientFilter) : null,
      schedule.scheduledFor || null,
      schedule.useSmartTiming,
      schedule.recommendedSendTime || null,
      schedule.status,
      schedule.isRecurring,
      schedule.recurringPattern || null,
      schedule.totalRecipients,
      schedule.sentCount,
      schedule.createdBy,
    ]
  ) as any;

  return result.insertId;
}

/**
 * Get schedules for an employer
 */
export async function getEmployerSchedules(employerId: number): Promise<EmailSchedule[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [rows] = await db.execute(
    `SELECT * FROM emailSchedules 
     WHERE employerId = ? 
     ORDER BY scheduledFor ASC, createdAt DESC`,
    [employerId]
  ) as any;

  return rows.map((row: any) => ({
    ...row,
    recipientFilter: row.recipientFilter ? JSON.parse(row.recipientFilter) : undefined,
    useSmartTiming: Boolean(row.useSmartTiming),
    isRecurring: Boolean(row.isRecurring),
  }));
}

/**
 * Get schedule by ID
 */
export async function getScheduleById(id: number): Promise<EmailSchedule | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [rows] = await db.execute(
    "SELECT * FROM emailSchedules WHERE id = ? LIMIT 1",
    [id]
  ) as any;

  if (rows.length === 0) return null;

  const row = rows[0];
  return {
    ...row,
    recipientFilter: row.recipientFilter ? JSON.parse(row.recipientFilter) : undefined,
    useSmartTiming: Boolean(row.useSmartTiming),
    isRecurring: Boolean(row.isRecurring),
  };
}

/**
 * Update schedule status
 */
export async function updateScheduleStatus(
  id: number,
  status: EmailSchedule["status"],
  sentCount?: number
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updates: string[] = ["status = ?"];
  const values: any[] = [status];

  if (sentCount !== undefined) {
    updates.push("sentCount = ?");
    values.push(sentCount);
  }

  if (status === "sent") {
    updates.push("sentAt = NOW()");
  }

  values.push(id);

  await db.execute(
    `UPDATE emailSchedules SET ${updates.join(", ")} WHERE id = ?`,
    values
  );
}

/**
 * Cancel a scheduled email
 */
export async function cancelSchedule(id: number): Promise<void> {
  await updateScheduleStatus(id, "cancelled");
}

/**
 * Get due schedules (ready to send)
 */
export async function getDueSchedules(): Promise<EmailSchedule[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [rows] = await db.execute(
    `SELECT * FROM emailSchedules 
     WHERE status = 'scheduled' 
     AND scheduledFor <= NOW()
     ORDER BY scheduledFor ASC`,
    []
  ) as any;

  return rows.map((row: any) => ({
    ...row,
    recipientFilter: row.recipientFilter ? JSON.parse(row.recipientFilter) : undefined,
    useSmartTiming: Boolean(row.useSmartTiming),
    isRecurring: Boolean(row.isRecurring),
  }));
}
