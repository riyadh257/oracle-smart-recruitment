import { getDb } from "./db";
import { jobExecutions, jobFailureAlerts, jobRetryAttempts } from "../drizzle/schema";
import { eq, and, desc, gte, sql } from "drizzle-orm";
import { notifyOwner } from "./_core/notification";

/**
 * Job Failure Alert Service
 * Monitors job executions, sends alerts, and manages retry logic
 */

export interface AlertRule {
  id?: number;
  jobName: string;
  enabled: boolean;
  failureThreshold: number; // Number of consecutive failures before alerting
  alertCooldown: number; // Minutes between alerts for same job
  retryEnabled: boolean;
  maxRetries: number;
  retryBackoffMultiplier: number; // Exponential backoff multiplier
  escalationEnabled: boolean;
  escalationThreshold: number; // Failures before escalation
}

export interface FailureAlert {
  id: number;
  jobName: string;
  failureCount: number;
  errorMessage: string;
  timestamp: Date;
  acknowledged: boolean;
  escalated: boolean;
}

export interface RetryAttempt {
  id: number;
  jobExecutionId: number;
  attemptNumber: number;
  status: "pending" | "running" | "completed" | "failed";
  scheduledAt: Date;
  executedAt?: Date;
  errorMessage?: string;
}

/**
 * Calculate exponential backoff delay
 */
function calculateBackoffDelay(
  attemptNumber: number,
  baseDelay: number = 60000, // 1 minute base
  multiplier: number = 2
): number {
  return baseDelay * Math.pow(multiplier, attemptNumber - 1);
}

/**
 * Check if job execution failed and should trigger alert
 */
export async function checkJobFailure(
  jobName: string,
  executionId: number,
  status: string,
  errorMessage?: string
): Promise<boolean> {
  if (status !== "failed") return false;

  const db = await getDb();
  if (!db) return false;

  // Get alert rule for this job
  const rules = await db
    .select()
    .from(jobFailureAlerts)
    .where(and(eq(jobFailureAlerts.jobName, jobName), eq(jobFailureAlerts.enabled, 1)))
    .limit(1);

  if (rules.length === 0) return false;

  const rule = rules[0];

  // Count consecutive failures
  const recentExecutions = await db
    .select()
    .from(jobExecutions)
    .where(eq(jobExecutions.jobName, jobName))
    .orderBy(desc(jobExecutions.createdAt))
    .limit(rule.failureThreshold || 3);

  const consecutiveFailures = recentExecutions.filter(
    (exec) => exec.status === "failed"
  ).length;

  // Check if we've hit the threshold
  if (consecutiveFailures >= (rule.failureThreshold || 3)) {
    // Check cooldown period
    const cooldownMinutes = rule.alertCooldown || 30;
    const cooldownStart = new Date(Date.now() - cooldownMinutes * 60 * 1000);

    const recentAlerts = await db
      .select()
      .from(jobFailureAlerts)
      .where(
        and(
          eq(jobFailureAlerts.jobName, jobName),
          gte(jobFailureAlerts.lastAlertAt, cooldownStart.toISOString())
        )
      );

    if (recentAlerts.length === 0) {
      // Send alert
      await sendFailureAlert(jobName, consecutiveFailures, errorMessage || "Unknown error");

      // Update alert timestamp
      await db
        .update(jobFailureAlerts)
        .set({
          lastAlertAt: new Date().toISOString(),
          totalAlerts: sql`${jobFailureAlerts.totalAlerts} + 1`,
        })
        .where(eq(jobFailureAlerts.id, rule.id));

      // Check for escalation
      if (rule.escalationEnabled && consecutiveFailures >= (rule.escalationThreshold || 5)) {
        await escalateAlert(jobName, consecutiveFailures, errorMessage || "Unknown error");
      }

      return true;
    }
  }

  // Check if retry is enabled
  if (rule.retryEnabled) {
    await scheduleRetry(executionId, rule.maxRetries || 3, rule.retryBackoffMultiplier || 2);
  }

  return false;
}

/**
 * Send failure alert notification to owner
 */
async function sendFailureAlert(
  jobName: string,
  failureCount: number,
  errorMessage: string
): Promise<void> {
  const title = `🚨 Job Failure Alert: ${jobName}`;
  const content = `
**Critical Job Failure Detected**

- **Job Name:** ${jobName}
- **Consecutive Failures:** ${failureCount}
- **Error:** ${errorMessage}
- **Timestamp:** ${new Date().toISOString()}

**Action Required:** Please investigate this job failure immediately.
  `.trim();

  try {
    await notifyOwner({ title, content });
    console.log(`[JobFailureAlert] Alert sent for job: ${jobName}`);
  } catch (error) {
    console.error(`[JobFailureAlert] Failed to send alert for ${jobName}:`, error);
  }
}

/**
 * Escalate alert for critical failures
 */
async function escalateAlert(
  jobName: string,
  failureCount: number,
  errorMessage: string
): Promise<void> {
  const title = `🔴 CRITICAL: Job Failure Escalation - ${jobName}`;
  const content = `
**CRITICAL ESCALATION**

The job "${jobName}" has exceeded the escalation threshold.

- **Consecutive Failures:** ${failureCount}
- **Error:** ${errorMessage}
- **Timestamp:** ${new Date().toISOString()}

**IMMEDIATE ACTION REQUIRED:** This job has failed multiple times and requires urgent attention.
  `.trim();

  try {
    await notifyOwner({ title, content });
    console.log(`[JobFailureAlert] Escalation sent for job: ${jobName}`);
  } catch (error) {
    console.error(`[JobFailureAlert] Failed to escalate alert for ${jobName}:`, error);
  }
}

/**
 * Schedule retry attempt with exponential backoff
 */
async function scheduleRetry(
  executionId: number,
  maxRetries: number,
  backoffMultiplier: number
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  // Count existing retry attempts
  const existingRetries = await db
    .select()
    .from(jobRetryAttempts)
    .where(eq(jobRetryAttempts.jobExecutionId, executionId));

  const attemptNumber = existingRetries.length + 1;

  if (attemptNumber > maxRetries) {
    console.log(`[JobFailureAlert] Max retries (${maxRetries}) reached for execution ${executionId}`);
    return;
  }

  const delay = calculateBackoffDelay(attemptNumber, 60000, backoffMultiplier);
  const scheduledAt = new Date(Date.now() + delay);

  await db.insert(jobRetryAttempts).values({
    jobExecutionId: executionId,
    attemptNumber,
    status: "pending",
    scheduledAt: scheduledAt.toISOString(),
  });

  console.log(
    `[JobFailureAlert] Retry ${attemptNumber} scheduled for execution ${executionId} at ${scheduledAt.toISOString()}`
  );
}

/**
 * Get pending retry attempts
 */
export async function getPendingRetries(): Promise<RetryAttempt[]> {
  const db = await getDb();
  if (!db) return [];

  const now = new Date().toISOString();

  const retries = await db
    .select()
    .from(jobRetryAttempts)
    .where(
      and(
        eq(jobRetryAttempts.status, "pending"),
        sql`${jobRetryAttempts.scheduledAt} <= ${now}`
      )
    )
    .orderBy(jobRetryAttempts.scheduledAt);

  return retries.map((retry) => ({
    id: retry.id,
    jobExecutionId: retry.jobExecutionId,
    attemptNumber: retry.attemptNumber,
    status: retry.status as "pending" | "running" | "completed" | "failed",
    scheduledAt: new Date(retry.scheduledAt),
    executedAt: retry.executedAt ? new Date(retry.executedAt) : undefined,
    errorMessage: retry.errorMessage || undefined,
  }));
}

/**
 * Update retry attempt status
 */
export async function updateRetryStatus(
  retryId: number,
  status: "running" | "completed" | "failed",
  errorMessage?: string
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db
    .update(jobRetryAttempts)
    .set({
      status,
      executedAt: new Date().toISOString(),
      errorMessage: errorMessage || null,
    })
    .where(eq(jobRetryAttempts.id, retryId));
}

/**
 * Get failure history for a job
 */
export async function getFailureHistory(
  jobName: string,
  limit: number = 50
): Promise<Array<{ timestamp: Date; errorMessage: string; retries: number }>> {
  const db = await getDb();
  if (!db) return [];

  const failures = await db
    .select()
    .from(jobExecutions)
    .where(and(eq(jobExecutions.jobName, jobName), eq(jobExecutions.status, "failed")))
    .orderBy(desc(jobExecutions.createdAt))
    .limit(limit);

  const history = await Promise.all(
    failures.map(async (failure) => {
      const retries = await db
        .select()
        .from(jobRetryAttempts)
        .where(eq(jobRetryAttempts.jobExecutionId, failure.id));

      return {
        timestamp: new Date(failure.createdAt),
        errorMessage: failure.errorMessage || "Unknown error",
        retries: retries.length,
      };
    })
  );

  return history;
}

/**
 * Create or update alert rule
 */
export async function upsertAlertRule(rule: AlertRule): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (rule.id) {
    // Update existing rule
    await db
      .update(jobFailureAlerts)
      .set({
        enabled: rule.enabled ? 1 : 0,
        failureThreshold: rule.failureThreshold,
        alertCooldown: rule.alertCooldown,
        retryEnabled: rule.retryEnabled ? 1 : 0,
        maxRetries: rule.maxRetries,
        retryBackoffMultiplier: rule.retryBackoffMultiplier,
        escalationEnabled: rule.escalationEnabled ? 1 : 0,
        escalationThreshold: rule.escalationThreshold,
      })
      .where(eq(jobFailureAlerts.id, rule.id));

    return rule.id;
  } else {
    // Create new rule
    const result = await db.insert(jobFailureAlerts).values({
      jobName: rule.jobName,
      enabled: rule.enabled ? 1 : 0,
      failureThreshold: rule.failureThreshold,
      alertCooldown: rule.alertCooldown,
      retryEnabled: rule.retryEnabled ? 1 : 0,
      maxRetries: rule.maxRetries,
      retryBackoffMultiplier: rule.retryBackoffMultiplier,
      escalationEnabled: rule.escalationEnabled ? 1 : 0,
      escalationThreshold: rule.escalationThreshold,
      totalAlerts: 0,
    });

    return Number(result.insertId);
  }
}

/**
 * Get all alert rules
 */
export async function getAllAlertRules(): Promise<AlertRule[]> {
  const db = await getDb();
  if (!db) return [];

  const rules = await db.select().from(jobFailureAlerts);

  return rules.map((rule) => ({
    id: rule.id,
    jobName: rule.jobName,
    enabled: rule.enabled === 1,
    failureThreshold: rule.failureThreshold,
    alertCooldown: rule.alertCooldown,
    retryEnabled: rule.retryEnabled === 1,
    maxRetries: rule.maxRetries,
    retryBackoffMultiplier: rule.retryBackoffMultiplier,
    escalationEnabled: rule.escalationEnabled === 1,
    escalationThreshold: rule.escalationThreshold,
  }));
}
