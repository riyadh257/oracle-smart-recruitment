import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createCandidateContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-candidate",
    email: "candidate@example.com",
    name: "Test Candidate",
    loginMethod: "manus",
    role: "candidate",
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

describe("savedJobs", () => {
  it("should save a job for a candidate", async () => {
    const { ctx } = createCandidateContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.savedJobs.save({
      candidateId: 1,
      jobId: 1,
      notes: "Interesting opportunity",
    });

    expect(result).toEqual({ success: true });
  });

  it("should unsave a job for a candidate", async () => {
    const { ctx } = createCandidateContext();
    const caller = appRouter.createCaller(ctx);

    // First save a job
    await caller.savedJobs.save({
      candidateId: 1,
      jobId: 1,
    });

    // Then unsave it
    const result = await caller.savedJobs.unsave({
      candidateId: 1,
      jobId: 1,
    });

    expect(result).toEqual({ success: true });
  });

  it("should list saved jobs for a candidate", async () => {
    const { ctx } = createCandidateContext();
    const caller = appRouter.createCaller(ctx);

    // Save a job first
    await caller.savedJobs.save({
      candidateId: 1,
      jobId: 1,
    });

    const result = await caller.savedJobs.list({
      candidateId: 1,
    });

    expect(Array.isArray(result)).toBe(true);
  });

  it("should check if a job is saved", async () => {
    const { ctx } = createCandidateContext();
    const caller = appRouter.createCaller(ctx);

    // Save a job first
    await caller.savedJobs.save({
      candidateId: 1,
      jobId: 1,
    });

    const result = await caller.savedJobs.isSaved({
      candidateId: 1,
      jobId: 1,
    });

    expect(typeof result).toBe("boolean");
  });
});
