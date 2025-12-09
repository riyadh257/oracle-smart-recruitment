/**
 * Stub Routers
 * 
 * These are placeholder routers for features that are partially implemented
 * or planned but not yet fully developed. They return empty/default data
 * to prevent TypeScript errors and allow the app to load.
 */

import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";

// Template Sharing Router
export const templateSharingRouter = router({
  list: protectedProcedure.query(() => []),
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(() => null),
  create: protectedProcedure
    .input(z.object({ name: z.string(), description: z.string().optional() }))
    .mutation(() => ({ success: true, id: 0 })),
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(() => ({ success: true })),
});

// Support Router
export const supportRouter = router({
  list: protectedProcedure.query(() => []),
  create: protectedProcedure
    .input(z.object({ subject: z.string(), message: z.string() }))
    .mutation(() => ({ success: true, ticketId: 0 })),
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(() => null),
});

// Digest Enhancements Router
export const digestEnhancementsRouter = router({
  list: protectedProcedure.query(() => []),
  getSettings: protectedProcedure.query(() => ({
    enabled: false,
    frequency: 'daily',
  })),
  updateSettings: protectedProcedure
    .input(z.object({ enabled: z.boolean(), frequency: z.string() }))
    .mutation(() => ({ success: true })),
});

// CRM Router
export const crmRouter = router({
  list: protectedProcedure.query(() => []),
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(() => null),
  create: protectedProcedure
    .input(z.object({ name: z.string() }))
    .mutation(() => ({ success: true, id: 0 })),
});

// Template Gallery Router
export const templateGalleryRouter = router({
  list: publicProcedure.query(() => []),
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(() => null),
});

// Scorecard Templates Router
export const scorecardTemplatesRouter = router({
  list: protectedProcedure.query(() => []),
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(() => null),
  create: protectedProcedure
    .input(z.object({ name: z.string() }))
    .mutation(() => ({ success: true, id: 0 })),
});

// Template Editor Router
export const templateEditorRouter = router({
  list: protectedProcedure.query(() => []),
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(() => null),
  save: protectedProcedure
    .input(z.object({ id: z.number(), content: z.string() }))
    .mutation(() => ({ success: true })),
});

// Notification Priority Router
export const notificationPriorityRouter = router({
  list: protectedProcedure.query(() => []),
  update: protectedProcedure
    .input(z.object({ id: z.number(), priority: z.number() }))
    .mutation(() => ({ success: true })),
});

// Email Provider Router
export const emailProviderRouter = router({
  list: protectedProcedure.query(() => []),
  getSettings: protectedProcedure.query(() => ({
    provider: 'gmail',
    configured: false,
  })),
  updateSettings: protectedProcedure
    .input(z.object({ provider: z.string() }))
    .mutation(() => ({ success: true })),
});

// Candidate Portal Router
export const candidatePortalRouter = router({
  getProfile: protectedProcedure.query(() => null),
  updateProfile: protectedProcedure
    .input(z.object({ name: z.string().optional() }))
    .mutation(() => ({ success: true })),
});

// Enterprise Quotes Router
export const enterpriseQuotesRouter = router({
  list: protectedProcedure.query(() => []),
  create: protectedProcedure
    .input(z.object({ companyName: z.string() }))
    .mutation(() => ({ success: true, id: 0 })),
});

// Engagement Alerts System Router
export const engagementAlertsSystemRouter = router({
  list: protectedProcedure.query(() => []),
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(() => null),
});

// Digest Schedule Router
export const digestScheduleRouter = router({
  list: protectedProcedure.query(() => []),
  getSettings: protectedProcedure.query(() => ({
    enabled: false,
    time: '09:00',
  })),
});

// Template Versioning Router
export const templateVersioningRouter = router({
  list: protectedProcedure
    .input(z.object({ templateId: z.number() }))
    .query(() => []),
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(() => null),
});

// Engagement Alert Router
export const engagementAlertRouter = router({
  list: protectedProcedure.query(() => []),
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(() => null),
});

// Broadcast Router
export const broadcastRouter = router({
  list: protectedProcedure.query(() => []),
  create: protectedProcedure
    .input(z.object({ message: z.string() }))
    .mutation(() => ({ success: true, id: 0 })),
});

// Email Branding Router (if not already exists)
export const emailBrandingRouter = router({
  get: protectedProcedure.query(() => null),
  update: protectedProcedure
    .input(z.object({ logoUrl: z.string().optional() }))
    .mutation(() => ({ success: true })),
});
