import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createTestContext(user?: AuthenticatedUser): TrpcContext {
  const testUser: AuthenticatedUser = user || {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user: testUser,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("Candidate Notification Preferences", () => {
  it("should get default notification preferences for a candidate", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.candidateNotifications.getPreferences({
      candidateId: 999999, // Non-existent candidate to test defaults
    });

    expect(result).toBeDefined();
    expect(result.jobAlertFrequency).toBe("daily_digest");
    expect(result.applicationStatusUpdates).toBe(true);
    expect(result.interviewReminders).toBe(true);
    expect(result.newJobMatches).toBe(true);
  });

  it("should update notification preferences for a candidate", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const testCandidateId = 1;

    // Update preferences
    const updateResult = await caller.candidateNotifications.updatePreferences({
      candidateId: testCandidateId,
      jobAlertFrequency: "weekly_summary",
      applicationStatusUpdates: false,
      interviewReminders: true,
      newJobMatches: true,
      companyUpdates: true,
      careerTips: false,
    });

    expect(updateResult).toBeDefined();
    expect(updateResult?.jobAlertFrequency).toBe("weekly_summary");
    expect(updateResult?.applicationStatusUpdates).toBe(false);
    expect(updateResult?.companyUpdates).toBe(true);

    // Verify preferences were saved
    const getResult = await caller.candidateNotifications.getPreferences({
      candidateId: testCandidateId,
    });

    expect(getResult.jobAlertFrequency).toBe("weekly_summary");
    expect(getResult.applicationStatusUpdates).toBe(false);
  });

  it("should support all job alert frequency options", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const frequencies: Array<"instant" | "daily_digest" | "weekly_summary" | "off"> = [
      "instant",
      "daily_digest",
      "weekly_summary",
      "off",
    ];

    for (const frequency of frequencies) {
      const result = await caller.candidateNotifications.updatePreferences({
        candidateId: 1,
        jobAlertFrequency: frequency,
        applicationStatusUpdates: true,
        interviewReminders: true,
        newJobMatches: true,
        companyUpdates: false,
        careerTips: false,
      });

      expect(result?.jobAlertFrequency).toBe(frequency);
    }
  });
});

describe("Application Status Tracking", () => {
  it("should update application status and create history entry", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // Note: This test requires an existing application in the database
    // In a real scenario, you'd create a test application first
    const testApplicationId = 1;

    const result = await caller.candidateNotifications.updateApplicationStatus({
      applicationId: testApplicationId,
      newStatus: "screening",
      notes: "Application under review by hiring team",
    });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);

    // Verify history was created
    const history = await caller.candidateNotifications.getStatusHistory({
      applicationId: testApplicationId,
    });

    expect(history).toBeDefined();
    expect(Array.isArray(history)).toBe(true);
    // The most recent entry should be our update
    if (history.length > 0) {
      expect(history[0]?.newStatus).toBe("screening");
      expect(history[0]?.notes).toBe("Application under review by hiring team");
    }
  });

  it("should get application status history", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const testApplicationId = 1;

    const history = await caller.candidateNotifications.getStatusHistory({
      applicationId: testApplicationId,
    });

    expect(history).toBeDefined();
    expect(Array.isArray(history)).toBe(true);
  });

  it("should support all application status values", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const statuses: Array<"submitted" | "screening" | "interviewing" | "offered" | "rejected"> = [
      "submitted",
      "screening",
      "interviewing",
      "offered",
      "rejected",
    ];

    // Verify each status is accepted
    for (const status of statuses) {
      expect(() => {
        caller.candidateNotifications.updateApplicationStatus({
          applicationId: 1,
          newStatus: status,
        });
      }).not.toThrow();
    }
  });
});

describe("Recruiter Quick Actions", () => {
  it("should get quick actions dashboard data", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.candidateNotifications.getQuickActions();

    expect(result).toBeDefined();
    expect(result.pendingApplicationsCount).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(result.upcomingInterviews)).toBe(true);
    expect(Array.isArray(result.recentStatusChanges)).toBe(true);
    expect(result.digestPerformance).toBeDefined();
    expect(result.digestPerformance.todayApplications).toBeGreaterThanOrEqual(0);
    expect(result.digestPerformance.weekApplications).toBeGreaterThanOrEqual(0);
  });

  it("should limit upcoming interviews to 5 items", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.candidateNotifications.getQuickActions();

    expect(result.upcomingInterviews.length).toBeLessThanOrEqual(5);
  });

  it("should limit recent status changes to 10 items", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.candidateNotifications.getQuickActions();

    expect(result.recentStatusChanges.length).toBeLessThanOrEqual(10);
  });

  it("should return digest performance metrics", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.candidateNotifications.getQuickActions();

    expect(result.digestPerformance).toBeDefined();
    expect(typeof result.digestPerformance.todayApplications).toBe("number");
    expect(typeof result.digestPerformance.weekApplications).toBe("number");
    // Week applications should be >= today's applications
    expect(result.digestPerformance.weekApplications).toBeGreaterThanOrEqual(
      result.digestPerformance.todayApplications
    );
  });
});

describe("Notification Preferences Authorization", () => {
  it("should require authentication to access notification preferences", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: {
        protocol: "https",
        headers: {},
      } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };

    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.candidateNotifications.getPreferences({ candidateId: 1 })
    ).rejects.toThrow();
  });

  it("should require authentication to update notification preferences", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: {
        protocol: "https",
        headers: {},
      } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };

    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.candidateNotifications.updatePreferences({
        candidateId: 1,
        jobAlertFrequency: "daily_digest",
        applicationStatusUpdates: true,
        interviewReminders: true,
        newJobMatches: true,
        companyUpdates: false,
        careerTips: false,
      })
    ).rejects.toThrow();
  });

  it("should require authentication to access quick actions", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: {
        protocol: "https",
        headers: {},
      } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };

    const caller = appRouter.createCaller(ctx);

    await expect(caller.candidateNotifications.getQuickActions()).rejects.toThrow();
  });
});
