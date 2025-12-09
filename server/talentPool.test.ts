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

describe("talentPool", () => {
  it("should add a candidate to talent pool", async () => {
    const { ctx } = createEmployerContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.talentPool.add({
      employerId: 1,
      candidateId: 1,
      tags: ["frontend", "react"],
      notes: "Strong candidate for future roles",
      matchScore: 85,
    });

    expect(result).toEqual({ success: true });
  });

  it("should remove a candidate from talent pool", async () => {
    const { ctx } = createEmployerContext();
    const caller = appRouter.createCaller(ctx);

    // First add a candidate
    await caller.talentPool.add({
      employerId: 1,
      candidateId: 1,
    });

    // Then remove them
    const result = await caller.talentPool.remove({
      employerId: 1,
      candidateId: 1,
    });

    expect(result).toEqual({ success: true });
  });

  it("should list talent pool entries for an employer", async () => {
    const { ctx } = createEmployerContext();
    const caller = appRouter.createCaller(ctx);

    // Add a candidate first
    await caller.talentPool.add({
      employerId: 1,
      candidateId: 1,
    });

    const result = await caller.talentPool.list({
      employerId: 1,
    });

    expect(Array.isArray(result)).toBe(true);
  });

  it("should update talent pool entry", async () => {
    const { ctx } = createEmployerContext();
    const caller = appRouter.createCaller(ctx);

    // Add a candidate first
    await caller.talentPool.add({
      employerId: 1,
      candidateId: 1,
    });

    // Update the entry
    const result = await caller.talentPool.update({
      employerId: 1,
      candidateId: 1,
      tags: ["senior", "full-stack"],
      notes: "Updated notes",
      status: "contacted",
    });

    expect(result).toEqual({ success: true });
  });

  it("should check if a candidate is in talent pool", async () => {
    const { ctx } = createEmployerContext();
    const caller = appRouter.createCaller(ctx);

    // Add a candidate first
    await caller.talentPool.add({
      employerId: 1,
      candidateId: 1,
    });

    const result = await caller.talentPool.isInPool({
      employerId: 1,
      candidateId: 1,
    });

    expect(typeof result).toBe("boolean");
  });
});
