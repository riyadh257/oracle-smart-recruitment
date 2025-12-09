import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import * as automationTestingDb from "./automationTestingDb";
import { TRPCError } from "@trpc/server";
import { executeTestScenario } from "./automationTestingExecution";
import {
  getCleanupConfig,
  saveCleanupConfig,
  cleanupOldTestData,
  cleanupExecutionData,
  getCleanupStats,
  type CleanupConfig
} from "./automationTestingCleanup";
import {
  getExecutionTrends,
  getPerformanceMetrics,
  getScenarioStats,
  getTestResultSummary,
  getRecentExecutionSummary,
  getOverallStats
} from "./automationTestingAnalytics";
import {
  getAllTemplates,
  getTemplateById,
  getTemplatesByType
} from "./automationTestingTemplates";
import * as automationTestingDb from "./automationTestingDb";
import {
  generateAnalyticsCSV,
  getAnalyticsExportData
} from "./automationTestingExport";
import * as customTemplatesDb from "./customTemplatesDb";

/**
 * Automation Testing Router
 * Provides endpoints for creating and managing test scenarios, triggers, campaigns, and executions
 */

export const automationTestingRouter = router({
  // ============================================================================
  // Test Scenarios
  // ============================================================================
  
  scenarios: router({
    list: protectedProcedure.query(async () => {
      return await automationTestingDb.getAllTestScenarios();
    }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const scenario = await automationTestingDb.getTestScenarioById(input.id);
        if (!scenario) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Test scenario not found"
          });
        }
        return scenario;
      }),
    
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        scenarioType: z.enum([
          'candidate_application',
          'interview_scheduling',
          'email_campaign',
          'engagement_tracking',
          'ab_testing',
          'full_workflow'
        ])
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await automationTestingDb.createTestScenario({
          ...input,
          createdBy: ctx.user.id
        });
        return { id, success: true };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        isActive: z.boolean().optional()
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await automationTestingDb.updateTestScenario(id, data);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await automationTestingDb.deleteTestScenario(input.id);
        return { success: true };
      })
  }),
  
  // ============================================================================
  // Test Triggers
  // ============================================================================
  
  triggers: router({
    listByScenario: protectedProcedure
      .input(z.object({ scenarioId: z.number() }))
      .query(async ({ input }) => {
        return await automationTestingDb.getTestTriggersByScenario(input.scenarioId);
      }),
    
    create: protectedProcedure
      .input(z.object({
        scenarioId: z.number(),
        name: z.string().min(1),
        triggerType: z.enum([
          'application_submitted',
          'interview_scheduled',
          'interview_completed',
          'feedback_submitted',
          'engagement_score_change',
          'time_based',
          'manual'
        ]),
        triggerConditions: z.record(z.any()).optional(),
        delayMinutes: z.number().default(0)
      }))
      .mutation(async ({ input }) => {
        const id = await automationTestingDb.createTestTrigger(input);
        return { id, success: true };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        triggerConditions: z.record(z.any()).optional(),
        delayMinutes: z.number().optional(),
        isActive: z.boolean().optional()
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await automationTestingDb.updateTestTrigger(id, data);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await automationTestingDb.deleteTestTrigger(input.id);
        return { success: true };
      })
  }),
  
  // ============================================================================
  // Test Campaigns
  // ============================================================================
  
  campaigns: router({
    listByScenario: protectedProcedure
      .input(z.object({ scenarioId: z.number() }))
      .query(async ({ input }) => {
        return await automationTestingDb.getTestCampaignsByScenario(input.scenarioId);
      }),
    
    create: protectedProcedure
      .input(z.object({
        scenarioId: z.number(),
        name: z.string().min(1),
        campaignType: z.enum(['email', 'sms', 'notification', 'multi_channel']),
        templateId: z.number().optional(),
        targetAudience: z.record(z.any()).optional(),
        content: z.record(z.any()).optional()
      }))
      .mutation(async ({ input }) => {
        const id = await automationTestingDb.createTestCampaign(input);
        return { id, success: true };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        targetAudience: z.record(z.any()).optional(),
        content: z.record(z.any()).optional(),
        isActive: z.boolean().optional()
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await automationTestingDb.updateTestCampaign(id, data);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await automationTestingDb.deleteTestCampaign(input.id);
        return { success: true };
      })
  }),
  
  // ============================================================================
  // Test Executions
  // ============================================================================
  
  executions: router({
    listByScenario: protectedProcedure
      .input(z.object({ scenarioId: z.number() }))
      .query(async ({ input }) => {
        return await automationTestingDb.getTestExecutionsByScenario(input.scenarioId);
      }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const execution = await automationTestingDb.getTestExecutionById(input.id);
        if (!execution) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Test execution not found"
          });
        }
        return execution;
      }),
    
    create: protectedProcedure
      .input(z.object({ scenarioId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const id = await automationTestingDb.createTestExecution({
          scenarioId: input.scenarioId,
          executedBy: ctx.user.id
        });
        return { id, success: true };
      }),
    
    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(['pending', 'running', 'completed', 'failed']),
        startedAt: z.date().optional(),
        completedAt: z.date().optional(),
        results: z.record(z.any()).optional(),
        errorLog: z.string().optional()
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await automationTestingDb.updateTestExecution(id, data);
        return { success: true };
      }),
    
    updateMetrics: protectedProcedure
      .input(z.object({
        id: z.number(),
        sampleDataGenerated: z.boolean().optional(),
        testCandidatesCount: z.number().optional(),
        testJobsCount: z.number().optional(),
        testApplicationsCount: z.number().optional(),
        triggersExecuted: z.number().optional(),
        campaignsExecuted: z.number().optional()
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await automationTestingDb.updateTestExecution(id, data);
        return { success: true };
      }),
    
    execute: protectedProcedure
      .input(z.object({
        executionId: z.number(),
        scenarioId: z.number()
      }))
      .mutation(async ({ input, ctx }) => {
        await executeTestScenario(input.executionId, input.scenarioId, ctx.user.id);
        return { success: true };
      })
  }),
  
  // ============================================================================
  // Test Data & Results
  // ============================================================================
  
  data: router({
    track: protectedProcedure
      .input(z.object({
        executionId: z.number(),
        dataType: z.enum(['candidate', 'job', 'application', 'interview', 'email', 'campaign_execution']),
        recordId: z.number(),
        recordData: z.record(z.any()).optional()
      }))
      .mutation(async ({ input }) => {
        const id = await automationTestingDb.createTestData(input);
        return { id, success: true };
      }),
    
    listByExecution: protectedProcedure
      .input(z.object({ executionId: z.number() }))
      .query(async ({ input }) => {
        return await automationTestingDb.getTestDataByExecution(input.executionId);
      }),
    
    cleanup: protectedProcedure
      .input(z.object({ executionId: z.number() }))
      .mutation(async ({ input }) => {
        await automationTestingDb.cleanupTestData(input.executionId);
        return { success: true };
      })
  }),
  
  results: router({
    create: protectedProcedure
      .input(z.object({
        executionId: z.number(),
        testType: z.string(),
        testName: z.string(),
        passed: z.boolean(),
        expectedValue: z.string().optional(),
        actualValue: z.string().optional(),
        executionTime: z.number().optional(),
        errorMessage: z.string().optional(),
        stackTrace: z.string().optional(),
        metadata: z.record(z.any()).optional()
      }))
      .mutation(async ({ input }) => {
        const id = await automationTestingDb.createTestResult(input);
        return { id, success: true };
      }),
    
    listByExecution: protectedProcedure
      .input(z.object({ executionId: z.number() }))
      .query(async ({ input }) => {
        return await automationTestingDb.getTestResultsByExecution(input.executionId);
      })
  }),
  
  // ============================================================================
  // Cleanup Management
  // ============================================================================
  
  cleanup: router({
    getConfig: protectedProcedure.query(async () => {
      return await getCleanupConfig();
    }),
    
    saveConfig: protectedProcedure
      .input(z.object({
        retentionDays: z.number().min(1).max(365),
        cleanupExecutions: z.boolean(),
        cleanupTestData: z.boolean(),
        cleanupResults: z.boolean()
      }))
      .mutation(async ({ input }) => {
        await saveCleanupConfig(input);
        return { success: true };
      }),
    
    runCleanup: protectedProcedure
      .mutation(async () => {
        const result = await cleanupOldTestData();
        return result;
      }),
    
    cleanupExecution: protectedProcedure
      .input(z.object({ executionId: z.number() }))
      .mutation(async ({ input }) => {
        await cleanupExecutionData(input.executionId);
        return { success: true };
      }),
    
    getStats: protectedProcedure.query(async () => {
      return await getCleanupStats();
    })
  }),
  
  // ============================================================================
  // Analytics & Reporting
  // ============================================================================
  
  analytics: router({
    trends: protectedProcedure
      .input(z.object({ days: z.number().optional().default(30) }))
      .query(async ({ input }) => {
        return await getExecutionTrends(input.days);
      }),
    
    performance: protectedProcedure.query(async () => {
      return await getPerformanceMetrics();
    }),
    
    scenarioStats: protectedProcedure.query(async () => {
      return await getScenarioStats();
    }),
    
    testResults: protectedProcedure
      .input(z.object({ executionId: z.number().optional() }))
      .query(async ({ input }) => {
        return await getTestResultSummary(input.executionId);
      }),
    
    recentExecutions: protectedProcedure
      .input(z.object({ limit: z.number().optional().default(10) }))
      .query(async ({ input }) => {
        return await getRecentExecutionSummary(input.limit);
      }),
    
    overallStats: protectedProcedure.query(async () => {
      return await getOverallStats();
    })
  }),
  
  // ============================================================================
  // Templates
  // ============================================================================
  
  templates: router({
    list: protectedProcedure.query(() => {
      return getAllTemplates();
    }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(({ input }) => {
        const template = getTemplateById(input.id);
        if (!template) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Template not found"
          });
        }
        return template;
      }),
    
    getByType: protectedProcedure
      .input(z.object({ scenarioType: z.string() }))
      .query(({ input }) => {
        return getTemplatesByType(input.scenarioType);
      }),
    
    createFromTemplate: protectedProcedure
      .input(z.object({
        templateId: z.string(),
        name: z.string().optional()
      }))
      .mutation(async ({ input, ctx }) => {
        const template = getTemplateById(input.templateId);
        if (!template) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Template not found"
          });
        }
        
        // Create scenario from template
        const scenarioId = await automationTestingDb.createTestScenario({
          name: input.name || template.name,
          description: template.description,
          scenarioType: template.scenarioType,
          createdBy: ctx.user.id
        });
        
        // Create triggers from template
        for (const trigger of template.triggers) {
          await automationTestingDb.createTestTrigger({
            scenarioId,
            name: trigger.name,
            triggerType: trigger.triggerType as any,
            delayMinutes: trigger.delayMinutes,
            triggerConditions: trigger.triggerConditions
          });
        }
        
        // Create campaigns from template
        for (const campaign of template.campaigns) {
          await automationTestingDb.createTestCampaign({
            scenarioId,
            name: campaign.name,
            campaignType: campaign.campaignType,
            content: campaign.content
          });
        }
        
        return { scenarioId, success: true };
      })
  }),
  
  // ============================================================================
  // Export
  // ============================================================================
  
  export: router({
    csv: protectedProcedure
      .input(z.object({ days: z.number().optional().default(30) }))
      .query(async ({ input }) => {
        const csv = await generateAnalyticsCSV(input.days);
        return { csv, filename: `automation-testing-analytics-${new Date().toISOString().split('T')[0]}.csv` };
      }),
    
    data: protectedProcedure
      .input(z.object({ days: z.number().optional().default(30) }))
      .query(async ({ input }) => {
        return await getAnalyticsExportData(input.days);
      })
  }),
  
  // ============================================================================
  // Custom Templates
  // ============================================================================
  
  customTemplates: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await customTemplatesDb.getCustomTemplatesByUser(ctx.user.id);
    }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const template = await customTemplatesDb.getCustomTemplateById(input.id);
        if (!template) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Template not found"
          });
        }
        return template;
      }),
    
    getByType: protectedProcedure
      .input(z.object({ scenarioType: z.string() }))
      .query(async ({ input, ctx }) => {
        return await customTemplatesDb.getCustomTemplatesByType(input.scenarioType, ctx.user.id);
      }),
    
    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        description: z.string().optional(),
        scenarioType: z.string(),
        isPublic: z.boolean().optional(),
        templateData: z.any()
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await customTemplatesDb.createCustomTemplate({
          ...input,
          createdBy: ctx.user.id
        });
        return { id, success: true };
      }),
    
    createFromScenario: protectedProcedure
      .input(z.object({
        scenarioId: z.number(),
        name: z.string(),
        description: z.string().optional(),
        isPublic: z.boolean().optional()
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await customTemplatesDb.createTemplateFromScenario(
          input.scenarioId,
          ctx.user.id,
          input.name,
          input.description,
          input.isPublic
        );
        return { id, success: true };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        scenarioType: z.string().optional(),
        isPublic: z.boolean().optional(),
        templateData: z.any().optional()
      }))
      .mutation(async ({ input, ctx }) => {
        const { id, ...updates } = input;
        await customTemplatesDb.updateCustomTemplate(id, ctx.user.id, updates);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await customTemplatesDb.deleteCustomTemplate(input.id, ctx.user.id);
        return { success: true };
      }),
    
    createFromCustomTemplate: protectedProcedure
      .input(z.object({
        templateId: z.number(),
        name: z.string().optional()
      }))
      .mutation(async ({ input, ctx }) => {
        const template = await customTemplatesDb.getCustomTemplateById(input.templateId);
        if (!template) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Template not found"
          });
        }
        
        // Create scenario from custom template
        const scenarioId = await automationTestingDb.createTestScenario({
          name: input.name || template.name,
          description: template.description || '',
          scenarioType: template.scenarioType as any,
          createdBy: ctx.user.id
        });
        
        // Create triggers from template
        for (const trigger of template.templateData.triggers) {
          await automationTestingDb.createTestTrigger({
            scenarioId,
            name: trigger.name,
            triggerType: trigger.triggerType,
            delayMinutes: trigger.delayMinutes,
            triggerConditions: trigger.triggerConditions
          });
        }
        
        // Create campaigns from template
        for (const campaign of template.templateData.campaigns) {
          await automationTestingDb.createTestCampaign({
            scenarioId,
            name: campaign.name,
            campaignType: campaign.campaignType,
            content: campaign.content
          });
        }
        
        return { scenarioId, success: true };
      })
  })
});
