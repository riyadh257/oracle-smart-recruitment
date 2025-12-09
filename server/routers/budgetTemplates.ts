import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { customTemplates, budgetScenarios } from "../../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";

/**
 * Budget Scenario Templates Router
 * Pre-configured templates for common campaign types
 */

interface TemplateConfig {
  id: string;
  name: string;
  description: string;
  category: 'seasonal' | 'urgent' | 'bulk' | 'custom';
  defaultCampaigns: Array<{
    name: string;
    durationDays: number;
    estimatedRecipients: number;
    costPerRecipient: number;
    expectedResponseRate: number;
    expectedConversionRate: number;
  }>;
  totalEstimatedCost: number;
  estimatedROI: number;
  recommendedFor: string[];
  tags: string[];
}

// Pre-defined templates
const BUDGET_TEMPLATES: TemplateConfig[] = [
  // Seasonal Hiring Templates
  {
    id: "seasonal-q1-tech",
    name: "Q1 Tech Hiring Campaign",
    description: "Optimized for January-March tech recruitment with post-holiday hiring surge",
    category: "seasonal",
    defaultCampaigns: [
      {
        name: "New Year Tech Talent Drive",
        durationDays: 30,
        estimatedRecipients: 500,
        costPerRecipient: 50, // SAR 0.50
        expectedResponseRate: 800, // 8%
        expectedConversionRate: 2500, // 25%
      },
      {
        name: "Mid-Q1 Follow-up Campaign",
        durationDays: 30,
        estimatedRecipients: 300,
        costPerRecipient: 40,
        expectedResponseRate: 600,
        expectedConversionRate: 2000,
      },
      {
        name: "Q1 Closing Sprint",
        durationDays: 30,
        estimatedRecipients: 200,
        costPerRecipient: 60,
        expectedResponseRate: 1000,
        expectedConversionRate: 3000,
      },
    ],
    totalEstimatedCost: 49000, // SAR 490
    estimatedROI: 350,
    recommendedFor: ["Tech companies", "Startups", "IT departments"],
    tags: ["seasonal", "tech", "q1", "high-volume"],
  },
  {
    id: "seasonal-q2-sales",
    name: "Q2 Sales Team Expansion",
    description: "April-June sales hiring aligned with mid-year business growth",
    category: "seasonal",
    defaultCampaigns: [
      {
        name: "Spring Sales Recruitment",
        durationDays: 45,
        estimatedRecipients: 400,
        costPerRecipient: 45,
        expectedResponseRate: 700,
        expectedConversionRate: 2200,
      },
      {
        name: "Mid-Year Sales Push",
        durationDays: 45,
        estimatedRecipients: 300,
        costPerRecipient: 50,
        expectedResponseRate: 750,
        expectedConversionRate: 2500,
      },
    ],
    totalEstimatedCost: 33000,
    estimatedROI: 280,
    recommendedFor: ["Sales organizations", "Retail", "E-commerce"],
    tags: ["seasonal", "sales", "q2", "mid-year"],
  },
  {
    id: "seasonal-q3-education",
    name: "Q3 Academic Hiring (Back to School)",
    description: "July-September recruitment for educational institutions",
    category: "seasonal",
    defaultCampaigns: [
      {
        name: "Summer Teacher Recruitment",
        durationDays: 60,
        estimatedRecipients: 600,
        costPerRecipient: 35,
        expectedResponseRate: 900,
        expectedConversionRate: 3000,
      },
      {
        name: "Late Summer Administrative Staff",
        durationDays: 30,
        estimatedRecipients: 200,
        costPerRecipient: 40,
        expectedResponseRate: 800,
        expectedConversionRate: 2500,
      },
    ],
    totalEstimatedCost: 29000,
    estimatedROI: 320,
    recommendedFor: ["Schools", "Universities", "Training centers"],
    tags: ["seasonal", "education", "q3", "academic"],
  },
  {
    id: "seasonal-q4-retail",
    name: "Q4 Holiday Season Staffing",
    description: "October-December seasonal hiring for holiday rush",
    category: "seasonal",
    defaultCampaigns: [
      {
        name: "Pre-Holiday Hiring Blitz",
        durationDays: 30,
        estimatedRecipients: 800,
        costPerRecipient: 30,
        expectedResponseRate: 1200,
        expectedConversionRate: 3500,
      },
      {
        name: "Peak Season Reinforcement",
        durationDays: 30,
        estimatedRecipients: 400,
        costPerRecipient: 35,
        expectedResponseRate: 1000,
        expectedConversionRate: 3000,
      },
      {
        name: "Post-Holiday Retention Campaign",
        durationDays: 30,
        estimatedRecipients: 200,
        costPerRecipient: 40,
        expectedResponseRate: 700,
        expectedConversionRate: 2500,
      },
    ],
    totalEstimatedCost: 46000,
    estimatedROI: 250,
    recommendedFor: ["Retail", "Hospitality", "Logistics"],
    tags: ["seasonal", "retail", "q4", "holiday", "high-volume"],
  },

  // Urgent Recruitment Templates
  {
    id: "urgent-executive",
    name: "Urgent Executive Search",
    description: "Fast-track recruitment for C-level and senior leadership positions",
    category: "urgent",
    defaultCampaigns: [
      {
        name: "Executive Headhunting Sprint",
        durationDays: 14,
        estimatedRecipients: 100,
        costPerRecipient: 200, // Premium cost for executive search
        expectedResponseRate: 1500, // 15%
        expectedConversionRate: 4000, // 40%
      },
      {
        name: "Executive Follow-up & Closing",
        durationDays: 14,
        estimatedRecipients: 50,
        costPerRecipient: 150,
        expectedResponseRate: 2000,
        expectedConversionRate: 5000,
      },
    ],
    totalEstimatedCost: 27500,
    estimatedROI: 450,
    recommendedFor: ["Enterprises", "Startups", "Growth companies"],
    tags: ["urgent", "executive", "premium", "fast-track"],
  },
  {
    id: "urgent-critical-role",
    name: "Critical Role Emergency Hire",
    description: "Immediate hiring for business-critical positions (7-14 day timeline)",
    category: "urgent",
    defaultCampaigns: [
      {
        name: "Emergency Talent Acquisition",
        durationDays: 7,
        estimatedRecipients: 200,
        costPerRecipient: 100,
        expectedResponseRate: 1200,
        expectedConversionRate: 3500,
      },
      {
        name: "Rapid Screening & Closing",
        durationDays: 7,
        estimatedRecipients: 100,
        costPerRecipient: 120,
        expectedResponseRate: 1500,
        expectedConversionRate: 4000,
      },
    ],
    totalEstimatedCost: 32000,
    estimatedROI: 380,
    recommendedFor: ["All industries", "Critical roles", "Emergency hiring"],
    tags: ["urgent", "critical", "emergency", "fast"],
  },

  // Bulk Hiring Templates
  {
    id: "bulk-call-center",
    name: "Bulk Call Center Staffing",
    description: "High-volume recruitment for customer service and call center roles",
    category: "bulk",
    defaultCampaigns: [
      {
        name: "Mass Call Center Recruitment - Wave 1",
        durationDays: 30,
        estimatedRecipients: 2000,
        costPerRecipient: 20,
        expectedResponseRate: 1500,
        expectedConversionRate: 4000,
      },
      {
        name: "Mass Call Center Recruitment - Wave 2",
        durationDays: 30,
        estimatedRecipients: 1500,
        costPerRecipient: 20,
        expectedResponseRate: 1400,
        expectedConversionRate: 3800,
      },
      {
        name: "Final Wave & Backfill",
        durationDays: 30,
        estimatedRecipients: 1000,
        costPerRecipient: 25,
        expectedResponseRate: 1300,
        expectedConversionRate: 3500,
      },
    ],
    totalEstimatedCost: 95000,
    estimatedROI: 200,
    recommendedFor: ["Call centers", "BPO", "Customer service"],
    tags: ["bulk", "high-volume", "call-center", "customer-service"],
  },
  {
    id: "bulk-warehouse",
    name: "Bulk Warehouse & Logistics",
    description: "Mass hiring for warehouse, delivery, and logistics operations",
    category: "bulk",
    defaultCampaigns: [
      {
        name: "Warehouse Staff Mass Hiring",
        durationDays: 45,
        estimatedRecipients: 1500,
        costPerRecipient: 25,
        expectedResponseRate: 1600,
        expectedConversionRate: 4500,
      },
      {
        name: "Delivery Driver Recruitment",
        durationDays: 30,
        estimatedRecipients: 800,
        costPerRecipient: 30,
        expectedResponseRate: 1400,
        expectedConversionRate: 4000,
      },
      {
        name: "Logistics Support Hiring",
        durationDays: 30,
        estimatedRecipients: 500,
        costPerRecipient: 28,
        expectedResponseRate: 1200,
        expectedConversionRate: 3500,
      },
    ],
    totalEstimatedCost: 75500,
    estimatedROI: 220,
    recommendedFor: ["Logistics", "E-commerce", "Warehousing"],
    tags: ["bulk", "warehouse", "logistics", "delivery"],
  },
  {
    id: "bulk-hospitality",
    name: "Bulk Hospitality Staffing",
    description: "Large-scale hiring for hotels, restaurants, and events",
    category: "bulk",
    defaultCampaigns: [
      {
        name: "Hospitality Mass Recruitment",
        durationDays: 30,
        estimatedRecipients: 1200,
        costPerRecipient: 22,
        expectedResponseRate: 1400,
        expectedConversionRate: 4200,
      },
      {
        name: "Event Staff Hiring",
        durationDays: 20,
        estimatedRecipients: 600,
        costPerRecipient: 25,
        expectedResponseRate: 1300,
        expectedConversionRate: 4000,
      },
    ],
    totalEstimatedCost: 41400,
    estimatedROI: 240,
    recommendedFor: ["Hotels", "Restaurants", "Event management"],
    tags: ["bulk", "hospitality", "events", "service"],
  },
];

export const budgetTemplatesRouter = router({
  /**
   * Get all available budget templates
   */
  getAllTemplates: protectedProcedure
    .input(z.object({
      category: z.enum(['seasonal', 'urgent', 'bulk', 'custom']).optional(),
    }))
    .query(async ({ input }) => {
      let templates = BUDGET_TEMPLATES;

      if (input.category) {
        templates = templates.filter(t => t.category === input.category);
      }

      return templates;
    }),

  /**
   * Get template by ID
   */
  getTemplateById: protectedProcedure
    .input(z.object({
      templateId: z.string(),
    }))
    .query(async ({ input }) => {
      const template = BUDGET_TEMPLATES.find(t => t.id === input.templateId);

      if (!template) {
        throw new Error("Template not found");
      }

      return template;
    }),

  /**
   * Apply template to create a new budget scenario
   */
  applyTemplate: protectedProcedure
    .input(z.object({
      templateId: z.string(),
      scenarioName: z.string(),
      customizations: z.object({
        startDate: z.string().optional(),
        adjustRecipients: z.number().optional(), // Multiplier (e.g., 1.5 for 50% more)
        adjustBudget: z.number().optional(), // Multiplier
      }).optional(),
    }))
    .mutation(async ({ input }) => {
      const template = BUDGET_TEMPLATES.find(t => t.id === input.templateId);

      if (!template) {
        throw new Error("Template not found");
      }

      const recipientMultiplier = input.customizations?.adjustRecipients || 1;
      const budgetMultiplier = input.customizations?.adjustBudget || 1;

      // Calculate start date
      const startDate = input.customizations?.startDate 
        ? new Date(input.customizations.startDate)
        : new Date();

      // Generate campaigns with customizations
      const campaigns = template.defaultCampaigns.map((campaign, index) => {
        const campaignStartDate = new Date(startDate);
        campaignStartDate.setDate(startDate.getDate() + (index * campaign.durationDays));

        const campaignEndDate = new Date(campaignStartDate);
        campaignEndDate.setDate(campaignStartDate.getDate() + campaign.durationDays);

        return {
          name: campaign.name,
          startDate: campaignStartDate.toISOString(),
          endDate: campaignEndDate.toISOString(),
          estimatedRecipients: Math.round(campaign.estimatedRecipients * recipientMultiplier),
          costPerRecipient: Math.round(campaign.costPerRecipient * budgetMultiplier),
          expectedResponseRate: campaign.expectedResponseRate,
          expectedConversionRate: campaign.expectedConversionRate,
        };
      });

      return {
        templateId: template.id,
        templateName: template.name,
        scenarioName: input.scenarioName,
        description: template.description,
        campaigns,
        estimatedTotalCost: Math.round(template.totalEstimatedCost * recipientMultiplier * budgetMultiplier),
        estimatedROI: template.estimatedROI,
      };
    }),

  /**
   * Compare multiple templates
   */
  compareTemplates: protectedProcedure
    .input(z.object({
      templateIds: z.array(z.string()),
    }))
    .query(async ({ input }) => {
      const templates = BUDGET_TEMPLATES.filter(t => input.templateIds.includes(t.id));

      if (templates.length === 0) {
        throw new Error("No templates found");
      }

      return templates.map(template => ({
        id: template.id,
        name: template.name,
        category: template.category,
        totalCost: template.totalEstimatedCost,
        estimatedROI: template.estimatedROI,
        campaignCount: template.defaultCampaigns.length,
        totalRecipients: template.defaultCampaigns.reduce((sum, c) => sum + c.estimatedRecipients, 0),
        avgCostPerRecipient: Math.round(
          template.totalEstimatedCost / 
          template.defaultCampaigns.reduce((sum, c) => sum + c.estimatedRecipients, 0)
        ),
        recommendedFor: template.recommendedFor,
        tags: template.tags,
      }));
    }),

  /**
   * Search templates by tags or keywords
   */
  searchTemplates: protectedProcedure
    .input(z.object({
      query: z.string(),
    }))
    .query(async ({ input }) => {
      const query = input.query.toLowerCase();

      const results = BUDGET_TEMPLATES.filter(template => {
        return (
          template.name.toLowerCase().includes(query) ||
          template.description.toLowerCase().includes(query) ||
          template.tags.some(tag => tag.toLowerCase().includes(query)) ||
          template.recommendedFor.some(rec => rec.toLowerCase().includes(query))
        );
      });

      return results;
    }),

  /**
   * Save a budget scenario as a custom template
   */
  saveAsTemplate: protectedProcedure
    .input(z.object({
      scenarioId: z.number(),
      templateName: z.string().min(1).max(255),
      description: z.string().optional(),
      isPublic: z.boolean().default(false),
      category: z.enum(['seasonal', 'urgent', 'bulk', 'custom']).default('custom'),
      tags: z.array(z.string()).default([]),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get the source scenario
      const scenarios = await db
        .select()
        .from(budgetScenarios)
        .where(eq(budgetScenarios.id, input.scenarioId))
        .limit(1);

      if (scenarios.length === 0) {
        throw new Error("Scenario not found");
      }

      const scenario = scenarios[0];

      // Create template data from scenario
      const templateData = {
        category: input.category,
        scenarioName: scenario.scenarioName,
        description: input.description || scenario.description,
        totalBudget: scenario.totalBudget,
        duration: scenario.duration,
        campaigns: scenario.campaigns,
        expectedROI: scenario.expectedROI,
        tags: input.tags,
        sourceScenarioId: input.scenarioId,
        createdFrom: 'scenario',
      };

      // Save as custom template
      const result = await db.insert(customTemplates).values({
        name: input.templateName,
        description: input.description || scenario.description || null,
        scenarioType: 'budget',
        createdBy: ctx.user.id,
        isPublic: input.isPublic ? 1 : 0,
        templateData: JSON.stringify(templateData),
      });

      return {
        success: true,
        templateId: Number(result.insertId),
        templateName: input.templateName,
      };
    }),

  /**
   * Get all custom templates (user's own + public)
   */
  getCustomTemplates: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const templates = await db
        .select()
        .from(customTemplates)
        .where(
          and(
            eq(customTemplates.scenarioType, 'budget')
          )
        )
        .orderBy(desc(customTemplates.createdAt));

      // Filter to show user's own templates + public templates
      const filtered = templates.filter(
        t => t.createdBy === ctx.user.id || t.isPublic === 1
      );

      return filtered.map(t => ({
        ...t,
        templateData: typeof t.templateData === 'string' 
          ? JSON.parse(t.templateData) 
          : t.templateData,
        isOwner: t.createdBy === ctx.user.id,
      }));
    }),

  /**
   * Get a specific custom template
   */
  getCustomTemplate: protectedProcedure
    .input(z.object({ templateId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const templates = await db
        .select()
        .from(customTemplates)
        .where(eq(customTemplates.id, input.templateId))
        .limit(1);

      if (templates.length === 0) {
        throw new Error("Template not found");
      }

      const template = templates[0];

      // Check access permissions
      if (template.createdBy !== ctx.user.id && template.isPublic !== 1) {
        throw new Error("Access denied");
      }

      return {
        ...template,
        templateData: typeof template.templateData === 'string'
          ? JSON.parse(template.templateData)
          : template.templateData,
        isOwner: template.createdBy === ctx.user.id,
      };
    }),

  /**
   * Update a custom template
   */
  updateCustomTemplate: protectedProcedure
    .input(z.object({
      templateId: z.number(),
      name: z.string().min(1).max(255).optional(),
      description: z.string().optional(),
      isPublic: z.boolean().optional(),
      tags: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify ownership
      const templates = await db
        .select()
        .from(customTemplates)
        .where(eq(customTemplates.id, input.templateId))
        .limit(1);

      if (templates.length === 0) {
        throw new Error("Template not found");
      }

      if (templates[0].createdBy !== ctx.user.id) {
        throw new Error("Access denied - you can only edit your own templates");
      }

      const updates: any = {};
      if (input.name) updates.name = input.name;
      if (input.description !== undefined) updates.description = input.description;
      if (input.isPublic !== undefined) updates.isPublic = input.isPublic ? 1 : 0;

      // Update tags in templateData if provided
      if (input.tags) {
        const currentData = typeof templates[0].templateData === 'string'
          ? JSON.parse(templates[0].templateData)
          : templates[0].templateData;
        
        currentData.tags = input.tags;
        updates.templateData = JSON.stringify(currentData);
      }

      await db
        .update(customTemplates)
        .set(updates)
        .where(eq(customTemplates.id, input.templateId));

      return { success: true };
    }),

  /**
   * Delete a custom template
   */
  deleteCustomTemplate: protectedProcedure
    .input(z.object({ templateId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify ownership
      const templates = await db
        .select()
        .from(customTemplates)
        .where(eq(customTemplates.id, input.templateId))
        .limit(1);

      if (templates.length === 0) {
        throw new Error("Template not found");
      }

      if (templates[0].createdBy !== ctx.user.id) {
        throw new Error("Access denied - you can only delete your own templates");
      }

      await db
        .delete(customTemplates)
        .where(eq(customTemplates.id, input.templateId));

      return { success: true };
    }),

  /**
   * Apply a custom template to create a new scenario
   */
  applyCustomTemplate: protectedProcedure
    .input(z.object({
      templateId: z.number(),
      scenarioName: z.string().min(1),
      budgetMultiplier: z.number().min(0.1).max(10).default(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get template
      const templates = await db
        .select()
        .from(customTemplates)
        .where(eq(customTemplates.id, input.templateId))
        .limit(1);

      if (templates.length === 0) {
        throw new Error("Template not found");
      }

      const template = templates[0];

      // Check access
      if (template.createdBy !== ctx.user.id && template.isPublic !== 1) {
        throw new Error("Access denied");
      }

      const templateData = typeof template.templateData === 'string'
        ? JSON.parse(template.templateData)
        : template.templateData;

      // Create new scenario from template
      const newScenario = {
        scenarioName: input.scenarioName,
        description: `Created from template: ${template.name}`,
        totalBudget: Math.round((templateData.totalBudget || 0) * input.budgetMultiplier),
        duration: templateData.duration || 30,
        campaigns: templateData.campaigns,
        expectedROI: templateData.expectedROI || 0,
        status: 'draft' as const,
        createdBy: ctx.user.id,
      };

      const result = await db.insert(budgetScenarios).values({
        ...newScenario,
        campaigns: JSON.stringify(newScenario.campaigns),
      });

      return {
        success: true,
        scenarioId: Number(result.insertId),
        scenarioName: input.scenarioName,
        templateName: template.name,
      };
    }),

  /**
   * Get template usage analytics
   */
  getTemplateAnalytics: protectedProcedure
    .input(z.object({ templateId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get template
      const templates = await db
        .select()
        .from(customTemplates)
        .where(eq(customTemplates.id, input.templateId))
        .limit(1);

      if (templates.length === 0) {
        throw new Error("Template not found");
      }

      const template = templates[0];

      // Check access
      if (template.createdBy !== ctx.user.id && template.isPublic !== 1) {
        throw new Error("Access denied");
      }

      // Count scenarios created from this template
      // (This is a simplified version - in production you'd track this more explicitly)
      const allScenarios = await db
        .select()
        .from(budgetScenarios)
        .where(eq(budgetScenarios.createdBy, ctx.user.id));

      const usageCount = allScenarios.filter(
        s => s.description?.includes(`template: ${template.name}`)
      ).length;

      return {
        templateId: template.id,
        templateName: template.name,
        usageCount,
        createdAt: template.createdAt,
        isPublic: template.isPublic === 1,
      };
    }),
});
