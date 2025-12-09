import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getDb } from "./db";
import { employers, candidates } from "../drizzle/schema";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

/**
 * Helper to create authenticated test context
 */
function createAuthContext(userId: number = 1, role: "admin" | "user" | "employer" = "employer"): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-user-${userId}`,
    email: `test${userId}@example.com`,
    name: `Test User ${userId}`,
    loginMethod: "manus",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

/**
 * Helper to create test employer
 */
async function createTestEmployer(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const [result] = await db.insert(employers).values({
    userId,
    companyName: "Test Company",
    industry: "Technology",
    companySize: "51-200",
    description: "Test company description",
  });

  return result.insertId;
}

/**
 * Helper to create test candidate
 */
async function createTestCandidate(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  // First create the user if it doesn't exist
  const { upsertUser } = await import("./db");
  await upsertUser({
    openId: `test-candidate-${userId}`,
    name: "Test Candidate User",
    email: `candidate${userId}@example.com`,
    loginMethod: "manus",
    role: "user",
  });

  // Get the created user
  const { getUserByOpenId } = await import("./db");
  const user = await getUserByOpenId(`test-candidate-${userId}`);
  if (!user) throw new Error("Failed to create user");

  const [result] = await db.insert(candidates).values({
    userId: user.id,
    fullName: "Test Candidate",
    email: "candidate@example.com",
    phone: "+1234567890",
    location: "Riyadh",
    yearsOfExperience: 5,
    technicalSkills: ["JavaScript", "TypeScript", "React"],
    isAvailable: true,
  });

  return result.insertId;
}

describe("Communication Router - Email Analytics", () => {
  let employerId: number;
  let candidateId: number;

  beforeEach(async () => {
    const { ctx } = createAuthContext(1, "employer");
    employerId = await createTestEmployer(ctx.user!.id);
    candidateId = await createTestCandidate(2);
  });

  it("should track email event", async () => {
    const { ctx } = createAuthContext(1, "employer");
    const caller = appRouter.createCaller(ctx);

    const result = await caller.communication.emailAnalytics.trackEvent({
      eventType: "sent",
      recipientEmail: "test@example.com",
      candidateId,
      emailType: "interview_invite",
      subject: "Interview Invitation",
    });

    expect(result).toEqual({ success: true });
  });

  it("should get engagement rates by email type", async () => {
    const { ctx } = createAuthContext(1, "employer");
    const caller = appRouter.createCaller(ctx);

    // Track some events first
    await caller.communication.emailAnalytics.trackEvent({
      eventType: "sent",
      recipientEmail: "test1@example.com",
      emailType: "interview_invite",
    });

    await caller.communication.emailAnalytics.trackEvent({
      eventType: "opened",
      recipientEmail: "test1@example.com",
      emailType: "interview_invite",
    });

    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
    const endDate = new Date();

    const rates = await caller.communication.emailAnalytics.getEngagementRates({
      startDate,
      endDate,
    });

    expect(rates).toBeDefined();
    expect(typeof rates).toBe("object");
  });

  it("should calculate optimal send times", async () => {
    const { ctx } = createAuthContext(1, "employer");
    const caller = appRouter.createCaller(ctx);

    // Track events at different times
    for (let i = 0; i < 20; i++) {
      await caller.communication.emailAnalytics.trackEvent({
        eventType: "sent",
        recipientEmail: `test${i}@example.com`,
        emailType: "interview_invite",
      });

      if (i % 2 === 0) {
        await caller.communication.emailAnalytics.trackEvent({
          eventType: "opened",
          recipientEmail: `test${i}@example.com`,
          emailType: "interview_invite",
        });
      }
    }

    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = new Date();

    const result = await caller.communication.emailAnalytics.calculateOptimalSendTimes({
      emailType: "interview_invite",
      analysisStartDate: startDate,
      analysisEndDate: endDate,
    });

    expect(result.success).toBe(true);
    expect(result.optimalTime).toBeDefined();
    expect(result.optimalTime.dayOfWeek).toBeGreaterThanOrEqual(0);
    expect(result.optimalTime.dayOfWeek).toBeLessThanOrEqual(6);
    expect(result.optimalTime.hourOfDay).toBeGreaterThanOrEqual(0);
    expect(result.optimalTime.hourOfDay).toBeLessThanOrEqual(23);
  });

  it("should get optimal send times", async () => {
    const { ctx } = createAuthContext(1, "employer");
    const caller = appRouter.createCaller(ctx);

    const times = await caller.communication.emailAnalytics.getOptimalSendTimes({
      emailType: "interview_invite",
    });

    expect(Array.isArray(times)).toBe(true);
  });
});

describe("Communication Router - Broadcast", () => {
  let employerId: number;
  let candidateId: number;

  beforeEach(async () => {
    const { ctx } = createAuthContext(1, "employer");
    employerId = await createTestEmployer(ctx.user!.id);
    candidateId = await createTestCandidate(2);
  });

  it("should create broadcast message", async () => {
    const { ctx } = createAuthContext(1, "employer");
    const caller = appRouter.createCaller(ctx);

    const result = await caller.communication.broadcast.create({
      title: "Test Broadcast",
      messageType: "email",
      messageContent: "This is a test broadcast message",
      emailSubject: "Test Subject",
      targetAudience: "all_candidates",
    });

    expect(result.broadcastId).toBeDefined();
    expect(typeof result.broadcastId).toBe("number");
  });

  it("should get filtered candidates", async () => {
    const { ctx } = createAuthContext(1, "employer");
    const caller = appRouter.createCaller(ctx);

    const result = await caller.communication.broadcast.getFilteredCandidates({
      filterCriteria: {
        experienceMin: 3,
        availability: true,
      },
    });

    expect(result).toBeDefined();
    expect(result.candidates).toBeDefined();
    expect(Array.isArray(result.candidates)).toBe(true);
    expect(result.totalCount).toBeDefined();
  });

  it("should list broadcasts", async () => {
    const { ctx } = createAuthContext(1, "employer");
    const caller = appRouter.createCaller(ctx);

    // Create a broadcast first
    await caller.communication.broadcast.create({
      title: "Test Broadcast",
      messageType: "sms",
      messageContent: "Test message",
      targetAudience: "all_candidates",
    });

    const broadcasts = await caller.communication.broadcast.list({
      limit: 10,
      offset: 0,
    });

    expect(Array.isArray(broadcasts)).toBe(true);
    expect(broadcasts.length).toBeGreaterThan(0);
  });

  it("should send broadcast to candidates", async () => {
    const { ctx } = createAuthContext(1, "employer");
    const caller = appRouter.createCaller(ctx);

    // Create broadcast
    const { broadcastId } = await caller.communication.broadcast.create({
      title: "Test Broadcast",
      messageType: "email",
      messageContent: "Test message",
      emailSubject: "Test",
      targetAudience: "filtered",
      filterCriteria: {
        availability: true,
      },
    });

    // Send broadcast
    const result = await caller.communication.broadcast.send({
      broadcastId,
      candidateIds: [candidateId],
    });

    expect(result.success).toBe(true);
    expect(result.totalRecipients).toBeGreaterThan(0);
  });
});

describe("Communication Router - A/B Testing", () => {
  let employerId: number;

  beforeEach(async () => {
    const { ctx } = createAuthContext(1, "employer");
    employerId = await createTestEmployer(ctx.user!.id);
  });

  it("should create A/B test", async () => {
    const { ctx } = createAuthContext(1, "employer");
    const caller = appRouter.createCaller(ctx);

    const result = await caller.communication.abTesting.create({
      name: "Test A/B Test",
      emailType: "interview_invite",
      variantA: {
        subject: "Join us for an interview",
        bodyHtml: "<p>We would like to invite you for an interview</p>",
        bodyText: "We would like to invite you for an interview",
      },
      variantB: {
        subject: "Interview opportunity at our company",
        bodyHtml: "<p>Exciting interview opportunity awaits you</p>",
        bodyText: "Exciting interview opportunity awaits you",
      },
      sampleSize: 100,
      confidenceLevel: 95,
    });

    expect(result.testId).toBeDefined();
    expect(typeof result.testId).toBe("number");
  });

  it("should list A/B tests", async () => {
    const { ctx } = createAuthContext(1, "employer");
    const caller = appRouter.createCaller(ctx);

    // Create a test first
    await caller.communication.abTesting.create({
      name: "Test A/B Test",
      emailType: "job_match",
      variantA: {
        subject: "Subject A",
        bodyHtml: "<p>Body A</p>",
      },
      variantB: {
        subject: "Subject B",
        bodyHtml: "<p>Body B</p>",
      },
    });

    const tests = await caller.communication.abTesting.list({
      limit: 10,
      offset: 0,
    });

    expect(Array.isArray(tests)).toBe(true);
    expect(tests.length).toBeGreaterThan(0);
  });

  it("should get A/B test details", async () => {
    const { ctx } = createAuthContext(1, "employer");
    const caller = appRouter.createCaller(ctx);

    // Create a test
    const { testId } = await caller.communication.abTesting.create({
      name: "Test A/B Test",
      emailType: "follow_up",
      variantA: {
        subject: "Subject A",
        bodyHtml: "<p>Body A</p>",
      },
      variantB: {
        subject: "Subject B",
        bodyHtml: "<p>Body B</p>",
      },
    });

    const details = await caller.communication.abTesting.getDetails({
      testId,
    });

    expect(details).toBeDefined();
    expect(details.test).toBeDefined();
    expect(details.variants).toBeDefined();
    expect(Array.isArray(details.variants)).toBe(true);
    expect(details.variants.length).toBe(2);
  });

  it("should calculate A/B test results", async () => {
    const { ctx } = createAuthContext(1, "employer");
    const caller = appRouter.createCaller(ctx);

    // Create a test
    const { testId } = await caller.communication.abTesting.create({
      name: "Test A/B Test",
      emailType: "application_update",
      variantA: {
        subject: "Subject A",
        bodyHtml: "<p>Body A</p>",
      },
      variantB: {
        subject: "Subject B",
        bodyHtml: "<p>Body B</p>",
      },
    });

    // Calculate results (even with no data, should work)
    const result = await caller.communication.abTesting.calculateResults({
      testId,
    });

    expect(result.success).toBe(true);
    expect(result.resultId).toBeDefined();
    expect(result.winner).toMatch(/^[AB]$/);
  });
});
