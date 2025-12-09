import { getDb } from "./db";
import { candidates, applications } from "../drizzle/schema";
import { eq, and, lt, sql } from "drizzle-orm";
import { queueEmail } from "./emailTriggers";

/**
 * Pipeline Automation Rules Engine
 * Handles automatic status transitions and triggers based on conditions
 */

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  trigger: "time_based" | "status_change" | "manual";
  conditions: {
    status?: string;
    daysInactive?: number;
    noActivity?: boolean;
  };
  actions: {
    updateStatus?: string;
    sendEmail?: boolean;
    emailTemplate?: string;
    notifyOwner?: boolean;
  };
  isActive: boolean;
}

// Default automation rules
export const defaultRules: AutomationRule[] = [
  {
    id: "auto_reject_30_days",
    name: "Auto-reject after 30 days inactive",
    description: "Automatically reject candidates with no activity for 30 days",
    trigger: "time_based",
    conditions: {
      status: "screening",
      daysInactive: 30,
      noActivity: true,
    },
    actions: {
      updateStatus: "rejected",
      sendEmail: true,
      emailTemplate: "auto_rejection",
    },
    isActive: true,
  },
  {
    id: "follow_up_after_screening",
    name: "Follow-up after screening",
    description: "Send follow-up email 3 days after screening completion",
    trigger: "time_based",
    conditions: {
      status: "screened",
      daysInactive: 3,
    },
    actions: {
      sendEmail: true,
      emailTemplate: "screening_follow_up",
    },
    isActive: true,
  },
  {
    id: "interview_reminder",
    name: "Interview reminder",
    description: "Send reminder 1 day before scheduled interview",
    trigger: "time_based",
    conditions: {
      status: "interview_scheduled",
      daysInactive: -1, // 1 day before
    },
    actions: {
      sendEmail: true,
      emailTemplate: "interview_reminder",
    },
    isActive: true,
  },
  {
    id: "feedback_reminder",
    name: "Feedback submission reminder",
    description: "Remind interviewers to submit feedback 2 days after interview",
    trigger: "time_based",
    conditions: {
      status: "interview_completed",
      daysInactive: 2,
    },
    actions: {
      sendEmail: true,
      emailTemplate: "feedback_reminder",
      notifyOwner: true,
    },
    isActive: true,
  },
];

/**
 * Check and execute time-based automation rules
 */
export async function executeTimeBasedRules(): Promise<{
  executed: number;
  candidates: number[];
}> {
  const db = await getDb();
  if (!db) {
    console.warn("[Pipeline Automation] Database not available");
    return { executed: 0, candidates: [] };
  }

  let totalExecuted = 0;
  const affectedCandidates: number[] = [];

  for (const rule of defaultRules) {
    if (!rule.isActive || rule.trigger !== "time_based") continue;

    try {
      const result = await executeRule(rule);
      totalExecuted += result.count;
      affectedCandidates.push(...result.candidateIds);
    } catch (error) {
      console.error(`[Pipeline Automation] Error executing rule ${rule.id}:`, error);
    }
  }

  return {
    executed: totalExecuted,
    candidates: affectedCandidates,
  };
}

/**
 * Execute a specific automation rule
 */
async function executeRule(rule: AutomationRule): Promise<{
  count: number;
  candidateIds: number[];
}> {
  const db = await getDb();
  if (!db) return { count: 0, candidateIds: [] };

  const { conditions, actions } = rule;
  const candidateIds: number[] = [];

  // Calculate the date threshold
  const thresholdDate = new Date();
  if (conditions.daysInactive) {
    thresholdDate.setDate(thresholdDate.getDate() - conditions.daysInactive);
  }

  // Find candidates matching conditions
  const matchingCandidates = await db
    .select()
    .from(candidates)
    .where(
      and(
        conditions.status ? eq(candidates.profileStatus, conditions.status as any) : sql`1=1`,
        conditions.daysInactive
          ? lt(candidates.updatedAt, thresholdDate)
          : sql`1=1`
      )
    )
    .limit(100); // Process in batches

  for (const candidate of matchingCandidates) {
    try {
      // Execute actions
      if (actions.updateStatus) {
        await db
          .update(candidates)
          .set({
            profileStatus: actions.updateStatus as any,
            updatedAt: new Date(),
          })
          .where(eq(candidates.id, candidate.id));
      }

      candidateIds.push(candidate.id);

      // Queue email for sending
      if (actions.sendEmail && actions.emailTemplate) {
        queueEmail(
          candidate.id,
          actions.emailTemplate,
          {
            companyName: "Your Company",
            positionTitle: "Open Position",
          },
          new Date()
        );
      }

      if (actions.notifyOwner) {
        console.log(
          `[Pipeline Automation] Queued owner notification for candidate ${candidate.id}`
        );
      }
    } catch (error) {
      console.error(
        `[Pipeline Automation] Error processing candidate ${candidate.id}:`,
        error
      );
    }
  }

  return {
    count: candidateIds.length,
    candidateIds,
  };
}

/**
 * Get all active automation rules
 */
export function getActiveRules(): AutomationRule[] {
  return defaultRules.filter((rule) => rule.isActive);
}

/**
 * Update rule activation status
 */
export function updateRuleStatus(ruleId: string, isActive: boolean): boolean {
  const rule = defaultRules.find((r) => r.id === ruleId);
  if (rule) {
    rule.isActive = isActive;
    return true;
  }
  return false;
}

/**
 * Manual trigger for a specific rule
 */
export async function triggerRule(ruleId: string): Promise<{
  success: boolean;
  count: number;
  candidateIds: number[];
}> {
  const rule = defaultRules.find((r) => r.id === ruleId);
  if (!rule) {
    return { success: false, count: 0, candidateIds: [] };
  }

  try {
    const result = await executeRule(rule);
    return {
      success: true,
      ...result,
    };
  } catch (error) {
    console.error(`[Pipeline Automation] Error triggering rule ${ruleId}:`, error);
    return { success: false, count: 0, candidateIds: [] };
  }
}
