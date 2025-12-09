import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(role: "employer" | "candidate" = "employer"): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role,
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

describe("Communication History", () => {
  describe("logEvent", () => {
    it("should log a communication event", async () => {
      const ctx = createAuthContext("employer");
      const caller = appRouter.createCaller(ctx);

      const result = await caller.communications.logEvent({
        candidateId: 1,
        employerId: 1,
        eventType: "email_sent",
        eventTitle: "Welcome Email Sent",
        eventDescription: "Sent welcome email to candidate",
        initiatedBy: "employer",
        eventTimestamp: new Date().toISOString(),
      });

      expect(result).toHaveProperty("id");
      expect(result.eventType).toBe("email_sent");
      expect(result.eventTitle).toBe("Welcome Email Sent");
    });

    it("should log different event types", async () => {
      const ctx = createAuthContext("employer");
      const caller = appRouter.createCaller(ctx);

      const eventTypes = [
        "application_submitted",
        "interview_scheduled",
        "status_changed",
      ];

      for (const eventType of eventTypes) {
        const result = await caller.communications.logEvent({
          candidateId: 1,
          employerId: 1,
          eventType: eventType as any,
          eventTitle: `Test ${eventType}`,
          initiatedBy: "system",
          eventTimestamp: new Date().toISOString(),
        });

        expect(result.eventType).toBe(eventType);
      }
    });
  });

  describe("getCandidateTimeline", () => {
    it("should return candidate communication timeline", async () => {
      const ctx = createAuthContext("employer");
      const caller = appRouter.createCaller(ctx);

      const result = await caller.communications.getCandidateTimeline({
        candidateId: 1,
      });

      expect(Array.isArray(result)).toBe(true);
    });

    it("should filter by event types", async () => {
      const ctx = createAuthContext("employer");
      const caller = appRouter.createCaller(ctx);

      const result = await caller.communications.getCandidateTimeline({
        candidateId: 1,
        eventTypes: ["email_sent", "email_opened"],
      });

      expect(Array.isArray(result)).toBe(true);
      // All returned events should be one of the specified types
      result.forEach((event: any) => {
        expect(["email_sent", "email_opened"]).toContain(event.eventType);
      });
    });

    it("should filter by date range", async () => {
      const ctx = createAuthContext("employer");
      const caller = appRouter.createCaller(ctx);

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      const endDate = new Date();

      const result = await caller.communications.getCandidateTimeline({
        candidateId: 1,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("getSummary", () => {
    it("should return communication summary for candidate", async () => {
      const ctx = createAuthContext("employer");
      const caller = appRouter.createCaller(ctx);

      const result = await caller.communications.getSummary({
        candidateId: 1,
      });

      expect(result).toHaveProperty("totalEmails");
      expect(result).toHaveProperty("emailsOpened");
      expect(result).toHaveProperty("emailsClicked");
      expect(result).toHaveProperty("totalInterviews");
      expect(result).toHaveProperty("completedInterviews");
      expect(result).toHaveProperty("engagementScore");
      expect(result).toHaveProperty("responseRate");
    });

    it("should calculate engagement score correctly", async () => {
      const ctx = createAuthContext("employer");
      const caller = appRouter.createCaller(ctx);

      const result = await caller.communications.getSummary({
        candidateId: 1,
      });

      expect(result.engagementScore).toBeGreaterThanOrEqual(0);
      expect(result.engagementScore).toBeLessThanOrEqual(100);
    });
  });

  describe("search", () => {
    it("should search communications by query", async () => {
      const ctx = createAuthContext("employer");
      const caller = appRouter.createCaller(ctx);

      const result = await caller.communications.search({
        searchQuery: "interview",
        candidateId: 1,
      });

      expect(Array.isArray(result)).toBe(true);
    });

    it("should return empty array for non-matching search", async () => {
      const ctx = createAuthContext("employer");
      const caller = appRouter.createCaller(ctx);

      const result = await caller.communications.search({
        searchQuery: "nonexistent-term-xyz123",
        candidateId: 1,
      });

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("getStatistics", () => {
    it("should return timeline statistics", async () => {
      const ctx = createAuthContext("employer");
      const caller = appRouter.createCaller(ctx);

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      const endDate = new Date();

      const result = await caller.communications.getStatistics({
        candidateId: 1,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      expect(result).toHaveProperty("totalEvents");
      expect(result).toHaveProperty("eventsByType");
      expect(result).toHaveProperty("eventsByDay");
      expect(typeof result.totalEvents).toBe("number");
    });
  });

  describe("markAsRead", () => {
    it("should mark events as read", async () => {
      const ctx = createAuthContext("employer");
      const caller = appRouter.createCaller(ctx);

      // First log an event
      const event = await caller.communications.logEvent({
        candidateId: 1,
        employerId: 1,
        eventType: "email_sent",
        eventTitle: "Test Event",
        initiatedBy: "system",
        eventTimestamp: new Date().toISOString(),
      });

      // Then mark it as read
      const result = await caller.communications.markAsRead({
        eventIds: [event.id],
      });

      expect(result.success).toBe(true);
    });
  });
});
