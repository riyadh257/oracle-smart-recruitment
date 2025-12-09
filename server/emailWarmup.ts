/**
 * Email Warmup Scheduler Service
 * Gradually increase sending volume to build sender reputation
 */

import { getDb } from "./db";

export interface WarmupSchedule {
  id: number;
  employerId: number;
  domain: string;
  status: "active" | "paused" | "completed" | "failed";
  startDate: string;
  currentDay: number;
  totalDays: number;
  dailyLimit: number;
  targetVolume: number;
  sentToday: number;
  totalSent: number;
  warmupSchedule: DailyLimit[];
  lastSentAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface DailyLimit {
  day: number;
  limit: number;
  sent: number;
}

/**
 * Generate warmup schedule with gradual volume increase
 */
function generateWarmupSchedule(targetVolume: number, totalDays: number = 30): DailyLimit[] {
  const schedule: DailyLimit[] = [];
  
  // Conservative warmup curve: exponential growth with safety caps
  for (let day = 1; day <= totalDays; day++) {
    let limit: number;
    
    if (day <= 7) {
      // Week 1: Very conservative (10-50 emails/day)
      limit = Math.min(10 + (day - 1) * 6, 50);
    } else if (day <= 14) {
      // Week 2: Gradual increase (50-150 emails/day)
      limit = Math.min(50 + (day - 7) * 15, 150);
    } else if (day <= 21) {
      // Week 3: Moderate increase (150-400 emails/day)
      limit = Math.min(150 + (day - 14) * 35, 400);
    } else {
      // Week 4+: Approach target (400-target)
      const remaining = targetVolume - 400;
      const daysLeft = totalDays - 21;
      const increment = Math.floor(remaining / daysLeft);
      limit = Math.min(400 + (day - 21) * increment, targetVolume);
    }
    
    schedule.push({
      day,
      limit: Math.round(limit),
      sent: 0,
    });
  }
  
  return schedule;
}

/**
 * Create a new warmup schedule
 */
export async function createWarmupSchedule(
  employerId: number,
  domain: string,
  targetVolume: number = 1000,
  totalDays: number = 30
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const warmupSchedule = generateWarmupSchedule(targetVolume, totalDays);
  const startDate = new Date().toISOString().split("T")[0];

  const [result] = await db.execute(
    `INSERT INTO emailWarmup 
     (employerId, domain, startDate, totalDays, dailyLimit, targetVolume, warmupSchedule)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      employerId,
      domain,
      startDate,
      totalDays,
      warmupSchedule[0].limit,
      targetVolume,
      JSON.stringify(warmupSchedule),
    ]
  ) as any;

  return result.insertId;
}

/**
 * Get warmup schedule for an employer
 */
export async function getWarmupSchedule(employerId: number, domain?: string): Promise<WarmupSchedule[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  let query = "SELECT * FROM emailWarmup WHERE employerId = ?";
  const params: any[] = [employerId];

  if (domain) {
    query += " AND domain = ?";
    params.push(domain);
  }

  query += " ORDER BY createdAt DESC";

  const [rows] = await db.execute(query, params) as any;

  return rows.map((row: any) => ({
    ...row,
    warmupSchedule: JSON.parse(row.warmupSchedule),
  }));
}

/**
 * Check if sending is allowed based on warmup schedule
 */
export async function canSendEmail(employerId: number, domain: string): Promise<{
  allowed: boolean;
  reason?: string;
  dailyLimit?: number;
  sentToday?: number;
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [rows] = await db.execute(
    "SELECT * FROM emailWarmup WHERE employerId = ? AND domain = ? AND status = 'active' LIMIT 1",
    [employerId, domain]
  ) as any;

  if (rows.length === 0) {
    // No warmup schedule - allow sending
    return { allowed: true };
  }

  const warmup = rows[0];
  const schedule: DailyLimit[] = JSON.parse(warmup.warmupSchedule);
  const currentDaySchedule = schedule.find((s) => s.day === warmup.currentDay);

  if (!currentDaySchedule) {
    return {
      allowed: false,
      reason: "Warmup schedule completed",
    };
  }

  // Check if daily limit reached
  if (warmup.sentToday >= currentDaySchedule.limit) {
    return {
      allowed: false,
      reason: "Daily warmup limit reached",
      dailyLimit: currentDaySchedule.limit,
      sentToday: warmup.sentToday,
    };
  }

  return {
    allowed: true,
    dailyLimit: currentDaySchedule.limit,
    sentToday: warmup.sentToday,
  };
}

/**
 * Record email sent during warmup
 */
export async function recordWarmupSend(employerId: number, domain: string, count: number = 1): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.execute(
    `UPDATE emailWarmup 
     SET sentToday = sentToday + ?, totalSent = totalSent + ?, lastSentAt = NOW()
     WHERE employerId = ? AND domain = ? AND status = 'active'`,
    [count, count, employerId, domain]
  );
}

/**
 * Advance warmup schedule to next day (run daily via cron)
 */
export async function advanceWarmupDay(): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get all active warmup schedules
  const [schedules] = await db.execute(
    "SELECT * FROM emailWarmup WHERE status = 'active'"
  ) as any;

  for (const schedule of schedules) {
    const warmupSchedule: DailyLimit[] = JSON.parse(schedule.warmupSchedule);
    const currentDay = schedule.currentDay;
    const nextDay = currentDay + 1;

    // Check if warmup is complete
    if (nextDay > schedule.totalDays) {
      await db.execute(
        `UPDATE emailWarmup 
         SET status = 'completed', completedAt = NOW()
         WHERE id = ?`,
        [schedule.id]
      );
      continue;
    }

    // Update current day schedule with sent count
    const currentDaySchedule = warmupSchedule.find((s) => s.day === currentDay);
    if (currentDaySchedule) {
      currentDaySchedule.sent = schedule.sentToday;
    }

    // Advance to next day
    const nextDaySchedule = warmupSchedule.find((s) => s.day === nextDay);
    await db.execute(
      `UPDATE emailWarmup 
       SET currentDay = ?, dailyLimit = ?, sentToday = 0, warmupSchedule = ?
       WHERE id = ?`,
      [
        nextDay,
        nextDaySchedule?.limit || 0,
        JSON.stringify(warmupSchedule),
        schedule.id,
      ]
    );
  }
}

/**
 * Pause warmup schedule
 */
export async function pauseWarmup(warmupId: number, employerId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.execute(
    "UPDATE emailWarmup SET status = 'paused' WHERE id = ? AND employerId = ?",
    [warmupId, employerId]
  );
}

/**
 * Resume warmup schedule
 */
export async function resumeWarmup(warmupId: number, employerId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.execute(
    "UPDATE emailWarmup SET status = 'active' WHERE id = ? AND employerId = ?",
    [warmupId, employerId]
  );
}

/**
 * Delete warmup schedule
 */
export async function deleteWarmup(warmupId: number, employerId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.execute(
    "DELETE FROM emailWarmup WHERE id = ? AND employerId = ?",
    [warmupId, employerId]
  );
}

/**
 * Get warmup progress statistics
 */
export async function getWarmupProgress(warmupId: number, employerId: number): Promise<{
  currentDay: number;
  totalDays: number;
  progressPercent: number;
  dailyLimit: number;
  sentToday: number;
  totalSent: number;
  targetVolume: number;
  estimatedCompletion: string;
  status: string;
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [rows] = await db.execute(
    "SELECT * FROM emailWarmup WHERE id = ? AND employerId = ? LIMIT 1",
    [warmupId, employerId]
  ) as any;

  if (rows.length === 0) {
    throw new Error("Warmup schedule not found");
  }

  const warmup = rows[0];
  const progressPercent = (warmup.currentDay / warmup.totalDays) * 100;
  const daysRemaining = warmup.totalDays - warmup.currentDay;
  const estimatedCompletion = new Date(
    new Date(warmup.startDate).getTime() + warmup.totalDays * 24 * 60 * 60 * 1000
  ).toISOString().split("T")[0];

  return {
    currentDay: warmup.currentDay,
    totalDays: warmup.totalDays,
    progressPercent: Math.round(progressPercent),
    dailyLimit: warmup.dailyLimit,
    sentToday: warmup.sentToday,
    totalSent: warmup.totalSent,
    targetVolume: warmup.targetVolume,
    estimatedCompletion,
    status: warmup.status,
  };
}
