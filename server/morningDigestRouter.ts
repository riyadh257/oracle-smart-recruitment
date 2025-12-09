import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { matchDigestPreferences, digestDeliveryLog, matchHistory, candidates, jobs, users } from "../drizzle/schema";
import { eq, desc, and, gte, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { sendEmail } from "./emailDelivery";

/**
 * Morning Digest Router
 * Automated email system for daily summaries of top matches from overnight bulk processing
 */

export const morningDigestRouter = router({
  /**
   * Get current user's digest preferences
   */
  getPreferences: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [prefs] = await db
        .select()
        .from(matchDigestPreferences)
        .where(eq(matchDigestPreferences.userId, ctx.user.id))
        .limit(1);

      // Return default preferences if none exist
      if (!prefs) {
        return {
          enabled: true,
          frequency: "daily" as const,
          deliveryTime: "08:00",
          minMatchScore: 70,
          maxMatchesPerDigest: 10,
          includeNewCandidates: true,
          includeScoreChanges: true,
          includeSavedMatches: true,
          jobFilters: null,
        };
      }

      return prefs;
    }),

  /**
   * Update digest preferences
   */
  updatePreferences: protectedProcedure
    .input(z.object({
      enabled: z.boolean().optional(),
      frequency: z.enum(["daily", "weekly", "biweekly"]).optional(),
      deliveryTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
      minMatchScore: z.number().min(0).max(100).optional(),
      maxMatchesPerDigest: z.number().min(1).max(50).optional(),
      includeNewCandidates: z.boolean().optional(),
      includeScoreChanges: z.boolean().optional(),
      includeSavedMatches: z.boolean().optional(),
      jobFilters: z.array(z.number()).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Check if preferences exist
      const [existing] = await db
        .select()
        .from(matchDigestPreferences)
        .where(eq(matchDigestPreferences.userId, ctx.user.id))
        .limit(1);

      if (existing) {
        // Update existing preferences
        await db
          .update(matchDigestPreferences)
          .set({
            ...input,
            updatedAt: new Date(),
          })
          .where(eq(matchDigestPreferences.userId, ctx.user.id));
      } else {
        // Create new preferences
        await db
          .insert(matchDigestPreferences)
          .values({
            userId: ctx.user.id,
            ...input,
          });
      }

      return { success: true };
    }),

  /**
   * Get recent digest delivery history
   */
  getDeliveryHistory: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(20),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const history = await db
        .select()
        .from(digestDeliveryLog)
        .where(eq(digestDeliveryLog.userId, ctx.user.id))
        .orderBy(desc(digestDeliveryLog.createdAt))
        .limit(input.limit);

      return history;
    }),

  /**
   * Generate and preview digest content without sending
   */
  previewDigest: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Get user preferences
      const [prefs] = await db
        .select()
        .from(matchDigestPreferences)
        .where(eq(matchDigestPreferences.userId, ctx.user.id))
        .limit(1);

      const minScore = prefs?.minMatchScore || 70;
      const maxMatches = prefs?.maxMatchesPerDigest || 10;

      // Get recent high-quality matches
      const recentMatches = await db
        .select({
          id: matchHistory.id,
          candidateId: matchHistory.candidateId,
          jobId: matchHistory.jobId,
          overallScore: matchHistory.overallScore,
          createdAt: matchHistory.createdAt,
          candidate: {
            fullName: candidates.fullName,
            email: candidates.email,
            headline: candidates.headline,
          },
          job: {
            title: jobs.title,
            location: jobs.location,
            employmentType: jobs.employmentType,
          },
        })
        .from(matchHistory)
        .leftJoin(candidates, eq(matchHistory.candidateId, candidates.id))
        .leftJoin(jobs, eq(matchHistory.jobId, jobs.id))
        .where(gte(matchHistory.overallScore, minScore))
        .orderBy(desc(matchHistory.createdAt))
        .limit(maxMatches);

      return {
        matches: recentMatches,
        totalCount: recentMatches.length,
        highQualityCount: recentMatches.filter(m => (m.overallScore || 0) >= 80).length,
      };
    }),

  /**
   * Manually send digest email now (for testing)
   */
  sendNow: protectedProcedure
    .mutation(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Get user preferences
      const [prefs] = await db
        .select()
        .from(matchDigestPreferences)
        .where(eq(matchDigestPreferences.userId, ctx.user.id))
        .limit(1);

      if (!prefs?.enabled) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Digest emails are disabled" });
      }

      const minScore = prefs.minMatchScore || 70;
      const maxMatches = prefs.maxMatchesPerDigest || 10;

      // Get recent matches
      const recentMatches = await db
        .select({
          id: matchHistory.id,
          candidateId: matchHistory.candidateId,
          jobId: matchHistory.jobId,
          overallScore: matchHistory.overallScore,
          createdAt: matchHistory.createdAt,
          candidate: {
            fullName: candidates.fullName,
            email: candidates.email,
            headline: candidates.headline,
          },
          job: {
            title: jobs.title,
            location: jobs.location,
            employmentType: jobs.employmentType,
          },
        })
        .from(matchHistory)
        .leftJoin(candidates, eq(matchHistory.candidateId, candidates.id))
        .leftJoin(jobs, eq(matchHistory.jobId, jobs.id))
        .where(gte(matchHistory.overallScore, minScore))
        .orderBy(desc(matchHistory.createdAt))
        .limit(maxMatches);

      if (recentMatches.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "No matches found for digest" });
      }

      // Generate tracking ID
      const trackingId = `digest_${ctx.user.id}_${Date.now()}`;

      // Build email content
      const emailHtml = generateDigestEmailHtml(recentMatches, trackingId);

      // Send email
      await sendEmail({
        to: ctx.user.email || "",
        subject: `Your Daily Recruitment Digest - ${recentMatches.length} Top Matches`,
        html: emailHtml,
      });

      // Log delivery
      const [log] = await db
        .insert(digestDeliveryLog)
        .values({
          userId: ctx.user.id,
          digestType: prefs.frequency,
          matchCount: recentMatches.length,
          highQualityMatchCount: recentMatches.filter(m => (m.overallScore || 0) >= 80).length,
          newCandidateCount: recentMatches.length,
          emailSent: true,
          trackingId,
        })
        .$returningId();

      // Update last sent timestamp
      await db
        .update(matchDigestPreferences)
        .set({ lastSentAt: new Date() })
        .where(eq(matchDigestPreferences.userId, ctx.user.id));

      return { success: true, matchCount: recentMatches.length };
    }),

  /**
   * Track email open event
   */
  trackOpen: protectedProcedure
    .input(z.object({
      trackingId: z.string(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      await db
        .update(digestDeliveryLog)
        .set({ emailOpenedAt: new Date() })
        .where(eq(digestDeliveryLog.trackingId, input.trackingId));

      return { success: true };
    }),

  /**
   * Track email click event
   */
  trackClick: protectedProcedure
    .input(z.object({
      trackingId: z.string(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      await db
        .update(digestDeliveryLog)
        .set({ emailClickedAt: new Date() })
        .where(eq(digestDeliveryLog.trackingId, input.trackingId));

      return { success: true };
    }),
});

/**
 * Generate HTML email content for digest
 */
function generateDigestEmailHtml(matches: any[], trackingId: string): string {
  const matchesHtml = matches.map((match, index) => `
    <div style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 16px; margin-bottom: 16px; background: white;">
      <h3 style="margin: 0 0 8px 0; color: #1a1a1a;">
        ${match.candidate?.fullName || "Unknown Candidate"}
      </h3>
      <p style="margin: 0 0 8px 0; color: #666; font-size: 14px;">
        ${match.candidate?.headline || ""}
      </p>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 12px;">
        <div>
          <strong style="color: #1a73e8;">Match Score: ${match.overallScore}%</strong>
          <br/>
          <span style="color: #666; font-size: 13px;">
            ${match.job?.title || "Unknown Position"} • ${match.job?.location || ""}
          </span>
        </div>
        <a href="https://app.example.com/candidates/${match.candidateId}?tracking=${trackingId}" 
           style="background: #1a73e8; color: white; padding: 8px 16px; border-radius: 4px; text-decoration: none; font-size: 14px;">
          View Profile
        </a>
      </div>
    </div>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #1a73e8 0%, #4285f4 100%); padding: 32px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Your Daily Recruitment Digest</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 16px;">
            ${matches.length} top candidate matches found
          </p>
        </div>
        
        <div style="padding: 24px;">
          <p style="color: #666; font-size: 15px; line-height: 1.6;">
            Good morning! Here are your top candidate matches from overnight processing:
          </p>
          
          ${matchesHtml}
          
          <div style="text-align: center; margin-top: 24px; padding-top: 24px; border-top: 1px solid #e0e0e0;">
            <a href="https://app.example.com/matches?tracking=${trackingId}" 
               style="background: #34a853; color: white; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-size: 16px; display: inline-block;">
              View All Matches
            </a>
          </div>
        </div>
        
        <div style="background: #f9f9f9; padding: 16px; text-align: center; font-size: 12px; color: #999;">
          <p style="margin: 0;">
            Oracle Smart Recruitment System<br/>
            <a href="https://app.example.com/settings/digest" style="color: #1a73e8; text-decoration: none;">
              Manage your digest preferences
            </a>
          </p>
        </div>
      </div>
      
      <!-- Tracking pixel -->
      <img src="https://app.example.com/api/track/open?id=${trackingId}" width="1" height="1" style="display:none;" />
    </body>
    </html>
  `;
}
