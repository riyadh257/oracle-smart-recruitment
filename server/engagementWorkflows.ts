/**
 * Engagement-Triggered Workflows Service
 * Automatically execute actions when candidates reach engagement thresholds
 */

import { getDb } from "./db";
import { getCandidateEngagement } from "./candidateEngagement";

export interface WorkflowTrigger {
  id: number;
  employerId: number;
  name: string;
  description?: string;
  isActive: boolean;
  triggerType: "engagement_score" | "engagement_level" | "email_opened" | "link_clicked" | "response_received";
  triggerCondition: any;
  actionType: "send_email" | "schedule_interview" | "add_to_list" | "notify_recruiter" | "update_status";
  actionConfig: any;
  executionCount: number;
  lastExecutedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy: number;
}

export interface WorkflowExecution {
  id: number;
  triggerId: number;
  candidateId: number;
  employerId: number;
  executedAt: Date;
  status: "success" | "failed" | "pending";
  errorMessage?: string;
  actionResult?: any;
}

/**
 * Check if a trigger condition is met for a candidate
 */
async function checkTriggerCondition(
  trigger: WorkflowTrigger,
  candidateId: number,
  employerId: number
): Promise<boolean> {
  const engagement = await getCandidateEngagement(candidateId, employerId);
  
  if (!engagement) return false;

  switch (trigger.triggerType) {
    case "engagement_score":
      const { operator, threshold } = trigger.triggerCondition;
      if (operator === ">=") return engagement.engagementScore >= threshold;
      if (operator === "<=") return engagement.engagementScore <= threshold;
      if (operator === "==") return engagement.engagementScore === threshold;
      return false;

    case "engagement_level":
      const { level } = trigger.triggerCondition;
      return engagement.engagementLevel === level;

    case "email_opened":
      const { minOpens } = trigger.triggerCondition;
      return engagement.totalEmailsOpened >= (minOpens || 1);

    case "link_clicked":
      const { minClicks } = trigger.triggerCondition;
      return engagement.totalLinksClicked >= (minClicks || 1);

    case "response_received":
      const { minResponses } = trigger.triggerCondition;
      return engagement.totalResponses >= (minResponses || 1);

    default:
      return false;
  }
}

/**
 * Execute a workflow action
 */
async function executeAction(
  trigger: WorkflowTrigger,
  candidateId: number,
  employerId: number
): Promise<{ success: boolean; result?: any; error?: string }> {
  try {
    switch (trigger.actionType) {
      case "send_email":
        // Send follow-up email
        const { templateId, subject, delay } = trigger.actionConfig;
        // In production, integrate with email service
        return {
          success: true,
          result: {
            action: "send_email",
            templateId,
            subject,
            sentAt: new Date(),
          },
        };

      case "schedule_interview":
        // Schedule interview
        const { interviewType, duration, availableSlots } = trigger.actionConfig;
        // In production, integrate with calendar/scheduling service
        return {
          success: true,
          result: {
            action: "schedule_interview",
            interviewType,
            duration,
            scheduledAt: new Date(),
          },
        };

      case "add_to_list":
        // Add to candidate list
        const { listId, listName } = trigger.actionConfig;
        return {
          success: true,
          result: {
            action: "add_to_list",
            listId,
            listName,
          },
        };

      case "notify_recruiter":
        // Notify recruiter
        const { message, notifyMethod } = trigger.actionConfig;
        return {
          success: true,
          result: {
            action: "notify_recruiter",
            message,
            notifyMethod,
            notifiedAt: new Date(),
          },
        };

      case "update_status":
        // Update candidate status
        const { newStatus } = trigger.actionConfig;
        return {
          success: true,
          result: {
            action: "update_status",
            newStatus,
            updatedAt: new Date(),
          },
        };

      default:
        return {
          success: false,
          error: `Unknown action type: ${trigger.actionType}`,
        };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Action execution failed",
    };
  }
}

/**
 * Process engagement event and check for workflow triggers
 */
export async function processEngagementEvent(
  candidateId: number,
  employerId: number,
  eventType: WorkflowTrigger["triggerType"]
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get active triggers for this employer and event type
  const [triggers] = await db.execute(
    `SELECT * FROM workflowTriggers 
     WHERE employerId = ? AND isActive = TRUE AND triggerType = ?`,
    [employerId, eventType]
  ) as any;

  for (const trigger of triggers) {
    // Check if trigger condition is met
    const conditionMet = await checkTriggerCondition(trigger, candidateId, employerId);
    
    if (!conditionMet) continue;

    // Check if already executed for this candidate recently (prevent duplicates)
    const [recentExecutions] = await db.execute(
      `SELECT * FROM workflowExecutions 
       WHERE triggerId = ? AND candidateId = ? 
       AND executedAt >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
       LIMIT 1`,
      [trigger.id, candidateId]
    ) as any;

    if (recentExecutions.length > 0) continue;

    // Execute the action
    const result = await executeAction(trigger, candidateId, employerId);

    // Log execution
    await db.execute(
      `INSERT INTO workflowExecutions 
       (triggerId, candidateId, employerId, status, errorMessage, actionResult)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        trigger.id,
        candidateId,
        employerId,
        result.success ? "success" : "failed",
        result.error || null,
        result.result ? JSON.stringify(result.result) : null,
      ]
    );

    // Update trigger execution count
    await db.execute(
      `UPDATE workflowTriggers 
       SET executionCount = executionCount + 1, lastExecutedAt = NOW()
       WHERE id = ?`,
      [trigger.id]
    );
  }
}

/**
 * Create a new workflow trigger
 */
export async function createWorkflowTrigger(
  employerId: number,
  userId: number,
  data: Omit<WorkflowTrigger, "id" | "executionCount" | "lastExecutedAt" | "createdAt" | "updatedAt" | "createdBy" | "employerId">
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.execute(
    `INSERT INTO workflowTriggers 
     (employerId, name, description, isActive, triggerType, triggerCondition, actionType, actionConfig, createdBy)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      employerId,
      data.name,
      data.description || null,
      data.isActive,
      data.triggerType,
      JSON.stringify(data.triggerCondition),
      data.actionType,
      JSON.stringify(data.actionConfig),
      userId,
    ]
  ) as any;

  return result.insertId;
}

/**
 * Get all workflow triggers for an employer
 */
export async function getWorkflowTriggers(employerId: number): Promise<WorkflowTrigger[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [rows] = await db.execute(
    `SELECT * FROM workflowTriggers WHERE employerId = ? ORDER BY createdAt DESC`,
    [employerId]
  ) as any;

  return rows.map((row: any) => ({
    ...row,
    triggerCondition: JSON.parse(row.triggerCondition),
    actionConfig: JSON.parse(row.actionConfig),
  }));
}

/**
 * Update a workflow trigger
 */
export async function updateWorkflowTrigger(
  triggerId: number,
  employerId: number,
  data: Partial<Omit<WorkflowTrigger, "id" | "employerId" | "createdAt" | "updatedAt" | "createdBy">>
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updates: string[] = [];
  const values: any[] = [];

  if (data.name !== undefined) {
    updates.push("name = ?");
    values.push(data.name);
  }
  if (data.description !== undefined) {
    updates.push("description = ?");
    values.push(data.description);
  }
  if (data.isActive !== undefined) {
    updates.push("isActive = ?");
    values.push(data.isActive);
  }
  if (data.triggerCondition !== undefined) {
    updates.push("triggerCondition = ?");
    values.push(JSON.stringify(data.triggerCondition));
  }
  if (data.actionConfig !== undefined) {
    updates.push("actionConfig = ?");
    values.push(JSON.stringify(data.actionConfig));
  }

  if (updates.length === 0) return;

  values.push(triggerId, employerId);
  await db.execute(
    `UPDATE workflowTriggers SET ${updates.join(", ")} WHERE id = ? AND employerId = ?`,
    values
  );
}

/**
 * Delete a workflow trigger
 */
export async function deleteWorkflowTrigger(triggerId: number, employerId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.execute(
    `DELETE FROM workflowTriggers WHERE id = ? AND employerId = ?`,
    [triggerId, employerId]
  );
}

/**
 * Get workflow execution history
 */
export async function getWorkflowExecutions(
  employerId: number,
  options?: {
    triggerId?: number;
    candidateId?: number;
    status?: WorkflowExecution["status"];
    limit?: number;
  }
): Promise<Array<WorkflowExecution & { candidateName: string; triggerName: string }>> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  let query = `
    SELECT we.*, c.name as candidateName, wt.name as triggerName
    FROM workflowExecutions we
    JOIN candidates c ON we.candidateId = c.id
    JOIN workflowTriggers wt ON we.triggerId = wt.id
    WHERE we.employerId = ?
  `;
  const params: any[] = [employerId];

  if (options?.triggerId) {
    query += " AND we.triggerId = ?";
    params.push(options.triggerId);
  }
  if (options?.candidateId) {
    query += " AND we.candidateId = ?";
    params.push(options.candidateId);
  }
  if (options?.status) {
    query += " AND we.status = ?";
    params.push(options.status);
  }

  query += " ORDER BY we.executedAt DESC";
  
  if (options?.limit) {
    query += " LIMIT ?";
    params.push(options.limit);
  }

  const [rows] = await db.execute(query, params) as any;

  return rows.map((row: any) => ({
    ...row,
    actionResult: row.actionResult ? JSON.parse(row.actionResult) : null,
  }));
}
