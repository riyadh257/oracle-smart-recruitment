import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import {
  automationTriggers,
  automationLogs,
  emailTemplateLibrary,
  candidates,
} from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

// Event emitter for automation triggers
type AutomationEvent = {
  type: "application_received" | "interview_scheduled" | "interview_completed" | 
        "offer_extended" | "offer_accepted" | "offer_rejected" | "candidate_registered";
  candidateId: number;
  employerId: number;
  metadata?: Record<string, any>;
};

class AutomationEngine {
  async processEvent(event: AutomationEvent) {
    const db = await getDb();
    if (!db) {
      console.error("[Automation] Database unavailable");
      return;
    }

    // Find active triggers for this event type
    const triggers = await db
      .select()
      .from(automationTriggers)
      .where(
        and(
          eq(automationTriggers.eventType, event.type),
          eq(automationTriggers.employerId, event.employerId),
          eq(automationTriggers.isActive, 1)
        )
      );

    for (const trigger of triggers) {
      // Check if conditions match (if any)
      if (trigger.conditions) {
        try {
          const conditions = JSON.parse(trigger.conditions);
          if (!this.evaluateConditions(conditions, event.metadata || {})) {
            continue;
          }
        } catch (error) {
          console.error(`[Automation] Failed to parse conditions for trigger ${trigger.id}:`, error);
          continue;
        }
      }

      // Schedule or execute immediately
      if (trigger.delayMinutes && trigger.delayMinutes > 0) {
        await this.scheduleExecution(trigger.id, event.candidateId, trigger.delayMinutes);
      } else {
        await this.executeAutomation(trigger.id, event.candidateId, event.type);
      }
    }
  }

  private evaluateConditions(conditions: any, metadata: Record<string, any>): boolean {
    // Simple condition evaluation - can be extended
    if (!conditions || Object.keys(conditions).length === 0) {
      return true;
    }

    for (const [key, value] of Object.entries(conditions)) {
      if (metadata[key] !== value) {
        return false;
      }
    }

    return true;
  }

  private async scheduleExecution(triggerId: number, candidateId: number, delayMinutes: number) {
    const db = await getDb();
    if (!db) return;

    // Log as pending
    await db.insert(automationLogs).values({
      triggerId,
      candidateId,
      eventType: "scheduled",
      status: "pending",
      emailSent: 0,
    });

    // In production, use a job queue like Bull or Agenda
    // For now, we'll use setTimeout (not production-ready)
    setTimeout(async () => {
      const trigger = await db.select().from(automationTriggers).where(eq(automationTriggers.id, triggerId)).limit(1);
      if (trigger[0]) {
        await this.executeAutomation(triggerId, candidateId, trigger[0].eventType);
      }
    }, delayMinutes * 60 * 1000);
  }

  private async executeAutomation(triggerId: number, candidateId: number, eventType: string) {
    const db = await getDb();
    if (!db) return;

    try {
      // Get trigger details
      const trigger = await db
        .select()
        .from(automationTriggers)
        .where(eq(automationTriggers.id, triggerId))
        .limit(1);

      if (!trigger[0]) {
        throw new Error("Trigger not found");
      }

      // Get template
      const template = await db
        .select()
        .from(emailTemplateLibrary)
        .where(eq(emailTemplateLibrary.id, trigger[0].templateId))
        .limit(1);

      if (!template[0]) {
        throw new Error("Template not found");
      }

      // Get candidate
      const candidate = await db
        .select()
        .from(candidates)
        .where(eq(candidates.id, candidateId))
        .limit(1);

      if (!candidate[0]) {
        throw new Error("Candidate not found");
      }

      // Substitute variables in template
      const subject = this.substituteVariables(template[0].subject, candidate[0]);
      const bodyHtml = this.substituteVariables(template[0].bodyHtml, candidate[0]);

      // TODO: Send email using email service
      console.log(`[Automation] Sending email to ${candidate[0].email}:`, { subject, bodyHtml });

      // Log success
      await db.insert(automationLogs).values({
        triggerId,
        candidateId,
        eventType,
        status: "sent",
        emailSent: 1,
      });

      // Update trigger statistics
      await db
        .update(automationTriggers)
        .set({
          timesTriggered: trigger[0].timesTriggered + 1,
          lastTriggeredAt: new Date().toISOString(),
        })
        .where(eq(automationTriggers.id, triggerId));
    } catch (error) {
      console.error(`[Automation] Failed to execute trigger ${triggerId}:`, error);

      // Log failure
      await db.insert(automationLogs).values({
        triggerId,
        candidateId,
        eventType,
        status: "failed",
        emailSent: 0,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  private substituteVariables(text: string, candidate: any): string {
    return text
      .replace(/\{\{candidateName\}\}/g, candidate.fullName || "Candidate")
      .replace(/\{\{candidateEmail\}\}/g, candidate.email || "")
      .replace(/\{\{candidatePhone\}\}/g, candidate.phone || "")
      .replace(/\{\{firstName\}\}/g, candidate.fullName?.split(" ")[0] || "");
  }
}

export const automationEngine = new AutomationEngine();

// Helper function to trigger automation events
export async function triggerAutomationEvent(event: AutomationEvent) {
  await automationEngine.processEvent(event);
}

export const templateAutomationRouter = router({
  // Get all triggers for employer
  getTriggers: protectedProcedure
    .input(z.object({ employerId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      return await db
        .select()
        .from(automationTriggers)
        .where(eq(automationTriggers.employerId, input.employerId))
        .orderBy(desc(automationTriggers.createdAt));
    }),

  // Create automation trigger
  createTrigger: protectedProcedure
    .input(
      z.object({
        employerId: z.number(),
        name: z.string(),
        description: z.string().optional(),
        eventType: z.enum([
          "application_received",
          "interview_scheduled",
          "interview_completed",
          "offer_extended",
          "offer_accepted",
          "offer_rejected",
          "candidate_registered",
        ]),
        templateId: z.number(),
        isActive: z.boolean().optional(),
        conditions: z.string().optional(),
        delayMinutes: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const { isActive, ...rest } = input;
      const values: any = { ...rest };
      if (isActive !== undefined) {
        values.isActive = isActive ? 1 : 0;
      }
      const [result] = await db.insert(automationTriggers).values(values);
      return { id: result.insertId };
    }),

  // Update trigger
  updateTrigger: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        templateId: z.number().optional(),
        isActive: z.boolean().optional(),
        conditions: z.string().optional(),
        delayMinutes: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const { id, isActive, ...updates } = input;
      const dbUpdates: any = { ...updates };
      if (isActive !== undefined) {
        dbUpdates.isActive = isActive ? 1 : 0;
      }
      await db.update(automationTriggers).set(dbUpdates).where(eq(automationTriggers.id, id));

      return { success: true };
    }),

  // Delete trigger
  deleteTrigger: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      await db.delete(automationTriggers).where(eq(automationTriggers.id, input.id));
      return { success: true };
    }),

  // Get automation logs
  getLogs: protectedProcedure
    .input(
      z.object({
        triggerId: z.number().optional(),
        candidateId: z.number().optional(),
        limit: z.number().default(50),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      let query = db.select().from(automationLogs).orderBy(desc(automationLogs.executedAt)).limit(input.limit);

      if (input.triggerId) {
        query = query.where(eq(automationLogs.triggerId, input.triggerId)) as any;
      }

      if (input.candidateId) {
        query = query.where(eq(automationLogs.candidateId, input.candidateId)) as any;
      }

      return await query;
    }),

  // Test trigger (manual execution)
  testTrigger: protectedProcedure
    .input(z.object({ triggerId: z.number(), candidateId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const trigger = await db
        .select()
        .from(automationTriggers)
        .where(eq(automationTriggers.id, input.triggerId))
        .limit(1);

      if (!trigger[0]) {
        throw new Error("Trigger not found");
      }

      await automationEngine.processEvent({
        type: trigger[0].eventType,
        candidateId: input.candidateId,
        employerId: trigger[0].employerId,
        metadata: { test: true },
      });

      return { success: true };
    }),
});
