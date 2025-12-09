import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getDb } from "./db";
import { candidates, applications, jobs, employers, users } from "../drizzle/schema";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: "test-candidate",
    email: "candidate@test.com",
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
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return ctx;
}

describe("Bulk Application Actions", () => {
  it("should withdraw multiple applications", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create test data
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create employer
    const [employer] = await db.insert(employers).values({
      userId: 1,
      companyName: "Test Company",
    });

    // Create jobs
    const [job1] = await db.insert(jobs).values({
      employerId: employer.insertId,
      title: "Test Job 1",
      status: "active",
    });

    const [job2] = await db.insert(jobs).values({
      employerId: employer.insertId,
      title: "Test Job 2",
      status: "active",
    });

    // Create candidate
    const [candidate] = await db.insert(candidates).values({
      userId: ctx.user.id,
      fullName: "Test Candidate",
      email: "candidate@test.com",
    });

    // Create applications
    const [app1] = await db.insert(applications).values({
      candidateId: candidate.insertId,
      jobId: job1.insertId,
      status: "submitted",
    });

    const [app2] = await db.insert(applications).values({
      candidateId: candidate.insertId,
      jobId: job2.insertId,
      status: "submitted",
    });

    // Test bulk withdraw
    const result = await caller.application.bulkWithdrawApplications({
      applicationIds: [app1.insertId, app2.insertId],
    });

    expect(result.success).toBe(true);
    expect(result.count).toBe(2);

    // Verify applications were withdrawn
    const withdrawnApps = await db
      .select()
      .from(applications)
      .where(sql`id IN (${app1.insertId}, ${app2.insertId})`);

    expect(withdrawnApps.every(app => app.withdrawnAt !== null)).toBe(true);
  });

  it("should toggle favorite status for multiple applications", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create test data (similar to above)
    const [employer] = await db.insert(employers).values({
      userId: 1,
      companyName: "Test Company",
    });

    const [job] = await db.insert(jobs).values({
      employerId: employer.insertId,
      title: "Test Job",
      status: "active",
    });

    const [candidate] = await db.insert(candidates).values({
      userId: ctx.user.id,
      fullName: "Test Candidate",
      email: "candidate@test.com",
    });

    const [app] = await db.insert(applications).values({
      candidateId: candidate.insertId,
      jobId: job.insertId,
      status: "submitted",
      isFavorite: false,
    });

    // Test marking as favorite
    const result = await caller.application.bulkToggleFavoriteApplications({
      applicationIds: [app.insertId],
      isFavorite: true,
    });

    expect(result.success).toBe(true);
    expect(result.count).toBe(1);

    // Verify favorite status
    const [favoriteApp] = await db
      .select()
      .from(applications)
      .where(sql`id = ${app.insertId}`);

    expect(favoriteApp.isFavorite).toBe(true);
  });
});
