import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import {
  createBroadcastCampaign,
  getAllBroadcastCampaigns,
  getBroadcastCampaign,
  updateBroadcastCampaignStatus,
  createEmailWorkflow,
  getAllEmailWorkflows,
  getEmailWorkflow,
  updateEmailWorkflow,
  getActiveWorkflowsByTrigger,
  createWorkflowExecution,
  createABTest,
  getAllABTests,
  getABTest,
  updateABTest,
  createABTestVariant,
  getABTestVariants,
  updateABTestVariant,
  getABTestResult,
  createABTestResult,
  getCandidatesBySegment,
} from "./communicationDb";
import { sendGmailEmail } from "./gmailService";

export const communicationRouter = router({
  // ===== Bulk Broadcast =====
  
  createBroadcast: protectedProcedure
    .input(z.object({
      name: z.string(),
      subject: z.string(),
      body: z.string(),
      senderName: z.string().optional(),
      senderEmail: z.string().optional(),
      segmentType: z.enum(['all', 'filtered', 'custom']).default('all'),
      segmentFilter: z.any().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const campaignId = await createBroadcastCampaign({
        ...input,
        createdBy: ctx.user.id,
        status: 'draft',
      });
      
      return { success: true, campaignId };
    }),
  
  getBroadcastCampaigns: protectedProcedure
    .query(async ({ ctx }) => {
      const campaigns = await getAllBroadcastCampaigns(ctx.user.id);
      return campaigns;
    }),
  
  getBroadcastCampaign: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const campaign = await getBroadcastCampaign(input.id);
      return campaign;
    }),
  
  sendBroadcast: protectedProcedure
    .input(z.object({ campaignId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const campaign = await getBroadcastCampaign(input.campaignId);
      if (!campaign) {
        throw new Error("Campaign not found");
      }
      
      // Get candidates based on segment
      const candidates = await getCandidatesBySegment(campaign.segmentFilter);
      
      // Update campaign status to sending
      await updateBroadcastCampaignStatus(input.campaignId, 'sending', {
        totalRecipients: candidates.length,
      });
      
      let sentCount = 0;
      let failedCount = 0;
      
      // Send emails to all candidates
      for (const candidate of candidates) {
        if (!candidate.email) {
          failedCount++;
          continue;
        }
        
        try {
          await sendGmailEmail({
            to: candidate.email,
            subject: campaign.subject,
            body: campaign.body
              .replace(/\{\{name\}\}/g, candidate.name || 'Candidate')
              .replace(/\{\{email\}\}/g, candidate.email),
          });
          sentCount++;
        } catch (error) {
          console.error(`Failed to send email to ${candidate.email}:`, error);
          failedCount++;
        }
      }
      
      // Update campaign with final stats
      await updateBroadcastCampaignStatus(input.campaignId, 'sent', {
        sentCount,
        failedCount,
        sentAt: new Date().toISOString(),
      });
      
      return {
        success: true,
        totalRecipients: candidates.length,
        sentCount,
        failedCount,
      };
    }),
  
  // ===== Email Automation =====
  
  createWorkflow: protectedProcedure
    .input(z.object({
      name: z.string(),
      description: z.string().optional(),
      triggerEvent: z.enum(['candidate_applied', 'interview_scheduled', 'interview_completed', 'offer_sent', 'candidate_rejected', 'manual']),
      triggerConditions: z.any().optional(),
      emailSubject: z.string(),
      emailBody: z.string(),
      delayMinutes: z.number().default(0),
      isActive: z.boolean().default(true),
    }))
    .mutation(async ({ input, ctx }) => {
      const workflowId = await createEmailWorkflow({
        ...input,
        isActive: input.isActive ? 1 : 0,
        createdBy: ctx.user.id,
      });
      
      return { success: true, workflowId };
    }),
  
  getWorkflows: protectedProcedure
    .query(async ({ ctx }) => {
      const workflows = await getAllEmailWorkflows(ctx.user.id);
      return workflows;
    }),
  
  getWorkflow: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const workflow = await getEmailWorkflow(input.id);
      return workflow;
    }),
  
  updateWorkflow: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      description: z.string().optional(),
      emailSubject: z.string().optional(),
      emailBody: z.string().optional(),
      delayMinutes: z.number().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...updates } = input;
      const updateData: any = { ...updates };
      
      if (updates.isActive !== undefined) {
        updateData.isActive = updates.isActive ? 1 : 0;
      }
      
      await updateEmailWorkflow(id, updateData);
      return { success: true };
    }),
  
  triggerWorkflow: protectedProcedure
    .input(z.object({
      triggerEvent: z.string(),
      candidateId: z.number(),
      triggerData: z.any().optional(),
    }))
    .mutation(async ({ input }) => {
      const workflows = await getActiveWorkflowsByTrigger(input.triggerEvent);
      
      const executionIds: number[] = [];
      
      for (const workflow of workflows) {
        const scheduledFor = new Date();
        scheduledFor.setMinutes(scheduledFor.getMinutes() + workflow.delayMinutes);
        
        const executionId = await createWorkflowExecution({
          workflowId: workflow.id,
          candidateId: input.candidateId,
          triggerData: input.triggerData,
          status: 'pending',
          scheduledFor: scheduledFor.toISOString(),
        });
        
        executionIds.push(executionId);
      }
      
      return { success: true, executionIds };
    }),
  
  // ===== A/B Testing =====
  
  createABTest: protectedProcedure
    .input(z.object({
      name: z.string(),
      description: z.string().optional(),
      testType: z.enum(['email_subject', 'email_body', 'send_time', 'sender_name']),
      targetAudience: z.any().optional(),
      sampleSize: z.number(),
      confidenceLevel: z.number().default(95),
      variants: z.array(z.object({
        variantName: z.string(),
        emailSubject: z.string().optional(),
        emailBody: z.string().optional(),
        senderName: z.string().optional(),
        sendTime: z.string().optional(),
      })),
    }))
    .mutation(async ({ input, ctx }) => {
      const { variants, ...testData } = input;
      
      const testId = await createABTest({
        ...testData,
        createdBy: ctx.user.id,
        status: 'draft',
      });
      
      // Create variants
      for (const variant of variants) {
        await createABTestVariant({
          testId,
          ...variant,
        });
      }
      
      return { success: true, testId };
    }),
  
  getABTests: protectedProcedure
    .query(async ({ ctx }) => {
      const tests = await getAllABTests(ctx.user.id);
      return tests;
    }),
  
  getABTest: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const test = await getABTest(input.id);
      const variants = await getABTestVariants(input.id);
      const result = await getABTestResult(input.id);
      
      return { test, variants, result };
    }),
  
  sendABTest: protectedProcedure
    .input(z.object({ testId: z.number() }))
    .mutation(async ({ input }) => {
      const test = await getABTest(input.testId);
      if (!test) {
        throw new Error("Test not found");
      }
      
      const variants = await getABTestVariants(input.testId);
      if (variants.length === 0) {
        throw new Error("No variants found for this test");
      }
      
      // Get candidates based on target audience
      const allCandidates = await getCandidatesBySegment(test.targetAudience);
      const candidates = allCandidates.slice(0, test.sampleSize);
      
      // Split candidates evenly among variants
      const candidatesPerVariant = Math.floor(candidates.length / variants.length);
      
      // Update test status
      await updateABTest(input.testId, {
        status: 'running',
        startedAt: new Date().toISOString(),
      });
      
      let currentIndex = 0;
      for (const variant of variants) {
        const variantCandidates = candidates.slice(currentIndex, currentIndex + candidatesPerVariant);
        currentIndex += candidatesPerVariant;
        
        let sentCount = 0;
        for (const candidate of variantCandidates) {
          if (!candidate.email) continue;
          
          try {
            await sendGmailEmail({
              to: candidate.email,
              subject: variant.emailSubject || test.name,
              body: variant.emailBody || `Test variant: ${variant.variantName}`,
            });
            sentCount++;
          } catch (error) {
            console.error(`Failed to send test email to ${candidate.email}:`, error);
          }
        }
        
        await updateABTestVariant(variant.id, {
          recipientCount: variantCandidates.length,
          sentCount,
        });
      }
      
      return { success: true, totalSent: currentIndex };
    }),
  
  analyzeABTest: protectedProcedure
    .input(z.object({ testId: z.number() }))
    .mutation(async ({ input }) => {
      const variants = await getABTestVariants(input.testId);
      
      if (variants.length < 2) {
        throw new Error("Need at least 2 variants to analyze");
      }
      
      // Calculate rates for each variant
      for (const variant of variants) {
        const openRate = variant.sentCount > 0 
          ? Math.round((variant.openedCount / variant.sentCount) * 10000) 
          : 0;
        const clickRate = variant.sentCount > 0 
          ? Math.round((variant.clickedCount / variant.sentCount) * 10000) 
          : 0;
        const conversionRate = variant.sentCount > 0 
          ? Math.round((variant.conversionCount / variant.sentCount) * 10000) 
          : 0;
        
        await updateABTestVariant(variant.id, {
          openRate,
          clickRate,
          conversionRate,
        });
      }
      
      // Find winner (highest conversion rate)
      const updatedVariants = await getABTestVariants(input.testId);
      const winner = updatedVariants.reduce((prev, current) => 
        (current.conversionRate > prev.conversionRate) ? current : prev
      );
      
      const loser = updatedVariants.find(v => v.id !== winner.id);
      const relativeImprovement = loser && loser.conversionRate > 0
        ? Math.round(((winner.conversionRate - loser.conversionRate) / loser.conversionRate) * 10000)
        : 0;
      
      // Create or update result
      const existingResult = await getABTestResult(input.testId);
      if (existingResult) {
        await updateABTestResult(input.testId, {
          winnerVariantId: winner.id,
          relativeImprovement,
          recommendation: `Variant ${winner.variantName} performed best with ${(winner.conversionRate / 100).toFixed(2)}% conversion rate.`,
          analysisCompletedAt: new Date().toISOString(),
        });
      } else {
        await createABTestResult({
          testId: input.testId,
          winnerVariantId: winner.id,
          relativeImprovement,
          recommendation: `Variant ${winner.variantName} performed best with ${(winner.conversionRate / 100).toFixed(2)}% conversion rate.`,
          analysisCompletedAt: new Date().toISOString(),
        });
      }
      
      // Update test status
      await updateABTest(input.testId, {
        status: 'completed',
        completedAt: new Date().toISOString(),
      });
      
      return { success: true, winnerId: winner.id };
    }),
});
