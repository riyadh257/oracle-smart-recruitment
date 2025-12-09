import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
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
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("savedMatches", () => {
  it("should save a match successfully", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.savedMatches.save({
      candidateId: 1,
      jobId: 1,
      overallScore: 85,
      technicalScore: 80,
      cultureFitScore: 90,
      wellbeingScore: 85,
      matchExplanation: "Excellent match based on skills and culture fit",
      notes: "Follow up next week",
      tags: ["high-priority", "urgent"],
      priority: "high",
    });

    expect(result.success).toBe(true);
    expect(result.id).toBeDefined();
  });

  it("should list saved matches", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const matches = await caller.savedMatches.list();

    expect(Array.isArray(matches)).toBe(true);
  });

  it("should filter saved matches by status", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const matches = await caller.savedMatches.list({
      status: "saved",
    });

    expect(Array.isArray(matches)).toBe(true);
    matches.forEach((match: any) => {
      expect(match.status).toBe("saved");
    });
  });

  it("should check if a match is saved", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.savedMatches.checkSaved({
      candidateId: 1,
      jobId: 1,
    });

    expect(result).toHaveProperty("isSaved");
    expect(typeof result.isSaved).toBe("boolean");
  });
});
