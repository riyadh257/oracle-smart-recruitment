import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { auditDataChange } from "./auditLog";
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
      ip: "192.168.1.100",
      get: (header: string) => "Mozilla/5.0 Test Browser",
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("auditLog router", () => {
  it("should create audit log entries", async () => {
    const log = await auditDataChange({
      userId: 1,
      entityType: "employee",
      entityId: 123,
      action: "create",
      valueAfter: { name: "John Doe", role: "Developer" },
      ipAddress: "192.168.1.100",
      userAgent: "Test Browser",
    });

    expect(log).toBeDefined();
    expect(log.userId).toBe(1);
    expect(log.entityType).toBe("employee");
    expect(log.action).toBe("create");
  });

  it("should list audit logs with filters", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create test audit entries
    await auditDataChange({
      userId: 1,
      entityType: "employee",
      entityId: 1,
      action: "create",
      valueAfter: { name: "Test Employee" },
    });

    await auditDataChange({
      userId: 1,
      entityType: "visa_compliance",
      entityId: 2,
      action: "update",
      valueBefore: { status: "pending" },
      valueAfter: { status: "approved" },
    });

    // List all logs
    const allLogs = await caller.auditLog.list({});
    expect(allLogs.length).toBeGreaterThanOrEqual(2);

    // Filter by entity type
    const employeeLogs = await caller.auditLog.list({
      entityType: "employee",
    });
    expect(employeeLogs.every((log) => log.entityType === "employee")).toBe(true);

    // Filter by action
    const createLogs = await caller.auditLog.list({
      action: "create",
    });
    expect(createLogs.every((log) => log.action === "create")).toBe(true);
  });

  it("should get entity history", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const entityId = 999;

    // Create multiple audit entries for same entity
    await auditDataChange({
      userId: 1,
      entityType: "nitaqat_status",
      entityId,
      action: "create",
      valueAfter: { band: "yellow" },
    });

    await auditDataChange({
      userId: 1,
      entityType: "nitaqat_status",
      entityId,
      action: "update",
      valueBefore: { band: "yellow" },
      valueAfter: { band: "green" },
    });

    // Get entity history
    const history = await caller.auditLog.entityHistory({
      entityType: "nitaqat_status",
      entityId,
    });

    expect(history.length).toBeGreaterThanOrEqual(2);
    expect(history.every((log) => log.entityId === entityId)).toBe(true);
  });

  it("should export audit logs to CSV", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create test audit entries
    await auditDataChange({
      userId: 1,
      entityType: "work_permit",
      entityId: 1,
      action: "approve",
      valueAfter: { approved: true },
    });

    // Export to CSV
    const result = await caller.auditLog.exportCSV({});

    expect(result).toBeDefined();
    expect(result.csv).toContain("ID,Timestamp,User ID");
    expect(result.filename).toContain("audit_log_");
    expect(result.filename).toContain(".csv");
    expect(result.recordCount).toBeGreaterThan(0);
  });

  it("should get audit statistics", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create diverse audit entries
    await auditDataChange({
      userId: 1,
      entityType: "employee",
      entityId: 1,
      action: "create",
    });

    await auditDataChange({
      userId: 1,
      entityType: "employee",
      entityId: 1,
      action: "update",
    });

    await auditDataChange({
      userId: 1,
      entityType: "visa_compliance",
      entityId: 2,
      action: "delete",
    });

    const stats = await caller.auditLog.statistics({});

    expect(stats).toBeDefined();
    expect(stats.totalEntries).toBeGreaterThan(0);
    expect(typeof stats.byEntityType).toBe("object");
    expect(typeof stats.byAction).toBe("object");
    expect(typeof stats.byUser).toBe("object");
  });

  it("should track before and after values", async () => {
    const before = { status: "pending", approved: false };
    const after = { status: "approved", approved: true };

    const log = await auditDataChange({
      userId: 1,
      entityType: "compliance_alert",
      entityId: 5,
      action: "update",
      fieldChanged: "status",
      valueBefore: before,
      valueAfter: after,
    });

    expect(log.valueBefore).toBeDefined();
    expect(log.valueAfter).toBeDefined();

    // Values should be JSON strings
    const parsedBefore = JSON.parse(log.valueBefore!);
    const parsedAfter = JSON.parse(log.valueAfter!);

    expect(parsedBefore.status).toBe("pending");
    expect(parsedAfter.status).toBe("approved");
  });

  it("should record IP address and user agent", async () => {
    const log = await auditDataChange({
      userId: 1,
      entityType: "labor_law_config",
      entityId: 1,
      action: "update",
      ipAddress: "10.0.0.1",
      userAgent: "Mozilla/5.0 (Test)",
    });

    expect(log.ipAddress).toBe("10.0.0.1");
    expect(log.userAgent).toBe("Mozilla/5.0 (Test)");
  });

  it("should support change reason field", async () => {
    const log = await auditDataChange({
      userId: 1,
      entityType: "scheduled_report",
      entityId: 10,
      action: "delete",
      changeReason: "Report no longer needed after process change",
    });

    expect(log.changeReason).toBe("Report no longer needed after process change");
  });
});
