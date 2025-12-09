import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import {
  createScenario,
  getScenario,
  getUserScenarios,
  compareScenarios,
  deleteScenario,
  runMonteCarloSimulation,
  Scenario,
  CampaignInput,
} from "./budgetScenarioService";

const campaignInputSchema = z.object({
  name: z.string(),
  startDate: z.date(),
  endDate: z.date(),
  estimatedRecipients: z.number().min(1),
  costPerRecipient: z.number().min(0),
  expectedResponseRate: z.number().min(0).max(1).optional(),
  expectedConversionRate: z.number().min(0).max(1).optional(),
});

const scenarioSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  campaigns: z.array(campaignInputSchema).min(1),
});

export const budgetScenarioRouter = router({
  /**
   * Create a new budget scenario
   */
  createScenario: protectedProcedure
    .input(scenarioSchema)
    .mutation(async ({ input, ctx }) => {
      const scenario: Scenario = {
        name: input.name,
        description: input.description,
        createdBy: ctx.user.id,
        campaigns: input.campaigns as CampaignInput[],
      };

      const scenarioId = await createScenario(scenario);
      return { success: true, scenarioId };
    }),

  /**
   * Get scenario by ID
   */
  getScenario: protectedProcedure
    .input(z.object({ scenarioId: z.number() }))
    .query(async ({ input }) => {
      const scenario = await getScenario(input.scenarioId);
      return scenario;
    }),

  /**
   * Get all scenarios for current user
   */
  getUserScenarios: protectedProcedure.query(async ({ ctx }) => {
    const scenarios = await getUserScenarios(ctx.user.id);
    return scenarios;
  }),

  /**
   * Compare multiple scenarios
   */
  compareScenarios: protectedProcedure
    .input(z.object({ scenarioIds: z.array(z.number()).min(2).max(5) }))
    .query(async ({ input }) => {
      const comparison = await compareScenarios(input.scenarioIds);
      return comparison;
    }),

  /**
   * Delete scenario
   */
  deleteScenario: protectedProcedure
    .input(z.object({ scenarioId: z.number() }))
    .mutation(async ({ input }) => {
      await deleteScenario(input.scenarioId);
      return { success: true };
    }),

  /**
   * Run Monte Carlo simulation for risk analysis
   */
  runSimulation: protectedProcedure
    .input(
      z.object({
        campaigns: z.array(campaignInputSchema),
        iterations: z.number().min(100).max(10000).default(1000),
      })
    )
    .query(async ({ input }) => {
      const result = runMonteCarloSimulation(
        input.campaigns as CampaignInput[],
        input.iterations
      );
      return result;
    }),

  /**
   * Preview scenario without saving
   */
  previewScenario: protectedProcedure
    .input(z.object({ campaigns: z.array(campaignInputSchema) }))
    .query(async ({ input }) => {
      // Calculate result without saving to database
      const { calculateScenarioResult: calcFn } = await import("./budgetScenarioService");
      const result = calcFn(input.campaigns as CampaignInput[]);
      return result;
    }),

  /**
   * Get scenario statistics
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const scenarios = await getUserScenarios(ctx.user.id);

    const stats = {
      totalScenarios: scenarios.length,
      averageCost: scenarios.length > 0
        ? scenarios.reduce((sum, s) => sum + (s.result?.totalCost || 0), 0) / scenarios.length
        : 0,
      averageROI: scenarios.length > 0
        ? scenarios.reduce((sum, s) => sum + (s.result?.roi || 0), 0) / scenarios.length
        : 0,
      bestScenario: scenarios.reduce((best, current) => {
        if (!best || (current.result?.roi || 0) > (best.result?.roi || 0)) {
          return current;
        }
        return best;
      }, scenarios[0] || null),
    };

    return stats;
  }),
});
