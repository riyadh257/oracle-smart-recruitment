import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { automationTriggers, automationLogs } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";

export const emailAutomationRouter = router({
  // List all workflows
  list: protectedProcedure
    .input(z.object({
      status: z.enum(["active", "paused", "draft"]).optional(),
      limit: z.number().default(50),
      offset: z.number().default(0),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      let query = db.select().from(automationTriggers).orderBy(desc(automationTriggers.createdAt));
      
      if (input.status) {
        query = query.where(eq(automationTriggers.status, input.status)) as any;
      }

      const workflows = await query.limit(input.limit).offset(input.offset);
      return workflows;
    }),

  // Get workflow details
  getDetails: protectedProcedure
    .input(z.object({
      workflowId: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const workflow = await db
        .select()
        .from(automationTriggers)
        .where(eq(automationTriggers.id, input.workflowId))
        .limit(1);

      if (workflow.length === 0) return null;

      // Get execution logs
      const logs = await db
        .select()
        .from(automationLogs)
        .where(eq(automationLogs.triggerId, input.workflowId))
        .orderBy(desc(automationLogs.executedAt))
        .limit(50);

      return {
        workflow: workflow[0],
        logs,
      };
    }),

  // Create new workflow
  create: protectedProcedure
    .input(z.object({
      name: z.string(),
      description: z.string().optional(),
      eventType: z.enum([
        "candidate_applied",
        "interview_scheduled",
        "interview_completed",
        "feedback_submitted",
        "no_response_3days",
        "no_response_7days",
      ]),
      emailSubject: z.string(),
      emailBody: z.string(),
      delayMinutes: z.number().default(0),
      status: z.enum(["active", "paused", "draft"]).default("draft"),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db.insert(automationTriggers).values({
        employerId: ctx.user.id,
        name: input.name,
        description: input.description,
        eventType: input.eventType,
        emailSubject: input.emailSubject,
        emailBody: input.emailBody,
        status: input.status,
        isActive: input.status === "active" ? 1 : 0,
        delayMinutes: input.delayMinutes,
        conditions: JSON.stringify({}),
      });

      return { success: true, workflowId: result[0].insertId };
    }),

  // Update workflow
  update: protectedProcedure
    .input(z.object({
      workflowId: z.number(),
      name: z.string().optional(),
      description: z.string().optional(),
      emailSubject: z.string().optional(),
      emailBody: z.string().optional(),
      delayMinutes: z.number().optional(),
      status: z.enum(["active", "paused", "draft"]).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const updateData: any = {};
      if (input.name) updateData.name = input.name;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.emailSubject) updateData.emailSubject = input.emailSubject;
      if (input.emailBody) updateData.emailBody = input.emailBody;
      if (input.delayMinutes !== undefined) updateData.delayMinutes = input.delayMinutes;
      if (input.status) {
        updateData.status = input.status;
        updateData.isActive = input.status === "active" ? 1 : 0;
      }

      await db
        .update(automationTriggers)
        .set(updateData)
        .where(eq(automationTriggers.id, input.workflowId));

      return { success: true };
    }),

  // Delete workflow
  delete: protectedProcedure
    .input(z.object({
      workflowId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .delete(automationTriggers)
        .where(eq(automationTriggers.id, input.workflowId));

      return { success: true };
    }),

  // Toggle workflow status
  toggleStatus: protectedProcedure
    .input(z.object({
      workflowId: z.number(),
      status: z.enum(["active", "paused"]),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(automationTriggers)
        .set({
          status: input.status,
          isActive: input.status === "active" ? 1 : 0,
        })
        .where(eq(automationTriggers.id, input.workflowId));

      return { success: true };
    }),

  // Get workflow analytics
  getAnalytics: protectedProcedure
    .input(z.object({
      workflowId: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const workflow = await db
        .select()
        .from(automationTriggers)
        .where(eq(automationTriggers.id, input.workflowId))
        .limit(1);

      if (workflow.length === 0) return null;

      const logs = await db
        .select()
        .from(automationLogs)
        .where(eq(automationLogs.triggerId, input.workflowId));

      const successCount = logs.filter(log => log.status === "success").length;
      const failureCount = logs.filter(log => log.status === "failed").length;
      const totalExecutions = logs.length;

      return {
        workflow: workflow[0],
        totalExecutions,
        successCount,
        failureCount,
        successRate: totalExecutions > 0 ? (successCount / totalExecutions) * 100 : 0,
        lastExecutedAt: logs.length > 0 ? logs[0]?.executedAt : null,
      };
    }),
});
