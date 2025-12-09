import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createCampaign,
  updateCampaign,
  getEmployerCampaigns,
  getCampaignById,
  deleteCampaign,
  addCampaignTrigger,
  getCampaignTriggers,
  executeCampaignWorkflow,
  getCampaignExecutions,
  getCampaignAnalytics,
  pauseCampaign,
  resumeCampaign,
  type WorkflowDefinition,
} from "../emailCampaigns";
import { TRPCError } from "@trpc/server";

/**
 * Email Campaign Automation Router
 */
export const campaignRouter = router({
  /**
   * Create a new campaign
   */
  create: protectedProcedure
    .input(
      z.object({
        employerId: z.number(),
        name: z.string(),
        description: z.string().optional(),
        workflowDefinition: z.any().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const campaign = await createCampaign({
        ...input,
        status: "draft",
      });

      if (!campaign) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create campaign",
        });
      }

      return campaign;
    }),

  /**
   * Update a campaign
   */
  update: protectedProcedure
    .input(
      z.object({
        campaignId: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        workflowDefinition: z.any().optional(),
        status: z.enum(["draft", "active", "paused", "completed"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { campaignId, ...data } = input;

      const campaign = await updateCampaign(campaignId, data);

      if (!campaign) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Campaign not found",
        });
      }

      return campaign;
    }),

  /**
   * Get all campaigns for an employer
   */
  getAll: protectedProcedure
    .input(
      z.object({
        employerId: z.number(),
      })
    )
    .query(async ({ input }) => {
      return await getEmployerCampaigns(input.employerId);
    }),

  /**
   * Get a single campaign
   */
  getById: protectedProcedure
    .input(
      z.object({
        campaignId: z.number(),
      })
    )
    .query(async ({ input }) => {
      const campaign = await getCampaignById(input.campaignId);

      if (!campaign) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Campaign not found",
        });
      }

      return campaign;
    }),

  /**
   * Delete a campaign
   */
  delete: protectedProcedure
    .input(
      z.object({
        campaignId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const success = await deleteCampaign(input.campaignId);

      if (!success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete campaign",
        });
      }

      return { success: true };
    }),

  /**
   * Add a trigger to a campaign
   */
  addTrigger: protectedProcedure
    .input(
      z.object({
        campaignId: z.number(),
        triggerType: z.enum([
          "application_submitted",
          "interview_scheduled",
          "interview_completed",
          "application_rejected",
          "email_opened",
          "email_clicked",
          "time_delay",
        ]),
        triggerConditions: z.any().optional(),
        delayMinutes: z.number().default(0),
      })
    )
    .mutation(async ({ input }) => {
      const trigger = await addCampaignTrigger(input);

      if (!trigger) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to add trigger",
        });
      }

      return trigger;
    }),

  /**
   * Get triggers for a campaign
   */
  getTriggers: protectedProcedure
    .input(
      z.object({
        campaignId: z.number(),
      })
    )
    .query(async ({ input }) => {
      return await getCampaignTriggers(input.campaignId);
    }),

  /**
   * Execute a campaign workflow
   */
  execute: protectedProcedure
    .input(
      z.object({
        campaignId: z.number(),
        candidateId: z.number(),
        applicationId: z.number().optional(),
        initialData: z.any().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await executeCampaignWorkflow(
        input.campaignId,
        input.candidateId,
        input.applicationId,
        input.initialData
      );

      if (!result.success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: result.error || "Failed to execute campaign",
        });
      }

      return {
        success: true,
        executionId: result.executionId,
      };
    }),

  /**
   * Execute a campaign workflow for multiple candidates (bulk send)
   */
  bulkExecute: protectedProcedure
    .input(
      z.object({
        campaignId: z.number(),
        candidateIds: z.array(z.number()),
        initialData: z.any().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const results = {
        total: input.candidateIds.length,
        successful: 0,
        failed: 0,
        errors: [] as Array<{ candidateId: number; error: string }>,
      };

      // Execute campaign for each candidate
      for (const candidateId of input.candidateIds) {
        try {
          const result = await executeCampaignWorkflow(
            input.campaignId,
            candidateId,
            undefined,
            input.initialData
          );

          if (result.success) {
            results.successful++;
          } else {
            results.failed++;
            results.errors.push({
              candidateId,
              error: result.error || "Unknown error",
            });
          }
        } catch (error) {
          results.failed++;
          results.errors.push({
            candidateId,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      return results;
    }),

  /**
   * Get campaign executions
   */
  getExecutions: protectedProcedure
    .input(
      z.object({
        campaignId: z.number(),
      })
    )
    .query(async ({ input }) => {
      return await getCampaignExecutions(input.campaignId);
    }),

  /**
   * Get campaign analytics
   */
  getAnalytics: protectedProcedure
    .input(
      z.object({
        campaignId: z.number(),
      })
    )
    .query(async ({ input }) => {
      return await getCampaignAnalytics(input.campaignId);
    }),

  /**
   * Pause a campaign
   */
  pause: protectedProcedure
    .input(
      z.object({
        campaignId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const success = await pauseCampaign(input.campaignId);

      if (!success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to pause campaign",
        });
      }

      return { success: true };
    }),

  /**
   * Resume a campaign
   */
  resume: protectedProcedure
    .input(
      z.object({
        campaignId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const success = await resumeCampaign(input.campaignId);

      if (!success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to resume campaign",
        });
      }

      return { success: true };
    }),
});
