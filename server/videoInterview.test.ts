import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createEmployerContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 2,
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
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("videoInterview", () => {
  it("should create a video interview", async () => {
    const { ctx } = createEmployerContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.videoInterview.create({
      applicationId: 1,
      candidateId: 1,
      employerId: 1,
      jobId: 1,
      scheduledTime: new Date("2025-01-15T10:00:00Z"),
      duration: 30,
      meetingUrl: "https://meet.example.com/interview-123",
      notes: "Technical interview",
    });

    expect(result).toEqual({ success: true });
  });

  it("should list video interviews by application", async () => {
    const { ctx } = createEmployerContext();
    const caller = appRouter.createCaller(ctx);

    // Create an interview first
    await caller.videoInterview.create({
      applicationId: 1,
      candidateId: 1,
      employerId: 1,
      jobId: 1,
    });

    const result = await caller.videoInterview.listByApplication({
      applicationId: 1,
    });

    expect(Array.isArray(result)).toBe(true);
  });

  it("should list video interviews by candidate", async () => {
    const { ctx } = createEmployerContext();
    const caller = appRouter.createCaller(ctx);

    // Create an interview first
    await caller.videoInterview.create({
      applicationId: 1,
      candidateId: 1,
      employerId: 1,
      jobId: 1,
    });

    const result = await caller.videoInterview.listByCandidate({
      candidateId: 1,
    });

    expect(Array.isArray(result)).toBe(true);
  });

  it("should list video interviews by employer", async () => {
    const { ctx } = createEmployerContext();
    const caller = appRouter.createCaller(ctx);

    // Create an interview first
    await caller.videoInterview.create({
      applicationId: 1,
      candidateId: 1,
      employerId: 1,
      jobId: 1,
    });

    const result = await caller.videoInterview.listByEmployer({
      employerId: 1,
    });

    expect(Array.isArray(result)).toBe(true);
  });

  it("should update a video interview", async () => {
    const { ctx } = createEmployerContext();
    const caller = appRouter.createCaller(ctx);

    // Create an interview first
    await caller.videoInterview.create({
      applicationId: 1,
      candidateId: 1,
      employerId: 1,
      jobId: 1,
    });

    // Update it
    const result = await caller.videoInterview.update({
      id: 1,
      scheduledTime: new Date("2025-01-16T14:00:00Z"),
      status: "scheduled",
      meetingUrl: "https://meet.example.com/updated-123",
    });

    expect(result).toEqual({ success: true });
  });
});
