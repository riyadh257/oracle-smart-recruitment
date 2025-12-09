import { eq, and, desc, inArray } from "drizzle-orm";
import { getDb } from "./db";
import {
  emailCampaigns,
  campaignTriggers,
  campaignExecutions,
  emailAnalytics,
  type EmailCampaign,
  type InsertEmailCampaign,
  type CampaignTrigger,
  type InsertCampaignTrigger,
  type CampaignExecution,
  type InsertCampaignExecution,
} from "../drizzle/schema";
import { sendEmail } from "./emailDelivery";
import { trackEmailSent } from "./emailAnalytics";

/**
 * Email Campaign Automation Module
 * Provides workflow builder, conditional branching, and automated email sequences
 */

/**
 * Workflow node types for the drag-and-drop builder
 */
export type WorkflowNodeType =
  | "trigger"
  | "action"
  | "condition"
  | "delay"
  | "end";

export interface WorkflowNode {
  id: string;
  type: WorkflowNodeType;
  label: string;
  config: Record<string, any>;
  position: { x: number; y: number };
  connections: string[]; // IDs of connected nodes
}

export interface WorkflowDefinition {
  nodes: WorkflowNode[];
  startNodeId: string;
}

/**
 * Create a new email campaign
 */
export async function createCampaign(
  data: InsertEmailCampaign
): Promise<EmailCampaign | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.insert(emailCampaigns).values(data);
  const campaignId = result[0].insertId;

  const campaign = await db
    .select()
    .from(emailCampaigns)
    .where(eq(emailCampaigns.id, campaignId))
    .limit(1);

  return campaign[0] || null;
}

/**
 * Update an existing campaign
 */
export async function updateCampaign(
  campaignId: number,
  data: Partial<InsertEmailCampaign>
): Promise<EmailCampaign | null> {
  const db = await getDb();
  if (!db) return null;

  await db
    .update(emailCampaigns)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(emailCampaigns.id, campaignId));

  const campaign = await db
    .select()
    .from(emailCampaigns)
    .where(eq(emailCampaigns.id, campaignId))
    .limit(1);

  return campaign[0] || null;
}

/**
 * Get all campaigns for an employer
 */
export async function getEmployerCampaigns(
  employerId: number
): Promise<EmailCampaign[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(emailCampaigns)
    .where(eq(emailCampaigns.employerId, employerId))
    .orderBy(desc(emailCampaigns.createdAt));
}

/**
 * Get a single campaign by ID
 */
export async function getCampaignById(
  campaignId: number
): Promise<EmailCampaign | null> {
  const db = await getDb();
  if (!db) return null;

  const campaign = await db
    .select()
    .from(emailCampaigns)
    .where(eq(emailCampaigns.id, campaignId))
    .limit(1);

  return campaign[0] || null;
}

/**
 * Delete a campaign
 */
export async function deleteCampaign(campaignId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  await db.delete(emailCampaigns).where(eq(emailCampaigns.id, campaignId));
  return true;
}

/**
 * Add a trigger to a campaign
 */
export async function addCampaignTrigger(
  data: InsertCampaignTrigger
): Promise<CampaignTrigger | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.insert(campaignTriggers).values(data);
  const triggerId = result[0].insertId;

  const trigger = await db
    .select()
    .from(campaignTriggers)
    .where(eq(campaignTriggers.id, triggerId))
    .limit(1);

  return trigger[0] || null;
}

/**
 * Get triggers for a campaign
 */
export async function getCampaignTriggers(
  campaignId: number
): Promise<CampaignTrigger[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(campaignTriggers)
    .where(eq(campaignTriggers.campaignId, campaignId));
}

/**
 * Execute a workflow node
 */
async function executeWorkflowNode(
  node: WorkflowNode,
  executionData: Record<string, any>,
  campaignId: number
): Promise<{ success: boolean; nextNodeId?: string; error?: string }> {
  const db = await getDb();
  if (!db) {
    return { success: false, error: "Database not available" };
  }

  try {
    switch (node.type) {
      case "action":
        // Execute email action
        if (node.config.actionType === "send_email") {
          const { templateId, recipientEmail, subject, customData } =
            node.config;

          // Track email
          const trackingId = await trackEmailSent({
            employerId: executionData.employerId,
            emailType: "campaign",
            recipientEmail,
            subject,
            metadata: { campaignId, nodeId: node.id, ...customData },
          });

          // Send email
          await sendEmail({
            to: recipientEmail,
            subject,
            html: node.config.emailContent || "<p>Campaign email</p>",
          });

          executionData.lastEmailSent = new Date().toISOString();
          executionData.emailTrackingId = trackingId;
        }
        break;

      case "condition":
        // Evaluate condition and determine next path
        const { conditionType, conditionValue, operator } = node.config;

        let conditionMet = false;

        if (conditionType === "email_opened") {
          // Check if previous email was opened
          const trackingId = executionData.emailTrackingId;
          if (trackingId) {
            const analytics = await db
              .select()
              .from(emailAnalytics)
              .where(eq(emailAnalytics.id, trackingId))
              .limit(1);

            conditionMet = analytics[0]?.opened || false;
          }
        } else if (conditionType === "email_clicked") {
          // Check if previous email was clicked
          const trackingId = executionData.emailTrackingId;
          if (trackingId) {
            const analytics = await db
              .select()
              .from(emailAnalytics)
              .where(eq(emailAnalytics.id, trackingId))
              .limit(1);

            conditionMet = analytics[0]?.clicked || false;
          }
        } else if (conditionType === "time_elapsed") {
          // Check if enough time has elapsed
          const lastEmailSent = new Date(executionData.lastEmailSent);
          const minutesElapsed =
            (Date.now() - lastEmailSent.getTime()) / (1000 * 60);
          conditionMet = minutesElapsed >= conditionValue;
        }

        // Return the appropriate next node based on condition
        const nextNodeId = conditionMet
          ? node.config.truePathNodeId
          : node.config.falsePathNodeId;

        return { success: true, nextNodeId };

      case "delay":
        // Schedule next execution after delay
        const delayMinutes = node.config.delayMinutes || 0;
        executionData.nextExecutionTime = new Date(
          Date.now() + delayMinutes * 60000
        ).toISOString();
        break;

      case "end":
        // Workflow complete
        return { success: true };
    }

    // Default: move to first connected node
    const nextNodeId = node.connections[0];
    return { success: true, nextNodeId };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Execute a campaign workflow
 */
export async function executeCampaignWorkflow(
  campaignId: number,
  candidateId: number,
  applicationId?: number,
  initialData?: Record<string, any>
): Promise<{ success: boolean; executionId?: number; error?: string }> {
  const db = await getDb();
  if (!db) {
    return { success: false, error: "Database not available" };
  }

  // Get campaign
  const campaign = await getCampaignById(campaignId);
  if (!campaign || !campaign.workflowDefinition) {
    return { success: false, error: "Campaign not found or has no workflow" };
  }

  const workflow = campaign.workflowDefinition as WorkflowDefinition;

  // Create execution record
  const executionResult = await db.insert(campaignExecutions).values({
    campaignId,
    candidateId,
    applicationId: applicationId || null,
    currentStep: workflow.startNodeId,
    executionData: initialData || {},
    status: "running",
    startedAt: new Date(),
  });

  const executionId = executionResult[0].insertId;

  // Start executing workflow
  let currentNodeId = workflow.startNodeId;
  let executionData = initialData || {};
  let maxIterations = 100; // Prevent infinite loops
  let iterations = 0;

  while (currentNodeId && iterations < maxIterations) {
    iterations++;

    const currentNode = workflow.nodes.find((n) => n.id === currentNodeId);
    if (!currentNode) {
      await db
        .update(campaignExecutions)
        .set({
          status: "failed",
          errorMessage: `Node ${currentNodeId} not found`,
          completedAt: new Date(),
        })
        .where(eq(campaignExecutions.id, executionId));

      return { success: false, error: `Node ${currentNodeId} not found` };
    }

    // Execute node
    const result = await executeWorkflowNode(
      currentNode,
      executionData,
      campaignId
    );

    if (!result.success) {
      await db
        .update(campaignExecutions)
        .set({
          status: "failed",
          errorMessage: result.error,
          completedAt: new Date(),
        })
        .where(eq(campaignExecutions.id, executionId));

      return { success: false, error: result.error };
    }

    // Update execution record
    await db
      .update(campaignExecutions)
      .set({
        currentStep: result.nextNodeId || currentNodeId,
        executionData,
        updatedAt: new Date(),
      })
      .where(eq(campaignExecutions.id, executionId));

    // Check if workflow is complete
    if (!result.nextNodeId || currentNode.type === "end") {
      await db
        .update(campaignExecutions)
        .set({
          status: "completed",
          completedAt: new Date(),
        })
        .where(eq(campaignExecutions.id, executionId));

      return { success: true, executionId };
    }

    // Move to next node
    currentNodeId = result.nextNodeId;
  }

  if (iterations >= maxIterations) {
    await db
      .update(campaignExecutions)
      .set({
        status: "failed",
        errorMessage: "Maximum iterations exceeded",
        completedAt: new Date(),
      })
      .where(eq(campaignExecutions.id, executionId));

    return { success: false, error: "Maximum iterations exceeded" };
  }

  return { success: true, executionId };
}

/**
 * Get campaign executions
 */
export async function getCampaignExecutions(
  campaignId: number
): Promise<CampaignExecution[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(campaignExecutions)
    .where(eq(campaignExecutions.campaignId, campaignId))
    .orderBy(desc(campaignExecutions.createdAt));
}

/**
 * Get campaign analytics (aggregated from email analytics)
 */
export async function getCampaignAnalytics(campaignId: number): Promise<{
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
  openRate: number;
  clickRate: number;
  executions: {
    total: number;
    completed: number;
    failed: number;
    running: number;
  };
}> {
  const db = await getDb();
  if (!db) {
    return {
      totalSent: 0,
      totalOpened: 0,
      totalClicked: 0,
      openRate: 0,
      clickRate: 0,
      executions: { total: 0, completed: 0, failed: 0, running: 0 },
    };
  }

  // Get email analytics for this campaign
  const analytics = await db
    .select()
    .from(emailAnalytics)
    .where(eq(emailAnalytics.emailType, "campaign"));

  const campaignEmails = analytics.filter(
    (a) => a.metadata && (a.metadata as any).campaignId === campaignId
  );

  const totalSent = campaignEmails.length;
  const totalOpened = campaignEmails.filter((e) => e.opened).length;
  const totalClicked = campaignEmails.filter((e) => e.clicked).length;

  // Get execution stats
  const executions = await db
    .select()
    .from(campaignExecutions)
    .where(eq(campaignExecutions.campaignId, campaignId));

  return {
    totalSent,
    totalOpened,
    totalClicked,
    openRate: totalSent > 0 ? (totalOpened / totalSent) * 100 : 0,
    clickRate: totalSent > 0 ? (totalClicked / totalSent) * 100 : 0,
    executions: {
      total: executions.length,
      completed: executions.filter((e) => e.status === "completed").length,
      failed: executions.filter((e) => e.status === "failed").length,
      running: executions.filter((e) => e.status === "running").length,
    },
  };
}

/**
 * Pause a campaign
 */
export async function pauseCampaign(campaignId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  await db
    .update(emailCampaigns)
    .set({ status: "paused", updatedAt: new Date() })
    .where(eq(emailCampaigns.id, campaignId));

  return true;
}

/**
 * Resume a campaign
 */
export async function resumeCampaign(campaignId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  await db
    .update(emailCampaigns)
    .set({ status: "active", updatedAt: new Date() })
    .where(eq(emailCampaigns.id, campaignId));

  return true;
}
