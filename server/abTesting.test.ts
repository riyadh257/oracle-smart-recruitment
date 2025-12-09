import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createEmployerContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-employer",
    email: "employer@example.com",
    name: "Test Employer",
    loginMethod: "manus",
    role: "employer",
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

describe("abTesting procedures", () => {
  it("should create an A/B test with two variants", async () => {
    const { ctx } = createEmployerContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.abTesting.createTest({
      name: "Interview Invite Subject Test",
      emailType: "interview_invite",
      trafficSplit: 50,
      variantA: {
        subject: "Interview Invitation - Join Our Team",
        bodyHtml: "<p>We'd like to invite you for an interview</p>",
        bodyText: "We'd like to invite you for an interview",
      },
      variantB: {
        subject: "Let's Chat About Your Future",
        bodyHtml: "<p>We're excited to discuss opportunities with you</p>",
        bodyText: "We're excited to discuss opportunities with you",
      },
    });

    expect(result).toHaveProperty("testId");
    expect(typeof result.testId).toBe("number");
  });

  it("should list A/B tests for an employer", async () => {
    const { ctx } = createEmployerContext();
    const caller = appRouter.createCaller(ctx);

    const tests = await caller.abTesting.listTests();

    expect(Array.isArray(tests)).toBe(true);
  });

  it("should start an A/B test", async () => {
    const { ctx } = createEmployerContext();
    const caller = appRouter.createCaller(ctx);

    // First create a test
    const createResult = await caller.abTesting.createTest({
      name: "Test to Start",
      emailType: "application_received",
      trafficSplit: 60,
      variantA: {
        subject: "Application Received - Variant A",
        bodyHtml: "<p>Thank you for applying</p>",
      },
      variantB: {
        subject: "Application Received - Variant B",
        bodyHtml: "<p>We received your application</p>",
      },
    });

    // Then start it
    const startResult = await caller.abTesting.startTest({
      testId: createResult.testId,
    });

    expect(startResult).toEqual({ success: true });
  });

  it("should stop an A/B test", async () => {
    const { ctx } = createEmployerContext();
    const caller = appRouter.createCaller(ctx);

    // Create and start a test
    const createResult = await caller.abTesting.createTest({
      name: "Test to Stop",
      emailType: "job_match",
      trafficSplit: 50,
      variantA: {
        subject: "New Job Match",
        bodyHtml: "<p>We found a job for you</p>",
      },
      variantB: {
        subject: "Perfect Job Opportunity",
        bodyHtml: "<p>Check out this opportunity</p>",
      },
    });

    await caller.abTesting.startTest({ testId: createResult.testId });

    // Then stop it
    const stopResult = await caller.abTesting.stopTest({
      testId: createResult.testId,
    });

    expect(stopResult).toEqual({ success: true });
  });

  it("should get test details with variants", async () => {
    const { ctx } = createEmployerContext();
    const caller = appRouter.createCaller(ctx);

    // Create a test
    const createResult = await caller.abTesting.createTest({
      name: "Test Details Check",
      emailType: "offer",
      trafficSplit: 70,
      variantA: {
        subject: "Job Offer - Variant A",
        bodyHtml: "<p>Congratulations!</p>",
      },
      variantB: {
        subject: "Job Offer - Variant B",
        bodyHtml: "<p>We're pleased to offer you the position</p>",
      },
    });

    // Get test details
    const testDetails = await caller.abTesting.getTest({
      testId: createResult.testId,
    });

    expect(testDetails).toHaveProperty("test");
    expect(testDetails).toHaveProperty("variants");
    expect(testDetails.test.name).toBe("Test Details Check");
    expect(testDetails.variants).toHaveLength(2);
    expect(testDetails.variants[0].variant).toBe("A");
    expect(testDetails.variants[1].variant).toBe("B");
  });
});
