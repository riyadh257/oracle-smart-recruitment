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
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
      ip: "127.0.0.1",
      get: (header: string) => "test-user-agent",
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("importHistory router", () => {
  it("should create an import record", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.importHistory.create({
      importType: "candidates",
      fileName: "test-import.csv",
      fileSize: 1024,
      recordsTotal: 100,
    });

    expect(result).toBeDefined();
    expect(result.importType).toBe("candidates");
    expect(result.fileName).toBe("test-import.csv");
    expect(result.status).toBe("pending");
    expect(result.userId).toBe(1);
  });

  it("should update import record with progress", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create import first
    const created = await caller.importHistory.create({
      importType: "employees",
      recordsTotal: 50,
    });

    // Update with progress
    const updated = await caller.importHistory.update({
      id: created.id,
      recordsSuccess: 45,
      recordsError: 5,
      status: "completed",
    });

    expect(updated.recordsSuccess).toBe(45);
    expect(updated.recordsError).toBe(5);
    expect(updated.status).toBe("completed");
    expect(updated.completedAt).toBeDefined();
  });

  it("should list import history with filters", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create test imports
    await caller.importHistory.create({
      importType: "candidates",
      recordsTotal: 100,
    });

    await caller.importHistory.create({
      importType: "jobs",
      recordsTotal: 50,
    });

    // List all
    const allImports = await caller.importHistory.list({});
    expect(allImports.length).toBeGreaterThanOrEqual(2);

    // Filter by type
    const candidateImports = await caller.importHistory.list({
      importType: "candidates",
    });
    expect(candidateImports.every((imp) => imp.importType === "candidates")).toBe(true);
  });

  it("should get import statistics", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const stats = await caller.importHistory.statistics();

    expect(stats).toBeDefined();
    // SQL aggregations may return strings or numbers depending on driver
    expect(stats.totalImports).toBeDefined();
    expect(stats.completedImports).toBeDefined();
    expect(stats.failedImports).toBeDefined();
    expect(Number(stats.totalImports)).toBeGreaterThanOrEqual(0);
  });

  it("should rollback a completed import", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create and complete an import
    const created = await caller.importHistory.create({
      importType: "compliance_data",
      recordsTotal: 20,
    });

    await caller.importHistory.update({
      id: created.id,
      status: "completed",
      recordsSuccess: 20,
    });

    // Rollback
    const rolledBack = await caller.importHistory.rollback({
      id: created.id,
      reason: "Data quality issues",
    });

    expect(rolledBack.status).toBe("rolled_back");
    expect(rolledBack.rolledBackBy).toBe(1);
    expect(rolledBack.rolledBackAt).toBeDefined();
  });

  it("should not rollback already rolled back import", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create, complete, and rollback
    const created = await caller.importHistory.create({
      importType: "feedback",
      recordsTotal: 10,
    });

    await caller.importHistory.update({
      id: created.id,
      status: "completed",
    });

    await caller.importHistory.rollback({
      id: created.id,
    });

    // Try to rollback again
    await expect(
      caller.importHistory.rollback({
        id: created.id,
      })
    ).rejects.toThrow("already been rolled back");
  });
});
