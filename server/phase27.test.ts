import { describe, expect, it, beforeEach } from "vitest";
import { phase27Router } from "./routers/phase27";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createTestContext(): TrpcContext {
  const user: AuthenticatedUser = {
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
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("phase27Router - Match Notification Preferences", () => {
  it("should create global notification preferences", async () => {
    const ctx = createTestContext();
    const caller = phase27Router.createCaller(ctx);

    const result = await caller.notificationPreferences.upsert({
      minMatchScore: 75,
      highScoreThreshold: 85,
      exceptionalScoreThreshold: 92,
      notifyViaEmail: true,
      notifyViaPush: true,
      notifyViaSms: false,
      instantNotifications: true,
      digestMode: false,
      digestFrequency: 'daily',
      notifyOnlyNewCandidates: false,
      notifyOnScoreImprovement: true,
      minScoreImprovement: 5,
      quietHoursEnabled: false,
      quietHoursStart: '22:00',
      quietHoursEnd: '08:00',
      timezone: 'Asia/Riyadh',
    });

    expect(result).toBeDefined();
    expect(result?.minMatchScore).toBe(75);
    expect(result?.highScoreThreshold).toBe(85);
    expect(result?.exceptionalScoreThreshold).toBe(92);
  });

  it("should create job-specific notification preferences", async () => {
    const ctx = createTestContext();
    const caller = phase27Router.createCaller(ctx);

    const result = await caller.notificationPreferences.upsert({
      jobId: 1,
      minMatchScore: 80,
      highScoreThreshold: 90,
      exceptionalScoreThreshold: 95,
      notifyViaEmail: true,
      notifyViaPush: false,
      notifyViaSms: false,
      instantNotifications: true,
      digestMode: false,
      digestFrequency: 'daily',
      notifyOnlyNewCandidates: true,
      notifyOnScoreImprovement: false,
      minScoreImprovement: 10,
      quietHoursEnabled: true,
      quietHoursStart: '23:00',
      quietHoursEnd: '07:00',
      timezone: 'Asia/Dubai',
    });

    expect(result).toBeDefined();
    expect(result?.jobId).toBe(1);
    expect(result?.minMatchScore).toBe(80);
    expect(result?.notifyOnlyNewCandidates).toBe(1);
  });

  it("should retrieve all preferences for a user", async () => {
    const ctx = createTestContext();
    const caller = phase27Router.createCaller(ctx);

    // Create multiple preferences
    await caller.notificationPreferences.upsert({
      minMatchScore: 70,
      highScoreThreshold: 85,
      exceptionalScoreThreshold: 90,
      notifyViaEmail: true,
      notifyViaPush: true,
      notifyViaSms: false,
      instantNotifications: true,
      digestMode: false,
      digestFrequency: 'daily',
      notifyOnlyNewCandidates: false,
      notifyOnScoreImprovement: true,
      minScoreImprovement: 5,
      quietHoursEnabled: false,
      quietHoursStart: '22:00',
      quietHoursEnd: '08:00',
      timezone: 'Asia/Riyadh',
    });

    const result = await caller.notificationPreferences.getAll();

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });
});

describe("phase27Router - Match Timeline", () => {
  it("should create a match timeline event", async () => {
    const ctx = createTestContext();
    const caller = phase27Router.createCaller(ctx);

    const result = await caller.timeline.create({
      candidateId: 1,
      jobId: 1,
      eventType: 'match_viewed',
      eventDescription: 'Recruiter viewed match details',
      matchScore: 85,
    });

    expect(result).toBeDefined();
    expect(result.candidateId).toBe(1);
    expect(result.jobId).toBe(1);
    expect(result.eventType).toBe('match_viewed');
    expect(result.matchScore).toBe(85);
  });

  it("should retrieve match timeline for a specific candidate-job pair", async () => {
    const ctx = createTestContext();
    const caller = phase27Router.createCaller(ctx);

    // Create a timeline event first
    await caller.timeline.create({
      candidateId: 2,
      jobId: 2,
      eventType: 'match_created',
      eventDescription: 'New match created by AI',
      matchScore: 92,
    });

    const result = await caller.timeline.getMatch({
      candidateId: 2,
      jobId: 2,
    });

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]?.candidateId).toBe(2);
    expect(result[0]?.jobId).toBe(2);
  });

  it("should retrieve all timeline events for a candidate", async () => {
    const ctx = createTestContext();
    const caller = phase27Router.createCaller(ctx);

    // Create multiple events for same candidate
    await caller.timeline.create({
      candidateId: 3,
      jobId: 1,
      eventType: 'match_viewed',
      eventDescription: 'Viewed match',
    });

    await caller.timeline.create({
      candidateId: 3,
      jobId: 2,
      eventType: 'match_compared',
      eventDescription: 'Compared with other candidates',
    });

    const result = await caller.timeline.getCandidate({
      candidateId: 3,
    });

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThanOrEqual(2);
    expect(result.every(event => event.candidateId === 3)).toBe(true);
  });
});

describe("phase27Router - Bulk Comparison Actions", () => {
  it("should execute bulk schedule interviews", async () => {
    const ctx = createTestContext();
    const caller = phase27Router.createCaller(ctx);

    const scheduledDateTime = new Date(Date.now() + 86400000).toISOString(); // Tomorrow

    const result = await caller.bulkActions.scheduleInterviews({
      candidateIds: [1, 2, 3],
      jobId: 1,
      scheduledDateTime,
      templateId: 1,
    });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.bulkActionId).toBeDefined();
    expect(result.results).toBeDefined();
    expect(result.results.successful).toBeGreaterThanOrEqual(0);
  });

  it("should execute bulk send messages", async () => {
    const ctx = createTestContext();
    const caller = phase27Router.createCaller(ctx);

    const result = await caller.bulkActions.sendMessages({
      candidateIds: [1, 2],
      jobId: 1,
      messageContent: "Thank you for your application. We will review it shortly.",
    });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.bulkActionId).toBeDefined();
    expect(result.results).toBeDefined();
    expect(result.results.successful).toBeGreaterThanOrEqual(0);
  });

  it("should execute bulk change status", async () => {
    const ctx = createTestContext();
    const caller = phase27Router.createCaller(ctx);

    const result = await caller.bulkActions.changeStatus({
      candidateIds: [1, 2, 3],
      jobId: 1,
      newStatus: "under_review",
    });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.bulkActionId).toBeDefined();
    expect(result.results).toBeDefined();
  });

  it("should retrieve user bulk actions", async () => {
    const ctx = createTestContext();
    const caller = phase27Router.createCaller(ctx);

    // Create a bulk action first
    await caller.bulkActions.sendMessages({
      candidateIds: [1],
      jobId: 1,
      messageContent: "Test message",
    });

    const result = await caller.bulkActions.getUserActions({
      limit: 10,
    });

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it("should retrieve job-specific bulk actions", async () => {
    const ctx = createTestContext();
    const caller = phase27Router.createCaller(ctx);

    // Create a bulk action for specific job
    await caller.bulkActions.scheduleInterviews({
      candidateIds: [1, 2],
      jobId: 5,
      scheduledDateTime: new Date(Date.now() + 86400000).toISOString(),
    });

    const result = await caller.bulkActions.getJobActions({
      jobId: 5,
      limit: 10,
    });

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("phase27Router - Integration Tests", () => {
  it("should create notification preferences and timeline events together", async () => {
    const ctx = createTestContext();
    const caller = phase27Router.createCaller(ctx);

    // Create preferences
    const prefs = await caller.notificationPreferences.upsert({
      jobId: 10,
      minMatchScore: 80,
      highScoreThreshold: 90,
      exceptionalScoreThreshold: 95,
      notifyViaEmail: true,
      notifyViaPush: true,
      notifyViaSms: false,
      instantNotifications: true,
      digestMode: false,
      digestFrequency: 'daily',
      notifyOnlyNewCandidates: false,
      notifyOnScoreImprovement: true,
      minScoreImprovement: 5,
      quietHoursEnabled: false,
      quietHoursStart: '22:00',
      quietHoursEnd: '08:00',
      timezone: 'Asia/Riyadh',
    });

    // Create timeline event
    const timeline = await caller.timeline.create({
      candidateId: 10,
      jobId: 10,
      eventType: 'match_created',
      eventDescription: 'Match created with custom notification preferences',
      matchScore: 88,
    });

    expect(prefs).toBeDefined();
    expect(timeline).toBeDefined();
    expect(prefs?.jobId).toBe(10);
    expect(timeline.jobId).toBe(10);
  });

  it("should handle bulk actions and create timeline events", async () => {
    const ctx = createTestContext();
    const caller = phase27Router.createCaller(ctx);

    // Execute bulk action
    const bulkResult = await caller.bulkActions.scheduleInterviews({
      candidateIds: [20, 21],
      jobId: 20,
      scheduledDateTime: new Date(Date.now() + 86400000).toISOString(),
    });

    // Verify timeline events were created
    const timeline1 = await caller.timeline.getMatch({
      candidateId: 20,
      jobId: 20,
    });

    const timeline2 = await caller.timeline.getMatch({
      candidateId: 21,
      jobId: 20,
    });

    expect(bulkResult.success).toBe(true);
    expect(timeline1.length).toBeGreaterThan(0);
    expect(timeline2.length).toBeGreaterThan(0);
    
    // Check that interview_scheduled events exist
    const hasScheduledEvent1 = timeline1.some(e => e.eventType === 'interview_scheduled');
    const hasScheduledEvent2 = timeline2.some(e => e.eventType === 'interview_scheduled');
    
    expect(hasScheduledEvent1).toBe(true);
    expect(hasScheduledEvent2).toBe(true);
  });
});
